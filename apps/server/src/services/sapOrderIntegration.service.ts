import { env } from '../config/env.js';
import { AppError } from '../types/errors.js';
import { logger } from '../utils/logger.js';
import { quotationService, type Quotation, type QuotationLineItem } from './quotation.service.js';
import {
  salesOrderService,
  type SalesOrderDetails,
  type SalesOrderQuotationLineItem,
} from './salesOrder.service.js';
import { db } from './database.service.js';

type SapOrderType = 'SO' | 'SQ';
type SapReportType = 'SalesOrder' | 'SalesQuote';
type SapSourceType = 'Quotation' | 'SalesOrder';

interface IntegrationUserContext {
  auditUser: string;
  userId: string;
}

interface SubmitOrderHeader {
  CARDCODE: string;
  CARDNAME: string;
  ECOMDOCDATE: string;
  ECOMDOCDUEDATE: string;
  ECOMADDRESS: string;
  DISCPRCNT: string;
  INVOICETYPE: string;
  DISCSUM: string;
  DOCCUR: string;
  DOCRATE: number;
  DOCTOTAL: string;
  COMMENTS: string;
  DOCBRANCH: string;
  U_AUTORELEASE: string;
  U_SOSHIPMTYPE: number;
  LOGUSERID: string;
  USERLOG: string;
  PICKRMRK: string;
  NUMATCARD: string;
  EXP_DELIVERY: string;
  SLPCODE: string;
  COMPANYBI: string;
}

interface SubmitOrderLine {
  LOGUSERID: string;
  USERLOG: string;
  LINENUM: number;
  WHSCODE: string;
  VIN_NUMBER: string;
  VEHICLE_MAKE: string;
  VEHICLE_MODEL: string;
  VEHICLE_VARIANT: string;
  VEHICLE_YEAR: string;
  VEHICLE_COLOR: string;
  QUANTITY: number;
  DISCPRCNT: string;
  LINETOTAL: number;
  VENDORNUM: string;
  PRICEBEFDI: number;
  VATPRCNT: number;
  ECOMREFNUM: string;
  TAXCODE: string;
  ITEMCODE: string;
  ITEMNAME: string;
  UOM: string;
  PRICE: number;
  CURRENCY: string;
  RATE: number;
  U_ASTKNE31: number;
  RequestedPrice: number;
  DESCRIPTION: string;
}

interface SubmitOrderPayload {
  SOH: SubmitOrderHeader;
  SOCH: {
    InStock: SubmitOrderLine[];
    OutOfStock: SubmitOrderLine[];
  };
}

interface SubmitOrderResultItem {
  slno?: string | number;
  type?: string;
  [key: string]: unknown;
}

interface SubmitOrderResponse {
  message?: string;
  result?: SubmitOrderResultItem[];
  [key: string]: unknown;
}

interface SapPostingResult {
  integrationLogId?: number;
  reportUrl?: string;
  referenceNumber: string;
  referenceSource: 'docEntry' | 'stagingSlno';
  submitOrderResponse: unknown;
  queueResponse: unknown;
  stagingSlno: string;
  stagedType: string;
}

interface IntegrationPayloadBuildResult {
  payload: SubmitOrderPayload;
  sourceType: SapSourceType;
  sourceSlno: number;
  sourceNumber: string;
  orderType: SapOrderType;
  reportType: SapReportType;
}

type GenericRecord = Record<string, unknown>;
const FIXED_DMS_QUEUE_USER_ID = '104006';
const FIXED_DMS_QUEUE_OTP = '91620';
const FIXED_DMS_QUEUE_COMPANY = 'KSAISUZU';
const FIXED_DMS_QUEUE_COMPANY_CO = 'BI_NEGT_KSAISUZU';
function resolveQueueOrderSource(): string {
  return 'DMS_QUOTATION';
}

function resolveDmsEndpoint(orderType: SapOrderType): string {
  return env.SO_SQ_API_URL || (orderType === 'SO'
    ? env.DMS_SALES_ORDER_API_URL
    : env.DMS_SALES_QUOTATION_API_URL);
}

const QUOTATION_DB_SCHEMA = (() => {
  const raw = process.env.QUOTATION_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid QUOTATION_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function normalizeText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toIsoDateString(value: unknown): string {
  const normalized = normalizeText(value);
  if (!normalized) return getCurrentDateString();

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return getCurrentDateString();
  }

  return parsed.toISOString().slice(0, 10);
}

function asRecord(value: unknown): GenericRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as GenericRecord;
}

function parseJsonObject(value: unknown): GenericRecord | null {
  if (!value) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value as GenericRecord;

  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    return asRecord(parsed);
  } catch {
    return null;
  }
}

function extractFromKeys(input: unknown, keys: string[]): string {
  const record = asRecord(input);
  if (!record) return '';

  for (const key of keys) {
    const value = record[key];
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function extractSelectedVehicleLines(vinDetails: unknown): GenericRecord[] {
  const parsed = parseJsonObject(vinDetails);
  if (!parsed) return [];

  const lines = parsed.SELECTED_VEHICLE_LINES;
  if (!Array.isArray(lines)) return [];

  return lines
    .map((line) => asRecord(line))
    .filter((line): line is GenericRecord => line !== null);
}

function extractVehicleLineRecord(line: GenericRecord | null | undefined): GenericRecord | null {
  if (!line) return null;
  const nestedVin = asRecord(line.vin);
  return nestedVin || line;
}

function describeQueueResponse(response: unknown): string {
  if (typeof response === 'string') return response;
  if (Array.isArray(response)) return response.map((item) => describeQueueResponse(item)).join(' | ');
  if (response && typeof response === 'object') {
    const record = response as GenericRecord;
    return [
      record.message,
      record.status,
      record.result,
      record.data,
    ]
      .map((value) => (typeof value === 'string' ? value : ''))
      .filter(Boolean)
      .join(' | ');
  }
  return '';
}

function normalizeNumericReference(value: unknown): string {
  const normalized = normalizeText(value);
  if (!/^\d+$/.test(normalized)) return '';
  return Number(normalized) > 0 ? normalized : '';
}

function extractDocEntryCandidate(input: unknown): string {
  if (!input) return '';

  if (typeof input === 'string' || typeof input === 'number') {
    return normalizeNumericReference(input);
  }

  if (Array.isArray(input)) {
    for (const entry of input) {
      const candidate = extractDocEntryCandidate(entry);
      if (candidate) return candidate;
    }
    return '';
  }

  const record = asRecord(input);
  if (!record) return '';

  const directKeys = [
    'DocEntry',
    'DOCENTRY',
    'docEntry',
    'ReferenceNumber',
    'referenceNumber',
    'rEfNo',
    'RefNo',
  ];

  for (const key of directKeys) {
    const candidate = normalizeNumericReference(record[key]);
    if (candidate) return candidate;
  }

  for (const nestedKey of ['data', 'result', 'items', 'value']) {
    const candidate = extractDocEntryCandidate(record[nestedKey]);
    if (candidate) return candidate;
  }

  return '';
}

async function parseHttpResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);
  const payload = await parseHttpResponse(response);

  if (!response.ok) {
    const details = describeQueueResponse(payload) || normalizeText(payload) || response.statusText;
    throw new AppError(details || `HTTP ${response.status} from ${url}`, response.status, 'INTERNAL_SERVER_ERROR');
  }

  return payload;
}

function buildReportUrl(referenceNumber: string, type: SapReportType): string {
  const query = new URLSearchParams({
    rEfNo: referenceNumber,
    frmDate: env.SO_SQ_FROM_DATE,
    toDate: getCurrentDateString(),
    Type: type,
  });

  return `${trimTrailingSlash(env.SO_SQ_REPORT_URL)}?${query.toString()}`;
}

function buildUserContext(user: {
  userId?: string;
  email?: string;
  name?: string;
  SlpCode?: string;
}): IntegrationUserContext {
  const tokenUserId = normalizeText(user.userId);
  const emailUserId = normalizeText(user.email).split('@')[0] || '';
  const normalizedNameId = normalizeText(user.name).replace(/^User\s+/i, '');
  const userId =
    FIXED_DMS_QUEUE_USER_ID ||
    tokenUserId ||
    emailUserId ||
    normalizedNameId ||
    normalizeText(user.SlpCode) ||
    'SYSTEM';

  return {
    auditUser: normalizeText(user.name) || userId,
    userId,
  };
}

class SapOrderIntegrationService {
  private async getEnquiryById(enquiryId: number): Promise<GenericRecord | null> {
    if (!Number.isFinite(enquiryId) || enquiryId <= 0) return null;

    const enquiry = await db.queryOne<GenericRecord>(
      `SELECT *
       FROM "${QUOTATION_DB_SCHEMA}"."DMS_SALESENQUIRY"
       WHERE "SLNO" = ?`,
      [enquiryId]
    );

    if (!enquiry) return null;

    return {
      ...enquiry,
      VINDETAILS: parseJsonObject(enquiry.VINDETAILS),
    };
  }

  private async getSelectedFinancingScheme(enquiryId: number): Promise<GenericRecord | null> {
    if (!Number.isFinite(enquiryId) || enquiryId <= 0) return null;

    return await db.queryOne<GenericRecord>(
      `SELECT *
       FROM "${QUOTATION_DB_SCHEMA}"."DMS_ENQUIRY_FINANCING"
       WHERE "ENQUIRY_SLNO" = ?
         AND COALESCE("IS_DELETED", 'N') = 'N'
         AND COALESCE("IS_SELECTED", 'N') = 'Y'
       ORDER BY "CREATED_DATE" DESC, "SLNO" DESC`,
      [enquiryId]
    );
  }

  private resolveCurrency(enquiry: GenericRecord | null, financing: GenericRecord | null): string {
    const selectedVehicleLines = extractSelectedVehicleLines(enquiry?.VINDETAILS);
    const firstVehicle = extractVehicleLineRecord(selectedVehicleLines[0]);

    return (
      normalizeText(financing?.CURRENCY) ||
      extractFromKeys(firstVehicle, ['Currency', 'CURRENCY', 'currency']) ||
      extractFromKeys(enquiry?.VINDETAILS, ['Currency', 'CURRENCY', 'currency']) ||
      'SAR'
    );
  }

  private resolveWarehouseCode(line: GenericRecord | null, enquiry: GenericRecord | null): string {
    return (
      extractFromKeys(line, ['WhsCode', 'WHSCODE', 'whsCode']) ||
      extractFromKeys(enquiry?.VINDETAILS, ['WhsCode', 'WHSCODE', 'whsCode']) ||
      ''
    );
  }

  private resolveItemDescription(parts: Array<unknown>): string {
    return parts.map((part) => normalizeText(part)).filter(Boolean).join(' ').trim();
  }

  private buildHeader(params: {
    cardCode: string;
    cardName: string;
    address: string;
    discountPercentage: number;
    discountAmount: number;
    currency: string;
    grandTotal: number;
    comments: string;
    branch: string;
    logUserId: string;
    auditUser: string;
    salespersonCode: string;
    validUntil?: unknown;
    companyBi?: string;
  }): SubmitOrderHeader {
    const cardCode = normalizeText(params.cardCode);
    const cardName = normalizeText(params.cardName);

    return {
      CARDCODE: cardCode,
      CARDNAME: cardName,
      ECOMDOCDATE: getCurrentDateString(),
      ECOMDOCDUEDATE: toIsoDateString(params.validUntil),
      ECOMADDRESS: normalizeText(params.address),
      DISCPRCNT: toNumber(params.discountPercentage).toFixed(2),
      INVOICETYPE: 'L',
      DISCSUM: toNumber(params.discountAmount).toFixed(2),
      DOCCUR: normalizeText(params.currency) || 'SAR',
      DOCRATE: 1,
      DOCTOTAL: toNumber(params.grandTotal).toFixed(2),
      COMMENTS: normalizeText(params.comments),
      DOCBRANCH: normalizeText(params.branch),
      U_AUTORELEASE: 'N',
      U_SOSHIPMTYPE: 2,
      LOGUSERID: normalizeText(params.logUserId),
      USERLOG: normalizeText(params.auditUser),
      PICKRMRK: cardName,
      NUMATCARD: [cardCode, cardName].filter(Boolean).join(' - '),
      EXP_DELIVERY: 'N',
      SLPCODE: normalizeText(params.salespersonCode),
      COMPANYBI: normalizeText(params.companyBi) || env.SO_SQ_COMPANY_BI,
    };
  }

  private buildLine(params: {
    lineNumber: number;
    quantity: number;
    discountPercentage: number;
    lineTotal: number;
    priceBeforeDiscount: number;
    vatPercent: number;
    itemCode: string;
    itemName: string;
    description: string;
    currency: string;
    warehouseCode: string;
    vinNumber?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleVariant?: string;
    vehicleYear?: string;
    vehicleColor?: string;
    logUserId: string;
    auditUser: string;
    referenceNumber: string;
  }): SubmitOrderLine {
    return {
      LOGUSERID: normalizeText(params.logUserId),
      USERLOG: normalizeText(params.auditUser),
      LINENUM: params.lineNumber,
      WHSCODE: normalizeText(params.warehouseCode),
      VIN_NUMBER: normalizeText(params.vinNumber),
      VEHICLE_MAKE: normalizeText(params.vehicleMake),
      VEHICLE_MODEL: normalizeText(params.vehicleModel),
      VEHICLE_VARIANT: normalizeText(params.vehicleVariant),
      VEHICLE_YEAR: normalizeText(params.vehicleYear),
      VEHICLE_COLOR: normalizeText(params.vehicleColor),
      QUANTITY: Math.max(1, Math.trunc(params.quantity || 1)),
      DISCPRCNT: toNumber(params.discountPercentage).toFixed(2),
      LINETOTAL: toNumber(params.lineTotal),
      VENDORNUM: '',
      PRICEBEFDI: toNumber(params.priceBeforeDiscount),
      VATPRCNT: toNumber(params.vatPercent),
      ECOMREFNUM: normalizeText(params.referenceNumber),
      TAXCODE: env.SO_SQ_DEFAULT_TAX_CODE,
      ITEMCODE: normalizeText(params.itemCode),
      ITEMNAME: normalizeText(params.itemName),
      UOM: env.SO_SQ_DEFAULT_UOM,
      PRICE: toNumber(params.priceBeforeDiscount),
      CURRENCY: normalizeText(params.currency) || 'SAR',
      RATE: 1,
      U_ASTKNE31: 0,
      RequestedPrice: 0,
      DESCRIPTION: normalizeText(params.description),
    };
  }

  private createFallbackQuotationLine(
    quotation: Quotation,
    enquiry: GenericRecord | null,
    currency: string
  ): SubmitOrderLine {
    const selectedVehicle = extractVehicleLineRecord(
      extractSelectedVehicleLines(enquiry?.VINDETAILS)[0]
    );
    const itemCode =
      extractFromKeys(selectedVehicle, ['ItemCode', 'ITEMCODE', 'itemCode']) ||
      normalizeText(quotation.VEHICLE_VARIANT);
    const description = this.resolveItemDescription([
      quotation.VEHICLE_MAKE,
      quotation.VEHICLE_MODEL,
      quotation.VEHICLE_VARIANT,
      quotation.VIN_NUMBER,
    ]);

    return this.buildLine({
      lineNumber: 0,
      quantity: 1,
      discountPercentage: toNumber(quotation.DISCOUNT_PERCENTAGE),
      lineTotal: toNumber(quotation.VEHICLE_NET_PRICE || quotation.GRAND_TOTAL),
      priceBeforeDiscount: toNumber(quotation.VEHICLE_BASE_PRICE || quotation.GRAND_TOTAL),
      vatPercent: toNumber(quotation.TAX_RATE),
      itemCode,
      itemName: normalizeText(quotation.VEHICLE_MODEL || quotation.VEHICLE_VARIANT),
      description,
      currency,
      warehouseCode: this.resolveWarehouseCode(selectedVehicle, enquiry),
      vinNumber: normalizeText(quotation.VIN_NUMBER),
      vehicleMake: normalizeText(quotation.VEHICLE_MAKE),
      vehicleModel: normalizeText(quotation.VEHICLE_MODEL),
      vehicleVariant: normalizeText(quotation.VEHICLE_VARIANT),
      vehicleYear: normalizeText(quotation.VEHICLE_YEAR),
      vehicleColor: normalizeText(quotation.VEHICLE_COLOR),
      logUserId: normalizeText(enquiry?.MOBILE),
      auditUser: '',
      referenceNumber: quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER,
    });
  }

  private mapQuotationLines(
    quotation: Quotation & { lineItems: QuotationLineItem[] },
    enquiry: GenericRecord | null,
    currency: string,
    userContext: IntegrationUserContext
  ): SubmitOrderLine[] {
    const selectedVehicleLines = extractSelectedVehicleLines(enquiry?.VINDETAILS);
    const lineItems = quotation.lineItems || [];

    if (lineItems.length === 0) {
      const fallbackLine = this.createFallbackQuotationLine(quotation, enquiry, currency);
      return [{ ...fallbackLine, USERLOG: userContext.auditUser }];
    }

    return lineItems.map((item, index) => {
      const selectedVehicle = extractVehicleLineRecord(selectedVehicleLines[index] || selectedVehicleLines[0]);
      const itemDescription = normalizeText(item.ITEM_DESCRIPTION);
      const itemName = itemDescription || normalizeText(item.ITEM_CODE);

      return this.buildLine({
        lineNumber: index,
        quantity: toNumber(item.QUANTITY) || 1,
        discountPercentage: toNumber(item.DISCOUNT_PERCENTAGE),
        lineTotal: toNumber(item.NET_PRICE),
        priceBeforeDiscount: toNumber(item.UNIT_PRICE),
        vatPercent: toNumber(quotation.TAX_RATE),
        itemCode: normalizeText(item.ITEM_CODE) || normalizeText(quotation.VEHICLE_VARIANT),
        itemName,
        description:
          itemDescription ||
          this.resolveItemDescription([
            item.MANUFACTURER,
            quotation.VEHICLE_MODEL,
            quotation.VEHICLE_VARIANT,
            item.NOTES,
          ]),
        currency,
        warehouseCode: this.resolveWarehouseCode(selectedVehicle, enquiry),
        vinNumber:
          extractFromKeys(selectedVehicle, ['VinNumber', 'VINNUMBER', 'VIN', 'vin']) ||
          normalizeText(quotation.VIN_NUMBER),
        vehicleMake:
          extractFromKeys(selectedVehicle, ['Make', 'MAKE', 'make']) ||
          normalizeText(quotation.VEHICLE_MAKE),
        vehicleModel:
          extractFromKeys(selectedVehicle, ['Model', 'MODEL', 'model']) ||
          normalizeText(quotation.VEHICLE_MODEL),
        vehicleVariant:
          extractFromKeys(selectedVehicle, ['Variant', 'VARIANT', 'variant']) ||
          normalizeText(quotation.VEHICLE_VARIANT),
        vehicleYear:
          extractFromKeys(selectedVehicle, ['Year', 'YEAR', 'year']) ||
          normalizeText(quotation.VEHICLE_YEAR),
        vehicleColor:
          extractFromKeys(selectedVehicle, ['Color', 'COLOR', 'color']) ||
          normalizeText(quotation.VEHICLE_COLOR),
        logUserId: normalizeText(enquiry?.MOBILE),
        auditUser: userContext.auditUser,
        referenceNumber: quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER,
      });
    });
  }

  private async buildQuotationPayload(
    quotationId: number,
    userContext: IntegrationUserContext
  ): Promise<IntegrationPayloadBuildResult> {
    const quotation = await quotationService.getQuotationById(quotationId, { resolveLatest: true });
    if (!quotation) {
      throw new AppError('Quotation not found', 404, 'NOT_FOUND');
    }

    const [enquiry, selectedFinancing] = await Promise.all([
      this.getEnquiryById(quotation.ENQUIRY_SLNO),
      this.getSelectedFinancingScheme(quotation.ENQUIRY_SLNO),
    ]);

    const currency = this.resolveCurrency(enquiry, selectedFinancing);
    const cardCode = normalizeText(enquiry?.CUSTOMERID);
    const cardName = normalizeText(quotation.CUSTOMER_NAME);
    const lines = this.mapQuotationLines(quotation, enquiry, currency, userContext);

    return {
      payload: {
        SOH: this.buildHeader({
          cardCode,
          cardName,
          address: normalizeText(quotation.CUSTOMER_ADDRESS || enquiry?.ADDRESS),
          discountPercentage: toNumber(quotation.DISCOUNT_PERCENTAGE),
          discountAmount: toNumber(quotation.TOTAL_DISCOUNT_AMOUNT),
          currency,
          grandTotal: toNumber(quotation.GRAND_TOTAL),
          comments: normalizeText(quotation.NOTES),
          branch: normalizeText(enquiry?.BRANCH || enquiry?.BRANCHNAME || quotation.BRANCH),
          logUserId: normalizeText(quotation.CUSTOMER_MOBILE),
          auditUser: userContext.auditUser,
          salespersonCode: normalizeText(quotation.SLPCODE),
          validUntil: quotation.VALID_UNTIL,
        }),
        SOCH: {
          InStock: [],
          OutOfStock: lines,
        },
      },
      sourceType: 'Quotation',
      sourceSlno: quotation.SLNO,
      sourceNumber: normalizeText(quotation.ROOT_QUOTATION_NUMBER || quotation.QUOTATION_NUMBER),
      orderType: 'SQ',
      reportType: 'SalesQuote',
    };
  }

  private createFallbackSalesOrderLine(
    salesOrder: SalesOrderDetails,
    currency: string,
    userContext: IntegrationUserContext
  ): SubmitOrderLine {
    return this.buildLine({
      lineNumber: 0,
      quantity: toNumber(salesOrder.enquiry?.QUANTITY) || 1,
      discountPercentage: toNumber(salesOrder.quotation?.DISCOUNT_PERCENTAGE),
      lineTotal: toNumber(salesOrder.GRAND_TOTAL),
      priceBeforeDiscount:
        toNumber(salesOrder.quotation?.VEHICLE_BASE_PRICE) || toNumber(salesOrder.GRAND_TOTAL),
      vatPercent: toNumber(salesOrder.quotation?.TAX_RATE),
      itemCode:
        normalizeText(salesOrder.lineItems?.[0]?.ITEM_CODE) ||
        normalizeText(salesOrder.VEHICLE_VARIANT),
      itemName:
        normalizeText(salesOrder.lineItems?.[0]?.ITEM_DESCRIPTION) ||
        this.resolveItemDescription([salesOrder.VEHICLE_MODEL, salesOrder.VEHICLE_VARIANT]),
      description: this.resolveItemDescription([
        salesOrder.VEHICLE_MAKE,
        salesOrder.VEHICLE_MODEL,
        salesOrder.VEHICLE_VARIANT,
        salesOrder.VIN_NUMBER,
      ]),
      currency,
      warehouseCode: this.resolveWarehouseCode(
        extractVehicleLineRecord(extractSelectedVehicleLines(salesOrder.enquiry?.VINDETAILS)[0]),
        salesOrder.enquiry || null
      ),
      vinNumber: normalizeText(salesOrder.VIN_NUMBER),
      vehicleMake: normalizeText(salesOrder.VEHICLE_MAKE),
      vehicleModel: normalizeText(salesOrder.VEHICLE_MODEL),
      vehicleVariant: normalizeText(salesOrder.VEHICLE_VARIANT),
      logUserId: normalizeText(salesOrder.CUSTOMER_MOBILE),
      auditUser: userContext.auditUser,
      referenceNumber: salesOrder.SALES_ORDER_NUMBER,
    });
  }

  private mapSalesOrderLines(
    salesOrder: SalesOrderDetails,
    currency: string,
    userContext: IntegrationUserContext
  ): SubmitOrderLine[] {
    const lineItems = salesOrder.lineItems || [];
    const selectedVehicleLines = extractSelectedVehicleLines(salesOrder.enquiry?.VINDETAILS);

    if (lineItems.length === 0) {
      return [this.createFallbackSalesOrderLine(salesOrder, currency, userContext)];
    }

    return lineItems.map((item: SalesOrderQuotationLineItem, index: number) => {
      const selectedVehicle = extractVehicleLineRecord(selectedVehicleLines[index] || selectedVehicleLines[0]);
      const description =
        normalizeText(item.ITEM_DESCRIPTION) ||
        this.resolveItemDescription([
          salesOrder.VEHICLE_MAKE,
          salesOrder.VEHICLE_MODEL,
          salesOrder.VEHICLE_VARIANT,
          item.NOTES,
        ]);

      return this.buildLine({
        lineNumber: index,
        quantity: toNumber(item.QUANTITY) || 1,
        discountPercentage: toNumber(item.DISCOUNT_PERCENTAGE),
        lineTotal: toNumber(item.NET_PRICE) || toNumber(item.UNIT_PRICE),
        priceBeforeDiscount: toNumber(item.UNIT_PRICE) || toNumber(salesOrder.GRAND_TOTAL),
        vatPercent: toNumber(salesOrder.quotation?.TAX_RATE),
        itemCode: normalizeText(item.ITEM_CODE) || normalizeText(salesOrder.VEHICLE_VARIANT),
        itemName: normalizeText(item.ITEM_DESCRIPTION) || normalizeText(item.ITEM_CODE),
        description,
        currency,
        warehouseCode: this.resolveWarehouseCode(selectedVehicle, salesOrder.enquiry || null),
        vinNumber:
          extractFromKeys(selectedVehicle, ['VinNumber', 'VINNUMBER', 'VIN', 'vin']) ||
          normalizeText(salesOrder.VIN_NUMBER),
        vehicleMake:
          extractFromKeys(selectedVehicle, ['Make', 'MAKE', 'make']) ||
          normalizeText(salesOrder.VEHICLE_MAKE),
        vehicleModel:
          extractFromKeys(selectedVehicle, ['Model', 'MODEL', 'model']) ||
          normalizeText(salesOrder.VEHICLE_MODEL),
        vehicleVariant:
          extractFromKeys(selectedVehicle, ['Variant', 'VARIANT', 'variant']) ||
          normalizeText(salesOrder.VEHICLE_VARIANT),
        logUserId: normalizeText(salesOrder.CUSTOMER_MOBILE),
        auditUser: userContext.auditUser,
        referenceNumber: salesOrder.SALES_ORDER_NUMBER,
      });
    });
  }

  private async buildSalesOrderPayload(
    salesOrderId: number,
    userContext: IntegrationUserContext
  ): Promise<IntegrationPayloadBuildResult> {
    const salesOrder = await salesOrderService.getSalesOrderById(salesOrderId);
    if (!salesOrder) {
      throw new AppError('Sales order not found', 404, 'NOT_FOUND');
    }

    const currency = this.resolveCurrency(
      salesOrder.enquiry as GenericRecord | null,
      (salesOrder.financingSchemes || [])[0] as GenericRecord | null
    );
    const cardCode = normalizeText(salesOrder.enquiry?.CUSTOMERID);
    const lines = this.mapSalesOrderLines(salesOrder, currency, userContext);

    return {
      payload: {
        SOH: this.buildHeader({
          cardCode,
          cardName: normalizeText(salesOrder.CUSTOMER_NAME),
          address: normalizeText(salesOrder.quotation?.CUSTOMER_ADDRESS || salesOrder.enquiry?.ADDRESS),
          discountPercentage: toNumber(salesOrder.quotation?.DISCOUNT_PERCENTAGE),
          discountAmount: toNumber(salesOrder.quotation?.TOTAL_DISCOUNT_AMOUNT),
          currency,
          grandTotal: toNumber(salesOrder.GRAND_TOTAL),
          comments: normalizeText(salesOrder.NOTES),
          branch: normalizeText(salesOrder.enquiry?.BRANCH || salesOrder.enquiry?.BRANCHNAME),
          logUserId: normalizeText(salesOrder.CUSTOMER_MOBILE),
          auditUser: userContext.auditUser,
          salespersonCode: normalizeText(salesOrder.SLPCODE),
          validUntil: salesOrder.quotation?.VALID_UNTIL,
        }),
        SOCH: {
          InStock: lines,
          OutOfStock: [],
        },
      },
      sourceType: 'SalesOrder',
      sourceSlno: salesOrder.SLNO,
      sourceNumber: normalizeText(salesOrder.SALES_ORDER_NUMBER),
      orderType: 'SO',
      reportType: 'SalesOrder',
    };
  }

  private async stageOrder(
    buildResult: IntegrationPayloadBuildResult,
    _userContext: IntegrationUserContext
  ): Promise<SubmitOrderResponse> {
    const webSoNo = String(buildResult.sourceSlno);

    logger.info(
      {
        sourceType: buildResult.sourceType,
        sourceSlno: buildResult.sourceSlno,
        webSoNo,
        orderType: buildResult.orderType,
      },
      'Using DMS source document directly for queue posting'
    );

    return {
      message: 'Using DMS source document directly',
      result: [
        {
          slno: webSoNo,
          type: buildResult.orderType,
        },
      ],
    };
  }

  private async pushToQueue(params: {
    webSoNo: string;
    orderType: SapOrderType;
    userContext: IntegrationUserContext;
  }): Promise<unknown> {
    const queueUrl = new URL(resolveDmsEndpoint(params.orderType));

    const jobData = {
      WebSoNo: /^\d+$/.test(params.webSoNo) ? Number(params.webSoNo) : params.webSoNo,
      Company: FIXED_DMS_QUEUE_COMPANY,
      OrderType: params.orderType,
      uSrId: params.userContext.userId,
      OrderSrc: resolveQueueOrderSource(),
    };
    const payload = {
      ...jobData,
      jobData,
      returnValue: '1',
    };

    for (const [key, value] of Object.entries(jobData)) {
      queueUrl.searchParams.set(key, String(value));
    }
    queueUrl.searchParams.set('LoTp', FIXED_DMS_QUEUE_OTP);
    queueUrl.searchParams.set('co', FIXED_DMS_QUEUE_COMPANY_CO);
    queueUrl.searchParams.set('returnValue', payload.returnValue);

    logger.info(
      {
        queueUrl: queueUrl.toString(),
        payload,
      },
      'Posting DMS document to ASP creation API'
    );

    return await fetchJson(queueUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  private extractSubmitResult(response: SubmitOrderResponse, fallbackType: SapOrderType) {
    const result = Array.isArray(response.result) ? response.result[0] : null;
    const slno = normalizeText(result?.slno);
    const stagedType = normalizeText(result?.type) || fallbackType;

    if (!slno) {
      throw new AppError(
        'submit_order did not return a staging reference (result[].slno)',
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }

    return { slno, stagedType };
  }

  private async postViaFlow(
    buildResult: IntegrationPayloadBuildResult,
    userContext: IntegrationUserContext
  ): Promise<SapPostingResult> {
    let submitOrderResponse: unknown;
    let queueResponse: unknown;
    let slno = '';
    let stagedType = buildResult.orderType as string;

    try {
      submitOrderResponse = await this.stageOrder(buildResult, userContext);
      logger.info(
        {
          sourceType: buildResult.sourceType,
          sourceSlno: buildResult.sourceSlno,
          submitOrderResponse,
        },
        'DMS staging response prepared for posting'
      );

      ({ slno, stagedType } = this.extractSubmitResult(
        submitOrderResponse as SubmitOrderResponse,
        buildResult.orderType
      ));

      const queueOrderType: SapOrderType =
        stagedType === 'SO' ? 'SO' : buildResult.orderType;

      queueResponse = await this.pushToQueue({
        webSoNo: slno,
        orderType: queueOrderType,
        userContext,
      });
      logger.info(
        {
          sourceType: buildResult.sourceType,
          sourceSlno: buildResult.sourceSlno,
          webSoNo: slno,
          queueResponse,
        },
        'DMS queue/API response received'
      );

      const docEntry = extractDocEntryCandidate(queueResponse);
      const referenceNumber = docEntry || slno;
      const referenceSource = docEntry ? 'docEntry' : 'stagingSlno';

      return {
        reportUrl: docEntry
          ? buildReportUrl(referenceNumber, buildResult.reportType)
          : undefined,
        referenceNumber,
        referenceSource,
        submitOrderResponse,
        queueResponse,
        stagingSlno: slno,
        stagedType,
      };
    } catch (error) {
      logger.error(
        {
          error,
          sourceType: buildResult.sourceType,
          sourceSlno: buildResult.sourceSlno,
          sourceNumber: buildResult.sourceNumber,
          orderType: buildResult.orderType,
          submitOrderResponse,
          queueResponse,
          stagingSlno: slno,
          stagedType,
        },
        'Failed to post DMS document to queue/API'
      );
      throw error;
    }
  }

  async postQuotationToSap(
    quotationId: number,
    user: { userId?: string; email?: string; name?: string; SlpCode?: string }
  ): Promise<SapPostingResult> {
    const userContext = buildUserContext(user);
    const buildResult = await this.buildQuotationPayload(quotationId, userContext);

    return await this.postViaFlow(buildResult, userContext);
  }

  async postSalesOrderToSap(
    salesOrderId: number,
    user: { userId?: string; email?: string; name?: string; SlpCode?: string }
  ): Promise<SapPostingResult> {
    const userContext = buildUserContext(user);
    const buildResult = await this.buildSalesOrderPayload(salesOrderId, userContext);

    return await this.postViaFlow(buildResult, userContext);
  }

  async ensureQuotationPosted(
    quotationId: number,
    user: { userId?: string; email?: string; name?: string; SlpCode?: string }
  ): Promise<SapPostingResult> {
    return await this.postQuotationToSap(quotationId, user);
  }

  async ensureSalesOrderPosted(
    salesOrderId: number,
    user: { userId?: string; email?: string; name?: string; SlpCode?: string }
  ): Promise<SapPostingResult> {
    return await this.postSalesOrderToSap(salesOrderId, user);
  }
}

export const sapOrderIntegrationService = new SapOrderIntegrationService();

import { db } from './database.service.js';
import { logger } from '../utils/logger.js';
import { AppError, ConflictError } from '../types/errors.js';
import { env } from '../config/env.js';
import type {
  CreateQuotationInput,
  UpdateQuotationInput,
  SupersedeQuotationInput,
  RequestDiscountApprovalInput,
  ApproveDiscountInput,
  PassToCashierInput,
  AllocateDepositInput,
  ReserveVehicleInput,
  CancelQuotationInput,
  CreateActivityInput,
  DiscountApprovalFilters,
} from '../schemas/quotation.schema.js';
import {
  buildVehicleReservationConflictMessage,
  extractReservationDateFromNotes,
  findActiveVehicleReservation,
  isVehicleReservationActive,
} from '../utils/vehicle-reservation.js';

const QUOTATION_DB_SCHEMA = (() => {
  const raw = process.env.QUOTATION_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid QUOTATION_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const CREATE_QUOTATION_SP_NAME = (() => {
  const raw = process.env.CREATE_QUOTATION_SP_NAME || 'DMS_KSA_100017_EORDER';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid CREATE_QUOTATION_SP_NAME identifier: ${raw}`);
  }
  return normalized;
})();

const CREATE_QUOTATION_LINE_SP_NAME = (() => {
  const raw = process.env.CREATE_QUOTATION_LINE_SP_NAME || 'DMS_KSA_100018_EORDER';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid CREATE_QUOTATION_LINE_SP_NAME identifier: ${raw}`);
  }
  return normalized;
})();

async function getNextDiscountApprovalId(): Promise<number> {
  const row = await db.queryOne<{ NEXT_SLNO: number }>(
    `SELECT COALESCE(MAX("SLNO"), 0) + 1 AS "NEXT_SLNO"
     FROM "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL"`
  );

  return row?.NEXT_SLNO ?? 1;
}

// =====================================================
// Interfaces
// =====================================================

export interface Quotation {
  SLNO: number;
  ENQUIRY_SLNO: number;
  QUOTATION_NUMBER: string;
  DOC_TYPE?: 'SQ' | 'SO' | null;
  SOURCE_QUOTATION_SLNO?: number | null;
  VERSION: number;
  PARENT_QUOTATION_SLNO?: number;
  IS_LATEST_VERSION: string;
  ROOT_QUOTATION_SLNO?: number;
  ROOT_QUOTATION_NUMBER?: string;

  // Customer
  CUSTOMER_CODE?: string;
  CUSTOMER_NAME?: string;
  CUSTOMER_MOBILE?: string;
  CUSTOMER_EMAIL?: string;
  CUSTOMER_ADDRESS?: string;
  APILOG?: string;
  SAPDOCNUM?: string;
  SAPDOCENTRY?: string;
  SAPREFENTRY?: string;
  SAPSTATUS?: string;

  // Vehicle
  VEHICLE_MAKE?: string;
  VEHICLE_MODEL?: string;
  VEHICLE_VARIANT?: string;
  VEHICLE_YEAR?: string;
  VEHICLE_COLOR?: string;
  VIN_NUMBER?: string;

  // Pricing
  VEHICLE_BASE_PRICE: number;
  VEHICLE_DISCOUNT: number;
  VEHICLE_NET_PRICE: number;
  ACCESSORIES_TOTAL: number;
  ACCESSORIES_DISCOUNT: number;
  ACCESSORIES_NET_TOTAL: number;
  WARRANTY_TOTAL: number;
  INSURANCE_TOTAL: number;
  SUBTOTAL: number;
  TAX_RATE: number;
  TAX_AMOUNT: number;
  GRAND_TOTAL: number;

  // Trade-in & Financing
  TRADE_IN_VALUE: number;
  TRADE_IN_APPRAISAL_SLNO?: number;
  FINANCING_SCHEME_SLNO?: number;
  DOWNPAYMENT: number;
  NET_AMOUNT_DUE: number;

  // Discounts
  TOTAL_DISCOUNT_AMOUNT: number;
  DISCOUNT_PERCENTAGE: number;
  REQUIRES_APPROVAL: string;
  DISCOUNT_APPROVAL_STATUS?: string;
  DISCOUNT_APPROVED_BY?: string;
  DISCOUNT_APPROVED_DATE?: string;

  // Status
  STATUS: string;
  VALID_UNTIL?: string;
  SENT_DATE?: string;
  PASSED_TO_CASHIER: string;
  PASSED_TO_CASHIER_DATE?: string;
  DEPOSIT_AMOUNT: number;
  DEPOSIT_COLLECTED: string;
  VEHICLE_RESERVED?: string;
  VEHICLE_RESERVED_DATE?: string;
  VEHICLE_RESERVED_BY?: string;
  VEHICLE_RESERVATION_NOTES?: string;
  VEHICLE_RESERVATION_FROM_DATE?: string;
  VEHICLE_RESERVATION_TO_DATE?: string;
  PRINTED_BY?: string;
  PRINTED_DATE?: string;
  PASSED_TO_VEHICLE_ADMIN?: string;
  PASSED_TO_VA_DATE?: string;
  PASSED_TO_VA_BY?: string;
  VEHICLE_ADMIN_ASSIGNED_TO?: string;
  VEHICLE_ADMIN_NOTES?: string;
  HANDOVER_BOOKED?: string;
  HANDOVER_DATE?: string;
  HANDOVER_TIME?: string;
  HANDOVER_LOCATION?: string;
  HANDOVER_NOTES?: string;
  HANDOVER_BOOKED_BY?: string;
  HANDOVER_BOOKED_DATE?: string;
  IS_LOST_SALE?: string;
  LOST_SALE_DATE?: string;
  LOST_REASON?: string;
  LOST_NOTES?: string;
  CANCELLATION_REASON?: string;
  CANCELLED_DATE?: string;
  CANCELLED_BY?: string;

  // Notes
  NOTES?: string;
  TERMS_AND_CONDITIONS?: string;
  INTERNAL_NOTES?: string;

  // Salesperson
  SALESPERSON?: string;
  SLPCODE: string;
  BRANCH?: string;

  // Audit
  CREATED_BY: string;
  CREATED_DATE: string;
  UPDATED_BY?: string;
  UPDATED_DATE?: string;
  IS_DELETED: string;
}

export interface QuotationLineItem {
  SLNO: number;
  QUOTATION_SLNO: number;
  LINE_NUMBER: number;
  ITEM_TYPE: string;
  ITEM_CODE?: string;
  ITEM_DESCRIPTION: string;
  ITEM_CATEGORY?: string;
  QUANTITY: number;
  UNIT_PRICE: number;
  DISCOUNT_AMOUNT: number;
  DISCOUNT_PERCENTAGE: number;
  NET_PRICE: number;
  TAX_INCLUDED: string;
  VEHICLE_MAKE?: string;
  VEHICLE_MODEL?: string;
  VEHICLE_VARIANT?: string;
  VEHICLE_YEAR?: string;
  VEHICLE_COLOR?: string;
  VIN_NUMBER?: string;
  WHSCODE?: string;
  MANUFACTURER?: string;
  PART_NUMBER?: string;
  WARRANTY_PERIOD?: string;
  NOTES?: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  UPDATED_BY?: string;
  UPDATED_DATE?: string;
  IS_DELETED: string;
}

export interface DiscountApproval {
  SLNO: number;
  QUOTATION_SLNO: number;
  DISCOUNT_AMOUNT: number;
  DISCOUNT_PERCENTAGE: number;
  JUSTIFICATION: string;
  STATUS: string;
  REQUESTED_BY: string;
  REQUESTED_BY_SLPCODE: string;
  USER_DISCOUNT_LIMIT?: number;
  AMOUNT_OVER_LIMIT?: number;
  ASSIGNED_TO?: string;
  APPROVED_BY?: string;
  APPROVED_DATE?: string;
  REJECTION_REASON?: string;
  APPROVAL_NOTES?: string;
  REQUESTED_DATE: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  IS_DELETED: string;
}

interface AggregatedQuotationLineTotals {
  QUOTATION_SLNO: number;
  LINE_SUBTOTAL: number;
  LINE_DISCOUNT_TOTAL: number;
}

interface QuotationPrimaryLineSummary {
  QUOTATION_SLNO: number;
  VEHICLE_MAKE?: string;
  VEHICLE_MODEL?: string;
  VEHICLE_VARIANT?: string;
  VEHICLE_YEAR?: string;
  VEHICLE_COLOR?: string;
  VIN_NUMBER?: string;
  WHSCODE?: string;
}

interface SapQuotationDocument {
  DocEntry: number;
  DocNum: number;
  CardCode?: string;
  DocStatus?: string;
  CANCELED?: string;
}

interface SapQuotationLine {
  LineNum: number;
  ItemCode?: string;
  Quantity?: number;
  WhsCode?: string;
  LineStatus?: string;
}

function extractVinFromUnknown(input: unknown): string {
  if (!input || typeof input !== 'object') return '';

  const record = input as Record<string, unknown>;
  const directKeys = [
    'VINNUMBER',
    'VIN',
    'vinNumber',
    'vin',
    'U_Veh_StockID',
    'u_veh_stockid',
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  const dynamicMatch = Object.entries(record).find(([key, value]) => {
    if (value === undefined || value === null) return false;
    if (String(value).trim() === '') return false;
    return key.toLowerCase().includes('vin');
  });

  return dynamicMatch ? String(dynamicMatch[1]).trim() : '';
}

function normalizeText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizeSapIdentifier(value: string, label: string): string {
  const normalized = normalizeText(value);
  if (!/^[A-Za-z0-9_]+$/.test(normalized)) {
    throw new AppError(`Invalid ${label}: ${value}`, 400, 'INVALID_SAP_IDENTIFIER');
  }
  return normalized;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractFromKeys(input: unknown, keys: string[]): string {
  const record = asRecord(input);
  if (!record) return '';

  for (const key of keys) {
    const value = normalizeText(record[key]);
    if (value) return value;
  }

  return '';
}

function extractSelectedVehicleLines(vinDetails: unknown): Record<string, unknown>[] {
  if (!vinDetails || typeof vinDetails !== 'object' || Array.isArray(vinDetails)) return [];
  const lines = (vinDetails as Record<string, unknown>).SELECTED_VEHICLE_LINES;
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => asRecord(line)).filter((line): line is Record<string, unknown> => !!line);
}

function extractVehicleLineRecord(
  line: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!line) return null;
  const nestedVin = asRecord(line.vin);
  return nestedVin || line;
}

// =====================================================
// Quotation Service Class
// =====================================================

class QuotationService {
  private buildLegacyReservationNotes(
    notes?: string,
    reservationFromDate?: string,
    reservationToDate?: string
  ): string | null {
    const trimmedNotes = notes?.trim() || '';
    const lines: string[] = [];

    if (trimmedNotes) {
      lines.push(trimmedNotes);
    }
    if (reservationFromDate) {
      lines.push(`Reservation From: ${reservationFromDate}`);
    }
    if (reservationToDate) {
      lines.push(`Reservation To: ${reservationToDate}`);
    }

    return lines.length > 0 ? lines.join('\n') : null;
  }

  private async resolveRootQuotationReference(
    id: number
  ): Promise<{ rootId: number; rootQuotationNumber: string | null }> {
    let currentId = id;
    let rootQuotationNumber: string | null = null;
    const visited = new Set<number>();

    while (!visited.has(currentId)) {
      visited.add(currentId);

      const current = await db.queryOne<{
        SLNO: number;
        PARENT_QUOTATION_SLNO?: number | null;
        QUOTATION_NUMBER?: string | null;
      }>(
        `
          SELECT "SLNO", "PARENT_QUOTATION_SLNO", "QUOTATION_NUMBER"
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
            AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
        `,
        [currentId]
      );

      if (!current) {
        return { rootId: id, rootQuotationNumber: null };
      }

      rootQuotationNumber = current.QUOTATION_NUMBER || rootQuotationNumber;
      const parentId = Number(current.PARENT_QUOTATION_SLNO || 0);
      if (!Number.isFinite(parentId) || parentId <= 0) {
        return {
          rootId: Number(current.SLNO),
          rootQuotationNumber: current.QUOTATION_NUMBER || rootQuotationNumber,
        };
      }

      currentId = parentId;
    }

    return { rootId: id, rootQuotationNumber };
  }

  private async hydrateQuotationReferences<T extends Quotation>(quotations: T[]): Promise<T[]> {
    const cache = new Map<number, { rootId: number; rootQuotationNumber: string | null }>();

    return Promise.all(
      quotations.map(async (quotation) => {
        const quotationId = Number(quotation.SLNO);

        if (!cache.has(quotationId)) {
          cache.set(quotationId, await this.resolveRootQuotationReference(quotationId));
        }

        const reference = cache.get(quotationId)!;
        return {
          ...quotation,
          ROOT_QUOTATION_SLNO: reference.rootId,
          ROOT_QUOTATION_NUMBER: reference.rootQuotationNumber || quotation.QUOTATION_NUMBER,
        };
      })
    );
  }

  private async getLineItemTotalsMap(
    quotationIds: number[]
  ): Promise<Map<number, AggregatedQuotationLineTotals>> {
    if (quotationIds.length === 0) {
      return new Map();
    }

    const placeholders = quotationIds.map(() => '?').join(', ');
    const query = `
      SELECT
        "QUOTATION_SLNO",
        SUM(COALESCE("NET_PRICE", 0)) AS "LINE_SUBTOTAL",
        SUM(COALESCE("DISCOUNT_AMOUNT", 0)) AS "LINE_DISCOUNT_TOTAL"
      FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
      WHERE "IS_DELETED" = 'N'
        AND "QUOTATION_SLNO" IN (${placeholders})
      GROUP BY "QUOTATION_SLNO"
    `;

    const rows = await db.query<AggregatedQuotationLineTotals>(query, quotationIds);
    return new Map(rows.map((row) => [Number(row.QUOTATION_SLNO), row]));
  }

  private async getPrimaryLineSummaryMap(
    quotationIds: number[]
  ): Promise<Map<number, QuotationPrimaryLineSummary>> {
    if (quotationIds.length === 0) {
      return new Map();
    }

    const placeholders = quotationIds.map(() => '?').join(', ');
    const rows = await db.query<QuotationPrimaryLineSummary & { LINE_NUMBER?: number }>(
      `
        SELECT
          "QUOTATION_SLNO",
          "LINE_NUMBER",
          "VEHICLE_MAKE",
          "VEHICLE_MODEL",
          "VEHICLE_VARIANT",
          "VEHICLE_YEAR",
          "VEHICLE_COLOR",
          "VIN_NUMBER",
          "WHSCODE"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
        WHERE "IS_DELETED" = 'N'
          AND "QUOTATION_SLNO" IN (${placeholders})
        ORDER BY "QUOTATION_SLNO", "LINE_NUMBER", "SLNO"
      `,
      quotationIds
    );

    const map = new Map<number, QuotationPrimaryLineSummary>();
    for (const row of rows) {
      const quotationId = Number(row.QUOTATION_SLNO);
      if (!map.has(quotationId)) {
        map.set(quotationId, row);
      }
    }

    return map;
  }

  private applyVehicleSummaryFromLine<T extends Quotation>(
    quotation: T,
    primaryLine?: QuotationPrimaryLineSummary | null
  ): T {
    if (!primaryLine) return quotation;

    return {
      ...quotation,
      VEHICLE_MAKE: primaryLine.VEHICLE_MAKE || quotation.VEHICLE_MAKE,
      VEHICLE_MODEL: primaryLine.VEHICLE_MODEL || quotation.VEHICLE_MODEL,
      VEHICLE_VARIANT: primaryLine.VEHICLE_VARIANT || quotation.VEHICLE_VARIANT,
      VEHICLE_YEAR: primaryLine.VEHICLE_YEAR || quotation.VEHICLE_YEAR,
      VEHICLE_COLOR: primaryLine.VEHICLE_COLOR || quotation.VEHICLE_COLOR,
      VIN_NUMBER: primaryLine.VIN_NUMBER || quotation.VIN_NUMBER,
    };
  }

  private async hydrateQuotationVehicleSummary<T extends Quotation>(quotations: T[]): Promise<T[]> {
    const quotationIds = quotations
      .map((quotation) => Number(quotation.SLNO))
      .filter((id) => Number.isFinite(id) && id > 0);

    const primaryLineMap = await this.getPrimaryLineSummaryMap(quotationIds);
    return quotations.map((quotation) =>
      this.applyVehicleSummaryFromLine(quotation, primaryLineMap.get(Number(quotation.SLNO)))
    );
  }

  private buildLineVehicleDetails(
    lineItem: Record<string, unknown> | undefined,
    selectedVehicle: Record<string, unknown> | null,
    fallbackVehicle: {
      vehicleMake?: string;
      vehicleModel?: string;
      vehicleVariant?: string;
      vehicleYear?: string;
      vehicleColor?: string;
      vinNumber?: string;
    }
  ) {
    return {
      vehicleMake:
        normalizeText(lineItem?.vehicleMake) ||
        normalizeText(lineItem?.VEHICLE_MAKE) ||
        extractFromKeys(selectedVehicle, ['Make', 'MAKE', 'make', 'Brand', 'BRAND']) ||
        normalizeText(fallbackVehicle.vehicleMake),
      vehicleModel:
        normalizeText(lineItem?.vehicleModel) ||
        normalizeText(lineItem?.VEHICLE_MODEL) ||
        extractFromKeys(selectedVehicle, ['Model', 'MODEL', 'model']) ||
        normalizeText(fallbackVehicle.vehicleModel),
      vehicleVariant:
        normalizeText(lineItem?.vehicleVariant) ||
        normalizeText(lineItem?.VEHICLE_VARIANT) ||
        extractFromKeys(selectedVehicle, ['Variant', 'VARIANT', 'variant', 'ItemCode', 'ITEMCODE']) ||
        normalizeText(fallbackVehicle.vehicleVariant),
      vehicleYear:
        normalizeText(lineItem?.vehicleYear) ||
        normalizeText(lineItem?.VEHICLE_YEAR) ||
        extractFromKeys(selectedVehicle, ['Year', 'YEAR', 'year']) ||
        normalizeText(fallbackVehicle.vehicleYear),
      vehicleColor:
        normalizeText(lineItem?.vehicleColor) ||
        normalizeText(lineItem?.VEHICLE_COLOR) ||
        extractFromKeys(selectedVehicle, ['Color', 'COLOR', 'color']) ||
        normalizeText(fallbackVehicle.vehicleColor),
      vinNumber:
        normalizeText(lineItem?.vinNumber) ||
        normalizeText(lineItem?.VIN_NUMBER) ||
        extractFromKeys(selectedVehicle, ['VinNumber', 'VINNUMBER', 'VIN', 'vin', 'vinNumber']) ||
        normalizeText(fallbackVehicle.vinNumber),
      whsCode:
        normalizeText(lineItem?.whsCode) ||
        normalizeText(lineItem?.WHSCODE) ||
        extractFromKeys(selectedVehicle, [
          'WhsCode',
          'WHSCODE',
          'whsCode',
          'WhsName',
          'WHSNAME',
          'Warehouse',
          'warehouse',
        ]),
    };
  }

  private async resolveLatestQuotationId(id: number): Promise<number> {
    let currentId = id;
    const visited = new Set<number>();

    while (!visited.has(currentId)) {
      visited.add(currentId);

      const nextVersion = await db.queryOne<{ SLNO: number }>(
        `
          SELECT "SLNO"
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          WHERE "PARENT_QUOTATION_SLNO" = ? AND "IS_DELETED" = 'N'
            AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
          ORDER BY "VERSION" DESC, "CREATED_DATE" DESC
          LIMIT 1
        `,
        [currentId]
      );

      if (!nextVersion?.SLNO) {
        return currentId;
      }

      currentId = Number(nextVersion.SLNO);
    }

    return id;
  }

  private async hydrateQuotationHeaderTotals<T extends Quotation>(quotations: T[]): Promise<T[]> {
    const quotationIds = quotations
      .map((quotation) => Number(quotation.SLNO))
      .filter((id) => Number.isFinite(id) && id > 0);

    const lineItemTotalsMap = await this.getLineItemTotalsMap(quotationIds);

    return quotations.map((quotation) => {
      const lineItemTotals = lineItemTotalsMap.get(Number(quotation.SLNO));
      if (!lineItemTotals) {
        return quotation;
      }

      const derivedSubtotal =
        Number(lineItemTotals.LINE_SUBTOTAL || 0) +
        Number(quotation.ACCESSORIES_NET_TOTAL || 0) +
        Number(quotation.WARRANTY_TOTAL || 0) +
        Number(quotation.INSURANCE_TOTAL || 0);
      const derivedTaxAmount = Number(
        (derivedSubtotal * (Number(quotation.TAX_RATE || 0) / 100)).toFixed(2)
      );
      const derivedGrandTotal = Number((derivedSubtotal + derivedTaxAmount).toFixed(2));
      const derivedNetAmountDue = Math.max(
        0,
        Number(
          (
            derivedGrandTotal -
            Number(quotation.TRADE_IN_VALUE || 0) -
            Number(quotation.DOWNPAYMENT || 0)
          ).toFixed(2)
        )
      );

      return {
        ...quotation,
        SUBTOTAL:
          Number(quotation.SUBTOTAL || 0) !== 0 ? Number(quotation.SUBTOTAL) : derivedSubtotal,
        TAX_AMOUNT:
          Number(quotation.TAX_AMOUNT || 0) !== 0
            ? Number(quotation.TAX_AMOUNT)
            : derivedTaxAmount,
        GRAND_TOTAL:
          Number(quotation.GRAND_TOTAL || 0) !== 0
            ? Number(quotation.GRAND_TOTAL)
            : derivedGrandTotal,
        NET_AMOUNT_DUE:
          Number(quotation.NET_AMOUNT_DUE || 0) !== 0
            ? Number(quotation.NET_AMOUNT_DUE)
            : derivedNetAmountDue,
        TOTAL_DISCOUNT_AMOUNT:
          Number(quotation.TOTAL_DISCOUNT_AMOUNT || 0) !== 0
            ? Number(quotation.TOTAL_DISCOUNT_AMOUNT)
            : Number(lineItemTotals.LINE_DISCOUNT_TOTAL || 0),
      };
    });
  }

  private getCreateQuotationLineSpSql(): string {
    return `CALL "${QUOTATION_DB_SCHEMA}"."${CREATE_QUOTATION_LINE_SP_NAME}"(${Array(25)
      .fill('?')
      .join(', ')})`;
  }

  private async insertQuotationLineItemViaSp(
    quotationId: number,
    item: any,
    actor: string,
    currentDateTime: string,
    vehicleDetails?: {
      vehicleMake?: string;
      vehicleModel?: string;
      vehicleVariant?: string;
      vehicleYear?: string;
      vehicleColor?: string;
      vinNumber?: string;
      whsCode?: string;
    }
  ): Promise<void> {
    const lineNumber = Number(item?.lineNumber ?? item?.LINE_NUMBER ?? 1);
    const quantity = Number(item?.quantity ?? item?.QUANTITY ?? 1);
    const unitPrice = Number(item?.unitPrice ?? item?.UNIT_PRICE ?? 0);
    const discountAmount = Number(item?.discountAmount ?? item?.DISCOUNT_AMOUNT ?? 0);
    const discountPercentage = Number(item?.discountPercentage ?? item?.DISCOUNT_PERCENTAGE ?? 0);
    const netPrice = Number(item?.netPrice ?? item?.NET_PRICE ?? 0);

    await db.query(this.getCreateQuotationLineSpSql(), [
      quotationId,
      Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : 1,
      item?.itemType ?? item?.ITEM_TYPE ?? 'Vehicle',
      item?.itemCode ?? item?.ITEM_CODE ?? null,
      item?.itemDescription ?? item?.ITEM_DESCRIPTION ?? '',
      item?.itemCategory ?? item?.ITEM_CATEGORY ?? null,
      Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      Number.isFinite(unitPrice) ? unitPrice : 0,
      Number.isFinite(discountAmount) ? discountAmount : 0,
      Number.isFinite(discountPercentage) ? discountPercentage : 0,
      Number.isFinite(netPrice) ? netPrice : 0,
      item?.taxIncluded ?? item?.TAX_INCLUDED ?? 'N',
      vehicleDetails?.vehicleMake ?? item?.vehicleMake ?? item?.VEHICLE_MAKE ?? null,
      vehicleDetails?.vehicleModel ?? item?.vehicleModel ?? item?.VEHICLE_MODEL ?? null,
      vehicleDetails?.vehicleVariant ?? item?.vehicleVariant ?? item?.VEHICLE_VARIANT ?? null,
      vehicleDetails?.vehicleYear ?? item?.vehicleYear ?? item?.VEHICLE_YEAR ?? null,
      vehicleDetails?.vehicleColor ?? item?.vehicleColor ?? item?.VEHICLE_COLOR ?? null,
      vehicleDetails?.vinNumber ?? item?.vinNumber ?? item?.VIN_NUMBER ?? null,
      vehicleDetails?.whsCode ?? item?.whsCode ?? item?.WHSCODE ?? null,
      item?.manufacturer ?? item?.MANUFACTURER ?? null,
      item?.partNumber ?? item?.PART_NUMBER ?? null,
      item?.warrantyPeriod ?? item?.WARRANTY_PERIOD ?? null,
      item?.notes ?? item?.NOTES ?? null,
      actor,
      currentDateTime,
    ]);
  }

  private async createQuotationViaStoredProcedure(
    data: CreateQuotationInput & { createdBy: string; slpCode: string },
    options?: {
      quotationNumber?: string;
      branch?: string | null;
    }
  ): Promise<{ quotationId: number; quotationNumber: string; currentDateTime: string }> {
    const currentDateTime = this.getCurrentDateTime();
    const quotationNumber = options?.quotationNumber || (await this.generateQuotationNumber());
    let resolvedVinNumber = data.vinNumber || null;
    let resolvedCustomerCode: string | null = null;
    let selectedVehicleLines: Record<string, unknown>[] = [];

    if (data.enquirySlno) {
      const enquiry = await db.queryOne<{
        CUSTOMERID?: string | null;
        VINNUMBER?: string | null;
        VINDETAILS?: string | null;
      }>(
        `
          SELECT "CUSTOMERID", "VINNUMBER", "VINDETAILS"
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_SALESENQUIRY"
          WHERE "SLNO" = ?
        `,
        [data.enquirySlno]
      );

      if (enquiry) {
        resolvedCustomerCode = normalizeText(enquiry.CUSTOMERID) || null;
        if (!resolvedVinNumber) {
          resolvedVinNumber = enquiry.VINNUMBER || null;
        }

        if (enquiry.VINDETAILS) {
          try {
            const vinDetails = JSON.parse(enquiry.VINDETAILS) as unknown;
            selectedVehicleLines = extractSelectedVehicleLines(vinDetails);
            if (!resolvedVinNumber) {
              resolvedVinNumber = extractVinFromUnknown(vinDetails) || null;
            }
          } catch {
            // Ignore invalid VINDETAILS JSON and keep VIN null.
          }
        }
      }
    }

    const discountCheck = await this.checkDiscountLimit(data.totalDiscountAmount, data.createdBy);

    const createMasterParameters = [
      data.enquirySlno,
      quotationNumber,
      'SQ',
      null,
      resolvedCustomerCode,
      data.customerName || null,
      data.customerMobile || null,
      data.customerEmail || null,
      data.customerAddress || null,
      data.vehicleBasePrice,
      data.vehicleDiscount,
      data.vehicleNetPrice,
      data.accessoriesTotal,
      data.accessoriesDiscount,
      data.accessoriesNetTotal,
      data.warrantyTotal,
      data.insuranceTotal,
      data.subtotal,
      data.taxRate,
      data.taxAmount,
      data.grandTotal,
      data.tradeInValue,
      data.tradeInAppraisalSlno || null,
      data.financingSchemeSlno || null,
      data.downpayment,
      data.netAmountDue,
      data.totalDiscountAmount,
      data.discountPercentage,
      discountCheck.requiresApproval ? 'Y' : 'N',
      discountCheck.requiresApproval ? 'Pending' : null,
      data.status || 'Draft',
      data.validUntil || null,
      data.notes || null,
      data.termsAndConditions || null,
      data.internalNotes || null,
      data.createdBy,
      data.slpCode,
      options?.branch ?? null,
      data.createdBy,
      currentDateTime,
    ];

    const createQuotationSp = `CALL "${QUOTATION_DB_SCHEMA}"."${CREATE_QUOTATION_SP_NAME}"(${createMasterParameters
      .map(() => '?')
      .join(', ')})`;
    await db.query(createQuotationSp, createMasterParameters);

    const idQuery = `
      SELECT "SLNO" FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
      WHERE "QUOTATION_NUMBER" = ?
        AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
    `;
    const idResult = await db.query(idQuery, [quotationNumber]);
    const quotationId = idResult[0]?.SLNO;

    if (!quotationId) {
      throw new Error(
        `Stored procedure created quotation but no SLNO found for quotation number: ${quotationNumber}`
      );
    }

    for (const [index, item] of data.lineItems.entries()) {
      const selectedVehicle = extractVehicleLineRecord(
        selectedVehicleLines[index] || selectedVehicleLines[0]
      );
      const vehicleDetails = this.buildLineVehicleDetails(item, selectedVehicle, {
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        vehicleVariant: data.vehicleVariant,
        vehicleYear: data.vehicleYear,
        vehicleColor: data.vehicleColor,
        vinNumber: resolvedVinNumber || undefined,
      });
      await this.insertQuotationLineItemViaSp(
        quotationId,
        item,
        data.createdBy,
        currentDateTime,
        vehicleDetails
      );
    }

    return { quotationId, quotationNumber, currentDateTime };
  }

  /**
   * Generate unique quotation number
   * Format: QT-YYYY-NNNNN
   */
  private async generateQuotationNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `QT-${year}-`;

      // Get last quotation number for this year
      const query = `
        SELECT "QUOTATION_NUMBER"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "QUOTATION_NUMBER" LIKE ?
          AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
        ORDER BY "QUOTATION_NUMBER" DESC
        LIMIT 1
      `;

      const result = await db.query(query, [`${prefix}%`]);

      if (result.length === 0) {
        return `${prefix}00001`;
      }

      const lastNumber = result[0].QUOTATION_NUMBER;
      const lastSequence = parseInt(lastNumber.split('-')[2], 10);
      const newSequence = (lastSequence + 1).toString().padStart(5, '0');

      return `${prefix}${newSequence}`;
    } catch (error: any) {
      logger.error('Error generating quotation number:', error);
      throw new Error('Failed to generate quotation number: ' + error.message);
    }
  }

  /**
   * Check if discount exceeds user limit
   * Returns whether approval is required and related details
   */
  private async checkDiscountLimit(
    discountAmount: number,
    userId: string
  ): Promise<{ requiresApproval: boolean; userLimit: number; overLimit: number }> {
    try {
      // Query user's discount limit
      // Note: Adjust table/column names based on your actual user settings table
      const query = `
        SELECT "DISCOUNT_LIMIT_AMOUNT"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_USER_SETTINGS"
        WHERE "USER_ID" = ?
      `;

      const result = await db.query(query, [userId]);
      const userLimit = result[0]?.DISCOUNT_LIMIT_AMOUNT || 0;

      const absDiscount = Math.abs(discountAmount);
      const requiresApproval = absDiscount > userLimit;
      const overLimit = requiresApproval ? absDiscount - userLimit : 0;

      logger.info(
        {
          userId,
          discountAmount,
          userLimit,
          requiresApproval,
        },
        'Checked discount limit'
      );

      return { requiresApproval, userLimit, overLimit };
    } catch (error: any) {
      // If user settings table doesn't exist or user not found, assume no limit (always approve)
      logger.warn(
        {
          userId,
          errorMessage: error.message,
          errorCode: error.code,
        },
        'Could not check discount limit (DMS_USER_SETTINGS table may not exist or user not found), defaulting to no approval required'
      );
      return { requiresApproval: false, userLimit: 0, overLimit: 0 };
    }
  }

  /**
   * Get current datetime in the format used by the database
   */
  private getCurrentDateTime(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  private async findSapCompanySchemas(): Promise<string[]> {
    const rows = await db.query<{ SCHEMA_NAME: string }>(
      `
        SELECT "SCHEMA_NAME"
        FROM "SYS"."TABLES"
        WHERE "TABLE_NAME" IN ('OQUT', 'QUT1')
        GROUP BY "SCHEMA_NAME"
        HAVING COUNT(DISTINCT "TABLE_NAME") = 2
        ORDER BY "SCHEMA_NAME"
      `
    );

    return rows.map((row) => normalizeText(row.SCHEMA_NAME)).filter(Boolean);
  }

  private async resolveSapQuotationBase(
    companyDb: string,
    quotation: Quotation,
    localLines: Array<{
      LineNumber: string;
      ItemCode: string;
      Quantity: string;
      Warehouse: string;
    }>
  ): Promise<{
    companyDb: string;
    baseEntry: string;
    lines: Array<{
      LineNumber: string;
      ItemCode: string;
      Quantity: string;
      Warehouse: string;
    }>;
  }> {
    const preferredSchema = normalizeSapIdentifier(companyDb, 'CompanyDB');
    const isAlreadyConfirmed =
      normalizeText(quotation.SAPSTATUS).toLowerCase() === 'success';
    const candidates = Array.from(
      new Set(
        [
          quotation.SAPDOCENTRY,
          quotation.SAPDOCNUM,
          isAlreadyConfirmed ? null : quotation.SAPREFENTRY,
        ]
          .map((value) => Number(normalizeText(value)))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    );

    if (candidates.length === 0) {
      throw new AppError(
        'SAP quotation DocEntry is required before converting to sales order.',
        400,
        'MISSING_SAP_DOCENTRY'
      );
    }

    const resolveInSchema = async (schema: string) => {
      const placeholders = candidates.map(() => '?').join(', ');
      const documents = await db.query<SapQuotationDocument>(
        `
          SELECT "DocEntry", "DocNum", "CardCode", "DocStatus", "CANCELED"
          FROM "${schema}"."OQUT"
          WHERE "DocEntry" IN (${placeholders})
             OR "DocNum" IN (${placeholders})
        `,
        [...candidates, ...candidates]
      );

      const requestedDocEntry = Number(
        normalizeText(quotation.SAPDOCENTRY || (!isAlreadyConfirmed ? quotation.SAPREFENTRY : ''))
      );
      const document =
        documents.find((row) => Number(row.DocEntry) === requestedDocEntry) ||
        documents[0];

      if (!document) {
        throw new AppError(
          `SAP Sales Quotation was not found in CompanyDB=${schema}. Checked DocEntry/DocNum: ${candidates.join(', ')}.`,
          400,
          'SAP_BASE_DOCUMENT_NOT_FOUND'
        );
      }

      if (normalizeText(document.CANCELED).toUpperCase() === 'Y') {
        throw new AppError(
          `SAP Sales Quotation DocEntry=${document.DocEntry} is cancelled and cannot be converted.`,
          400,
          'SAP_BASE_DOCUMENT_CANCELLED'
        );
      }

      if (normalizeText(document.DocStatus).toUpperCase() === 'C') {
        throw new AppError(
          `SAP Sales Quotation DocEntry=${document.DocEntry} is closed and cannot be converted.`,
          400,
          'SAP_BASE_DOCUMENT_CLOSED'
        );
      }

      const sapLines = await db.query<SapQuotationLine>(
        `
          SELECT "LineNum", "ItemCode", "Quantity", "WhsCode", "LineStatus"
          FROM "${schema}"."QUT1"
          WHERE "DocEntry" = ?
          ORDER BY "LineNum"
        `,
        [Number(document.DocEntry)]
      );

      const resolvedLines = localLines.map((line) => {
        const lineNumber = Number(line.LineNumber);
        const sapLine = sapLines.find((candidate) => Number(candidate.LineNum) === lineNumber);

        if (!sapLine) {
          throw new AppError(
            `SAP Sales Quotation DocEntry=${document.DocEntry} does not contain line ${line.LineNumber}.`,
            400,
            'SAP_BASE_LINE_NOT_FOUND'
          );
        }

        if (normalizeText(sapLine.LineStatus).toUpperCase() === 'C') {
          throw new AppError(
            `SAP Sales Quotation DocEntry=${document.DocEntry} line ${line.LineNumber} is closed and cannot be converted.`,
            400,
            'SAP_BASE_LINE_CLOSED'
          );
        }

        return {
          LineNumber: line.LineNumber,
          ItemCode: normalizeText(sapLine.ItemCode) || line.ItemCode,
          Quantity: line.Quantity,
          Warehouse: normalizeText(sapLine.WhsCode) || line.Warehouse,
        };
      });

      return {
        companyDb: schema,
        baseEntry: String(
          env.CONVERT_SALES_DOC_BASE_REF === 'DocNum'
            ? document.DocNum
            : document.DocEntry
        ),
        lines: resolvedLines,
      };
    };

    try {
      return await resolveInSchema(preferredSchema);
    } catch (error) {
      const schemas = await this.findSapCompanySchemas().catch(() => []);
      const searchSchemas = schemas.filter((schema) => schema !== preferredSchema);

      for (const schema of searchSchemas) {
        try {
          return await resolveInSchema(schema);
        } catch {
          // Try the next visible SAP company schema.
        }
      }

      if (error instanceof AppError) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isInvalidSchema = errorMessage.toLowerCase().includes('invalid schema name');
      const schemaHint = isInvalidSchema
        ? await this.findSapCompanySchemas()
            .then((schemas) =>
              schemas.length > 0
                ? ` Available SAP company schemas with OQUT/QUT1: ${schemas.join(', ')}.`
                : ' No SAP company schemas containing OQUT/QUT1 were visible to this database user.'
            )
            .catch(() => '')
        : '';

      throw new AppError(
        `Could not verify SAP Sales Quotation in CompanyDB=${preferredSchema}: ${errorMessage}.${schemaHint}`,
        502,
        'SAP_BASE_DOCUMENT_LOOKUP_FAILED'
      );
    }
  }

  private async getQuotationOrThrow(
    id: number
  ): Promise<Quotation & { lineItems: QuotationLineItem[] }> {
    const quotation = await this.getQuotationById(id);
    if (!quotation) {
      throw new Error('Quotation not found');
    }
    return quotation;
  }

  private ensureActionAllowed(quotation: Quotation): void {
    if (quotation.STATUS === 'Cancelled') {
      throw new Error('Quotation is cancelled and cannot be changed');
    }
    if (quotation.STATUS === 'Superseded') {
      throw new Error('Superseded quotation cannot be changed');
    }
  }

  /**
   * Create a new quotation with line items
   */
  async createQuotation(
    data: CreateQuotationInput & { createdBy: string; slpCode: string }
  ): Promise<{ success: boolean; id: number; quotationNumber: string }> {
    try {
      const { quotationId, quotationNumber } = await this.createQuotationViaStoredProcedure(data);

      logger.info({ quotationId, quotationNumber }, 'Quotation created successfully');

      return { success: true, id: quotationId, quotationNumber };
    } catch (error: any) {
      logger.error('Error creating quotation:', error);
      throw new Error('Failed to create quotation: ' + error.message);
    }
  }

  /**
   * Get quotation by ID with line items
   */
  async getQuotationById(
    id: number,
    options?: { resolveLatest?: boolean }
  ): Promise<(Quotation & { lineItems: QuotationLineItem[] }) | null> {
    try {
      const targetId = options?.resolveLatest ? await this.resolveLatestQuotationId(id) : id;

      const quotationQuery = `
        SELECT * FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
          AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
      `;

      const lineItemsQuery = `
        SELECT * FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
        WHERE "QUOTATION_SLNO" = ? AND "IS_DELETED" = 'N'
        ORDER BY "LINE_NUMBER"
      `;

      const quotation = await db.queryOne(quotationQuery, [targetId]);
      if (!quotation) return null;

      const lineItems = await db.query<QuotationLineItem>(lineItemsQuery, [targetId]);
      const primaryLine = lineItems[0];

      const [quotationWithReference] = await this.hydrateQuotationReferences([
        this.applyVehicleSummaryFromLine(
          { ...quotation, lineItems } as Quotation & { lineItems: QuotationLineItem[] },
          primaryLine
            ? {
                QUOTATION_SLNO: Number(primaryLine.QUOTATION_SLNO),
                VEHICLE_MAKE: primaryLine.VEHICLE_MAKE,
                VEHICLE_MODEL: primaryLine.VEHICLE_MODEL,
                VEHICLE_VARIANT: primaryLine.VEHICLE_VARIANT,
                VEHICLE_YEAR: primaryLine.VEHICLE_YEAR,
                VEHICLE_COLOR: primaryLine.VEHICLE_COLOR,
                VIN_NUMBER: primaryLine.VIN_NUMBER,
                WHSCODE: primaryLine.WHSCODE,
              }
            : null
        ),
      ]);

      return quotationWithReference || null;
    } catch (error: any) {
      logger.error('Error fetching quotation:', error);
      throw new Error('Failed to fetch quotation: ' + error.message);
    }
  }

  /**
   * Get all quotations for an enquiry
   */
  async getQuotationsByEnquiryId(enquiryId: number): Promise<Quotation[]> {
    try {
      const query = `
        SELECT * FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "ENQUIRY_SLNO" = ? AND "IS_DELETED" = 'N'
          AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
        ORDER BY "VERSION" DESC, "CREATED_DATE" DESC
      `;

      const quotations = await db.query<Quotation>(query, [enquiryId]);
      const hydratedTotals = await this.hydrateQuotationHeaderTotals(quotations);
      const hydratedVehicles = await this.hydrateQuotationVehicleSummary(hydratedTotals);
      return await this.hydrateQuotationReferences(hydratedVehicles);
    } catch (error: any) {
      logger.error('Error fetching quotations for enquiry:', error);
      throw new Error('Failed to fetch quotations: ' + error.message);
    }
  }

  /**
   * Get all quotations (with optional filters)
   */
  async getAllQuotations(filters?: {
    status?: string;
    slpCode?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Quotation[]> {
    try {
      let query = `
        SELECT * FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "IS_DELETED" = 'N'
          AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
      `;
      const params: any[] = [];

      if (filters?.status) {
        query += ` AND "STATUS" = ?`;
        params.push(filters.status);
      }

      if (filters?.slpCode) {
        query += ` AND "SLPCODE" = ?`;
        params.push(filters.slpCode);
      }

      if (filters?.dateFrom) {
        query += ` AND "CREATED_DATE" >= ?`;
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        query += ` AND "CREATED_DATE" <= ?`;
        params.push(filters.dateTo);
      }

      query += ` ORDER BY "CREATED_DATE" DESC`;

      const quotations = await db.query<Quotation>(query, params);
      const hydratedTotals = await this.hydrateQuotationHeaderTotals(quotations);
      const hydratedVehicles = await this.hydrateQuotationVehicleSummary(hydratedTotals);
      return await this.hydrateQuotationReferences(hydratedVehicles);
    } catch (error: any) {
      logger.error('Error fetching all quotations:', error);
      throw new Error('Failed to fetch quotations: ' + error.message);
    }
  }

  /**
   * Update quotation
   */
  async updateQuotation(
    id: number,
    data: Partial<UpdateQuotationInput> & { updatedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const currentDateTime = this.getCurrentDateTime();
      const updates: string[] = [];
      const params: any[] = [];

      // Build dynamic update query
      if (data.customerName !== undefined) {
        updates.push('"CUSTOMER_NAME" = ?');
        params.push(data.customerName);
      }
      if (data.customerMobile !== undefined) {
        updates.push('"CUSTOMER_MOBILE" = ?');
        params.push(data.customerMobile);
      }
      if (data.customerEmail !== undefined) {
        updates.push('"CUSTOMER_EMAIL" = ?');
        params.push(data.customerEmail);
      }
      if (data.customerAddress !== undefined) {
        updates.push('"CUSTOMER_ADDRESS" = ?');
        params.push(data.customerAddress);
      }

      // Pricing fields
      if (data.vehicleBasePrice !== undefined) {
        updates.push('"VEHICLE_BASE_PRICE" = ?');
        params.push(data.vehicleBasePrice);
      }
      if (data.vehicleDiscount !== undefined) {
        updates.push('"VEHICLE_DISCOUNT" = ?');
        params.push(data.vehicleDiscount);
      }
      if (data.vehicleNetPrice !== undefined) {
        updates.push('"VEHICLE_NET_PRICE" = ?');
        params.push(data.vehicleNetPrice);
      }
      if (data.accessoriesTotal !== undefined) {
        updates.push('"ACCESSORIES_TOTAL" = ?');
        params.push(data.accessoriesTotal);
      }
      if (data.accessoriesDiscount !== undefined) {
        updates.push('"ACCESSORIES_DISCOUNT" = ?');
        params.push(data.accessoriesDiscount);
      }
      if (data.accessoriesNetTotal !== undefined) {
        updates.push('"ACCESSORIES_NET_TOTAL" = ?');
        params.push(data.accessoriesNetTotal);
      }
      if (data.warrantyTotal !== undefined) {
        updates.push('"WARRANTY_TOTAL" = ?');
        params.push(data.warrantyTotal);
      }
      if (data.insuranceTotal !== undefined) {
        updates.push('"INSURANCE_TOTAL" = ?');
        params.push(data.insuranceTotal);
      }
      if (data.subtotal !== undefined) {
        updates.push('"SUBTOTAL" = ?');
        params.push(data.subtotal);
      }
      if (data.taxRate !== undefined) {
        updates.push('"TAX_RATE" = ?');
        params.push(data.taxRate);
      }
      if (data.taxAmount !== undefined) {
        updates.push('"TAX_AMOUNT" = ?');
        params.push(data.taxAmount);
      }
      if (data.grandTotal !== undefined) {
        updates.push('"GRAND_TOTAL" = ?');
        params.push(data.grandTotal);
      }

      // Trade-in & financing
      if (data.tradeInValue !== undefined) {
        updates.push('"TRADE_IN_VALUE" = ?');
        params.push(data.tradeInValue);
      }
      if (data.tradeInAppraisalSlno !== undefined) {
        updates.push('"TRADE_IN_APPRAISAL_SLNO" = ?');
        params.push(data.tradeInAppraisalSlno);
      }
      if (data.financingSchemeSlno !== undefined) {
        updates.push('"FINANCING_SCHEME_SLNO" = ?');
        params.push(data.financingSchemeSlno);
      }
      if (data.downpayment !== undefined) {
        updates.push('"DOWNPAYMENT" = ?');
        params.push(data.downpayment);
      }
      if (data.netAmountDue !== undefined) {
        updates.push('"NET_AMOUNT_DUE" = ?');
        params.push(data.netAmountDue);
      }

      // Discount summary
      if (data.totalDiscountAmount !== undefined) {
        updates.push('"TOTAL_DISCOUNT_AMOUNT" = ?');
        params.push(data.totalDiscountAmount);
      }
      if (data.discountPercentage !== undefined) {
        updates.push('"DISCOUNT_PERCENTAGE" = ?');
        params.push(data.discountPercentage);
      }

      // Notes
      if (data.notes !== undefined) {
        updates.push('"NOTES" = ?');
        params.push(data.notes);
      }
      if (data.termsAndConditions !== undefined) {
        updates.push('"TERMS_AND_CONDITIONS" = ?');
        params.push(data.termsAndConditions);
      }
      if (data.internalNotes !== undefined) {
        updates.push('"INTERNAL_NOTES" = ?');
        params.push(data.internalNotes);
      }
      if (data.validUntil !== undefined) {
        updates.push('"VALID_UNTIL" = ?');
        params.push(data.validUntil);
      }

      // Add audit fields
      updates.push('"UPDATED_BY" = ?', '"UPDATED_DATE" = ?');
      params.push(data.updatedBy, currentDateTime);

      // Add ID parameter
      params.push(id);

      const query = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET ${updates.join(', ')}
        WHERE "SLNO" = ?
      `;

      await db.execute(query, params);

      // Handle line items update if provided
      if (data.lineItems && Array.isArray(data.lineItems)) {
        const quotation = await this.getQuotationById(id);
        const enquiry = quotation?.ENQUIRY_SLNO
          ? await db.queryOne<{ VINDETAILS?: string | null }>(
              `
                SELECT "VINDETAILS"
                FROM "${QUOTATION_DB_SCHEMA}"."DMS_SALESENQUIRY"
                WHERE "SLNO" = ?
              `,
              [quotation.ENQUIRY_SLNO]
            )
          : null;
        let selectedVehicleLines: Record<string, unknown>[] = [];
        if (enquiry?.VINDETAILS) {
          try {
            selectedVehicleLines = extractSelectedVehicleLines(JSON.parse(enquiry.VINDETAILS));
          } catch {
            selectedVehicleLines = [];
          }
        }

        // Delete existing line items
        const deleteLineItemsQuery = `
          DELETE FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
          WHERE "QUOTATION_SLNO" = ?
        `;
        await db.execute(deleteLineItemsQuery, [id]);

        // Insert new line items via stored procedure
        for (const [index, item] of data.lineItems.entries()) {
          const selectedVehicle = extractVehicleLineRecord(
            selectedVehicleLines[index] || selectedVehicleLines[0]
          );
          const vehicleDetails = this.buildLineVehicleDetails(item, selectedVehicle, {
            vehicleMake: data.vehicleMake || quotation?.VEHICLE_MAKE || undefined,
            vehicleModel: data.vehicleModel || quotation?.VEHICLE_MODEL || undefined,
            vehicleVariant: data.vehicleVariant || quotation?.VEHICLE_VARIANT || undefined,
            vehicleYear: data.vehicleYear || quotation?.VEHICLE_YEAR || undefined,
            vehicleColor: data.vehicleColor || quotation?.VEHICLE_COLOR || undefined,
            vinNumber: data.vinNumber || quotation?.VIN_NUMBER || undefined,
          });
          await this.insertQuotationLineItemViaSp(
            id,
            item,
            data.updatedBy,
            currentDateTime,
            vehicleDetails
          );
        }

        logger.info({ quotationId: id, lineItemsCount: data.lineItems.length }, 'Line items updated');
      }

      logger.info({ quotationId: id }, 'Quotation updated successfully');

      return { success: true };
    } catch (error: any) {
      logger.error('Error updating quotation:', error);
      throw new Error('Failed to update quotation: ' + error.message);
    }
  }

  /**
   * Supersede quotation - create new version
   */
  async supersedeQuotation(
    data: SupersedeQuotationInput & { createdBy: string; slpCode: string }
  ): Promise<{ success: boolean; id: number; quotationNumber: string }> {
    try {
      const resolvedParentId = await this.resolveLatestQuotationId(data.parentQuotationSlno);
      const parent = await this.getQuotationById(resolvedParentId);
      if (!parent) {
        throw new Error('Parent quotation not found');
      }

      if (parent.STATUS === 'Cancelled') {
        throw new Error('Cancelled quotation cannot be superseded');
      }

      if (parent.IS_LATEST_VERSION === 'N' || parent.STATUS === 'Superseded') {
        throw new Error('Only the latest quotation version can be superseded');
      }

      const newVersion = Number(parent.VERSION || 1) + 1;
      const parentPrimaryLine = parent.lineItems?.[0];
      const lineItemsToInsert: CreateQuotationInput['lineItems'] = data.lineItems?.length
        ? data.lineItems
        : (parent.lineItems || []).map((item) => ({
            lineNumber: Number(item.LINE_NUMBER) || 1,
            itemType:
              (item.ITEM_TYPE as
                | 'Vehicle'
                | 'Accessory'
                | 'Warranty'
                | 'Insurance'
                | 'ServicePackage'
                | 'Other') || 'Vehicle',
            itemCode: item.ITEM_CODE || undefined,
            itemDescription: item.ITEM_DESCRIPTION || '',
            itemCategory: item.ITEM_CATEGORY || undefined,
            quantity: Number(item.QUANTITY) || 1,
            unitPrice: Number(item.UNIT_PRICE) || 0,
            discountAmount: Number(item.DISCOUNT_AMOUNT) || 0,
            discountPercentage: Number(item.DISCOUNT_PERCENTAGE) || 0,
            netPrice: Number(item.NET_PRICE) || 0,
            taxIncluded: (item.TAX_INCLUDED === 'Y' ? 'Y' : 'N') as 'Y' | 'N',
            manufacturer: item.MANUFACTURER || undefined,
            partNumber: item.PART_NUMBER || undefined,
            warrantyPeriod: item.WARRANTY_PERIOD || undefined,
            notes: item.NOTES || undefined,
          }));

      const createPayload: CreateQuotationInput & { createdBy: string; slpCode: string } = {
        enquirySlno: Number(parent.ENQUIRY_SLNO),
        customerName: data.customerName || parent.CUSTOMER_NAME || '',
        customerMobile: data.customerMobile || parent.CUSTOMER_MOBILE || '',
        customerEmail: data.customerEmail || parent.CUSTOMER_EMAIL || '',
        customerAddress: data.customerAddress || parent.CUSTOMER_ADDRESS || '',
        vehicleMake:
          data.vehicleMake || parentPrimaryLine?.VEHICLE_MAKE || parent.VEHICLE_MAKE || '',
        vehicleModel:
          data.vehicleModel || parentPrimaryLine?.VEHICLE_MODEL || parent.VEHICLE_MODEL || '',
        vehicleVariant:
          data.vehicleVariant || parentPrimaryLine?.VEHICLE_VARIANT || parent.VEHICLE_VARIANT || '',
        vehicleYear:
          data.vehicleYear || parentPrimaryLine?.VEHICLE_YEAR || parent.VEHICLE_YEAR || '',
        vehicleColor:
          data.vehicleColor || parentPrimaryLine?.VEHICLE_COLOR || parent.VEHICLE_COLOR || '',
        vinNumber:
          data.vinNumber || parentPrimaryLine?.VIN_NUMBER || parent.VIN_NUMBER || '',
        vehicleBasePrice: data.vehicleBasePrice,
        vehicleDiscount: data.vehicleDiscount,
        vehicleNetPrice: data.vehicleNetPrice,
        accessoriesTotal: data.accessoriesTotal,
        accessoriesDiscount: data.accessoriesDiscount,
        accessoriesNetTotal: data.accessoriesNetTotal,
        warrantyTotal: data.warrantyTotal,
        insuranceTotal: data.insuranceTotal,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        grandTotal: data.grandTotal,
        tradeInValue: data.tradeInValue,
        tradeInAppraisalSlno: data.tradeInAppraisalSlno,
        financingSchemeSlno: data.financingSchemeSlno,
        downpayment: data.downpayment,
        netAmountDue: data.netAmountDue,
        totalDiscountAmount: data.totalDiscountAmount,
        discountPercentage: data.discountPercentage,
        validUntil: data.validUntil,
        notes: data.notes,
        termsAndConditions: data.termsAndConditions,
        internalNotes: data.internalNotes,
        status: data.status || 'Draft',
        lineItems: lineItemsToInsert,
        createdBy: data.createdBy,
        slpCode: data.slpCode,
      };

      const { quotationId, quotationNumber } = await this.createQuotationViaStoredProcedure(
        createPayload,
        { branch: parent.BRANCH || null }
      );

      const updateNewVersionQuery = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "VERSION" = ?, "PARENT_QUOTATION_SLNO" = ?, "IS_LATEST_VERSION" = 'Y'
        WHERE "SLNO" = ?
      `;
      await db.execute(updateNewVersionQuery, [newVersion, resolvedParentId, quotationId]);

      const updateParentQuery = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "IS_LATEST_VERSION" = 'N', "STATUS" = 'Superseded'
        WHERE "SLNO" = ?
      `;
      await db.execute(updateParentQuery, [resolvedParentId]);

      // Log activity on parent quotation
      await this.logActivity({
        quotationSlno: resolvedParentId,
        activityType: 'Superseded',
        activityDescription: `Superseded by ${quotationNumber}. Reason: ${data.reason}`,
        createdBy: data.createdBy,
      });

      // Log activity on new quotation
      await this.logActivity({
        quotationSlno: quotationId,
        activityType: 'Created',
        activityDescription: `Created as new version (V${newVersion}) of ${parent.QUOTATION_NUMBER}`,
        createdBy: data.createdBy,
      });

      logger.info({ quotationId, quotationNumber, version: newVersion }, 'Quotation superseded');

      return { success: true, id: quotationId, quotationNumber };
    } catch (error: any) {
      logger.error('Error superseding quotation:', error);
      throw new Error('Failed to supersede quotation: ' + error.message);
    }
  }

  /**
   * Request discount approval
   */
  async requestDiscountApproval(
    quotationId: number,
    data: RequestDiscountApprovalInput & { requestedBy: string; slpCode: string }
    ): Promise<{ success: boolean; id: number }> {
    try {
      const currentDateTime = this.getCurrentDateTime();
      const quotation = await this.getQuotationOrThrow(quotationId);
      this.ensureActionAllowed(quotation);
      const nextApprovalId = await getNextDiscountApprovalId();

      // Get user's discount limit
      const limitCheck = await this.checkDiscountLimit(data.discountAmount, data.requestedBy);

      const query = `
        INSERT INTO "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL" (
          "SLNO",
          "QUOTATION_SLNO", "REQUEST_TYPE", "DISCOUNT_AMOUNT", "DISCOUNT_PERCENTAGE",
          "JUSTIFICATION", "REQUESTED_BY", "REQUESTED_BY_SLPCODE",
          "USER_DISCOUNT_LIMIT", "AMOUNT_OVER_LIMIT",
          "STATUS", "ASSIGNED_TO", "REQUESTED_DATE",
          "CREATED_BY", "CREATED_DATE", "IS_DELETED"
        ) VALUES (?, ?, 'Discount', ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, 'N')
      `;

      await db.execute(query, [
        nextApprovalId,
        quotationId,
        data.discountAmount,
        data.discountPercentage,
        data.justification,
        data.requestedBy,
        data.slpCode,
        limitCheck.userLimit,
        limitCheck.overLimit,
        data.assignedTo,
        currentDateTime,
        data.requestedBy,
        currentDateTime,
      ]);

      // Update quotation to reflect pending approval
      const updateQuery = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "REQUIRES_APPROVAL" = 'Y', "DISCOUNT_APPROVAL_STATUS" = 'Pending'
        WHERE "SLNO" = ?
      `;
      await db.execute(updateQuery, [quotationId]);

      // Log activity
      await this.logActivity({
        quotationSlno: quotationId,
        activityType: 'DiscountApprovalRequested',
        activityDescription: `Discount approval requested from ${data.assignedTo}`,
        createdBy: data.requestedBy,
      });

      logger.info({ quotationId, approvalId: nextApprovalId }, 'Discount approval requested');

      return { success: true, id: nextApprovalId };
    } catch (error: any) {
      logger.error('Error requesting discount approval:', error);
      throw new Error('Failed to request discount approval: ' + error.message);
    }
  }

  /**
   * Approve or reject discount
   */
  async approveDiscount(
    approvalId: number,
    data: ApproveDiscountInput & { approvedBy: string; slpCode: string }
  ): Promise<{ success: boolean }> {
    try {
      const currentDateTime = this.getCurrentDateTime();

      // Update approval record
      const approvalQuery = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL"
        SET "STATUS" = ?, "APPROVED_BY" = ?, "APPROVED_BY_SLPCODE" = ?,
            "APPROVED_DATE" = ?, "APPROVAL_NOTES" = ?, "REJECTION_REASON" = ?,
            "UPDATED_BY" = ?, "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(approvalQuery, [
        data.approvalStatus,
        data.approvedBy,
        data.slpCode,
        currentDateTime,
        data.approvalNotes || null,
        data.rejectionReason || null,
        data.approvedBy,
        currentDateTime,
        approvalId,
      ]);

      // Get quotation ID for this approval
      const getQuotationQuery = `
        SELECT "QUOTATION_SLNO" FROM "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL"
        WHERE "SLNO" = ?
      `;
      const quotationResult = await db.query(getQuotationQuery, [approvalId]);
      const quotationId = quotationResult[0].QUOTATION_SLNO;

      // Update quotation status
      if (data.approvalStatus === 'Approved') {
        const quotationQuery = `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "DISCOUNT_APPROVAL_STATUS" = 'Approved',
              "DISCOUNT_APPROVED_BY" = ?,
              "DISCOUNT_APPROVED_DATE" = ?
          WHERE "SLNO" = ?
        `;
        await db.execute(quotationQuery, [data.approvedBy, currentDateTime, quotationId]);

        // Log activity
        await this.logActivity({
          quotationSlno: quotationId,
          activityType: 'DiscountApproved',
          activityDescription: `Discount approved by ${data.approvedBy}`,
          createdBy: data.approvedBy,
        });
      } else {
        const quotationQuery = `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "DISCOUNT_APPROVAL_STATUS" = 'Rejected'
          WHERE "SLNO" = ?
        `;
        await db.execute(quotationQuery, [quotationId]);

        // Log activity
        await this.logActivity({
          quotationSlno: quotationId,
          activityType: 'DiscountRejected',
          activityDescription: `Discount rejected by ${data.approvedBy}. Reason: ${data.rejectionReason}`,
          createdBy: data.approvedBy,
        });
      }

      logger.info({ approvalId, status: data.approvalStatus }, 'Discount approval processed');

      return { success: true };
    } catch (error: any) {
      logger.error('Error approving discount:', error);
      throw new Error('Failed to approve discount: ' + error.message);
    }
  }

  /**
   * Pass quotation to cashier
   */
  async passToCashier(
    quotationId: number,
    data: PassToCashierInput & { passedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const quotation = await this.getQuotationOrThrow(quotationId);
      this.ensureActionAllowed(quotation);
      const currentDateTime = this.getCurrentDateTime();

      const query = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "PASSED_TO_CASHIER" = 'Y',
            "PASSED_TO_CASHIER_DATE" = ?,
            "PASSED_TO_CASHIER_BY" = ?,
            "DEPOSIT_AMOUNT" = ?,
            "STATUS" = 'Sent',
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        currentDateTime,
        data.assignedTo,
        data.depositAmount || 0,
        data.passedBy,
        currentDateTime,
        quotationId,
      ]);

      // Log activity
      await this.logActivity({
        quotationSlno: quotationId,
        activityType: 'PassedToCashier',
        activityDescription: `Deposit request assigned to ${data.assignedTo}`,
        activityNotes: data.requestNotes,
        isFollowUp: 'Y',
        followUpAssignedTo: data.assignedTo,
        createdBy: data.passedBy,
      });

      logger.info({ quotationId }, 'Quotation passed to cashier');

      return { success: true };
    } catch (error: any) {
      logger.error('Error passing quotation to cashier:', error);
      throw new Error('Failed to pass quotation to cashier: ' + error.message);
    }
  }

  /**
   * Get open deposits (passed to cashier but not yet allocated)
   */
  async getOpenDeposits(): Promise<Quotation[]> {
    try {
      const query = `
        SELECT *
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "PASSED_TO_CASHIER" = 'Y'
          AND ("DEPOSIT_COLLECTED" IS NULL OR "DEPOSIT_COLLECTED" = 'N')
          AND "STATUS" NOT IN ('Cancelled', 'Superseded')
          AND "IS_DELETED" = 'N'
          AND COALESCE("DOC_TYPE", 'SQ') = 'SQ'
        ORDER BY "PASSED_TO_CASHIER_DATE" DESC, "UPDATED_DATE" DESC
      `;

      const quotations = await db.query<Quotation>(query);
      return await this.hydrateQuotationVehicleSummary(quotations);
    } catch (error: any) {
      logger.error('Error fetching open deposits:', error);
      throw new Error('Failed to fetch open deposits: ' + error.message);
    }
  }

  /**
   * Allocate/collect a deposit against a quotation
   */
  async allocateDeposit(
    quotationId: number,
    data: AllocateDepositInput & { allocatedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const currentDateTime = this.getCurrentDateTime();

      // Ensure quotation is passed to cashier first
      const quotation = await this.getQuotationOrThrow(quotationId);
      this.ensureActionAllowed(quotation);

      if (quotation.PASSED_TO_CASHIER !== 'Y') {
        throw new Error('Quotation has not been passed to cashier yet');
      }

      const query = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "DEPOSIT_AMOUNT" = ?,
            "DEPOSIT_COLLECTED" = 'Y',
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        data.depositAmount,
        data.allocatedBy,
        currentDateTime,
        quotationId,
      ]);

      await this.logActivity({
        quotationSlno: quotationId,
        activityType: 'DepositAllocated',
        activityDescription: `Deposit allocated: ${data.depositAmount}`,
        activityNotes: data.allocationNotes,
        createdBy: data.allocatedBy,
      });

      logger.info({ quotationId, amount: data.depositAmount }, 'Deposit allocated successfully');

      return { success: true };
    } catch (error: any) {
      logger.error('Error allocating deposit:', error);
      throw new Error('Failed to allocate deposit: ' + error.message);
    }
  }

  /**
   * Reserve vehicle directly from quotation
   */
  async reserveVehicle(
    quotationId: number,
    data: ReserveVehicleInput & { reservedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const resolvedQuotationId = await this.resolveLatestQuotationId(quotationId);
      const quotation = await this.getQuotationOrThrow(resolvedQuotationId);
      this.ensureActionAllowed(quotation);

      if (!quotation.VIN_NUMBER || quotation.VIN_NUMBER.trim() === '') {
        throw new Error('Quotation must have a VIN before reserving vehicle');
      }

      const existingReservationForCurrentQuotation = isVehicleReservationActive(
        quotation.VEHICLE_RESERVED,
        quotation.VEHICLE_RESERVATION_TO_DATE ||
          extractReservationDateFromNotes(
            quotation.VEHICLE_RESERVATION_NOTES,
            'Reservation To'
          )
      );

      if (existingReservationForCurrentQuotation) {
        throw new ConflictError('Vehicle is already reserved for this quotation');
      }

      const conflictingReservation = await findActiveVehicleReservation({
        vinNumber: quotation.VIN_NUMBER,
        quotationSchema: QUOTATION_DB_SCHEMA,
        salesOrderSchema: process.env.SALES_ORDER_DB_SCHEMA?.trim().toUpperCase() || QUOTATION_DB_SCHEMA,
        excludeQuotationId: resolvedQuotationId,
      });

      if (conflictingReservation) {
        throw new ConflictError(
          buildVehicleReservationConflictMessage(
            quotation.VIN_NUMBER,
            conflictingReservation
          )
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      const query = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "VEHICLE_RESERVED" = 'Y',
            "VEHICLE_RESERVED_DATE" = ?,
            "VEHICLE_RESERVED_BY" = ?,
            "VEHICLE_RESERVATION_FROM_DATE" = ?,
            "VEHICLE_RESERVATION_TO_DATE" = ?,
            "VEHICLE_RESERVATION_NOTES" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      try {
        await db.execute(query, [
          currentDateTime,
          data.reservedBy,
          data.reservationFromDate || null,
          data.reservationToDate || null,
          data.reservationNotes || null,
          data.reservedBy,
          currentDateTime,
          resolvedQuotationId,
        ]);
      } catch (error: any) {
        const message = String(error?.message || '');
        const missingReservationRangeColumns =
          message.includes('invalid column name: VEHICLE_RESERVATION_FROM_DATE') ||
          message.includes('invalid column name: VEHICLE_RESERVATION_TO_DATE');

        if (!missingReservationRangeColumns) {
          throw error;
        }

        logger.warn(
          {
            resolvedQuotationId,
            reservationFromDate: data.reservationFromDate || null,
            reservationToDate: data.reservationToDate || null,
          },
          'Reservation date range columns are missing; falling back to legacy quotation reservation update'
        );

        const fallbackQuery = `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "VEHICLE_RESERVED" = 'Y',
              "VEHICLE_RESERVED_DATE" = ?,
              "VEHICLE_RESERVED_BY" = ?,
              "VEHICLE_RESERVATION_NOTES" = ?,
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = ?
          WHERE "SLNO" = ?
        `;

        await db.execute(fallbackQuery, [
          currentDateTime,
          data.reservedBy,
          this.buildLegacyReservationNotes(
            data.reservationNotes,
            data.reservationFromDate,
            data.reservationToDate
          ),
          data.reservedBy,
          currentDateTime,
          resolvedQuotationId,
        ]);
      }

      await this.logActivity({
        quotationSlno: resolvedQuotationId,
        activityType: 'VehicleReserved',
        activityDescription: `Vehicle reserved for VIN ${quotation.VIN_NUMBER}`,
        activityNotes: data.reservationNotes,
        createdBy: data.reservedBy,
      });

      logger.info(
        {
          requestedQuotationId: quotationId,
          resolvedQuotationId,
          vin: quotation.VIN_NUMBER,
        },
        'Vehicle reserved for quotation'
      );
      return { success: true };
    } catch (error: any) {
      logger.error('Error reserving vehicle for quotation:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error('Failed to reserve vehicle: ' + error.message);
    }
  }

  /**
   * Cancel quotation
   */
  async cancelQuotation(
    quotationId: number,
    data: CancelQuotationInput & { cancelledBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const quotation = await this.getQuotationOrThrow(quotationId);
      this.ensureActionAllowed(quotation);
      const currentDateTime = this.getCurrentDateTime();

      const query = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "STATUS" = 'Cancelled',
            "REQUIRES_APPROVAL" = 'N',
            "DISCOUNT_APPROVAL_STATUS" = 'Cancelled',
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [data.cancelledBy, currentDateTime, quotationId]);

      // Cancel any pending discount approval requests linked to this quotation.
      const cancelPendingApprovalsQuery = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL"
        SET "STATUS" = 'Cancelled',
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "QUOTATION_SLNO" = ?
          AND "STATUS" = 'Pending'
          AND "IS_DELETED" = 'N'
      `;

      await db.execute(cancelPendingApprovalsQuery, [
        data.cancelledBy,
        currentDateTime,
        quotationId,
      ]);

      await this.logActivity({
        quotationSlno: quotationId,
        activityType: 'Cancelled',
        activityDescription: 'Quotation cancelled',
        activityNotes: data.cancellationReason,
        createdBy: data.cancelledBy,
      });

      logger.info({ quotationId }, 'Quotation cancelled');
      return { success: true };
    } catch (error: any) {
      logger.error('Error cancelling quotation:', error);
      throw new Error('Failed to cancel quotation: ' + error.message);
    }
  }

  /**
   * Log activity
   */
  async logActivity(
    data: Omit<CreateActivityInput, 'isFollowUp'> & {
      createdBy: string;
      isFollowUp?: 'Y' | 'N';
    }
  ): Promise<void> {
    try {
      const currentDateTime = this.getCurrentDateTime();

      const query = `
        INSERT INTO "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_ACTIVITY" (
          "QUOTATION_SLNO", "ACTIVITY_TYPE", "ACTIVITY_DESCRIPTION", "ACTIVITY_NOTES",
          "IS_FOLLOW_UP", "FOLLOW_UP_DATE", "FOLLOW_UP_ASSIGNED_TO", "FOLLOW_UP_STATUS",
          "CREATED_BY", "CREATED_DATE", "IS_DELETED"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, 'N')
      `;

      await db.execute(query, [
        data.quotationSlno,
        data.activityType,
        data.activityDescription || null,
        data.activityNotes || null,
        data.isFollowUp || 'N',
        data.followUpDate || null,
        data.followUpAssignedTo || null,
        data.createdBy,
        currentDateTime,
      ]);
    } catch (error: any) {
      logger.error('Error logging activity:', error);
      // Don't throw - activity logging should not break main operations
    }
  }

  /**
   * Delete quotation (soft delete)
   */
  async deleteQuotation(id: number, deletedBy: string): Promise<{ success: boolean }> {
    try {
      const currentDateTime = this.getCurrentDateTime();

      const query = `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "IS_DELETED" = 'Y', "UPDATED_BY" = ?, "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [deletedBy, currentDateTime, id]);

      logger.info({ quotationId: id }, 'Quotation deleted');

      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting quotation:', error);
      throw new Error('Failed to delete quotation: ' + error.message);
    }
  }

  /**
   * Get pending discount approvals for a manager
   */
  async getPendingApprovals(assignedTo?: string): Promise<DiscountApproval[]> {
    try {
      let query = `
        SELECT * FROM "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL"
        WHERE "STATUS" = 'Pending' AND "IS_DELETED" = 'N'
      `;
      const params: any[] = [];

      if (assignedTo) {
        query += ` AND "ASSIGNED_TO" = ?`;
        params.push(assignedTo);
      }

      query += ` ORDER BY "REQUESTED_DATE" DESC`;

      return await db.query(query, params);
    } catch (error: any) {
      logger.error('Error fetching pending approvals:', error);
      throw new Error('Failed to fetch pending approvals: ' + error.message);
    }
  }

  /**
   * Get all discount approval requests with optional filters
   */
  async getAllDiscountApprovals(filters?: DiscountApprovalFilters): Promise<DiscountApproval[]> {
    try {
      let query = `
        SELECT
          da.*,
          q."QUOTATION_NUMBER",
          q."CUSTOMER_NAME",
          q."VEHICLE_MAKE",
          q."VEHICLE_MODEL"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL" da
        LEFT JOIN "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION" q ON da."QUOTATION_SLNO" = q."SLNO"
        WHERE da."IS_DELETED" = 'N'
      `;

      const params: any[] = [];

      if (filters?.status) {
        query += ` AND da."STATUS" = ?`;
        params.push(filters.status);
      }

      if (filters?.assignedTo) {
        query += ` AND da."ASSIGNED_TO" = ?`;
        params.push(filters.assignedTo);
      }

      if (filters?.requestedBySlpCode) {
        query += ` AND da."REQUESTED_BY_SLPCODE" = ?`;
        params.push(filters.requestedBySlpCode);
      }

      if (filters?.dateFrom) {
        query += ` AND da."REQUESTED_DATE" >= ?`;
        params.push(filters.dateFrom);
      }

      if (filters?.dateTo) {
        query += ` AND da."REQUESTED_DATE" <= ?`;
        params.push(filters.dateTo);
      }

      query += ` ORDER BY da."REQUESTED_DATE" DESC`;

      const result = await db.query(query, params);
      return result as DiscountApproval[];
    } catch (error: any) {
      logger.error('Error fetching discount approvals:', error);
      throw new Error('Failed to fetch discount approvals: ' + error.message);
    }
  }

  /**
   * Get pending discount approvals assigned to a specific user
   */
  async getPendingDiscountApprovals(assignedTo: string): Promise<DiscountApproval[]> {
    try {
      const query = `
        SELECT
          da.*,
          q."QUOTATION_NUMBER",
          q."CUSTOMER_NAME",
          q."VEHICLE_MAKE",
          q."VEHICLE_MODEL"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_DISCOUNT_APPROVAL" da
        LEFT JOIN "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION" q ON da."QUOTATION_SLNO" = q."SLNO"
        WHERE da."IS_DELETED" = 'N'
          AND da."STATUS" = 'Pending'
          AND da."ASSIGNED_TO" = ?
        ORDER BY da."REQUESTED_DATE" DESC
      `;

      const result = await db.query(query, [assignedTo]);
      return result as DiscountApproval[];
    } catch (error: any) {
      logger.error('Error fetching pending discount approvals:', error);
      throw new Error('Failed to fetch pending discount approvals: ' + error.message);
    }
  }

  /**
   * Get all activities for a quotation
   */
  async getQuotationActivities(quotationSlno: number) {
    try {
      const query = `
        SELECT *
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_ACTIVITY"
        WHERE "QUOTATION_SLNO" = ? AND "IS_DELETED" = 'N'
        ORDER BY "CREATED_DATE" DESC
      `;

      return await db.query(query, [quotationSlno]);
    } catch (error: any) {
      logger.error('Error fetching quotation activities:', error);
      throw new Error('Failed to fetch quotation activities: ' + error.message);
    }
  }

  /**
   * Convert a quotation to a sales order via the SAP Convert Sales Documents API
   */
  async confirmToSalesOrder(quotationId: number, actor = 'SYSTEM'): Promise<{
    targetDocumentNumber: string;
    status: string;
    errorCode: string;
  }> {
    const quotation = await this.getQuotationById(quotationId, { resolveLatest: true });
    if (!quotation) throw new Error('Quotation not found');

    const isAlreadyConfirmed =
      normalizeText(quotation.SAPSTATUS).toLowerCase() === 'success';
    const hasSapQuotationReference = [
      quotation.SAPDOCENTRY,
      quotation.SAPDOCNUM,
      isAlreadyConfirmed ? null : quotation.SAPREFENTRY,
    ].some((value) => {
      const numericValue = Number(normalizeText(value));
      return Number.isInteger(numericValue) && numericValue > 0;
    });

    if (!hasSapQuotationReference) {
      throw new Error('Quotation has not been posted or synced to SAP yet. Please sync the SAP quotation reference first.');
    }

    // Get enquiry for CardCode and VIN metadata. Currency is stored inside VINDETAILS
    // in this schema, not as a direct DMS_SALESENQUIRY column.
    const enquiry = quotation.ENQUIRY_SLNO
      ? await db.queryOne<{ CUSTOMERID?: string; VINDETAILS?: string | null }>(
          `SELECT "CUSTOMERID", "VINDETAILS" FROM "${QUOTATION_DB_SCHEMA}"."DMS_SALESENQUIRY" WHERE "SLNO" = ?`,
          [quotation.ENQUIRY_SLNO]
        )
      : null;

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cardCode = normalizeText(quotation.CUSTOMER_CODE) || normalizeText(enquiry?.CUSTOMERID);
    let vinDetails: unknown = null;
    if (enquiry?.VINDETAILS) {
      try {
        vinDetails = JSON.parse(enquiry.VINDETAILS);
      } catch {
        vinDetails = null;
      }
    }
    const selectedVehicle = extractVehicleLineRecord(extractSelectedVehicleLines(vinDetails)[0]);
    const currency =
      extractFromKeys(selectedVehicle, ['Currency', 'CURRENCY', 'currency', 'Curr', 'CURR']) ||
      extractFromKeys(vinDetails, ['Currency', 'CURRENCY', 'currency', 'Curr', 'CURR']) ||
      'SAR';
    const warehouseFallback =
      extractFromKeys(selectedVehicle, ['WhsCode', 'WHSCODE', 'whsCode', 'Warehouse', 'warehouse']) ||
      extractFromKeys(vinDetails, ['WhsCode', 'WHSCODE', 'whsCode', 'Warehouse', 'warehouse']);
    const lines = (quotation.lineItems || []).map((item, index) => {
      const storedLineNumber = Number(item.LINE_NUMBER);
      const baseLineNumber =
        Number.isFinite(storedLineNumber) && storedLineNumber > 0
          ? storedLineNumber - 1
          : index;

      return {
        LineNumber: String(baseLineNumber),
        ItemCode: normalizeText(item.ITEM_CODE),
        Quantity: String(Number(item.QUANTITY) || 1),
        Warehouse: normalizeText(item.WHSCODE) || warehouseFallback,
      };
    });

    if (!cardCode) {
      throw new AppError('Customer code is required to convert quotation to sales order.', 400, 'MISSING_CUSTOMER_CODE');
    }

    if (lines.length === 0) {
      throw new AppError('At least one quotation line is required to convert to sales order.', 400, 'MISSING_QUOTATION_LINES');
    }

    const missingItemCodeLine = lines.find((line) => !line.ItemCode);
    if (missingItemCodeLine) {
      throw new AppError('All quotation lines must have an item code before converting to sales order.', 400, 'MISSING_ITEM_CODE');
    }

    const sapBase = await this.resolveSapQuotationBase(
      env.CONVERT_SALES_DOC_COMPANY_DB,
      quotation,
      lines
    );

    const payload = {
      CompanyDB: sapBase.companyDb,
      CardCode: cardCode,
      CardName: normalizeText(quotation.CUSTOMER_NAME),
      DocDate: today,
      DocDueDate: today,
      SourceDocument: 'SQ',
      TargetDocument: 'SO',
      NumAtCard: normalizeText(quotation.ROOT_QUOTATION_NUMBER) || normalizeText(quotation.QUOTATION_NUMBER),
      Currency: currency,
      ExRate: '1',
      SlpCode: normalizeText(quotation.SLPCODE),
      Comments: normalizeText(quotation.NOTES),
      BaseDocuments: [
        {
          BaseEntry: sapBase.baseEntry,
          ConvertOption: env.CONVERT_SALES_DOC_OPTION,
          Lines: sapBase.lines,
        },
      ],
    };

    const apiUrl = `${env.CONVERT_SALES_DOC_API_URL.replace(/\/+$/, '')}/api/negt/ConvertSalesDocument`;
    logger.info({ quotationId, apiUrl, payload }, 'Calling Convert Sales Documents API');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Convert API returned non-JSON response: ${text}`);
    }

    logger.info({ quotationId, response: data }, 'Convert Sales Documents API response');

    if (!response.ok || String(data.ErrorCode) !== '200') {
      throw new AppError(
        [
          `SAP Convert API failed (${data.ErrorCode || response.status}): ${data.ErrorMessage || data.Status || text}`,
          `Sent CompanyDB=${payload.CompanyDB}`,
          `SourceDocument=${payload.SourceDocument}`,
          `TargetDocument=${payload.TargetDocument}`,
          `BaseEntry=${payload.BaseDocuments[0]?.BaseEntry}`,
          `ConvertOption=${payload.BaseDocuments[0]?.ConvertOption}`,
          `Lines=${JSON.stringify(payload.BaseDocuments[0]?.Lines || [])}`,
        ].join(' | '),
        502,
        'SAP_CONVERT_ERROR'
      );
    }

    await db.execute(
      `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "SAPREFENTRY" = ?,
            "SAPSTATUS" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `,
      [
        String(data.TargetDocumentNumber || ''),
        String(data.Status || ''),
        actor,
        this.getCurrentDateTime(),
        quotation.SLNO,
      ]
    );

    return {
      targetDocumentNumber: String(data.TargetDocumentNumber || ''),
      status: String(data.Status || ''),
      errorCode: String(data.ErrorCode || ''),
    };
  }

  async hasSapSalesOrderForQuotation(quotationId: number): Promise<boolean> {
    const quotation = await this.getQuotationById(quotationId, { resolveLatest: true });
    if (!quotation) return false;

    const candidates = Array.from(
      new Set(
        [quotation.SAPREFENTRY, quotation.SAPDOCNUM, quotation.SAPDOCENTRY]
          .map((value) => Number(normalizeText(value)))
          .filter((value) => Number.isInteger(value) && value > 0)
      )
    );

    const conditions: string[] = [];
    const params: Array<string | number> = [];

    if (candidates.length > 0) {
      const placeholders = candidates.map(() => '?').join(', ');
      conditions.push(`"DocNum" IN (${placeholders})`);
      params.push(...candidates);
      conditions.push(`"DocEntry" IN (${placeholders})`);
      params.push(...candidates);
    }

    conditions.push(`"U_ECOMREFNUM" = ?`);
    params.push(String(quotation.SLNO));

    const sapOrder = await db.queryOne<{ EXISTS_FLAG: number }>(
      `
        SELECT 1 AS "EXISTS_FLAG"
        FROM "${normalizeSapIdentifier(env.CONVERT_SALES_DOC_COMPANY_DB, 'CompanyDB')}"."ORDR"
        WHERE ${conditions.map((condition) => `(${condition})`).join(' OR ')}
        LIMIT 1
      `,
      params
    );

    return Boolean(sapOrder);
  }
}

// Export singleton instance
export const quotationService = new QuotationService();

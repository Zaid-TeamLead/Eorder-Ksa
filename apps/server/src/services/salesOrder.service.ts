import { db } from './database.service.js';
import { logger } from '../utils/logger.js';
import { AppError, ConflictError } from '../types/errors.js';
import { quotationService } from './quotation.service.js';
import type {
  CancelSalesOrderInput,
  CreateSalesOrderFromQuotationInput,
  CreateHandoverBookingInput,
  PassToVehicleAdminInput,
  ReserveVehicleInput,
  RecordLostSaleInput,
  SalesOrderFilters,
  UpdateSalesOrderInput,
} from '../schemas/salesOrder.schema.js';
import {
  buildVehicleReservationConflictMessage,
  extractReservationDateFromNotes,
  findActiveVehicleReservation,
  isVehicleReservationActive,
} from '../utils/vehicle-reservation.js';

const SALES_ORDER_DB_SCHEMA = (() => {
  const raw = process.env.SALES_ORDER_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid SALES_ORDER_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const QUOTATION_DB_SCHEMA = (() => {
  const raw = process.env.QUOTATION_DB_SCHEMA || SALES_ORDER_DB_SCHEMA;
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid QUOTATION_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const SAP_COMPANY_DB_SCHEMA = (() => {
  const raw = process.env.CONVERT_SALES_DOC_COMPANY_DB || 'NEKSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid CONVERT_SALES_DOC_COMPANY_DB identifier: ${raw}`);
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

const SALES_ORDER_DOC_TYPE = 'SO';
const QUOTATION_DOC_TYPE = 'SQ';

export interface SalesOrder {
  SLNO: number;
  SALES_ORDER_NUMBER: string;
  QUOTATION_SLNO: number;
  ENQUIRY_SLNO: number;
  VERSION: number;
  PARENT_ORDER_SLNO?: number | null;
  IS_LATEST_VERSION: 'Y' | 'N';
  CUSTOMER_NAME?: string | null;
  CUSTOMER_MOBILE?: string | null;
  CUSTOMER_EMAIL?: string | null;
  SAPDOCNUM?: string | null;
  SAPDOCENTRY?: string | null;
  SAPREFENTRY?: string | null;
  SAPSTATUS?: string | null;
  VEHICLE_MAKE?: string | null;
  VEHICLE_MODEL?: string | null;
  VEHICLE_VARIANT?: string | null;
  VIN_NUMBER?: string | null;
  GRAND_TOTAL: number;
  STATUS: string;
  NOTES?: string | null;
  VEHICLE_RESERVED?: 'Y' | 'N' | null;
  VEHICLE_RESERVED_DATE?: string | null;
  VEHICLE_RESERVED_BY?: string | null;
  VEHICLE_RESERVATION_NOTES?: string | null;
  HANDOVER_BOOKED?: 'Y' | 'N' | null;
  HANDOVER_DATE?: string | null;
  HANDOVER_TIME?: string | null;
  HANDOVER_LOCATION?: string | null;
  HANDOVER_NOTES?: string | null;
  HANDOVER_BOOKED_BY?: string | null;
  HANDOVER_BOOKED_DATE?: string | null;
  PRINTED_BY?: string | null;
  PRINTED_DATE?: string | null;
  PASSED_TO_VEHICLE_ADMIN?: 'Y' | 'N' | null;
  PASSED_TO_VA_DATE?: string | null;
  PASSED_TO_VA_BY?: string | null;
  VEHICLE_ADMIN_ASSIGNED_TO?: string | null;
  VEHICLE_ADMIN_NOTES?: string | null;
  IS_LOST_SALE?: 'Y' | 'N' | null;
  LOST_SALE_DATE?: string | null;
  LOST_REASON?: string | null;
  LOST_NOTES?: string | null;
  CANCELLATION_REASON?: string | null;
  CANCELLED_DATE?: string | null;
  CANCELLED_BY?: string | null;
  SLPCODE: string;
  CREATED_BY: string;
  CREATED_DATE: string;
  UPDATED_BY?: string | null;
  UPDATED_DATE?: string | null;
  IS_DELETED: 'Y' | 'N';
}

export interface SalesOrderQuotation {
  [key: string]: any;
}

export interface SalesOrderQuotationLineItem {
  [key: string]: any;
}

export interface SalesOrderEnquiry {
  [key: string]: any;
  VINDETAILS?: unknown;
  CHARGEDETAILS?: unknown;
}

export interface SalesOrderFinancingScheme {
  [key: string]: any;
}

export interface SalesOrderDetails extends SalesOrder {
  quotation?: SalesOrderQuotation | null;
  lineItems?: SalesOrderQuotationLineItem[];
  enquiry?: SalesOrderEnquiry | null;
  financingSchemes?: SalesOrderFinancingScheme[];
}

interface SourceQuotationRecord {
  [key: string]: any;
  SLNO: number;
  ENQUIRY_SLNO: number;
  QUOTATION_NUMBER: string;
  CUSTOMER_CODE?: string | null;
  CUSTOMER_NAME?: string | null;
  CUSTOMER_MOBILE?: string | null;
  CUSTOMER_EMAIL?: string | null;
  CUSTOMER_ADDRESS?: string | null;
  VEHICLE_BASE_PRICE?: number | null;
  VEHICLE_DISCOUNT?: number | null;
  VEHICLE_NET_PRICE?: number | null;
  ACCESSORIES_TOTAL?: number | null;
  ACCESSORIES_DISCOUNT?: number | null;
  ACCESSORIES_NET_TOTAL?: number | null;
  WARRANTY_TOTAL?: number | null;
  INSURANCE_TOTAL?: number | null;
  SUBTOTAL?: number | null;
  TAX_RATE?: number | null;
  TAX_AMOUNT?: number | null;
  GRAND_TOTAL?: number | null;
  TRADE_IN_VALUE?: number | null;
  TRADE_IN_APPRAISAL_SLNO?: number | null;
  FINANCING_SCHEME_SLNO?: number | null;
  DOWNPAYMENT?: number | null;
  NET_AMOUNT_DUE?: number | null;
  TOTAL_DISCOUNT_AMOUNT?: number | null;
  DISCOUNT_PERCENTAGE?: number | null;
  STATUS?: string | null;
  VALID_UNTIL?: string | null;
  NOTES?: string | null;
  TERMS_AND_CONDITIONS?: string | null;
  INTERNAL_NOTES?: string | null;
  SALESPERSON?: string | null;
  SLPCODE?: string | null;
  BRANCH?: string | null;
  SAPDOCNUM?: string | null;
  SAPDOCENTRY?: string | null;
  SAPREFENTRY?: string | null;
  SAPSTATUS?: string | null;
}

interface SalesOrderPrimaryLineSummary {
  QUOTATION_SLNO: number;
  VEHICLE_MAKE?: string | null;
  VEHICLE_MODEL?: string | null;
  VEHICLE_VARIANT?: string | null;
  VIN_NUMBER?: string | null;
}

class SalesOrderService {
  private getCreateDocumentHeaderSpSql(): string {
    return `CALL "${QUOTATION_DB_SCHEMA}"."${CREATE_QUOTATION_SP_NAME}"(${Array(40)
      .fill('?')
      .join(', ')})`;
  }

  private getCreateDocumentLineSpSql(): string {
    return `CALL "${QUOTATION_DB_SCHEMA}"."${CREATE_QUOTATION_LINE_SP_NAME}"(${Array(25)
      .fill('?')
      .join(', ')})`;
  }

  private getCurrentDateTime(): string {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  private parseJsonField<T>(value: unknown): T | null {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'object') return value as T;
    try {
      return JSON.parse(String(value)) as T;
    } catch {
      return null;
    }
  }

  private normalizeText(value: unknown): string {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  private async resolveSapSalesOrderReference(
    reference: unknown
  ): Promise<{ sapDocEntry: string; sapDocNum: string } | null> {
    const normalizedReference = this.normalizeText(reference);
    if (!normalizedReference || !/^\d+$/.test(normalizedReference)) {
      return null;
    }

    const numericReference = Number(normalizedReference);

    try {
      const sapOrder = await db.queryOne<{
        SAP_DOC_ENTRY?: number;
        SAP_DOC_NUM?: number;
        DocEntry?: number;
        DocNum?: number;
      }>(
        `
          SELECT
            "DocEntry" AS "SAP_DOC_ENTRY",
            "DocNum" AS "SAP_DOC_NUM"
          FROM "${SAP_COMPANY_DB_SCHEMA}"."ORDR"
          WHERE "DocNum" = ? OR "DocEntry" = ?
          ORDER BY "DocEntry" DESC
          LIMIT 1
        `,
        [numericReference, numericReference]
      );

      if (!sapOrder) {
        return null;
      }

      const sapDocEntry = sapOrder.SAP_DOC_ENTRY ?? sapOrder.DocEntry;
      const sapDocNum = sapOrder.SAP_DOC_NUM ?? sapOrder.DocNum;

      if (!sapDocEntry || !sapDocNum) {
        return null;
      }

      return {
        sapDocEntry: String(sapDocEntry),
        sapDocNum: String(sapDocNum),
      };
    } catch (error) {
      logger.warn(
        { reference: normalizedReference, companyDb: SAP_COMPANY_DB_SCHEMA, error },
        'Unable to resolve SAP sales order reference'
      );
      return null;
    }
  }

  private async syncSapSalesOrderReference(
    salesOrderSlno: number,
    quotation: SourceQuotationRecord,
    updatedBy: string,
    updatedDate: string
  ): Promise<void> {
    const sourceSapOrderNumber = this.normalizeText(quotation.SAPREFENTRY);
    if (!sourceSapOrderNumber) {
      return;
    }

    const resolvedSapOrder = await this.resolveSapSalesOrderReference(sourceSapOrderNumber);

    await db.execute(
      `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "SAPDOCENTRY" = ?,
            "SAPDOCNUM" = ?,
            "SAPREFENTRY" = ?,
            "SAPSTATUS" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
        WHERE "SLNO" = ?
          AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
      `,
      [
        resolvedSapOrder?.sapDocEntry || null,
        resolvedSapOrder?.sapDocNum || sourceSapOrderNumber,
        sourceSapOrderNumber,
        quotation.SAPSTATUS || 'Success',
        updatedBy,
        updatedDate,
        salesOrderSlno,
      ]
    );
  }

  private async getEnquiryCharge(enquiryId: number): Promise<Record<string, any> | null> {
    try {
      return await db.queryOne<Record<string, any>>(
        `
        SELECT "CHARGECODE", "CHARGENAME", "CHARGEPRICE", "CHARGEDETAILS"
        FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALESENQUIRY_CHARGES"
        WHERE "ENQUIRY_SLNO" = ? AND COALESCE("IS_DELETED", 'N') = 'N'
        ORDER BY "SLNO" DESC
        LIMIT 1
      `,
        [enquiryId]
      );
    } catch (error) {
      logger.warn(
        { enquiryId, error },
        'Unable to load sales enquiry charge details for sales order'
      );
      return null;
    }
  }

  private getSalesOrderSelectColumns(alias: string): string {
    return `
      ${alias}."SLNO" AS "SLNO",
      ${alias}."QUOTATION_NUMBER" AS "SALES_ORDER_NUMBER",
      ${alias}."SOURCE_QUOTATION_SLNO" AS "QUOTATION_SLNO",
      ${alias}."ENQUIRY_SLNO" AS "ENQUIRY_SLNO",
      ${alias}."VERSION" AS "VERSION",
      ${alias}."PARENT_QUOTATION_SLNO" AS "PARENT_ORDER_SLNO",
      ${alias}."IS_LATEST_VERSION" AS "IS_LATEST_VERSION",
      ${alias}."CUSTOMER_NAME" AS "CUSTOMER_NAME",
      ${alias}."CUSTOMER_MOBILE" AS "CUSTOMER_MOBILE",
      ${alias}."CUSTOMER_EMAIL" AS "CUSTOMER_EMAIL",
      ${alias}."SAPDOCNUM" AS "SAPDOCNUM",
      ${alias}."SAPDOCENTRY" AS "SAPDOCENTRY",
      ${alias}."SAPREFENTRY" AS "SAPREFENTRY",
      ${alias}."SAPSTATUS" AS "SAPSTATUS",
      CAST(NULL AS NVARCHAR(100)) AS "VEHICLE_MAKE",
      CAST(NULL AS NVARCHAR(100)) AS "VEHICLE_MODEL",
      CAST(NULL AS NVARCHAR(100)) AS "VEHICLE_VARIANT",
      CAST(NULL AS NVARCHAR(100)) AS "VIN_NUMBER",
      ${alias}."GRAND_TOTAL" AS "GRAND_TOTAL",
      ${alias}."STATUS" AS "STATUS",
      ${alias}."NOTES" AS "NOTES",
      ${alias}."VEHICLE_RESERVED" AS "VEHICLE_RESERVED",
      ${alias}."VEHICLE_RESERVED_DATE" AS "VEHICLE_RESERVED_DATE",
      ${alias}."VEHICLE_RESERVED_BY" AS "VEHICLE_RESERVED_BY",
      ${alias}."VEHICLE_RESERVATION_NOTES" AS "VEHICLE_RESERVATION_NOTES",
      ${alias}."HANDOVER_BOOKED" AS "HANDOVER_BOOKED",
      ${alias}."HANDOVER_DATE" AS "HANDOVER_DATE",
      ${alias}."HANDOVER_TIME" AS "HANDOVER_TIME",
      ${alias}."HANDOVER_LOCATION" AS "HANDOVER_LOCATION",
      ${alias}."HANDOVER_NOTES" AS "HANDOVER_NOTES",
      ${alias}."HANDOVER_BOOKED_BY" AS "HANDOVER_BOOKED_BY",
      ${alias}."HANDOVER_BOOKED_DATE" AS "HANDOVER_BOOKED_DATE",
      ${alias}."PRINTED_BY" AS "PRINTED_BY",
      ${alias}."PRINTED_DATE" AS "PRINTED_DATE",
      ${alias}."PASSED_TO_VEHICLE_ADMIN" AS "PASSED_TO_VEHICLE_ADMIN",
      ${alias}."PASSED_TO_VA_DATE" AS "PASSED_TO_VA_DATE",
      ${alias}."PASSED_TO_VA_BY" AS "PASSED_TO_VA_BY",
      ${alias}."VEHICLE_ADMIN_ASSIGNED_TO" AS "VEHICLE_ADMIN_ASSIGNED_TO",
      ${alias}."VEHICLE_ADMIN_NOTES" AS "VEHICLE_ADMIN_NOTES",
      ${alias}."IS_LOST_SALE" AS "IS_LOST_SALE",
      ${alias}."LOST_SALE_DATE" AS "LOST_SALE_DATE",
      ${alias}."LOST_REASON" AS "LOST_REASON",
      ${alias}."LOST_NOTES" AS "LOST_NOTES",
      ${alias}."CANCELLATION_REASON" AS "CANCELLATION_REASON",
      ${alias}."CANCELLED_DATE" AS "CANCELLED_DATE",
      ${alias}."CANCELLED_BY" AS "CANCELLED_BY",
      ${alias}."SLPCODE" AS "SLPCODE",
      ${alias}."CREATED_BY" AS "CREATED_BY",
      ${alias}."CREATED_DATE" AS "CREATED_DATE",
      ${alias}."UPDATED_BY" AS "UPDATED_BY",
      ${alias}."UPDATED_DATE" AS "UPDATED_DATE",
      ${alias}."IS_DELETED" AS "IS_DELETED"
    `;
  }

  private async hydrateSalesOrderVehicleSummary<T extends SalesOrder>(orders: T[]): Promise<T[]> {
    if (orders.length === 0) {
      return orders;
    }

    const orderIds = Array.from(
      new Set(
        orders
          .map((order) => Number(order.SLNO))
          .filter((orderId) => Number.isFinite(orderId) && orderId > 0)
      )
    );

    if (orderIds.length === 0) {
      return orders;
    }

    const placeholders = orderIds.map(() => '?').join(', ');
    const lineRows = await db.query<SalesOrderPrimaryLineSummary>(
      `
        SELECT
          "QUOTATION_SLNO",
          "VEHICLE_MAKE",
          "VEHICLE_MODEL",
          "VEHICLE_VARIANT",
          "VIN_NUMBER"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
        WHERE "QUOTATION_SLNO" IN (${placeholders})
          AND "IS_DELETED" = 'N'
        ORDER BY "QUOTATION_SLNO", "LINE_NUMBER", "SLNO"
      `,
      orderIds
    );

    const primaryLineByOrderId = new Map<number, SalesOrderPrimaryLineSummary>();
    for (const lineRow of lineRows) {
      const orderId = Number(lineRow.QUOTATION_SLNO);
      if (!primaryLineByOrderId.has(orderId)) {
        primaryLineByOrderId.set(orderId, lineRow);
      }
    }

    return orders.map((order) => {
      const primaryLine = primaryLineByOrderId.get(Number(order.SLNO));
      if (!primaryLine) {
        return order;
      }

      return {
        ...order,
        VEHICLE_MAKE: order.VEHICLE_MAKE || primaryLine.VEHICLE_MAKE || null,
        VEHICLE_MODEL: order.VEHICLE_MODEL || primaryLine.VEHICLE_MODEL || null,
        VEHICLE_VARIANT: order.VEHICLE_VARIANT || primaryLine.VEHICLE_VARIANT || null,
        VIN_NUMBER: order.VIN_NUMBER || primaryLine.VIN_NUMBER || null,
      };
    });
  }

  private async getSourceQuotationOrThrow(quotationId: number): Promise<SourceQuotationRecord> {
    const quotation = await db.queryOne<SourceQuotationRecord>(
      `
        SELECT *
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "SLNO" = ?
          AND "IS_DELETED" = 'N'
          AND COALESCE("DOC_TYPE", '${QUOTATION_DOC_TYPE}') = '${QUOTATION_DOC_TYPE}'
      `,
      [quotationId]
    );

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    return quotation;
  }

  private async getSalesOrderOrThrow(id: number): Promise<SalesOrderDetails> {
    const order = await this.getSalesOrderById(id);
    if (!order) {
      throw new Error('Sales order not found');
    }
    return order;
  }

  private ensureActionAllowed(order: SalesOrder): void {
    if (order.STATUS === 'Cancelled') {
      throw new Error('Sales order is cancelled and cannot be changed');
    }
    if (order.STATUS === 'Lost') {
      throw new Error('Sales order is marked as lost and cannot be changed');
    }
  }

  private async insertSalesOrderLineItemViaSp(
    salesOrderSlno: number,
    lineItem: SalesOrderQuotationLineItem,
    createdBy: string,
    createdDate: string
  ): Promise<void> {
    await db.query(this.getCreateDocumentLineSpSql(), [
      salesOrderSlno,
      Number(lineItem.LINE_NUMBER) || 1,
      lineItem.ITEM_TYPE || 'Vehicle',
      lineItem.ITEM_CODE || null,
      lineItem.ITEM_DESCRIPTION || '',
      lineItem.ITEM_CATEGORY || null,
      Number(lineItem.QUANTITY) || 1,
      Number(lineItem.UNIT_PRICE) || 0,
      Number(lineItem.DISCOUNT_AMOUNT) || 0,
      Number(lineItem.DISCOUNT_PERCENTAGE) || 0,
      Number(lineItem.NET_PRICE) || 0,
      lineItem.TAX_INCLUDED || 'N',
      lineItem.VEHICLE_MAKE || null,
      lineItem.VEHICLE_MODEL || null,
      lineItem.VEHICLE_VARIANT || null,
      lineItem.VEHICLE_YEAR || null,
      lineItem.VEHICLE_COLOR || null,
      lineItem.VIN_NUMBER || null,
      lineItem.WHSCODE || null,
      lineItem.MANUFACTURER || null,
      lineItem.PART_NUMBER || null,
      lineItem.WARRANTY_PERIOD || null,
      lineItem.NOTES || null,
      createdBy,
      createdDate,
    ]);
  }

  private async createSalesOrderHeaderViaSharedSp(
    quotation: SourceQuotationRecord,
    salesOrderNumber: string,
    notes: string | undefined,
    createdBy: string,
    createdDate: string
  ): Promise<number> {
    await db.query(this.getCreateDocumentHeaderSpSql(), [
      quotation.ENQUIRY_SLNO,
      salesOrderNumber,
      SALES_ORDER_DOC_TYPE,
      quotation.SLNO,
      quotation.CUSTOMER_CODE || null,
      quotation.CUSTOMER_NAME || null,
      quotation.CUSTOMER_MOBILE || null,
      quotation.CUSTOMER_EMAIL || null,
      quotation.CUSTOMER_ADDRESS || null,
      Number(quotation.VEHICLE_BASE_PRICE) || 0,
      Number(quotation.VEHICLE_DISCOUNT) || 0,
      Number(quotation.VEHICLE_NET_PRICE) || 0,
      Number(quotation.ACCESSORIES_TOTAL) || 0,
      Number(quotation.ACCESSORIES_DISCOUNT) || 0,
      Number(quotation.ACCESSORIES_NET_TOTAL) || 0,
      Number(quotation.WARRANTY_TOTAL) || 0,
      Number(quotation.INSURANCE_TOTAL) || 0,
      Number(quotation.SUBTOTAL) || 0,
      Number(quotation.TAX_RATE) || 0,
      Number(quotation.TAX_AMOUNT) || 0,
      Number(quotation.GRAND_TOTAL) || 0,
      Number(quotation.TRADE_IN_VALUE) || 0,
      quotation.TRADE_IN_APPRAISAL_SLNO || null,
      quotation.FINANCING_SCHEME_SLNO || null,
      Number(quotation.DOWNPAYMENT) || 0,
      Number(quotation.NET_AMOUNT_DUE) || 0,
      Number(quotation.TOTAL_DISCOUNT_AMOUNT) || 0,
      Number(quotation.DISCOUNT_PERCENTAGE) || 0,
      'N',
      null,
      'Provisional',
      quotation.VALID_UNTIL || null,
      notes || null,
      quotation.TERMS_AND_CONDITIONS || null,
      quotation.INTERNAL_NOTES || null,
      quotation.SALESPERSON || null,
      quotation.SLPCODE || '',
      quotation.BRANCH || null,
      createdBy,
      createdDate,
    ]);

    const createdOrder = await db.queryOne<{ SLNO: number }>(
      `
        SELECT "SLNO"
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        WHERE "QUOTATION_NUMBER" = ?
          AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
      `,
      [salesOrderNumber]
    );

    if (!createdOrder?.SLNO) {
      throw new Error('Sales order created via shared stored procedure but ID could not be retrieved');
    }

    return Number(createdOrder.SLNO);
  }

  private async cloneSalesOrderLineItems(
    sourceQuotationSlno: number,
    salesOrderSlno: number,
    createdBy: string,
    createdDate: string
  ): Promise<void> {
    const sourceLineItems = await db.query<SalesOrderQuotationLineItem>(
      `
        SELECT *
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
        WHERE "QUOTATION_SLNO" = ?
          AND "IS_DELETED" = 'N'
        ORDER BY "LINE_NUMBER", "SLNO"
      `,
      [sourceQuotationSlno]
    );

    if (sourceLineItems.length === 0) {
      return;
    }

    for (const lineItem of sourceLineItems) {
      await this.insertSalesOrderLineItemViaSp(salesOrderSlno, lineItem, createdBy, createdDate);
    }
  }

  private async generateSalesOrderNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const prefix = `SO-${year}-`;

      const result = await db.query<{ QUOTATION_NUMBER: string }>(
        `
          SELECT "QUOTATION_NUMBER"
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          WHERE COALESCE("DOC_TYPE", '${QUOTATION_DOC_TYPE}') = '${SALES_ORDER_DOC_TYPE}'
            AND "QUOTATION_NUMBER" LIKE ?
          ORDER BY "QUOTATION_NUMBER" DESC
          LIMIT 1
        `,
        [`${prefix}%`]
      );

      if (!result.length) {
        return `${prefix}00001`;
      }

      const latestNumber = result[0]?.QUOTATION_NUMBER;
      if (!latestNumber) {
        return `${prefix}00001`;
      }

      const lastSequence = Number(latestNumber.split('-')[2] || 0);
      const newSequence = (lastSequence + 1).toString().padStart(5, '0');
      return `${prefix}${newSequence}`;
    } catch (error: any) {
      logger.error('Error generating sales order number:', error);
      throw new Error(
        'Failed to generate sales order number: ' + error.message
      );
    }
  }

  async createFromQuotation(
    data: CreateSalesOrderFromQuotationInput & { createdBy: string }
  ): Promise<{ success: boolean; id: number; salesOrderNumber: string }> {
    try {
      const quotation = await this.getSourceQuotationOrThrow(data.quotationSlno);
      const primaryLineItem = await db.queryOne<SalesOrderQuotationLineItem>(
        `
          SELECT *
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
          WHERE "QUOTATION_SLNO" = ?
            AND "IS_DELETED" = 'N'
          ORDER BY "LINE_NUMBER", "SLNO"
          LIMIT 1
        `,
        [data.quotationSlno]
      );

      if (quotation.STATUS === 'Cancelled') {
        throw new Error('Cannot create sales order from a cancelled quotation');
      }

      if (quotation.STATUS === 'Superseded') {
        throw new Error('Cannot create sales order from a superseded quotation');
      }

      const currentDateTime = this.getCurrentDateTime();
      const salesOrderNumber = await this.generateSalesOrderNumber();
      const salesOrderId = await this.createSalesOrderHeaderViaSharedSp(
        quotation,
        salesOrderNumber,
        data.notes,
        data.createdBy,
        currentDateTime
      );

      await this.cloneSalesOrderLineItems(
        quotation.SLNO,
        salesOrderId,
        data.createdBy,
        currentDateTime
      );
      await this.syncSapSalesOrderReference(
        salesOrderId,
        quotation,
        data.createdBy,
        currentDateTime
      );

      if (!primaryLineItem && quotation.ENQUIRY_SLNO) {
        logger.warn(
          { salesOrderId, quotationSlno: quotation.SLNO },
          'Sales order created without copied line items because source quotation has no active line items'
        );
      }

      logger.info({ id: salesOrderId, salesOrderNumber }, 'Sales order created in DMS_QUOTATION');
      return { success: true, id: salesOrderId, salesOrderNumber };
    } catch (error: any) {
      logger.error('Error creating sales order from quotation:', error);
      throw new Error(
        'Failed to create sales order from quotation: ' + error.message
      );
    }
  }

  async confirmToSalesOrder(
    salesOrderId: number,
    actor = 'SYSTEM'
  ): Promise<{
    targetDocumentNumber: string;
    status: string;
    errorCode: string;
    sapDocEntry?: string;
  }> {
    const salesOrder = await this.getSalesOrderById(salesOrderId);
    if (!salesOrder) {
      throw new AppError('Sales order not found', 404, 'NOT_FOUND');
    }

    const existingSapDocEntry = this.normalizeText(salesOrder.SAPDOCENTRY);
    const existingSapDocNum = this.normalizeText(salesOrder.SAPDOCNUM || salesOrder.SAPREFENTRY);
    const existingSapStatus = this.normalizeText(salesOrder.SAPSTATUS).toLowerCase();

    if (existingSapDocEntry && existingSapStatus === 'success') {
      return {
        targetDocumentNumber: existingSapDocNum || existingSapDocEntry,
        status: 'Success',
        errorCode: '200',
        sapDocEntry: existingSapDocEntry,
      };
    }

    if (!salesOrder.QUOTATION_SLNO) {
      throw new AppError(
        'Sales order does not have a source quotation to confirm.',
        400,
        'MISSING_SOURCE_QUOTATION'
      );
    }

    const result = await quotationService.confirmToSalesOrder(salesOrder.QUOTATION_SLNO, actor);
    const targetDocumentNumber = this.normalizeText(result.targetDocumentNumber);
    const resolvedSapOrder = await this.resolveSapSalesOrderReference(targetDocumentNumber);
    const currentDateTime = this.getCurrentDateTime();

    await db.execute(
      `
        UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
        SET "SAPDOCENTRY" = ?,
            "SAPDOCNUM" = ?,
            "SAPREFENTRY" = ?,
            "SAPSTATUS" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
        WHERE "SLNO" = ?
          AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
      `,
      [
        resolvedSapOrder?.sapDocEntry || null,
        resolvedSapOrder?.sapDocNum || targetDocumentNumber || null,
        targetDocumentNumber || null,
        result.status,
        actor,
        currentDateTime,
        salesOrderId,
      ]
    );

    return {
      ...result,
      sapDocEntry: resolvedSapOrder?.sapDocEntry,
    };
  }

  async getAllSalesOrders(filters?: SalesOrderFilters): Promise<SalesOrder[]> {
    try {
      let query = `
        SELECT ${this.getSalesOrderSelectColumns('SO')}
        FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION" SO
        WHERE SO."IS_DELETED" = 'N'
          AND SO."DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
      `;
      const params: Array<string | number> = [];

      if (filters?.status) {
        query += ` AND SO."STATUS" = ?`;
        params.push(filters.status);
      }

      if (filters?.slpCode) {
        query += ` AND SO."SLPCODE" = ?`;
        params.push(filters.slpCode);
      }

      if (filters?.quotationSlno) {
        query += ` AND SO."SOURCE_QUOTATION_SLNO" = ?`;
        params.push(filters.quotationSlno);
      }

      if (filters?.enquirySlno) {
        query += ` AND SO."ENQUIRY_SLNO" = ?`;
        params.push(filters.enquirySlno);
      }

      if (filters?.orderNumber) {
        query += ` AND SO."QUOTATION_NUMBER" = ?`;
        params.push(filters.orderNumber);
      }

      query += ` ORDER BY SO."CREATED_DATE" DESC`;
      const orders = await db.query<SalesOrder>(query, params);
      return await this.hydrateSalesOrderVehicleSummary(orders);
    } catch (error: any) {
      logger.error('Error fetching sales orders:', error);
      throw new Error('Failed to fetch sales orders: ' + error.message);
    }
  }

  async getSalesOrderById(id: number): Promise<SalesOrderDetails | null> {
    try {
      const order = await db.queryOne<SalesOrder>(
        `
          SELECT ${this.getSalesOrderSelectColumns('SO')}
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION" SO
          WHERE SO."SLNO" = ?
            AND SO."IS_DELETED" = 'N'
            AND SO."DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [id]
      );

      if (!order) return null;

      const [sourceQuotation, lineItems, enquiry, financingSchemes] = await Promise.all([
        order.QUOTATION_SLNO
          ? db.queryOne<SalesOrderQuotation>(
              `
                SELECT *
                FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
                WHERE "SLNO" = ?
                  AND "IS_DELETED" = 'N'
                  AND COALESCE("DOC_TYPE", '${QUOTATION_DOC_TYPE}') = '${QUOTATION_DOC_TYPE}'
              `,
              [order.QUOTATION_SLNO]
            )
          : Promise.resolve(null),
        db.query<SalesOrderQuotationLineItem>(
          `
            SELECT *
            FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
            WHERE "QUOTATION_SLNO" = ?
              AND "IS_DELETED" = 'N'
            ORDER BY "LINE_NUMBER", "SLNO"
          `,
          [id]
        ),
        order.ENQUIRY_SLNO
          ? db.queryOne<SalesOrderEnquiry>(
              `
                SELECT *
                FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_SALESENQUIRY"
                WHERE "SLNO" = ?
              `,
              [order.ENQUIRY_SLNO]
            )
          : Promise.resolve(null),
        order.ENQUIRY_SLNO
          ? db.query<SalesOrderFinancingScheme>(
              `
                SELECT *
                FROM "${SALES_ORDER_DB_SCHEMA}"."DMS_ENQUIRY_FINANCING"
                WHERE "ENQUIRY_SLNO" = ?
                  AND COALESCE("IS_DELETED", 'N') = 'N'
                ORDER BY "CREATED_DATE" DESC, "SLNO" DESC
              `,
              [order.ENQUIRY_SLNO]
            )
          : Promise.resolve([]),
      ]);

      const resolvedSapOrder = await this.resolveSapSalesOrderReference(
        order.SAPDOCNUM ||
          order.SAPREFENTRY ||
          sourceQuotation?.SAPREFENTRY ||
          order.SAPDOCENTRY
      );

      const orderWithSapReferences: SalesOrder = {
        ...order,
        SAPDOCENTRY: resolvedSapOrder?.sapDocEntry || order.SAPDOCENTRY || null,
        SAPDOCNUM:
          resolvedSapOrder?.sapDocNum ||
          order.SAPDOCNUM ||
          sourceQuotation?.SAPREFENTRY ||
          null,
        SAPREFENTRY: order.SAPREFENTRY || sourceQuotation?.SAPREFENTRY || null,
        SAPSTATUS: order.SAPSTATUS || sourceQuotation?.SAPSTATUS || null,
      };

      let hydratedEnquiry = enquiry;
      if (hydratedEnquiry) {
        hydratedEnquiry = {
          ...hydratedEnquiry,
          VINDETAILS: this.parseJsonField(hydratedEnquiry.VINDETAILS),
        };

        const charge = order.ENQUIRY_SLNO
          ? await this.getEnquiryCharge(order.ENQUIRY_SLNO)
          : null;

        if (charge) {
          hydratedEnquiry.CHARGECODE = charge.CHARGECODE ?? null;
          hydratedEnquiry.CHARGENAME = charge.CHARGENAME ?? null;
          hydratedEnquiry.CHARGEPRICE = charge.CHARGEPRICE ?? null;
          hydratedEnquiry.CHARGEDETAILS = this.parseJsonField(charge.CHARGEDETAILS);
        }
      }

      const [hydratedOrder] = await this.hydrateSalesOrderVehicleSummary([
        {
          ...orderWithSapReferences,
          quotation: sourceQuotation,
          lineItems,
          enquiry: hydratedEnquiry,
          financingSchemes,
        } as SalesOrderDetails,
      ]);

      return hydratedOrder || null;
    } catch (error: any) {
      logger.error('Error fetching sales order by ID:', error);
      throw new Error('Failed to fetch sales order: ' + error.message);
    }
  }

  async updateSalesOrder(
    id: number,
    data: UpdateSalesOrderInput & { updatedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const existingOrder = await this.getSalesOrderOrThrow(id);
      const currentDateTime = this.getCurrentDateTime();

      const updates: string[] = [];
      const params: Array<string | number | null> = [];

      if (data.notes !== undefined) {
        updates.push(`"NOTES" = ?`);
        params.push(data.notes || null);
      }

      if (updates.length > 0) {
        updates.push(`"UPDATED_BY" = ?`);
        params.push(data.updatedBy);
        updates.push(`"UPDATED_DATE" = ?`);
        params.push(currentDateTime);

        params.push(id);
        await db.execute(
          `
            UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
            SET ${updates.join(', ')}
            WHERE "SLNO" = ?
              AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
          `,
          params
        );
      }

      if (data.vinNumber !== undefined) {
        if (existingOrder.VEHICLE_RESERVED === 'Y') {
          throw new Error('Cannot change VIN after vehicle has been reserved');
        }

        const firstLine = await db.queryOne<{ SLNO: number }>(
          `
            SELECT "SLNO"
            FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
            WHERE "QUOTATION_SLNO" = ?
              AND "IS_DELETED" = 'N'
            ORDER BY "LINE_NUMBER", "SLNO"
            LIMIT 1
          `,
          [id]
        );

        if (!firstLine?.SLNO) {
          throw new Error('Sales order line item not found for VIN update');
        }

        await db.execute(
          `
            UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
            SET "VIN_NUMBER" = ?,
                "UPDATED_BY" = ?,
                "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
            WHERE "SLNO" = ?
          `,
          [data.vinNumber || null, data.updatedBy, currentDateTime, firstLine.SLNO]
        );

        await db.execute(
          `
            UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
            SET "UPDATED_BY" = ?,
                "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
            WHERE "SLNO" = ?
              AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
          `,
          [data.updatedBy, currentDateTime, id]
        );
      }

      logger.info({ id }, 'Sales order updated');
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating sales order:', error);
      throw new Error('Failed to update sales order: ' + error.message);
    }
  }

  async markAsPrinted(
    id: number,
    printedBy: string
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      const currentDateTime = this.getCurrentDateTime();
      await db.execute(
        `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "STATUS" = 'Printed',
              "PRINTED_BY" = ?,
              "PRINTED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
          WHERE "SLNO" = ?
            AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [printedBy, currentDateTime, printedBy, currentDateTime, id]
      );

      logger.info({ id }, 'Sales order marked as printed');
      return { success: true };
    } catch (error: any) {
      logger.error('Error marking sales order as printed:', error);
      throw new Error('Failed to mark sales order as printed: ' + error.message);
    }
  }

  async passToVehicleAdmin(
    id: number,
    data: PassToVehicleAdminInput & { passedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      if (order.STATUS !== 'Printed' && order.STATUS !== 'PassedToVehicleAdmin') {
        throw new Error(
          'Sales order must be printed before passing to vehicle admin'
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      await db.execute(
        `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "STATUS" = 'PassedToVehicleAdmin',
              "PASSED_TO_VEHICLE_ADMIN" = 'Y',
              "PASSED_TO_VA_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
              "PASSED_TO_VA_BY" = ?,
              "VEHICLE_ADMIN_ASSIGNED_TO" = ?,
              "VEHICLE_ADMIN_NOTES" = ?,
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
          WHERE "SLNO" = ?
            AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [
          currentDateTime,
          data.passedBy,
          data.assignedTo,
          data.notes || null,
          data.passedBy,
          currentDateTime,
          id,
        ]
      );

      logger.info({ id, assignedTo: data.assignedTo }, 'Sales order passed to vehicle admin');
      return { success: true };
    } catch (error: any) {
      logger.error('Error passing sales order to vehicle admin:', error);
      throw new Error('Failed to pass sales order to vehicle admin: ' + error.message);
    }
  }

  async reserveVehicle(
    id: number,
    data: ReserveVehicleInput & { reservedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      if (!order.VIN_NUMBER) {
        throw new Error('Sales order must have a VIN before reserving vehicle');
      }

      const existingReservationForCurrentOrder = isVehicleReservationActive(
        order.VEHICLE_RESERVED,
        extractReservationDateFromNotes(order.VEHICLE_RESERVATION_NOTES, 'Reservation To')
      );

      if (existingReservationForCurrentOrder) {
        throw new ConflictError('Vehicle is already reserved for this sales order');
      }

      const conflictingReservation = await findActiveVehicleReservation({
        vinNumber: order.VIN_NUMBER,
        quotationSchema: QUOTATION_DB_SCHEMA,
        salesOrderSchema: QUOTATION_DB_SCHEMA,
        excludeSalesOrderId: id,
      });

      if (conflictingReservation) {
        throw new ConflictError(
          buildVehicleReservationConflictMessage(order.VIN_NUMBER, conflictingReservation)
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      await db.execute(
        `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "VEHICLE_RESERVED" = 'Y',
              "VEHICLE_RESERVED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
              "VEHICLE_RESERVED_BY" = ?,
              "VEHICLE_RESERVATION_NOTES" = ?,
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
          WHERE "SLNO" = ?
            AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [
          currentDateTime,
          data.reservedBy,
          data.reservationNotes || null,
          data.reservedBy,
          currentDateTime,
          id,
        ]
      );

      logger.info({ id, vin: order.VIN_NUMBER }, 'Vehicle reserved for sales order');
      return { success: true };
    } catch (error: any) {
      logger.error('Error reserving vehicle for sales order:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new Error('Failed to reserve vehicle: ' + error.message);
    }
  }

  async createHandoverBooking(
    id: number,
    data: CreateHandoverBookingInput & { bookedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      if (
        order.STATUS !== 'PassedToVehicleAdmin' &&
        order.STATUS !== 'HandoverBooked'
      ) {
        throw new Error(
          'Sales order must be passed to vehicle admin before creating handover booking'
        );
      }

      if (order.PASSED_TO_VEHICLE_ADMIN !== 'Y') {
        throw new Error(
          'Sales order must be passed to vehicle admin before creating handover booking'
        );
      }

      const currentDateTime = this.getCurrentDateTime();
      await db.execute(
        `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "STATUS" = 'HandoverBooked',
              "HANDOVER_BOOKED" = 'Y',
              "HANDOVER_DATE" = ?,
              "HANDOVER_TIME" = ?,
              "HANDOVER_LOCATION" = ?,
              "HANDOVER_NOTES" = ?,
              "HANDOVER_BOOKED_BY" = ?,
              "HANDOVER_BOOKED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
          WHERE "SLNO" = ?
            AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [
          data.handoverDate,
          data.handoverTime || null,
          data.handoverLocation || null,
          data.notes || null,
          data.bookedBy,
          currentDateTime,
          data.bookedBy,
          currentDateTime,
          id,
        ]
      );

      logger.info({ id, handoverDate: data.handoverDate }, 'Handover booking created');
      return { success: true };
    } catch (error: any) {
      logger.error('Error creating handover booking:', error);
      throw new Error('Failed to create handover booking: ' + error.message);
    }
  }

  async recordLostSale(
    id: number,
    data: RecordLostSaleInput & { recordedBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      const currentDateTime = this.getCurrentDateTime();
      await db.execute(
        `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "STATUS" = 'Lost',
              "IS_LOST_SALE" = 'Y',
              "VEHICLE_RESERVED" = 'N',
              "HANDOVER_BOOKED" = 'N',
              "LOST_SALE_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
              "LOST_REASON" = ?,
              "LOST_NOTES" = ?,
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
          WHERE "SLNO" = ?
            AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [
          currentDateTime,
          data.lostReason,
          data.notes || null,
          data.recordedBy,
          currentDateTime,
          id,
        ]
      );

      logger.info({ id }, 'Sales order marked as lost sale');
      return { success: true };
    } catch (error: any) {
      logger.error('Error recording lost sale:', error);
      throw new Error('Failed to record lost sale: ' + error.message);
    }
  }

  async cancelSalesOrder(
    id: number,
    data: CancelSalesOrderInput & { cancelledBy: string }
  ): Promise<{ success: boolean }> {
    try {
      const order = await this.getSalesOrderOrThrow(id);
      this.ensureActionAllowed(order);

      const currentDateTime = this.getCurrentDateTime();
      await db.execute(
        `
          UPDATE "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION"
          SET "STATUS" = 'Cancelled',
              "VEHICLE_RESERVED" = 'N',
              "HANDOVER_BOOKED" = 'N',
              "CANCELLATION_REASON" = ?,
              "CANCELLED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
              "CANCELLED_BY" = ?,
              "UPDATED_BY" = ?,
              "UPDATED_DATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS')
          WHERE "SLNO" = ?
            AND "DOC_TYPE" = '${SALES_ORDER_DOC_TYPE}'
        `,
        [
          data.cancellationReason,
          currentDateTime,
          data.cancelledBy,
          data.cancelledBy,
          currentDateTime,
          id,
        ]
      );

      logger.info({ id }, 'Sales order cancelled');
      return { success: true };
    } catch (error: any) {
      logger.error('Error cancelling sales order:', error);
      throw new Error('Failed to cancel sales order: ' + error.message);
    }
  }
}

export const salesOrderService = new SalesOrderService();

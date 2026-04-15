import { db } from './database.service.js';
import { logger } from '../utils/logger.js';
import { AppError, ConflictError } from '../types/errors.js';
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
  VERSION: number;
  PARENT_QUOTATION_SLNO?: number;
  IS_LATEST_VERSION: string;
  ROOT_QUOTATION_SLNO?: number;
  ROOT_QUOTATION_NUMBER?: string;

  // Customer
  CUSTOMER_NAME?: string;
  CUSTOMER_MOBILE?: string;
  CUSTOMER_EMAIL?: string;
  CUSTOMER_ADDRESS?: string;

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
    return `CALL "${QUOTATION_DB_SCHEMA}"."${CREATE_QUOTATION_LINE_SP_NAME}"(${Array(18)
      .fill('?')
      .join(', ')})`;
  }

  private async insertQuotationLineItemViaSp(
    quotationId: number,
    item: any,
    actor: string,
    currentDateTime: string
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

    if (!resolvedVinNumber && data.enquirySlno) {
      const enquiry = await db.queryOne<{
        VINNUMBER?: string | null;
        VINDETAILS?: string | null;
      }>(
        `
          SELECT "VINNUMBER", "VINDETAILS"
          FROM "${QUOTATION_DB_SCHEMA}"."DMS_SALESENQUIRY"
          WHERE "SLNO" = ?
        `,
        [data.enquirySlno]
      );

      if (enquiry) {
        resolvedVinNumber = enquiry.VINNUMBER || null;

        if (!resolvedVinNumber && enquiry.VINDETAILS) {
          try {
            const vinDetails = JSON.parse(enquiry.VINDETAILS) as unknown;
            resolvedVinNumber = extractVinFromUnknown(vinDetails) || null;
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
      data.customerName || null,
      data.customerMobile || null,
      data.customerEmail || null,
      data.customerAddress || null,
      data.vehicleMake || null,
      data.vehicleModel || null,
      data.vehicleVariant || null,
      data.vehicleYear || null,
      data.vehicleColor || null,
      resolvedVinNumber,
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
    `;
    const idResult = await db.query(idQuery, [quotationNumber]);
    const quotationId = idResult[0]?.SLNO;

    if (!quotationId) {
      throw new Error(
        `Stored procedure created quotation but no SLNO found for quotation number: ${quotationNumber}`
      );
    }

    for (const item of data.lineItems) {
      await this.insertQuotationLineItemViaSp(quotationId, item, data.createdBy, currentDateTime);
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
      `;

      const lineItemsQuery = `
        SELECT * FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
        WHERE "QUOTATION_SLNO" = ? AND "IS_DELETED" = 'N'
        ORDER BY "LINE_NUMBER"
      `;

      const quotation = await db.queryOne(quotationQuery, [targetId]);
      if (!quotation) return null;

      const lineItems = await db.query(lineItemsQuery, [targetId]);

      const [quotationWithReference] = await this.hydrateQuotationReferences([
        { ...quotation, lineItems } as Quotation & { lineItems: QuotationLineItem[] },
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
        ORDER BY "VERSION" DESC, "CREATED_DATE" DESC
      `;

      const quotations = await db.query<Quotation>(query, [enquiryId]);
      const hydratedTotals = await this.hydrateQuotationHeaderTotals(quotations);
      return await this.hydrateQuotationReferences(hydratedTotals);
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
      return await this.hydrateQuotationReferences(hydratedTotals);
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

      // Vehicle fields
      if (data.vehicleMake !== undefined) {
        updates.push('"VEHICLE_MAKE" = ?');
        params.push(data.vehicleMake);
      }
      if (data.vehicleModel !== undefined) {
        updates.push('"VEHICLE_MODEL" = ?');
        params.push(data.vehicleModel);
      }
      if (data.vehicleVariant !== undefined) {
        updates.push('"VEHICLE_VARIANT" = ?');
        params.push(data.vehicleVariant);
      }
      if (data.vehicleYear !== undefined) {
        updates.push('"VEHICLE_YEAR" = ?');
        params.push(data.vehicleYear);
      }
      if (data.vehicleColor !== undefined) {
        updates.push('"VEHICLE_COLOR" = ?');
        params.push(data.vehicleColor);
      }
      if (data.vinNumber !== undefined) {
        updates.push('"VIN_NUMBER" = ?');
        params.push(data.vinNumber);
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
        // Delete existing line items
        const deleteLineItemsQuery = `
          DELETE FROM "${QUOTATION_DB_SCHEMA}"."DMS_QUOTATION_LINE_ITEMS"
          WHERE "QUOTATION_SLNO" = ?
        `;
        await db.execute(deleteLineItemsQuery, [id]);

        // Insert new line items via stored procedure
        for (const item of data.lineItems) {
          await this.insertQuotationLineItemViaSp(id, item, data.updatedBy, currentDateTime);
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
        vehicleMake: data.vehicleMake || parent.VEHICLE_MAKE || '',
        vehicleModel: data.vehicleModel || parent.VEHICLE_MODEL || '',
        vehicleVariant: data.vehicleVariant || parent.VEHICLE_VARIANT || '',
        vehicleYear: data.vehicleYear || parent.VEHICLE_YEAR || '',
        vehicleColor: data.vehicleColor || parent.VEHICLE_COLOR || '',
        vinNumber: data.vinNumber || parent.VIN_NUMBER || '',
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
        ORDER BY "PASSED_TO_CASHIER_DATE" DESC, "UPDATED_DATE" DESC
      `;

      return await db.query(query);
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
}

// Export singleton instance
export const quotationService = new QuotationService();

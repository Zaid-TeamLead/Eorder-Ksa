import { db } from './database.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../types/errors.js';

const FINANCING_DB_SCHEMA = (() => {
  const raw = process.env.FINANCING_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid FINANCING_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const FINANCING_TABLE_SCHEMA = (() => {
  const raw = process.env.FINANCING_TABLE_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid FINANCING_TABLE_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

const FINANCING_GET_BY_ENQUIRY_SP = process.env.FINANCING_GET_BY_ENQUIRY_SP || 'DMS_KSA_100031_EORDER';
const FINANCING_GET_BY_ID_SP = process.env.FINANCING_GET_BY_ID_SP || 'DMS_KSA_100032_EORDER';
const FINANCING_CREATE_SP = process.env.FINANCING_CREATE_SP || 'DMS_KSA_100033_EORDER';
const FINANCING_UPDATE_SP = process.env.FINANCING_UPDATE_SP || 'DMS_KSA_100034_EORDER';
const FINANCING_DELETE_SP = process.env.FINANCING_DELETE_SP || 'DMS_KSA_100035_EORDER';
const FINANCING_GET_LENDERS_SP = process.env.FINANCING_GET_LENDERS_SP || 'DMS_KSA_100026';
const FINANCING_GET_CURRENCIES_SP =
  process.env.FINANCING_GET_CURRENCIES_SP || 'DMS_KSA_100027';
const FINANCING_GET_SALES_EMPLOYEES_SP =
  process.env.FINANCING_GET_SALES_EMPLOYEES_SP || 'DMS_KSA_100028';
const FINANCING_SET_PREFERRED_SP = process.env.FINANCING_SET_PREFERRED_SP || 'DMS_KSA_100037_EORDER';
const FINANCING_DEFAULT_QRYTYPE = (process.env.FINANCING_DEFAULT_QRYTYPE || 'BANK').trim();

function normalizeProcedureName(name: string): string {
  const normalized = name.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid procedure name: ${name}`);
  }
  return normalized;
}

function getSpCallSql(procedureName: string, parameterCount: number): string {
  const normalizedProcedureName = normalizeProcedureName(procedureName);
  return `CALL "${FINANCING_DB_SCHEMA}"."${normalizedProcedureName}"(${Array(parameterCount)
    .fill('?')
    .join(', ')})`;
}

function isProcedureArityError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return (
    message.includes('wrong number or types of parameters') ||
    message.includes('too many arguments') ||
    message.includes('not enough arguments')
  );
}

async function callFinancingCreateSp(data: any, currentDate: string) {
  const paramsV2 = [
    data.enquirySlno,
    data.lenderCode,
    data.lenderName,
    data.schemeName ?? null,
    data.currency ?? null,
    data.vehiclePrice ?? null,
    data.downpayment ?? null,
    data.downpaymentPercent ?? null,
    data.tradeInValue ?? null,
    data.financeAmount ?? null,
    data.termMonths,
    data.interestRate ?? null,
    data.monthlyPayment ?? null,
    data.totalInterest ?? null,
    data.fda ?? null,
    data.gpvBalloon ?? null,
    data.saleCode ?? null,
    data.status || 'Draft',
    data.isSelected || 'N',
    data.createdBy,
    currentDate,
  ];

  try {
    await db.query(getSpCallSql(FINANCING_CREATE_SP, 21), paramsV2);
    return;
  } catch (error) {
    if (!isProcedureArityError(error)) {
      throw error;
    }

    logger.warn(
      { procedure: FINANCING_CREATE_SP, error },
      'Financing create SP does not support currency yet; retrying with legacy parameter count'
    );
  }

  const paramsV1 = [
    data.enquirySlno,
    data.lenderCode,
    data.lenderName,
    data.schemeName ?? null,
    data.vehiclePrice ?? null,
    data.downpayment ?? null,
    data.downpaymentPercent ?? null,
    data.tradeInValue ?? null,
    data.financeAmount ?? null,
    data.termMonths,
    data.interestRate ?? null,
    data.monthlyPayment ?? null,
    data.totalInterest ?? null,
    data.fda ?? null,
    data.gpvBalloon ?? null,
    data.saleCode ?? null,
    data.status || 'Draft',
    data.isSelected || 'N',
    data.createdBy,
    currentDate,
  ];

  await db.query(getSpCallSql(FINANCING_CREATE_SP, 20), paramsV1);
}

async function callFinancingUpdateSp(id: number, merged: any, updatedBy: string, currentDate: string) {
  const paramsV2 = [
    id,
    merged.lenderCode,
    merged.lenderName,
    merged.schemeName ?? null,
    merged.currency ?? null,
    merged.vehiclePrice ?? null,
    merged.downpayment ?? null,
    merged.downpaymentPercent ?? null,
    merged.tradeInValue ?? null,
    merged.financeAmount ?? null,
    merged.termMonths,
    merged.interestRate ?? null,
    merged.monthlyPayment ?? null,
    merged.totalInterest ?? null,
    merged.fda ?? null,
    merged.gpvBalloon ?? null,
    merged.saleCode ?? null,
    merged.status,
    merged.isSelected,
    updatedBy,
    currentDate,
  ];

  try {
    await db.query(getSpCallSql(FINANCING_UPDATE_SP, 21), paramsV2);
    return;
  } catch (error) {
    if (!isProcedureArityError(error)) {
      throw error;
    }

    logger.warn(
      { procedure: FINANCING_UPDATE_SP, error },
      'Financing update SP does not support currency yet; retrying with legacy parameter count'
    );
  }

  const paramsV1 = [
    id,
    merged.lenderCode,
    merged.lenderName,
    merged.schemeName ?? null,
    merged.vehiclePrice ?? null,
    merged.downpayment ?? null,
    merged.downpaymentPercent ?? null,
    merged.tradeInValue ?? null,
    merged.financeAmount ?? null,
    merged.termMonths,
    merged.interestRate ?? null,
    merged.monthlyPayment ?? null,
    merged.totalInterest ?? null,
    merged.fda ?? null,
    merged.gpvBalloon ?? null,
    merged.saleCode ?? null,
    merged.status,
    merged.isSelected,
    updatedBy,
    currentDate,
  ];

  await db.query(getSpCallSql(FINANCING_UPDATE_SP, 20), paramsV1);
}

function pickStringValue(row: Record<string, any>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (!text || text === '?') continue;
    return text;
  }
  return null;
}

function normalizeLenders(rows: any[]): any[] {
  const seen = new Set<string>();
  const normalized: any[] = [];

  for (const row of rows) {
    const record = row as Record<string, any>;
    const code =
      pickStringValue(record, [
        'LENDER_CODE',
        'BANK_CODE',
        'BANKCODE',
        'BankCode',
        'CODE',
        'CARDCODE',
        'CARD_CODE',
        'CardCode',
        'CUSTOMER_CODE',
        'ID',
      ]) || null;
    const name =
      pickStringValue(record, [
        'LENDER_NAME',
        'BANK_NAME',
        'BANKNAME',
        'BankName',
        'NAME',
        'CARDNAME',
        'CARD_NAME',
        'CardName',
        'CUSTOMER_NAME',
        'DESCRIPTION',
      ]) || null;
    const description =
      pickStringValue(record, ['DESCRIPTION', 'REMARKS', 'NOTES']) ||
      name ||
      code ||
      '';
    const active = pickStringValue(record, ['IS_ACTIVE', 'ACTIVE']) || 'Y';

    const lenderCode = code || name || `LENDER-${normalized.length + 1}`;
    const lenderName = name || code || lenderCode;
    const key = `${lenderCode}::${lenderName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      ...record,
      LENDER_CODE: lenderCode,
      LENDER_NAME: lenderName,
      DESCRIPTION: description,
      IS_ACTIVE: active,
    });
  }

  return normalized;
}

function normalizeSalesEmployees(rows: any[]): any[] {
  const seen = new Set<string>();
  const normalized: any[] = [];

  for (const row of rows) {
    const record = row as Record<string, any>;
    const code =
      pickStringValue(record, [
        'SALES_EMPLOYEE_CODE',
        'Sales Employee Code',
        'SALES EMPLOYEE CODE',
        'SLPCODE',
        'SALESPERSON_CODE',
        'CODE',
      ]) || null;
    const name =
      pickStringValue(record, [
        'SALES_EMPLOYEE_NAME',
        'Sales Employee Name',
        'SALES EMPLOYEE NAME',
        'SALESPERSON',
        'NAME',
      ]) || null;

    if (!code && !name) continue;

    const employeeCode = code || `EMP-${normalized.length + 1}`;
    const employeeName = name || employeeCode;
    const key = `${employeeCode}::${employeeName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      ...record,
      SALES_EMPLOYEE_CODE: employeeCode,
      SALES_EMPLOYEE_NAME: employeeName,
    });
  }

  return normalized;
}

function normalizeCurrencies(rows: any[]): any[] {
  const seen = new Set<string>();
  const normalized: any[] = [];

  for (const row of rows) {
    const record = row as Record<string, any>;
    const code =
      pickStringValue(record, [
        'CURRENCY_CODE',
        'Currency Code',
        'CURRENCY CODE',
        'CURRENCY',
        'CURR',
        'CODE',
      ]) || null;
    const name =
      pickStringValue(record, [
        'CURRENCY_NAME',
        'Currency Name',
        'CURRENCY NAME',
        'NAME',
        'DESCRIPTION',
      ]) || null;

    if (!code && !name) continue;

    const currencyCode = code || `CUR-${normalized.length + 1}`;
    const currencyName = name || currencyCode;
    const key = `${currencyCode}::${currencyName}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push({
      ...record,
      CURRENCY_CODE: currencyCode,
      CURRENCY_NAME: currencyName,
    });
  }

  return normalized;
}

/**
 * Financing Service
 * Handles all database operations for enquiry financing schemes
 */
export const financingService = {
  /**
   * Get all financing schemes for an enquiry
   */
  async getByEnquiryId(enquiryId: number) {
    try {
      return await db.query(getSpCallSql(FINANCING_GET_BY_ENQUIRY_SP, 1), [enquiryId]);
    } catch (error: any) {
      throw new AppError(
        `Failed to load financing schemes: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  /**
   * Get financing scheme by ID
   */
  async getById(id: number) {
    try {
      const rows = await db.query(getSpCallSql(FINANCING_GET_BY_ID_SP, 1), [id]);
      return rows[0] || null;
    } catch (error: any) {
      throw new AppError(
        `Failed to load financing scheme: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  /**
   * Create a new financing scheme
   */
  async create(data: any) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      await callFinancingCreateSp(data, currentDate);

      const insertedId = await db.queryOne<{ SLNO: number }>(
        `SELECT "SLNO" FROM "${FINANCING_TABLE_SCHEMA}"."DMS_ENQUIRY_FINANCING" WHERE "ENQUIRY_SLNO" = ? AND "IS_DELETED" = 'N' ORDER BY "CREATED_DATE" DESC`,
        [data.enquirySlno]
      );

      logger.info({ enquiryId: data.enquirySlno, lender: data.lenderCode }, 'Financing scheme created');

      return {
        success: true,
        id: insertedId?.SLNO || 0,
      };
    } catch (error: any) {
      throw new AppError(
        `Failed to create financing scheme: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  /**
   * Update an existing financing scheme
   */
  async update(id: number, data: any) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      const existing = await this.getById(id);

      if (!existing) {
        throw new Error('Financing scheme not found');
      }

      const merged = {
        lenderCode: data.lenderCode ?? existing.LENDER_CODE,
        lenderName: data.lenderName ?? existing.LENDER_NAME,
        schemeName: data.schemeName ?? existing.SCHEME_NAME,
        currency: data.currency ?? existing.CURRENCY,
        vehiclePrice: data.vehiclePrice ?? existing.VEHICLE_PRICE,
        downpayment: data.downpayment ?? existing.DOWNPAYMENT,
        downpaymentPercent: data.downpaymentPercent ?? existing.DOWNPAYMENT_PERCENT,
        tradeInValue: data.tradeInValue ?? existing.TRADE_IN_VALUE,
        financeAmount: data.financeAmount ?? existing.FINANCE_AMOUNT,
        termMonths: data.termMonths ?? existing.TERM_MONTHS,
        interestRate: data.interestRate ?? existing.INTEREST_RATE,
        monthlyPayment: data.monthlyPayment ?? existing.MONTHLY_PAYMENT,
        totalInterest: data.totalInterest ?? existing.TOTAL_INTEREST,
        fda: data.fda ?? existing.FDA,
        gpvBalloon: data.gpvBalloon ?? existing.GPV_BALLOON,
        saleCode: data.saleCode ?? existing.SALE_CODE,
        status: data.status ?? existing.STATUS ?? 'Draft',
        isSelected: data.isSelected ?? existing.IS_SELECTED ?? 'N',
      };

      await callFinancingUpdateSp(id, merged, data.updatedBy, currentDate);

      logger.info({ financingId: id }, 'Financing scheme updated');

      return { success: true };
    } catch (error: any) {
      throw new AppError(
        `Failed to update financing scheme: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  /**
   * Delete a financing scheme (soft delete)
   */
  async delete(id: number, userId: string) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      await db.query(getSpCallSql(FINANCING_DELETE_SP, 3), [id, userId, currentDate]);

      logger.info({ financingId: id }, 'Financing scheme deleted');

      return { success: true };
    } catch (error: any) {
      throw new AppError(
        `Failed to delete financing scheme: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  /**
   * Get all active lenders
   */
  async getLenders(qryType: string = FINANCING_DEFAULT_QRYTYPE) {
    const normalizedQryType = (qryType || FINANCING_DEFAULT_QRYTYPE).trim();
    const attempts = [
      { sql: getSpCallSql(FINANCING_GET_LENDERS_SP, 0), params: [] as any[] },
      { sql: getSpCallSql(FINANCING_GET_LENDERS_SP, 1), params: [normalizedQryType] as any[] },
      { sql: getSpCallSql(FINANCING_GET_LENDERS_SP, 1), params: [''] as any[] },
    ];

    let lastError: any = null;
    for (const attempt of attempts) {
      try {
        const rows = await db.query(attempt.sql, attempt.params);
        const lenders = normalizeLenders(rows);
        if (lenders.length > 0) {
          return lenders;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      throw new AppError(
        `Failed to load lenders: ${lastError.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }

    return [];
  },

  async getSalesEmployees() {
    try {
      const rows = await db.query(getSpCallSql(FINANCING_GET_SALES_EMPLOYEES_SP, 0), []);
      return normalizeSalesEmployees(rows);
    } catch (error: any) {
      throw new AppError(
        `Failed to load sales employees: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  async getCurrencies() {
    try {
      const rows = await db.query(getSpCallSql(FINANCING_GET_CURRENCIES_SP, 0), []);
      return normalizeCurrencies(rows);
    } catch (error: any) {
      throw new AppError(
        `Failed to load currencies: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },

  /**
   * Mark a financing scheme as selected (preferred)
   * Automatically unselects other schemes for the same enquiry
   */
  async setPreferred(id: number, enquiryId: number, userId: string) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
    try {
      await db.query(getSpCallSql(FINANCING_SET_PREFERRED_SP, 4), [
        id,
        enquiryId,
        userId,
        currentDate,
      ]);

      logger.info({ financingId: id, enquiryId }, 'Financing scheme set as preferred');

      return { success: true };
    } catch (error: any) {
      throw new AppError(
        `Failed to set preferred financing scheme: ${error.message}`,
        500,
        'INTERNAL_SERVER_ERROR'
      );
    }
  },
};

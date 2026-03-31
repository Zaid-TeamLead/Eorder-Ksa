import { db } from './database.service.js';
import { logger } from '../utils/logger.js';
import {
  buildUpdateQuery,
  validateUpdateQuery,
  addAuditFields,
} from '../utils/db-helpers.js';
import {
  enquiryFieldMapping,
  enquiryValueTransformers,
} from '../schemas/shared/field-mappings.js';

const ENQUIRY_SCHEMA = 'BI_NEGT_KSAISUZU';
const ENQUIRY_TABLE = 'DMS_SALESENQUIRY';
const ENQUIRY_CHARGE_TABLE = 'DMS_SALESENQUIRY_CHARGES';
let hasChargeTableCache: boolean | null = null;

interface ChargePayload {
  code: string | null;
  name: string | null;
  price: string | null;
  details: Record<string, unknown> | null;
}

interface EnquiryChargeRow {
  SLNO: number;
  ENQUIRY_SLNO: number;
  CHARGECODE?: string | null;
  CHARGENAME?: string | null;
  CHARGEPRICE?: string | null;
  CHARGEDETAILS?: string | null;
}

export interface CreateEnquiryData {
  // Customer Information
  customerId?: string;
  customerName: string; // Required
  address?: string;
  postcode?: string;
  homePhone?: string;
  workPhone?: string;
  mobile: string; // Required
  homeEmail?: string;

  // Vehicle Details
  make: string; // Required
  makeName?: string;
  model: string; // Required
  modelName?: string;
  variant?: string;
  variantName?: string;
  year?: string;
  color?: string;
  suppCatNum?: string;
  modelCode?: string;
  quantity?: number;
  vinNumber?: string;
  vinDetails?: any; // JSON object

  // Enquiry Details
  branch?: string;
  branchName?: string;
  budget?: string;
  financing?: string;
  chargeCode?: string;
  chargeName?: string;
  chargePrice?: string;
  chargeDetails?: Record<string, unknown>;
  preferredContact?: string;
  preferredTime?: string;
  preferredDelivery?: string;
  source?: string;
  salesType?: string;

  // Trade-in
  tradeInMake?: string;
  tradeInModel?: string;
  tradeInYear?: string;
  tradeInKms?: string;
  tradeInExpectedPrice?: string;

  // Additional
  salesperson?: string;
  slpCode?: string;
  notes?: string;
  status?: string;
  priority?: string;
  followUpDate?: string;
  followUpNotes?: string;

  // Audit
  createdBy: string;
}

export interface UpdateEnquiryData {
  // All fields optional for partial updates
  customerId?: string;
  customerName?: string;
  address?: string;
  postcode?: string;
  homePhone?: string;
  workPhone?: string;
  mobile?: string;
  homeEmail?: string;
  make?: string;
  makeName?: string;
  model?: string;
  modelName?: string;
  variant?: string;
  variantName?: string;
  year?: string;
  color?: string;
  suppCatNum?: string;
  modelCode?: string;
  quantity?: number;
  vinNumber?: string;
  vinDetails?: any;
  branch?: string;
  branchName?: string;
  budget?: string;
  financing?: string;
  chargeCode?: string;
  chargeName?: string;
  chargePrice?: string;
  chargeDetails?: Record<string, unknown>;
  preferredContact?: string;
  preferredTime?: string;
  preferredDelivery?: string;
  source?: string;
  salesType?: string;
  tradeInMake?: string;
  tradeInModel?: string;
  tradeInYear?: string;
  tradeInKms?: string;
  tradeInExpectedPrice?: string;
  salesperson?: string;
  slpCode?: string;
  notes?: string;
  status?: string;
  priority?: string;
  followUpDate?: string;
  followUpNotes?: string;
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

function toTrimmedOrNull(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function extractChargeFromVinDetails(vinDetails: unknown): {
  code: string | null;
  name: string | null;
  price: string | null;
} {
  if (!vinDetails || typeof vinDetails !== 'object') {
    return { code: null, name: null, price: null };
  }

  const details = vinDetails as Record<string, unknown>;
  const charge =
    details.CHARGE && typeof details.CHARGE === 'object'
      ? (details.CHARGE as Record<string, unknown>)
      : null;

  if (!charge) {
    return { code: null, name: null, price: null };
  }

  return {
    code: toTrimmedOrNull(charge.code),
    name: toTrimmedOrNull(charge.name),
    price: toTrimmedOrNull(charge.price),
  };
}

function getChargePayload(data: {
  chargeCode?: string;
  chargeName?: string;
  chargePrice?: string;
  chargeDetails?: Record<string, unknown>;
}) {
  const details =
    data.chargeDetails && typeof data.chargeDetails === 'object'
      ? data.chargeDetails
      : null;

  return {
    code: toTrimmedOrNull(data.chargeCode),
    name: toTrimmedOrNull(data.chargeName),
    price: toTrimmedOrNull(data.chargePrice),
    details,
  };
}

function hasChargePayload(payload: ChargePayload): boolean {
  return Boolean(
    payload.code ||
      payload.name ||
      payload.price ||
      (payload.details && Object.keys(payload.details).length > 0)
  );
}

function parseChargeDetails(input: string | null | undefined): Record<string, unknown> | null {
  if (!input) return null;

  try {
    const parsed = JSON.parse(input);
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function mapChargeRowToPayload(row: EnquiryChargeRow | null): ChargePayload {
  if (!row) {
    return { code: null, name: null, price: null, details: null };
  }

  return {
    code: toTrimmedOrNull(row.CHARGECODE),
    name: toTrimmedOrNull(row.CHARGENAME),
    price: toTrimmedOrNull(row.CHARGEPRICE),
    details: parseChargeDetails(row.CHARGEDETAILS),
  };
}

async function hasChargeTable(): Promise<boolean> {
  if (hasChargeTableCache !== null) {
    return hasChargeTableCache;
  }

  const row = await db.queryOne<{ TABLE_NAME: string }>(
    `SELECT "TABLE_NAME"
     FROM "SYS"."TABLES"
     WHERE "SCHEMA_NAME" = ?
       AND "TABLE_NAME" = ?`,
    [ENQUIRY_SCHEMA, ENQUIRY_CHARGE_TABLE]
  );

  hasChargeTableCache = Boolean(row?.TABLE_NAME);
  return hasChargeTableCache;
}

async function getNextEnquiryChargeId(): Promise<number> {
  const row = await db.queryOne<{ NEXT_SLNO: number }>(
    `SELECT COALESCE(MAX("SLNO"), 0) + 1 AS "NEXT_SLNO"
     FROM "${ENQUIRY_SCHEMA}"."${ENQUIRY_CHARGE_TABLE}"`
  );

  return row?.NEXT_SLNO ?? 1;
}

async function replaceEnquiryCharge(
  enquiryId: number,
  charge: ChargePayload,
  username: string
): Promise<void> {
  if (!(await hasChargeTable())) {
    logger.warn(
      { enquiryId, table: `${ENQUIRY_SCHEMA}.${ENQUIRY_CHARGE_TABLE}` },
      'Charge table not found; skipping enquiry charge persistence'
    );
    return;
  }

  const currentDateTime = new Date()
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);

  await db.execute(
    `UPDATE "${ENQUIRY_SCHEMA}"."${ENQUIRY_CHARGE_TABLE}"
     SET "IS_DELETED" = 'Y',
         "UPDATEDDATE" = TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'),
         "UPDATEDBY" = ?
     WHERE "ENQUIRY_SLNO" = ?
       AND COALESCE("IS_DELETED", 'N') = 'N'`,
    [currentDateTime, username, enquiryId]
  );

  if (!hasChargePayload(charge)) {
    return;
  }

  const nextId = await getNextEnquiryChargeId();

  await db.execute(
    `INSERT INTO "${ENQUIRY_SCHEMA}"."${ENQUIRY_CHARGE_TABLE}" (
       "SLNO", "ENQUIRY_SLNO", "CHARGECODE", "CHARGENAME", "CHARGEPRICE", "CHARGEDETAILS",
       "CREATEDDATE", "CREATEDBY", "IS_DELETED"
     ) VALUES (
       ?, ?, ?, ?, ?, ?,
       TO_TIMESTAMP(?, 'YYYY-MM-DD HH24:MI:SS'), ?, 'N'
     )`,
    [
      nextId,
      enquiryId,
      charge.code,
      charge.name,
      charge.price,
      charge.details ? JSON.stringify(charge.details) : null,
      currentDateTime,
      username,
    ]
  );
}

async function getEnquiryChargeMap(
  enquiryIds: number[]
): Promise<Map<number, ChargePayload>> {
  const chargeMap = new Map<number, ChargePayload>();

  if (enquiryIds.length === 0 || !(await hasChargeTable())) {
    return chargeMap;
  }

  const placeholders = enquiryIds.map(() => '?').join(', ');
  const rows = await db.query<EnquiryChargeRow>(
    `SELECT charge.*
     FROM "${ENQUIRY_SCHEMA}"."${ENQUIRY_CHARGE_TABLE}" charge
     INNER JOIN (
       SELECT "ENQUIRY_SLNO", MAX("SLNO") AS "SLNO"
       FROM "${ENQUIRY_SCHEMA}"."${ENQUIRY_CHARGE_TABLE}"
       WHERE COALESCE("IS_DELETED", 'N') = 'N'
         AND "ENQUIRY_SLNO" IN (${placeholders})
       GROUP BY "ENQUIRY_SLNO"
     ) latest
       ON latest."ENQUIRY_SLNO" = charge."ENQUIRY_SLNO"
      AND latest."SLNO" = charge."SLNO"`,
    enquiryIds
  );

  for (const row of rows) {
    chargeMap.set(row.ENQUIRY_SLNO, mapChargeRowToPayload(row));
  }

  return chargeMap;
}

async function getLatestCreatedEnquiryId(createdBy: string): Promise<number | null> {
  const latest = await db.queryOne<{ SLNO: number }>(
    `SELECT "SLNO"
     FROM "${ENQUIRY_SCHEMA}"."${ENQUIRY_TABLE}"
     WHERE "CREATEDBY" = ?
     ORDER BY "SLNO" DESC
     LIMIT 1`,
    [createdBy]
  );

  return latest?.SLNO ?? null;
}

class EnquiryService {
  /**
   * Create a new sales enquiry
   */
  async createEnquiry(data: CreateEnquiryData) {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);
      const resolvedVinNumber =
        data.vinNumber ||
        extractVinFromUnknown(data.vinDetails) ||
        null;
      const chargePayload = getChargePayload(data);

      const parameters = [
        data.customerId || null,
        data.customerName || null,
        data.address || null,
        data.postcode || null,
        data.homePhone || null,
        data.workPhone || null,
        data.mobile,
        data.homeEmail || null,
        data.make || null,
        data.makeName || null,
        data.model || null,
        data.modelName || null,
        data.variant || null,
        data.variantName || null,
        data.year || null,
        data.color || null,
        data.suppCatNum || null,
        data.modelCode || null,
        data.quantity || 1,
        resolvedVinNumber,
        data.vinDetails ? JSON.stringify(data.vinDetails) : null,
        data.branch || null,
        data.branchName || null,
        data.budget || null,
        data.financing || null,
        data.preferredContact || null,
        data.preferredTime || null,
        data.preferredDelivery || null,
        data.source || null,
        data.salesType || null,
        data.tradeInMake || null,
        data.tradeInModel || null,
        data.tradeInYear || null,
        data.tradeInKms || null,
        data.tradeInExpectedPrice || null,
        data.salesperson || null,
        data.slpCode || null,
        data.notes || null,
        data.status || 'Active',
        data.priority || 'Medium',
        data.followUpDate || null,
        data.followUpNotes || null,
        currentDateTime,
        data.createdBy,
      ];

      // Preferred path: create via dedicated SAP procedure in BI_NEGT_KSAISUZU.
      // Use a unique procedure name to avoid conflicts with existing deployments.
      const createEnquirySp = `CALL "BI_NEGT_KSAISUZU".DMS_KSA_100006_EORDER(${parameters.map(() => '?').join(', ')})`;

      try {
        await db.query(createEnquirySp, parameters);
        if (data.vinDetails || hasChargePayload(chargePayload)) {
          try {
            const latestId = await getLatestCreatedEnquiryId(data.createdBy);
            if (latestId) {
              if (data.vinDetails) {
                await db.execute(
                  `UPDATE "${ENQUIRY_SCHEMA}"."${ENQUIRY_TABLE}"
                   SET "VINDETAILS" = ?
                   WHERE "SLNO" = ?`,
                  [JSON.stringify(data.vinDetails), latestId]
                );
              }
              await replaceEnquiryCharge(latestId, chargePayload, data.createdBy);
            }
          } catch (syncError) {
            logger.warn(
              { error: syncError },
              'Created enquiry via SP but failed to sync linked enquiry charge row'
            );
          }
        }
        logger.info('Sales enquiry created successfully via stored procedure BI_NEGT_KSAISUZU.DMS_KSA_100006_EORDER');
        return { success: true, message: 'Sales enquiry created successfully' };
      } catch (spError) {
        logger.warn(
          { error: spError },
          'Create enquiry SP failed, falling back to direct table insert'
        );
      }

      const insertQuery = `
        INSERT INTO "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY" (
          "CUSTOMERID", "CUSTOMERNAME", "ADDRESS", "POSTCODE",
          "HOMEPHONE", "WORKPHONE", "MOBILE", "HOMEEMAIL",
          "MAKE", "MAKENAME", "MODEL", "MODELNAME", "VARIANT", "VARIANTNAME",
          "YEAR", "COLOR", "SUPPCATNUM", "MODELCODE", "QUANTITY", "VINNUMBER", "VINDETAILS",
          "BRANCH", "BRANCHNAME", "BUDGET", "FINANCING",
          "PREFERREDCONTACT", "PREFERREDTIME", "PREFERREDDELIVERY", "SOURCE", "SALESTYPE",
          "TRADEINMAKE", "TRADEINMODEL", "TRADEINYEAR", "TRADEINKMS", "TRADEINEXPECTEDPRICE",
          "SALESPERSON", "SLPCODE", "NOTES",
          "STATUS", "PRIORITY", "FOLLOWUPDATE", "FOLLOWUPNOTES",
          "CREATEDDATE", "CREATEDBY"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await db.execute(insertQuery, parameters);

      try {
        const latestId = await getLatestCreatedEnquiryId(data.createdBy);
        if (latestId) {
          await replaceEnquiryCharge(latestId, chargePayload, data.createdBy);
        }
      } catch (syncError) {
        logger.warn(
          { error: syncError },
          'Created enquiry via insert but failed to sync linked enquiry charge row'
        );
      }

      logger.info('Sales enquiry created successfully');
      return { success: true, message: 'Sales enquiry created successfully' };
    } catch (error: any) {
      logger.error('Error creating sales enquiry:', error);
      throw new Error('Failed to create sales enquiry: ' + error.message);
    }
  }

  /**
   * Get all sales enquiries with optional filters
   */
  async getAllEnquiries(filters?: {
    status?: string;
    slpCode?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
    includeDeleted?: boolean;
  }) {
    try {
      let query = `
        SELECT * FROM "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY"
        WHERE 1=1
      `;

      const parameters: any[] = [];

      // By default, exclude deleted records unless explicitly included
      if (!filters?.includeDeleted) {
        query += ` AND ("STATUS" IS NULL OR "STATUS" != 'Deleted')`;
      }

      if (filters?.status) {
        query += ` AND "STATUS" = ?`;
        parameters.push(filters.status);
      }

      if (filters?.slpCode) {
        query += ` AND "SLPCODE" = ?`;
        parameters.push(filters.slpCode);
      }

      if (filters?.customerId) {
        query += ` AND "CUSTOMERID" = ?`;
        parameters.push(filters.customerId);
      }

      if (filters?.fromDate) {
        query += ` AND "CREATEDDATE" >= ?`;
        parameters.push(filters.fromDate);
      }

      if (filters?.toDate) {
        query += ` AND "CREATEDDATE" <= ?`;
        parameters.push(filters.toDate);
      }

      query += ` ORDER BY "CREATEDDATE" DESC`;

      const result = await db.query(query, parameters);
      const chargeMap = await getEnquiryChargeMap(
        result
          .map((enquiry: any) => Number(enquiry.SLNO))
          .filter((id: number) => Number.isFinite(id))
      );

      // Parse VINDETAILS JSON string back to object for each record
      const enquiries = result.map((enquiry: any) => {
        const parsedVinDetails = enquiry.VINDETAILS
          ? JSON.parse(enquiry.VINDETAILS)
          : null;
        const charge =
          chargeMap.get(Number(enquiry.SLNO)) ??
          {
            ...extractChargeFromVinDetails(parsedVinDetails),
            details: null,
          };

        return {
          ...enquiry,
          VINDETAILS: parsedVinDetails,
          CHARGECODE: charge.code,
          CHARGENAME: charge.name,
          CHARGEPRICE: charge.price,
          CHARGEDETAILS: charge.details,
        };
      });

      logger.info(`Retrieved ${enquiries.length} sales enquiries`);
      return enquiries;
    } catch (error: any) {
      logger.error('Error fetching sales enquiries:', error);
      throw new Error('Failed to fetch sales enquiries: ' + error.message);
    }
  }

  /**
   * Get a specific sales enquiry by ID
   */
  async getEnquiryById(id: number) {
    try {
      const query = `
        SELECT * FROM "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY"
        WHERE "SLNO" = ?
      `;

      const result = await db.query(query, [id]);

      if (result.length === 0) {
        throw new Error('Sales enquiry not found');
      }

      // Parse VINDETAILS JSON string
      const enquiry = {
        ...result[0],
        VINDETAILS: result[0].VINDETAILS
          ? JSON.parse(result[0].VINDETAILS)
          : null,
      };
      const chargeMap = await getEnquiryChargeMap([id]);
      const charge =
        chargeMap.get(id) ??
        {
          ...extractChargeFromVinDetails(enquiry.VINDETAILS),
          details: null,
        };
      (enquiry as any).CHARGECODE = charge.code;
      (enquiry as any).CHARGENAME = charge.name;
      (enquiry as any).CHARGEPRICE = charge.price;
      (enquiry as any).CHARGEDETAILS = charge.details;

      logger.info(`Retrieved sales enquiry with ID: ${id}`);
      return enquiry;
    } catch (error: any) {
      logger.error('Error fetching sales enquiry:', error);
      throw new Error('Failed to fetch sales enquiry: ' + error.message);
    }
  }

  /**
   * Update an existing sales enquiry (PATCH semantics - only update provided fields)
   */
  async updateEnquiry(id: number, data: UpdateEnquiryData, updatedBy: string) {
    try {
      // Check if enquiry exists
      const existing = await this.getEnquiryById(id);
      if (!existing) {
        throw new Error('Sales enquiry not found');
      }

      const normalizedData: UpdateEnquiryData = { ...data };
      if (!normalizedData.vinNumber) {
        const vinFromDetails = extractVinFromUnknown(normalizedData.vinDetails);
        if (vinFromDetails) {
          normalizedData.vinNumber = vinFromDetails;
        }
      }

      // Use generic update utility
      const { updates, parameters } = buildUpdateQuery(
        normalizedData,
        enquiryFieldMapping,
        enquiryValueTransformers
      );

      const shouldSyncCharge =
        Object.prototype.hasOwnProperty.call(normalizedData, 'chargeCode') ||
        Object.prototype.hasOwnProperty.call(normalizedData, 'chargeName') ||
        Object.prototype.hasOwnProperty.call(normalizedData, 'chargePrice') ||
        Object.prototype.hasOwnProperty.call(normalizedData, 'chargeDetails');

      if (!validateUpdateQuery(updates)) {
        if (shouldSyncCharge) {
          await replaceEnquiryCharge(id, getChargePayload(normalizedData), updatedBy);
          logger.info(`Sales enquiry charge updated successfully: ${id}`);
          return { success: true, message: 'Sales enquiry updated successfully' };
        }

        return { success: true, message: 'No fields to update' };
      }

      // Add audit fields
      addAuditFields(updates, parameters, updatedBy);

      // Add ID for WHERE clause
      parameters.push(id);

      const query = `
        UPDATE "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY"
        SET ${updates.join(', ')}
        WHERE "SLNO" = ?
      `;

      await db.execute(query, parameters);

      if (shouldSyncCharge) {
        await replaceEnquiryCharge(id, getChargePayload(normalizedData), updatedBy);
      }

      logger.info(`Sales enquiry updated successfully: ${id}`);
      return { success: true, message: 'Sales enquiry updated successfully' };
    } catch (error: any) {
      logger.error('Error updating sales enquiry:', error);
      throw new Error('Failed to update sales enquiry: ' + error.message);
    }
  }

  /**
   * Update enquiry status (for quick status changes)
   */
  async updateEnquiryStatus(
    id: number,
    status: string,
    updatedBy: string,
    notes?: string
  ) {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      let query = `
        UPDATE "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY"
        SET "STATUS" = ?, "UPDATEDDATE" = ?, "UPDATEDBY" = ?
      `;

      const parameters: any[] = [status, currentDateTime, updatedBy];

      if (notes) {
        query += `, "FOLLOWUPNOTES" = ?`;
        parameters.push(notes);
      }

      query += ` WHERE "SLNO" = ?`;
      parameters.push(id);

      await db.execute(query, parameters);

      logger.info(`Sales enquiry status updated: ${id} -> ${status}`);
      return { success: true, message: 'Status updated successfully' };
    } catch (error: any) {
      logger.error('Error updating enquiry status:', error);
      throw new Error('Failed to update enquiry status: ' + error.message);
    }
  }

  /**
   * Delete a sales enquiry (soft delete by setting status to 'Deleted')
   */
  async deleteEnquiry(id: number, deletedBy: string) {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const query = `
        UPDATE "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY"
        SET "STATUS" = 'Deleted', "UPDATEDDATE" = ?, "UPDATEDBY" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [
        currentDateTime,
        deletedBy,
        id,
      ]);

      logger.info(`Sales enquiry deleted (soft delete): ${id}`);
      return { success: true, message: 'Sales enquiry deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting sales enquiry:', error);
      throw new Error('Failed to delete sales enquiry: ' + error.message);
    }
  }

  /**
   * Get dashboard data for salesperson from SAP procedure
   */
  async getSalespersonDashboard(slpCode: string | number) {
    try {
      const code = String(slpCode ?? '').trim();

      if (!code) {
        throw new Error('SLPCODE is required');
      }

      const query = `CALL "BI_NEGT_KSAISUZU"."DMS_KSA_100024"(?)`;
      const candidates: Array<string | number> = [code];
      if (/^\d+$/.test(code) && !/^0\d+/.test(code)) {
        candidates.push(Number(code));
      }

      let result: any[] = [];
      let usedCandidate: string | number = code;
      for (const candidate of candidates) {
        const rows = await db.query(query, [candidate]);
        if (rows.length > 0) {
          result = rows;
          usedCandidate = candidate;
          break;
        }
        result = rows;
        usedCandidate = candidate;
      }

      logger.info(
        { slpCode: code, usedCandidate, rows: result.length },
        'Retrieved salesperson dashboard data'
      );

      return result;
    } catch (error: any) {
      logger.error(
        { error: error?.message || error, slpCode },
        'Error fetching salesperson dashboard data'
      );
      throw new Error(
        'Failed to fetch salesperson dashboard data: ' + error.message
      );
    }
  }

  /**
   * Get enquiry statistics for dashboard
   */
  async getEnquiryStats(slpCode?: string) {
    try {
      let query = `
        SELECT
          "STATUS",
          COUNT(*) as "COUNT"
        FROM "BI_NEGT_KSAISUZU"."DMS_SALESENQUIRY"
        WHERE "STATUS" != 'Deleted'
      `;

      const parameters: any[] = [];

      if (slpCode) {
        query += ` AND "SLPCODE" = ?`;
        parameters.push(slpCode);
      }

      query += ` GROUP BY "STATUS"`;

      const result = await db.query(query, parameters);

      logger.info('Retrieved enquiry statistics');
      return result;
    } catch (error: any) {
      logger.error('Error fetching enquiry stats:', error);
      throw new Error('Failed to fetch enquiry stats: ' + error.message);
    }
  }
}

export default new EnquiryService();

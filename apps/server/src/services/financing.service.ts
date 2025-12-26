import { db } from './database.service.js';
import { logger } from '../utils/logger.js';

/**
 * Financing Service
 * Handles all database operations for enquiry financing schemes
 */
export const financingService = {
  /**
   * Get all financing schemes for an enquiry
   */
  async getByEnquiryId(enquiryId: number) {
    const query = `
      SELECT * FROM "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
      WHERE "ENQUIRY_SLNO" = ? AND "IS_DELETED" = 'N'
      ORDER BY "CREATED_DATE" DESC
    `;
    const rows = await db.query(query, [enquiryId]);
    return rows;
  },

  /**
   * Get financing scheme by ID
   */
  async getById(id: number) {
    const query = `
      SELECT * FROM "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
      WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
    `;
    const result = await db.queryOne(query, [id]);
    return result;
  },

  /**
   * Create a new financing scheme
   */
  async create(data: any) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const query = `
      INSERT INTO "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING" (
        "ENQUIRY_SLNO", "LENDER_CODE", "LENDER_NAME", "SCHEME_NAME",
        "VEHICLE_PRICE", "DOWNPAYMENT", "DOWNPAYMENT_PERCENT", "TRADE_IN_VALUE",
        "FINANCE_AMOUNT", "TERM_MONTHS", "INTEREST_RATE", "MONTHLY_PAYMENT",
        "TOTAL_INTEREST", "FDA", "GPV_BALLOON", "SALE_CODE",
        "STATUS", "IS_SELECTED",
        "CREATED_BY", "CREATED_DATE", "IS_DELETED"
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N')
    `;

    await db.execute(query, [
      data.enquirySlno,
      data.lenderCode,
      data.lenderName,
      data.schemeName || null,
      data.vehiclePrice || null,
      data.downpayment || null,
      data.downpaymentPercent || null,
      data.tradeInValue || null,
      data.financeAmount || null,
      data.termMonths,
      data.interestRate || null,
      data.monthlyPayment || null,
      data.totalInterest || null,
      data.fda || null,
      data.gpvBalloon || null,
      data.saleCode || null,
      data.status || 'Draft',
      data.isSelected || 'N',
      data.createdBy,
      currentDate,
    ]);

    const insertedId = await db.queryOne<{ SLNO: number }>(
      `SELECT "SLNO" FROM "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING" WHERE "ENQUIRY_SLNO" = ? ORDER BY "CREATED_DATE" DESC`,
      [data.enquirySlno]
    );

    logger.info({ enquiryId: data.enquirySlno, lender: data.lenderCode }, 'Financing scheme created');

    return {
      success: true,
      id: insertedId?.SLNO || 0,
    };
  },

  /**
   * Update an existing financing scheme
   */
  async update(id: number, data: any) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const query = `
      UPDATE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
      SET "LENDER_CODE" = ?,
          "LENDER_NAME" = ?,
          "SCHEME_NAME" = ?,
          "VEHICLE_PRICE" = ?,
          "DOWNPAYMENT" = ?,
          "DOWNPAYMENT_PERCENT" = ?,
          "TRADE_IN_VALUE" = ?,
          "FINANCE_AMOUNT" = ?,
          "TERM_MONTHS" = ?,
          "INTEREST_RATE" = ?,
          "MONTHLY_PAYMENT" = ?,
          "TOTAL_INTEREST" = ?,
          "FDA" = ?,
          "GPV_BALLOON" = ?,
          "SALE_CODE" = ?,
          "STATUS" = ?,
          "IS_SELECTED" = ?,
          "UPDATED_BY" = ?,
          "UPDATED_DATE" = ?
      WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
    `;

    await db.execute(query, [
      data.lenderCode,
      data.lenderName,
      data.schemeName || null,
      data.vehiclePrice || null,
      data.downpayment || null,
      data.downpaymentPercent || null,
      data.tradeInValue || null,
      data.financeAmount || null,
      data.termMonths,
      data.interestRate || null,
      data.monthlyPayment || null,
      data.totalInterest || null,
      data.fda || null,
      data.gpvBalloon || null,
      data.saleCode || null,
      data.status || 'Draft',
      data.isSelected || 'N',
      data.updatedBy,
      currentDate,
      id,
    ]);

    logger.info({ financingId: id }, 'Financing scheme updated');

    return { success: true };
  },

  /**
   * Delete a financing scheme (soft delete)
   */
  async delete(id: number, userId: string) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const query = `
      UPDATE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
      SET "IS_DELETED" = 'Y',
          "UPDATED_BY" = ?,
          "UPDATED_DATE" = ?
      WHERE "SLNO" = ?
    `;

    await db.execute(query, [userId, currentDate, id]);

    logger.info({ financingId: id }, 'Financing scheme deleted');

    return { success: true };
  },

  /**
   * Get all active lenders
   */
  async getLenders() {
    const query = `
      SELECT * FROM "BI_NEGT_KSA"."DMS_LENDERS"
      WHERE "IS_ACTIVE" = 'Y'
      ORDER BY "LENDER_NAME"
    `;
    const rows = await db.query(query);
    return rows;
  },

  /**
   * Mark a financing scheme as selected (preferred)
   * Automatically unselects other schemes for the same enquiry
   */
  async setPreferred(id: number, enquiryId: number, userId: string) {
    const currentDate = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // First, unselect all schemes for this enquiry
    await db.execute(
      `UPDATE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
       SET "IS_SELECTED" = 'N', "UPDATED_BY" = ?, "UPDATED_DATE" = ?
       WHERE "ENQUIRY_SLNO" = ? AND "IS_DELETED" = 'N'`,
      [userId, currentDate, enquiryId]
    );

    // Then select the chosen scheme
    await db.execute(
      `UPDATE "BI_NEGT_KSA"."DMS_ENQUIRY_FINANCING"
       SET "IS_SELECTED" = 'Y', "UPDATED_BY" = ?, "UPDATED_DATE" = ?
       WHERE "SLNO" = ? AND "IS_DELETED" = 'N'`,
      [userId, currentDate, id]
    );

    logger.info({ financingId: id, enquiryId }, 'Financing scheme set as preferred');

    return { success: true };
  },
};

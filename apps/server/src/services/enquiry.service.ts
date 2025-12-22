import { db } from './database.service.js';
import { logger } from '../utils/logger.js';

class EnquiryService {
  /**
   * Create a new sales enquiry
   */
  async createEnquiry(data: any) {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const query = `
        INSERT INTO "BI_NEGT_KSA"."DMS_SALESENQUIRY" (
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
        data.vinNumber || null,
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

      await db.execute(query, parameters);

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
  }) {
    try {
      let query = `
        SELECT * FROM "BI_NEGT_KSA"."DMS_SALESENQUIRY"
        WHERE 1=1
      `;

      const parameters: any[] = [];

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

      // Parse VINDETAILS JSON string back to object for each record
      const enquiries = result.map((enquiry: any) => ({
        ...enquiry,
        VINDETAILS: enquiry.VINDETAILS
          ? JSON.parse(enquiry.VINDETAILS)
          : null,
      }));

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
        SELECT * FROM "BI_NEGT_KSA"."DMS_SALESENQUIRY"
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

      logger.info(`Retrieved sales enquiry with ID: ${id}`);
      return enquiry;
    } catch (error: any) {
      logger.error('Error fetching sales enquiry:', error);
      throw new Error('Failed to fetch sales enquiry: ' + error.message);
    }
  }

  /**
   * Update an existing sales enquiry
   */
  async updateEnquiry(id: number, data: any, updatedBy: string) {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const query = `
        UPDATE "BI_NEGT_KSA"."DMS_SALESENQUIRY"
        SET
          "CUSTOMERID" = ?, "CUSTOMERNAME" = ?, "ADDRESS" = ?, "POSTCODE" = ?,
          "HOMEPHONE" = ?, "WORKPHONE" = ?, "MOBILE" = ?, "HOMEEMAIL" = ?,
          "MAKE" = ?, "MAKENAME" = ?, "MODEL" = ?, "MODELNAME" = ?,
          "VARIANT" = ?, "VARIANTNAME" = ?, "YEAR" = ?, "COLOR" = ?,
          "SUPPCATNUM" = ?, "MODELCODE" = ?, "QUANTITY" = ?, "VINNUMBER" = ?, "VINDETAILS" = ?,
          "BRANCH" = ?, "BRANCHNAME" = ?, "BUDGET" = ?, "FINANCING" = ?,
          "PREFERREDCONTACT" = ?, "PREFERREDTIME" = ?, "PREFERREDDELIVERY" = ?,
          "SOURCE" = ?, "SALESTYPE" = ?,
          "TRADEINMAKE" = ?, "TRADEINMODEL" = ?, "TRADEINYEAR" = ?,
          "TRADEINKMS" = ?, "TRADEINEXPECTEDPRICE" = ?,
          "SALESPERSON" = ?, "SLPCODE" = ?, "NOTES" = ?,
          "STATUS" = ?, "PRIORITY" = ?, "FOLLOWUPDATE" = ?, "FOLLOWUPNOTES" = ?,
          "UPDATEDDATE" = ?, "UPDATEDBY" = ?
        WHERE "SLNO" = ?
      `;

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
        data.vinNumber || null,
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
        updatedBy,
        id,
      ];

      await db.execute(query, parameters);

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
        UPDATE "BI_NEGT_KSA"."DMS_SALESENQUIRY"
        SET "STATUS" = ?, "UPDATEDDATE" = ?, "UPDATEDBY" = ?
      `;

      const parameters = [status, currentDateTime, updatedBy];

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
        UPDATE "BI_NEGT_KSA"."DMS_SALESENQUIRY"
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
   * Get enquiry statistics for dashboard
   */
  async getEnquiryStats(slpCode?: string) {
    try {
      let query = `
        SELECT
          "STATUS",
          COUNT(*) as "COUNT"
        FROM "BI_NEGT_KSA"."DMS_SALESENQUIRY"
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

import { db } from './database.service.js';
import { logger } from '../utils/logger.js';

export interface TradeInAppraisal {
  SLNO: number;
  ENQUIRY_SLNO: number;
  REGISTRATION_NUMBER?: string;
  VIN?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
  DESCRIPTION?: string;
  COLOUR?: string;
  TRIM?: string;
  BODY_STYLE?: string;
  TRANSMISSION?: string;
  FUEL_TYPE?: string;
  ENGINE_SIZE?: string;
  REGISTRATION_DATE?: string;
  ODOMETER_READING?: string;
  NUMBER_OF_DOORS?: string;
  CUSTOMER_EXPECTED_PRICE?: string;
  MARKET_VALUE?: string;
  APPRAISAL_OFFER?: string;
  APPRAISAL_STATUS?: 'Pending' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  REQUESTED_BY?: string;
  REQUESTED_DATE?: string;
  ASSIGNED_TO?: string;
  APPRAISED_BY?: string;
  APPRAISED_DATE?: string;
  REQUEST_NOTES?: string;
  APPRAISAL_NOTES?: string;
  CREATED_BY?: string;
  CREATED_DATE?: string;
  UPDATED_BY?: string;
  UPDATED_DATE?: string;
  IS_DELETED?: string;
}

export interface CreateTradeInAppraisalData {
  enquirySlno: number;
  registrationNumber?: string;
  vin?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
  description?: string;
  colour?: string;
  trim?: string;
  bodyStyle?: string;
  transmission?: string;
  fuelType?: string;
  engineSize?: string;
  registrationDate?: string;
  odometerReading?: string;
  numberOfDoors?: string;
  customerExpectedPrice?: string;
  marketValue?: string;
  appraisalOffer?: string;
  createdBy: string;
}

export interface UpdateTradeInAppraisalData {
  registrationNumber?: string;
  vin?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
  description?: string;
  colour?: string;
  trim?: string;
  bodyStyle?: string;
  transmission?: string;
  fuelType?: string;
  engineSize?: string;
  registrationDate?: string;
  odometerReading?: string;
  numberOfDoors?: string;
  customerExpectedPrice?: string;
  marketValue?: string;
  appraisalOffer?: string;
  updatedBy: string;
}

export interface RequestAppraisalData {
  assignedTo: string;
  requestNotes?: string;
  requestedBy: string;
}

class TradeInAppraisalService {
  /**
   * Create a new trade-in appraisal
   */
  async createTradeInAppraisal(data: CreateTradeInAppraisalData): Promise<{ success: boolean; id: number }> {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const query = `
        INSERT INTO "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL" (
          "ENQUIRY_SLNO",
          "REGISTRATION_NUMBER", "VIN", "MANUFACTURER", "MODEL", "VARIANT",
          "DESCRIPTION", "COLOUR", "TRIM", "BODY_STYLE", "TRANSMISSION",
          "FUEL_TYPE", "ENGINE_SIZE", "REGISTRATION_DATE", "ODOMETER_READING",
          "NUMBER_OF_DOORS", "CUSTOMER_EXPECTED_PRICE", "MARKET_VALUE", "APPRAISAL_OFFER",
          "CREATED_BY", "CREATED_DATE", "IS_DELETED"
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'N')
      `;

      const parameters = [
        data.enquirySlno,
        data.registrationNumber || null,
        data.vin || null,
        data.manufacturer || null,
        data.model || null,
        data.variant || null,
        data.description || null,
        data.colour || null,
        data.trim || null,
        data.bodyStyle || null,
        data.transmission || null,
        data.fuelType || null,
        data.engineSize || null,
        data.registrationDate || null,
        data.odometerReading || null,
        data.numberOfDoors || null,
        data.customerExpectedPrice || null,
        data.marketValue || null,
        data.appraisalOffer || null,
        data.createdBy,
        currentDateTime,
      ];

      await db.execute(query, parameters);

      // Get the last inserted ID
      const idQuery = `SELECT "SLNO" FROM "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
                       WHERE "ENQUIRY_SLNO" = ? ORDER BY "SLNO" DESC LIMIT 1`;
      const result = await db.query(idQuery, [data.enquirySlno]);

      logger.info('Trade-in appraisal created successfully');
      return {
        success: true,
        id: result[0]?.SLNO || 0
      };
    } catch (error: any) {
      logger.error('Error creating trade-in appraisal:', error);
      throw new Error('Failed to create trade-in appraisal: ' + error.message);
    }
  }

  /**
   * Get trade-in appraisal by ID
   */
  async getTradeInAppraisalById(id: number): Promise<TradeInAppraisal | null> {
    try {
      const query = `
        SELECT * FROM "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
      `;

      const result = await db.query(query, [id]);

      if (result.length === 0) {
        return null;
      }

      return result[0] as TradeInAppraisal;
    } catch (error: any) {
      logger.error('Error fetching trade-in appraisal by ID:', error);
      throw new Error('Failed to fetch trade-in appraisal: ' + error.message);
    }
  }

  /**
   * Get trade-in appraisal by enquiry ID
   */
  async getTradeInAppraisalByEnquiryId(enquirySlno: number): Promise<TradeInAppraisal | null> {
    try {
      const query = `
        SELECT * FROM "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
        WHERE "ENQUIRY_SLNO" = ? AND "IS_DELETED" = 'N'
        ORDER BY "CREATED_DATE" DESC
        LIMIT 1
      `;

      const result = await db.query(query, [enquirySlno]);

      if (result.length === 0) {
        return null;
      }

      return result[0] as TradeInAppraisal;
    } catch (error: any) {
      logger.error('Error fetching trade-in appraisal by enquiry ID:', error);
      throw new Error('Failed to fetch trade-in appraisal: ' + error.message);
    }
  }

  /**
   * Update trade-in appraisal
   */
  async updateTradeInAppraisal(id: number, data: UpdateTradeInAppraisalData): Promise<{ success: boolean }> {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const fields: string[] = [];
      const parameters: any[] = [];

      if (data.registrationNumber !== undefined) {
        fields.push('"REGISTRATION_NUMBER" = ?');
        parameters.push(data.registrationNumber);
      }
      if (data.vin !== undefined) {
        fields.push('"VIN" = ?');
        parameters.push(data.vin);
      }
      if (data.manufacturer !== undefined) {
        fields.push('"MANUFACTURER" = ?');
        parameters.push(data.manufacturer);
      }
      if (data.model !== undefined) {
        fields.push('"MODEL" = ?');
        parameters.push(data.model);
      }
      if (data.variant !== undefined) {
        fields.push('"VARIANT" = ?');
        parameters.push(data.variant);
      }
      if (data.description !== undefined) {
        fields.push('"DESCRIPTION" = ?');
        parameters.push(data.description);
      }
      if (data.colour !== undefined) {
        fields.push('"COLOUR" = ?');
        parameters.push(data.colour);
      }
      if (data.trim !== undefined) {
        fields.push('"TRIM" = ?');
        parameters.push(data.trim);
      }
      if (data.bodyStyle !== undefined) {
        fields.push('"BODY_STYLE" = ?');
        parameters.push(data.bodyStyle);
      }
      if (data.transmission !== undefined) {
        fields.push('"TRANSMISSION" = ?');
        parameters.push(data.transmission);
      }
      if (data.fuelType !== undefined) {
        fields.push('"FUEL_TYPE" = ?');
        parameters.push(data.fuelType);
      }
      if (data.engineSize !== undefined) {
        fields.push('"ENGINE_SIZE" = ?');
        parameters.push(data.engineSize);
      }
      if (data.registrationDate !== undefined) {
        fields.push('"REGISTRATION_DATE" = ?');
        parameters.push(data.registrationDate);
      }
      if (data.odometerReading !== undefined) {
        fields.push('"ODOMETER_READING" = ?');
        parameters.push(data.odometerReading);
      }
      if (data.numberOfDoors !== undefined) {
        fields.push('"NUMBER_OF_DOORS" = ?');
        parameters.push(data.numberOfDoors);
      }
      if (data.customerExpectedPrice !== undefined) {
        fields.push('"CUSTOMER_EXPECTED_PRICE" = ?');
        parameters.push(data.customerExpectedPrice);
      }
      if (data.marketValue !== undefined) {
        fields.push('"MARKET_VALUE" = ?');
        parameters.push(data.marketValue);
      }
      if (data.appraisalOffer !== undefined) {
        fields.push('"APPRAISAL_OFFER" = ?');
        parameters.push(data.appraisalOffer);
      }

      // Add audit fields
      fields.push('"UPDATED_BY" = ?');
      parameters.push(data.updatedBy);
      fields.push('"UPDATED_DATE" = ?');
      parameters.push(currentDateTime);

      // Add ID parameter for WHERE clause
      parameters.push(id);

      if (fields.length === 2) { // Only audit fields, no actual data
        return { success: true };
      }

      const query = `
        UPDATE "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
        SET ${fields.join(', ')}
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
      `;

      await db.execute(query, parameters);

      logger.info('Trade-in appraisal updated successfully');
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating trade-in appraisal:', error);
      throw new Error('Failed to update trade-in appraisal: ' + error.message);
    }
  }

  /**
   * Request appraisal - assign to a user and set status to Pending
   */
  async requestAppraisal(id: number, data: RequestAppraisalData): Promise<{ success: boolean }> {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const query = `
        UPDATE "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
        SET "APPRAISAL_STATUS" = 'Pending',
            "ASSIGNED_TO" = ?,
            "REQUESTED_BY" = ?,
            "REQUESTED_DATE" = ?,
            "REQUEST_NOTES" = ?,
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
      `;

      const parameters = [
        data.assignedTo,
        data.requestedBy,
        currentDateTime,
        data.requestNotes || null,
        data.requestedBy,
        currentDateTime,
        id,
      ];

      await db.execute(query, parameters);

      logger.info('Appraisal request sent successfully');
      return { success: true };
    } catch (error: any) {
      logger.error('Error requesting appraisal:', error);
      throw new Error('Failed to request appraisal: ' + error.message);
    }
  }

  /**
   * Update appraisal status
   */
  async updateAppraisalStatus(
    id: number,
    status: 'Pending' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected',
    appraisalNotes?: string,
    appraisedBy?: string
  ): Promise<{ success: boolean }> {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const fields = ['"APPRAISAL_STATUS" = ?'];
      const parameters: any[] = [status];

      if (appraisalNotes !== undefined) {
        fields.push('"APPRAISAL_NOTES" = ?');
        parameters.push(appraisalNotes);
      }

      if (appraisedBy) {
        fields.push('"APPRAISED_BY" = ?');
        parameters.push(appraisedBy);
        fields.push('"APPRAISED_DATE" = ?');
        parameters.push(currentDateTime);
        fields.push('"UPDATED_BY" = ?');
        parameters.push(appraisedBy);
      }

      fields.push('"UPDATED_DATE" = ?');
      parameters.push(currentDateTime);
      parameters.push(id);

      const query = `
        UPDATE "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
        SET ${fields.join(', ')}
        WHERE "SLNO" = ? AND "IS_DELETED" = 'N'
      `;

      await db.execute(query, parameters);

      logger.info('Appraisal status updated successfully');
      return { success: true };
    } catch (error: any) {
      logger.error('Error updating appraisal status:', error);
      throw new Error('Failed to update appraisal status: ' + error.message);
    }
  }

  /**
   * Soft delete trade-in appraisal
   */
  async deleteTradeInAppraisal(id: number, deletedBy: string): Promise<{ success: boolean }> {
    try {
      const currentDateTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const query = `
        UPDATE "BI_NEGT_KSA"."DMS_TRADEIN_APPRAISAL"
        SET "IS_DELETED" = 'Y',
            "UPDATED_BY" = ?,
            "UPDATED_DATE" = ?
        WHERE "SLNO" = ?
      `;

      await db.execute(query, [deletedBy, currentDateTime, id]);

      logger.info('Trade-in appraisal deleted successfully');
      return { success: true };
    } catch (error: any) {
      logger.error('Error deleting trade-in appraisal:', error);
      throw new Error('Failed to delete trade-in appraisal: ' + error.message);
    }
  }
}

export const tradeInAppraisalService = new TradeInAppraisalService();

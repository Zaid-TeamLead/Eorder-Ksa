import { logger } from '@/utils/logger';
import { db } from './database.service';
import {
  buildUpdateQuery,
  validateUpdateQuery,
  addAuditFields,
  getCurrentTimestamp,
} from '../utils/db-helpers.js';
import {
  bookTestDriveFieldMapping,
  bookTestDriveValueTransformers,
} from '../schemas/shared/field-mappings.js';

export interface BookTestDriveData {
  // Customer Information
  customerId?: string;
  customerName: string;
  companyName?: string;
  postcode?: string;
  address: string;
  phoneNumber?: string;
  email?: string;

  // Vehicle Booking Details
  registrationNumber?: string;
  manufacturer?: string;
  manufacturerName?: string;
  model?: string;
  modelName?: string;
  variant?: string;
  variantName?: string;
  description?: string;
  bodyStyle?: string;

  // Booking Details
  dateOut: string;
  timeOut?: string;
  dateIn: string;
  timeIn?: string;
  outBranch?: string;
  outBranchName?: string;
  inBranch?: string;
  inBranchName?: string;
  salesExecutive?: string;
  salesExecutiveName?: string;
  approvedBy?: string;
  quickBooking?: boolean;
  newOrUsed?: 'N' | 'U';
  newOrUsedLabel?: string;

  // Optional Notes
  notes?: string;

  fuelOut?: string;
  fuelIn?: string;
  mileageOut?: string;
  mileageIn?: string;

  // Audit
  createdBy: string;
}

export interface BookTestDrive {
  SLNO: number;
  CUSTOMERID?: string;
  CUSTOMERNAME: string;
  COMPANYNAME?: string;
  POSTCODE?: string;
  ADDRESS: string;
  PHONENUMBER?: string;
  EMAIL?: string;
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MANUFACTURERNAME?: string;
  MODEL?: string;
  MODELNAME?: string;
  VARIANT?: string;
  VARIANTNAME?: string;
  DESCRIPTION?: string;
  BODYSTYLE?: string;
  DATEOUT: string;
  TIMEOUT?: string;
  DATEIN: string;
  TIMEIN?: string;
  OUTBRANCH?: string;
  OUTBRANCHNAME?: string;
  INBRANCH?: string;
  INBRANCHNAME?: string;
  SALESEXECUTIVE?: string;
  SALESEXECUTIVENAME?: string;
  APPROVEDBY?: string;
  QUICKBOOKING?: string;
  NEWORUSED?: string;
  NEWORUSEDLABEL?: string;
  NOTES?: string;
  FUELOUT?: string;
  FUELIN?: string;
  MILEAGEOUT?: string;
  MILEAGEIN?: string;
  CREATEDDATE?: string;
  CREATEDBY?: string;
  UPDATEDDATE?: string;
  UPDATEDBY?: string;
  STATUS?: string;
}

export const createBookTestDrive = async (
  data: BookTestDriveData
): Promise<BookTestDrive> => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const createdBy = data.createdBy.substring(0, 8); // Ensure CREATEDBY is max 8 chars

    // Convert date strings to SECONDDATE format (YYYY-MM-DD HH:MM:SS)
    // dateOut and dateIn are in YYYY-MM-DD format, timeOut and timeIn can be in HH:MM or HH:MM:SS format
    // These fields are required, so we ensure they're never null
    const formatDateTime = (date: string, time?: string): string => {
      if (!date) {
        throw new Error('Date is required');
      }
      let timePart = '00:00:00';
      if (time) {
        // If time already has seconds (HH:MM:SS), use it as is
        // Otherwise, append :00 to make it HH:MM:00
        const timeParts = time.split(':');
        if (timeParts.length === 2) {
          // HH:MM format, append :00
          timePart = `${time}:00`;
        } else if (timeParts.length === 3) {
          // HH:MM:SS format, use as is
          timePart = time;
        } else {
          // Invalid format, default to 00:00:00
          timePart = '00:00:00';
        }
      }
      return `${date} ${timePart}`;
    };

    const dateOut = formatDateTime(data.dateOut, data.timeOut);
    const dateIn = formatDateTime(data.dateIn, data.timeIn);

    // Convert boolean to string
    const quickBooking =
      data.quickBooking !== undefined
        ? data.quickBooking
          ? 'true'
          : 'false'
        : null;

    await db.execute(
      `INSERT INTO "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" 
       (
         "CUSTOMERID", "CUSTOMERNAME", "POSTCODE", "ADDRESS", 
         "PHONENUMBER", "EMAIL", "REGISTRATIONNUM", "MANUFACTURER",
         "MODEL",  "VARIANT","DESCRIPTION", "BODYSTYLE",
         "DATEOUT", "TIMEOUT", "DATEIN", "TIMEIN",
          "OUTBRANCH", "OUTBRANCHNAME", "INBRANCH", "INBRANCHNAME", 
          "SALESEXECUTIVE", "APPROVEDBY", "QUICKBOOKING", "NEWORUSED",
           "NEWORUSEDLABEL", "NOTES", "CREATEDDATE", "CREATEDBY", "STATUS",  "FUELOUT", "FUELIN", "MILEAGEOUT", "MILEAGEIN"
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.customerId ?? null,
        data.customerName ?? null,
        data.postcode ?? null,
        data.address ?? null,
        data.phoneNumber ?? null,
        data.email ?? null,
        data.registrationNumber ?? null,
        data.manufacturer ?? null,
        data.model ?? null,
        data.variant ?? null,
        data.description ?? null,
        data.bodyStyle ?? null,
        dateOut, // Required field
        data.timeOut ?? null,
        dateIn, // Required field
        data.timeIn ?? null,
        data.outBranch ?? null,
        data.outBranchName ?? null,
        data.inBranch ?? null,
        data.inBranchName ?? null,
        data.salesExecutive ?? null,
        data.approvedBy ?? null,
        quickBooking ?? null,
        data.newOrUsed ?? null,
        data.newOrUsedLabel ?? null,
        data.notes ?? null,
        now,
        createdBy,
        'active', // Default status
        data.fuelOut ?? null,
        data.fuelIn ?? null,
        data.mileageOut ?? null,
        data.mileageIn ?? null,
      ]
    );

    // Get the inserted record
    const insertedId = await db.queryOne<{ SLNO: number }>(
      `SELECT "SLNO" FROM "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" 
       WHERE "CREATEDBY" = ? AND "CREATEDDATE" = ? 
       ORDER BY "SLNO" DESC LIMIT 1`,
      [createdBy, now]
    );

    if (insertedId && insertedId.SLNO) {
      const bookTestDrive = await getBookTestDriveById(insertedId.SLNO);
      if (bookTestDrive) {
        return bookTestDrive;
      }
    }

    throw new Error('Failed to retrieve created book test drive');
  } catch (error) {
    logger.error(error, 'Failed to create book test drive');
    throw new Error('Failed to create book test drive');
  }
};

export const getAllBookTestDrives = async (): Promise<BookTestDrive[]> => {
  try {
    const bookings = await db.query<BookTestDrive>(
      `SELECT * FROM "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" ORDER BY "SLNO" DESC`
    );
    return bookings;
  } catch (error) {
    logger.error(error, 'Failed to get all book test drives');
    throw new Error('Failed to get all book test drives');
  }
};

export interface UpdateBookTestDriveData {
  // Customer Information
  customerId?: string;
  customerName?: string;
  postcode?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;

  // Vehicle Booking Details
  registrationNumber?: string;
  manufacturer?: string;
  manufacturerName?: string;
  model?: string;
  modelName?: string;
  variant?: string;
  variantName?: string;
  description?: string;
  bodyStyle?: string;

  // Booking Details
  dateOut?: string;
  timeOut?: string;
  dateIn?: string;
  timeIn?: string;
  outBranch?: string;
  outBranchName?: string;
  inBranch?: string;
  inBranchName?: string;
  salesExecutive?: string;
  salesExecutiveName?: string;
  approvedBy?: string;
  quickBooking?: boolean;
  newOrUsed?: 'N' | 'U';
  newOrUsedLabel?: string;

  // Optional Notes
  notes?: string;
  fuelOut?: string;
  fuelIn?: string;
  mileageOut?: string;
  mileageIn?: string;
}

// Helper function for date formatting
function formatDateTime(date: string, time?: string): string | null {
  if (!date) return null;
  let timePart = '00:00:00';
  if (time) {
    // If time already has seconds (HH:MM:SS), use it as is
    // Otherwise, append :00 to make it HH:MM:00
    const timeParts = time.split(':');
    if (timeParts.length === 2) {
      // HH:MM format, append :00
      timePart = `${time}:00`;
    } else if (timeParts.length === 3) {
      // HH:MM:SS format, use as is
      timePart = time;
    } else {
      // Invalid format, default to 00:00:00
      timePart = '00:00:00';
    }
  }
  return `${date} ${timePart}`;
}

export const updateBookTestDrive = async (
  id: number,
  data: UpdateBookTestDriveData,
  updatedBy?: string
): Promise<BookTestDrive | null> => {
  try {
    // Check if booking exists
    const existing = await getBookTestDriveById(id);
    if (!existing) {
      throw new Error('Book test drive not found');
    }

    // Handle special date formatting if dateOut/dateIn are provided
    const processedData = { ...data };
    if (data.dateOut !== undefined) {
      processedData.dateOut = formatDateTime(data.dateOut, data.timeOut) || data.dateOut;
    }
    if (data.dateIn !== undefined) {
      processedData.dateIn = formatDateTime(data.dateIn, data.timeIn) || data.dateIn;
    }

    // Use generic update utility
    const { updates, parameters } = buildUpdateQuery(
      processedData,
      bookTestDriveFieldMapping,
      bookTestDriveValueTransformers
    );

    if (!validateUpdateQuery(updates)) {
      return existing; // No updates to make
    }

    // Add audit fields
    if (updatedBy) {
      addAuditFields(updates, parameters, updatedBy);
    } else {
      const currentDateTime = getCurrentTimestamp();
      updates.push('"UPDATEDDATE" = ?');
      parameters.push(currentDateTime);
    }

    // Add ID for WHERE clause
    parameters.push(id);

    const sql = `UPDATE "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE"
                 SET ${updates.join(', ')}
                 WHERE "SLNO" = ?`;

    await db.execute(sql, parameters);

    return await getBookTestDriveById(id);
  } catch (error) {
    logger.error(error, 'Failed to update book test drive');
    throw new Error('Failed to update book test drive');
  }
};

export const getBookTestDriveById = async (
  id: number
): Promise<BookTestDrive | null> => {
  try {
    const booking = await db.queryOne<BookTestDrive>(
      `SELECT * FROM "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" WHERE "SLNO" = ?`,
      [id]
    );
    return booking;
  } catch (error) {
    logger.error(error, 'Failed to get book test drive by id');
    throw new Error('Failed to get book test drive by id');
  }
};

/**
 * Check vehicle availability for a specific time period
 */
export const checkVehicleAvailability = async (
  registrationNum: string,
  dateOut: string,
  dateIn: string
): Promise<boolean> => {
  try {
    const query = `
      SELECT COUNT(*) as "COUNT"
      FROM "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE"
      WHERE "REGISTRATIONNUM" = ?
        AND "STATUS" NOT IN ('Cancelled', 'Completed', 'Returned')
        AND (
          ("DATEOUT" <= ? AND "DATEIN" >= ?) OR
          ("DATEOUT" <= ? AND "DATEIN" >= ?) OR
          ("DATEOUT" >= ? AND "DATEIN" <= ?)
        )
    `;

    const result = await db.query(query, [
      registrationNum,
      dateIn,
      dateOut,
      dateIn,
      dateIn,
      dateOut,
      dateIn,
    ]);

    const count = result[0]?.COUNT || 0;
    return count === 0; // Available if no overlapping bookings
  } catch (error) {
    logger.error(error, 'Error checking vehicle availability');
    throw new Error('Failed to check vehicle availability');
  }
};

/**
 * Get all vehicles that are currently on test drive
 */
export const getCurrentlyBookedVehicles = async (): Promise<string[]> => {
  try {
    const currentDateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const query = `
      SELECT DISTINCT "REGISTRATIONNUM"
      FROM "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE"
      WHERE "STATUS" NOT IN ('Cancelled', 'Completed', 'Returned')
        AND "DATEOUT" <= ?
        AND "DATEIN" >= ?
    `;

    const result = await db.query<{ REGISTRATIONNUM: string }>(query, [
      currentDateTime,
      currentDateTime,
    ]);

    return result.map((row) => row.REGISTRATIONNUM).filter(Boolean);
  } catch (error) {
    logger.error(error, 'Error getting currently booked vehicles');
    throw new Error('Failed to get currently booked vehicles');
  }
};

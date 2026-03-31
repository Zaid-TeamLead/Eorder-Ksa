import { logger } from '@/utils/logger';
import { db } from './database.service';
import {
  buildUpdateQuery,
  validateUpdateQuery,
  addAuditFields,
} from '../utils/db-helpers.js';
import {
  getCurrentTimestamp,
  formatDateTime,
  formatDateTimeRequired,
} from '../utils/date-helpers.js';
import {
  bookTestDriveFieldMapping,
  bookTestDriveValueTransformers,
} from '../schemas/shared/field-mappings.js';

const BOOK_TEST_DRIVE_DB_SCHEMA = (() => {
  const raw = process.env.BOOK_TEST_DRIVE_DB_SCHEMA || 'BI_NEGT_KSAISUZU';
  const normalized = raw.trim().toUpperCase();
  if (!/^[A-Z0-9_]+$/.test(normalized)) {
    throw new Error(`Invalid BOOK_TEST_DRIVE_DB_SCHEMA identifier: ${raw}`);
  }
  return normalized;
})();

export interface BookTestDriveData {
  // Customer Information
  customerId?: string;
  customerName: string;
  postcode?: string;
  address: string;
  phoneNumber?: string;
  email?: string;

  // Vehicle Booking Details
  registrationNumber?: string;
  manufacturer?: string;
  model?: string;
  variant?: string;
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
  POSTCODE?: string;
  ADDRESS: string;
  PHONENUMBER?: string;
  EMAIL?: string;
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
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
    const nextSlnoRow = await db.queryOne<{ SLNO: number }>(
      `SELECT COALESCE(MAX("SLNO"), 0) + 1 AS "SLNO"
       FROM "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE"`
    );
    const nextSlno = nextSlnoRow?.SLNO;

    if (!nextSlno) {
      throw new Error('Failed to generate next test drive SLNO');
    }

    // Convert date strings to SECONDDATE format (YYYY-MM-DD HH:MM:SS)
    // dateOut and dateIn are in YYYY-MM-DD format, timeOut and timeIn can be in HH:MM or HH:MM:SS format
    // These fields are required, so we ensure they're never null
    const dateOut = formatDateTimeRequired(data.dateOut, data.timeOut);
    const dateIn = formatDateTimeRequired(data.dateIn, data.timeIn);

    // Convert boolean to string
    const quickBooking =
      data.quickBooking !== undefined
        ? data.quickBooking
          ? 'true'
          : 'false'
        : null;

    await db.execute(
      `INSERT INTO "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE" 
       (
         "SLNO", "CUSTOMERID", "CUSTOMERNAME", "POSTCODE", "ADDRESS", 
         "PHONENUMBER", "EMAIL", "REGISTRATIONNUM", "MANUFACTURER",
         "MODEL",  "VARIANT","DESCRIPTION", "BODYSTYLE",
         "DATEOUT", "TIMEOUT", "DATEIN", "TIMEIN",
          "OUTBRANCH", "OUTBRANCHNAME", "INBRANCH", "INBRANCHNAME", 
          "SALESEXECUTIVE", "APPROVEDBY", "QUICKBOOKING", "NEWORUSED",
           "NEWORUSEDLABEL", "NOTES", "CREATEDDATE", "CREATEDBY", "STATUS",  "FUELOUT", "FUELIN", "MILEAGEOUT", "MILEAGEIN"
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nextSlno,
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
      `SELECT "SLNO" FROM "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE" 
       WHERE "SLNO" = ?`,
      [nextSlno]
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to create book test drive: ${message}`);
  }
};

export const getAllBookTestDrives = async (filters?: {
  slpCode?: string;
  status?: string;
  includeDeleted?: boolean;
}): Promise<BookTestDrive[]> => {
  try {
    let query = `SELECT * FROM "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE" WHERE 1=1`;
    const parameters: any[] = [];

    // Exclude cancelled/deleted by default
    if (!filters?.includeDeleted) {
      query += ` AND ("STATUS" IS NULL OR "STATUS" NOT IN ('Cancelled', 'Deleted'))`;
    }

    if (filters?.slpCode) {
      query += ` AND "SALESEXECUTIVE" = ?`;
      parameters.push(filters.slpCode);
    }

    if (filters?.status) {
      query += ` AND "STATUS" = ?`;
      parameters.push(filters.status);
    }

    query += ` ORDER BY "SLNO" DESC`;

    const bookings = await db.query<BookTestDrive>(query, parameters);
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
  model?: string;
  variant?: string;
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

    const sql = `UPDATE "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE"
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
      `SELECT * FROM "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE" WHERE "SLNO" = ?`,
      [id]
    );
    return booking;
  } catch (error) {
    logger.error(error, 'Failed to get book test drive by id');
    throw new Error('Failed to get book test drive by id');
  }
};

/**
 * Delete a test drive booking (soft delete by setting status to Cancelled)
 */
export const deleteBookTestDrive = async (
  id: number,
  deletedBy: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const existing = await getBookTestDriveById(id);
    if (!existing) {
      throw new Error('Book test drive not found');
    }

    const currentDateTime = getCurrentTimestamp();

    const query = `
      UPDATE "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE"
      SET "STATUS" = 'Cancelled', "UPDATEDDATE" = ?, "UPDATEDBY" = ?
      WHERE "SLNO" = ?
    `;

    await db.execute(query, [
      currentDateTime,
      deletedBy.substring(0, 8),
      id,
    ]);

    logger.info(`Book test drive deleted (soft delete): ${id}`);
    return { success: true, message: 'Book test drive deleted successfully' };
  } catch (error) {
    logger.error(error, 'Failed to delete book test drive');
    throw new Error('Failed to delete book test drive');
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
      FROM "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE"
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
      FROM "${BOOK_TEST_DRIVE_DB_SCHEMA}"."DMS_BOOKTESTDRIVE"
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

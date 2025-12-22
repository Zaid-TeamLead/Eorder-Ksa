import { logger } from '@/utils/logger';
import { db } from './database.service';

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

    const updates: string[] = [];
    const values: any[] = [];

    // Format date/time if provided
    const formatDateTime = (date: string, time?: string): string | null => {
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
    };

    // Customer Information
    if (data.customerId !== undefined) {
      updates.push('"CUSTOMERID" = ?');
      values.push(data.customerId || null);
    }
    if (data.customerName !== undefined) {
      updates.push('"CUSTOMERNAME" = ?');
      values.push(data.customerName || null);
    }
    if (data.postcode !== undefined) {
      updates.push('"POSTCODE" = ?');
      values.push(data.postcode || null);
    }
    if (data.address !== undefined) {
      updates.push('"ADDRESS" = ?');
      values.push(data.address || null);
    }
    if (data.phoneNumber !== undefined) {
      updates.push('"PHONENUMBER" = ?');
      values.push(data.phoneNumber || null);
    }
    if (data.email !== undefined) {
      updates.push('"EMAIL" = ?');
      values.push(data.email || null);
    }

    // Vehicle Booking Details
    if (data.registrationNumber !== undefined) {
      updates.push('"REGISTRATIONNUM" = ?');
      values.push(data.registrationNumber || null);
    }
    if (data.manufacturer !== undefined) {
      updates.push('"MANUFACTURER" = ?');
      values.push(data.manufacturer || null);
    }
    if (data.manufacturerName !== undefined) {
      updates.push('"MANUFACTURERNAME" = ?');
      values.push(data.manufacturerName || null);
    }
    if (data.model !== undefined) {
      updates.push('"MODEL" = ?');
      values.push(data.model || null);
    }
    if (data.modelName !== undefined) {
      updates.push('"MODELNAME" = ?');
      values.push(data.modelName || null);
    }
    if (data.variant !== undefined) {
      updates.push('"VARIANT" = ?');
      values.push(data.variant || null);
    }
    if (data.variantName !== undefined) {
      updates.push('"VARIANTNAME" = ?');
      values.push(data.variantName || null);
    }
    if (data.description !== undefined) {
      updates.push('"DESCRIPTION" = ?');
      values.push(data.description || null);
    }
    if (data.bodyStyle !== undefined) {
      updates.push('"BODYSTYLE" = ?');
      values.push(data.bodyStyle || null);
    }

    // Booking Details
    if (data.dateOut !== undefined) {
      const dateOut = formatDateTime(data.dateOut, data.timeOut);
      updates.push('"DATEOUT" = ?');
      values.push(dateOut);
    }
    if (data.timeOut !== undefined) {
      updates.push('"TIMEOUT" = ?');
      values.push(data.timeOut || null);
    }
    if (data.dateIn !== undefined) {
      const dateIn = formatDateTime(data.dateIn, data.timeIn);
      updates.push('"DATEIN" = ?');
      values.push(dateIn);
    }
    if (data.timeIn !== undefined) {
      updates.push('"TIMEIN" = ?');
      values.push(data.timeIn || null);
    }
    if (data.outBranch !== undefined) {
      updates.push('"OUTBRANCH" = ?');
      values.push(data.outBranch || null);
    }
    if (data.outBranchName !== undefined) {
      updates.push('"OUTBRANCHNAME" = ?');
      values.push(data.outBranchName || null);
    }
    if (data.inBranch !== undefined) {
      updates.push('"INBRANCH" = ?');
      values.push(data.inBranch || null);
    }
    if (data.inBranchName !== undefined) {
      updates.push('"INBRANCHNAME" = ?');
      values.push(data.inBranchName || null);
    }
    if (data.salesExecutive !== undefined) {
      updates.push('"SALESEXECUTIVE" = ?');
      values.push(data.salesExecutive || null);
    }
    if (data.salesExecutiveName !== undefined) {
      updates.push('"SALESEXECUTIVENAME" = ?');
      values.push(data.salesExecutiveName || null);
    }
    if (data.approvedBy !== undefined) {
      updates.push('"APPROVEDBY" = ?');
      values.push(data.approvedBy || null);
    }
    if (data.quickBooking !== undefined) {
      updates.push('"QUICKBOOKING" = ?');
      values.push(data.quickBooking ? 'true' : 'false');
    }
    if (data.newOrUsed !== undefined) {
      updates.push('"NEWORUSED" = ?');
      values.push(data.newOrUsed || null);
    }
    if (data.newOrUsedLabel !== undefined) {
      updates.push('"NEWORUSEDLABEL" = ?');
      values.push(data.newOrUsedLabel || null);
    }
    if (data.notes !== undefined) {
      updates.push('"NOTES" = ?');
      values.push(data.notes || null);
    }

    if (data.fuelOut !== undefined) {
      updates.push('"FUELOUT" = ?');
      values.push(
        data.fuelOut && data.fuelOut.trim() !== '' ? data.fuelOut : null
      );
    }
    if (data.fuelIn !== undefined) {
      updates.push('"FUELIN" = ?');
      values.push(
        data.fuelIn && data.fuelIn.trim() !== '' ? data.fuelIn : null
      );
    }
    if (data.mileageOut !== undefined) {
      updates.push('"MILEAGEOUT" = ?');
      values.push(
        data.mileageOut && data.mileageOut.trim() !== ''
          ? data.mileageOut
          : null
      );
    }
    if (data.mileageIn !== undefined) {
      updates.push('"MILEAGEIN" = ?');
      values.push(
        data.mileageIn && data.mileageIn.trim() !== '' ? data.mileageIn : null
      );
    }
    if (updates.length === 0) {
      return existing; // No updates to make
    }

    // Add updated date and updated by
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    updates.push('"UPDATEDDATE" = ?');
    values.push(now);
    if (updatedBy) {
      updates.push('"UPDATEDBY" = ?');
      values.push(updatedBy);
    }

    values.push(id);

    const sql = `UPDATE "BI_NEGT_KSA"."DMS_BOOKTESTDRIVE" 
                 SET ${updates.join(', ')} 
                 WHERE "SLNO" = ?`;

    await db.execute(sql, values);

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

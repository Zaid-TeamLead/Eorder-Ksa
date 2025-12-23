import { logger } from '@/utils/logger';
import { db } from './database.service';

export const searchVehicles = async (search?: string) => {
  try {
    const vehicles = await db.query(`CALL "BI_NEGT_KSA".h()`);

    // Filter on frontend if search term provided (until stored procedure supports search)
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      return vehicles.filter(
        (vehicle: any) =>
          vehicle.ItemCode?.toLowerCase().includes(searchLower) ||
          vehicle.ItemName?.toLowerCase().includes(searchLower)
      );
    }

    return vehicles;
  } catch (error) {
    logger.error(error, 'Failed to search vehicles');
    throw new Error('Failed to search vehicles');
  }
};

export const getVinNumber = async (ProductCode: string, customerId: string) => {
  try {
    const vinNumber = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100014(0,'${customerId}','${ProductCode}')`
    );
    return vinNumber;
  } catch (error) {
    logger.error(error, 'Failed to get vin number');
    throw new Error('Failed to get vin number');
  }
};

export const getAllTestVehicles = async () => {
  try {
    const vehicles = await db.query(
      `SELECT * FROM "BI_NEGT_KSA"."DMS_TESTVEHICLE" ORDER BY "SLNO" DESC`
    );
    return vehicles;
  } catch (error) {
    logger.error(error, 'Failed to get all test vehicles');
    throw new Error('Failed to get all test vehicles');
  }
};

export const getAllVehicleInventory = async () => {
  try {
    const vehicles = await db.query(`CALL "BI_NEGT_KSA".DMS_KSA_100016()`);
    return vehicles;
  } catch (error) {
    logger.error(error, 'Failed to get all vehicle inventory');
    throw new Error('Failed to get all vehicle inventory');
  }
};

export const getTestVehicleById = async (id: number) => {
  try {
    const vehicle = await db.queryOne(
      `SELECT * FROM "BI_NEGT_KSA"."DMS_TESTVEHICLE" WHERE "SLNO" = ?`,
      [Number(id)]
    );
    return vehicle;
  } catch (error) {
    logger.error(error, 'Failed to get test vehicle by id');
    throw new Error('Failed to get test vehicle by id');
  }
};

export interface CreateTestVehicleData {
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
  DESCRIPTION?: string;
  BODYSTYLE?: string;
  VEHICLESTATUS?: string;
  CREATEDBY: string;
}

export const createTestVehicle = async (data: CreateTestVehicleData) => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const status = data.VEHICLESTATUS || 'true';

    await db.execute(
      `INSERT INTO "BI_NEGT_KSA"."DMS_TESTVEHICLE"
       ("REGISTRATIONNUM", "MANUFACTURER", "MODEL", "VARIANT", "DESCRIPTION", "BODYSTYLE", "VEHICLESTSATUS", "CREATEDDATE", "CREATEDBY")
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.REGISTRATIONNUM || null,
        data.MANUFACTURER || null,
        data.MODEL || null,
        data.VARIANT || null,
        data.DESCRIPTION || null,
        data.BODYSTYLE || null,
        status,
        now,
        data.CREATEDBY.substring(0, 8), // Ensure CREATEDBY is max 8 chars
      ]
    );

    // Get the inserted record
    const insertedId = await db.queryOne<{ SLNO: number }>(
      `SELECT "SLNO" FROM "BI_NEGT_KSA"."DMS_TESTVEHICLE"
       WHERE "CREATEDBY" = ? AND "CREATEDDATE" = ?
       ORDER BY "SLNO" DESC LIMIT 1`,
      [data.CREATEDBY.substring(0, 8), now]
    );

    if (insertedId) {
      return await getTestVehicleById(insertedId.SLNO);
    }

    throw new Error('Failed to retrieve created test vehicle');
  } catch (error) {
    logger.error(error, 'Failed to create test vehicle');
    throw new Error('Failed to create test vehicle');
  }
};

export interface UpdateTestVehicleData {
  REGISTRATIONNUM?: string;
  MANUFACTURER?: string;
  MODEL?: string;
  VARIANT?: string;
  DESCRIPTION?: string;
  BODYSTYLE?: string;
  VEHICLESTATUS?: string;
}

export const updateTestVehicle = async (
  id: number,
  data: UpdateTestVehicleData
) => {
  try {
    // Check if vehicle exists
    const existing = await getTestVehicleById(id);
    if (!existing) {
      throw new Error('Test vehicle not found');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (data.REGISTRATIONNUM !== undefined) {
      updates.push('"REGISTRATIONNUM" = ?');
      values.push(data.REGISTRATIONNUM || null);
    }
    if (data.MANUFACTURER !== undefined) {
      updates.push('"MANUFACTURER" = ?');
      values.push(data.MANUFACTURER || null);
    }
    if (data.MODEL !== undefined) {
      updates.push('"MODEL" = ?');
      values.push(data.MODEL || null);
    }
    if (data.VARIANT !== undefined) {
      updates.push('"VARIANT" = ?');
      values.push(data.VARIANT || null);
    }
    if (data.DESCRIPTION !== undefined) {
      updates.push('"DESCRIPTION" = ?');
      values.push(data.DESCRIPTION || null);
    }
    if (data.BODYSTYLE !== undefined) {
      updates.push('"BODYSTYLE" = ?');
      values.push(data.BODYSTYLE || null);
    }
    if (data.VEHICLESTATUS !== undefined) {
      updates.push('"VEHICLESTSATUS" = ?');
      values.push(data.VEHICLESTATUS);
    }

    if (updates.length === 0) {
      return existing; // No updates to make
    }

    values.push(id);

    const sql = `UPDATE "BI_NEGT_KSA"."DMS_TESTVEHICLE"
                 SET ${updates.join(', ')}
                 WHERE "SLNO" = ?`;

    await db.execute(sql, values);

    return await getTestVehicleById(id);
  } catch (error) {
    logger.error(error, 'Failed to update test vehicle');
    throw new Error('Failed to update test vehicle');
  }
};

export const deleteTestVehicle = async (id: number) => {
  try {
    // Soft delete: set status to 'false'
    const result = await updateTestVehicle(id, { VEHICLESTATUS: 'false' });
    return result;
  } catch (error) {
    logger.error(error, 'Failed to delete test vehicle');
    throw new Error('Failed to delete test vehicle');
  }
};

export const updateTestVehicleStatus = async (id: number, status: string) => {
  try {
    if (status !== 'true' && status !== 'false') {
      throw new Error('Status must be "true" or "false"');
    }
    return await updateTestVehicle(id, { VEHICLESTATUS: status });
  } catch (error) {
    logger.error(error, 'Failed to update test vehicle status');
    throw new Error('Failed to update test vehicle status');
  }
};

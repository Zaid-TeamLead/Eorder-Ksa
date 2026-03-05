import { logger } from '@/utils/logger';
import { db } from './database.service';
import { validateUserId } from '@/utils/db-helpers';

export const searchVehicles = async (search?: string) => {
  const searchTerm = search?.trim() || '';

  const applyLocalFilter = (vehicles: any[]) => {
    if (!searchTerm) {
      return vehicles;
    }

    const searchLower = searchTerm.toLowerCase();
    return vehicles.filter((vehicle) =>
      [vehicle.ItemCode, vehicle.ItemName, vehicle.ItmsGrpNam, vehicle['Model Description']]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchLower))
    );
  };

  try {
    // Primary source: dedicated vehicle search procedure.
    // If this proc is unavailable/fails in an environment, fallback to inventory-based search.
    try {
      const vehicles = await db.query<any>(
        `CALL "BI_NEGT_KSA".DMS_KSA_100007(?)`,
        [searchTerm || null]
      );
      return applyLocalFilter(vehicles);
    } catch (primaryError) {
      logger.warn(
        { error: primaryError, searchTerm },
        'Vehicle search procedure failed, using inventory fallback'
      );

      const inventoryRows = await db.query<any>(`CALL "BI_NEGT_KSA".DMS_KSA_100016()`);

      // Aggregate VIN-level rows into item-level rows expected by the vehicle search UI.
      const grouped = new Map<string, any>();

      for (const row of inventoryRows) {
        const itemCode = row?.ItemCode || '';
        if (!itemCode) {
          continue;
        }

        const existing = grouped.get(itemCode);

        if (!existing) {
          grouped.set(itemCode, {
            ItemCode: itemCode,
            ItemName: row?.U_Veh_ModelFull || row?.U_Veh_ModelDescr || row?.U_Veh_Model || itemCode,
            FrgnName: row?.U_Veh_ModelFull || row?.U_Veh_ModelDescr || null,
            ItmsGrpNam: [row?.U_Veh_Brand, row?.U_Veh_Model].filter(Boolean).join(' ') || row?.U_Veh_Brand || '',
            SuppCatNum: row?.U_Vehicle_MC || '',
            U_Veh_Color: row?.U_Veh_Color || '',
            'Model Description': row?.U_Veh_ModelDescr || row?.U_Veh_Model || '',
            'Model Year': row?.U_Veh_MY || '',
            'Model Code': row?.U_Vehicle_MC || '',
            'Total Stock': 1,
            'In Sales Orders': 0,
            Allocated: 0,
            Available: 1,
          });
        } else {
          existing['Total Stock'] += 1;
          existing.Available += 1;
        }
      }

      const vehicles = Array.from(grouped.values());
      return applyLocalFilter(vehicles);
    }
  } catch (error) {
    logger.error(error, 'Failed to search vehicles');
    throw new Error('Failed to search vehicles');
  }
};

export const getVinNumber = async (ProductCode: string, customerId: string) => {
  try {
    const vinNumber = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100014(?, ?, ?)`,
      [0, customerId, ProductCode]
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
    const validatedUserId = validateUserId(data.CREATEDBY);

    // Note: VEHICLESTSATUS is the actual database column name (legacy typo in DB schema)
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
        validatedUserId, // Validate instead of silent truncation
      ]
    );

    // Get the inserted record
    const insertedId = await db.queryOne<{ SLNO: number }>(
      `SELECT "SLNO" FROM "BI_NEGT_KSA"."DMS_TESTVEHICLE"
       WHERE "CREATEDBY" = ? AND "CREATEDDATE" = ?
       ORDER BY "SLNO" DESC LIMIT 1`,
      [validatedUserId, now]
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
      // Note: VEHICLESTSATUS is the actual DB column name (legacy typo in schema)
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

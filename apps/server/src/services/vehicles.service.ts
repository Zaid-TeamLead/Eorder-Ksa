import { logger } from '@/utils/logger';
import { db } from './database.service';

export const searchVehicles = async (search?: string) => {
  try {
    const vehicles = await db.query(`CALL "BI_NEGT_KSA".DMS_KSA_100007()`);

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

export const getVinNumber = async (ProductCode: string, SlpCode: string) => {
  try {
    const vinNumber = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100014(0,'${SlpCode}','${ProductCode}')`
    );

    console.log(
      `CALL "BI_NEGT_KSA".DMS_KSA_100014(0,'${SlpCode}','${ProductCode}')`
    );
    return vinNumber;
  } catch (error) {
    logger.error(error, 'Failed to get vin number');
    throw new Error('Failed to get vin number');
  }
};

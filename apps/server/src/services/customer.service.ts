import { logger } from '@/utils/logger';
import { db } from './database.service';

export const searchCustomers = async (search: string, slpCode: string) => {
  try {
    const customers = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100002('${search}','${slpCode}')`
    );
    return customers;
  } catch (error) {
    logger.error(error, 'Failed to search customers');
    throw new Error('Failed to search customers');
  }
};

export const getCustomerAddress = async (cardCode: string) => {
  try {
    const address = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100003('${cardCode}')`
    );
    return address;
  } catch (error) {
    logger.error(error, 'Failed to get customer address');
    throw new Error('Failed to get customer address');
  }
};

export const getCustomerfinancialInformation = async (cardCode: string) => {
  try {
    const financialInformation = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100004('${cardCode}')`
    );
    return financialInformation;
  } catch (error) {
    logger.error(error, 'Failed to get customer financial information');
    throw new Error('Failed to get customer financial information');
  }
};

export const getVehicleHistory = async (cardCode: string) => {
  try {
    const vehicleHistory = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100005('${cardCode}')`
    );
    return vehicleHistory;
  } catch (error) {
    logger.error(error, 'Failed to get vehicle history');
    throw new Error('Failed to get vehicle history');
  }
};

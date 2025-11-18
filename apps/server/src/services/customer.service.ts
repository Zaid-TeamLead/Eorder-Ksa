import { logger } from "@/utils/logger";
import { db } from "./database.service";

export const searchCustomers = async (search: string, slpCode: string) => {
    try {
  const customers = await db.query(`CALL "BI_NEGT_KSA".DMS_KSA_100002('${search}','${slpCode}')`);
  return customers;
    } catch (error) {
        logger.error(error, "Failed to search customers");
        throw new Error("Failed to search customers");
    }
};
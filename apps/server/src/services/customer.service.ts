import { logger } from '@/utils/logger';
import { db } from './database.service';
import { InternalServerError, NotFoundError } from '@/types/errors';

export const searchCustomers = async (search: string, slpCode?: string) => {
  try {
    // Try stored procedure first with parameterized queries
    try {
      // Use parameterized queries to prevent SQL injection
      const spQuery = `CALL "BI_NEGT_KSA".DMS_KSA_100002(?, ?)`;
      const params = [search, slpCode && slpCode !== '' ? slpCode : null];

      const customers = await db.query(spQuery, params);
      return customers;
    } catch (spError) {
      // If stored procedure fails, use direct query
      logger.warn('Stored procedure failed, using direct query', spError);

      // First, try to find which schema has OCRD table by querying system catalog
      let schemaName: string | null = null;

      try {
        const schemaResult = await db.query(`
          SELECT TOP 1 SCHEMA_NAME
          FROM SYS.TABLES
          WHERE TABLE_NAME = 'OCRD'
        `);

        if (schemaResult && schemaResult.length > 0) {
          schemaName = schemaResult[0].SCHEMA_NAME;
          logger.info(`Found OCRD table in schema: ${schemaName}`);
        }
      } catch (err) {
        logger.warn('Could not query system catalog to find OCRD schema', err);
      }

      // If system catalog query didn't work, try querying all schemas
      if (!schemaName) {
        try {
          const allSchemas = await db.query(`
            SELECT DISTINCT SCHEMA_NAME
            FROM SYS.SCHEMAS
            WHERE HAS_PRIVILEGES = 'TRUE'
          `);

          logger.info(`Searching OCRD in ${allSchemas.length} accessible schemas...`);

          for (const schemaRow of allSchemas) {
            const schema = schemaRow.SCHEMA_NAME;
            try {
              await db.query(`SELECT TOP 1 "CardCode" FROM "${schema}"."OCRD"`);
              schemaName = schema;
              logger.info(`Found OCRD table in schema: ${schema}`);
              break;
            } catch (err) {
              // Table doesn't exist in this schema, continue
              continue;
            }
          }
        } catch (err) {
          logger.warn('Could not query schemas list', err);
        }
      }

      if (!schemaName) {
        throw new NotFoundError('OCRD table not found. Please ask database admin to provide the correct schema/database name for OCRD table.');
      }

      // Now query customers from the discovered schema using parameterized queries
      // Using standard SAP B1 OCRD column names
      const searchPattern = `%${search}%`;
      const parameters: any[] = [searchPattern, searchPattern, searchPattern, searchPattern];

      let query = `
        SELECT TOP 50
          "CardCode",
          "CardName",
          "Phone1",
          "Phone2",
          "Cellular",
          "E_Mail",
          "Address",
          "MailAddres" AS "Street",
          "Block",
          "Building" AS "StreetNo",
          "City",
          "County",
          "ZipCode",
          '' AS "Address2",
          '' AS "Address3",
          "SlpCode"
        FROM "${schemaName}"."OCRD"
        WHERE (
          "CardName" LIKE ?
          OR "CardCode" LIKE ?
          OR "Cellular" LIKE ?
          OR "E_Mail" LIKE ?
        )
      `;

      if (slpCode && slpCode !== '') {
        query += ` AND "SlpCode" = ?`;
        parameters.push(slpCode);
      }

      const customers = await db.query(query, parameters);

      // Log the first customer to help debug
      if (customers && customers.length > 0) {
        logger.info('Customer search result sample:', {
          count: customers.length,
          firstCustomer: customers[0]
        });
      }

      return customers;
    }
  } catch (error) {
    logger.error(error, 'Failed to search customers');
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError('Failed to search customers');
  }
};

export const getCustomerAddress = async (cardCode: string) => {
  try {
    // Use parameterized query to prevent SQL injection
    const address = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100003(?)`,
      [cardCode]
    );
    return address;
  } catch (error) {
    logger.error(error, 'Failed to get customer address');
    throw new InternalServerError('Failed to get customer address');
  }
};

export const getCustomerfinancialInformation = async (cardCode: string) => {
  try {
    // Use parameterized query to prevent SQL injection
    const financialInformation = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100004(?)`,
      [cardCode]
    );
    return financialInformation;
  } catch (error) {
    logger.error(error, 'Failed to get customer financial information');
    throw new InternalServerError('Failed to get customer financial information');
  }
};

export const getVehicleHistory = async (cardCode: string) => {
  try {
    // Use parameterized query to prevent SQL injection
    const vehicleHistory = await db.query(
      `CALL "BI_NEGT_KSA".DMS_KSA_100005(?)`,
      [cardCode]
    );
    return vehicleHistory;
  } catch (error) {
    logger.error(error, 'Failed to get vehicle history');
    throw new InternalServerError('Failed to get vehicle history');
  }
};

import hana from "@sap/hana-client";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface HanaConnectionOptions {
  serverNode: string;
  uid: string;
  pwd: string;
  currentSchema?: string;
  pooling?: boolean;
  connectionLifetime?: number;
  minPoolSize?: number;
  maxPoolSize?: number;
}

class DatabaseService {
  private connectionConfig: HanaConnectionOptions | null = null;
  private isInitialized: boolean = false;

  /**
   * Get connection configuration from environment variables
   */
  private getConnectionConfig(): HanaConnectionOptions {
    const config: HanaConnectionOptions = {
      serverNode: env.SERVERNODE,
      uid: env.USERID,
      pwd: env.PASSWORD,
    };

    if (env.CURRENTSCHEMA) {
      config.currentSchema = env.CURRENTSCHEMA;
    }

    config.pooling = env.POOLING !== undefined ? env.POOLING : true;

    if (env.CONNECTIONLIFETIME) {
      config.connectionLifetime = env.CONNECTIONLIFETIME;
    }

    config.minPoolSize = 2;
    config.maxPoolSize = 10;

    return config;
  }

  /**
   * Get a connection from the pool (or create one if pooling is disabled)
   */
  private async getConnection(timeoutMs: number = 10000): Promise<hana.Connection> {
    if (!this.connectionConfig) {
      throw new Error("Database not initialized. Call connect() first.");
    }

    const connection = hana.createConnection();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        try {
          connection.disconnect();
        } catch {
          // Ignore disconnect errors
        }
        reject(new Error(`Connection timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      connection.connect(this.connectionConfig!, (err: Error | null) => {
        clearTimeout(timeout);
        
        if (err) {
          const errorDetails = {
            message: err.message || String(err),
            code: (err as any).code,
            sqlState: (err as any).sqlState,
          };
          logger.error(
            { 
              error: errorDetails,
              serverNode: this.connectionConfig!.serverNode,
            },
            "Failed to get database connection"
          );
          reject(err);
          return;
        }
        resolve(connection);
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  private releaseConnection(connection: hana.Connection): void {
    try {
      if (!this.connectionConfig?.pooling) {
        connection.disconnect();
      }
    } catch (error) {
      logger.warn({ error }, "Error releasing connection");
    }
  }

  /**
   * Initialize database connection configuration
   * With pooling enabled, connections are created on-demand
   */
  async connect(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const config = this.getConnectionConfig();
    this.connectionConfig = config;
    this.isInitialized = true;

    logger.info(
      {
        serverNode: config.serverNode,
        schema: config.currentSchema || "default",
        pooling: config.pooling,
      },
      "SAP HANA database connection pool initialized"
    );
  }

  /**
   * Disconnect from SAP HANA database
   */
  async disconnect(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    this.connectionConfig = null;
    this.isInitialized = false;
    logger.info("Database connection pool closed");
  }

  /**
   * Execute a query and return results
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.isInitialized) {
      throw new Error("Database not initialized. Call connect() first.");
    }

    const connection = await this.getConnection();

    return new Promise((resolve, reject) => {
      try {
        connection.exec(sql, params || [], (err: Error | null, rows: T[]) => {
          this.releaseConnection(connection);

          if (err) {
            logger.error({ error: err, sql }, "Database query error");
            reject(err);
            return;
          }
          resolve(rows);
        });
      } catch (error) {
        this.releaseConnection(connection);
        logger.error({ error, sql }, "Database query execution error");
        reject(error);
      }
    });
  }

  /**
   * Execute a query and return a single result
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? (results[0] ?? null) : null;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params?: any[]): Promise<number> {
    if (!this.isInitialized) {
      throw new Error("Database not initialized. Call connect() first.");
    }

    const connection = await this.getConnection();

    return new Promise((resolve, reject) => {
      try {
        connection.exec(sql, params || [], (err: Error | null, rows: any) => {
          this.releaseConnection(connection);

          if (err) {
            logger.error({ error: err, sql }, "Database execute error");
            reject(err);
            return;
          }
          resolve(rows?.affectedRows || 0);
        });
      } catch (error) {
        this.releaseConnection(connection);
        logger.error({ error, sql }, "Database execute execution error");
        reject(error);
      }
    });
  }

  /**
   * Call a stored procedure
   * @param procedureName - Name of the stored procedure (e.g., "SCHEMA.PROCEDURE_NAME")
   * @param params - Array of input parameters
   * @returns Promise with procedure results
   */
  async callProcedure<T = any>(
    procedureName: string,
    params?: any[]
  ): Promise<T[]> {
    if (!this.isInitialized) {
      throw new Error("Database not initialized. Call connect() first.");
    }

    const connection = await this.getConnection();

    return new Promise((resolve, reject) => {
      try {
        // SAP HANA procedure call syntax: CALL SCHEMA.PROCEDURE_NAME(?, ?, ?)
        const sql = `CALL ${procedureName}(${params ? params.map(() => "?").join(", ") : ""})`;
        
        connection.exec(sql, params || [], (err: Error | null, rows: T[]) => {
          this.releaseConnection(connection);

          if (err) {
            logger.error(
              { error: err, procedureName, params },
              "Stored procedure execution error"
            );
            reject(err);
            return;
          }
          resolve(rows || []);
        });
      } catch (error) {
        this.releaseConnection(connection);
        logger.error(
          { error, procedureName, params },
          "Stored procedure execution error"
        );
        reject(error);
      }
    });
  }

  /**
   * Call a stored procedure and return a single result
   */
  async callProcedureOne<T = any>(
    procedureName: string,
    params?: any[]
  ): Promise<T | null> {
    const results = await this.callProcedure<T>(procedureName, params);
    return results.length > 0 ? (results[0] ?? null) : null;
  }

  /**
   * Check if database is initialized
   */
  getConnectionStatus(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const db = new DatabaseService();


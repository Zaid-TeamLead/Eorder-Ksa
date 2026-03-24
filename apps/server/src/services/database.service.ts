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
}

class DatabaseService {
  private connection: hana.Connection | null = null;
  private config: HanaConnectionOptions | null = null;
  private isConnected: boolean = false;

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

    config.pooling = false;

    if (env.CONNECTIONLIFETIME) {
      config.connectionLifetime = env.CONNECTIONLIFETIME;
    }

    return config;
  }

  /**
   * Connect to the SAP HANA database
   */
  public async connect(timeoutMs: number = 30000): Promise<void> {
    if (this.isConnected && this.connection) {
      logger.info("Already connected to database");
      return;
    }

    this.config = this.getConnectionConfig();
    this.connection = hana.createConnection();

    logger.info(
      {
        serverNode: this.config.serverNode,
        uid: this.config.uid,
        schema: this.config.currentSchema || "default",
        timeout: `${timeoutMs}ms`,
      },
      "Attempting to connect to SAP HANA database"
    );

    const connection = this.connection;
    const config = { ...this.config }; // Create a copy to avoid reference issues

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      // Set up timeout
      const timeout = setTimeout(() => {
        const duration = Date.now() - startTime;
        try {
          connection?.disconnect();
        } catch {
          // Ignore disconnect errors
        }
        this.connection = null;
        this.isConnected = false;

        logger.error(
          {
            serverNode: config.serverNode,
            uid: config.uid,
            duration: `${duration}ms`,
            timeout: `${timeoutMs}ms`,
          },
          "Connection timeout - database may be unreachable or credentials invalid"
        );
        reject(new Error(`Connection timeout after ${timeoutMs}ms. Database at ${config.serverNode} may be unreachable.`));
      }, timeoutMs);

      // Call connect directly (matching the working test script)
      connection.connect(config, (err: Error | null) => {
        const duration = Date.now() - startTime;
        clearTimeout(timeout);

        if (err) {
          const errorDetails = {
            message: err.message || String(err),
            name: err.name,
            code: (err as any).code,
            sqlState: (err as any).sqlState,
            sqlCode: (err as any).sqlCode,
            errno: (err as any).errno,
            syscall: (err as any).syscall,
          };
          logger.error(
            {
              error: errorDetails,
              serverNode: config.serverNode,
              uid: config.uid,
              duration: `${duration}ms`,
            },
            "Error connecting to SAP HANA"
          );
          this.connection = null;
          this.isConnected = false;
          return reject(err);
        }

        this.isConnected = true;
        logger.info(
          {
            serverNode: config.serverNode,
            schema: config.currentSchema || "default",
            uid: config.uid,
            duration: `${duration}ms`,
          },
          "Connected to SAP HANA database"
        );
        resolve();
      });
    });
  }

  /**
   * Execute a query
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.isConnected || !this.connection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    return new Promise((resolve, reject) => {
      this.connection!.exec(sql, params || [], (err: Error | null, rows: T[]) => {
        if (err) {
          logger.error(
            {
              error: {
                message: err.message,
                code: (err as any).code,
                sqlState: (err as any).sqlState,
              },
              sql,
            },
            "Error executing query"
          );
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Execute a query and return a single result
   */
  public async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? (results[0] ?? null) : null;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  public async execute(sql: string, params?: any[]): Promise<number> {
    if (!this.isConnected || !this.connection) {
      throw new Error("Not connected to database. Call connect() first.");
    }

    return new Promise((resolve, reject) => {
      this.connection!.exec(sql, params || [], (err: Error | null, result: any) => {
        if (err) {
          logger.error(
            {
              error: {
                message: err.message,
                code: (err as any).code,
                sqlState: (err as any).sqlState,
              },
              sql,
            },
            "Error executing statement"
          );
          reject(err);
        } else {
          resolve(result?.affectedRows || 0);
        }
      });
    });
  }




  /**
   * Close the connection
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    return new Promise((resolve) => {
      this.connection!.disconnect((err: Error | null) => {
        if (err) {
          logger.error({ error: err.message }, "Error disconnecting from SAP HANA");
        } else {
          logger.info("Disconnected from SAP HANA database");
        }
        this.connection = null;
        this.isConnected = false;
        resolve();
      });
    });
  }

  /**
   * Check if database is connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const db = new DatabaseService();

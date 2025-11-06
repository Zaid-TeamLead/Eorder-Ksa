import "dotenv/config";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { db } from "./services/database.service.js";
import { createApp } from "./app.js";

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize database connection
    await db.connect();

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const port = env.PORT;
    app.listen(port, () => {
      logger.info(
        {
          port,
          env: env.NODE_ENV,
          corsOrigin: env.CORS_ORIGIN,
        },
        "🚀 Server started successfully"
      );
    });

    return app;
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server and database connection`);
  try {
    await db.disconnect();
    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Error during graceful shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.fatal(error, "Uncaught Exception");
  process.exit(1);
});

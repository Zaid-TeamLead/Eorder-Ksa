import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { setupSecurity } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { registerRoutes } from "./routes/index.js";

/**
 * Create and configure Express application
 */
export function createApp(): express.Application {
  const app = express();

  // Trust proxy (for rate limiting and secure cookies behind reverse proxy)
  app.set("trust proxy", 1);

  // Security middleware
  app.use(setupSecurity());

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Register all routes (centralized route management)
  registerRoutes(app);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}


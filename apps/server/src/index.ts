import "dotenv/config";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { setupSecurity } from "./middleware/security.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiRateLimiter, authRateLimiter } from "./middleware/rate-limiter.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import protectedRoutes from "./routes/protected.routes.js";

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

// Health check routes (no rate limiting)
app.use("/", healthRoutes);

// API routes with rate limiting (excluding auth routes)
app.use("/api", (req, res, next) => {
  if (req.path.startsWith("/api/auth")) {
    return next();
  }
  return apiRateLimiter(req, res, next);
});

// Auth routes with stricter rate limiting
app.use("/api/auth", authRateLimiter, authRoutes);

// Protected routes
app.use("/api/protected", protectedRoutes);

// Mock verify-user endpoint (for development/testing)
// In production, this should be removed and replaced with actual external API
if (env.NODE_ENV !== "production") {
  app.post("/verify-user", async (req, res) => {
    const { email, password } = req.body;

    // Default credentials check (replace this with your external API call)
    if (email === "admin@example.com" && password === "password@123") {
      return res.json({
        success: true,
        user: {
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
          permissions: ["read", "write", "delete"],
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
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

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "Unhandled Rejection");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.fatal(error, "Uncaught Exception");
  process.exit(1);
});

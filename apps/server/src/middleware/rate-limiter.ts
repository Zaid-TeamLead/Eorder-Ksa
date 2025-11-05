import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      message: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for authentication endpoints
 * More lenient in development, stricter in production
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "production" ? 5 : 100, // 5 in prod, 100 in dev (very lenient)
  message: {
    error: {
      message: "Too many authentication attempts, please try again later",
      code: "AUTH_RATE_LIMIT_EXCEEDED",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests (2xx)
  // In development, skip rate limiting entirely for easier testing
  skip: (req) => {
    if (env.NODE_ENV === "development") {
      return true; // Disable rate limiting in development
    }
    // Skip rate limiting for health checks and other monitoring endpoints
    return req.path === "/health" || req.path === "/ready";
  },
  // Use a more reliable key generator
  keyGenerator: (req) => {
    // Use IP address as the key
    return req.ip || req.socket.remoteAddress || "unknown";
  },
});

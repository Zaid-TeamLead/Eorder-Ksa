import type { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Log error
  if (err instanceof AppError && err.isOperational) {
    logger.warn(err, "Operational error occurred");
  } else {
    logger.error(err, "Unexpected error occurred");
  }

  // Send error response
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(env.NODE_ENV === "development" && { stack: err.stack }),
      },
    });
  }

  // Handle unexpected errors
  return res.status(500).json({
    error: {
      message: "An unexpected error occurred",
      code: "INTERNAL_SERVER_ERROR",
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: "NOT_FOUND",
    },
  });
}

import type { Request, Response } from "express";

/**
 * Health check controller
 */
export function healthCheckController(_req: Request, res: Response) {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

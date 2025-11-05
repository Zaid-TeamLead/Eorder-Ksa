import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../utils/jwt.js";
import { AuthenticationError, AuthorizationError } from "../types/errors.js";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT access token
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("No token provided");
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new AuthenticationError("Invalid or expired token");
    }

    // Attach user info to request
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }

    if (req.user.role !== role) {
      return next(new AuthorizationError("Insufficient permissions"));
    }

    next();
  };
}

/**
 * Middleware to check if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthenticationError("Authentication required"));
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new AuthorizationError("Insufficient permissions"));
    }

    next();
  };
}

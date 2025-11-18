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
 * Checks httpOnly cookie first, then Authorization header as fallback
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    // Get token from httpOnly cookie first (preferred method)
    let token = req.cookies?.accessToken;

    // Debug: Log cookie information (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("Auth Debug:", {
        hasCookies: !!req.cookies,
        cookieKeys: req.cookies ? Object.keys(req.cookies) : [],
        hasAccessToken: !!token,
        authorizationHeader: req.headers.authorization ? "present" : "missing",
      });
    }

    // Fallback to Authorization header if cookie is not present
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix
      }
    }

    if (!token) {
      throw new AuthenticationError("No token provided");
    }

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

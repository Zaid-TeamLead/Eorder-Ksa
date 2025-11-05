import type { Request, Response, NextFunction } from "express";
import {
  signIn,
  refreshAccessToken,
  signOut,
} from "../services/auth.service.js";
import { logger } from "../utils/logger.js";
import { AuthenticationError } from "../types/errors.js";

/**
 * Sign in controller
 */
export async function signInController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { email, password } = req.body;

    const { user, tokens } = await signIn(email, password);

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return res.json({
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }
    next(error);
  }
}

/**
 * Refresh token controller
 */
export async function refreshTokenController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: {
          message: "Refresh token not provided",
          code: "NO_REFRESH_TOKEN",
        },
      });
    }

    const accessToken = await refreshAccessToken(refreshToken);

    return res.json({
      data: {
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        error: {
          message: error.message,
          code: error.code,
        },
      });
    }
    next(error);
  }
}

/**
 * Sign out controller
 */
export async function signOutController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Extract token ID from refresh token
      try {
        const { verifyRefreshToken } = await import("../utils/jwt.js");
        const payload = verifyRefreshToken(refreshToken);
        if (payload) {
          await signOut(payload.tokenId);
        }
      } catch (error) {
        logger.warn(
          error,
          "Failed to extract refresh token ID during sign out"
        );
      }
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
    });

    return res.json({
      data: {
        message: "Signed out successfully",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user controller
 */
export async function getCurrentUserController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user) {
      throw new AuthenticationError("User not authenticated");
    }

    return res.json({
      data: {
        user: {
          id: req.user.userId,
          email: req.user.email,
          role: req.user.role,
          permissions: req.user.permissions,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

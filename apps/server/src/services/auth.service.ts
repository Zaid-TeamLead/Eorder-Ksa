import { randomUUID } from "crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  type TokenPayload,
  type RefreshTokenPayload,
} from "../utils/jwt.js";
import { refreshTokenService } from "./refresh-token.service.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { AuthenticationError, InternalServerError } from "../types/errors.js";

export interface UserData {
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
}

/**
 * Verify user credentials with external API
 */
async function verifyUserCredentials(
  email: string,
  password: string
): Promise<UserData> {
  try {
    const response = await fetch(`${env.EXTERNAL_API_URL}/verify-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new AuthenticationError("Invalid email or password");
    }

    const result = (await response.json()) as {
      success: boolean;
      user?: UserData;
      message?: string;
    };

    if (!result.success || !result.user) {
      throw new AuthenticationError(
        result.message || "Invalid email or password"
      );
    }

    return result.user;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error(error, "Failed to verify user credentials");
    throw new InternalServerError("Failed to verify credentials");
  }
}

/**
 * Sign in a user and generate tokens
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: UserData & { id: string }; tokens: AuthTokens }> {
  const user = await verifyUserCredentials(email, password);
  const userId = randomUUID(); // In production, get from external API

  // Generate tokens
  const accessTokenPayload: TokenPayload = {
    userId,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  };

  const refreshTokenId = randomUUID();
  const refreshTokenPayload: RefreshTokenPayload = {
    userId,
    email: user.email,
    tokenId: refreshTokenId,
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);

  // Store refresh token
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  await refreshTokenService.store(refreshTokenId, {
    userId,
    email: user.email,
    expiresAt,
  });

  logger.info({ userId, email: user.email }, "User signed in");

  return {
    user: {
      id: userId,
      ...user,
    },
    tokens: {
      accessToken,
      refreshToken,
      refreshTokenId,
    },
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<string> {
  const payload = verifyRefreshToken(refreshToken);

  if (!payload) {
    throw new AuthenticationError("Invalid or expired refresh token");
  }

  // Check if refresh token exists in store
  const storedToken = await refreshTokenService.get(payload.tokenId);

  if (!storedToken) {
    throw new AuthenticationError("Refresh token expired or revoked");
  }

  // Generate new access token
  // Note: In production, fetch latest user data from external API
  const accessTokenPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: "admin", // In production, fetch from external API
    permissions: ["read", "write", "delete"], // In production, fetch from external API
  };

  const newAccessToken = generateAccessToken(accessTokenPayload);

  logger.debug({ userId: payload.userId }, "Access token refreshed");

  return newAccessToken;
}

/**
 * Sign out a user (revoke refresh token)
 */
export async function signOut(refreshTokenId?: string): Promise<void> {
  if (refreshTokenId) {
    await refreshTokenService.delete(refreshTokenId);
    logger.debug({ refreshTokenId }, "User signed out");
  }
}

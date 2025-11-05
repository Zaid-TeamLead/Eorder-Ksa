import { logger } from "../utils/logger.js";

export interface RefreshTokenData {
  userId: string;
  email: string;
  expiresAt: number;
}

/**
 * Refresh token storage service
 * In production, this should be implemented with Redis or a database
 */
class RefreshTokenService {
  private tokens = new Map<string, RefreshTokenData>();

  /**
   * Store a refresh token
   */
  async store(tokenId: string, data: RefreshTokenData): Promise<void> {
    this.tokens.set(tokenId, data);
    logger.debug({ tokenId, userId: data.userId }, "Refresh token stored");
  }

  /**
   * Get refresh token data
   */
  async get(tokenId: string): Promise<RefreshTokenData | null> {
    const token = this.tokens.get(tokenId);
    if (!token) {
      return null;
    }

    // Check if expired
    if (token.expiresAt < Date.now()) {
      await this.delete(tokenId);
      return null;
    }

    return token;
  }

  /**
   * Delete a refresh token
   */
  async delete(tokenId: string): Promise<void> {
    this.tokens.delete(tokenId);
    logger.debug({ tokenId }, "Refresh token deleted");
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllForUser(userId: string): Promise<void> {
    let deleted = 0;
    for (const [tokenId, token] of this.tokens.entries()) {
      if (token.userId === userId) {
        this.tokens.delete(tokenId);
        deleted++;
      }
    }
    logger.debug({ userId, deleted }, "User refresh tokens deleted");
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let deleted = 0;

    for (const [tokenId, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(tokenId);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info({ deleted }, "Expired refresh tokens cleaned up");
    }

    return deleted;
  }
}

export const refreshTokenService = new RefreshTokenService();

// Cleanup expired tokens every hour
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    refreshTokenService.cleanup().catch((err) => {
      logger.error(err, "Failed to cleanup expired tokens");
    });
  }, 60 * 60 * 1000); // 1 hour
}

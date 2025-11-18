import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

// Access token expires in 15 minutes
const ACCESS_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  email: string;
  name: string;
  role: string;
  permissions: string[];
  SlpCode: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

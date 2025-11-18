import {
  generateAccessToken,
  type TokenPayload,
} from "../utils/jwt.js";
import { logger } from "../utils/logger.js";
import { AuthenticationError, InternalServerError } from "../types/errors.js";
import { db } from "./database.service.js";

const EXTERNAL_AUTH_URL = "https://auth.neweast.cloud";
const COMPANY_CODE = "BI_NEGT_KSA";

export interface UserData {
  email: string;
  name: string;
  role: string;
  permissions: string[];
  SlpCode: string;
}

export interface AuthTokens {
  accessToken: string;
}

/**
 * Generate OTP for user via external API
 */
export async function generateOtp(userId: string): Promise<void> {
  try {
    const response = await fetch(
      `${EXTERNAL_AUTH_URL}/auth/generate-otp?co=${COMPANY_CODE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to generate OTP";
      try {
        const errorData = (await response.json()) as {
          result?: { message?: string };
          message?: string;
        };
        if (errorData.result?.message) {
          errorMessage = errorData.result.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new AuthenticationError(errorMessage);
    }

    const data = (await response.json()) as {
      result?: { status?: string; message?: string };
    };
    if (data.result?.status !== "success") {
      throw new AuthenticationError(
        data.result?.message || "Failed to generate OTP"
      );
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error(error, "Failed to generate OTP");
    throw new InternalServerError("Failed to generate OTP");
  }
}

/**
 * Verify OTP and create session
 */
export async function verifyOtp(
  userId: string,
  otp: string
): Promise<{ user: UserData; tokens: AuthTokens }> {
  try {
    const response = await fetch(
      `${EXTERNAL_AUTH_URL}/auth/verify-otp?co=${COMPANY_CODE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, otp }),
      }
    );

    if (!response.ok) {
      let errorMessage = "Failed to verify OTP";
      try {
        const errorData = (await response.json()) as {
          result?: { message?: string };
          message?: string;
        };
        if (errorData.result?.message) {
          errorMessage = errorData.result.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new AuthenticationError(errorMessage);
    }

    const data = (await response.json()) as {
      result?: {
        success?: boolean;
        message?: string;
        user?: {
          USER_ID?: string;
          SLNO?: number;
          USER_NAME?: string;
          EMP_FULLNAME?: string;
          USER_EMAIL?: string;
        };
      };
    };

    if (!data.result) {
      throw new AuthenticationError("Invalid response format from server");
    }

    if (!data.result.success) {
      throw new AuthenticationError(
        data.result.message || "OTP verification failed"
      );
    }
    
    const apiUser = data.result.user;

    if (!apiUser) {
      throw new AuthenticationError("User data not found in response");
    }

    const user: UserData = {
      email: apiUser.USER_EMAIL || "",
      name: apiUser.EMP_FULLNAME || "",
      role: "user",
      permissions: [],
      SlpCode: "",
    };

    const userIdFromApi = apiUser.USER_ID || userId;

    const sql = `CALL "BI_NEGT_KSA".DMS_KSA_100001('${userIdFromApi}')`;
    const slpCode = await db.query(sql);
 

    // Generate access token
    const accessTokenPayload: TokenPayload = {
      email: user.email,
      name: user.name,
      role: user.role,
      SlpCode: slpCode[0]?.SlpCode,
      permissions: user.permissions,
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    logger.info({ userId: userIdFromApi, email: user.email, name: user.name }, "User signed in via OTP");

    return {
      user: {
        ...user,
          SlpCode: slpCode[0]?.SlpCode,
      },
      tokens: {
        accessToken,
      },
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    logger.error(error, "Failed to verify OTP");
    throw new InternalServerError("Failed to verify OTP");
  }
}

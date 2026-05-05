import {
  generateAccessToken,
  type TokenPayload,
} from "../utils/jwt.js";
import { logger } from "../utils/logger.js";
import { AuthenticationError, InternalServerError } from "../types/errors.js";
import { db } from "./database.service.js";

const EXTERNAL_AUTH_URL = "https://auth.neweast.cloud";
const COMPANY_CODE = "BI_NEGT_KSA";
const OTP_BYPASS_USER_ID = "104006";

// Note: Removed sanitizeInput function - now using parameterized queries for SQL injection prevention

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

async function getSlpCodeForUser(userId: string): Promise<string> {
  try {
    const sql = `CALL "BI_NEGT_KSAISUZU".DMS_KSA_100001(?)`;
    const slpCode = await db.query(sql, [userId]);
    return String(slpCode[0]?.SlpCode ?? "").trim();
  } catch (error) {
    logger.warn({ error, userId }, "Failed to fetch SlpCode, using userId as fallback");
    return userId;
  }
}

async function createBypassSession(
  userId: string
): Promise<{ user: UserData; tokens: AuthTokens }> {
  const resolvedUserId = String(userId || OTP_BYPASS_USER_ID).trim() || OTP_BYPASS_USER_ID;
  const slpCode = await getSlpCodeForUser(resolvedUserId);

  const user: UserData = {
    email: `${resolvedUserId}@local.dev`,
    name: `User ${resolvedUserId}`,
    role: "user",
    permissions: [],
    SlpCode: slpCode || resolvedUserId,
  };

  const accessTokenPayload: TokenPayload = {
    email: user.email,
    name: user.name,
    role: user.role,
    SlpCode: user.SlpCode,
    permissions: user.permissions,
  };

  const accessToken = generateAccessToken(accessTokenPayload);

  logger.info(
    { userId: resolvedUserId, slpCode: user.SlpCode },
    "User signed in via OTP bypass"
  );

  return {
    user,
    tokens: {
      accessToken,
    },
  };
}

/**
 * Generate OTP for user via external API
 */
export async function generateOtp(userId: string): Promise<void> {
  try {
    if (String(userId).trim() === OTP_BYPASS_USER_ID) {
      logger.info({ userId }, "OTP generation bypassed for hardcoded user");
      return;
    }

    logger.info({ userId, url: `${EXTERNAL_AUTH_URL}/auth/generate-otp?co=${COMPANY_CODE}` }, "Calling external OTP API");

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

    logger.info({
      userId,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    }, "External OTP API response");

    if (!response.ok) {
      let errorMessage = "Failed to generate OTP";
      try {
        const errorData = (await response.json()) as {
          result?: { message?: string };
          message?: string;
        };
        logger.error({ userId, errorData }, "OTP API returned error");
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
      logger.warn({ message: error.message, code: error.code }, "Authentication error during OTP generation");
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
    if (String(userId).trim() === OTP_BYPASS_USER_ID) {
      return await createBypassSession(userId);
    }

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

    const userIdFromApi = apiUser.USER_ID || userId;
    const user: UserData = {
      email: apiUser.USER_EMAIL || "",
      name: apiUser.EMP_FULLNAME || "",
      role: "user",
      permissions: [],
      SlpCode: "",
    };
    const resolvedSlpCode = await getSlpCodeForUser(userIdFromApi);

    // Log the stored procedure result
    logger.info({
      userId: userIdFromApi,
      slpCodeValue: resolvedSlpCode,
    }, "SlpCode query result");

    // Generate access token
    const accessTokenPayload: TokenPayload = {
      userId: userIdFromApi,
      email: user.email,
      name: user.name,
      role: user.role,
      SlpCode: resolvedSlpCode,
      permissions: user.permissions,
    };

    const accessToken = generateAccessToken(accessTokenPayload);
    logger.info({ userId: userIdFromApi, email: user.email, name: user.name, SlpCode: resolvedSlpCode }, "User signed in via OTP");

    return {
      user: {
        ...user,
        SlpCode: resolvedSlpCode,
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

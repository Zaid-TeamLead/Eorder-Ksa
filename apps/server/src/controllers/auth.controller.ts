import type { Request, Response, NextFunction } from 'express';
import { generateOtp, verifyOtp } from '../services/auth.service.js';
import { AuthenticationError } from '../types/errors.js';

/**
 * Helper to set access token as httpOnly cookie
 */
function setAccessTokenCookie(res: Response, accessToken: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    ...(isProduction ? {} : { domain: undefined }),
  });

  // Debug log in development
  if (!isProduction) {
    console.log('Cookie set:', {
      name: 'accessToken',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: '7 days',
    });
  }
}

/**
 * Generate OTP controller
 */
export async function generateOtpController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: {
          message: 'User ID is required',
          code: 'MISSING_USER_ID',
        },
      });
    }

    await generateOtp(userId);

    return res.json({
      data: {
        message: 'OTP generated successfully',
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
 * Verify OTP controller
 */
export async function verifyOtpController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        error: {
          message: 'User ID and OTP are required',
          code: 'MISSING_CREDENTIALS',
        },
      });
    }

    const { user, tokens } = await verifyOtp(userId, otp);

    // Set access token as httpOnly cookie
    setAccessTokenCookie(res, tokens.accessToken);

    return res.json({
      data: {
        user,
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
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Clear access token cookie
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  return res.json({
    data: {
      message: 'Signed out successfully',
    },
  });
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
      throw new AuthenticationError('User not authenticated');
    }

    return res.json({
      data: {
        user: {
          slpCode: req.user.SlpCode,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

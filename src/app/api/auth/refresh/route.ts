import { AuthenticatedRequest } from "@/lib/auth";
import {
  generateTokenPair,
  verifyRefreshToken,
  blacklistRefreshToken,
  RefreshTokenBlacklistedError,
} from "@/lib/jwt";
import { UserService } from "@/lib/services";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  securityMiddleware,
  logSecurityEvent,
  rateLimit,
} from "@/lib/security";

async function GETHandler(request: AuthenticatedRequest) {
  try {
    // Apply security middleware
    const securityResponse = securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    // Apply rate limiting for auth endpoints
    const rateLimitResult = rateLimit(request, "auth");
    if (!rateLimitResult.success) {
      logSecurityEvent("rate_limit_exceeded", {
        endpoint: "/api/auth/refresh",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many refresh attempts. Please try again later." },
        { status: 429 }
      );
    }

    const refreshToken = request.headers.get("x-refresh-token");
    if (!refreshToken) {
      logSecurityEvent("refresh_token_missing", {
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Refresh token required" },
        { status: 401 }
      );
    }

    let user;
    try {
      user = verifyRefreshToken(refreshToken);
    } catch (error) {
      // Handle blacklisted refresh token error
      if (error instanceof RefreshTokenBlacklistedError) {
        logSecurityEvent("refresh_token_revoked", {
          ip: request.headers.get("x-forwarded-for") || "unknown",
        });
        return NextResponse.json(
          { error: "Refresh token has been revoked. Please login again." },
          { status: 401 }
        );
      }

      // Handle expired token error
      if (error instanceof jwt.TokenExpiredError) {
        logSecurityEvent("refresh_token_expired", {
          ip: request.headers.get("x-forwarded-for") || "unknown",
        });
        return NextResponse.json(
          { error: "Refresh token has expired. Please login again." },
          { status: 401 }
        );
      }

      // Handle other JWT errors
      if (error instanceof jwt.JsonWebTokenError) {
        logSecurityEvent("refresh_token_invalid", {
          userId: user?.userId || "unknown",
          error: error.message,
          ip: request.headers.get("x-forwarded-for") || "unknown",
        });
        return NextResponse.json(
          { error: "Invalid refresh token" },
          { status: 401 }
        );
      }

      throw error; // Re-throw other errors
    }

    // Fetch user email from database using UserService
    const userDoc = await UserService.findUserById(user.userId);

    if (!userDoc) {
      logSecurityEvent("refresh_user_not_found", {
        userId: user.userId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Blacklist the old refresh token before generating new ones
    blacklistRefreshToken(refreshToken);

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(
      user.userId,
      userDoc.email
    );

    // Log successful token refresh
    logSecurityEvent("token_refreshed", {
      userId: user.userId,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    console.error("Refresh token error:", error);
    logSecurityEvent("refresh_token_error", {
      error: error instanceof Error ? error.message : "Unknown error",
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const GET = GETHandler;

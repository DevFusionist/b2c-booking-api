import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, JWTPayload, TokenBlacklistedError } from "./jwt";
import {
  authMiddleware as securityAuthMiddleware,
  logSecurityEvent,
} from "./security";

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export async function authenticateToken(
  request: NextRequest
): Promise<NextResponse | JWTPayload> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    logSecurityEvent("authentication_failed", {
      reason: "no_token",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      endpoint: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Access token required" },
      { status: 401 }
    );
  }

  try {
    const user = verifyAccessToken(token);

    // Log successful authentication
    logSecurityEvent("authentication_successful", {
      userId: user.userId,
      email: user.email,
      ip: request.headers.get("x-forwarded-for") || "unknown",
      endpoint: request.nextUrl.pathname,
    });

    return user;
  } catch (error) {
    // Handle blacklisted token error
    if (error instanceof TokenBlacklistedError) {
      logSecurityEvent("authentication_failed", {
        reason: "token_blacklisted",
        ip: request.headers.get("x-forwarded-for") || "unknown",
        endpoint: request.nextUrl.pathname,
      });
      return NextResponse.json(
        { error: "Token has been revoked. Please login again." },
        { status: 401 }
      );
    }

    // Handle other authentication errors
    logSecurityEvent("authentication_failed", {
      reason: "invalid_token",
      ip: request.headers.get("x-forwarded-for") || "unknown",
      endpoint: request.nextUrl.pathname,
    });
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

export function withAuth(
  handler: (
    request: AuthenticatedRequest,
    context?: { params?: Promise<Record<string, string>> }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    // Apply security authentication middleware first
    const securityAuthResponse = securityAuthMiddleware(request);
    if (securityAuthResponse.status !== 200) {
      return securityAuthResponse;
    }

    const authResult = await authenticateToken(request);

    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult;

    return handler(authenticatedRequest, context);
  };
}

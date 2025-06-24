import { NextResponse, NextRequest } from "next/server";
import { BookingService } from "@/lib/services";
import { authenticateToken, AuthenticatedRequest } from "@/lib/auth";
import {
  securityMiddleware,
  logSecurityEvent,
  rateLimit,
} from "@/lib/security";

// GET /api/bookings?status=upcoming|completed
async function GETHandler(request: AuthenticatedRequest) {
  try {
    // Apply security middleware
    const securityResponse = securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      logSecurityEvent("rate_limit_exceeded", {
        endpoint: "/api/bookings",
        userId: request.user?.userId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    if (!status || !["upcoming", "completed"].includes(status)) {
      logSecurityEvent("validation_error", {
        endpoint: "/api/bookings",
        userId: request.user?.userId,
        error: "Invalid status parameter",
        status,
      });
      return NextResponse.json(
        { error: 'Status parameter must be "upcoming" or "completed"' },
        { status: 400 }
      );
    }

    // Get bookings using BookingService
    const bookings = await BookingService.findBookingsByUserId(
      request.user?.userId || "",
      status as "upcoming" | "completed"
    );

    // Log successful booking retrieval
    logSecurityEvent("bookings_retrieved", {
      userId: request.user?.userId,
      status,
      count: bookings.length,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      status,
      count: bookings.length,
      bookings,
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    console.error("Get bookings error:", error);
    logSecurityEvent("bookings_error", {
      userId: request.user?.userId,
      error: error instanceof Error ? error.message : "Unknown error",
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export with authentication
export async function GET(request: NextRequest) {
  // Apply security authentication middleware first
  const securityAuthResponse = securityMiddleware(request);
  if (securityAuthResponse.status !== 200) {
    return securityAuthResponse;
  }

  const authResult = await authenticateToken(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Error response
  }

  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = authResult;

  return GETHandler(authenticatedRequest);
}

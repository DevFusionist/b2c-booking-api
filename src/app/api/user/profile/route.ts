import { NextResponse, NextRequest } from "next/server";
import { UserService } from "@/lib/services";
import { authenticateToken, AuthenticatedRequest } from "@/lib/auth";
import { z } from "zod";
import {
  securityMiddleware,
  logSecurityEvent,
  sanitizeInput,
  rateLimit,
} from "@/lib/security";

// Validation schema for profile update with sanitization
const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined)),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined)),
  phone: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined)),
  dateOfBirth: z.string().optional(),
  address: z
    .object({
      street: z.string().transform(sanitizeInput),
      city: z.string().transform(sanitizeInput),
      state: z.string().transform(sanitizeInput),
      country: z.string().transform(sanitizeInput),
      zipCode: z.string().transform(sanitizeInput),
    })
    .optional(),
});

// GET /api/user/profile
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
        endpoint: "/api/user/profile",
        userId: request.user?.userId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const user = await UserService.findUserById(request.user?.userId || "");

    if (!user) {
      logSecurityEvent("profile_access_failed", {
        userId: request.user?.userId,
        reason: "user_not_found",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log successful profile access
    logSecurityEvent("profile_accessed", {
      userId: request.user?.userId,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      user,
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    console.error("Get profile error:", error);
    logSecurityEvent("profile_access_error", {
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

// PUT /api/user/profile
async function PUTHandler(request: AuthenticatedRequest) {
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
        endpoint: "/api/user/profile",
        userId: request.user?.userId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = profileUpdateSchema.parse(body);

    // first finding the user, as this is put so either we have to pass all the fields or if partial fields are being passed through request body then rest of the fileds are required, else this will change the value of the rest of the fields to null
    const existedUser = await UserService.findUserById(
      request.user?.userId || ""
    );
    if (!existedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // if the user is found, then we need to update the user with the validated data
    const updatedUser = await UserService.updateUser(
      request.user?.userId || "",
      {
        ...existedUser,
        ...validatedData,
      }
    );

    if (!updatedUser) {
      logSecurityEvent("profile_update_failed", {
        userId: request.user?.userId,
        reason: "user_not_found",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log successful profile update
    logSecurityEvent("profile_updated", {
      userId: request.user?.userId,
      updatedFields: Object.keys(validatedData),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logSecurityEvent("validation_error", {
        endpoint: "/api/user/profile",
        userId: request.user?.userId,
        errors: error.errors,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update profile error:", error);
    logSecurityEvent("profile_update_error", {
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
  const securityAuthResponse = securityMiddleware(request);
  if (securityAuthResponse.status !== 200) {
    return securityAuthResponse;
  }
  const authResult = await authenticateToken(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = authResult;
  return GETHandler(authenticatedRequest);
}

export async function PUT(request: NextRequest) {
  const securityAuthResponse = securityMiddleware(request);
  if (securityAuthResponse.status !== 200) {
    return securityAuthResponse;
  }
  const authResult = await authenticateToken(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = authResult;
  return PUTHandler(authenticatedRequest);
}

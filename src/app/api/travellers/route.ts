import { NextResponse, NextRequest } from "next/server";
import { TravellerService } from "@/lib/services";
import { authenticateToken, AuthenticatedRequest } from "@/lib/auth";
import { z } from "zod";
import {
  securityMiddleware,
  logSecurityEvent,
  sanitizeInput,
  rateLimit,
} from "@/lib/security";

// Validation schema for traveller creation with sanitization
const travellerSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .transform(sanitizeInput),
  lastName: z.string().min(1, "Last name is required").transform(sanitizeInput),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  passportNumber: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined)),
  nationality: z
    .string()
    .min(1, "Nationality is required")
    .transform(sanitizeInput),
  isPrimary: z.boolean().default(false),
});

// POST /api/travellers
async function POSTHandler(request: AuthenticatedRequest) {
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
        endpoint: "/api/travellers",
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
    const validatedData = travellerSchema.parse(body);

    // Create traveller using TravellerService
    const traveller = await TravellerService.createTraveller(
      request.user?.userId || "",
      validatedData
    );

    // Log successful traveller creation
    logSecurityEvent("traveller_created", {
      userId: request.user?.userId,
      travellerId: traveller._id.toString(),
      isPrimary: traveller.isPrimary,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json(
      {
        message: "Traveller added successfully",
        traveller,
      },
      { status: 201 }
    );

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
        endpoint: "/api/travellers",
        userId: request.user?.userId,
        errors: error.errors,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Add traveller error:", error);
    logSecurityEvent("traveller_creation_error", {
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
export async function POST(request: NextRequest) {
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
  return POSTHandler(authenticatedRequest);
}

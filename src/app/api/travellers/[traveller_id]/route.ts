import { NextResponse, NextRequest } from "next/server";
import { TravellerService } from "@/lib/services";
import { authenticateToken, AuthenticatedRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";
import {
  securityMiddleware,
  logSecurityEvent,
  sanitizeInput,
  rateLimit,
} from "@/lib/security";

// Validation schema for traveller update with sanitization
const travellerUpdateSchema = z.object({
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
  dateOfBirth: z.string().min(1, "Date of birth is required").optional(),
  passportNumber: z
    .string()
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined)),
  nationality: z
    .string()
    .min(1, "Nationality is required")
    .optional()
    .transform((val) => (val ? sanitizeInput(val) : undefined)),
  isPrimary: z.boolean().optional(),
});

// PUT /api/travellers/:traveller_id
async function PUTHandler(
  request: AuthenticatedRequest,
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      logSecurityEvent("rate_limit_exceeded", {
        endpoint: "/api/travellers/[traveller_id]",
        userId: request.user?.userId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { traveller_id: travellerId } = (await context?.params) || {};

    if (!travellerId || !ObjectId.isValid(travellerId)) {
      logSecurityEvent("validation_error", {
        endpoint: "/api/travellers/[traveller_id]",
        userId: request.user?.userId,
        error: "Invalid traveller ID format",
        travellerId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Invalid traveller ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = travellerUpdateSchema.parse(body);

    // first finding the traveller, as this is put so either we have to pass all the fields or if partial fields are being passed through request body then rest of the fileds are required, else this will change the value of the rest of the fields to null
    const existedTraveller = await TravellerService.findTravellerById(
      travellerId
    );
    if (!existedTraveller) {
      return NextResponse.json(
        { error: "Traveller not found" },
        { status: 404 }
      );
    }

    // Update traveller using TravellerService
    const updatedTraveller = await TravellerService.updateTraveller(
      travellerId,
      request.user?.userId || "",
      {
        ...existedTraveller,
        ...validatedData,
      }
    );

    if (!updatedTraveller) {
      logSecurityEvent("traveller_access_failed", {
        userId: request.user?.userId,
        travellerId,
        reason: "traveller_not_found_or_unauthorized",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Traveller not found" },
        { status: 404 }
      );
    }

    // Log successful traveller update
    logSecurityEvent("traveller_updated", {
      userId: request.user?.userId,
      travellerId,
      updatedFields: Object.keys(validatedData),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      message: "Traveller updated successfully",
      traveller: updatedTraveller,
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
        endpoint: "/api/travellers/[traveller_id]",
        userId: request.user?.userId,
        travellerId: (await context?.params)?.traveller_id,
        errors: error.errors,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update traveller error:", error);
    logSecurityEvent("traveller_update_error", {
      userId: request.user?.userId,
      travellerId: (await context?.params)?.traveller_id,
      error: error instanceof Error ? error.message : "Unknown error",
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/travellers/:traveller_id
async function DELETEHandler(
  request: AuthenticatedRequest,
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, "api");
    if (!rateLimitResult.success) {
      logSecurityEvent("rate_limit_exceeded", {
        endpoint: "/api/travellers/[traveller_id]",
        userId: request.user?.userId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { traveller_id: travellerId } = (await context?.params) || {};

    if (!travellerId || !ObjectId.isValid(travellerId)) {
      logSecurityEvent("validation_error", {
        endpoint: "/api/travellers/[traveller_id]",
        userId: request.user?.userId,
        error: "Invalid traveller ID format",
        travellerId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Invalid traveller ID" },
        { status: 400 }
      );
    }

    // Delete traveller using TravellerService
    const result = await TravellerService.deleteTraveller(
      travellerId,
      request.user?.userId || ""
    );

    // Check if result is an error response
    if (result instanceof NextResponse) {
      return result;
    }

    if (!result) {
      logSecurityEvent("traveller_access_failed", {
        userId: request.user?.userId,
        travellerId,
        reason: "traveller_not_found_or_unauthorized",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Traveller not found" },
        { status: 404 }
      );
    }

    // Log successful traveller deletion
    logSecurityEvent("traveller_deleted", {
      userId: request.user?.userId,
      travellerId,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      message: "Traveller deleted successfully",
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Cannot delete primary traveller")
    ) {
      logSecurityEvent("traveller_deletion_failed", {
        userId: request.user?.userId,
        travellerId: (await context?.params)?.traveller_id,
        reason: "primary_traveller_deletion_attempt",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Cannot delete primary traveller" },
        { status: 400 }
      );
    }

    console.error("Delete traveller error:", error);
    logSecurityEvent("traveller_deletion_error", {
      userId: request.user?.userId,
      travellerId: (await context?.params)?.traveller_id,
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
export async function PUT(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
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
  return PUTHandler(authenticatedRequest, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
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
  return DELETEHandler(authenticatedRequest, context);
}

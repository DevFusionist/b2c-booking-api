import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services";
import { generateTokenPair } from "@/lib/jwt";
import {
  securityMiddleware,
  userRegistrationSchema,
  rateLimit,
  logSecurityEvent,
} from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
  let email = "unknown";

  try {
    // Apply security middleware
    const securityResponse = securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    // Apply strict rate limiting for auth endpoints
    const rateLimitResult = rateLimit(request, "auth");
    if (!rateLimitResult.success) {
      logSecurityEvent("rate_limit_exceeded", {
        endpoint: "/api/auth/signup",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate request body using security module schema
    const validatedData = userRegistrationSchema.parse(body);
    email = validatedData.email;

    // Create user using UserService
    const user = await UserService.createUser({
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id.toString(),
      user.email
    );

    // Log successful signup
    logSecurityEvent("signup_successful", {
      userId: user._id.toString(),
      email: user.email,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user,
        accessToken,
        refreshToken,
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
        endpoint: "/api/auth/signup",
        errors: error.errors,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("already exists")) {
      logSecurityEvent("signup_failed", {
        email: email,
        reason: "user_already_exists",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services";
import { generateTokenPair } from "@/lib/jwt";
import {
  securityMiddleware,
  loginSchema,
  rateLimit,
  logSecurityEvent,
} from "@/lib/security";
import { z } from "zod";

export async function POST(request: NextRequest) {
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
        endpoint: "/api/auth/login",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate request body using security module schema
    const validatedData = loginSchema.parse(body);

    // Find user by email using UserService
    const user = await UserService.findUserByEmail(validatedData.email);

    if (!user) {
      logSecurityEvent("login_failed", {
        email: validatedData.email,
        reason: "user_not_found",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password using UserService
    const isPasswordValid = await UserService.verifyPassword(
      user,
      validatedData.password
    );

    if (!isPasswordValid) {
      logSecurityEvent("login_failed", {
        email: validatedData.email,
        reason: "invalid_password",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(
      user._id!.toString(),
      user.email
    );

    // Log successful login
    logSecurityEvent("login_successful", {
      userId: user._id!.toString(),
      email: user.email,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    // Return user data (without password) and tokens
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      accessToken,
      refreshToken,
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
        endpoint: "/api/auth/login",
        errors: error.errors,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

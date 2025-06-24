import { NextRequest, NextResponse } from "next/server";
import { LRUCache } from "lru-cache";
import { z } from "zod";

// Rate limiting cache
const rateLimitCache = new LRUCache<
  string,
  { count: number; resetTime: number }
>({
  max: 10000,
  ttl: 1000 * 60 * 15, // 15 minutes
});

// Security headers configuration
export const SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
};

// Rate limiting configuration
export const RATE_LIMITS = {
  auth: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  api: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  strict: { windowMs: 15 * 60 * 1000, max: 10 }, // 10 requests per 15 minutes
};

/**
 * Rate limiting middleware
 */
export function rateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = "api"
): { success: boolean; message?: string; headers?: Record<string, string> } {
  const ip = getClientIP(request);
  const key = `${type}:${ip}`;
  const limit = RATE_LIMITS[type];

  const now = Date.now();
  console.log("type -- ", type, "limit -- ", limit);

  const current = rateLimitCache.get(key);

  if (!current || current.resetTime < now) {
    // First request or window expired
    rateLimitCache.set(key, { count: 1, resetTime: now + limit.windowMs });
    return { success: true };
  }

  if (current.count >= limit.max) {
    return {
      success: false,
      message: "Too many requests",
      headers: {
        "X-RateLimit-Limit": limit.max.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": new Date(current.resetTime).toISOString(),
        "Retry-After": Math.ceil((current.resetTime - now) / 1000).toString(),
      },
    };
  }

  // Increment counter
  current.count++;
  rateLimitCache.set(key, current);

  return {
    success: true,
    headers: {
      "X-RateLimit-Limit": limit.max.toString(),
      "X-RateLimit-Remaining": (limit.max - current.count).toString(),
      "X-RateLimit-Reset": new Date(current.resetTime).toISOString(),
    },
  };
}

/**
 * Get client IP address
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

/**
 * Input sanitization and validation
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Password strength validation
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .transform((email) => email.toLowerCase().trim());

/**
 * Password validation schema
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .refine(
    (password) => {
      const validation = validatePassword(password);
      return validation.valid;
    },
    {
      message: "Password does not meet security requirements",
    }
  );

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .optional()
    .transform((phone) => (phone ? sanitizeInput(phone) : undefined)),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/**
 * Generate secure random string using Web Crypto API
 */
export async function generateSecureToken(
  length: number = 32
): Promise<string> {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Hash sensitive data using Web Crypto API
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Validate request origin
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
  ];

  if (!origin) {
    return true; // Allow requests without origin (e.g., server-to-server)
  }

  return allowedOrigins.includes(origin);
}

/**
 * Security middleware for API routes
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Validate origin
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // // Rate limiting
  // const rateLimitResult = rateLimit(request, "api");
  // if (!rateLimitResult.success) {
  //   const errorResponse = NextResponse.json(
  //     { error: rateLimitResult.message },
  //     { status: 429 }
  //   );

  //   // Add rate limit headers
  //   if (rateLimitResult.headers) {
  //     Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
  //       errorResponse.headers.set(key, value);
  //     });
  //   }

  //   return errorResponse;
  // }

  // // Add rate limit headers to successful response
  // if (rateLimitResult.headers) {
  //   Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
  //     response.headers.set(key, value);
  //   });
  // }

  return response;
}

/**
 * Authentication middleware
 */
export function authMiddleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Check if this is an actual auth endpoint (login, signup, etc.)
  const url = request.nextUrl.pathname;
  const isAuthEndpoint =
    url.includes("/auth/") &&
    (url.includes("/login") ||
      url.includes("/signup") ||
      url.includes("/logout") ||
      url.includes("/refresh"));

  // Apply strict rate limiting only for auth endpoints
  const rateLimitType = isAuthEndpoint ? "auth" : "api";
  const rateLimitResult = rateLimit(request, rateLimitType);

  if (!rateLimitResult.success) {
    const errorMessage = isAuthEndpoint
      ? "Too many authentication attempts"
      : "Too many requests";

    return NextResponse.json({ error: errorMessage }, { status: 429 });
  }

  return NextResponse.next();
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    severity: "info",
  };

  console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);

  // In production, you might want to send this to a logging service
  // or security monitoring system
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size too large" };
  }

  return { valid: true };
}

/**
 * Generate CSRF token using Web Crypto API
 */
export async function generateCSRFToken(): Promise<string> {
  return generateSecureToken(32);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

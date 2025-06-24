import { NextRequest, NextResponse } from "next/server";
import { SECURITY_HEADERS, validateOrigin } from "@/lib/security";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Validate origin for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
  }

  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin);
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

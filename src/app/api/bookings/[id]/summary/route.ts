import { NextResponse, NextRequest } from "next/server";
import { BookingService } from "@/lib/services";
import { authenticateToken, AuthenticatedRequest } from "@/lib/auth";
import { ObjectId } from "mongodb";
import OpenAI from "openai";
import {
  securityMiddleware,
  logSecurityEvent,
  rateLimit,
} from "@/lib/security";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/bookings/:id/summary
async function POSTHandler(
  request: AuthenticatedRequest,
  context?: { params?: Promise<Record<string, string>> }
) {
  try {
    // Apply security middleware
    const securityResponse = securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    // Apply rate limiting for AI operations
    const rateLimitResult = rateLimit(request, "strict");
    if (!rateLimitResult.success) {
      logSecurityEvent("rate_limit_exceeded", {
        endpoint: "/api/bookings/[id]/summary",
        userId: request.user?.userId,
        bookingId: (await context?.params)?.id,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        {
          error:
            "Too many summary generation requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const { id: bookingId } = (await context?.params) || {};

    if (!bookingId || !ObjectId.isValid(bookingId)) {
      logSecurityEvent("validation_error", {
        endpoint: "/api/bookings/[id]/summary",
        userId: request.user?.userId,
        error: "Invalid booking ID format",
        bookingId,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Find booking using BookingService
    const booking = await BookingService.findBookingById(bookingId);

    if (!booking || booking.userId.toString() !== request.user?.userId) {
      logSecurityEvent("booking_access_failed", {
        userId: request.user?.userId,
        bookingId,
        reason: "booking_not_found_or_unauthorized",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      logSecurityEvent("configuration_error", {
        endpoint: "/api/bookings/[id]/summary",
        userId: request.user?.userId,
        bookingId,
        error: "OpenAI API key not configured",
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Prepare booking data for OpenAI
    const bookingData = {
      destination: booking.destination,
      departureCity: booking.departureCity,
      departureDate: booking.travelDates.departure.toLocaleDateString(),
      returnDate: booking.travelDates.return.toLocaleDateString(),
      bookingType: booking.bookingType,
      totalAmount: booking.totalAmount,
      currency: booking.currency,
      status: booking.status,
      travellers: booking.travellers
        .map(
          (t: { firstName: string; lastName: string }) =>
            `${t.firstName} ${t.lastName}`
        )
        .join(", "),
    };

    // Determine the appropriate tone based on booking status
    let statusContext = "";
    let toneInstruction = "";
    let emojiInstruction = "";

    switch (booking.status) {
      case "completed":
        statusContext =
          "This booking has been completed - the trip has already taken place.";
        toneInstruction =
          "Write in past tense as if reflecting on a completed trip. Mention memories and experiences.";
        emojiInstruction =
          "Use nostalgic and memory-related emojis like 🎉 ✨ 🗺️ 📸 🏛️ 🍷 🎨 🚶‍♂️ 🌟";
        break;
      case "upcoming":
        statusContext =
          "This is an upcoming booking - the trip is planned for the future.";
        toneInstruction =
          "Write in future tense, building excitement for the upcoming adventure.";
        emojiInstruction =
          "Use exciting and anticipation emojis like 🎉 ✈️ 🗺️ 🏛️ 🍷 🎨 🚶‍♂️ 🌟 🎊";
        break;
      default:
        statusContext = "This booking status is unknown.";
        toneInstruction = "Write in a neutral tone.";
        emojiInstruction = "Use general travel emojis like 🗺️ ✈️ 🏛️";
    }

    // Generate summary using OpenAI
    const prompt = `Generate a friendly and engaging booking summary for a travel booking with the following details:
    
    Destination: ${bookingData.destination}
    Departure City: ${bookingData.departureCity}
    Travel Dates: ${bookingData.departureDate} to ${bookingData.returnDate}
    Booking Type: ${bookingData.bookingType}
    Total Amount: ${bookingData.totalAmount} ${bookingData.currency}
    Travellers: ${bookingData.travellers}
    Booking Status: ${bookingData.status}
    
    Important Context: ${statusContext}
    
    Instructions: ${toneInstruction}
    
    Emoji Guidelines: ${emojiInstruction}
    
    Please create a warm, personalized summary that describes the destination, travel dates, and key highlights of the booking. Make it sound exciting and informative. Keep it under 100 words. Use relevant travel emojis and icons throughout the text to make it visually appealing and engaging.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant that creates friendly and engaging booking summaries. Always consider the booking status when generating summaries - use appropriate tense and tone based on whether the trip is completed, upcoming, or in progress. Include relevant travel emojis and icons throughout the text to make summaries visually appealing and engaging. Use destination-specific emojis when possible (e.g., 🗼 for Paris, 🗽 for New York, 🏛️ for Rome, etc.).",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    const summary = completion.choices[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("Failed to generate summary");
    }

    // Log successful summary generation
    logSecurityEvent("summary_generated", {
      userId: request.user?.userId,
      bookingId,
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });

    const response = NextResponse.json({
      bookingId,
      summary,
      generatedAt: new Date().toISOString(),
    });

    // Add rate limit headers
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;
  } catch (error) {
    console.error("Generate summary error:", error);

    // Handle OpenAI API errors gracefully
    if (error instanceof OpenAI.APIError) {
      logSecurityEvent("openai_api_error", {
        userId: request.user?.userId,
        bookingId: (await context?.params)?.id,
        error: error.message,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        { error: "Failed to generate summary. Please try again later." },
        { status: 503 }
      );
    }

    logSecurityEvent("summary_generation_error", {
      userId: request.user?.userId,
      bookingId: (await context?.params)?.id,
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
export async function POST(
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) {
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

  return POSTHandler(authenticatedRequest, context);
}

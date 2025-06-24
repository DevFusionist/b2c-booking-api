import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

// POST /api/seed
export async function GET() {
  try {
    await seedDatabase();

    return NextResponse.json({
      message: "Database seeded successfully!",
      sampleUsers: [
        {
          email: "john.doe@example.com",
          password: "password123",
        },
        {
          email: "jane.smith@example.com",
          password: "password123",
        },
      ],
    });
  } catch (error) {
    console.error("Seeding error:", error);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}

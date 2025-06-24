import { UserService, TravellerService, BookingService } from "./services";
import { getCollection } from "./db";
import type { IUserCreate, IBookingCreate, ITravellerCreate } from "./models";

export async function seedDatabase() {
  try {
    // Clear existing data
    const usersCollection = await getCollection("users");
    const bookingsCollection = await getCollection("orders");
    const travellersCollection = await getCollection("travellers");

    console.log("Clearing existing data...");

    const usersDeleteResult = await usersCollection.deleteMany({});
    const bookingsDeleteResult = await bookingsCollection.deleteMany({});
    const travellersDeleteResult = await travellersCollection.deleteMany({});

    console.log(
      `Deleted ${usersDeleteResult.deletedCount} users, ${bookingsDeleteResult.deletedCount} bookings, ${travellersDeleteResult.deletedCount} travellers`
    );

    // Sample users data
    const usersData: IUserCreate[] = [
      {
        email: "john.doe@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        phone: "+15550123",
        dateOfBirth: "1990-05-15",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001",
        },
      },
      {
        email: "jane.smith@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Smith",
        phone: "+15550456",
        dateOfBirth: "1985-08-22",
        address: {
          street: "456 Oak Ave",
          city: "Los Angeles",
          state: "CA",
          country: "USA",
          zipCode: "90210",
        },
      },
    ];

    // Create users using UserService
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await UserService.createUser(
        userData as unknown as Record<string, unknown>
      );
      createdUsers.push(user);
    }

    // Sample travellers data
    const travellersData: Array<{ userId: string; data: ITravellerCreate }> = [
      {
        userId: createdUsers[0]._id.toString(),
        data: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1990-05-15",
          passportNumber: "US123456789",
          nationality: "American",
          isPrimary: true,
        },
      },
      {
        userId: createdUsers[0]._id.toString(),
        data: {
          firstName: "Sarah",
          lastName: "Doe",
          dateOfBirth: "1992-03-10",
          passportNumber: "US987654321",
          nationality: "American",
          isPrimary: false,
        },
      },
      {
        userId: createdUsers[1]._id.toString(),
        data: {
          firstName: "Jane",
          lastName: "Smith",
          dateOfBirth: "1985-08-22",
          passportNumber: "US456789123",
          nationality: "American",
          isPrimary: true,
        },
      },
    ];

    // Create travellers using TravellerService
    const createdTravellers = [];
    for (const travellerInfo of travellersData) {
      const traveller = await TravellerService.createTraveller(
        travellerInfo.userId,
        travellerInfo.data as unknown as Record<string, unknown>
      );
      createdTravellers.push(traveller);
    }

    // Sample bookings data
    const bookingsData: Array<{ userId: string; data: IBookingCreate }> = [
      {
        userId: createdUsers[0]._id.toString(),
        data: {
          bookingId: "BK001",
          destination: "Dubai",
          departureCity: "New York",
          travelDates: {
            departure: new Date("2025-06-15"),
            return: new Date("2025-08-20"),
          },
          bookingType: "package",
          totalAmount: 2500,
          currency: "USD",
          travellers: [
            {
              firstName: createdTravellers[0].firstName,
              lastName: createdTravellers[0].lastName,
              dateOfBirth: createdTravellers[0].dateOfBirth,
              passportNumber: createdTravellers[0].passportNumber,
              nationality: createdTravellers[0].nationality,
              isPrimary: createdTravellers[0].isPrimary,
            },
            {
              firstName: createdTravellers[1].firstName,
              lastName: createdTravellers[1].lastName,
              dateOfBirth: createdTravellers[1].dateOfBirth,
              passportNumber: createdTravellers[1].passportNumber,
              nationality: createdTravellers[1].nationality,
              isPrimary: createdTravellers[1].isPrimary,
            },
          ],
        },
      },
      {
        userId: createdUsers[0]._id.toString(),
        data: {
          bookingId: "BK002",
          destination: "Paris",
          departureCity: "New York",
          travelDates: {
            departure: new Date("2024-12-10"),
            return: new Date("2024-12-15"),
          },
          bookingType: "package",
          totalAmount: 1800,
          currency: "USD",
          travellers: [
            {
              firstName: createdTravellers[0].firstName,
              lastName: createdTravellers[0].lastName,
              dateOfBirth: createdTravellers[0].dateOfBirth,
              passportNumber: createdTravellers[0].passportNumber,
              nationality: createdTravellers[0].nationality,
              isPrimary: createdTravellers[0].isPrimary,
            },
          ],
        },
      },
      {
        userId: createdUsers[1]._id.toString(),
        data: {
          bookingId: "BK003",
          destination: "Tokyo",
          departureCity: "Los Angeles",
          travelDates: {
            departure: new Date("2025-08-05"),
            return: new Date("2025-08-12"),
          },
          bookingType: "flight",
          totalAmount: 3200,
          currency: "USD",
          travellers: [
            {
              firstName: createdTravellers[2].firstName,
              lastName: createdTravellers[2].lastName,
              dateOfBirth: createdTravellers[2].dateOfBirth,
              passportNumber: createdTravellers[2].passportNumber,
              nationality: createdTravellers[2].nationality,
              isPrimary: createdTravellers[2].isPrimary,
            },
          ],
        },
      },
    ];

    // Create bookings using BookingService
    const createdBookings = [];
    for (const bookingInfo of bookingsData) {
      const booking = await BookingService.createBooking(
        bookingInfo.userId,
        bookingInfo.data as unknown as Record<string, unknown>
      );
      createdBookings.push(booking);
    }

    console.log("Database seeded successfully!");
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${createdTravellers.length} travellers`);
    console.log(`Created ${createdBookings.length} bookings`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

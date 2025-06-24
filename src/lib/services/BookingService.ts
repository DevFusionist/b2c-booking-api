import { getCollection } from "../db";
import { ObjectId } from "mongodb";
import {
  IBooking,
  IBookingResponse,
  validateBookingCreate,
  validateBookingUpdate,
} from "../models/Booking";

export class BookingService {
  private static collectionName = "orders";

  static async createBooking(
    userId: string,
    bookingData: Record<string, unknown>
  ): Promise<IBookingResponse> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const validatedData = validateBookingCreate(bookingData);
      const collection = await getCollection(this.collectionName);

      // Check if booking ID already exists
      const existingBooking = await collection.findOne({
        bookingId: validatedData.bookingId,
      });
      if (existingBooking) {
        throw new Error("Booking with this ID already exists");
      }

      const booking: IBooking = {
        userId: new ObjectId(userId),
        ...validatedData,
        lastTravelDate: validatedData.travelDates.return,
        status:
          validatedData.travelDates.return > new Date()
            ? "upcoming"
            : "completed",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(booking);

      return {
        _id: result.insertedId,
        ...booking,
      };
    } catch (error) {
      throw error;
    }
  }

  static async findBookingById(
    bookingId: string
  ): Promise<IBookingResponse | null> {
    try {
      if (!ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
      }

      const collection = await getCollection(this.collectionName);
      const booking = await collection.findOne({
        _id: new ObjectId(bookingId),
      });

      return booking as IBookingResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async findBookingByBookingId(
    bookingId: string
  ): Promise<IBookingResponse | null> {
    try {
      const collection = await getCollection(this.collectionName);
      const booking = await collection.findOne({
        bookingId: bookingId.toUpperCase(),
      });

      return booking as IBookingResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async findBookingsByUserId(
    userId: string,
    status?: "upcoming" | "completed"
  ): Promise<IBookingResponse[]> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);
      const today = new Date();

      const filter: Record<string, unknown> = { userId: new ObjectId(userId) };

      if (status === "upcoming") {
        filter.lastTravelDate = { $gte: today };
      } else if (status === "completed") {
        filter.lastTravelDate = { $lt: today };
      }
      console.log("filter -- ", filter);

      const bookings = await collection
        .find(filter)
        .sort({ lastTravelDate: status === "upcoming" ? 1 : -1 })
        .toArray();

      return bookings as IBookingResponse[];
    } catch (error) {
      throw error;
    }
  }

  static async updateBooking(
    bookingId: string,
    userId: string,
    updateData: Record<string, unknown>
  ): Promise<IBookingResponse | null> {
    try {
      if (!ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
      }

      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const validatedData = validateBookingUpdate(updateData);
      const collection = await getCollection(this.collectionName);

      // Verify booking belongs to user
      const existingBooking = await collection.findOne({
        _id: new ObjectId(bookingId),
        userId: new ObjectId(userId),
      });

      if (!existingBooking) {
        throw new Error("Booking not found or unauthorized");
      }

      const updateFields: Record<string, unknown> = {
        ...validatedData,
        updatedAt: new Date(),
      };

      // Update lastTravelDate if travelDates are updated
      if (validatedData.travelDates) {
        updateFields.lastTravelDate = validatedData.travelDates.return;
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(bookingId) },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      return result as IBookingResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async deleteBooking(
    bookingId: string,
    userId: string
  ): Promise<boolean> {
    try {
      if (!ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
      }

      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);

      // Verify booking belongs to user
      const booking = await collection.findOne({
        _id: new ObjectId(bookingId),
        userId: new ObjectId(userId),
      });

      if (!booking) {
        throw new Error("Booking not found or unauthorized");
      }

      const result = await collection.deleteOne({
        _id: new ObjectId(bookingId),
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updateBookingStatus(
    bookingId: string,
    userId: string,
    status: "upcoming" | "completed"
  ): Promise<boolean> {
    try {
      if (!ObjectId.isValid(bookingId)) {
        throw new Error("Invalid booking ID");
      }

      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);

      // Verify booking belongs to user
      const booking = await collection.findOne({
        _id: new ObjectId(bookingId),
        userId: new ObjectId(userId),
      });

      if (!booking) {
        throw new Error("Booking not found or unauthorized");
      }

      const result = await collection.updateOne(
        { _id: new ObjectId(bookingId) },
        {
          $set: {
            status,
            updatedAt: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getBookingStats(userId: string): Promise<{
    total: number;
    upcoming: number;
    completed: number;
    totalAmount: number;
  }> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);
      const today = new Date();

      const pipeline = [
        { $match: { userId: new ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            upcoming: {
              $sum: {
                $cond: [{ $gte: ["$lastTravelDate", today] }, 1, 0],
              },
            },
            completed: {
              $sum: {
                $cond: [{ $lt: ["$lastTravelDate", today] }, 1, 0],
              },
            },
          },
        },
      ];

      const result = await collection.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return {
          total: 0,
          upcoming: 0,
          completed: 0,
          totalAmount: 0,
        };
      }

      return {
        total: result[0].total || 0,
        upcoming: result[0].upcoming || 0,
        completed: result[0].completed || 0,
        totalAmount: result[0].totalAmount || 0,
      };
    } catch (error) {
      throw error;
    }
  }
}

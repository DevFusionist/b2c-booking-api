import { getCollection } from "../db";
import { ObjectId } from "mongodb";
import {
  ITraveller,
  ITravellerResponse,
  validateTravellerCreate,
  validateTravellerUpdate,
} from "../models/Traveller";
import { NextResponse } from "next/server";

export class TravellerService {
  private static collectionName = "travellers";

  static async createTraveller(
    userId: string,
    travellerData: Record<string, unknown>
  ): Promise<ITravellerResponse> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const validatedData = validateTravellerCreate(travellerData);
      const collection = await getCollection(this.collectionName);

      // If this is the first traveller, make them primary
      const existingTravellers = await collection.countDocuments({
        userId: new ObjectId(userId),
      });

      if (existingTravellers === 0) {
        validatedData.isPrimary = true;
      }

      // If setting as primary, unset other primary travellers
      if (validatedData.isPrimary) {
        await collection.updateMany(
          { userId: new ObjectId(userId) },
          { $set: { isPrimary: false } }
        );
      }

      const traveller: ITraveller = {
        userId: new ObjectId(userId),
        ...validatedData,
        isPrimary: validatedData.isPrimary || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(traveller);

      return {
        _id: result.insertedId,
        ...traveller,
      };
    } catch (error) {
      throw error;
    }
  }

  static async findTravellerById(
    travellerId: string
  ): Promise<ITravellerResponse | null> {
    try {
      if (!ObjectId.isValid(travellerId)) {
        throw new Error("Invalid traveller ID");
      }

      const collection = await getCollection(this.collectionName);
      const traveller = await collection.findOne({
        _id: new ObjectId(travellerId),
      });

      return traveller as ITravellerResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async findTravellersByUserId(
    userId: string
  ): Promise<ITravellerResponse[]> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);
      const travellers = await collection
        .find({ userId: new ObjectId(userId) })
        .sort({ isPrimary: -1, createdAt: 1 })
        .toArray();

      return travellers as ITravellerResponse[];
    } catch (error) {
      throw error;
    }
  }

  static async findPrimaryTravellerByUserId(
    userId: string
  ): Promise<ITravellerResponse | null> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);
      const traveller = await collection.findOne({
        userId: new ObjectId(userId),
        isPrimary: true,
      });

      return traveller as ITravellerResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async updateTraveller(
    travellerId: string,
    userId: string,
    updateData: Record<string, unknown>
  ): Promise<ITravellerResponse | NextResponse | null> {
    try {
      if (!ObjectId.isValid(travellerId)) {
        throw new Error("Invalid traveller ID");
      }

      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const validatedData = validateTravellerUpdate(updateData);
      const collection = await getCollection(this.collectionName);

      // Verify traveller belongs to user
      const existingTraveller = await collection.findOne({
        _id: new ObjectId(travellerId),
        userId: new ObjectId(userId),
      });

      if (!existingTraveller) {
        return NextResponse.json(
          { error: "Traveller not found or unauthorized" },
          { status: 404 }
        );
      }

      // If setting as primary, unset other primary travellers
      if (validatedData.isPrimary) {
        await collection.updateMany(
          {
            userId: new ObjectId(userId),
            _id: { $ne: new ObjectId(travellerId) },
          },
          { $set: { isPrimary: false } }
        );
      }

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(travellerId) },
        {
          $set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      return result as ITravellerResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async deleteTraveller(
    travellerId: string,
    userId: string
  ): Promise<boolean | NextResponse> {
    try {
      if (!ObjectId.isValid(travellerId)) {
        throw new Error("Invalid traveller ID");
      }

      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);

      // Verify traveller belongs to user and is not primary
      const traveller = await collection.findOne({
        _id: new ObjectId(travellerId),
        userId: new ObjectId(userId),
      });

      if (!traveller) {
        return NextResponse.json(
          { error: "Traveller not found or unauthorized" },
          { status: 404 }
        );
      }

      if (traveller.isPrimary) {
        throw new Error("Cannot delete primary traveller");
      }

      const result = await collection.deleteOne({
        _id: new ObjectId(travellerId),
      });

      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async setPrimaryTraveller(
    travellerId: string,
    userId: string
  ): Promise<boolean | NextResponse> {
    try {
      if (!ObjectId.isValid(travellerId)) {
        throw new Error("Invalid traveller ID");
      }

      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);

      // Verify traveller belongs to user
      const traveller = await collection.findOne({
        _id: new ObjectId(travellerId),
        userId: new ObjectId(userId),
      });

      if (!traveller) {
        return NextResponse.json(
          { error: "Traveller not found or unauthorized" },
          { status: 404 }
        );
      }

      // Unset all primary travellers for this user
      await collection.updateMany(
        { userId: new ObjectId(userId) },
        { $set: { isPrimary: false } }
      );

      // Set the specified traveller as primary
      const result = await collection.updateOne(
        { _id: new ObjectId(travellerId) },
        { $set: { isPrimary: true, updatedAt: new Date() } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

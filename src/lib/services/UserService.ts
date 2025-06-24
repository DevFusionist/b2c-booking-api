import { getCollection } from "../db";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import {
  IUser,
  IUserResponse,
  validateUserCreate,
  validateUserUpdate,
} from "../models/User";

export class UserService {
  private static collectionName = "users";

  static async createUser(
    userData: Record<string, unknown>
  ): Promise<IUserResponse> {
    try {
      const validatedData = validateUserCreate(userData);

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(validatedData.password, salt);

      const collection = await getCollection(this.collectionName);

      // Check if user already exists
      const existingUser = await collection.findOne({
        email: validatedData.email,
      });
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const user: IUser = {
        ...validatedData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await collection.insertOne(user);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _password, ...userResponse } = user;
      return {
        _id: result.insertedId,
        ...userResponse,
      };
    } catch (error) {
      throw error;
    }
  }

  static async findUserById(userId: string): Promise<IUserResponse | null> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);
      const user = await collection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } }
      );

      return user as IUserResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async findUserByEmail(email: string): Promise<IUser | null> {
    try {
      const collection = await getCollection(this.collectionName);
      const user = await collection.findOne({ email: email.toLowerCase() });
      return user as IUser | null;
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(
    userId: string,
    updateData: Record<string, unknown>
  ): Promise<IUserResponse | null> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const validatedData = validateUserUpdate(updateData);
      const collection = await getCollection(this.collectionName);

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
          $set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: "after",
          projection: { password: 0 },
        }
      );

      return result as IUserResponse | null;
    } catch (error) {
      throw error;
    }
  }

  static async deleteUser(userId: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      const collection = await getCollection(this.collectionName);
      const result = await collection.deleteOne({ _id: new ObjectId(userId) });

      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  static async verifyPassword(user: IUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  static async changePassword(
    userId: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      if (!ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const collection = await getCollection(this.collectionName);
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

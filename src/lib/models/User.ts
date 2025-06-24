import { ObjectId } from "mongodb";

export interface IUser {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export interface IUserResponse extends Omit<IUser, "password"> {
  _id: ObjectId;
}

// Validation functions
export const validateUserCreate = (
  data: Record<string, unknown>
): IUserCreate => {
  const errors: string[] = [];

  if (!data.email || typeof data.email !== "string") {
    errors.push("Email is required and must be a string");
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.password || typeof data.password !== "string") {
    errors.push("Password is required and must be a string");
  } else if (data.password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!data.firstName || typeof data.firstName !== "string") {
    errors.push("First name is required and must be a string");
  } else if (data.firstName.length > 50) {
    errors.push("First name cannot exceed 50 characters");
  }

  if (!data.lastName || typeof data.lastName !== "string") {
    errors.push("Last name is required and must be a string");
  } else if (data.lastName.length > 50) {
    errors.push("Last name cannot exceed 50 characters");
  }

  if (data.phone && typeof data.phone !== "string") {
    errors.push("Phone must be a string");
  } else if (
    data.phone &&
    !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone as string)
  ) {
    errors.push("Invalid phone number format");
  }

  if (data.dateOfBirth && typeof data.dateOfBirth !== "string") {
    errors.push("Date of birth must be a string");
  } else if (
    data.dateOfBirth &&
    !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth as string)
  ) {
    errors.push("Date of birth must be in YYYY-MM-DD format");
  }

  if (data.address) {
    if (typeof data.address !== "object") {
      errors.push("Address must be an object");
    } else {
      const address = data.address as Record<string, unknown>;
      const requiredAddressFields = [
        "street",
        "city",
        "state",
        "country",
        "zipCode",
      ];
      for (const field of requiredAddressFields) {
        if (!address[field] || typeof address[field] !== "string") {
          errors.push(`Address ${field} is required and must be a string`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  return {
    email: (data.email as string).toLowerCase().trim(),
    password: data.password as string,
    firstName: (data.firstName as string).trim(),
    lastName: (data.lastName as string).trim(),
    phone: (data.phone as string)?.trim(),
    dateOfBirth: data.dateOfBirth as string,
    address: data.address as IUserCreate["address"],
  };
};

export const validateUserUpdate = (
  data: Record<string, unknown>
): IUserUpdate => {
  const errors: string[] = [];

  if (data.firstName !== undefined) {
    if (typeof data.firstName !== "string") {
      errors.push("First name must be a string");
    } else if (data.firstName.length > 50) {
      errors.push("First name cannot exceed 50 characters");
    }
  }

  if (data.lastName !== undefined) {
    if (typeof data.lastName !== "string") {
      errors.push("Last name must be a string");
    } else if (data.lastName.length > 50) {
      errors.push("Last name cannot exceed 50 characters");
    }
  }

  if (data.phone !== undefined) {
    if (typeof data.phone !== "string") {
      errors.push("Phone must be a string");
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(data.phone as string)) {
      errors.push("Invalid phone number format");
    }
  }

  if (data.dateOfBirth !== undefined) {
    if (typeof data.dateOfBirth !== "string") {
      errors.push("Date of birth must be a string");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth as string)) {
      errors.push("Date of birth must be in YYYY-MM-DD format");
    }
  }

  if (data.address !== undefined) {
    if (typeof data.address !== "object") {
      errors.push("Address must be an object");
    } else {
      const address = data.address as Record<string, unknown>;
      const requiredAddressFields = [
        "street",
        "city",
        "state",
        "country",
        "zipCode",
      ];
      for (const field of requiredAddressFields) {
        if (!address[field] || typeof address[field] !== "string") {
          errors.push(`Address ${field} is required and must be a string`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  return {
    firstName: (data.firstName as string)?.trim(),
    lastName: (data.lastName as string)?.trim(),
    phone: (data.phone as string)?.trim(),
    dateOfBirth: data.dateOfBirth as string,
    address: data.address as IUserUpdate["address"],
  };
};

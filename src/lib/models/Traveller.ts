import { ObjectId } from "mongodb";

export interface ITraveller {
  _id?: ObjectId;
  userId: ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITravellerCreate {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality: string;
  isPrimary?: boolean;
}

export interface ITravellerUpdate {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  isPrimary?: boolean;
}

export interface ITravellerResponse extends ITraveller {
  _id: ObjectId;
}

// Validation functions
export const validateTravellerCreate = (
  data: Record<string, unknown>
): ITravellerCreate => {
  const errors: string[] = [];

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

  if (!data.dateOfBirth || typeof data.dateOfBirth !== "string") {
    errors.push("Date of birth is required and must be a string");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
    errors.push("Date of birth must be in YYYY-MM-DD format");
  }

  if (data.passportNumber && typeof data.passportNumber !== "string") {
    errors.push("Passport number must be a string");
  } else if (
    data.passportNumber &&
    typeof data.passportNumber === "string" &&
    data.passportNumber.length > 20
  ) {
    errors.push("Passport number cannot exceed 20 characters");
  }

  if (!data.nationality || typeof data.nationality !== "string") {
    errors.push("Nationality is required and must be a string");
  } else if (data.nationality.length > 50) {
    errors.push("Nationality cannot exceed 50 characters");
  }

  if (data.isPrimary !== undefined && typeof data.isPrimary !== "boolean") {
    errors.push("isPrimary must be a boolean");
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  return {
    firstName: (data.firstName as string).trim(),
    lastName: (data.lastName as string).trim(),
    dateOfBirth: data.dateOfBirth as string,
    passportNumber: (data.passportNumber as string)?.trim(),
    nationality: (data.nationality as string).trim(),
    isPrimary: (data.isPrimary as boolean) || false,
  };
};

export const validateTravellerUpdate = (
  data: Record<string, unknown>
): ITravellerUpdate => {
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

  if (data.dateOfBirth !== undefined) {
    if (typeof data.dateOfBirth !== "string") {
      errors.push("Date of birth must be a string");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) {
      errors.push("Date of birth must be in YYYY-MM-DD format");
    }
  }

  if (data.passportNumber !== undefined) {
    if (typeof data.passportNumber !== "string") {
      errors.push("Passport number must be a string");
    } else if (
      data.passportNumber &&
      typeof data.passportNumber === "string" &&
      data.passportNumber.length > 20
    ) {
      errors.push("Passport number cannot exceed 20 characters");
    }
  }

  if (data.nationality !== undefined) {
    if (typeof data.nationality !== "string") {
      errors.push("Nationality must be a string");
    } else if (data.nationality.length > 50) {
      errors.push("Nationality cannot exceed 50 characters");
    }
  }

  if (data.isPrimary !== undefined && typeof data.isPrimary !== "boolean") {
    errors.push("isPrimary must be a boolean");
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  return {
    firstName: (data.firstName as string)?.trim(),
    lastName: (data.lastName as string)?.trim(),
    dateOfBirth: data.dateOfBirth as string,
    passportNumber: (data.passportNumber as string)?.trim(),
    nationality: (data.nationality as string)?.trim(),
    isPrimary: data.isPrimary as boolean,
  };
};

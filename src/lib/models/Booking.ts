import { ObjectId } from "mongodb";

export interface ITraveller {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  passportNumber?: string;
  nationality: string;
  isPrimary: boolean;
}

export interface IBooking {
  _id?: ObjectId;
  userId: ObjectId;
  bookingId: string;
  destination: string;
  departureCity: string;
  travelDates: {
    departure: Date;
    return: Date;
  };
  lastTravelDate: Date;
  status: "upcoming" | "completed";
  bookingType: "flight" | "hotel" | "package";
  totalAmount: number;
  currency: string;
  travellers: ITraveller[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookingCreate {
  bookingId: string;
  destination: string;
  departureCity: string;
  travelDates: {
    departure: Date;
    return: Date;
  };
  bookingType: "flight" | "hotel" | "package";
  totalAmount: number;
  currency: string;
  travellers: ITraveller[];
}

export interface IBookingUpdate {
  destination?: string;
  departureCity?: string;
  travelDates?: {
    departure: Date;
    return: Date;
  };
  bookingType?: "flight" | "hotel" | "package";
  totalAmount?: number;
  currency?: string;
  travellers?: ITraveller[];
}

export interface IBookingResponse extends IBooking {
  _id: ObjectId;
}

// Validation functions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateTraveller = (traveller: any): ITraveller => {
  const errors: string[] = [];

  if (!traveller.firstName || typeof traveller.firstName !== "string") {
    errors.push("Traveller first name is required and must be a string");
  } else if (traveller.firstName.length > 50) {
    errors.push("Traveller first name cannot exceed 50 characters");
  }

  if (!traveller.lastName || typeof traveller.lastName !== "string") {
    errors.push("Traveller last name is required and must be a string");
  } else if (traveller.lastName.length > 50) {
    errors.push("Traveller last name cannot exceed 50 characters");
  }

  if (!traveller.dateOfBirth || typeof traveller.dateOfBirth !== "string") {
    errors.push("Traveller date of birth is required and must be a string");
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(traveller.dateOfBirth)) {
    errors.push("Traveller date of birth must be in YYYY-MM-DD format");
  }

  if (
    traveller.passportNumber &&
    typeof traveller.passportNumber !== "string"
  ) {
    errors.push("Traveller passport number must be a string");
  } else if (traveller.passportNumber && traveller.passportNumber.length > 20) {
    errors.push("Traveller passport number cannot exceed 20 characters");
  }

  if (!traveller.nationality || typeof traveller.nationality !== "string") {
    errors.push("Traveller nationality is required and must be a string");
  } else if (traveller.nationality.length > 50) {
    errors.push("Traveller nationality cannot exceed 50 characters");
  }

  if (typeof traveller.isPrimary !== "boolean") {
    errors.push("Traveller isPrimary must be a boolean");
  }

  if (errors.length > 0) {
    throw new Error(`Traveller validation errors: ${errors.join(", ")}`);
  }

  return {
    firstName: traveller.firstName.trim(),
    lastName: traveller.lastName.trim(),
    dateOfBirth: traveller.dateOfBirth,
    passportNumber: traveller.passportNumber?.trim(),
    nationality: traveller.nationality.trim(),
    isPrimary: traveller.isPrimary,
  };
};

export const validateTravelDates = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  travelDates: any
): { departure: Date; return: Date } => {
  const errors: string[] = [];

  if (!travelDates.departure) {
    errors.push("Departure date is required");
  } else if (
    !(travelDates.departure instanceof Date) &&
    isNaN(Date.parse(travelDates.departure))
  ) {
    errors.push("Departure date must be a valid date");
  }

  if (!travelDates.return) {
    errors.push("Return date is required");
  } else if (
    !(travelDates.return instanceof Date) &&
    isNaN(Date.parse(travelDates.return))
  ) {
    errors.push("Return date must be a valid date");
  }

  if (errors.length > 0) {
    throw new Error(`Travel dates validation errors: ${errors.join(", ")}`);
  }

  const departure =
    travelDates.departure instanceof Date
      ? travelDates.departure
      : new Date(travelDates.departure);
  const returnDate =
    travelDates.return instanceof Date
      ? travelDates.return
      : new Date(travelDates.return);

  if (departure >= returnDate) {
    throw new Error("Return date must be after departure date");
  }

  return { departure, return: returnDate };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBookingCreate = (data: any): IBookingCreate => {
  const errors: string[] = [];

  if (!data.bookingId || typeof data.bookingId !== "string") {
    errors.push("Booking ID is required and must be a string");
  } else if (data.bookingId.length > 20) {
    errors.push("Booking ID cannot exceed 20 characters");
  }

  if (!data.destination || typeof data.destination !== "string") {
    errors.push("Destination is required and must be a string");
  } else if (data.destination.length > 100) {
    errors.push("Destination cannot exceed 100 characters");
  }

  if (!data.departureCity || typeof data.departureCity !== "string") {
    errors.push("Departure city is required and must be a string");
  } else if (data.departureCity.length > 100) {
    errors.push("Departure city cannot exceed 100 characters");
  }

  if (!data.travelDates) {
    errors.push("Travel dates are required");
  } else {
    try {
      validateTravelDates(data.travelDates);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Invalid travel dates"
      );
    }
  }

  if (!data.bookingType || typeof data.bookingType !== "string") {
    errors.push("Booking type is required and must be a string");
  } else if (!["flight", "hotel", "package"].includes(data.bookingType)) {
    errors.push('Booking type must be "flight", "hotel", or "package"');
  }

  if (!data.totalAmount || typeof data.totalAmount !== "number") {
    errors.push("Total amount is required and must be a number");
  } else if (data.totalAmount < 0) {
    errors.push("Total amount cannot be negative");
  }

  if (!data.currency || typeof data.currency !== "string") {
    errors.push("Currency is required and must be a string");
  } else if (data.currency.length > 3) {
    errors.push("Currency code cannot exceed 3 characters");
  }

  if (!Array.isArray(data.travellers) || data.travellers.length === 0) {
    errors.push("At least one traveller is required");
  } else {
    try {
      data.travellers.forEach((traveller: ITraveller) => {
        validateTraveller(traveller);
      });
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Invalid traveller data"
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  const travelDates = validateTravelDates(data.travelDates);
  const travellers = data.travellers.map((traveller: ITraveller) =>
    validateTraveller(traveller)
  );

  return {
    bookingId: data.bookingId.trim().toUpperCase(),
    destination: data.destination.trim(),
    departureCity: data.departureCity.trim(),
    travelDates,
    bookingType: data.bookingType,
    totalAmount: data.totalAmount,
    currency: data.currency.trim().toUpperCase(),
    travellers,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBookingUpdate = (data: any): IBookingUpdate => {
  const errors: string[] = [];

  if (data.destination !== undefined) {
    if (typeof data.destination !== "string") {
      errors.push("Destination must be a string");
    } else if (data.destination.length > 100) {
      errors.push("Destination cannot exceed 100 characters");
    }
  }

  if (data.departureCity !== undefined) {
    if (typeof data.departureCity !== "string") {
      errors.push("Departure city must be a string");
    } else if (data.departureCity.length > 100) {
      errors.push("Departure city cannot exceed 100 characters");
    }
  }

  if (data.travelDates !== undefined) {
    try {
      validateTravelDates(data.travelDates);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Invalid travel dates"
      );
    }
  }

  if (data.bookingType !== undefined) {
    if (typeof data.bookingType !== "string") {
      errors.push("Booking type must be a string");
    } else if (!["flight", "hotel", "package"].includes(data.bookingType)) {
      errors.push('Booking type must be "flight", "hotel", or "package"');
    }
  }

  if (data.totalAmount !== undefined) {
    if (typeof data.totalAmount !== "number") {
      errors.push("Total amount must be a number");
    } else if (data.totalAmount < 0) {
      errors.push("Total amount cannot be negative");
    }
  }

  if (data.currency !== undefined) {
    if (typeof data.currency !== "string") {
      errors.push("Currency must be a string");
    } else if (data.currency.length > 3) {
      errors.push("Currency code cannot exceed 3 characters");
    }
  }

  if (data.travellers !== undefined) {
    if (!Array.isArray(data.travellers) || data.travellers.length === 0) {
      errors.push("At least one traveller is required");
    } else {
      try {
        data.travellers.forEach((traveller: ITraveller) => {
          validateTraveller(traveller);
        });
      } catch (error) {
        errors.push(
          error instanceof Error ? error.message : "Invalid traveller data"
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Validation errors: ${errors.join(", ")}`);
  }

  const result: IBookingUpdate = {};

  if (data.destination !== undefined) {
    result.destination = data.destination.trim();
  }
  if (data.departureCity !== undefined) {
    result.departureCity = data.departureCity.trim();
  }
  if (data.travelDates !== undefined) {
    result.travelDates = validateTravelDates(data.travelDates);
  }
  if (data.bookingType !== undefined) {
    result.bookingType = data.bookingType;
  }
  if (data.totalAmount !== undefined) {
    result.totalAmount = data.totalAmount;
  }
  if (data.currency !== undefined) {
    result.currency = data.currency.trim().toUpperCase();
  }
  if (data.travellers !== undefined) {
    result.travellers = data.travellers.map((traveller: ITraveller) =>
      validateTraveller(traveller)
    );
  }

  return result;
};

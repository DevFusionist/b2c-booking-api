// User models and interfaces
export type { IUser, IUserCreate, IUserUpdate, IUserResponse } from "./User";
export { validateUserCreate, validateUserUpdate } from "./User";

// Traveller models and interfaces
export type {
  ITraveller,
  ITravellerCreate,
  ITravellerUpdate,
  ITravellerResponse,
} from "./Traveller";
export { validateTravellerCreate, validateTravellerUpdate } from "./Traveller";

// Booking models and interfaces
export type {
  IBooking,
  IBookingCreate,
  IBookingUpdate,
  IBookingResponse,
  ITraveller as IBookingTraveller,
} from "./Booking";
export {
  validateBookingCreate,
  validateBookingUpdate,
  validateTraveller,
  validateTravelDates,
} from "./Booking";

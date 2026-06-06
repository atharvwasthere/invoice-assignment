/**
 * Central model registry.
 *
 * Importing this module once at app startup runs every model file, which registers
 * each schema with Mongoose's model registry. This makes `.populate()` order-
 * independent: any feature (or test) that loads the app gets all models registered,
 * regardless of which routes happen to be mounted. Without it, populate("customer")
 * would only work if some other feature incidentally imported the Customer model.
 */
export { Customer } from "./Customer.js";
export { Invoice } from "./Invoice.js";
export { Counter } from "./Counter.js";

import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connect to MongoDB. Called once at server boot and by the seed script.
 *
 * `strictQuery: true` rejects filter keys not defined in the schema, catching
 * typo'd query fields (e.g. `dueDat`) instead of silently returning everything.
 */
export async function connectDb(uri: string = env.mongoUri): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected: ${uri}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

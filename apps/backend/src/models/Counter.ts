import { Schema, model } from "mongoose";

/**
 * Atomic sequence counter. One document per named sequence (e.g. _id "invoiceId").
 * `findOneAndUpdate` with `$inc` is atomic at the document level, so concurrent
 * creates each get a distinct, monotonically increasing number — no race, no
 * random-collision retry.
 */
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const Counter = model("Counter", counterSchema);

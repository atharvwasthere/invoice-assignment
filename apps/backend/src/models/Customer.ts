import { Schema, model, type InferSchemaType } from "mongoose";

/** Customer collection — normalised owner of company identity (1:1). Rationale in README. */
const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// Unique on (name, company) — the seed upserts on this pair, so re-runs don't duplicate.
customerSchema.index({ name: 1, company: 1 }, { unique: true });

export type CustomerDoc = InferSchemaType<typeof customerSchema>;

export const Customer = model("Customer", customerSchema);

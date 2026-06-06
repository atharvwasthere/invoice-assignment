import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { INVOICE_STATUSES, TAX_RATES } from "@invoice/shared";

/**
 * Invoice collection — pure reference to Customer (no denormalised company), enums/types
 * mirror @invoice/shared. Modeling rationale (stored tax/total, Date types, no soft
 * delete) is in the README.
 */
const invoiceSchema = new Schema(
  {
    invoiceId: { type: String, required: true, unique: true, trim: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, enum: TAX_RATES as readonly number[] },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: INVOICE_STATUSES },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

// One index per API filter/sort path — nothing speculative.
invoiceSchema.index({ status: 1 }); // filter by status
invoiceSchema.index({ customer: 1 }); // filter by customer + profile $match
invoiceSchema.index({ dueDate: 1 }); // sort + range filter
invoiceSchema.index({ issueDate: 1 }); // range filter
invoiceSchema.index({ amount: 1 }); // sort by amount
invoiceSchema.index({ taxRate: 1 }); // filter by tax rate
invoiceSchema.index({ customer: 1, status: 1 }); // compound: customer profile view
// `invoiceId` already has a unique index from the field definition above.

export type InvoiceDoc = InferSchemaType<typeof invoiceSchema> & {
  customer: Types.ObjectId;
};

export const Invoice = model("Invoice", invoiceSchema);

import { z } from "zod";
import {
  INVOICE_STATUSES,
  TAX_RATES,
  SORTABLE_FIELDS,
  SORT_ORDERS,
} from "./enums.js";

/**
 * Zod schemas for invoice input + query parsing.
 *
 * These are the single source of truth for API contract types: the backend
 * validates against them and the frontend infers form/query types from the same
 * schemas via `z.infer`, so the two can never drift.
 */

/** Coerce an ISO date string ("2025-07-12") into a Date, rejecting garbage. */
const isoDate = z.coerce.date();

/**
 * Body shape for creating an invoice. Server-owned fields are NOT accepted from the
 * client: `invoiceId` is generated server-side (atomic counter), and `tax`/`total` are
 * derived from `amount` + `taxRate` — so none of them can be forged.
 */
export const createInvoiceSchema = z.object({
  customer: z.string().min(1), // Customer _id (ObjectId as string)
  amount: z.number().nonnegative(),
  taxRate: z.union(
    TAX_RATES.map((r) => z.literal(r)) as [
      z.ZodLiteral<number>,
      z.ZodLiteral<number>,
      ...z.ZodLiteral<number>[],
    ],
  ),
  status: z.enum(INVOICE_STATUSES),
  issueDate: isoDate,
  dueDate: isoDate,
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

/** Edit reuses the create shape but every field is optional (partial update). */
export const updateInvoiceSchema = createInvoiceSchema.partial();

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

/**
 * Query params for GET /invoices — pagination, sort, and all required filters.
 * `z.coerce` turns the always-string query values into the right runtime types.
 */
export const invoiceQuerySchema = z.object({
  // pagination — never return all 2000 records
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // sort
  sortBy: z.enum(SORTABLE_FIELDS).default("dueDate"),
  order: z.enum(SORT_ORDERS).default("desc"),

  // filters
  status: z.enum(INVOICE_STATUSES).optional(),
  customer: z.string().optional(), // Customer _id
  taxRate: z.coerce
    .number()
    .refine((n) => (TAX_RATES as readonly number[]).includes(n), "Invalid taxRate")
    .optional(),

  // free-text search over invoiceId + customer name (case-insensitive)
  search: z.string().trim().optional(),

  // date filters: single value OR range (inclusive bounds)
  issueDateFrom: isoDate.optional(),
  issueDateTo: isoDate.optional(),
  dueDateFrom: isoDate.optional(),
  dueDateTo: isoDate.optional(),
});

export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>;

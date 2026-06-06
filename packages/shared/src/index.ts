/**
 * @invoice/shared — the contract between backend and frontend.
 *
 * Everything the two sides must agree on lives here: enums, zod schemas, and the
 * domain/response types. Import from "@invoice/shared" on both sides so a shape
 * change is a single edit, not a silent mismatch.
 */

export * from "./enums.js";
export * from "./invoice.schema.js";
export * from "./customer.schema.js";

import type { InvoiceStatus, TaxRate } from "./enums.js";

/** A customer document as returned by the API (ObjectIds serialized to strings). */
export interface ICustomer {
  _id: string;
  name: string;
  company: string;
  createdAt: string;
  updatedAt: string;
}

/** An invoice document as returned by the API. `customer` may be an id or, on
 *  populated/aggregated reads, the embedded customer object. */
export interface IInvoice {
  _id: string;
  invoiceId: string;
  customer: string | ICustomer;
  amount: number;
  taxRate: TaxRate;
  tax: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

/** Standard envelope for every paginated list endpoint. */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** A row in the "top customers by value" summary. */
export interface CustomerSummary {
  _id: string;
  name: string;
  company: string;
  /** Count of *billed* invoices only (those contributing to totalBilled). */
  billedInvoiceCount: number;
  totalBilled: number;
}

/** Per-customer metrics for the profile view. Money fields status-scoped; see README. */
export interface CustomerMetrics {
  invoiceCount: number;
  totalBilled: number;
  totalTax: number;
  totalPaid: number;
  totalOutstanding: number;
}

/** Count of invoices per status — data-driven (only statuses present appear). */
export type StatusCounts = Partial<Record<InvoiceStatus, number>>;

/** The full customer profile payload: company, metrics, status breakdown, history. */
export interface CustomerProfile {
  customer: ICustomer;
  metrics: CustomerMetrics;
  statusCounts: StatusCounts;
  invoices: IInvoice[];
}

/** Global dashboard rollup for the summary / analytics view (Screen 4). */
export interface GlobalSummary {
  totalBilled: number;
  totalTax: number;
  invoiceCount: number;
  customerCount: number;
  topCustomers: CustomerSummary[];
}

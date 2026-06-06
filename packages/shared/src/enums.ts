/**
 * Single source of truth for invoice enums.
 *
 * Why one place: these arrays drive THREE consumers — the Mongoose schema `enum`,
 * the Zod validation schemas, and the frontend filter dropdowns. Defining them once
 * means adding a status or tax rate is a one-line change (Open/Closed Principle):
 * no `if (status === 'Paid')` chains scattered across the codebase.
 */

/** Invoice payment statuses, per the assignment spec dataset. */
export const INVOICE_STATUSES = [
  "Sent",
  "Unpaid",
  "Overdue",
  "Paid",
  "Void",
  "Draft",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

// Accounting status groupings — rationale in README (Metrics are status-scoped).
export const BILLED_STATUSES = ["Sent", "Unpaid", "Overdue", "Paid"] as const;
export const OUTSTANDING_STATUSES = ["Sent", "Unpaid", "Overdue"] as const;

/** Allowed GST-style tax rates (percent). Validated at the DB and API layers. */
export const TAX_RATES = [0, 3, 5, 18, 28] as const;

export type TaxRate = (typeof TAX_RATES)[number];

/** Fields the invoice table can be sorted by, per spec (amount, dueDate). */
export const SORTABLE_FIELDS = ["amount", "dueDate"] as const;

export type SortableField = (typeof SORTABLE_FIELDS)[number];

export const SORT_ORDERS = ["asc", "desc"] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];

import { Types } from "mongoose";
import type { FilterQuery } from "mongoose";
import type { InvoiceQuery } from "@invoice/shared";
import type { InvoiceDoc } from "../models/Invoice.js";

/**
 * Translates validated query params into a MongoDB filter document.
 *
 * Isolated from the service so adding a new filter is a localised change here
 * (Open/Closed) — the service and controller never change shape. Date ranges use
 * inclusive bounds (`$gte` / `$lte`), matching the README assumption.
 *
 * `searchCustomerIds` are the Customer _ids whose name matched the search term —
 * resolved by the service (the invoice has only a ref, not the name), so the search
 * matches invoiceId OR customer name without an early `$lookup`.
 */
export function buildInvoiceFilter(
  q: InvoiceQuery,
  searchCustomerIds?: Types.ObjectId[],
): FilterQuery<InvoiceDoc> {
  const filter: FilterQuery<InvoiceDoc> = {};

  if (q.status) filter.status = q.status;
  // Aggregation `$match` does NOT auto-cast like a Mongoose query — the customer ref
  // must be a real ObjectId or it silently matches nothing.
  if (q.customer && Types.ObjectId.isValid(q.customer)) {
    filter.customer = new Types.ObjectId(q.customer);
  }
  if (q.taxRate !== undefined) filter.taxRate = q.taxRate;

  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), "i");
    filter.$or = [{ invoiceId: rx }, { customer: { $in: searchCustomerIds ?? [] } }];
  }

  // issueDate: single value OR range. `From`/`To` are inclusive; a single date is
  // expressed by passing the same value to both bounds from the client.
  const issueDate = buildDateRange(q.issueDateFrom, q.issueDateTo);
  if (issueDate) filter.issueDate = issueDate;

  const dueDate = buildDateRange(q.dueDateFrom, q.dueDateTo);
  if (dueDate) filter.dueDate = dueDate;

  return filter;
}

/** Escape user input so it's treated as a literal in a RegExp, not a pattern. */
export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Builds a `{ $gte, $lte }` range, or undefined when neither bound is set. */
function buildDateRange(
  from?: Date,
  to?: Date,
): { $gte?: Date; $lte?: Date } | undefined {
  if (!from && !to) return undefined;
  const range: { $gte?: Date; $lte?: Date } = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return range;
}

/** Maps validated sort params to a Mongoose sort object. */
export function buildInvoiceSort(q: InvoiceQuery): Record<string, 1 | -1> {
  return { [q.sortBy]: q.order === "asc" ? 1 : -1 };
}

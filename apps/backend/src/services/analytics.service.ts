import { BILLED_STATUSES, type GlobalSummary } from "@invoice/shared";
import { Invoice } from "../models/Invoice.js";
import { Customer } from "../models/Customer.js";
import { round2 } from "../utils/money.js";
import { customerService } from "./customer.service.js";

/** Global dashboard rollup for the summary view. Money fields status-scoped; see README. */
async function summary(): Promise<GlobalSummary> {
  const [totals, invoiceCount, customerCount, topCustomers] = await Promise.all([
    Invoice.aggregate<{ totalBilled: number; totalTax: number }>([
      { $match: { status: { $in: [...BILLED_STATUSES] } } },
      { $group: { _id: null, totalBilled: { $sum: "$total" }, totalTax: { $sum: "$tax" } } },
    ]),
    Invoice.estimatedDocumentCount(), // raw count of all invoices
    Customer.estimatedDocumentCount(),
    customerService.topByValue(5),
  ]);

  return {
    totalBilled: round2(totals[0]?.totalBilled ?? 0),
    totalTax: round2(totals[0]?.totalTax ?? 0),
    invoiceCount,
    customerCount,
    topCustomers,
  };
}

export const analyticsService = { summary };

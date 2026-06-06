import { Types } from "mongoose";
import {
  BILLED_STATUSES,
  OUTSTANDING_STATUSES,
  type ICustomer,
  type CustomerSummary,
  type CustomerProfile,
  type CustomerMetrics,
  type StatusCounts,
  type IInvoice,
} from "@invoice/shared";
import { Customer } from "../models/Customer.js";
import { Invoice } from "../models/Invoice.js";
import { AppError } from "../middleware/errorHandler.js";
import { round2 } from "../utils/money.js";

/** Customer data access — the only place Mongoose is touched for customers. */

const BILLED = new Set<string>(BILLED_STATUSES);
const OUTSTANDING = new Set<string>(OUTSTANDING_STATUSES);

/** All customers (id, name, company) for the invoice table's customer filter dropdown. */
async function list(): Promise<ICustomer[]> {
  return Customer.find({}, { name: 1, company: 1 })
    .sort({ name: 1 })
    .lean<ICustomer[]>();
}

/**
 * Top customers ranked by total billed value, for the summary view. Aggregated
 * server-side (can't rank by summed value by pulling all invoices into the app).
 */
async function topByValue(limit: number): Promise<CustomerSummary[]> {
  return Invoice.aggregate<CustomerSummary>([
    { $match: { status: { $in: [...BILLED_STATUSES] } } },
    {
      $group: {
        _id: "$customer",
        totalBilled: { $sum: "$total" },
        invoiceCount: { $sum: 1 },
      },
    },
    { $sort: { totalBilled: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },
    {
      $project: {
        _id: "$customer._id",
        name: "$customer.name",
        company: "$customer.company",
        totalBilled: { $round: ["$totalBilled", 2] },
        billedInvoiceCount: "$invoiceCount",
      },
    },
  ]);
}

/**
 * Full customer profile: company, metrics, per-status counts, and invoice history.
 *
 * History is small (~33/customer), so we fetch it once and derive metrics in a single
 * in-memory pass rather than a second aggregation. Status scoping: see README.
 */
async function profile(id: string): Promise<CustomerProfile> {
  assertObjectId(id);
  const customer = await Customer.findById(id).lean<ICustomer>();
  if (!customer) throw new AppError(404, "Customer not found");

  const invoices = await Invoice.find({ customer: id })
    .sort({ issueDate: -1 })
    .lean<IInvoice[]>();

  const metrics: CustomerMetrics = {
    invoiceCount: invoices.length, // raw count, all statuses
    totalBilled: 0,
    totalTax: 0,
    totalPaid: 0,
    totalOutstanding: 0,
  };
  const statusCounts: StatusCounts = {};

  for (const inv of invoices) {
    statusCounts[inv.status] = (statusCounts[inv.status] ?? 0) + 1;
    if (BILLED.has(inv.status)) {
      metrics.totalBilled += inv.total;
      metrics.totalTax += inv.tax;
    }
    if (inv.status === "Paid") metrics.totalPaid += inv.total;
    if (OUTSTANDING.has(inv.status)) metrics.totalOutstanding += inv.total;
  }

  metrics.totalBilled = round2(metrics.totalBilled);
  metrics.totalTax = round2(metrics.totalTax);
  metrics.totalPaid = round2(metrics.totalPaid);
  metrics.totalOutstanding = round2(metrics.totalOutstanding);

  return { customer, metrics, statusCounts, invoices };
}

function assertObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid customer id");
}

export const customerService = { list, topByValue, profile };

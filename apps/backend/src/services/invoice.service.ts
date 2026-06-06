import { Types } from "mongoose";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceQuery,
  IInvoice,
  PaginatedResult,
} from "@invoice/shared";
import { Invoice } from "../models/Invoice.js";
import { Customer } from "../models/Customer.js";
import { Counter } from "../models/Counter.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  buildInvoiceFilter,
  buildInvoiceSort,
  escapeRegex,
} from "../utils/buildInvoiceQuery.js";
import { round2 } from "../utils/money.js";

/** Invoice data access — the only place Mongoose is touched for invoices. */

/** Derive tax + total from amount + taxRate. Single source of the money math. */
function deriveTotals(amount: number, taxRate: number): { tax: number; total: number } {
  const tax = round2((amount * taxRate) / 100);
  return { tax, total: round2(amount + tax) };
}

/** Next invoice number from the atomic counter, formatted "INV-0000001". */
async function nextInvoiceId(): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    "invoiceId",
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return `INV-${String(counter.seq).padStart(7, "0")}`;
}

/**
 * Paginated, filtered, sorted invoice list for the table view.
 *
 * Uses an aggregation pipeline so the `$lookup` join runs AFTER `$skip`/`$limit` —
 * the join only ever touches the current page, not the whole filtered set. `$facet`
 * returns the page rows and the total count in a single round trip.
 */
async function getAll(query: InvoiceQuery): Promise<PaginatedResult<IInvoice>> {
  // Search matches invoiceId OR customer name. The invoice stores only a customer ref,
  // so we first resolve matching customer _ids (61 docs — trivial) and let the filter
  // builder OR them with the invoiceId regex. This keeps `$lookup` after pagination.
  let searchCustomerIds: Types.ObjectId[] | undefined;
  if (query.search) {
    searchCustomerIds = await Customer.find({
      name: new RegExp(escapeRegex(query.search), "i"),
    }).distinct("_id");
  }

  const filter = buildInvoiceFilter(query, searchCustomerIds);
  const sort = buildInvoiceSort(query);
  const skip = (query.page - 1) * query.limit;

  const [result] = await Invoice.aggregate([
    { $match: filter },
    {
      $facet: {
        data: [
          { $sort: sort },
          { $skip: skip },
          { $limit: query.limit },
          {
            $lookup: {
              from: "customers",
              localField: "customer",
              foreignField: "_id",
              as: "customer",
            },
          },
          { $unwind: "$customer" },
        ],
        meta: [{ $count: "total" }],
      },
    },
  ]);

  const total: number = result.meta[0]?.total ?? 0;
  return {
    data: result.data as IInvoice[],
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

/** Single invoice with its customer populated — `.populate()` is fine for one doc. */
async function getById(id: string): Promise<IInvoice> {
  assertObjectId(id);
  const invoice = await Invoice.findById(id).populate("customer").lean();
  if (!invoice) throw new AppError(404, "Invoice not found");
  return invoice as unknown as IInvoice;
}

/** Create an invoice. invoiceId + tax/total are server-owned — never from the client. */
async function create(input: CreateInvoiceInput): Promise<IInvoice> {
  const { tax, total } = deriveTotals(input.amount, input.taxRate);
  const invoiceId = await nextInvoiceId();
  const created = await Invoice.create({ ...input, invoiceId, tax, total });
  return created.toObject() as unknown as IInvoice;
}

/**
 * Edit an invoice. If amount or taxRate change, tax/total are recomputed so they
 * can never drift out of sync with the base figures.
 */
async function update(id: string, input: UpdateInvoiceInput): Promise<IInvoice> {
  assertObjectId(id);
  const existing = await Invoice.findById(id);
  if (!existing) throw new AppError(404, "Invoice not found");

  Object.assign(existing, input);
  if (input.amount !== undefined || input.taxRate !== undefined) {
    const { tax, total } = deriveTotals(existing.amount, existing.taxRate);
    existing.tax = tax;
    existing.total = total;
  }
  await existing.save();
  return existing.toObject() as unknown as IInvoice;
}

/** Guard against malformed ids reaching the DB as a cast error. */
function assertObjectId(id: string): void {
  if (!Types.ObjectId.isValid(id)) throw new AppError(400, "Invalid invoice id");
}

export const invoiceService = { getAll, getById, create, update };

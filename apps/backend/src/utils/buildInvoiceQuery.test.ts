import { describe, it, expect } from "vitest";
import { Types } from "mongoose";
import { invoiceQuerySchema } from "@invoice/shared";
import {
  buildInvoiceFilter,
  buildInvoiceSort,
  escapeRegex,
} from "./buildInvoiceQuery.js";

/** Helper: parse raw params into a validated InvoiceQuery (defaults applied). */
const q = (params: Record<string, string>) => invoiceQuerySchema.parse(params);

describe("buildInvoiceFilter", () => {
  it("is empty for no filters", () => {
    expect(buildInvoiceFilter(q({}))).toEqual({});
  });

  it("filters by status and taxRate", () => {
    const f = buildInvoiceFilter(q({ status: "Paid", taxRate: "18" }));
    expect(f.status).toBe("Paid");
    expect(f.taxRate).toBe(18);
  });

  it("casts the customer id to an ObjectId (aggregation does not auto-cast)", () => {
    const id = "6a23c355467730f7fd06aff4";
    const f = buildInvoiceFilter(q({ customer: id }));
    expect(f.customer).toBeInstanceOf(Types.ObjectId);
    expect((f.customer as Types.ObjectId).equals(id)).toBe(true);
  });

  it("builds an $or over invoiceId regex + matched customer ids for search", () => {
    const ids = [new Types.ObjectId(), new Types.ObjectId()];
    const f = buildInvoiceFilter(q({ search: "acme" }), ids);
    expect(f.$or).toHaveLength(2);
    expect(f.$or?.[0].invoiceId).toBeInstanceOf(RegExp);
    expect(f.$or?.[1].customer).toEqual({ $in: ids });
  });

  it("builds inclusive date ranges", () => {
    const f = buildInvoiceFilter(
      q({ issueDateFrom: "2026-01-01", issueDateTo: "2026-01-31" }),
    );
    expect(f.issueDate).toHaveProperty("$gte");
    expect(f.issueDate).toHaveProperty("$lte");
  });
});

describe("buildInvoiceSort", () => {
  it("defaults to dueDate desc", () => {
    expect(buildInvoiceSort(q({}))).toEqual({ dueDate: -1 });
  });
  it("sorts amount ascending when asked", () => {
    expect(buildInvoiceSort(q({ sortBy: "amount", order: "asc" }))).toEqual({
      amount: 1,
    });
  });
});

describe("escapeRegex", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegex("a.b*c")).toBe("a\\.b\\*c");
  });
});

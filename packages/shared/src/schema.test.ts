import { describe, it, expect } from "vitest";
import { createInvoiceSchema, invoiceQuerySchema } from "./index.js";

describe("createInvoiceSchema", () => {
  const valid = {
    customer: "6a23c355467730f7fd06aff4",
    amount: 1000,
    taxRate: 18,
    status: "Draft",
    issueDate: "2026-01-01",
    dueDate: "2026-02-01",
  };

  it("accepts a valid invoice and coerces dates to Date", () => {
    const parsed = createInvoiceSchema.parse(valid);
    expect(parsed.issueDate).toBeInstanceOf(Date);
    expect(parsed.amount).toBe(1000);
  });

  it("does NOT require invoiceId (server-generated)", () => {
    expect(() => createInvoiceSchema.parse(valid)).not.toThrow();
    // even if a client sends one, it's ignored (not in the schema output)
    const parsed = createInvoiceSchema.parse({ ...valid, invoiceId: "INV-x" });
    expect("invoiceId" in parsed).toBe(false);
  });

  it("rejects a tax rate outside the allowed enum", () => {
    expect(() => createInvoiceSchema.parse({ ...valid, taxRate: 12 })).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() => createInvoiceSchema.parse({ ...valid, status: "Nope" })).toThrow();
  });
});

describe("invoiceQuerySchema", () => {
  it("applies defaults when empty", () => {
    const q = invoiceQuerySchema.parse({});
    expect(q).toMatchObject({ page: 1, limit: 20, sortBy: "dueDate", order: "desc" });
  });

  it("coerces numeric query strings", () => {
    const q = invoiceQuerySchema.parse({ page: "3", limit: "50", taxRate: "18" });
    expect(q.page).toBe(3);
    expect(q.limit).toBe(50);
    expect(q.taxRate).toBe(18);
  });

  it("rejects an invalid sort field and an out-of-range limit", () => {
    expect(() => invoiceQuerySchema.parse({ sortBy: "total" })).toThrow();
    expect(() => invoiceQuerySchema.parse({ limit: "5000" })).toThrow();
  });
});

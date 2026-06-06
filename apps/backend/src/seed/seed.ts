import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Types } from "mongoose";
import type { InvoiceStatus } from "@invoice/shared";
import { connectDb, disconnectDb } from "../config/db.js";
import { Customer } from "../models/Customer.js";
import { Invoice } from "../models/Invoice.js";

/**
 * Seed script: normalises the flat seed-data.json into the two-collection model.
 *   1. Derive unique customers from distinct (customer, company) pairs and upsert them.
 *   2. Build a name|company -> _id lookup from the persisted customers.
 *   3. Map each invoice's customer string -> Customer ObjectId ref, parse dates.
 *   4. Upsert invoices keyed on invoiceId.
 * Idempotent: all writes are upserts, so re-running yields the same state (no dupes).
 */

/** Shape of one record in seed-data.json (pre-normalisation). */
interface SeedRecord {
  invoiceId: string;
  customer: string;
  company: string;
  amount: number;
  taxRate: number;
  tax: number;
  total: number;
  status: string;
  issueDate: string;
  dueDate: string;
}

/** Composite key for a customer — name + company uniquely identify one. */
const customerKey = (name: string, company: string): string => `${name}|||${company}`;

const __dirname = dirname(fileURLToPath(import.meta.url));
// apps/backend/src/seed -> repo root
const SEED_FILE = resolve(__dirname, "../../../../seed-data.json");

async function seed(): Promise<void> {
  await connectDb();

  const raw = await readFile(SEED_FILE, "utf-8");
  const records: SeedRecord[] = JSON.parse(raw);
  console.log(`[seed] read ${records.length} records from ${SEED_FILE}`);

  // --- 1. Derive + upsert unique customers ----------------------------------
  const uniqueCustomers = new Map<string, { name: string; company: string }>();
  for (const r of records) {
    uniqueCustomers.set(customerKey(r.customer, r.company), {
      name: r.customer,
      company: r.company,
    });
  }

  const customerOps = [...uniqueCustomers.values()].map((c) => ({
    updateOne: {
      filter: { name: c.name, company: c.company },
      update: { $setOnInsert: c },
      upsert: true,
    },
  }));
  // ordered: false — the 61 upserts are independent (distinct name+company, unique
  // index), so Mongo can run them in parallel and one bad row won't block the rest.
  await Customer.bulkWrite(customerOps, { ordered: false });
  console.log(`[seed] upserted ${uniqueCustomers.size} unique customers`);

  // --- 2. Build name|company -> _id lookup ----------------------------------
  const persisted = await Customer.find({}, { name: 1, company: 1 }).lean();
  const idByKey = new Map<string, string>();
  for (const c of persisted) {
    idByKey.set(customerKey(c.name, c.company), c._id.toString());
  }

  // --- 3 + 4. Map refs, parse dates, upsert invoices ------------------------
  const invoiceOps = records.map((r) => {
    const customerId = idByKey.get(customerKey(r.customer, r.company));
    if (!customerId) {
      throw new Error(`No customer _id for ${r.invoiceId} (${r.customer} / ${r.company})`);
    }
    return {
      updateOne: {
        filter: { invoiceId: r.invoiceId },
        update: {
          $set: {
            customer: new Types.ObjectId(customerId),
            amount: r.amount,
            taxRate: r.taxRate,
            tax: r.tax, // stored as issued — see modeling rationale
            total: r.total,
            status: r.status as InvoiceStatus,
            issueDate: new Date(r.issueDate),
            dueDate: new Date(r.dueDate),
          },
          $setOnInsert: { invoiceId: r.invoiceId },
        },
        upsert: true,
      },
    };
  });
  // ordered: false — invoices are keyed on distinct invoiceIds with no inter-op
  // dependency; parallel execution is faster and resilient to a single bad record.
  // Safe because the customer→invoice ordering is enforced by the await above, not
  // by bulk ordering (which only sequences ops *within* a single batch).
  const result = await Invoice.bulkWrite(invoiceOps, { ordered: false });
  console.log(
    `[seed] invoices — inserted ${result.upsertedCount}, updated ${result.modifiedCount}, total ${records.length}`,
  );

  await disconnectDb();
  console.log("[seed] done");
}

seed().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});

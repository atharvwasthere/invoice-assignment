import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
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

/**
 * Performs the actual seeding. Assumes a live Mongo connection — connection
 * lifecycle is the caller's job, so this can run either standalone (the CLI
 * wrapper below) or in-process at server startup (seedIfEmpty).
 */
export async function runSeed(): Promise<void> {
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

}

/**
 * Seeds only when the invoices collection is empty. Called on server startup so a
 * fresh `docker compose up` lands a populated dashboard with no manual step. The
 * count guard makes it a no-op on every subsequent boot (and the seed itself is
 * idempotent, so even a race would be harmless).
 */
export async function seedIfEmpty(): Promise<void> {
  const count = await Invoice.estimatedDocumentCount();
  if (count > 0) {
    console.log(`[seed] skipped — ${count} invoices already present`);
    return;
  }
  console.log("[seed] empty database detected — seeding initial data");
  await runSeed();
}

// Standalone CLI: `tsx src/seed/seed.ts` (manages its own connection lifecycle).
// Guarded so importing this module for seedIfEmpty does NOT trigger a run.
const isDirectRun = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isDirectRun) {
  connectDb()
    .then(runSeed)
    .then(disconnectDb)
    .then(() => console.log("[seed] done"))
    .catch((err) => {
      console.error("[seed] failed", err);
      process.exit(1);
    });
}

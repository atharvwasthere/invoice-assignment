import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { seedIfEmpty } from "./seed/seed.js";

/**
 * Process entry point: connect to Mongo, seed if the DB is empty, then listen.
 * Connecting before listen means the server never accepts traffic it can't serve;
 * the empty-DB seed makes a fresh `docker compose up` usable with no manual step.
 */
async function main(): Promise<void> {
  await connectDb();
  await seedIfEmpty();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[fatal] failed to start server", err);
  process.exit(1);
});

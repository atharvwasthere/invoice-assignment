import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

/**
 * Process entry point: connect to Mongo first, then start listening.
 * Connecting before listen means the server never accepts traffic it can't serve.
 */
async function main(): Promise<void> {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[fatal] failed to start server", err);
  process.exit(1);
});

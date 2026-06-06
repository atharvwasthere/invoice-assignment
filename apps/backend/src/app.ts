import express, { type Express } from "express";
import cors from "cors";
// Side-effect import: registers all Mongoose models at startup so populate() is
// order-independent across features and tests. See models/index.ts.
import "./models/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { invoiceRoutes } from "./routes/invoice.routes.js";
import { customerRoutes } from "./routes/customer.routes.js";
import { summaryRoutes } from "./routes/summary.routes.js";

/**
 * Kept separate from server.ts (which owns DB connection + listen) so the app can be
 * imported into integration tests without binding a port.
 */
export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/invoices", invoiceRoutes);
  app.use("/customers", customerRoutes);
  app.use("/summary", summaryRoutes);

  // Must be last — catches everything thrown above.
  app.use(errorHandler);

  return app;
}

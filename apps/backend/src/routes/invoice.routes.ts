import { Router } from "express";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
} from "@invoice/shared";
import { invoiceController } from "../controllers/invoice.controller.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/errorHandler.js";

/**
 * Invoice routes — pure wiring: path -> validation -> controller.
 * Validation runs as middleware so controllers only ever see good input.
 */
const router = Router();

router.get("/",
  validate({ query: invoiceQuerySchema }),
  asyncHandler(invoiceController.list),
);

router.get("/:id", asyncHandler(invoiceController.getOne));

router.post("/",
  validate({ body: createInvoiceSchema }),
  asyncHandler(invoiceController.create),
);

// PATCH, not PUT: the body is a partial change-set merged onto the existing invoice
// (absolute values, omitted fields left untouched). PUT would imply replacing the whole
// resource, which is wrong for an invoice whose invoiceId, tax/total, and timestamps are
// server-owned and not client-replaceable.
router.patch("/:id",
  validate({ body: updateInvoiceSchema }),
  asyncHandler(invoiceController.update),
);

export { router as invoiceRoutes };

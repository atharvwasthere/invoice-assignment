import type { Request, Response } from "express";
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceQuery,
} from "@invoice/shared";
import { invoiceService } from "../services/invoice.service.js";
import { parsedBody, parsedQuery } from "../middleware/validate.js";

/**
 * HTTP layer for invoices: read validated input, call the service, shape the response.
 * No DB access and no query-building here — those live in the service and util layers.
 */
export const invoiceController = {
  async list(_req: Request, res: Response): Promise<void> {
    const query = parsedQuery<InvoiceQuery>(res);
    res.json(await invoiceService.getAll(query));
  },

  async getOne(req: Request, res: Response): Promise<void> {
    res.json(await invoiceService.getById(req.params.id));
  },

  async create(_req: Request, res: Response): Promise<void> {
    const input = parsedBody<CreateInvoiceInput>(res);
    res.status(201).json(await invoiceService.create(input));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = parsedBody<UpdateInvoiceInput>(res);
    res.json(await invoiceService.update(req.params.id, input));
  },
};

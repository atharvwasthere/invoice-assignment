import type { Request, Response } from "express";
import { customerService } from "../services/customer.service.js";

/** HTTP layer for customers: call the service, return JSON. */
export const customerController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await customerService.list());
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    res.json(await customerService.profile(req.params.id));
  },
};

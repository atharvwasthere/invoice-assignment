import type { Request, Response } from "express";
import { analyticsService } from "../services/analytics.service.js";

/** HTTP layer for the global summary / analytics view. */
export const summaryController = {
  async get(_req: Request, res: Response): Promise<void> {
    res.json(await analyticsService.summary());
  },
};

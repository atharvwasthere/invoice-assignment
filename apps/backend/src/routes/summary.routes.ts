import { Router } from "express";
import { summaryController } from "../controllers/summary.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(summaryController.get));

export { router as summaryRoutes };

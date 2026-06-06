import { Router } from "express";
import { customerController } from "../controllers/customer.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(customerController.list));
router.get("/:id", asyncHandler(customerController.getProfile));

export { router as customerRoutes };

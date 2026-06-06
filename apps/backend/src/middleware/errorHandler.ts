import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/**
 * App-level error class for predictable, status-coded failures thrown by services.
 * Anything else that bubbles up is treated as a 500.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/** Wraps an async route handler so thrown/rejected errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Central error handler — the single place HTTP error responses are shaped.
 * Keeping this out of controllers means handlers stay focused on the happy path.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "ValidationError", details: err.flatten() });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  // Mongoose duplicate-key (e.g. re-using an invoiceId)
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ error: "Duplicate key", details: (err as { keyValue?: unknown }).keyValue });
    return;
  }
  console.error("[error]", err);
  res.status(500).json({ error: "Internal Server Error" });
}

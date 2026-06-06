import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, infer as ZodInfer } from "zod";

/**
 * Zod validation middleware factory.
 *
 * Parses + coerces `body` and/or `query` against the given schemas and stashes the
 * typed result on `res.locals`. Controllers read the validated, correctly-typed values
 * from there — they never touch raw `req.query`/`req.body`, so a bad request is rejected
 * with a 400 before any handler logic runs. ZodErrors are shaped by the error handler.
 */
export function validate<B extends ZodTypeAny, Q extends ZodTypeAny>(schemas: {
  body?: B;
  query?: Q;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) res.locals.body = schemas.body.parse(req.body);
      if (schemas.query) res.locals.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Typed accessor for the parsed body stashed by `validate`. */
export const parsedBody = <T>(res: Response): T => res.locals.body as T;

/** Typed accessor for the parsed query stashed by `validate`. */
export const parsedQuery = <T>(res: Response): T => res.locals.query as T;

// Re-export to keep call sites honest about the inferred types.
export type Infer<S extends ZodTypeAny> = ZodInfer<S>;

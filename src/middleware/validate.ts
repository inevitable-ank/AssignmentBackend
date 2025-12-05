import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export const validateBody =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return next(parseResult.error);
    }
    req.body = parseResult.data;
    next();
  };





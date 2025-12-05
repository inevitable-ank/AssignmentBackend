import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// Unified error response shape so frontend can always read `message`
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.flatten(),
    });
  }

  const status =
    (err as any)?.statusCode ||
    (err as any)?.status ||
    (typeof (err as any)?.code === "number" ? (err as any).code : 500);

  const message =
    (err as any)?.message ||
    (status === 500 ? "Internal server error" : "Request failed");

  res.status(status).json({ message });
};





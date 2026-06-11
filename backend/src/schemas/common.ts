import type { NextFunction, Request, Response } from "express";
import { z, type ZodSchema } from "zod";

export const uuidSchema = z.string().uuid();
export const roleSchema = z.enum(["patient", "clinic", "insurer"]);
export const nonEmptyString = z.string().trim().min(1);

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      next(new ApiError(400, "VALIDATION_ERROR", "Request body is invalid", result.error.flatten()));
      return;
    }

    request.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      next(new ApiError(400, "VALIDATION_ERROR", "Query parameters are invalid", result.error.flatten()));
      return;
    }

    request.query = result.data as Request["query"];
    next();
  };
}

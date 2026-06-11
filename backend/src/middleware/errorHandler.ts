import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../schemas/common.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Request data is invalid",
      details: error.flatten(),
    });
    return;
  }

  response.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Unexpected server error",
  });
};

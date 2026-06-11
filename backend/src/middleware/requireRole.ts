import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/domain.js";
import { ApiError } from "../schemas/common.js";

export function requireRole(...allowedRoles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.auth) {
      next(new ApiError(401, "AUTH_REQUIRED", "Authentication is required"));
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      next(new ApiError(403, "ROLE_FORBIDDEN", "Your role cannot access this resource"));
      return;
    }

    next();
  };
}

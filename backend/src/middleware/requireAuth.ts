import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/domain.js";
import { ApiError } from "../schemas/common.js";
import { createUserScopedSupabase, supabaseAdmin, supabaseAnon } from "../services/supabase/client.js";

export interface AuthContext {
  accessToken: string;
  userId: string;
  role: Role;
  supabase: ReturnType<typeof createUserScopedSupabase>;
}

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

function readBearerToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const accessToken = readBearerToken(request);
    if (!accessToken) {
      throw new ApiError(401, "AUTH_REQUIRED", "A Supabase access token is required");
    }

    const { data, error } = await supabaseAnon.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new ApiError(401, "AUTH_INVALID", "The supplied access token is invalid");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      throw new ApiError(403, "PROFILE_REQUIRED", "Complete email OTP onboarding before accessing this resource");
    }

    const role = profile.role;
    if (role !== "patient" && role !== "clinic" && role !== "insurer") {
      throw new ApiError(403, "ROLE_REQUIRED", "User profile must include a valid MedGuard role");
    }

    request.auth = {
      accessToken,
      userId: data.user.id,
      role,
      supabase: createUserScopedSupabase(accessToken),
    };

    next();
  } catch (error) {
    next(error);
  }
}

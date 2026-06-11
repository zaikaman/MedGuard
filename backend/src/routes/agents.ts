import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { ApiError, roleSchema, validateBody } from "../schemas/common.js";
import { getAgentForProfile, registerRoleAgent } from "../services/terminal3/agentRegistrationService.js";

export const agentsRouter = Router();

agentsRouter.use(requireAuth);

agentsRouter.get("/me", async (request, response, next) => {
  try {
    const auth = request.auth!;
    const agent = await getAgentForProfile(auth.userId, auth.role);
    if (!agent) {
      throw new ApiError(404, "AGENT_NOT_FOUND", "No Terminal 3 agent is registered for this profile");
    }

    response.json(agent);
  } catch (error) {
    next(error);
  }
});

agentsRouter.post("/register", validateBody(z.object({ role: roleSchema })), async (request, response, next) => {
  try {
    const auth = request.auth!;
    if (request.body.role !== auth.role) {
      throw new ApiError(403, "ROLE_MISMATCH", "Agent role must match the authenticated profile role");
    }

    const agent = await registerRoleAgent({ profileId: auth.userId, role: auth.role });
    response.status(201).json(agent);
  } catch (error) {
    next(error);
  }
});

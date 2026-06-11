import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateBody } from "../schemas/common.js";
import { roleSchema } from "../schemas/common.js";

export const agentsRouter = Router();

agentsRouter.use(requireAuth);

agentsRouter.get("/me", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Agent lookup is implemented in User Story 1" });
});

agentsRouter.post("/register", validateBody(z.object({ role: roleSchema })), (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Agent registration is implemented in User Story 1" });
});

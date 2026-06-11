import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const presentationsRouter = Router();

presentationsRouter.use(requireAuth, requireRole("clinic", "insurer"));

presentationsRouter.post("/generate", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Presentation generation is implemented in story phases" });
});

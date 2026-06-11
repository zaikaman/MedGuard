import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const referralsRouter = Router();

referralsRouter.use(requireAuth, requireRole("clinic"));

referralsRouter.post("/", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Referrals are implemented in User Story 1" });
});

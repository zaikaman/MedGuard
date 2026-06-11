import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

export const auditRouter = Router();

auditRouter.use(requireAuth);

auditRouter.get("/audit-events", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Audit event queries are implemented in User Story 3" });
});

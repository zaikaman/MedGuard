import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth, requireRole("patient"));

credentialsRouter.get("/", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Credential listing is implemented in User Story 1" });
});

credentialsRouter.post("/issue", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Credential metadata import is implemented in User Story 1" });
});

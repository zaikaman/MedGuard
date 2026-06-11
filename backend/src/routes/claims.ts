import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";

export const claimsRouter = Router();

claimsRouter.use(requireAuth);

claimsRouter.post("/verify", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Claim verification is implemented in story phases" });
});

claimsRouter.post("/:claimId/decision", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Claim decisions are implemented in User Story 2" });
});

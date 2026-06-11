import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ApiError, uuidSchema, validateBody } from "../schemas/common.js";
import { verifyClinicClaim } from "../services/terminal3/claimVerificationService.js";

export const claimsRouter = Router();

claimsRouter.use(requireAuth);

claimsRouter.post("/verify", requireRole("clinic", "insurer"), validateBody(z.object({ presentationProofId: uuidSchema })), async (request, response, next) => {
  try {
    const auth = request.auth!;
    if (auth.role !== "clinic") {
      throw new ApiError(403, "ROLE_FORBIDDEN", "Insurer claim verification is implemented in User Story 2");
    }

    const verification = await verifyClinicClaim({
      verifierProfileId: auth.userId,
      verifierRole: "clinic",
      presentationProofId: request.body.presentationProofId,
    });

    response.json(verification);
  } catch (error) {
    next(error);
  }
});

claimsRouter.post("/:claimId/decision", (_request, response) => {
  response.status(501).json({ code: "NOT_IMPLEMENTED", message: "Claim decisions are implemented in User Story 2" });
});

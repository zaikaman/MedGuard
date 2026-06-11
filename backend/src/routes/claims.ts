import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ApiError, uuidSchema, validateBody } from "../schemas/common.js";
import { decideInsurerClaim } from "../services/supabase/insurerClaimRepository.js";
import { verifyClinicClaim, verifyInsurerClaim } from "../services/terminal3/claimVerificationService.js";

export const claimsRouter = Router();

claimsRouter.use(requireAuth);

const verifyClaimSchema = z.object({ presentationProofId: uuidSchema });
const claimDecisionSchema = z.object({
  status: z.enum(["approved", "denied", "needs_review"]),
  decisionReason: z.string().trim().min(1).optional(),
});

claimsRouter.post("/verify", requireRole("clinic", "insurer"), validateBody(verifyClaimSchema), async (request, response, next) => {
  try {
    const auth = request.auth!;
    if (auth.role === "clinic") {
      const verification = await verifyClinicClaim({
        verifierProfileId: auth.userId,
        verifierRole: "clinic",
        presentationProofId: request.body.presentationProofId,
      });

      response.json(verification);
      return;
    }

    if (auth.role === "insurer") {
      const verification = await verifyInsurerClaim({
        verifierProfileId: auth.userId,
        verifierRole: "insurer",
        presentationProofId: request.body.presentationProofId,
      });

      response.json(verification);
      return;
    }

    throw new ApiError(403, "ROLE_FORBIDDEN", "Your role cannot verify claims");
  } catch (error) {
    next(error);
  }
});

claimsRouter.post("/:claimId/decision", requireRole("insurer"), validateBody(claimDecisionSchema), async (request, response, next) => {
  try {
    const claimId = uuidSchema.safeParse(request.params.claimId);
    if (!claimId.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Claim id is invalid", claimId.error.flatten());
    }

    const claim = await decideInsurerClaim({
      claimId: claimId.data,
      insurerProfileId: request.auth!.userId,
      status: request.body.status,
      decisionReason: request.body.decisionReason,
    });

    response.json(claim);
  } catch (error) {
    next(error);
  }
});

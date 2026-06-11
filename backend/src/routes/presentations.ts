import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { nonEmptyString, uuidSchema, validateBody } from "../schemas/common.js";
import { generateClinicPresentation, generateInsurerPresentation } from "../services/terminal3/presentationService.js";

export const presentationsRouter = Router();

presentationsRouter.use(requireAuth, requireRole("clinic", "insurer"));

const generatePresentationSchema = z.object({
  patientProfileId: uuidSchema,
  delegationId: uuidSchema,
  requestedClaimType: nonEmptyString,
  purpose: nonEmptyString,
});

presentationsRouter.post("/generate", validateBody(generatePresentationSchema), async (request, response, next) => {
  try {
    const auth = request.auth!;
    if (auth.role === "insurer") {
      const presentation = await generateInsurerPresentation({
        requesterProfileId: auth.userId,
        requesterRole: "insurer",
        patientProfileId: request.body.patientProfileId,
        delegationId: request.body.delegationId,
        requestedClaimType: request.body.requestedClaimType,
        purpose: request.body.purpose,
      });

      response.status(201).json(presentation);
      return;
    }

    const presentation = await generateClinicPresentation({
      requesterProfileId: auth.userId,
      requesterRole: "clinic",
      patientProfileId: request.body.patientProfileId,
      delegationId: request.body.delegationId,
      requestedClaimType: request.body.requestedClaimType,
      purpose: request.body.purpose,
    });

    response.status(201).json(presentation);
  } catch (error) {
    next(error);
  }
});

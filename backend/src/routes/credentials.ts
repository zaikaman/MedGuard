import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateBody } from "../schemas/common.js";
import { issueCredentialSchema } from "../schemas/credentials.js";
import { issueCredentialMetadata, listCredentialHashes } from "../services/supabase/credentialRepository.js";

export const credentialsRouter = Router();

credentialsRouter.use(requireAuth, requireRole("patient"));

credentialsRouter.get("/", async (request, response, next) => {
  try {
    const credentials = await listCredentialHashes(request.auth!.userId);
    response.json(credentials);
  } catch (error) {
    next(error);
  }
});

credentialsRouter.post("/issue", validateBody(issueCredentialSchema), async (request, response, next) => {
  try {
    const credential = await issueCredentialMetadata(request.auth!.userId, request.body);
    response.status(201).json(credential);
  } catch (error) {
    next(error);
  }
});

import { z } from "zod";
import { nonEmptyString } from "./common.js";

export const issueCredentialSchema = z.object({
  credentialType: nonEmptyString,
  issuerDid: z.string().trim().startsWith("did:"),
  credentialHash: z.string().trim().min(32),
  t3Reference: nonEmptyString,
  expiresAt: z.string().datetime().optional(),
});

export type IssueCredentialInput = z.infer<typeof issueCredentialSchema>;

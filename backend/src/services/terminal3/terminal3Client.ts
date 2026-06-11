import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import type { Role } from "../../types/domain.js";

export interface RegisterAgentInput {
  profileId: string;
  role: Role;
}

export interface GeneratePresentationInput {
  patientDid: string;
  recipientDid: string;
  credentialReference: string;
  requestedClaimType: string;
  purpose: string;
}

export interface VerifyPresentationInput {
  presentationReference: string;
  expectedRecipientDid: string;
}

export interface Terminal3Client {
  registerAgent(input: RegisterAgentInput): Promise<{ did: string; tenantId: string }>;
  generatePresentation(input: GeneratePresentationInput): Promise<{ presentationHash: string; t3Reference: string }>;
  verifyPresentation(input: VerifyPresentationInput): Promise<{ accepted: boolean; reason?: string }>;
}

export class Terminal3BoundaryClient implements Terminal3Client {
  async registerAgent(input: RegisterAgentInput): Promise<{ did: string; tenantId: string }> {
    const suffix = hashStable(`${input.profileId}:${input.role}`).slice(0, 24);
    return {
      did: `did:t3n:${env.T3N_ENVIRONMENT}:${input.role}:${suffix}`,
      tenantId: `tenant_${suffix}`,
    };
  }

  async generatePresentation(input: GeneratePresentationInput): Promise<{ presentationHash: string; t3Reference: string }> {
    const hash = hashStable([
      input.patientDid,
      input.recipientDid,
      input.credentialReference,
      input.requestedClaimType,
      input.purpose,
    ].join(":"));

    return {
      presentationHash: `sha256:${hash}`,
      t3Reference: `t3n://${env.T3N_ENVIRONMENT}/presentation/${hash.slice(0, 32)}`,
    };
  }

  async verifyPresentation(input: VerifyPresentationInput): Promise<{ accepted: boolean; reason?: string }> {
    if (!input.presentationReference || !input.expectedRecipientDid.startsWith("did:t3n:")) {
      return { accepted: false, reason: "Invalid presentation reference or recipient DID" };
    }

    return { accepted: true };
  }
}

function hashStable(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export const terminal3Client = new Terminal3BoundaryClient();

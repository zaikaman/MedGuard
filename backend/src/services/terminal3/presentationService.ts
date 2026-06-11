import { ApiError } from "../../schemas/common.js";
import type { PresentationProof } from "../../types/domain.js";
import { recordProofApproved, recordProofDenied, recordProofRequested } from "../audit/proofAuditEvents.js";
import { evaluateDisclosurePolicy } from "../policies/policyEvaluator.js";
import { findEligibleCredential } from "../supabase/credentialRepository.js";
import {
  createPresentationProof,
  createProofRequest,
  getDelegationById,
  updateProofRequestDecision,
} from "../supabase/proofRepository.js";
import { getAgentById, getAgentForProfile } from "./agentRegistrationService.js";
import { terminal3Client, type Terminal3Client } from "./terminal3Client.js";

export interface GenerateClinicPresentationInput {
  requesterProfileId: string;
  requesterRole: "clinic";
  patientProfileId: string;
  delegationId: string;
  requestedClaimType: string;
  purpose: string;
}

export async function generateClinicPresentation(
  input: GenerateClinicPresentationInput,
  client: Terminal3Client = terminal3Client,
): Promise<PresentationProof> {
  const requesterAgent = await getAgentForProfile(input.requesterProfileId, input.requesterRole);
  if (!requesterAgent) {
    throw new ApiError(409, "REQUESTER_AGENT_REQUIRED", "Register the clinic agent before requesting a proof");
  }

  const proofRequest = await createProofRequest({
    requesterProfileId: input.requesterProfileId,
    requesterAgentId: requesterAgent.id,
    patientProfileId: input.patientProfileId,
    delegationId: input.delegationId,
    requestedClaimType: input.requestedClaimType,
    purpose: input.purpose,
  });

  await recordProofRequested({
    actorProfileId: input.requesterProfileId,
    patientProfileId: input.patientProfileId,
    targetProfileId: input.requesterProfileId,
    proofRequestId: proofRequest.id,
    requestedClaimType: input.requestedClaimType,
    purpose: input.purpose,
  });

  const delegation = await getDelegationById(input.delegationId);
  const credential = await findEligibleCredential(input.patientProfileId, input.requestedClaimType);
  const decision = evaluateDisclosurePolicy(
    {
      requesterRole: input.requesterRole,
      requesterProfileId: input.requesterProfileId,
      requesterAgentId: requesterAgent.id,
      patientProfileId: input.patientProfileId,
      requestedClaimType: input.requestedClaimType,
      purpose: input.purpose,
    },
    delegation,
    credential,
  );

  if (!decision.allowed || !delegation || !credential) {
    await updateProofRequestDecision(proofRequest.id, "denied", decision.reason);
    await recordProofDenied({
      actorProfileId: input.requesterProfileId,
      patientProfileId: input.patientProfileId,
      targetProfileId: input.requesterProfileId,
      proofRequestId: proofRequest.id,
      requestedClaimType: input.requestedClaimType,
      purpose: input.purpose,
      reason: decision.reason,
    });
    throw new ApiError(403, "POLICY_DENIED", decision.reason, { proofRequestId: proofRequest.id });
  }

  const patientAgent = await getAgentById(credential.patientAgentId);
  if (!patientAgent) {
    throw new ApiError(409, "PATIENT_AGENT_REQUIRED", "Patient credential metadata references a missing agent");
  }

  const generated = await client.generatePresentation({
    patientDid: patientAgent.t3Did,
    recipientDid: requesterAgent.t3Did,
    credentialReference: credential.t3Reference,
    requestedClaimType: input.requestedClaimType,
    purpose: input.purpose,
  });

  await updateProofRequestDecision(proofRequest.id, "approved", decision.reason);
  const presentation = await createPresentationProof({
    proofRequestId: proofRequest.id,
    patientProfileId: input.patientProfileId,
    recipientProfileId: input.requesterProfileId,
    presentationHash: generated.presentationHash,
    t3Reference: generated.t3Reference,
    proofType: input.requestedClaimType,
    expiresAt: computePresentationExpiry(delegation.expiresAt, credential.expiresAt),
  });

  await recordProofApproved({
    actorProfileId: input.requesterProfileId,
    patientProfileId: input.patientProfileId,
    targetProfileId: input.requesterProfileId,
    proofRequestId: proofRequest.id,
    presentationProofId: presentation.id,
    requestedClaimType: input.requestedClaimType,
    purpose: input.purpose,
  });

  return presentation;
}

function computePresentationExpiry(delegationExpiresAt: string, credentialExpiresAt: string | null): string {
  const maxLifetime = new Date(Date.now() + 15 * 60 * 1000);
  const candidates = [new Date(delegationExpiresAt), maxLifetime];

  if (credentialExpiresAt) {
    candidates.push(new Date(credentialExpiresAt));
  }

  return new Date(Math.min(...candidates.map((candidate) => candidate.getTime()))).toISOString();
}

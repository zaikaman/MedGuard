import { ApiError } from "../../schemas/common.js";
import type { VerificationResult } from "../../types/domain.js";
import { recordProofVerified } from "../audit/proofAuditEvents.js";
import {
  createClaimVerification,
  getPresentationProofForRecipient,
  updatePresentationStatus,
} from "../supabase/proofRepository.js";
import { getAgentForProfile } from "./agentRegistrationService.js";
import { terminal3Client, type Terminal3Client } from "./terminal3Client.js";

export interface VerifyClinicClaimInput {
  verifierProfileId: string;
  verifierRole: "clinic";
  presentationProofId: string;
}

export async function verifyClinicClaim(input: VerifyClinicClaimInput, client: Terminal3Client = terminal3Client) {
  const verifierAgent = await getAgentForProfile(input.verifierProfileId, input.verifierRole);
  if (!verifierAgent) {
    throw new ApiError(409, "VERIFIER_AGENT_REQUIRED", "Register the clinic agent before verifying a proof");
  }

  const proof = await getPresentationProofForRecipient(input.presentationProofId, input.verifierProfileId);
  if (!proof) {
    throw new ApiError(404, "PRESENTATION_NOT_FOUND", "Presentation proof was not found for this verifier");
  }

  const now = new Date();
  let result: VerificationResult;
  let reason: string | undefined;

  if (new Date(proof.expiresAt) <= now) {
    result = "expired";
    reason = "Presentation proof is expired";
    await updatePresentationStatus(proof.id, "rejected");
  } else if (proof.verificationStatus === "revoked") {
    result = "revoked";
    reason = "Presentation proof has been revoked";
  } else if (proof.verificationStatus === "rejected") {
    result = "denied";
    reason = "Presentation proof was previously rejected";
  } else {
    const verification = await client.verifyPresentation({
      presentationReference: proof.t3Reference,
      expectedRecipientDid: verifierAgent.t3Did,
    });
    result = verification.accepted ? "accepted" : "unverifiable";
    reason = verification.reason;
    await updatePresentationStatus(proof.id, verification.accepted ? "verified" : "rejected");
  }

  const verificationRecord = await createClaimVerification({
    presentationProofId: proof.id,
    verifierProfileId: input.verifierProfileId,
    verifierAgentId: verifierAgent.id,
    result,
    reason,
  });

  await recordProofVerified({
    actorProfileId: input.verifierProfileId,
    patientProfileId: proof.patientProfileId,
    targetProfileId: input.verifierProfileId,
    presentationProofId: proof.id,
    reason,
  });

  return verificationRecord;
}

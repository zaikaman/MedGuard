import type { PresentationStatus, ProofRequestStatus, VerificationResult } from "../../types/domain.js";
import { supabaseAdmin } from "./client.js";
import { mapClaimVerification, mapDelegation, mapPresentationProof, mapProofRequest } from "./mappers.js";

export async function getDelegationById(delegationId: string) {
  const { data, error } = await supabaseAdmin.from("delegations").select("*").eq("id", delegationId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load delegation: ${error.message}`);
  }

  return data ? mapDelegation(data) : null;
}

export async function createProofRequest(input: {
  requesterProfileId: string;
  requesterAgentId: string;
  patientProfileId: string;
  delegationId: string;
  requestedClaimType: string;
  purpose: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("proof_requests")
    .insert({
      requester_profile_id: input.requesterProfileId,
      requester_agent_id: input.requesterAgentId,
      patient_profile_id: input.patientProfileId,
      delegation_id: input.delegationId,
      requested_claim_type: input.requestedClaimType,
      purpose: input.purpose,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create proof request: ${error.message}`);
  }

  return mapProofRequest(data);
}

export async function updateProofRequestDecision(proofRequestId: string, status: ProofRequestStatus, reason: string) {
  const { data, error } = await supabaseAdmin
    .from("proof_requests")
    .update({ status, decision_reason: reason, decided_at: new Date().toISOString() })
    .eq("id", proofRequestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update proof request: ${error.message}`);
  }

  return mapProofRequest(data);
}

export async function createPresentationProof(input: {
  proofRequestId: string;
  patientProfileId: string;
  recipientProfileId: string;
  presentationHash: string;
  t3Reference: string;
  proofType: string;
  expiresAt: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("presentation_proofs")
    .insert({
      proof_request_id: input.proofRequestId,
      patient_profile_id: input.patientProfileId,
      recipient_profile_id: input.recipientProfileId,
      presentation_hash: input.presentationHash,
      proof_type: input.proofType,
      t3_reference: input.t3Reference,
      verification_status: "generated",
      expires_at: input.expiresAt,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store presentation proof: ${error.message}`);
  }

  return mapPresentationProof(data);
}

export async function getPresentationProofForRecipient(presentationProofId: string, recipientProfileId: string) {
  const { data, error } = await supabaseAdmin
    .from("presentation_proofs")
    .select("*")
    .eq("id", presentationProofId)
    .eq("recipient_profile_id", recipientProfileId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load presentation proof: ${error.message}`);
  }

  return data ? mapPresentationProof(data) : null;
}

export async function updatePresentationStatus(presentationProofId: string, status: PresentationStatus) {
  const { data, error } = await supabaseAdmin
    .from("presentation_proofs")
    .update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", presentationProofId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update presentation proof: ${error.message}`);
  }

  return mapPresentationProof(data);
}

export async function createClaimVerification(input: {
  presentationProofId: string;
  verifierProfileId: string;
  verifierAgentId: string;
  result: VerificationResult;
  reason?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("claim_verifications")
    .insert({
      presentation_proof_id: input.presentationProofId,
      verifier_profile_id: input.verifierProfileId,
      verifier_agent_id: input.verifierAgentId,
      result: input.result,
      reason: input.reason ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store claim verification: ${error.message}`);
  }

  return mapClaimVerification(data);
}

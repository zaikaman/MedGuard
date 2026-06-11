import { ApiError } from "../../schemas/common.js";
import type { InsurerClaim, InsurerClaimDecisionStatus } from "../../types/domain.js";
import { recordClaimDecisionOutcome } from "../audit/claimAuditEvents.js";
import { supabaseAdmin } from "./client.js";
import { mapInsurerClaim } from "./mappers.js";

interface CreateInsurerClaimInput {
  insurerProfileId: string;
  patientProfileId: string;
  presentationProofId: string;
  claimReference: string;
}

interface DecideInsurerClaimInput {
  claimId: string;
  insurerProfileId: string;
  status: InsurerClaimDecisionStatus;
  decisionReason?: string | null;
}

interface ProofBackedPresentationInput {
  presentationProofId: string;
  insurerProfileId: string;
  patientProfileId?: string;
}

export async function listInsurerClaims(insurerProfileId: string): Promise<InsurerClaim[]> {
  const { data, error } = await supabaseAdmin
    .from("insurer_claims")
    .select("*")
    .eq("insurer_profile_id", insurerProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list insurer claims: ${error.message}`);
  }

  return (data ?? []).map(mapInsurerClaim);
}

export async function listInsurerClaimsForPatient(patientProfileId: string): Promise<InsurerClaim[]> {
  const { data, error } = await supabaseAdmin
    .from("insurer_claims")
    .select("*")
    .eq("patient_profile_id", patientProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list patient insurer claims: ${error.message}`);
  }

  return (data ?? []).map(mapInsurerClaim);
}

export async function getInsurerClaimForInsurer(
  claimId: string,
  insurerProfileId: string,
): Promise<InsurerClaim | null> {
  const { data, error } = await supabaseAdmin
    .from("insurer_claims")
    .select("*")
    .eq("id", claimId)
    .eq("insurer_profile_id", insurerProfileId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load insurer claim: ${error.message}`);
  }

  return data ? mapInsurerClaim(data) : null;
}

export async function createInsurerClaim(input: CreateInsurerClaimInput): Promise<InsurerClaim> {
  const claimReference = input.claimReference.trim();
  if (!claimReference) {
    throw new ApiError(400, "INVALID_CLAIM_REFERENCE", "Claim reference is required");
  }

  await assertProofBackedPresentation({
    presentationProofId: input.presentationProofId,
    insurerProfileId: input.insurerProfileId,
    patientProfileId: input.patientProfileId,
  });

  const { data, error } = await supabaseAdmin
    .from("insurer_claims")
    .insert({
      insurer_profile_id: input.insurerProfileId,
      patient_profile_id: input.patientProfileId,
      presentation_proof_id: input.presentationProofId,
      claim_reference: claimReference,
      status: "received",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store insurer claim: ${error.message}`);
  }

  return mapInsurerClaim(data);
}

export async function decideInsurerClaim(input: DecideInsurerClaimInput): Promise<InsurerClaim> {
  const claim = await getInsurerClaimForInsurer(input.claimId, input.insurerProfileId);
  if (!claim) {
    throw new ApiError(404, "CLAIM_NOT_FOUND", "Insurer claim was not found");
  }

  await assertProofBackedPresentation({
    presentationProofId: claim.presentationProofId,
    insurerProfileId: input.insurerProfileId,
    patientProfileId: claim.patientProfileId,
  });

  const decisionReason = input.decisionReason?.trim() || null;
  const { data, error } = await supabaseAdmin
    .from("insurer_claims")
    .update({
      status: input.status,
      decision_reason: decisionReason,
      decided_at: new Date().toISOString(),
    })
    .eq("id", input.claimId)
    .eq("insurer_profile_id", input.insurerProfileId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store insurer claim decision: ${error.message}`);
  }

  const decidedClaim = mapInsurerClaim(data);
  await recordClaimDecisionOutcome({
    actorProfileId: input.insurerProfileId,
    patientProfileId: decidedClaim.patientProfileId,
    targetProfileId: input.insurerProfileId,
    presentationProofId: decidedClaim.presentationProofId,
    insurerClaimId: decidedClaim.id,
    status: input.status,
    reason: decisionReason ?? undefined,
  });

  return decidedClaim;
}

async function assertProofBackedPresentation(input: ProofBackedPresentationInput): Promise<void> {
  const { data: proof, error: proofError } = await supabaseAdmin
    .from("presentation_proofs")
    .select("id, patient_profile_id, recipient_profile_id, verification_status, expires_at")
    .eq("id", input.presentationProofId)
    .eq("recipient_profile_id", input.insurerProfileId)
    .maybeSingle();

  if (proofError) {
    throw new Error(`Failed to load insurer presentation proof: ${proofError.message}`);
  }

  if (!proof) {
    throw new ApiError(404, "PRESENTATION_NOT_FOUND", "Presentation proof was not found for this insurer");
  }

  if (input.patientProfileId && proof.patient_profile_id !== input.patientProfileId) {
    throw new ApiError(409, "CLAIM_PATIENT_MISMATCH", "Claim patient does not match the presentation proof");
  }

  if (proof.verification_status !== "verified") {
    throw new ApiError(409, "PRESENTATION_NOT_VERIFIED", "Insurer claim decisions require a verified proof");
  }

  if (new Date(proof.expires_at) <= new Date()) {
    throw new ApiError(409, "PRESENTATION_EXPIRED", "Insurer claim decisions require a current proof");
  }

  const { data: verification, error: verificationError } = await supabaseAdmin
    .from("claim_verifications")
    .select("id")
    .eq("presentation_proof_id", input.presentationProofId)
    .eq("verifier_profile_id", input.insurerProfileId)
    .eq("result", "accepted")
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (verificationError) {
    throw new Error(`Failed to load insurer claim verification: ${verificationError.message}`);
  }

  if (!verification) {
    throw new ApiError(409, "ACCEPTED_VERIFICATION_REQUIRED", "Insurer claim decisions require accepted verification");
  }
}

import type {
  AgentIdentity,
  CredentialHash,
  Delegation,
  InsurerClaim,
  PresentationProof,
  ProofRequest,
  VerificationResult,
} from "../../types/domain.js";

export function mapAgentIdentity(row: Record<string, any>): AgentIdentity {
  return {
    id: row.id,
    profileId: row.profile_id,
    role: row.role,
    t3Did: row.t3_did,
    status: row.status,
    registeredAt: row.registered_at,
  };
}

export function mapCredentialHash(row: Record<string, any>): CredentialHash {
  return {
    id: row.id,
    patientProfileId: row.patient_profile_id,
    patientAgentId: row.patient_agent_id,
    credentialType: row.credential_type,
    issuerDid: row.issuer_did,
    credentialHash: row.credential_hash,
    t3Reference: row.t3_reference,
    status: row.status,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
  };
}

export function mapDelegation(row: Record<string, any>): Delegation {
  return {
    id: row.id,
    patientProfileId: row.patient_profile_id,
    recipientProfileId: row.recipient_profile_id,
    recipientAgentId: row.recipient_agent_id,
    purpose: row.purpose,
    allowedClaimTypes: row.allowed_claim_types ?? [],
    allowedFunctions: row.allowed_functions ?? [],
    allowedHosts: row.allowed_hosts ?? [],
    startsAt: row.starts_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    status: row.status,
  };
}

export function mapProofRequest(row: Record<string, any>): ProofRequest {
  return {
    id: row.id,
    requesterProfileId: row.requester_profile_id,
    requesterAgentId: row.requester_agent_id,
    patientProfileId: row.patient_profile_id,
    delegationId: row.delegation_id,
    requestedClaimType: row.requested_claim_type,
    purpose: row.purpose,
    status: row.status,
    decisionReason: row.decision_reason,
  };
}

export function mapPresentationProof(row: Record<string, any>): PresentationProof {
  return {
    id: row.id,
    proofRequestId: row.proof_request_id,
    patientProfileId: row.patient_profile_id,
    recipientProfileId: row.recipient_profile_id,
    presentationHash: row.presentation_hash,
    proofType: row.proof_type,
    t3Reference: row.t3_reference,
    verificationStatus: row.verification_status,
    expiresAt: row.expires_at,
  };
}

export function mapClaimVerification(row: Record<string, any>): {
  id: string;
  presentationProofId: string;
  result: VerificationResult;
  reason: string | null;
  verifiedAt: string;
} {
  return {
    id: row.id,
    presentationProofId: row.presentation_proof_id,
    result: row.result,
    reason: row.reason,
    verifiedAt: row.verified_at,
  };
}

export function mapInsurerClaim(row: Record<string, any>): InsurerClaim {
  return {
    id: row.id,
    insurerProfileId: row.insurer_profile_id,
    patientProfileId: row.patient_profile_id,
    presentationProofId: row.presentation_proof_id,
    claimReference: row.claim_reference,
    status: row.status,
    decisionReason: row.decision_reason,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

export type Role = "patient" | "clinic" | "insurer";

export type AgentStatus = "pending" | "active" | "suspended" | "failed";
export type CredentialStatus = "active" | "expired" | "revoked" | "superseded";
export type DelegationStatus = "active" | "expired" | "revoked";
export type ProofRequestStatus = "pending" | "approved" | "denied" | "expired" | "verified" | "failed";
export type PresentationStatus = "generated" | "verified" | "rejected" | "revoked";
export type VerificationResult = "accepted" | "denied" | "unverifiable" | "expired" | "revoked";
export type InsurerClaimStatus = "received" | "approved" | "denied" | "needs_review";
export type InsurerClaimDecisionStatus = Exclude<InsurerClaimStatus, "received">;
export type AuditSeverity = "info" | "warning" | "critical";

export interface Profile {
  id: string;
  role: Role;
  displayName: string;
  organizationName: string | null;
}

export interface AgentIdentity {
  id: string;
  profileId: string;
  role: Role;
  t3Did: string;
  status: AgentStatus;
  registeredAt: string | null;
}

export interface CredentialHash {
  id: string;
  patientProfileId: string;
  patientAgentId: string;
  credentialType: string;
  issuerDid: string;
  credentialHash: string;
  t3Reference: string;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt: string | null;
}

export interface Delegation {
  id: string;
  patientProfileId: string;
  recipientProfileId: string;
  recipientAgentId: string;
  purpose: string;
  allowedClaimTypes: string[];
  allowedFunctions: string[];
  allowedHosts: string[];
  startsAt: string;
  expiresAt: string;
  revokedAt: string | null;
  status: DelegationStatus;
}

export interface ProofRequest {
  id: string;
  requesterProfileId: string;
  requesterAgentId: string;
  patientProfileId: string;
  delegationId: string | null;
  requestedClaimType: string;
  purpose: string;
  status: ProofRequestStatus;
  decisionReason: string | null;
}

export interface PresentationProof {
  id: string;
  proofRequestId: string;
  patientProfileId: string;
  recipientProfileId: string;
  presentationHash: string;
  proofType: string;
  t3Reference: string;
  verificationStatus: PresentationStatus;
  expiresAt: string;
}

export interface InsurerClaim {
  id: string;
  insurerProfileId: string;
  patientProfileId: string;
  presentationProofId: string;
  claimReference: string;
  status: InsurerClaimStatus;
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorProfileId: string | null;
  patientProfileId: string | null;
  targetProfileId: string | null;
  eventType: string;
  severity: AuditSeverity;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

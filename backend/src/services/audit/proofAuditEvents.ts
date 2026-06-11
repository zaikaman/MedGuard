import type { AuditSeverity } from "../../types/domain.js";
import { writeAuditEvent } from "./auditService.js";

interface ProofAuditInput {
  actorProfileId: string;
  patientProfileId: string;
  targetProfileId: string;
  proofRequestId?: string;
  presentationProofId?: string;
  requestedClaimType?: string;
  purpose?: string;
  reason?: string;
}

export function recordProofRequested(input: ProofAuditInput) {
  return recordProofEvent("proof_requested", "info", "Proof disclosure requested", input);
}

export function recordProofApproved(input: ProofAuditInput) {
  return recordProofEvent("proof_approved", "info", "Proof disclosure approved", input);
}

export function recordProofDenied(input: ProofAuditInput) {
  return recordProofEvent("proof_denied", "warning", "Proof disclosure denied", input);
}

export function recordProofVerified(input: ProofAuditInput) {
  return recordProofEvent("proof_verified", "info", "Proof presentation verified", input);
}

function recordProofEvent(eventType: string, severity: AuditSeverity, summary: string, input: ProofAuditInput) {
  return writeAuditEvent({
    actorProfileId: input.actorProfileId,
    patientProfileId: input.patientProfileId,
    targetProfileId: input.targetProfileId,
    eventType,
    severity,
    summary,
    metadata: {
      proofRequestId: input.proofRequestId,
      presentationProofId: input.presentationProofId,
      requestedClaimType: input.requestedClaimType,
      purpose: input.purpose,
      reason: input.reason,
    },
  });
}

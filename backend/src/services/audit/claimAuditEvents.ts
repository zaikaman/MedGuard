import type { AuditSeverity, InsurerClaimDecisionStatus, VerificationResult } from "../../types/domain.js";
import { writeAuditEvent } from "./auditService.js";

interface ClaimAuditInput {
  actorProfileId: string;
  patientProfileId: string;
  targetProfileId?: string;
  proofRequestId?: string;
  presentationProofId?: string;
  insurerClaimId?: string;
  requestedClaimType?: string;
  purpose?: string;
  reason?: string;
  errorCode?: string;
}

type EligibilityVerificationInput = ClaimAuditInput & {
  result: VerificationResult;
};

type ClaimDecisionOutcomeInput = ClaimAuditInput & {
  status: InsurerClaimDecisionStatus;
};

export function recordInsurerRequest(input: ClaimAuditInput) {
  return recordClaimAuditEvent("insurer_request", "info", "Insurer eligibility evidence requested", input);
}

export function recordInsurerOverreachDenied(input: ClaimAuditInput) {
  return recordClaimAuditEvent("insurer_overreach_denied", "warning", "Insurer request blocked by policy", input);
}

export function recordEligibilityVerification(input: EligibilityVerificationInput) {
  return recordClaimAuditEvent(
    "eligibility_verification",
    input.result === "accepted" ? "info" : "warning",
    "Insurer eligibility verification completed",
    input,
    { result: input.result },
  );
}

export function recordClaimDecisionOutcome(input: ClaimDecisionOutcomeInput) {
  return recordClaimAuditEvent(
    "claim_decision_outcome",
    input.status === "approved" ? "info" : "warning",
    "Insurer claim decision recorded",
    input,
    { status: input.status },
  );
}

function recordClaimAuditEvent(
  eventType: string,
  severity: AuditSeverity,
  summary: string,
  input: ClaimAuditInput,
  outcomeMetadata: Record<string, unknown> = {},
) {
  return writeAuditEvent({
    actorProfileId: input.actorProfileId,
    patientProfileId: input.patientProfileId,
    targetProfileId: input.targetProfileId ?? input.actorProfileId,
    eventType,
    severity,
    summary,
    metadata: {
      proofRequestId: input.proofRequestId,
      presentationProofId: input.presentationProofId,
      insurerClaimId: input.insurerClaimId,
      requestedClaimType: input.requestedClaimType,
      purpose: input.purpose,
      reason: input.reason,
      errorCode: input.errorCode,
      ...outcomeMetadata,
    },
  });
}

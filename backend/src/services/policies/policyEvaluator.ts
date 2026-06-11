import type { CredentialHash, Delegation, Role } from "../../types/domain.js";

export interface PolicyRequest {
  requesterRole: Role;
  requesterProfileId: string;
  requesterAgentId: string;
  patientProfileId: string;
  requestedClaimType: string;
  purpose: string;
  now?: Date;
}

export interface PolicyDecision {
  allowed: boolean;
  reason: string;
}

export function evaluateDisclosurePolicy(
  request: PolicyRequest,
  delegation: Delegation | null,
  credential: CredentialHash | null,
): PolicyDecision {
  const now = request.now ?? new Date();

  if (request.requesterRole === "patient") {
    return deny("Patients cannot request recipient disclosures from this endpoint");
  }

  if (!delegation) {
    return deny("No delegated access grant exists for this request");
  }

  if (delegation.patientProfileId !== request.patientProfileId) {
    return deny("Delegation does not belong to the requested patient");
  }

  if (delegation.recipientProfileId !== request.requesterProfileId) {
    return deny("Delegation recipient does not match requester");
  }

  if (delegation.recipientAgentId !== request.requesterAgentId) {
    return deny("Delegation recipient agent does not match requester agent");
  }

  if (delegation.status !== "active" || delegation.revokedAt) {
    return deny("Delegation is not active");
  }

  if (new Date(delegation.startsAt) > now || new Date(delegation.expiresAt) <= now) {
    return deny("Delegation is outside its active window");
  }

  if (!delegation.allowedClaimTypes.includes(request.requestedClaimType)) {
    return deny("Requested claim type is outside delegated scope");
  }

  if (!samePurpose(delegation.purpose, request.purpose)) {
    return deny("Requested purpose does not match delegated purpose");
  }

  if (!credential) {
    return deny("No eligible credential metadata exists for requested claim");
  }

  if (credential.patientProfileId !== request.patientProfileId) {
    return deny("Credential does not belong to requested patient");
  }

  if (credential.status !== "active") {
    return deny("Credential is not active");
  }

  if (credential.expiresAt && new Date(credential.expiresAt) <= now) {
    return deny("Credential is expired");
  }

  return { allowed: true, reason: "Disclosure request satisfies delegation and credential policy" };
}

function samePurpose(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function deny(reason: string): PolicyDecision {
  return { allowed: false, reason };
}

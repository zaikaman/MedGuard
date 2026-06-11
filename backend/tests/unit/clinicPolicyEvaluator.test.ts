import { describe, expect, it } from "vitest";
import { evaluateDisclosurePolicy } from "../../src/services/policies/policyEvaluator.js";
import type { CredentialHash, Delegation } from "../../src/types/domain.js";

const now = new Date("2026-06-11T00:00:00.000Z");

const delegation: Delegation = {
  id: "30000000-0000-4000-8000-000000000001",
  patientProfileId: "00000000-0000-4000-8000-000000000001",
  recipientProfileId: "00000000-0000-4000-8000-000000000002",
  recipientAgentId: "10000000-0000-4000-8000-000000000002",
  purpose: "clinic_intake",
  allowedClaimTypes: ["eligibility"],
  allowedFunctions: ["presentations.generate"],
  allowedHosts: [],
  startsAt: "2026-06-10T00:00:00.000Z",
  expiresAt: "2026-06-12T00:00:00.000Z",
  revokedAt: null,
  status: "active",
};

const credential: CredentialHash = {
  id: "20000000-0000-4000-8000-000000000001",
  patientProfileId: delegation.patientProfileId,
  patientAgentId: "10000000-0000-4000-8000-000000000001",
  credentialType: "eligibility",
  issuerDid: "did:t3n:testnet:issuer",
  credentialHash: "sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
  t3Reference: "t3n://testnet/credential/001",
  status: "active",
  issuedAt: "2026-06-10T00:00:00.000Z",
  expiresAt: "2026-06-12T00:00:00.000Z",
};

const request = {
  requesterRole: "clinic" as const,
  requesterProfileId: delegation.recipientProfileId,
  requesterAgentId: delegation.recipientAgentId,
  patientProfileId: delegation.patientProfileId,
  requestedClaimType: "eligibility",
  purpose: "clinic_intake",
  now,
};

describe("clinic proof policy evaluator", () => {
  it("approves an active in-scope clinic disclosure", () => {
    const decision = evaluateDisclosurePolicy(request, delegation, credential);

    expect(decision).toEqual({
      allowed: true,
      reason: "Disclosure request satisfies delegation and credential policy",
    });
  });

  it("denies out-of-scope claim requests", () => {
    const decision = evaluateDisclosurePolicy({ ...request, requestedClaimType: "diagnosis" }, delegation, credential);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("outside delegated scope");
  });

  it("denies expired delegations", () => {
    const decision = evaluateDisclosurePolicy(
      { ...request, now: new Date("2026-06-13T00:00:00.000Z") },
      delegation,
      credential,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("outside its active window");
  });

  it("denies malformed or missing proof inputs with no credential metadata", () => {
    const decision = evaluateDisclosurePolicy(request, delegation, null);

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("No eligible credential");
  });

  it("denies identity mismatch between delegation and requester", () => {
    const decision = evaluateDisclosurePolicy(
      { ...request, requesterProfileId: "00000000-0000-4000-8000-000000000003" },
      delegation,
      credential,
    );

    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("recipient does not match requester");
  });
});

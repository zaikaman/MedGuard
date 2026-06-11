import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.T3N_API_KEY = "t3n";
process.env.T3N_AGENT_REGISTRATION_CONTRACT = "agents";
process.env.T3N_PRESENTATION_CONTRACT = "presentations";
process.env.T3N_VERIFICATION_CONTRACT = "verification";

const authState = vi.hoisted(() => ({
  userId: "00000000-0000-4000-8000-000000000002",
  role: "clinic" as "patient" | "clinic" | "insurer",
}));

const presentationService = vi.hoisted(() => ({
  generateClinicPresentation: vi.fn(),
}));

const claimService = vi.hoisted(() => ({
  verifyClinicClaim: vi.fn(),
}));

vi.mock("../../src/middleware/requireAuth.js", () => ({
  requireAuth: (request: any, _response: any, next: any) => {
    request.auth = { accessToken: "test-token", userId: authState.userId, role: authState.role, supabase: {} };
    next();
  },
}));

vi.mock("../../src/services/terminal3/presentationService.js", () => presentationService);
vi.mock("../../src/services/terminal3/claimVerificationService.js", () => claimService);

const { createApp } = await import("../../src/app.js");

describe("clinic presentation contract", () => {
  const app = createApp();
  const patientProfileId = "00000000-0000-4000-8000-000000000001";
  const delegationId = "30000000-0000-4000-8000-000000000001";
  const presentationProofId = "40000000-0000-4000-8000-000000000001";

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = "clinic";
    presentationService.generateClinicPresentation.mockResolvedValue({
      id: presentationProofId,
      proofRequestId: "50000000-0000-4000-8000-000000000001",
      presentationHash: "sha256:presentation",
      verificationStatus: "generated",
      expiresAt: "2026-06-11T00:15:00.000Z",
    });
    claimService.verifyClinicClaim.mockResolvedValue({
      id: "60000000-0000-4000-8000-000000000001",
      presentationProofId,
      result: "accepted",
      verifiedAt: "2026-06-11T00:01:00.000Z",
    });
  });

  it("POST /api/presentations/generate returns clinic proof metadata", async () => {
    const response = await request(app).post("/api/presentations/generate").send({
      patientProfileId,
      delegationId,
      requestedClaimType: "eligibility",
      purpose: "clinic_intake",
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: presentationProofId, verificationStatus: "generated" });
    expect(presentationService.generateClinicPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterProfileId: authState.userId,
        requesterRole: "clinic",
        patientProfileId,
        delegationId,
      }),
    );
  });

  it("POST /api/claims/verify returns accepted clinic verification result", async () => {
    const response = await request(app).post("/api/claims/verify").send({ presentationProofId });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ presentationProofId, result: "accepted" });
  });

  it("rejects insurer access until User Story 2 extends presentation generation", async () => {
    authState.role = "insurer";

    const response = await request(app).post("/api/presentations/generate").send({
      patientProfileId,
      delegationId,
      requestedClaimType: "eligibility",
      purpose: "claim_eligibility",
    });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ROLE_FORBIDDEN");
  });
});

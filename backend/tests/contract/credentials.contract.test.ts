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
  userId: "00000000-0000-4000-8000-000000000001",
  role: "patient" as "patient" | "clinic" | "insurer",
}));

const credentialRepository = vi.hoisted(() => ({
  listCredentialHashes: vi.fn(),
  issueCredentialMetadata: vi.fn(),
}));

vi.mock("../../src/middleware/requireAuth.js", () => ({
  requireAuth: (request: any, _response: any, next: any) => {
    request.auth = { accessToken: "test-token", userId: authState.userId, role: authState.role, supabase: {} };
    next();
  },
}));

vi.mock("../../src/services/supabase/credentialRepository.js", () => credentialRepository);

const { createApp } = await import("../../src/app.js");

describe("credentials contract", () => {
  const app = createApp();
  const credential = {
    id: "20000000-0000-4000-8000-000000000001",
    patientProfileId: authState.userId,
    patientAgentId: "10000000-0000-4000-8000-000000000001",
    credentialType: "eligibility",
    issuerDid: "did:t3n:testnet:issuer",
    credentialHash: "sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918",
    t3Reference: "t3n://testnet/credential/001",
    status: "active",
    issuedAt: "2026-06-11T00:00:00.000Z",
    expiresAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = "patient";
    credentialRepository.listCredentialHashes.mockResolvedValue([credential]);
    credentialRepository.issueCredentialMetadata.mockResolvedValue(credential);
  });

  it("GET /api/credentials returns credential hash metadata only", async () => {
    const response = await request(app).get("/api/credentials");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([credential]);
    expect(JSON.stringify(response.body)).not.toContain("credentialSubject");
  });

  it("POST /api/credentials/issue stores hash/reference metadata", async () => {
    const response = await request(app).post("/api/credentials/issue").send({
      credentialType: "eligibility",
      issuerDid: "did:t3n:testnet:issuer",
      credentialHash: credential.credentialHash,
      t3Reference: credential.t3Reference,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: credential.id, credentialType: "eligibility", status: "active" });
    expect(credentialRepository.issueCredentialMetadata).toHaveBeenCalledWith(
      authState.userId,
      expect.objectContaining({ credentialType: "eligibility", t3Reference: credential.t3Reference }),
    );
  });

  it("rejects clinic access to patient credential endpoints", async () => {
    authState.role = "clinic";

    const response = await request(app).get("/api/credentials");

    expect(response.status).toBe(403);
  });
});

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

const agentService = vi.hoisted(() => ({
  getAgentForProfile: vi.fn(),
  registerRoleAgent: vi.fn(),
}));

vi.mock("../../src/middleware/requireAuth.js", () => ({
  requireAuth: (request: any, _response: any, next: any) => {
    request.auth = {
      accessToken: "test-token",
      userId: authState.userId,
      role: authState.role,
      supabase: {},
    };
    next();
  },
}));

vi.mock("../../src/services/terminal3/agentRegistrationService.js", () => agentService);

const { createApp } = await import("../../src/app.js");

describe("agents contract", () => {
  const app = createApp();
  const agent = {
    id: "10000000-0000-4000-8000-000000000001",
    profileId: authState.userId,
    role: "patient",
    t3Did: "did:t3n:testnet:patient:abc",
    status: "active",
    registeredAt: "2026-06-11T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authState.role = "patient";
    agentService.getAgentForProfile.mockResolvedValue(agent);
    agentService.registerRoleAgent.mockResolvedValue(agent);
  });

  it("POST /api/agents/register returns a registered agent identity", async () => {
    const response = await request(app).post("/api/agents/register").send({ role: "patient" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: agent.id,
      profileId: authState.userId,
      role: "patient",
      t3Did: agent.t3Did,
      status: "active",
    });
    expect(agentService.registerRoleAgent).toHaveBeenCalledWith({ profileId: authState.userId, role: "patient" });
  });

  it("GET /api/agents/me returns current user agent metadata", async () => {
    const response = await request(app).get("/api/agents/me");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: agent.id, profileId: authState.userId, role: "patient" });
  });

  it("rejects registering an agent for a different role", async () => {
    const response = await request(app).post("/api/agents/register").send({ role: "clinic" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("ROLE_MISMATCH");
  });
});

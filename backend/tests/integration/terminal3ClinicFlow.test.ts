import { describe, expect, it } from "vitest";

process.env.SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_ANON_KEY = "anon";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service";
process.env.T3N_API_KEY = "t3n";
process.env.T3N_ENVIRONMENT = "testnet";
process.env.T3N_AGENT_REGISTRATION_CONTRACT = "agents";
process.env.T3N_PRESENTATION_CONTRACT = "presentations";
process.env.T3N_VERIFICATION_CONTRACT = "verification";

const { Terminal3BoundaryClient } = await import("../../src/services/terminal3/terminal3Client.js");

describe("mocked Terminal 3 clinic flow", () => {
  it("registers role-specific agents, generates a presentation, and verifies it", async () => {
    const client = new Terminal3BoundaryClient();
    const patient = await client.registerAgent({
      profileId: "00000000-0000-4000-8000-000000000001",
      role: "patient",
    });
    const clinic = await client.registerAgent({
      profileId: "00000000-0000-4000-8000-000000000002",
      role: "clinic",
    });

    const presentation = await client.generatePresentation({
      patientDid: patient.did,
      recipientDid: clinic.did,
      credentialReference: "t3n://testnet/credential/001",
      requestedClaimType: "eligibility",
      purpose: "clinic_intake",
    });

    const verification = await client.verifyPresentation({
      presentationReference: presentation.t3Reference,
      expectedRecipientDid: clinic.did,
    });

    expect(patient.did).toContain(":patient:");
    expect(clinic.did).toContain(":clinic:");
    expect(presentation.presentationHash).toMatch(/^sha256:/);
    expect(verification.accepted).toBe(true);
  });

  it("rejects malformed verification inputs", async () => {
    const client = new Terminal3BoundaryClient();

    const verification = await client.verifyPresentation({
      presentationReference: "",
      expectedRecipientDid: "not-a-did",
    });

    expect(verification.accepted).toBe(false);
    expect(verification.reason).toContain("Invalid presentation");
  });
});

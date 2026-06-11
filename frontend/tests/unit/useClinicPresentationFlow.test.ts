import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useClinicPresentationFlow } from "../../src/features/presentations/useClinicPresentationFlow";
import { apiRequest } from "../../src/lib/api/client";

vi.mock("../../src/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("useClinicPresentationFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default empty state", () => {
    const { result } = renderHook(() => useClinicPresentationFlow());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.agent).toBeNull();
    expect(result.current.presentation).toBeNull();
    expect(result.current.verification).toBeNull();
  });

  it("should fetch agent successfully", async () => {
    const mockAgent = { id: "1", profileId: "p1", role: "clinic", t3Did: "did:t3n:123", status: "active" };
    vi.mocked(apiRequest).mockResolvedValue(mockAgent);

    const { result } = renderHook(() => useClinicPresentationFlow());

    let agentData;
    await act(async () => {
      agentData = await result.current.fetchAgent();
    });

    expect(apiRequest).toHaveBeenCalledWith("/agents/me");
    expect(result.current.agent).toEqual(mockAgent);
    expect(agentData).toEqual(mockAgent);
  });

  it("should register agent successfully", async () => {
    const mockAgent = { id: "1", profileId: "p1", role: "clinic", t3Did: "did:t3n:123", status: "active" };
    vi.mocked(apiRequest).mockResolvedValue(mockAgent);

    const { result } = renderHook(() => useClinicPresentationFlow());

    await act(async () => {
      await result.current.registerAgent("clinic");
    });

    expect(apiRequest).toHaveBeenCalledWith("/agents/register", {
      method: "POST",
      body: JSON.stringify({ role: "clinic" }),
    });
    expect(result.current.agent).toEqual(mockAgent);
  });

  it("should generate presentation successfully", async () => {
    const mockPresentation = { id: "p-1", proofRequestId: "r-1", presentationHash: "hash-123", verificationStatus: "generated", expiresAt: "2026-06-11" };
    vi.mocked(apiRequest).mockResolvedValue(mockPresentation);

    const { result } = renderHook(() => useClinicPresentationFlow());

    const params = {
      patientProfileId: "patient-1",
      delegationId: "del-1",
      requestedClaimType: "Immunization history",
      purpose: "Travel",
    };

    await act(async () => {
      await result.current.generatePresentation(params);
    });

    expect(apiRequest).toHaveBeenCalledWith("/presentations/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
    expect(result.current.presentation).toEqual(mockPresentation);
  });

  it("should verify presentation successfully", async () => {
    const mockVerification = { id: "v-1", presentationProofId: "p-1", result: "accepted", verifiedAt: "2026-06-11" };
    vi.mocked(apiRequest).mockResolvedValue(mockVerification);

    const { result } = renderHook(() => useClinicPresentationFlow());

    await act(async () => {
      await result.current.verifyPresentation("p-1");
    });

    expect(apiRequest).toHaveBeenCalledWith("/claims/verify", {
      method: "POST",
      body: JSON.stringify({ presentationProofId: "p-1" }),
    });
    expect(result.current.verification).toEqual(mockVerification);
  });
});

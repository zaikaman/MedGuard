import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InsurerEligibilityPage from "../../src/dashboards/insurer/InsurerEligibilityPage";
import { useAuth } from "../../src/auth/AuthProvider";
import { useInsurerClaimFlow } from "../../src/features/claims/useInsurerClaimFlow";
import { apiRequest } from "../../src/lib/api/client";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../src/features/claims/useInsurerClaimFlow", () => ({
  useInsurerClaimFlow: vi.fn(),
}));

vi.mock("../../src/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("InsurerEligibilityPage", () => {
  const mockAgent = { id: "a-2", profileId: "ins-123", role: "insurer", t3Did: "did:t3n:insurer-xyz", status: "active" };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "ins-123" } as any,
      session: {} as any,
      profile: {
        role: "insurer",
        display_name: "InsureCorp",
        organization_name: "InsureCorp Group",
      } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useInsurerClaimFlow).mockReturnValue({
      loading: false,
      error: null,
      agent: mockAgent as any,
      presentation: null,
      verification: null,
      claimDecision: null,
      fetchAgent: vi.fn().mockResolvedValue(mockAgent),
      registerAgent: vi.fn(),
      generatePresentation: vi.fn(),
      verifyEligibility: vi.fn(),
      decideClaim: vi.fn(),
      resetFlow: vi.fn(),
    });

    vi.mocked(apiRequest).mockResolvedValue([]);
  });

  it("should show register agent button when no agent exists", async () => {
    vi.mocked(useInsurerClaimFlow).mockReturnValue({
      loading: false,
      error: null,
      agent: null,
      presentation: null,
      verification: null,
      claimDecision: null,
      fetchAgent: vi.fn().mockResolvedValue(null),
      registerAgent: vi.fn(),
      generatePresentation: vi.fn(),
      verifyEligibility: vi.fn(),
      decideClaim: vi.fn(),
      resetFlow: vi.fn(),
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <InsurerEligibilityPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText("Register Insurer Agent Identity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register Secure DID" })).toBeInTheDocument();
  });

  it("should show verification form when agent is active", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <InsurerEligibilityPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText("did:t3n:insurer-xyz")).toBeInTheDocument();
    expect(screen.getByText("Initiate Eligibility Verification")).toBeInTheDocument();
    expect(screen.getByText("-- Select Active Delegation --")).toBeInTheDocument();
  });

  it("should display manual form input when manual entry is selected", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <InsurerEligibilityPage />
        </MemoryRouter>
      );
    });

    const select = screen.getByRole("combobox");
    await act(async () => {
      fireEvent.change(select, { target: { value: "manual" } });
    });

    expect(screen.getByLabelText("Patient Profile ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Claim Reference Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Requested Claim Type")).toBeInTheDocument();
  });
});

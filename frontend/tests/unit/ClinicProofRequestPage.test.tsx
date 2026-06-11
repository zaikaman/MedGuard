import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ClinicProofRequestPage from "../../src/dashboards/clinic/ClinicProofRequestPage";
import { useAuth } from "../../src/auth/AuthProvider";
import { useClinicPresentationFlow } from "../../src/features/presentations/useClinicPresentationFlow";
import { apiRequest } from "../../src/lib/api/client";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../src/features/presentations/useClinicPresentationFlow", () => ({
  useClinicPresentationFlow: vi.fn(),
}));

vi.mock("../../src/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("ClinicProofRequestPage", () => {
  const mockAgent = { id: "a-2", profileId: "clinic-123", role: "clinic", t3Did: "did:t3n:clinic-xyz", status: "active" };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "clinic-123" } as any,
      session: {} as any,
      profile: {
        role: "clinic",
        display_name: "Dr. Smith",
        organization_name: "General Hospital",
      } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.mocked(useClinicPresentationFlow).mockReturnValue({
      loading: false,
      error: null,
      agent: mockAgent as any,
      presentation: null,
      verification: null,
      fetchAgent: vi.fn().mockResolvedValue(mockAgent),
      registerAgent: vi.fn(),
      generatePresentation: vi.fn(),
      verifyPresentation: vi.fn(),
      resetFlow: vi.fn(),
    });

    vi.mocked(apiRequest).mockResolvedValue([]);
  });

  it("should show request verification form when clinic agent is active", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ClinicProofRequestPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText("Secure Clinic Agent")).toBeInTheDocument();
    expect(screen.getByText("did:t3n:clinic-xyz")).toBeInTheDocument();
    expect(screen.getByText("Request Patient Health Proof")).toBeInTheDocument();
    expect(screen.getByText("-- Choose active patient delegation --")).toBeInTheDocument();
  });

  it("should show manual inputs when manual option is selected", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <ClinicProofRequestPage />
        </MemoryRouter>
      );
    });

    const select = screen.getByRole("combobox");
    
    await act(async () => {
      fireEvent.change(select, { target: { value: "manual" } });
    });

    expect(screen.getByLabelText("Patient Profile ID (UUID)")).toBeInTheDocument();
    expect(screen.getByLabelText("Clinical Purpose & Scope of Request")).toBeInTheDocument();
  });
});

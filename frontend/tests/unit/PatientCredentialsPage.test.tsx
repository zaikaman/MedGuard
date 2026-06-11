import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PatientCredentialsPage from "../../src/dashboards/patient/PatientCredentialsPage";
import { useAuth } from "../../src/auth/AuthProvider";
import { apiRequest } from "../../src/lib/api/client";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../src/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("PatientCredentialsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "pat-123" } as any,
      session: {} as any,
      profile: {
        role: "patient",
        display_name: "Bob Jones",
        organization_name: null,
      } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it("should show onboarding button when no agent exists", async () => {
    // Mock /agents/me returning 404 (not registered)
    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === "/agents/me") {
        const error: any = new Error("Agent not found");
        error.status = 404;
        throw error;
      }
      return [];
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <PatientCredentialsPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText("Onboard Patient Agent")).toBeInTheDocument();
    expect(screen.getByText("Onboard Secure Patient Agent")).toBeInTheDocument();
  });

  it("should display agent info and credentials when registered", async () => {
    const mockAgent = { id: "a-1", profileId: "pat-123", role: "patient", t3Did: "did:t3n:patient-xyz", status: "active", registeredAt: "2026-06-11" };
    const mockCredentials = [
      { id: "c-1", patientProfileId: "pat-123", credentialType: "Immunization history", issuerDid: "did:t3n:clinic-a", credentialHash: "0x123", status: "active" },
    ];

    vi.mocked(apiRequest).mockImplementation(async (path: string) => {
      if (path === "/agents/me") return mockAgent;
      if (path === "/credentials") return mockCredentials;
      if (path === "/delegations") return [];
      return [];
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <PatientCredentialsPage />
        </MemoryRouter>
      );
    });

    expect(screen.getByText("Secure Patient Agent")).toBeInTheDocument();
    expect(screen.getByText("did:t3n:patient-xyz")).toBeInTheDocument();
    expect(screen.getByText("Immunization history")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    // Stat card check
    expect(screen.getByText("Active credentials")).toBeInTheDocument();
  });
});

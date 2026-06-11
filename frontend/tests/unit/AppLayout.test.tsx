import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppLayout, StatCard, StatusBadge, AuditLogRow } from "../../src/components/AppLayout";
import { useAuth } from "../../src/auth/AuthProvider";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("AppLayout and Primitives", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- AppLayout Tests ---

  it("should render patient layout with correct theme and links", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1" } as any,
      session: {} as any,
      profile: {
        role: "patient",
        display_name: "Alice Smith",
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

    render(
      <MemoryRouter>
        <AppLayout>
          <div>Child View</div>
        </AppLayout>
      </MemoryRouter>
    );

    // Brand and Child elements
    expect(screen.getByText("MedGuard")).toBeInTheDocument();
    expect(screen.getByText("Child View")).toBeInTheDocument();

    // Initials AS
    expect(screen.getByText("AS")).toBeInTheDocument();

    // Patient Banner
    expect(screen.getByText("Patient")).toBeInTheDocument();
    expect(screen.getByText(/Blue — trust, calm, primary actor/)).toBeInTheDocument();

    // Patient Links
    expect(screen.getByText("Credentials")).toBeInTheDocument();
    expect(screen.getByText("Delegations")).toBeInTheDocument();
    expect(screen.queryByText("Referrals")).not.toBeInTheDocument();
  });

  it("should render clinic layout with organization name and dropdown signout button", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-2" } as any,
      session: {} as any,
      profile: {
        role: "clinic",
        display_name: "Dr. Bob",
        organization_name: "Raffles Medical Clinic",
      } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <AppLayout>
          <div>Clinic Dashboard Content</div>
        </AppLayout>
      </MemoryRouter>
    );

    // Organization details
    expect(screen.getByText("Raffles Medical Clinic")).toBeInTheDocument();
    expect(screen.getByText("Clinic")).toBeInTheDocument();
    expect(screen.getByText(/Teal — care, action, data requestor/)).toBeInTheDocument();
    expect(screen.getByText("Referrals")).toBeInTheDocument();

    // Avatar initials DB
    const avatar = screen.getByText("DB");
    expect(avatar).toBeInTheDocument();

    // Toggle dropdown
    expect(screen.queryByText("Sign out")).not.toBeInTheDocument();
    fireEvent.click(avatar);
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  // --- Primitives Tests ---

  it("should render StatCard", () => {
    render(<StatCard title="Total Claims" value="42" />);
    expect(screen.getByText("Total Claims")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should render StatusBadge", () => {
    render(<StatusBadge status="verified" label="Verified Badge" />);
    expect(screen.getByText("Verified Badge")).toBeInTheDocument();
  });

  it("should render AuditLogRow", () => {
    render(
      <AuditLogRow
        severity="success"
        title="Proof Generated Successfully"
        subtitle="Requested by Insurer Agent"
        timestamp="10:45:00"
      />
    );
    expect(screen.getByText("Proof Generated Successfully")).toBeInTheDocument();
    expect(screen.getByText("Requested by Insurer Agent")).toBeInTheDocument();
    expect(screen.getByText("10:45:00")).toBeInTheDocument();
  });
});

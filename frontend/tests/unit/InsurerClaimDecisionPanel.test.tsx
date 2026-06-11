import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { InsurerClaimDecisionPanel } from "../../src/dashboards/insurer/InsurerClaimDecisionPanel";
import { InsurerClaim } from "../../src/features/claims/useInsurerClaimFlow";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("InsurerClaimDecisionPanel", () => {
  const mockClaim: InsurerClaim = {
    id: "claim-123",
    insurerProfileId: "ins-123",
    patientProfileId: "pat-123",
    presentationProofId: "proof-123",
    claimReference: "REF-456",
    status: "received",
    decisionReason: null,
    decidedAt: null,
    createdAt: "2026-06-11T00:00:00Z",
  };

  const mockOnDecide = vi.fn();
  const mockOnReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render loading state when loading is true", () => {
    render(
      <InsurerClaimDecisionPanel
        claim={mockClaim}
        loading={true}
        error={null}
        onDecide={mockOnDecide}
        onReset={mockOnReset}
      />
    );
    expect(screen.getByText("Processing and committing claim decision...")).toBeInTheDocument();
  });

  it("should render error state when error is present", () => {
    render(
      <InsurerClaimDecisionPanel
        claim={mockClaim}
        loading={false}
        error="Verification failed"
        onDecide={mockOnDecide}
        onReset={mockOnReset}
      />
    );
    expect(screen.getByText("Decision Recording Failed")).toBeInTheDocument();
    expect(screen.getByText("Error: Verification failed")).toBeInTheDocument();
  });

  it("should render decision form when claim status is received", () => {
    render(
      <InsurerClaimDecisionPanel
        claim={mockClaim}
        loading={false}
        error={null}
        onDecide={mockOnDecide}
        onReset={mockOnReset}
      />
    );
    expect(screen.getByText("Record Claim Decision")).toBeInTheDocument();
    expect(screen.getByText("REF-456")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Decision" })).toBeInTheDocument();
  });

  it("should submit decision when form is submitted", async () => {
    render(
      <InsurerClaimDecisionPanel
        claim={mockClaim}
        loading={false}
        error={null}
        onDecide={mockOnDecide}
        onReset={mockOnReset}
      />
    );

    const select = screen.getByRole("combobox");
    const textarea = screen.getByPlaceholderText(/e.g. Patient coverage confirmed/);

    await act(async () => {
      fireEvent.change(select, { target: { value: "approved" } });
      fireEvent.change(textarea, { target: { value: "Verified and valid" } });
      fireEvent.click(screen.getByRole("button", { name: "Record Decision" }));
    });

    expect(mockOnDecide).toHaveBeenCalledWith("approved", "Verified and valid");
  });

  it("should render approved claim details when status is approved", () => {
    const approvedClaim: InsurerClaim = {
      ...mockClaim,
      status: "approved",
      decisionReason: "Auto-approved",
      decidedAt: "2026-06-11T12:00:00Z",
    };

    render(
      <InsurerClaimDecisionPanel
        claim={approvedClaim}
        loading={false}
        error={null}
        onDecide={mockOnDecide}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText("Claim Approved")).toBeInTheDocument();
    expect(screen.getByText("CLAIM APPROVED")).toBeInTheDocument();
    expect(screen.getByText("Auto-approved")).toBeInTheDocument();
  });

  it("should render denied claim details when status is denied", () => {
    const deniedClaim: InsurerClaim = {
      ...mockClaim,
      status: "denied",
      decisionReason: "Policy criteria not met",
      decidedAt: "2026-06-11T12:00:00Z",
    };

    render(
      <InsurerClaimDecisionPanel
        claim={deniedClaim}
        loading={false}
        error={null}
        onDecide={mockOnDecide}
        onReset={mockOnReset}
      />
    );

    expect(screen.getByText("Claim Denied")).toBeInTheDocument();
    expect(screen.getByText("CLAIM DENIED")).toBeInTheDocument();
    expect(screen.getByText("Policy criteria not met")).toBeInTheDocument();
  });
});

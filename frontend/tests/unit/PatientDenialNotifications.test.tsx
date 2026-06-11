import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PatientDenialNotifications } from "../../src/dashboards/patient/PatientDenialNotifications";
import { apiRequest } from "../../src/lib/api/client";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../src/lib/api/client", () => ({
  apiRequest: vi.fn(),
}));

describe("PatientDenialNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should render nothing when there are no denied claims", async () => {
    vi.mocked(apiRequest).mockResolvedValue([
      { id: "claim-1", status: "approved", claimReference: "REF-1" },
      { id: "claim-2", status: "received", claimReference: "REF-2" },
    ]);

    let container: any;
    await act(async () => {
      const result = render(<PatientDenialNotifications />);
      container = result.container;
    });

    expect(container.firstChild).toBeNull();
  });

  it("should render a notification card when a denied claim exists", async () => {
    vi.mocked(apiRequest).mockResolvedValue([
      {
        id: "claim-denied-1",
        status: "denied",
        claimReference: "REF-DENIED-99",
        decisionReason: "Patient not active on policy",
        decidedAt: "2026-06-11T12:00:00Z",
        createdAt: "2026-06-11T00:00:00Z",
      },
    ]);

    await act(async () => {
      render(<PatientDenialNotifications />);
    });

    expect(screen.getByText("Insurance Claim Policy Denial")).toBeInTheDocument();
    expect(screen.getByText("REF-DENIED-99")).toBeInTheDocument();
    expect(screen.getByText("Reason for Denial")).toBeInTheDocument();
    expect(screen.getByText("Patient not active on policy")).toBeInTheDocument();
    expect(screen.getByText(/MedGuard Privacy Guard/)).toBeInTheDocument();
  });

  it("should hide notification card when dismiss is clicked", async () => {
    vi.mocked(apiRequest).mockResolvedValue([
      {
        id: "claim-denied-1",
        status: "denied",
        claimReference: "REF-DENIED-99",
        decisionReason: "Policy expired",
        decidedAt: "2026-06-11T12:00:00Z",
      },
    ]);

    await act(async () => {
      render(<PatientDenialNotifications />);
    });

    expect(screen.getByText("Insurance Claim Policy Denial")).toBeInTheDocument();

    const dismissBtn = screen.getByRole("button", { name: "Dismiss" });
    await act(async () => {
      fireEvent.click(dismissBtn);
    });

    expect(screen.queryByText("Insurance Claim Policy Denial")).toBeNull();
    expect(JSON.parse(localStorage.getItem("medguard_dismissed_denials") || "[]")).toContain("claim-denied-1");
  });
});

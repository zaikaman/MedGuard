import React, { useState, useEffect } from "react";
import { StatusBadge } from "../../components/AppLayout";
import { apiRequest } from "../../lib/api/client";
import { InsurerClaim } from "../../features/claims/useInsurerClaimFlow";

export function PatientDenialNotifications() {
  const [deniedClaims, setDeniedClaims] = useState<InsurerClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedClaimIds, setDismissedClaimIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("medguard_dismissed_denials");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let active = true;
    const fetchDenials = async () => {
      try {
        const claims = await apiRequest<InsurerClaim[]>("/claims");
        if (active) {
          const denied = claims.filter((c) => c.status === "denied");
          setDeniedClaims(denied);
        }
      } catch (err) {
        console.error("Failed to fetch denied insurer claims:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDenials();
    return () => {
      active = false;
    };
  }, []);

  const handleDismiss = (claimId: string) => {
    const nextDismissed = [...dismissedClaimIds, claimId];
    setDismissedClaimIds(nextDismissed);
    try {
      localStorage.setItem("medguard_dismissed_denials", JSON.stringify(nextDismissed));
    } catch (err) {
      console.error("Failed to save dismissed claim to localStorage:", err);
    }
  };

  const visibleDenials = deniedClaims.filter((c) => !dismissedClaimIds.includes(c.id));

  if (loading || visibleDenials.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
      {visibleDenials.map((claim) => (
        <div
          key={claim.id}
          className="card-section"
          style={{
            borderColor: "rgba(220, 38, 38, 0.4)",
            borderLeft: "4px solid #DC2626",
            backgroundColor: "rgba(220, 38, 38, 0.03)",
          }}
        >
          <div className="card-title-container">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F87171",
                }}
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Insurance Claim Policy Denial
                </h3>
                <p className="card-subtitle" style={{ margin: 0 }}>
                  A claim eligibility evaluation has concluded in a denial
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StatusBadge status="denied" label="DENIED" />
              <button
                onClick={() => handleDismiss(claim.id)}
                className="btn btn-outline"
                style={{ padding: "4px 12px", fontSize: "0.8rem" }}
              >
                Dismiss
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>
                  Claim Reference
                </span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  {claim.claimReference}
                </span>
              </div>
              {claim.decidedAt && (
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block" }}>
                    Evaluation Date
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    {new Date(claim.decidedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {claim.decisionReason && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                }}
              >
                <strong style={{ display: "block", marginBottom: "4px", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  Reason for Denial
                </strong>
                {claim.decisionReason}
              </div>
            )}

            {/* Privacy Guard Notice */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                backgroundColor: "rgba(100, 116, 139, 0.05)",
                borderRadius: "var(--radius-sm)",
                border: "1px dashed rgba(100, 116, 139, 0.15)",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "14px", height: "14px", flexShrink: 0, color: "var(--role-patient-color)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>
                <strong>MedGuard Privacy Guard:</strong> Raw medical record contents or private health credentials were NOT disclosed to the insurer.
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PatientDenialNotifications;

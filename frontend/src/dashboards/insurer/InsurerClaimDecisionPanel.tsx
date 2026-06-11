import React, { useState } from "react";
import { StatusBadge } from "../../components/AppLayout";
import { InsurerClaim, InsurerClaimDecisionStatus } from "../../features/claims/useInsurerClaimFlow";

interface InsurerClaimDecisionPanelProps {
  claim: InsurerClaim;
  loading: boolean;
  error: string | null;
  onDecide: (status: InsurerClaimDecisionStatus, reason?: string) => Promise<void>;
  onReset: () => void;
}

export function InsurerClaimDecisionPanel({
  claim,
  loading,
  error,
  onDecide,
  onReset,
}: InsurerClaimDecisionPanelProps) {
  const [status, setStatus] = useState<InsurerClaimDecisionStatus>("approved");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onDecide(status, reason.trim() || undefined);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to record claim decision");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || submitting) {
    return (
      <div className="card-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px" }}>
        <div className="auth-loader-spinner" style={{ width: "36px", height: "36px" }} />
        <span style={{ marginTop: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Processing and committing claim decision...
        </span>
      </div>
    );
  }

  if (error || submitError) {
    const displayError = error || submitError;
    return (
      <div className="card-section" style={{ borderColor: "#DC2626" }}>
        <div className="card-title-container">
          <h2 className="card-title" style={{ color: "#F87171" }}>Decision Recording Failed</h2>
          <button onClick={onReset} className="btn btn-outline">Back</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            The claim decision could not be processed. Please check the network connectivity or try again.
          </p>
          <div
            style={{
              padding: "16px",
              backgroundColor: "rgba(220, 38, 38, 0.08)",
              border: "1px solid rgba(220, 38, 38, 0.2)",
              borderRadius: "var(--radius-md)",
              color: "#F87171",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          >
            Error: {displayError}
          </div>
        </div>
      </div>
    );
  }

  const getStatusDetails = () => {
    switch (claim.status) {
      case "approved":
        return {
          badgeStatus: "approved" as const,
          badgeLabel: "CLAIM APPROVED",
          titleColor: "var(--status-approved-text)",
          title: "Claim Approved",
          description: "This claim eligibility verification has been successfully verified, and the coverage claim has been approved by the insurer.",
          alertStyle: {
            backgroundColor: "rgba(22, 163, 74, 0.08)",
            border: "1px solid rgba(22, 163, 74, 0.2)",
            color: "#4ADE80",
          },
        };
      case "denied":
        return {
          badgeStatus: "denied" as const,
          badgeLabel: "CLAIM DENIED",
          titleColor: "var(--status-denied-text)",
          title: "Claim Denied",
          description: "This claim coverage check was processed and denied by the policy evaluation rules.",
          alertStyle: {
            backgroundColor: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.2)",
            color: "#F87171",
          },
        };
      case "needs_review":
        return {
          badgeStatus: "pending" as const,
          badgeLabel: "NEEDS REVIEW",
          titleColor: "var(--status-pending-text)",
          title: "Needs Review",
          description: "The eligibility details require manual review or audit by our medical billing board before confirmation.",
          alertStyle: {
            backgroundColor: "rgba(217, 119, 6, 0.08)",
            border: "1px solid rgba(217, 119, 6, 0.2)",
            color: "#FBBF24",
          },
        };
      case "received":
      default:
        return null;
    }
  };

  const statusDetails = getStatusDetails();

  // If the decision is already finalized
  if (statusDetails) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="card-section" style={{ borderLeft: `4px solid ${statusDetails.alertStyle.color}` }}>
          <div className="card-title-container">
            <div>
              <h2 className="card-title" style={{ color: statusDetails.titleColor }}>{statusDetails.title}</h2>
              <p className="card-subtitle">Insurer claim evaluation finalized</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <StatusBadge status={statusDetails.badgeStatus} label={statusDetails.badgeLabel} />
              <button onClick={onReset} className="btn btn-outline">New Claim</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ padding: "16px", borderRadius: "var(--radius-md)", ...statusDetails.alertStyle }}>
              <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>{statusDetails.description}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "8px" }}>
              <div className="form-group">
                <span className="form-label">Claim ID</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {claim.id}
                </span>
              </div>
              <div className="form-group">
                <span className="form-label">Claim Reference</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {claim.claimReference}
                </span>
              </div>
              <div className="form-group">
                <span className="form-label">Patient Profile ID</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  {claim.patientProfileId}
                </span>
              </div>
              {claim.decidedAt && (
                <div className="form-group">
                  <span className="form-label">Decision Timestamp</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    {new Date(claim.decidedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {claim.decisionReason && (
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <span className="form-label">Decision Reason / Comments</span>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.9rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {claim.decisionReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If the decision is still pending (status == "received")
  return (
    <div className="card-section">
      <div className="card-title-container">
        <div>
          <h2 className="card-title">Record Claim Decision</h2>
          <p className="card-subtitle">Select eligibility resolution status and comments</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <div className="form-group">
            <span className="form-label">Claim Reference</span>
            <span style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600 }}>
              {claim.claimReference}
            </span>
          </div>
          <div className="form-group">
            <span className="form-label">Presentation Proof ID</span>
            <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {claim.presentationProofId}
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Resolution Decision</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as InsurerClaimDecisionStatus)}
            style={{ width: "100%" }}
          >
            <option value="approved">Approve Claim (Eligible)</option>
            <option value="denied">Deny Claim (Not Eligible)</option>
            <option value="needs_review">Flag for Manual Auditor Review</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">
            Decision Reason / Comments {status !== "approved" && <span style={{ color: "#EF4444" }}>*</span>}
          </label>
          <textarea
            className="form-input"
            rows={4}
            placeholder={
              status === "approved"
                ? "e.g. Patient coverage confirmed via selective health credentials. (Optional)"
                : "Describe the reason for denial or manual review flag. (Required)"
            }
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ resize: "none" }}
            required={status !== "approved"}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
          <button type="button" onClick={onReset} className="btn btn-outline">
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              backgroundColor:
                status === "approved"
                  ? "var(--status-approved-bg)"
                  : status === "denied"
                  ? "var(--status-denied-bg)"
                  : "var(--status-pending-bg)",
              borderColor: "transparent",
              color: "#FFF",
            }}
          >
            {submitting ? "Saving..." : "Record Decision"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default InsurerClaimDecisionPanel;

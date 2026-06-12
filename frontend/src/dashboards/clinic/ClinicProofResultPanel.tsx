import React, { useState } from "react";
import { StatusBadge } from "../../components/AppLayout";
import { apiRequest } from "../../lib/api/client";
import { PresentationProof, ClaimVerification } from "../../features/presentations/useClinicPresentationFlow";

interface ClinicProofResultPanelProps {
  loading: boolean;
  error: string | null;
  presentation: PresentationProof | null;
  verification: ClaimVerification | null;
  onReset: () => void;
  patientProfileId: string;
}

export function ClinicProofResultPanel({
  loading,
  error,
  presentation,
  verification,
  onReset,
  patientProfileId,
}: ClinicProofResultPanelProps) {
  const [submittingReferral, setSubmittingReferral] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralType, setReferralType] = useState("Pediatric Specialist");
  const [referralNotes, setReferralNotes] = useState("");

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReferral(true);
    setReferralError(null);
    try {
      await apiRequest("/referrals", {
        method: "POST",
        body: JSON.stringify({
          patientProfileId,
          presentationProofId: presentation?.id,
          referralType,
          notes: referralNotes,
        }),
      });
      setReferralSuccess(true);
    } catch (err: any) {
      setReferralError(err.message || "Failed to submit referral");
    } finally {
      setSubmittingReferral(false);
    }
  };

  if (loading) {
    return (
      <div className="card-section" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px" }}>
        <div className="auth-loader-spinner" style={{ width: "36px", height: "36px" }} />
        <span style={{ marginTop: "16px", fontWeight: 600, color: "var(--text-secondary)" }}>
          Performing cryptographic verification inside TEE boundary...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-section" style={{ borderColor: "var(--status-denied-border)" }}>
        <div className="card-title-container">
          <h2 className="card-title" style={{ color: "var(--status-denied-text)" }}>Verification Failed</h2>
          <button onClick={onReset} className="btn btn-outline">New Request</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            The proof request could not be processed. This typically happens when the patient has not granted
            an active delegation matching the requested claim type and purpose.
          </p>
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--status-denied-bg)",
              border: "1px solid var(--status-denied-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--status-denied-text)",
              fontFamily: "monospace",
              fontSize: "0.85rem",
            }}
          >
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!verification) return null;

  const getStatusDetails = () => {
    switch (verification.result) {
      case "accepted":
        return {
          badgeStatus: "approved" as const,
          badgeLabel: "VERIFIED & APPROVED",
          titleColor: "var(--status-approved-text)",
          title: "Cryptographic Proof Verified",
          description: "The Patient Agent successfully presented a zero-knowledge proof of the health fact. No raw health record files were disclosed.",
          alertStyle: {
            backgroundColor: "var(--status-approved-bg)",
            border: "1px solid var(--status-approved-border)",
            color: "var(--status-approved-text)",
          },
        };
      case "denied":
        return {
          badgeStatus: "denied" as const,
          badgeLabel: "POLICY DENIED",
          titleColor: "var(--status-denied-text)",
          title: "Proof Generation Denied",
          description: "The Patient Agent rejected the disclosure request as it exceeded the patient's active sharing policy restrictions.",
          alertStyle: {
            backgroundColor: "var(--status-denied-bg)",
            border: "1px solid var(--status-denied-border)",
            color: "var(--status-denied-text)",
          },
        };
      case "expired":
        return {
          badgeStatus: "pending" as const,
          badgeLabel: "PROOF EXPIRED",
          titleColor: "var(--status-pending-text)",
          title: "Proof Validity Expired",
          description: "The presented proof has expired. The clinic can no longer query this data without initiating a fresh proof request.",
          alertStyle: {
            backgroundColor: "var(--status-pending-bg)",
            border: "1px solid var(--status-pending-border)",
            color: "var(--status-pending-text)",
          },
        };
      case "revoked":
        return {
          badgeStatus: "denied" as const,
          badgeLabel: "ACCESS REVOKED",
          titleColor: "var(--status-denied-text)",
          title: "Delegated Access Revoked",
          description: "The delegation governing this proof request was explicitly revoked by the patient prior to verification.",
          alertStyle: {
            backgroundColor: "var(--status-denied-bg)",
            border: "1px solid var(--status-denied-border)",
            color: "var(--status-denied-text)",
          },
        };
      case "unverifiable":
      default:
        return {
          badgeStatus: "denied" as const,
          badgeLabel: "VERIFICATION FAILED",
          titleColor: "var(--status-denied-text)",
          title: "Malformed or Unverifiable Proof",
          description: "The cryptographic proof signatures could not be verified. This may indicate a tampering attempt or mismatching key anchors.",
          alertStyle: {
            backgroundColor: "var(--status-denied-bg)",
            border: "1px solid var(--status-denied-border)",
            color: "var(--status-denied-text)",
          },
        };
    }
  };

  const status = getStatusDetails();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card-section" style={{ borderLeft: `4px solid ${status.alertStyle.color}` }}>
        <div className="card-title-container">
          <div>
            <h2 className="card-title" style={{ color: status.titleColor }}>{status.title}</h2>
            <p className="card-subtitle">Inter-agent verification session outcome</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <StatusBadge status={status.badgeStatus} label={status.badgeLabel} />
            <button onClick={onReset} className="btn btn-outline">New Request</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ padding: "16px", borderRadius: "var(--radius-md)", ...status.alertStyle }}>
            <p style={{ fontSize: "0.95rem", fontWeight: 500 }}>{status.description}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "8px" }}>
            <div className="form-group">
              <span className="form-label">Verification Session ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {verification.id}
              </span>
            </div>
            <div className="form-group">
              <span className="form-label">Presentation Hash Reference</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)", wordBreak: "break-all" }}>
                {presentation?.presentationHash || "N/A"}
              </span>
            </div>
            <div className="form-group">
              <span className="form-label">Verification Timestamp</span>
              <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                {new Date(verification.verifiedAt).toLocaleString()}
              </span>
            </div>
            {verification.reason && (
              <div className="form-group">
                <span className="form-label">Verification Reason</span>
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  {verification.reason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conditional Referral Box if Accepted */}
      {verification.result === "accepted" && (
        <div className="card-section">
          <div className="card-title-container">
            <div>
              <h2 className="card-title">Submit Specialty Referral</h2>
              <p className="card-subtitle">Refer patient based on verified credential proof</p>
            </div>
          </div>

          {referralSuccess ? (
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--status-approved-bg)",
                border: "1px solid var(--status-approved-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--status-approved-text)",
                fontSize: "0.95rem",
              }}
            >
              Referral submitted successfully to specialty network! The cryptographic presentation proof is attached.
            </div>
          ) : (
            <form onSubmit={handleSubmitReferral} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {referralError && (
                <div style={{ color: "var(--status-denied-text)", fontSize: "0.9rem" }}>{referralError}</div>
              )}
              <div className="form-group">
                <label className="form-label">Referral Specialty Type</label>
                <select
                  className="form-select"
                  value={referralType}
                  onChange={(e) => setReferralType(e.target.value)}
                >
                  <option value="Pediatric Specialist">Pediatric Specialist</option>
                  <option value="Immunologist">Immunologist</option>
                  <option value="Allergy & Asthma Center">Allergy & Asthma Center</option>
                  <option value="Clinical Genetics">Clinical Genetics</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Clinical Referral Notes (Operational Only - No PII)</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Immunization record verified. Requesting specialty evaluation."
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  style={{ resize: "none" }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submittingReferral}
                className="btn btn-primary"
                style={{ alignSelf: "flex-end" }}
              >
                {submittingReferral ? "Submitting..." : "Submit Referral Request"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
export default ClinicProofResultPanel;

import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "./AuthProvider";

export default function OnboardingPage() {
  const { createProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [organizationName, setOrganizationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect path after successful onboarding
  const from = (location.state as any)?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;
    if ((role === "clinic" || role === "insurer") && !organizationName) {
      setError("Organization name is required for clinics and insurers.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { profile, error: createError } = await createProfile(
        displayName,
        role,
        role === "patient" ? undefined : organizationName
      );

      if (createError) {
        throw createError;
      }

      if (profile) {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Failed to set up your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: "500px" }}>
        <div className="auth-header">
          <div className="auth-logo-dot" />
          <h1 className="auth-title">Complete Your Profile</h1>
          <p className="auth-description">Choose your role and set up your MedGuard profile</p>
        </div>

        {error && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              border: "1px solid #DC2626",
              borderRadius: "var(--radius-sm)",
              color: "#F87171",
              fontSize: "0.85rem",
              lineHeight: "1.4",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label htmlFor="displayName" className="form-label">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              className="form-input"
              placeholder="e.g. John Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Select Your Role</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <div
                onClick={() => !loading && setRole("patient")}
                style={{
                  padding: "14px 10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${role === "patient" ? "var(--role-patient-color)" : "var(--border-color)"}`,
                  backgroundColor: role === "patient" ? "var(--role-patient-bg)" : "var(--bg-primary)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--role-patient-color)",
                  }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: role === "patient" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  Patient
                </span>
              </div>

              <div
                onClick={() => !loading && setRole("clinic")}
                style={{
                  padding: "14px 10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${role === "clinic" ? "var(--role-clinic-color)" : "var(--border-color)"}`,
                  backgroundColor: role === "clinic" ? "var(--role-clinic-bg)" : "var(--bg-primary)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--role-clinic-color)",
                  }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: role === "clinic" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  Clinic
                </span>
              </div>

              <div
                onClick={() => !loading && setRole("insurer")}
                style={{
                  padding: "14px 10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${role === "insurer" ? "var(--role-insurer-color)" : "var(--border-color)"}`,
                  backgroundColor: role === "insurer" ? "var(--role-insurer-bg)" : "var(--bg-primary)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "var(--role-insurer-color)",
                  }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: role === "insurer" ? "var(--text-primary)" : "var(--text-secondary)" }}>
                  Insurer
                </span>
              </div>
            </div>
          </div>

          {(role === "clinic" || role === "insurer") && (
            <div className="form-group" style={{ animation: "fadeIn 0.3s ease" }}>
              <label htmlFor="organizationName" className="form-label">
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                className="form-input"
                placeholder={role === "clinic" ? "e.g. Raffle Medical Clinic" : "e.g. MetLife Insurance"}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", marginTop: "10px" }}>
            {loading ? (
              <>
                <div className="auth-loader-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", marginRight: "8px" }} />
                Initializing Agent Profile...
              </>
            ) : (
              "Complete Onboarding"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

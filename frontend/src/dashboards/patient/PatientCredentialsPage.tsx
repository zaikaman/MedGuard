import React, { useState, useEffect } from "react";
import { AppLayout, StatCard, StatusBadge, AuditLogRow } from "../../components/AppLayout";
import { apiRequest, ApiClientError } from "../../lib/api/client";
import { useAuth } from "../../auth/AuthProvider";
import PatientDenialNotifications from "./PatientDenialNotifications";

interface AgentIdentity {
  id: string;
  profileId: string;
  role: string;
  t3Did: string;
  status: "pending" | "active" | "suspended" | "failed";
  registeredAt?: string;
}

interface CredentialHash {
  id: string;
  patientProfileId: string;
  credentialType: string;
  issuerDid: string;
  credentialHash: string;
  status: "active" | "expired" | "revoked" | "superseded";
  expiresAt?: string;
}

interface Delegation {
  id: string;
  status: "active" | "expired" | "revoked";
}

export default function PatientCredentialsPage() {
  const { profile } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentIdentity | null>(null);
  const [credentials, setCredentials] = useState<CredentialHash[]>([]);
  const [delegationsCount, setDelegationsCount] = useState(0);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [credentialType, setCredentialType] = useState("Immunization history");
  const [issuerDid, setIssuerDid] = useState("did:t3n:hospital-clinic-a");
  const [credentialHash, setCredentialHash] = useState("");
  const [t3Reference, setT3Reference] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      // 1. Fetch Agent Identity
      let myAgent: AgentIdentity | null = null;
      try {
        myAgent = await apiRequest<AgentIdentity>("/agents/me");
        setAgent(myAgent);
      } catch (err: any) {
        if (err.status === 404) {
          setAgent(null);
        } else {
          throw err;
        }
      }

      // 2. Fetch Credentials (only if agent exists)
      if (myAgent) {
        const creds = await apiRequest<CredentialHash[]>("/credentials");
        setCredentials(creds);

        const dels = await apiRequest<Delegation[]>("/delegations");
        const activeDels = dels.filter((d) => d.status === "active").length;
        setDelegationsCount(activeDels);
      }
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterAgent = async () => {
    setRegistering(true);
    setActionError(null);
    try {
      const newAgent = await apiRequest<AgentIdentity>("/agents/register", {
        method: "POST",
        body: JSON.stringify({ role: "patient" }),
      });
      setAgent(newAgent);
      // Refresh credentials and delegations after registration
      const creds = await apiRequest<CredentialHash[]>("/credentials");
      setCredentials(creds);
    } catch (err: any) {
      setActionError(err.message || "Failed to register Patient Agent");
    } finally {
      setRegistering(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    
    // Auto-generate values if empty to keep onboarding smooth
    const finalHash = credentialHash || "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const finalRef = t3Reference || "t3ref-" + Math.random().toString(36).substring(2, 12);

    try {
      await apiRequest<CredentialHash>("/credentials/issue", {
        method: "POST",
        body: JSON.stringify({
          credentialType,
          issuerDid,
          credentialHash: finalHash,
          t3Reference: finalRef,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });

      // Reset Form
      setCredentialHash("");
      setT3Reference("");
      setExpiresAt("");
      setShowAddForm(false);

      // Refresh credentials list
      const creds = await apiRequest<CredentialHash[]>("/credentials");
      setCredentials(creds);
    } catch (err: any) {
      setActionError(err.message || "Failed to import credential");
    }
  };

  if (loading) {
    return (
      <div className="auth-loader-container">
        <div className="auth-loader-spinner" />
        <div className="auth-loader-text">Loading patient dashboard...</div>
      </div>
    );
  }

  const activeCredentials = credentials.filter((c) => c.status === "active").length;

  return (
    <AppLayout>
      {/* Insurer denial notifications */}
      <PatientDenialNotifications />

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard title="Active credentials" value={activeCredentials} />
        <StatCard title="Total credentials" value={credentials.length} />
        <StatCard title="Active delegations" value={delegationsCount} />
      </div>

      {actionError && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            border: "1px solid #DC2626",
            borderRadius: "var(--radius-md)",
            color: "#F87171",
            fontSize: "0.95rem",
          }}
        >
          {actionError}
        </div>
      )}

      {/* Onboarding Panel if Agent doesn't exist */}
      {!agent ? (
        <div className="card-section">
          <div className="card-title-container">
            <div>
              <h2 className="card-title">Onboard Patient Agent</h2>
              <p className="card-subtitle">
                Establish your secure identity anchor and Terminal 3 DID inside the TEE boundary.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "flex-start" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              MedGuard creates a dedicated agent for you. This agent holds your decentralized identifier (DID)
              and enforces sharing policies so that clinics and insurers never see your raw medical records.
            </p>
            <button
              onClick={handleRegisterAgent}
              disabled={registering}
              className="btn btn-primary"
              style={{ padding: "12px 24px" }}
            >
              {registering ? (
                <>
                  <div className="auth-loader-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px", marginRight: "8px" }} />
                  Provisioning Agent...
                </>
              ) : (
                "Onboard Secure Patient Agent"
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Agent Info Section */
        <div className="card-section">
          <div className="card-title-container">
            <div>
              <h2 className="card-title">Secure Patient Agent</h2>
              <p className="card-subtitle">Operational status within TEE boundary</p>
            </div>
            <StatusBadge status="active" label="Active" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">Terminal 3 DID</label>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  wordBreak: "break-all",
                }}
              >
                {agent.t3Did}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Onboarding Date</label>
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}
              >
                {agent.registeredAt ? new Date(agent.registeredAt).toLocaleString() : "Recently Registered"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Management Portfolio */}
      {agent && (
        <div className="card-section">
          <div className="card-title-container">
            <div>
              <h2 className="card-title">Verifiable Credentials</h2>
              <p className="card-subtitle">Health facts cryptographically anchored in Terminal 3</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn btn-outline"
            >
              {showAddForm ? "Cancel" : "Import Credential"}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddCredential} style={{ display: "flex", flexDirection: "column", gap: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Credential Type</label>
                  <select
                    className="form-select"
                    value={credentialType}
                    onChange={(e) => setCredentialType(e.target.value)}
                  >
                    <option value="Immunization history">Immunization history</option>
                    <option value="Allergy history">Allergy history</option>
                    <option value="Insurance history">Insurance history</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Issuer DID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={issuerDid}
                    onChange={(e) => setIssuerDid(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Credential Hash (Optional - auto-generated if empty)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0x..."
                    value={credentialHash}
                    onChange={(e) => setCredentialHash(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">T3 Reference (Optional - auto-generated if empty)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="opaque-ref-id"
                    value={t3Reference}
                    onChange={(e) => setT3Reference(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end", marginTop: "8px" }}>
                Import Credential Metadata
              </button>
            </form>
          )}

          {credentials.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
              No health credentials imported yet. Click "Import Credential" to link your medical records securely.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px",
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span style={{ fontWeight: 600, fontSize: "1rem" }}>{cred.credentialType}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                      Issuer: {cred.issuerDid}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      Hash: {cred.credentialHash}
                    </span>
                  </div>
                  <StatusBadge
                    status={cred.status === "active" ? "verified" : cred.status === "expired" ? "pending" : "denied"}
                    label={cred.status.toUpperCase()}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}

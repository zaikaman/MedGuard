import React, { useState, useEffect } from "react";
import { AppLayout, StatCard, StatusBadge } from "../../components/AppLayout";
import { useInsurerClaimFlow, InsurerClaim, InsurerClaimDecisionStatus } from "../../features/claims/useInsurerClaimFlow";
import { InsurerClaimDecisionPanel } from "./InsurerClaimDecisionPanel";
import { apiRequest } from "../../lib/api/client";

interface Delegation {
  id: string;
  patientProfileId: string;
  recipientProfileId: string;
  purpose: string;
  allowedClaimTypes: string[];
  status: "active" | "expired" | "revoked";
  expiresAt: string;
}

export default function InsurerEligibilityPage() {
  const {
    loading,
    error,
    agent,
    presentation,
    verification,
    fetchAgent,
    registerAgent,
    generatePresentation,
    verifyEligibility,
    decideClaim,
    resetFlow,
  } = useInsurerClaimFlow();

  // Component states
  const [initializing, setInitializing] = useState(true);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [selectedDelegationId, setSelectedDelegationId] = useState("");
  const [patientProfileId, setPatientProfileId] = useState("");
  const [claimReference, setClaimReference] = useState("");
  const [requestedClaimType, setRequestedClaimType] = useState("eligibility");
  const [purpose, setPurpose] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Claim specific state
  const [localClaim, setLocalClaim] = useState<InsurerClaim | null>(null);

  // Stats Counters
  const [claimsCount, setClaimsCount] = useState(0);
  const [activeDelegationsCount, setActiveDelegationsCount] = useState(0);
  const [decisionsCount, setDecisionsCount] = useState(0);

  const initAgentAndDelegations = async () => {
    setInitializing(true);
    try {
      const activeAgent = await fetchAgent();
      if (activeAgent) {
        // Fetch delegations addressed to this insurer
        const dels = await apiRequest<Delegation[]>("/delegations");
        setDelegations(dels);

        // Fetch existing claims to populate stats
        const claims = await apiRequest<InsurerClaim[]>("/claims");
        setClaimsCount(claims.length);
        
        const activeDels = dels.filter((d) => d.status === "active");
        setActiveDelegationsCount(activeDels.length);

        const decided = claims.filter((c) => c.status !== "received");
        setDecisionsCount(decided.length);
      }
    } catch (err) {
      console.error("Initialization failed:", err);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    initAgentAndDelegations();
  }, []);

  const handleRegister = async () => {
    try {
      await registerAgent();
      const dels = await apiRequest<Delegation[]>("/delegations");
      setDelegations(dels);
      setActiveDelegationsCount(dels.filter((d) => d.status === "active").length);
    } catch (err) {
      console.error("Agent registration failed:", err);
    }
  };

  const handleDelegationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const delId = e.target.value;
    setSelectedDelegationId(delId);

    if (delId === "manual") {
      setShowManualEntry(true);
      setPatientProfileId("");
      setPurpose("");
      return;
    }

    const delegation = delegations.find((d) => d.id === delId);
    if (delegation) {
      setShowManualEntry(false);
      setPatientProfileId(delegation.patientProfileId);
      // Backend assert expects eligibility or coverage
      const preferredType = delegation.allowedClaimTypes.find(
        (t) => t.toLowerCase() === "eligibility" || t.toLowerCase() === "coverage"
      ) || "eligibility";
      setRequestedClaimType(preferredType);
      setPurpose(delegation.purpose);
    } else {
      setShowManualEntry(false);
      setPatientProfileId("");
      setPurpose("");
    }
  };

  const handleVerifyAndCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientProfileId || !purpose || !claimReference) return;

    try {
      // 1. Generate selective ZK presentation proof
      const proof = await generatePresentation({
        patientProfileId,
        delegationId: selectedDelegationId === "manual" ? "" : selectedDelegationId,
        requestedClaimType,
        purpose,
      });

      if (proof) {
        // 2. Verify eligibility proof
        const verif = await verifyEligibility(proof.id);

        // 3. If accepted, create the insurer claim row
        if (verif && verif.result === "accepted") {
          const createdClaim = await apiRequest<InsurerClaim>("/claims", {
            method: "POST",
            body: JSON.stringify({
              patientProfileId,
              presentationProofId: proof.id,
              claimReference,
            }),
          });
          setLocalClaim(createdClaim);
          setClaimsCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Verification or claim creation failed:", err);
    }
  };

  const handleDecide = async (status: InsurerClaimDecisionStatus, reason?: string) => {
    if (!localClaim) return;
    const decided = await decideClaim({
      claimId: localClaim.id,
      status,
      decisionReason: reason,
    });
    setLocalClaim(decided);
    setDecisionsCount((prev) => prev + 1);
  };

  const handleReset = () => {
    resetFlow();
    setLocalClaim(null);
    setClaimReference("");
    setPurpose("");
    setSelectedDelegationId("");
    setPatientProfileId("");
  };

  if (initializing) {
    return (
      <div className="auth-loader-container">
        <div className="auth-loader-spinner" />
        <div className="auth-loader-text">Loading insurer dashboard...</div>
      </div>
    );
  }

  // Onboarding state
  if (!agent) {
    return (
      <AppLayout>
        <div className="dashboard-header-container">
          <div>
            <h1 className="dashboard-title">Insurer Dashboard</h1>
            <p className="dashboard-subtitle">Manage claims and eligibility verification sessions</p>
          </div>
        </div>

        <div className="card-section" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "40px 24px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "rgba(100, 116, 139, 0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px auto",
              color: "var(--role-insurer-color)",
            }}
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "32px", height: "32px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>
            Register Insurer Agent Identity
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "0.95rem", lineHeight: 1.6 }}>
            To process patient eligibility verifications, you must register a secure Terminal 3 Decentralized Identifier (DID) representing your insurer organization.
          </p>
          <button onClick={handleRegister} disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
            {loading ? "Registering Agent..." : "Register Secure DID"}
          </button>
        </div>
      </AppLayout>
    );
  }

  const activeDelegationsList = delegations.filter((d) => d.status === "active");

  return (
    <AppLayout>
      <div className="dashboard-header-container">
        <div>
          <h1 className="dashboard-title">Insurer Dashboard</h1>
          <p className="dashboard-subtitle">Verified inter-agent eligibility verification & claim processing</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 700 }}>
            Insurer DID
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--role-insurer-color)" }}>
            {agent.t3Did}
          </span>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="stats-grid">
        <StatCard title="Active Access Grants" value={activeDelegationsCount} />
        <StatCard title="Total Claims Loaded" value={claimsCount} />
        <StatCard title="Decisions Recorded" value={decisionsCount} />
      </div>

      {/* Main content grid */}
      <div style={{ marginTop: "32px" }}>
        {localClaim ? (
          <InsurerClaimDecisionPanel
            claim={localClaim}
            loading={loading}
            error={error}
            onDecide={handleDecide}
            onReset={handleReset}
          />
        ) : verification && verification.result !== "accepted" ? (
          /* Verification Failed / Denied Display */
          <div className="card-section" style={{ borderColor: "#DC2626" }}>
            <div className="card-title-container">
              <div>
                <h2 className="card-title" style={{ color: "#F87171" }}>Verification Unsuccessful</h2>
                <p className="card-subtitle">Cryptographic presentation policy rejected or failed</p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <StatusBadge status={verification.result === "expired" ? "pending" : "denied"} label={verification.result.toUpperCase()} />
                <button onClick={handleReset} className="btn btn-outline">New Request</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                  borderRadius: "var(--radius-md)",
                  color: "#F87171",
                  fontSize: "0.95rem",
                }}
              >
                <strong>Result: {verification.result}</strong>
                <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                  {verification.reason || "The Zero-Knowledge proof could not be verified or was rejected by patient sharing policies."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "8px" }}>
                <div className="form-group">
                  <span className="form-label">Verification Session ID</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {verification.id}
                  </span>
                </div>
                <div className="form-group">
                  <span className="form-label">Presentation Proof ID</span>
                  <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {presentation?.id || "N/A"}
                  </span>
                </div>
                <div className="form-group">
                  <span className="form-label">Timestamp</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                    {new Date(verification.verifiedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal request form */
          <div className="card-section">
            <div className="card-title-container">
              <div>
                <h2 className="card-title">Initiate Eligibility Verification</h2>
                <p className="card-subtitle">Verify selective patient health credentials using inter-agent protocols</p>
              </div>
            </div>

            {error && (
              <div style={{ padding: "12px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-sm)", color: "#F87171", marginBottom: "20px", fontSize: "0.9rem" }}>
                Error: {error}
              </div>
            )}

            <form onSubmit={handleVerifyAndCreateClaim} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Active Patient Delegations</label>
                <select
                  className="form-select"
                  value={selectedDelegationId}
                  onChange={handleDelegationSelect}
                  style={{ width: "100%" }}
                >
                  <option value="">-- Select Active Delegation --</option>
                  {activeDelegationsList.map((del) => (
                    <option key={del.id} value={del.id}>
                      Purpose: "{del.purpose}" (Allows: {del.allowedClaimTypes.join(", ")})
                    </option>
                  ))}
                  <option value="manual">-- Manual Entry (Custom/Policy Test) --</option>
                </select>
              </div>

              {(selectedDelegationId || showManualEntry) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                    <div className="form-group">
                      <label htmlFor="patientProfileId" className="form-label">Patient Profile ID</label>
                      <input
                        id="patientProfileId"
                        type="text"
                        className="form-input"
                        placeholder="e.g. 00000000-0000-4000-8000-000000000001"
                        value={patientProfileId}
                        onChange={(e) => setPatientProfileId(e.target.value)}
                        readOnly={!showManualEntry}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="claimReference" className="form-label">Claim Reference Number</label>
                      <input
                        id="claimReference"
                        type="text"
                        className="form-input"
                        placeholder="e.g. CLM-90812-US2"
                        value={claimReference}
                        onChange={(e) => setClaimReference(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                    <div className="form-group">
                      <label htmlFor="requestedClaimType" className="form-label">Requested Claim Type</label>
                      {showManualEntry ? (
                        <input
                          id="requestedClaimType"
                          type="text"
                          className="form-input"
                          placeholder="e.g. eligibility"
                          value={requestedClaimType}
                          onChange={(e) => setRequestedClaimType(e.target.value)}
                          required
                        />
                      ) : (
                        <select
                          id="requestedClaimType"
                          className="form-select"
                          value={requestedClaimType}
                          onChange={(e) => setRequestedClaimType(e.target.value)}
                          style={{ width: "100%" }}
                        >
                          <option value="eligibility">Eligibility</option>
                          <option value="coverage">Coverage</option>
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label htmlFor="purpose" className="form-label">Verification Purpose</label>
                      <input
                        id="purpose"
                        type="text"
                        className="form-input"
                        placeholder="e.g. Insurer eligibility check"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        readOnly={!showManualEntry}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ alignSelf: "flex-end", marginTop: "12px" }}
                  >
                    {loading ? "Verifying Proof..." : "Verify & Process Claim"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

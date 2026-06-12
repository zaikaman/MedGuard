import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute, RoleRedirect } from "./routes/ProtectedRoute";
import LoginPage from "./auth/LoginPage";
import OnboardingPage from "./auth/OnboardingPage";
import PatientCredentialsPage from "./dashboards/patient/PatientCredentialsPage";
import ClinicProofRequestPage from "./dashboards/clinic/ClinicProofRequestPage";
import InsurerEligibilityPage from "./dashboards/insurer/InsurerEligibilityPage";
import { AppLayout } from "./components/AppLayout";
import "./styles/theme.css";

// Premium placeholder component for features to be implemented in User Story 3
function FeaturePlaceholder({ title, subtitle, description }: { title: string; subtitle: string; description: string }) {
  return (
    <AppLayout>
      <div className="card-section" style={{ maxWidth: "600px", margin: "40px auto", textAlign: "center", padding: "40px 24px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            backgroundColor: "rgba(24, 95, 165, 0.1)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px auto",
            color: "var(--role-color, var(--primary-blue))",
          }}
        >
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: "32px", height: "32px" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "12px", color: "var(--text-primary)" }}>
          {title}
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "8px", fontSize: "0.95rem", fontWeight: 600 }}>
          {subtitle}
        </p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          {description}
        </p>
      </div>
    </AppLayout>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Onboarding Profile Setup Route */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Root redirecting based on authentication and profile roles */}
          <Route path="/" element={<RoleRedirect />} />

          {/* Patient Views */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientCredentialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/credentials"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientCredentialsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/delegations"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <FeaturePlaceholder
                  title="Access Delegations"
                  subtitle="User Story 3 Capability"
                  description="Delegation of health credential sharing permissions, allowing specific clinics and insurers to request zero-knowledge proofs on your behalf, will be fully enabled in the next stage."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/audit"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <FeaturePlaceholder
                  title="Patient Audit Log"
                  subtitle="User Story 3 Capability"
                  description="Realtime monitoring of all verification checks, credential access history, and inter-agent messages will be fully populated in the audit trail database."
                />
              </ProtectedRoute>
            }
          />

          {/* Clinic Views */}
          <Route
            path="/clinic"
            element={
              <ProtectedRoute allowedRoles={["clinic"]}>
                <ClinicProofRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/requests"
            element={
              <ProtectedRoute allowedRoles={["clinic"]}>
                <ClinicProofRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/referrals"
            element={
              <ProtectedRoute allowedRoles={["clinic"]}>
                <FeaturePlaceholder
                  title="Clinical Referrals"
                  subtitle="User Story 3 Capability"
                  description="Patient clinical referral generation, credential validation requests, and inter-clinic policy configurations are slated for full integration in the upcoming milestones."
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/audit"
            element={
              <ProtectedRoute allowedRoles={["clinic"]}>
                <FeaturePlaceholder
                  title="Clinic Audit Log"
                  subtitle="User Story 3 Capability"
                  description="Cryptographic audit event log capturing proof requests, patient disclosures, and agent-to-agent channel state will be displayed in this panel."
                />
              </ProtectedRoute>
            }
          />

          {/* Insurer Views */}
          <Route
            path="/insurer"
            element={
              <ProtectedRoute allowedRoles={["insurer"]}>
                <InsurerEligibilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insurer/claims"
            element={
              <ProtectedRoute allowedRoles={["insurer"]}>
                <InsurerEligibilityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insurer/audit"
            element={
              <ProtectedRoute allowedRoles={["insurer"]}>
                <FeaturePlaceholder
                  title="Insurer Audit Log"
                  subtitle="User Story 3 Capability"
                  description="Auditable log of all eligibility requests, selective disclosure verifications, and claim resolution states will be available here."
                />
              </ProtectedRoute>
            }
          />

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);

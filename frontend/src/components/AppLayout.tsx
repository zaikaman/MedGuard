import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth, Role } from "../auth/AuthProvider";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Reusable Stat Card Component
export function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span className="stat-title">{title}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// Reusable Status Badge Component
type BadgeStatus = "verified" | "active" | "approved" | "pending" | "denied";

export function StatusBadge({ status, label }: { status: BadgeStatus; label: string }) {
  // Simple inline icons for visual excellence
  const renderIcon = () => {
    switch (status) {
      case "verified":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
        );
      case "active":
        return (
          <svg viewBox="0 0 8 8" fill="currentColor">
            <circle cx="4" cy="4" r="3" />
          </svg>
        );
      case "approved":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        );
      case "pending":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "denied":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
    }
  };

  return (
    <span className={`badge badge-${status}`}>
      {renderIcon()}
      {label}
    </span>
  );
}

// Reusable Audit Log Row Component
export function AuditLogRow({
  severity,
  title,
  subtitle,
  timestamp,
}: {
  severity: "info" | "warning" | "critical" | "success";
  title: string;
  subtitle: string;
  timestamp: string;
}) {
  const getIconClass = () => {
    switch (severity) {
      case "success":
        return "audit-log-icon-green";
      case "warning":
        return "audit-log-icon-amber";
      case "critical":
        return "audit-log-icon-red";
      case "info":
      default:
        return "audit-log-icon-blue";
    }
  };

  const getIcon = () => {
    switch (severity) {
      case "success":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        );
      case "warning":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "critical":
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        );
    }
  };

  return (
    <div className="audit-log-row">
      <div className="audit-log-left">
        <div className={`audit-log-icon ${getIconClass()}`}>
          {getIcon()}
        </div>
        <div className="audit-log-details">
          <span className="audit-log-title">{title}</span>
          <span className="audit-log-subtitle">{subtitle}</span>
        </div>
      </div>
      <div className="audit-log-time">{timestamp}</div>
    </div>
  );
}

// Main App Layout Primitive
export function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const role = profile?.role || "patient";
  const displayName = profile?.display_name || "Anonymous";
  const organizationName = profile?.organization_name;

  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Dynamic Theme Styling Mapping
  const roleTheme = {
    patient: {
      "--role-color": "var(--role-patient-color)",
      "--role-bg": "var(--role-patient-bg)",
      "--role-border": "var(--role-patient-border)",
      label: "Patient",
      description: "Blue — trust, calm, primary actor in the system",
      links: [
        { label: "Dashboard", path: "/patient" },
        { label: "Credentials", path: "/patient/credentials" },
        { label: "Delegations", path: "/patient/delegations" },
        { label: "Audit log", path: "/patient/audit" },
      ],
    },
    clinic: {
      "--role-color": "var(--role-clinic-color)",
      "--role-bg": "var(--role-clinic-bg)",
      "--role-border": "var(--role-clinic-border)",
      label: "Clinic",
      description: "Teal — care, action, data requestor",
      links: [
        { label: "Dashboard", path: "/clinic" },
        { label: "Requests", path: "/clinic/requests" },
        { label: "Referrals", path: "/clinic/referrals" },
        { label: "Audit log", path: "/clinic/audit" },
      ],
    },
    insurer: {
      "--role-color": "var(--role-insurer-color)",
      "--role-bg": "var(--role-insurer-bg)",
      "--role-border": "var(--role-insurer-border)",
      label: "Insurer",
      description: "Purple — authority, institutional, decision maker",
      links: [
        { label: "Dashboard", path: "/insurer" },
        { label: "Claims", path: "/insurer/claims" },
        { label: "Audit log", path: "/insurer/audit" },
      ],
    },
  }[role];

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/login");
    }
  };

  return (
    <div className="layout-container" style={roleTheme as React.CSSProperties}>
      {/* Navigation Bar */}
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-dot" />
          MedGuard
        </Link>

        <div className="navbar-nav">
          {roleTheme.links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
              end
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar-actions" style={{ position: "relative" }}>
          {organizationName && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {organizationName}
            </span>
          )}
          <div
            className="user-avatar-badge"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Profile options"
          >
            {initials}
          </div>

          {dropdownOpen && (
            <div
              style={{
                position: "absolute",
                top: "46px",
                right: 0,
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "8px",
                minWidth: "180px",
                zIndex: 100,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ padding: "8px", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{displayName}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {role} profile
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="btn btn-danger"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  fontSize: "0.85rem",
                  justifyContent: "flex-start",
                }}
              >
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  style={{ width: "16px", height: "16px" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="layout-main">
        {/* Role Accent Banner */}
        <div className="role-banner">
          <div className="role-banner-dot" />
          <div className="role-banner-text">
            <span className="role-banner-label">{roleTheme.label}</span>
            <span style={{ color: "var(--text-secondary)" }}>— {roleTheme.description}</span>
          </div>
        </div>

        {/* Dashboard Child View */}
        {children}
      </main>
    </div>
  );
}

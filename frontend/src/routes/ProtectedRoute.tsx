import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, Role } from "../auth/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading, onboarding } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loader-container">
        <div className="auth-loader-spinner" />
        <div className="auth-loader-text">Securing session...</div>
      </div>
    );
  }

  // 1. Unauthenticated users -> Redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Onboarding required -> Redirect to onboarding page
  if (onboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // 3. User is onboarded but is trying to access the onboarding page -> Redirect to their dashboard
  if (!onboarding && location.pathname === "/onboarding" && profile) {
    return <Navigate to={getDashboardRoute(profile.role)} replace />;
  }

  // 4. Role authorization check
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect unauthorized user to their own role dashboard
    return <Navigate to={getDashboardRoute(profile.role)} replace />;
  }

  return <>{children}</>;
}

/**
 * Helper to determine the dashboard root path for each app role
 */
export function getDashboardRoute(role: Role): string {
  switch (role) {
    case "patient":
      return "/patient";
    case "clinic":
      return "/clinic";
    case "insurer":
      return "/insurer";
    default:
      return "/login";
  }
}

/**
 * Shell component that redirects logged-in users to their appropriate role-specific dashboard.
 * Map this to `/` or `/dashboard` to automatically route users when they arrive.
 */
export function RoleRedirect() {
  const { user, profile, loading, onboarding } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loader-container">
        <div className="auth-loader-spinner" />
        <div className="auth-loader-text">Routing...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (onboarding) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  if (profile) {
    return <Navigate to={getDashboardRoute(profile.role)} replace />;
  }

  return <Navigate to="/login" replace />;
}

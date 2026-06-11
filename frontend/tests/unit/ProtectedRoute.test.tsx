import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute, RoleRedirect } from "../../src/routes/ProtectedRoute";
import { useAuth } from "../../src/auth/AuthProvider";

vi.mock("../../src/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("ProtectedRoute & RoleRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- ProtectedRoute Tests ---

  it("should show loading spinner when auth loading is true", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      profile: null,
      loading: true,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Securing session...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should redirect to /login when user is not logged in", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      profile: null,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/patient"]}>
        <Routes>
          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <div>Patient Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Patient Page")).not.toBeInTheDocument();
  });

  it("should redirect to /onboarding when user needs onboarding", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "test-user-id" } as any,
      session: {} as any,
      profile: null,
      loading: false,
      onboarding: true,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/patient"]}>
        <Routes>
          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <div>Patient Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
    expect(screen.queryByText("Patient Page")).not.toBeInTheDocument();
  });

  it("should block and redirect based on role restrictions", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "test-user-id" } as any,
      session: {} as any,
      profile: { role: "clinic", display_name: "Dr. Smith", id: "1" } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/patient"]}>
        <Routes>
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <div>Patient Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/clinic" element={<div>Clinic Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Dr. Smith has role 'clinic', but accesses '/patient' (restricted to 'patient').
    // Should get redirected to '/clinic'.
    expect(screen.getByText("Clinic Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Patient Page")).not.toBeInTheDocument();
  });

  it("should render content when authenticated and role matches", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "test-user-id" } as any,
      session: {} as any,
      profile: { role: "patient", display_name: "John Doe", id: "1" } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/patient"]}>
        <ProtectedRoute allowedRoles={["patient"]}>
          <div>Patient Page</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Patient Page")).toBeInTheDocument();
  });

  // --- RoleRedirect Tests ---

  it("should route logged-in patient to /patient", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "test" } as any,
      session: {} as any,
      profile: { role: "patient" } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/patient" element={<div>Patient View</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Patient View")).toBeInTheDocument();
  });

  it("should route logged-in clinic to /clinic", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "test" } as any,
      session: {} as any,
      profile: { role: "clinic" } as any,
      loading: false,
      onboarding: false,
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      signOut: vi.fn(),
      createProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<RoleRedirect />} />
          <Route path="/clinic" element={<div>Clinic View</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Clinic View")).toBeInTheDocument();
  });
});

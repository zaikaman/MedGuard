import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../src/auth/AuthProvider";
import { supabase } from "../../src/lib/supabase";

// Mock Supabase client
vi.mock("../../src/lib/supabase", () => {
  const authMock = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signOut: vi.fn(),
  };

  const fromMock = vi.fn();

  return {
    supabase: {
      auth: authMock,
      from: fromMock,
    },
  };
});

describe("AuthProvider", () => {
  const mockUser = { id: "test-user-uuid", email: "patient@medguard.com" };
  const mockSession = { user: mockUser, access_token: "mock-token" };
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default setup for onAuthStateChange
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    } as any);

    // Default getSession resolves to no session
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it("should initialize with loading: true and then loading: false", async () => {
    let resolveSession: (value: any) => void = () => {};
    const sessionPromise = new Promise((resolve) => {
      resolveSession = resolve;
    });
    
    vi.mocked(supabase.auth.getSession).mockReturnValue(sessionPromise as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveSession({ data: { session: null }, error: null });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it("should set onboarding to true if user is logged in but has no profile", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    });

    // Mock profiles check to return no profile
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for async initialization
    await act(async () => {
      await Promise.resolve(); // flush microtasks
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.onboarding).toBe(true);
    expect(result.current.profile).toBeNull();
  });

  it("should load profile and set onboarding to false if profile exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession as any },
      error: null,
    });

    const mockProfile = {
      id: "test-user-uuid",
      role: "patient",
      display_name: "John Doe",
      organization_name: null,
      created_at: "2026-06-11T00:00:00Z",
      updated_at: "2026-06-11T00:00:00Z",
    };

    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.onboarding).toBe(false);
  });

  it("should sign in with OTP", async () => {
    vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({ data: {} as any, error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.signInWithOtp("patient@medguard.com");
    });

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "patient@medguard.com",
      options: { emailRedirectTo: expect.any(String) },
    });
    expect(response).toEqual({ error: null });
  });

  it("should verify OTP and load profile", async () => {
    vi.mocked(supabase.auth.verifyOtp).mockResolvedValue({
      data: { session: mockSession as any, user: mockUser as any },
      error: null,
    });

    const mockProfile = {
      id: "test-user-uuid",
      role: "patient",
      display_name: "John Doe",
    };
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let response: any;
    await act(async () => {
      response = await result.current.verifyOtp("patient@medguard.com", "123456");
    });

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: "patient@medguard.com",
      token: "123456",
      type: "email",
    });
    expect(response.error).toBeNull();
    expect(response.session).toEqual(mockSession);
  });

  it("should sign out and reset state", async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
    expect(result.current.onboarding).toBe(false);
  });
});

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Role = "patient" | "clinic" | "insurer";

export interface Profile {
  id: string;
  role: Role;
  display_name: string;
  organization_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  onboarding: boolean;
  signInWithOtp: (email: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ session: Session | null; error: Error | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  createProfile: (displayName: string, role: Role, organizationName?: string) => Promise<{ profile: Profile | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

  const currentUserRef = useRef<User | null>(null);
  const currentProfileRef = useRef<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        setProfile(null);
        currentProfileRef.current = null;
        setOnboarding(false);
        return null;
      }

      if (data) {
        const p = data as Profile;
        setProfile(p);
        currentProfileRef.current = p;
        setOnboarding(false);
        return p;
      } else {
        setProfile(null);
        currentProfileRef.current = null;
        setOnboarding(true);
        return null;
      }
    } catch (e) {
      console.error("Exception during profile fetch:", e);
      setProfile(null);
      currentProfileRef.current = null;
      setOnboarding(false);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // Handle session updates and initial check
  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        }

        if (!active) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          currentUserRef.current = initialSession.user;
          await fetchProfile(initialSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          currentUserRef.current = null;
          setProfile(null);
          currentProfileRef.current = null;
          setOnboarding(false);
        }
      } catch (e) {
        console.error("Error in checkSession:", e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!active) return;
      
      const nextUser = currentSession?.user ?? null;
      setSession(currentSession);
      setUser(nextUser);

      if (nextUser) {
        const isNewUser = currentUserRef.current?.id !== nextUser.id;
        const hasNoProfile = !currentProfileRef.current && !onboarding;

        currentUserRef.current = nextUser;

        if (isNewUser || hasNoProfile) {
          const shouldSetLoading = !currentProfileRef.current;
          if (shouldSetLoading) {
            setLoading(true);
          }
          await fetchProfile(nextUser.id);
          if (shouldSetLoading) {
            setLoading(false);
          }
        }
      } else {
        currentUserRef.current = null;
        setProfile(null);
        currentProfileRef.current = null;
        setOnboarding(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithOtp = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  }, []);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        return { session: null, error };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        currentUserRef.current = data.session.user;
        const userProfile = await fetchProfile(data.session.user.id);
        return { session: data.session, error: null };
      }

      return { session: null, error: new Error("No session returned from OTP verification") };
    } catch (err: any) {
      return { session: null, error: err };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setUser(null);
      currentUserRef.current = null;
      setProfile(null);
      currentProfileRef.current = null;
      setOnboarding(false);
    }
    return { error };
  }, []);

  const createProfile = useCallback(async (displayName: string, role: Role, organizationName?: string) => {
    if (!user) {
      return { profile: null, error: new Error("User must be authenticated to create a profile") };
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          role,
          display_name: displayName,
          organization_name: role === "patient" ? null : organizationName || null,
        })
        .select()
        .single();

      if (error) {
        return { profile: null, error };
      }

      if (data) {
        const newProfile = data as Profile;
        setProfile(newProfile);
        currentProfileRef.current = newProfile;
        setOnboarding(false);
        return { profile: newProfile, error: null };
      }

      return { profile: null, error: new Error("Failed to insert profile record") };
    } catch (err: any) {
      return { profile: null, error: err };
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        onboarding,
        signInWithOtp,
        verifyOtp,
        signOut,
        createProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

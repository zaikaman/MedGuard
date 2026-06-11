import { useState, useCallback } from "react";
import { apiRequest } from "../../lib/api/client";
import { Role } from "../../auth/AuthProvider";

export interface AgentIdentity {
  id: string;
  profileId: string;
  role: Role;
  t3Did: string;
  status: "pending" | "active" | "suspended" | "failed";
}

export interface PresentationProof {
  id: string;
  proofRequestId: string;
  presentationHash: string;
  verificationStatus: "generated" | "verified" | "rejected" | "revoked";
  expiresAt: string;
}

export interface ClaimVerification {
  id: string;
  presentationProofId: string;
  result: "accepted" | "denied" | "unverifiable" | "expired" | "revoked";
  reason: string | null;
  verifiedAt: string;
}

export interface GeneratePresentationParams {
  patientProfileId: string;
  delegationId: string;
  requestedClaimType: string;
  purpose: string;
}

export function useClinicPresentationFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentIdentity | null>(null);
  const [presentation, setPresentation] = useState<PresentationProof | null>(null);
  const [verification, setVerification] = useState<ClaimVerification | null>(null);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AgentIdentity>("/agents/me");
      setAgent(data);
      return data;
    } catch (err: any) {
      // If agent is not found, it is normal to return null and not raise a critical error
      if (err.status === 404) {
        setAgent(null);
        return null;
      }
      setError(err.message || "Failed to fetch agent identity");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerAgent = useCallback(async (role: Role = "clinic") => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AgentIdentity>("/agents/register", {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      setAgent(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to register agent identity");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePresentation = useCallback(async (params: GeneratePresentationParams) => {
    setLoading(true);
    setError(null);
    setPresentation(null);
    setVerification(null);
    try {
      const data = await apiRequest<PresentationProof>("/presentations/generate", {
        method: "POST",
        body: JSON.stringify(params),
      });
      setPresentation(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to generate presentation proof. Ensure delegation is active and policy matches.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPresentation = useCallback(async (presentationProofId: string) => {
    setLoading(true);
    setError(null);
    setVerification(null);
    try {
      const data = await apiRequest<ClaimVerification>("/claims/verify", {
        method: "POST",
        body: JSON.stringify({ presentationProofId }),
      });
      setVerification(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to verify presentation proof");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetFlow = useCallback(() => {
    setPresentation(null);
    setVerification(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    agent,
    presentation,
    verification,
    fetchAgent,
    registerAgent,
    generatePresentation,
    verifyPresentation,
    resetFlow,
  };
}

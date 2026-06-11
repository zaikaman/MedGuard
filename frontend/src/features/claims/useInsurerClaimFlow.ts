import { useCallback, useState } from "react";
import { Role } from "../../auth/AuthProvider";
import { apiRequest } from "../../lib/api/client";

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

export type InsurerClaimStatus = "received" | "approved" | "denied" | "needs_review";
export type InsurerClaimDecisionStatus = Exclude<InsurerClaimStatus, "received">;

export interface InsurerClaim {
  id: string;
  insurerProfileId: string;
  patientProfileId: string;
  presentationProofId: string;
  claimReference: string;
  status: InsurerClaimStatus;
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface GenerateInsurerPresentationParams {
  patientProfileId: string;
  delegationId: string;
  requestedClaimType: "eligibility" | "coverage" | string;
  purpose: string;
}

export interface DecideInsurerClaimParams {
  claimId: string;
  status: InsurerClaimDecisionStatus;
  decisionReason?: string;
}

export function useInsurerClaimFlow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentIdentity | null>(null);
  const [presentation, setPresentation] = useState<PresentationProof | null>(null);
  const [verification, setVerification] = useState<ClaimVerification | null>(null);
  const [claimDecision, setClaimDecision] = useState<InsurerClaim | null>(null);

  const fetchAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AgentIdentity>("/agents/me");
      setAgent(data);
      return data;
    } catch (err: any) {
      if (err.status === 404) {
        setAgent(null);
        return null;
      }

      setError(err.message || "Failed to fetch insurer agent identity");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerAgent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<AgentIdentity>("/agents/register", {
        method: "POST",
        body: JSON.stringify({ role: "insurer" }),
      });
      setAgent(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to register insurer agent identity");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePresentation = useCallback(async (params: GenerateInsurerPresentationParams) => {
    setLoading(true);
    setError(null);
    setPresentation(null);
    setVerification(null);
    setClaimDecision(null);
    try {
      const data = await apiRequest<PresentationProof>("/presentations/generate", {
        method: "POST",
        body: JSON.stringify(params),
      });
      setPresentation(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to generate insurer eligibility presentation");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyEligibility = useCallback(async (presentationProofId: string) => {
    setLoading(true);
    setError(null);
    setVerification(null);
    setClaimDecision(null);
    try {
      const data = await apiRequest<ClaimVerification>("/claims/verify", {
        method: "POST",
        body: JSON.stringify({ presentationProofId }),
      });
      setVerification(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to verify insurer eligibility presentation");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const decideClaim = useCallback(async ({ claimId, status, decisionReason }: DecideInsurerClaimParams) => {
    setLoading(true);
    setError(null);
    setClaimDecision(null);
    try {
      const data = await apiRequest<InsurerClaim>(`/claims/${claimId}/decision`, {
        method: "POST",
        body: JSON.stringify({
          status,
          ...(decisionReason ? { decisionReason } : {}),
        }),
      });
      setClaimDecision(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to record insurer claim decision");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetFlow = useCallback(() => {
    setPresentation(null);
    setVerification(null);
    setClaimDecision(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    agent,
    presentation,
    verification,
    claimDecision,
    fetchAgent,
    registerAgent,
    generatePresentation,
    verifyEligibility,
    decideClaim,
    resetFlow,
  };
}

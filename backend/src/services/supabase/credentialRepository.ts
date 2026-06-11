import { ApiError } from "../../schemas/common.js";
import type { IssueCredentialInput } from "../../schemas/credentials.js";
import type { CredentialHash } from "../../types/domain.js";
import { writeAuditEvent } from "../audit/auditService.js";
import { getAgentForProfile } from "../terminal3/agentRegistrationService.js";
import { supabaseAdmin } from "./client.js";
import { mapCredentialHash } from "./mappers.js";

export async function listCredentialHashes(patientProfileId: string): Promise<CredentialHash[]> {
  const { data, error } = await supabaseAdmin
    .from("credential_hashes")
    .select("*")
    .eq("patient_profile_id", patientProfileId)
    .order("issued_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list credential metadata: ${error.message}`);
  }

  return (data ?? []).map(mapCredentialHash);
}

export async function findEligibleCredential(
  patientProfileId: string,
  credentialType: string,
  now = new Date(),
): Promise<CredentialHash | null> {
  const { data, error } = await supabaseAdmin
    .from("credential_hashes")
    .select("*")
    .eq("patient_profile_id", patientProfileId)
    .eq("credential_type", credentialType)
    .eq("status", "active")
    .order("issued_at", { ascending: false })
    .limit(5);

  if (error) {
    throw new Error(`Failed to load credential metadata: ${error.message}`);
  }

  const match = (data ?? []).find((row) => !row.expires_at || new Date(row.expires_at) > now);
  return match ? mapCredentialHash(match) : null;
}

export async function issueCredentialMetadata(
  patientProfileId: string,
  input: IssueCredentialInput,
): Promise<CredentialHash> {
  const patientAgent = await getAgentForProfile(patientProfileId, "patient");
  if (!patientAgent) {
    throw new ApiError(409, "PATIENT_AGENT_REQUIRED", "Register a Patient Agent before importing credential metadata");
  }

  const { data, error } = await supabaseAdmin
    .from("credential_hashes")
    .insert({
      patient_profile_id: patientProfileId,
      patient_agent_id: patientAgent.id,
      credential_type: input.credentialType,
      issuer_did: input.issuerDid,
      credential_hash: input.credentialHash,
      t3_reference: input.t3Reference,
      status: "active",
      issued_at: new Date().toISOString(),
      expires_at: input.expiresAt ?? null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store credential metadata: ${error.message}`);
  }

  const credential = mapCredentialHash(data);
  await writeAuditEvent({
    actorProfileId: patientProfileId,
    patientProfileId,
    targetProfileId: patientProfileId,
    eventType: "credential_issued",
    summary: "Credential metadata imported",
    metadata: {
      credentialId: credential.id,
      credentialType: credential.credentialType,
      credentialHash: credential.credentialHash,
      t3Reference: credential.t3Reference,
    },
  });

  return credential;
}

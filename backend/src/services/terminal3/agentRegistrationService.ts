import { ApiError } from "../../schemas/common.js";
import type { AgentIdentity, Role } from "../../types/domain.js";
import { writeAuditEvent } from "../audit/auditService.js";
import { supabaseAdmin } from "../supabase/client.js";
import { mapAgentIdentity } from "../supabase/mappers.js";
import { terminal3Client, type Terminal3Client } from "./terminal3Client.js";

export async function getAgentForProfile(profileId: string, role?: Role): Promise<AgentIdentity | null> {
  let query = supabaseAdmin.from("agent_identities").select("*").eq("profile_id", profileId);

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Failed to load agent identity: ${error.message}`);
  }

  return data ? mapAgentIdentity(data) : null;
}

export async function getAgentById(agentId: string): Promise<AgentIdentity | null> {
  const { data, error } = await supabaseAdmin.from("agent_identities").select("*").eq("id", agentId).maybeSingle();
  if (error) {
    throw new Error(`Failed to load agent identity: ${error.message}`);
  }

  return data ? mapAgentIdentity(data) : null;
}

export async function registerRoleAgent(
  input: { profileId: string; role: Role },
  client: Terminal3Client = terminal3Client,
): Promise<AgentIdentity> {
  const existing = await getAgentForProfile(input.profileId, input.role);
  if (existing) {
    throw new ApiError(409, "AGENT_ALREADY_REGISTERED", "A Terminal 3 agent is already registered for this role");
  }

  const registration = await client.registerAgent(input);
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("agent_identities")
    .insert({
      profile_id: input.profileId,
      role: input.role,
      t3_did: registration.did,
      t3_tenant_id: registration.tenantId,
      status: "active",
      registered_at: now,
      metadata: { environment: "backend" },
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store Terminal 3 agent identity: ${error.message}`);
  }

  const agent = mapAgentIdentity(data);
  await writeAuditEvent({
    actorProfileId: input.profileId,
    targetProfileId: input.profileId,
    eventType: "agent_registered",
    summary: `${input.role} Terminal 3 agent registered`,
    metadata: { agentId: agent.id, role: input.role, t3Did: agent.t3Did },
  });

  return agent;
}

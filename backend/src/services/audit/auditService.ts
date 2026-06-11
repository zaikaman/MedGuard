import { supabaseAdmin } from "../supabase/client.js";
import type { AuditSeverity } from "../../types/domain.js";

const sensitiveKeys = new Set([
  "rawRecord",
  "raw_record",
  "medicalRecord",
  "medical_record",
  "pii",
  "ssn",
  "dateOfBirth",
  "dob",
  "diagnosis",
  "notes",
  "credentialSubject",
]);

export interface WriteAuditEventInput {
  actorProfileId?: string | null;
  patientProfileId?: string | null;
  targetProfileId?: string | null;
  eventType: string;
  severity?: AuditSeverity;
  summary: string;
  metadata?: Record<string, unknown>;
}

export function sanitizeAuditMetadata(metadata: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([key]) => !sensitiveKeys.has(key))
      .map(([key, value]) => [key, sanitizeValue(value)]),
  );
}

export async function writeAuditEvent(input: WriteAuditEventInput) {
  const payload = {
    actor_profile_id: input.actorProfileId ?? null,
    patient_profile_id: input.patientProfileId ?? null,
    target_profile_id: input.targetProfileId ?? null,
    event_type: input.eventType,
    severity: input.severity ?? "info",
    summary: input.summary,
    metadata: sanitizeAuditMetadata(input.metadata),
  };

  const { data, error } = await supabaseAdmin.from("audit_events").insert(payload).select().single();
  if (error) {
    throw new Error(`Failed to write audit event: ${error.message}`);
  }

  return data;
}

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return sanitizeAuditMetadata(value as Record<string, unknown>);
  }

  return value;
}

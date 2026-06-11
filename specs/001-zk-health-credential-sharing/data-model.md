# Data Model: ZK Health Credential Sharing

## Overview

Supabase stores metadata needed for application authorization, user experience,
auditability, and proof lookup. Raw medical records and PII remain in T3N.
Tables that reference Terminal 3 data use DIDs, hashes, opaque references, and
non-sensitive display labels only.

## Entities

### profiles

User profile attached to Supabase Auth.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key; equals Supabase Auth user id |
| role | enum | `patient`, `clinic`, or `insurer`; immutable after onboarding without admin action |
| display_name | text | Required; no medical detail |
| organization_name | text | Required for clinic/insurer, optional for patient |
| created_at | timestamptz | Required |
| updated_at | timestamptz | Required |

Relationships:
- Has one or more `agent_identities`.
- Owns or can view audit events according to RLS.

### agent_identities

Terminal 3 agent metadata for a user role.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| profile_id | uuid | References `profiles.id` |
| role | enum | Must match owning profile role |
| t3_did | text | Required; unique; expected `did:t3n:*` |
| t3_tenant_id | text | Optional opaque Terminal 3 tenant reference |
| status | enum | `pending`, `active`, `suspended`, `failed` |
| registered_at | timestamptz | Set when T3 registration succeeds |
| last_verified_at | timestamptz | Updated after health checks |
| metadata | jsonb | Non-sensitive operational metadata only |

Validation:
- No private keys, raw credentials, or PII.
- Only backend service role can insert/update registration status.

### credential_hashes

Non-sensitive references to health credentials.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| patient_profile_id | uuid | References patient `profiles.id` |
| patient_agent_id | uuid | References Patient Agent |
| credential_type | text | Required label, e.g. `immunization`, `eligibility`, `referral` |
| issuer_did | text | Required |
| credential_hash | text | Required; unique per credential |
| t3_reference | text | Opaque T3N reference; no raw record |
| status | enum | `active`, `expired`, `revoked`, `superseded` |
| issued_at | timestamptz | Required |
| expires_at | timestamptz | Optional |
| created_at | timestamptz | Required |

Validation:
- Never store credential subject values or raw health record fields.
- Hash must be generated before insertion by backend.

### delegations

Patient-defined access grants.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| patient_profile_id | uuid | References patient |
| recipient_profile_id | uuid | References clinic or insurer |
| recipient_agent_id | uuid | References recipient agent |
| purpose | text | Required |
| allowed_claim_types | text[] | At least one |
| allowed_functions | text[] | Required for T3 delegation mapping |
| allowed_hosts | text[] | Optional; empty means no external host access in MedGuard policy |
| starts_at | timestamptz | Required |
| expires_at | timestamptz | Required |
| revoked_at | timestamptz | Optional |
| status | enum | `active`, `expired`, `revoked` |
| created_at | timestamptz | Required |

State transitions:
- `active` -> `revoked` when patient revokes.
- `active` -> `expired` when `expires_at` passes.
- Terminal states are `revoked` and `expired`.

### proof_requests

Clinic or insurer request for a selective proof.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| requester_profile_id | uuid | Clinic or insurer |
| requester_agent_id | uuid | Clinic or Insurer Agent |
| patient_profile_id | uuid | Patient subject |
| delegation_id | uuid | Required when request uses delegated access |
| requested_claim_type | text | Required |
| purpose | text | Required |
| status | enum | `pending`, `approved`, `denied`, `expired`, `verified`, `failed` |
| decision_reason | text | Non-sensitive reason |
| requested_at | timestamptz | Required |
| decided_at | timestamptz | Optional |

Validation:
- Backend must check delegation, role, credential status, and T3 proof outcome.
- RLS lets requester and patient see metadata, not raw records.

### presentation_proofs

Generated ZK presentation metadata.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| proof_request_id | uuid | References `proof_requests.id` |
| patient_profile_id | uuid | References patient |
| recipient_profile_id | uuid | References clinic or insurer |
| presentation_hash | text | Required; unique |
| proof_type | text | Required |
| t3_reference | text | Opaque T3N proof reference |
| verification_status | enum | `generated`, `verified`, `rejected`, `revoked` |
| generated_at | timestamptz | Required |
| verified_at | timestamptz | Optional |
| expires_at | timestamptz | Required |

Validation:
- Store proof references and hashes only.
- Do not store claim values if they reveal medical data beyond the approved
  derived claim.

### claim_verifications

Verification result for clinic or insurer workflows.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| presentation_proof_id | uuid | References `presentation_proofs.id` |
| verifier_profile_id | uuid | Clinic or insurer |
| verifier_agent_id | uuid | Clinic or Insurer Agent |
| result | enum | `accepted`, `denied`, `unverifiable`, `expired`, `revoked` |
| reason | text | Non-sensitive |
| verified_at | timestamptz | Required |

### referrals

Clinic-submitted referral metadata.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| clinic_profile_id | uuid | References clinic |
| patient_profile_id | uuid | References patient |
| presentation_proof_id | uuid | Optional supporting proof |
| referral_type | text | Required |
| status | enum | `draft`, `submitted`, `accepted`, `rejected` |
| notes | text | No raw health records; operational notes only |
| created_at | timestamptz | Required |

### insurer_claims

Insurer claim decision based on proof metadata.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| insurer_profile_id | uuid | References insurer |
| patient_profile_id | uuid | References patient |
| presentation_proof_id | uuid | Required |
| claim_reference | text | External non-PII claim reference |
| status | enum | `received`, `approved`, `denied`, `needs_review` |
| decision_reason | text | Non-sensitive |
| decided_at | timestamptz | Optional |
| created_at | timestamptz | Required |

### audit_events

Real-time audit stream shared across dashboards.

| Field | Type | Rules |
|-------|------|-------|
| id | uuid | Primary key |
| actor_profile_id | uuid | Nullable for system events |
| patient_profile_id | uuid | Required when patient data is involved |
| target_profile_id | uuid | Optional recipient or affected party |
| event_type | enum | `agent_registered`, `credential_issued`, `proof_requested`, `proof_approved`, `proof_denied`, `proof_verified`, `delegation_created`, `delegation_revoked`, `claim_decided`, `referral_submitted`, `system_error` |
| severity | enum | `info`, `warning`, `critical` |
| summary | text | Human-readable, non-sensitive |
| metadata | jsonb | Non-sensitive IDs/status only |
| created_at | timestamptz | Required |

Validation:
- Must not include raw health records, credential subject values, or PII from
  T3N.
- Inserted by backend service role or constrained database functions only.

## RLS Policy Summary

- Patients can read their own profile, agents, credential hashes, delegations,
  proof requests, presentation metadata, and audit events.
- Clinics can read their profile, their Clinic Agent, proof requests they made,
  approved presentations addressed to them, referrals they created, and audit
  events where they are actor or target.
- Insurers can read their profile, their Insurer Agent, proof requests they made,
  approved eligibility presentations addressed to them, claim decisions they
  own, and audit events where they are actor or target.
- Only patients can create/revoke delegations for themselves.
- Only backend service role can create agent identities, credential hashes,
  presentation proofs, verification records, and audit events.
- No role can read another user's raw health data because raw health data is not
  stored in Supabase.

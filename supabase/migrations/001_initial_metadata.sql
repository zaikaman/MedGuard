create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('patient', 'clinic', 'insurer');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.agent_status as enum ('pending', 'active', 'suspended', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.credential_status as enum ('active', 'expired', 'revoked', 'superseded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.delegation_status as enum ('active', 'expired', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.proof_request_status as enum ('pending', 'approved', 'denied', 'expired', 'verified', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.presentation_status as enum ('generated', 'verified', 'rejected', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.verification_result as enum ('accepted', 'denied', 'unverifiable', 'expired', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.referral_status as enum ('draft', 'submitted', 'accepted', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.insurer_claim_status as enum ('received', 'approved', 'denied', 'needs_review');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_event_type as enum (
    'agent_registered',
    'credential_issued',
    'proof_requested',
    'proof_approved',
    'proof_denied',
    'proof_verified',
    'delegation_created',
    'delegation_revoked',
    'claim_decided',
    'referral_submitted',
    'system_error'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key,
  role public.app_role not null,
  display_name text not null check (length(trim(display_name)) > 0),
  organization_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (role = 'patient' or length(trim(coalesce(organization_name, ''))) > 0)
);

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
as $$
begin
  if old.role is distinct from new.role then
    raise exception 'profile role cannot be changed after onboarding';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_change on public.profiles;
create trigger prevent_profile_role_change
before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create table if not exists public.agent_identities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  t3_did text not null unique check (t3_did like 'did:t3n:%'),
  t3_tenant_id text,
  status public.agent_status not null default 'pending',
  registered_at timestamptz,
  last_verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, role)
);

create table if not exists public.credential_hashes (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.profiles(id) on delete cascade,
  patient_agent_id uuid not null references public.agent_identities(id) on delete restrict,
  credential_type text not null check (length(trim(credential_type)) > 0),
  issuer_did text not null check (issuer_did like 'did:%'),
  credential_hash text not null unique check (length(trim(credential_hash)) >= 32),
  t3_reference text not null check (length(trim(t3_reference)) > 0),
  status public.credential_status not null default 'active',
  issued_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at is null or expires_at > issued_at)
);

create table if not exists public.delegations (
  id uuid primary key default gen_random_uuid(),
  patient_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_agent_id uuid not null references public.agent_identities(id) on delete restrict,
  purpose text not null check (length(trim(purpose)) > 0),
  allowed_claim_types text[] not null check (array_length(allowed_claim_types, 1) > 0),
  allowed_functions text[] not null check (array_length(allowed_functions, 1) > 0),
  allowed_hosts text[] not null default '{}'::text[],
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  status public.delegation_status not null default 'active',
  created_at timestamptz not null default now(),
  check (expires_at > starts_at),
  check ((status = 'revoked') = (revoked_at is not null) or status <> 'revoked')
);

create table if not exists public.proof_requests (
  id uuid primary key default gen_random_uuid(),
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  requester_agent_id uuid not null references public.agent_identities(id) on delete restrict,
  patient_profile_id uuid not null references public.profiles(id) on delete cascade,
  delegation_id uuid references public.delegations(id) on delete restrict,
  requested_claim_type text not null check (length(trim(requested_claim_type)) > 0),
  purpose text not null check (length(trim(purpose)) > 0),
  status public.proof_request_status not null default 'pending',
  decision_reason text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.presentation_proofs (
  id uuid primary key default gen_random_uuid(),
  proof_request_id uuid not null references public.proof_requests(id) on delete cascade,
  patient_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  presentation_hash text not null unique check (length(trim(presentation_hash)) >= 32),
  proof_type text not null check (length(trim(proof_type)) > 0),
  t3_reference text not null check (length(trim(t3_reference)) > 0),
  verification_status public.presentation_status not null default 'generated',
  generated_at timestamptz not null default now(),
  verified_at timestamptz,
  expires_at timestamptz not null,
  check (expires_at > generated_at)
);

create table if not exists public.claim_verifications (
  id uuid primary key default gen_random_uuid(),
  presentation_proof_id uuid not null references public.presentation_proofs(id) on delete cascade,
  verifier_profile_id uuid not null references public.profiles(id) on delete cascade,
  verifier_agent_id uuid not null references public.agent_identities(id) on delete restrict,
  result public.verification_result not null,
  reason text,
  verified_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  clinic_profile_id uuid not null references public.profiles(id) on delete cascade,
  patient_profile_id uuid not null references public.profiles(id) on delete cascade,
  presentation_proof_id uuid references public.presentation_proofs(id) on delete set null,
  referral_type text not null check (length(trim(referral_type)) > 0),
  status public.referral_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.insurer_claims (
  id uuid primary key default gen_random_uuid(),
  insurer_profile_id uuid not null references public.profiles(id) on delete cascade,
  patient_profile_id uuid not null references public.profiles(id) on delete cascade,
  presentation_proof_id uuid not null references public.presentation_proofs(id) on delete restrict,
  claim_reference text not null,
  status public.insurer_claim_status not null default 'received',
  decision_reason text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  patient_profile_id uuid references public.profiles(id) on delete cascade,
  target_profile_id uuid references public.profiles(id) on delete set null,
  event_type public.audit_event_type not null,
  severity public.audit_severity not null default 'info',
  summary text not null check (length(trim(summary)) > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_identities_profile on public.agent_identities(profile_id);
create index if not exists idx_credential_hashes_patient on public.credential_hashes(patient_profile_id);
create index if not exists idx_delegations_patient on public.delegations(patient_profile_id);
create index if not exists idx_delegations_recipient on public.delegations(recipient_profile_id);
create index if not exists idx_proof_requests_patient on public.proof_requests(patient_profile_id);
create index if not exists idx_proof_requests_requester on public.proof_requests(requester_profile_id);
create index if not exists idx_presentation_proofs_patient on public.presentation_proofs(patient_profile_id);
create index if not exists idx_presentation_proofs_recipient on public.presentation_proofs(recipient_profile_id);
create index if not exists idx_audit_events_patient_created on public.audit_events(patient_profile_id, created_at desc);
create index if not exists idx_audit_events_actor_created on public.audit_events(actor_profile_id, created_at desc);

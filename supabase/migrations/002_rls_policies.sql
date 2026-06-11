alter table public.profiles enable row level security;
alter table public.agent_identities enable row level security;
alter table public.credential_hashes enable row level security;
alter table public.delegations enable row level security;
alter table public.proof_requests enable row level security;
alter table public.presentation_proofs enable row level security;
alter table public.claim_verifications enable row level security;
alter table public.referrals enable row level security;
alter table public.insurer_claims enable row level security;
alter table public.audit_events enable row level security;

create or replace function public.current_profile_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_patient_for(profile_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = profile_id and public.current_profile_role() = 'patient'
$$;

create or replace function public.is_recipient_role()
returns boolean
language sql
stable
as $$
  select public.current_profile_role() in ('clinic', 'insurer')
$$;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_own_non_role"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "agents_select_own"
on public.agent_identities for select
to authenticated
using (profile_id = auth.uid());

create policy "credentials_patient_select"
on public.credential_hashes for select
to authenticated
using (patient_profile_id = auth.uid());

create policy "delegations_patient_select"
on public.delegations for select
to authenticated
using (patient_profile_id = auth.uid() or recipient_profile_id = auth.uid());

create policy "delegations_patient_insert"
on public.delegations for insert
to authenticated
with check (patient_profile_id = auth.uid() and public.current_profile_role() = 'patient');

create policy "delegations_patient_update"
on public.delegations for update
to authenticated
using (patient_profile_id = auth.uid() and public.current_profile_role() = 'patient')
with check (patient_profile_id = auth.uid() and public.current_profile_role() = 'patient');

create policy "proof_requests_visible_to_participants"
on public.proof_requests for select
to authenticated
using (patient_profile_id = auth.uid() or requester_profile_id = auth.uid());

create policy "proof_requests_recipient_insert"
on public.proof_requests for insert
to authenticated
with check (requester_profile_id = auth.uid() and public.is_recipient_role());

create policy "presentation_proofs_visible_to_participants"
on public.presentation_proofs for select
to authenticated
using (patient_profile_id = auth.uid() or recipient_profile_id = auth.uid());

create policy "claim_verifications_visible_to_verifier"
on public.claim_verifications for select
to authenticated
using (verifier_profile_id = auth.uid());

create policy "referrals_visible_to_participants"
on public.referrals for select
to authenticated
using (clinic_profile_id = auth.uid() or patient_profile_id = auth.uid());

create policy "referrals_clinic_insert"
on public.referrals for insert
to authenticated
with check (clinic_profile_id = auth.uid() and public.current_profile_role() = 'clinic');

create policy "insurer_claims_visible_to_participants"
on public.insurer_claims for select
to authenticated
using (insurer_profile_id = auth.uid() or patient_profile_id = auth.uid());

create policy "audit_events_visible_to_participants"
on public.audit_events for select
to authenticated
using (
  actor_profile_id = auth.uid()
  or patient_profile_id = auth.uid()
  or target_profile_id = auth.uid()
);

create publication supabase_realtime for table public.audit_events;

insert into public.profiles (id, role, display_name, organization_name)
values
  ('00000000-0000-4000-8000-000000000001', 'patient', 'Avery Patient', null),
  ('00000000-0000-4000-8000-000000000002', 'clinic', 'Riverside Clinic Admin', 'Riverside Clinic'),
  ('00000000-0000-4000-8000-000000000003', 'insurer', 'Northstar Claims Reviewer', 'Northstar Insurance')
on conflict (id) do nothing;

insert into public.agent_identities (id, profile_id, role, t3_did, status, registered_at, metadata)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'patient', 'did:t3n:dev:patient-agent', 'active', now(), '{"environment":"local"}'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'clinic', 'did:t3n:dev:clinic-agent', 'active', now(), '{"environment":"local"}'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'insurer', 'did:t3n:dev:insurer-agent', 'active', now(), '{"environment":"local"}')
on conflict (id) do nothing;

insert into public.credential_hashes (
  id,
  patient_profile_id,
  patient_agent_id,
  credential_type,
  issuer_did,
  credential_hash,
  t3_reference,
  status,
  issued_at,
  expires_at
)
values (
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'eligibility',
  'did:t3n:dev:issuer',
  'sha256:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  't3n://dev/credential/eligibility/001',
  'active',
  now(),
  now() + interval '90 days'
)
on conflict (id) do nothing;

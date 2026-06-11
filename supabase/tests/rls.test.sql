begin;

select plan(8);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'agent_identities', 'agent_identities table exists');
select has_table('public', 'credential_hashes', 'credential_hashes table exists');
select has_table('public', 'delegations', 'delegations table exists');
select has_table('public', 'presentation_proofs', 'presentation_proofs table exists');
select has_table('public', 'audit_events', 'audit_events table exists');

select policies_are(
  'public',
  'delegations',
  array['delegations_patient_insert', 'delegations_patient_select', 'delegations_patient_update'],
  'delegations expose patient ownership policies'
);

select policies_are(
  'public',
  'audit_events',
  array['audit_events_visible_to_participants'],
  'audit events are visible only to participants'
);

select * from finish();

rollback;

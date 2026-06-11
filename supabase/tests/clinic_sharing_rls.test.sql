begin;

select plan(5);

select policies_are(
  'public',
  'credential_hashes',
  array['credentials_patient_select'],
  'clinic users have no direct credential hash read policy'
);

select policies_are(
  'public',
  'proof_requests',
  array['proof_requests_recipient_insert', 'proof_requests_visible_to_participants'],
  'proof requests are limited to request participants'
);

select policies_are(
  'public',
  'presentation_proofs',
  array['presentation_proofs_visible_to_participants'],
  'presentation proofs are visible only to patient and addressed recipient'
);

select policies_are(
  'public',
  'claim_verifications',
  array['claim_verifications_visible_to_verifier'],
  'claim verification rows are visible only to verifier'
);

select policies_are(
  'public',
  'audit_events',
  array['audit_events_visible_to_participants'],
  'clinic audit metadata is visible only when clinic is actor or target'
);

select * from finish();

rollback;

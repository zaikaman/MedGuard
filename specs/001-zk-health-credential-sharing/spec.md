# Feature Specification: ZK Health Credential Sharing

**Feature Branch**: `001-featurename-zk-health`
**Created**: 2026-06-11
**Status**: Draft
**Input**: User description: "MedGuard - a multi-agent healthcare data platform using Terminal 3 Agent Auth SDK, where a Patient Agent holds a T3 DID and selectively discloses health credentials via ZK proofs to a Clinic Agent and an Insurer Agent, all operating within TEE-secured boundaries with granular policy enforcement, real-time audit logging, and revocable delegated access - without exposing raw medical records to any party"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Selectively Share Health Credentials (Priority: P1)

A patient authorizes their Patient Agent to prove specific health facts to a clinic
without revealing the underlying medical record. The clinic receives only the
minimum verifiable claims needed for the requested care workflow and can confirm
that the proof came from the patient's T3 DID.

**Why this priority**: This is the core privacy-preserving care flow. Without it,
the platform does not deliver its primary patient value.

**Independent Test**: Can be tested by creating a patient-controlled credential,
requesting a clinic proof for a defined care scenario, and verifying that the
clinic can accept the proof while no raw medical record fields are visible to the
clinic.

**Acceptance Scenarios**:

1. **Given** a patient has a valid T3 DID and eligible health credentials, **When**
   the clinic requests proof of a specific care requirement, **Then** the Patient
   Agent presents only the approved proof and the Clinic Agent can verify it.
2. **Given** a clinic requests information outside the patient's approved policy,
   **When** the Patient Agent evaluates the request, **Then** the request is denied
   and the denial is recorded in the audit log.
3. **Given** a presented proof is expired, malformed, or not bound to the expected
   patient identity, **When** the Clinic Agent verifies it, **Then** the proof is
   rejected without exposing any underlying credential data.

---

### User Story 2 - Share Claim Eligibility with Insurer (Priority: P2)

A patient authorizes their Patient Agent to disclose only the claims needed by an
insurer to determine eligibility or coverage, without disclosing complete medical
records to the insurer.

**Why this priority**: Insurance workflows are a high-value sharing case, but they
must preserve patient control and prevent broad medical record exposure.

**Independent Test**: Can be tested by submitting an insurer proof request for a
coverage scenario and confirming that the Insurer Agent receives a verifiable
eligibility result and audit trail without raw records.

**Acceptance Scenarios**:

1. **Given** an insurer has an approved purpose and policy scope, **When** it
   requests eligibility evidence, **Then** the Patient Agent provides only the
   minimum required verifiable claims.
2. **Given** an insurer requests data beyond the delegated access scope, **When**
   the request is evaluated, **Then** MedGuard blocks the request and records the
   attempted overreach.
3. **Given** the patient's delegated access has been revoked, **When** the insurer
   attempts a new proof request, **Then** the request is denied immediately.

---

### User Story 3 - Manage Delegated Access and Audit History (Priority: P3)

A patient reviews who can request proofs, grants delegated access for specific
purposes, revokes that access at any time, and sees a real-time audit history of
proof requests, approvals, denials, and revocations.

**Why this priority**: Patient trust depends on clear control and traceability for
all sharing activity.

**Independent Test**: Can be tested by granting access to a clinic, observing a
successful proof request in the audit history, revoking access, and confirming
subsequent requests are denied and logged.

**Acceptance Scenarios**:

1. **Given** a patient grants delegated access to an agent for a defined purpose,
   **When** that agent requests an allowed proof, **Then** the request is permitted
   and the audit history shows who requested what, when, and why.
2. **Given** a patient revokes delegated access, **When** the affected agent makes
   another request, **Then** the request is denied and the revocation is visible
   in the audit history.
3. **Given** multiple agents request proofs concurrently, **When** the patient
   views the audit history, **Then** events appear in chronological order with
   clear statuses and policy outcomes.

---

### Edge Cases

- A patient has no eligible credential for the requested proof.
- A credential is expired, suspended, superseded, or revoked by its issuer.
- A Clinic Agent or Insurer Agent requests claims for a purpose not allowed by
  patient policy.
- A delegated access grant expires while a request is pending.
- Two requests target overlapping credentials at the same time.
- An audit event cannot be delivered to a live view immediately.
- A request originates from an agent whose identity cannot be verified.
- A proof verification result conflicts with the current policy or revocation
  status.
- A patient attempts to revoke access during an active proof exchange.
- A system participant tries to infer raw medical facts from repeated narrow
  proof requests.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow a Patient Agent to hold and use a T3 DID as
  the patient's identity anchor for proof-based sharing.
- **FR-002**: The system MUST allow a patient to define granular sharing policies
  for clinics and insurers, including purpose, allowed claim type, expiration,
  and recipient identity.
- **FR-003**: The system MUST allow a Clinic Agent to request patient-approved
  health credential proofs for care workflows.
- **FR-004**: The system MUST allow an Insurer Agent to request patient-approved
  eligibility or coverage proofs for insurance workflows.
- **FR-005**: The system MUST disclose only verifiable proofs or policy-approved
  derived claims to Clinic Agents and Insurer Agents.
- **FR-006**: The system MUST prevent Clinic Agents, Insurer Agents, and audit
  viewers from accessing raw medical records through proof-sharing workflows.
- **FR-007**: The system MUST evaluate each proof request against current patient
  policy, recipient identity, purpose, credential status, and delegated access
  status before disclosure.
- **FR-008**: The system MUST reject proof requests when the requester identity,
  requested purpose, credential state, or delegated access state is invalid.
- **FR-009**: The system MUST allow patients to grant, narrow, expire, and revoke
  delegated access for each Clinic Agent and Insurer Agent.
- **FR-010**: Revocation MUST apply to new proof requests immediately after the
  patient confirms it.
- **FR-011**: The system MUST record audit events for proof requests, approvals,
  denials, verification results, policy changes, delegated access grants, and
  revocations.
- **FR-012**: Audit events MUST include enough detail to explain the actor,
  patient, recipient, purpose, policy decision, timestamp, and outcome without
  exposing raw medical record contents.
- **FR-013**: The system MUST provide patients with a readable audit history that
  can be filtered by agent, status, purpose, and time period.
- **FR-014**: The system MUST operate proof exchanges and policy decisions within
  protected execution boundaries so participating agents cannot bypass policy
  checks.
- **FR-015**: The system MUST notify the patient when a proof request is denied
  because of policy, identity, credential, or revocation issues.
- **FR-016**: The system MUST retain a verifiable history of sharing decisions
  for compliance review while excluding raw medical records from audit entries.

### User Experience Requirements *(include for user-facing work)*

- **UX-001**: Patient-facing flows MUST define loading, empty, validation, error,
  success, and recovery states for policy setup, delegated access, proof
  requests, revocation, and audit history.
- **UX-002**: Interfaces MUST remain readable and operable at supported viewport
  sizes and with keyboard navigation where applicable.
- **UX-003**: Terminology, controls, and feedback MUST consistently distinguish
  raw records, credentials, proofs, delegated access, policy decisions, and audit
  events.
- **UX-004**: Patient consent and revocation screens MUST summarize the recipient,
  purpose, allowed claims, duration, and privacy impact before confirmation.
- **UX-005**: Clinic and insurer views MUST clearly show whether a proof is
  accepted, denied, expired, revoked, or unverifiable.

### Performance Requirements

- **PR-001**: 95% of proof request decisions MUST complete within 5 seconds from
  the user's perspective under normal operating conditions.
- **PR-002**: 95% of delegated access revocations MUST affect new proof requests
  within 2 seconds from patient confirmation.
- **PR-003**: 95% of audit events MUST become visible in the patient audit history
  within 3 seconds of the underlying action.
- **PR-004**: The system MUST support at least 1,000 proof request decisions per
  hour across clinic and insurer workflows without exposing raw records.
- **PR-005**: Performance measurement MUST verify proof decision latency,
  revocation effectiveness, audit visibility, and user-visible error rates.

### Key Entities *(include if feature involves data)*

- **Patient Agent**: Patient-controlled agent that holds the patient's T3 DID,
  manages sharing policies, evaluates requests, initiates proof disclosures, and
  records patient-controlled access decisions.
- **Clinic Agent**: Authorized clinical recipient that requests and verifies
  minimum necessary proofs for patient care workflows.
- **Insurer Agent**: Authorized insurance recipient that requests and verifies
  minimum necessary proofs for coverage or eligibility workflows.
- **T3 DID**: Patient identity anchor used to bind credentials, policies, and
  proof disclosures to the patient.
- **Health Credential**: Patient-held attestations about health facts or status
  that can support selective proof without revealing raw records.
- **Proof Request**: Recipient request containing requester identity, purpose,
  required claim, patient reference, and requested validity window.
- **ZK Proof Disclosure**: Verifiable disclosure that proves an allowed claim or
  derived fact while hiding the underlying record data.
- **Sharing Policy**: Patient-defined rule governing recipient, purpose, claim
  type, time limit, revocation status, and disclosure constraints.
- **Delegated Access Grant**: Time-bounded patient authorization that lets a
  specific agent request specific proof types for a specific purpose.
- **Audit Event**: Immutable record of proof requests, decisions, policy changes,
  revocations, verification outcomes, and relevant failure reasons without raw
  medical record data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, Clinic Agents and Insurer Agents can verify
  approved claims in 100% of valid test cases without seeing raw medical record
  fields.
- **SC-002**: 100% of proof requests are evaluated against patient policy,
  recipient identity, purpose, credential status, and delegated access status
  before any disclosure occurs.
- **SC-003**: 95% of patient-approved proof requests complete within 5 seconds
  from request submission to visible recipient outcome.
- **SC-004**: 95% of delegated access revocations prevent new recipient requests
  within 2 seconds of patient confirmation.
- **SC-005**: 100% of proof requests, policy changes, delegated access changes,
  approvals, denials, and revocations produce audit events that omit raw medical
  record contents.
- **SC-006**: During usability review, at least 90% of representative patients can
  grant access, revoke access, and locate the related audit event without
  assistance.
- **SC-007**: Repeated denied or out-of-policy requests do not reveal additional
  medical facts beyond the denial reason in 100% of privacy test cases.

## Assumptions

- The platform treats the patient as the primary controller of health credential
  disclosure unless an explicit delegated access grant is active.
- Clinic and insurer participants have established identities before requesting
  proofs.
- Health credentials are already issued or imported into a form the Patient
  Agent can reference; creating medical credentials from source records is
  outside this feature's scope.
- Raw medical records remain outside proof disclosure, recipient views, and audit
  entries.
- Audit retention follows applicable healthcare and organizational retention
  obligations and will be refined during planning.
- Emergency access, break-glass workflows, and dispute resolution are outside the
  initial scope unless added by a later specification.

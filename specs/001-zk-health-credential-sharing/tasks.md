# Tasks: ZK Health Credential Sharing

**Input**: Design documents from `D:\MedGuard\specs\001-zk-health-credential-sharing\`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts\openapi.yaml`, `quickstart.md`
**Tests**: Required. The specification requires API, RLS, contract, mocked Terminal 3 integration, Playwright role-flow, and performance coverage.
**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently after shared foundations are complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and has no dependency on incomplete tasks in the same phase
- **[Story]**: User story label for story phases only
- Every task includes an exact file or directory path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the two-service TypeScript workspace, test tooling, environment templates, and deployment scaffolding.

- [x] T001 Create implementation directories in `backend\src\`, `backend\tests\`, `frontend\src\`, `frontend\tests\`, `supabase\migrations\`, and `supabase\tests\`
- [x] T002 Initialize backend TypeScript package, scripts, and runtime dependencies in `backend\package.json` and `backend\tsconfig.json`
- [x] T003 Initialize frontend React 18 + Vite package, scripts, and dependencies in `frontend\package.json`, `frontend\tsconfig.json`, and `frontend\vite.config.ts`
- [x] T004 [P] Configure backend Vitest/Supertest coverage in `backend\vitest.config.ts`
- [x] T005 [P] Configure frontend Vitest, React Testing Library, and Playwright coverage in `frontend\vitest.config.ts` and `frontend\playwright.config.ts`
- [x] T006 [P] Add local environment templates with only public frontend variables in `backend\.env.example` and `frontend\.env.example`
- [x] T007 [P] Add Heroku backend and Vercel frontend deployment configuration in `Procfile` and `docs\deployment\heroku.md` and `docs\deployment\vercel.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish schema, email OTP auth, API boundaries, Terminal 3 isolation, shared UI shell, and test harnesses that all stories require.

**Critical**: No user story work should begin until this phase is complete.

- [x] T008 Create Supabase enum types and metadata tables from `data-model.md` in `supabase\migrations\001_initial_metadata.sql`
- [x] T009 Create Supabase RLS policies for profiles, agents, credentials, delegations, proofs, claims, referrals, and audit events in `supabase\migrations\002_rls_policies.sql`
- [x] T010 [P] Create non-sensitive development seed data for patient, clinic, insurer, and credential metadata in `supabase\seed.sql`
- [x] T011 [P] Add Supabase RLS policy test harness in `supabase\tests\rls.test.sql`
- [x] T012 [P] Add OpenAPI contract test fixture copied from `specs\001-zk-health-credential-sharing\contracts\openapi.yaml` to `backend\tests\contract\openapi.yaml`
- [x] T013 Create Express app and route mounting structure in `backend\src\app.ts` and `backend\src\server.ts`
- [x] T014 [P] Implement typed environment validation for Supabase, Terminal 3, CORS, and port values in `backend\src\config\env.ts`
- [x] T015 [P] Implement Supabase anon and service-role clients in `backend\src\services\supabase\client.ts`
- [x] T016 Implement Supabase email OTP JWT authentication middleware with profile role lookup in `backend\src\middleware\requireAuth.ts`
- [x] T017 Implement role authorization middleware for patient, clinic, and insurer routes in `backend\src\middleware\requireRole.ts`
- [x] T018 [P] Implement shared request validation and error response helpers in `backend\src\schemas\common.ts` and `backend\src\middleware\errorHandler.ts`
- [x] T019 Implement Terminal 3 SDK boundary wrapper with no browser-exposed secrets in `backend\src\services\terminal3\terminal3Client.ts`
- [x] T020 Implement policy evaluation primitives for recipient identity, purpose, claim type, credential state, and delegation state in `backend\src\services\policies\policyEvaluator.ts`
- [x] T021 Implement audit event writer that strips raw records and PII from metadata in `backend\src\services\audit\auditService.ts`
- [x] T022 [P] Implement shared backend domain types for profiles, agents, credentials, proofs, delegations, claims, referrals, and audit events in `backend\src\types\domain.ts`
- [x] T023 [P] Implement frontend Supabase client and typed API client foundation in `frontend\src\lib\supabase.ts` and `frontend\src\lib\api\client.ts`
- [x] T024 Implement frontend email OTP request/verification auth provider, protected route wrapper, and role redirect shell in `frontend\src\auth\AuthProvider.tsx` and `frontend\src\routes\ProtectedRoute.tsx`
- [x] T025 [P] Implement shared application layout primitives for equal-fidelity dashboards in `frontend\src\components\AppLayout.tsx` and `frontend\src\styles\theme.css`
- [x] T026 [P] Add performance measurement helpers for proof decision, revocation, and audit visibility timing in `backend\tests\performance\metrics.ts`

**Checkpoint**: Foundation ready. User story implementation can now begin in priority order or in parallel by separate developers.

---

## Phase 3: User Story 1 - Selectively Share Health Credentials (Priority: P1) MVP

**Goal**: A patient can use a Patient Agent DID and credential metadata to selectively disclose a clinic-approved ZK presentation without exposing raw medical records.

**Independent Test**: Seed a patient credential and clinic delegation, request a clinic proof, verify the clinic sees only proof metadata/derived claim status, and confirm out-of-policy requests are denied and audited.

### Tests for User Story 1

- [x] T027 [P] [US1] Add contract tests for `POST /agents/register` and `GET /agents/me` in `backend\tests\contract\agents.contract.test.ts`
- [x] T028 [P] [US1] Add contract tests for `GET /credentials` and `POST /credentials/issue` in `backend\tests\contract\credentials.contract.test.ts`
- [x] T029 [P] [US1] Add contract tests for `POST /presentations/generate` and `POST /claims/verify` clinic cases in `backend\tests\contract\clinic-presentations.contract.test.ts`
- [x] T030 [P] [US1] Add unit tests for clinic proof policy approval, denial, expiry, malformed proof, and identity mismatch in `backend\tests\unit\clinicPolicyEvaluator.test.ts`
- [x] T031 [P] [US1] Add mocked Terminal 3 registration, presentation generation, and verification integration tests in `backend\tests\integration\terminal3ClinicFlow.test.ts`
- [x] T032 [P] [US1] Add RLS tests proving clinic users cannot read raw credential data or unrelated patient metadata in `supabase\tests\clinic_sharing_rls.test.sql`
- [ ] T033 [P] [US1] Add Playwright flow for patient credential setup and clinic proof verification in `frontend\tests\e2e\clinic-proof-sharing.spec.ts`

### Implementation for User Story 1

- [x] T034 [P] [US1] Implement Terminal 3 role-specific agent registration service in `backend\src\services\terminal3\agentRegistrationService.ts`
- [x] T035 [US1] Implement agent registration and lookup routes in `backend\src\routes\agents.ts`
- [x] T036 [P] [US1] Implement credential metadata schemas and repository with hash/reference-only storage in `backend\src\schemas\credentials.ts` and `backend\src\services\supabase\credentialRepository.ts`
- [x] T037 [US1] Implement credential listing and issue/import routes in `backend\src\routes\credentials.ts`
- [x] T038 [P] [US1] Implement proof request and presentation metadata repository in `backend\src\services\supabase\proofRepository.ts`
- [x] T039 [US1] Implement clinic presentation generation service with delegation, purpose, credential status, and identity checks in `backend\src\services\terminal3\presentationService.ts`
- [x] T040 [US1] Implement presentation generation route for clinic proof requests in `backend\src\routes\presentations.ts`
- [x] T041 [P] [US1] Implement claim verification service for clinic proof outcomes in `backend\src\services\terminal3\claimVerificationService.ts`
- [x] T042 [US1] Implement claim verification route for accepted, denied, expired, revoked, and unverifiable states in `backend\src\routes\claims.ts`
- [x] T043 [US1] Emit audit events for clinic proof requested, approved, denied, and verified outcomes in `backend\src\services\audit\proofAuditEvents.ts`
- [x] T044 [P] [US1] Implement patient onboarding and credential metadata UI in `frontend\src\dashboards\patient\PatientCredentialsPage.tsx`
- [x] T045 [P] [US1] Implement clinic dashboard proof request form in `frontend\src\dashboards\clinic\ClinicProofRequestPage.tsx`
- [x] T046 [US1] Implement clinic proof result states for accepted, denied, expired, revoked, unverifiable, loading, and error states in `frontend\src\dashboards\clinic\ClinicProofResultPanel.tsx`
- [x] T047 [US1] Add frontend API hooks for agent, credential, presentation, and claim verification flows in `frontend\src\features\presentations\useClinicPresentationFlow.ts`
- [x] T048 [US1] Measure and assert 95% clinic proof decision visibility within 5 seconds in `backend\tests\performance\clinicProofDecision.performance.test.ts`

**Checkpoint**: User Story 1 is independently functional and demoable as the MVP.

---

## Phase 4: User Story 2 - Share Claim Eligibility with Insurer (Priority: P2)

**Goal**: A patient can authorize insurer eligibility proof requests that disclose only minimum required verifiable claims and support insurer claim decisions without raw records.

**Independent Test**: Seed an insurer delegation and eligible credential, submit an insurer proof request, verify an eligibility result and claim decision, then revoke access and confirm a new request is denied.

### Tests for User Story 2

- [ ] T049 [P] [US2] Add contract tests for insurer `POST /presentations/generate` and `POST /claims/verify` cases in `backend\tests\contract\insurer-presentations.contract.test.ts`
- [ ] T050 [P] [US2] Add contract tests for `POST /claims/{claimId}/decision` in `backend\tests\contract\claim-decisions.contract.test.ts`
- [ ] T051 [P] [US2] Add unit tests for insurer policy scope, overreach denial, and revoked delegation denial in `backend\tests\unit\insurerPolicyEvaluator.test.ts`
- [ ] T052 [P] [US2] Add mocked Terminal 3 insurer eligibility integration tests in `backend\tests\integration\terminal3InsurerFlow.test.ts`
- [ ] T053 [P] [US2] Add RLS tests proving insurers can read only their own presentations and claim decisions in `supabase\tests\insurer_claims_rls.test.sql`
- [ ] T054 [P] [US2] Add Playwright flow for insurer eligibility request, decision, and no-raw-record display in `frontend\tests\e2e\insurer-eligibility.spec.ts`

### Implementation for User Story 2

- [x] T055 [P] [US2] Implement insurer claim repository for proof-backed decisions in `backend\src\services\supabase\insurerClaimRepository.ts`
- [x] T056 [US2] Extend presentation generation service for insurer eligibility purpose and minimum-claim policy checks in `backend\src\services\terminal3\presentationService.ts`
- [x] T057 [US2] Extend claim verification service for insurer eligibility outcomes in `backend\src\services\terminal3\claimVerificationService.ts`
- [x] T058 [US2] Implement claim decision route and insurer role enforcement in `backend\src\routes\claims.ts`
- [x] T059 [US2] Emit audit events for insurer request, overreach denial, eligibility verification, and claim decision outcomes in `backend\src\services\audit\claimAuditEvents.ts`
- [ ] T060 [P] [US2] Implement insurer dashboard eligibility request UI in `frontend\src\dashboards\insurer\InsurerEligibilityPage.tsx`
- [ ] T061 [P] [US2] Implement insurer claim decision UI with approved, denied, needs-review, loading, and error states in `frontend\src\dashboards\insurer\InsurerClaimDecisionPanel.tsx`
- [ ] T062 [US2] Add frontend API hooks for insurer presentations and claim decisions in `frontend\src\features\claims\useInsurerClaimFlow.ts`
- [ ] T063 [US2] Show patient notification state for insurer policy denial without revealing extra facts in `frontend\src\dashboards\patient\PatientDenialNotifications.tsx`
- [ ] T064 [US2] Measure insurer proof decision latency and denied-request error rates in `backend\tests\performance\insurerProofDecision.performance.test.ts`

**Checkpoint**: User Stories 1 and 2 both work independently without exposing raw records.

---

## Phase 5: User Story 3 - Manage Delegated Access and Audit History (Priority: P3)

**Goal**: A patient can grant, narrow, expire, revoke, and audit delegated access for clinic and insurer agents with live, filterable audit history.

**Independent Test**: Grant clinic access, observe a successful proof request in the audit history, revoke the grant, confirm a subsequent request is denied, and verify chronological live audit updates.

### Tests for User Story 3

- [ ] T065 [P] [US3] Add contract tests for `GET /delegations`, `POST /delegations`, and `POST /delegations/{delegationId}/revoke` in `backend\tests\contract\delegations.contract.test.ts`
- [ ] T066 [P] [US3] Add contract tests for `GET /audit-events` filters in `backend\tests\contract\audit-events.contract.test.ts`
- [ ] T067 [P] [US3] Add unit tests for delegation creation, narrowing, expiration, revocation, and concurrent request handling in `backend\tests\unit\delegationService.test.ts`
- [ ] T068 [P] [US3] Add integration tests for revoke-then-request denial and audit event ordering in `backend\tests\integration\delegationAuditFlow.test.ts`
- [ ] T069 [P] [US3] Add RLS tests proving patients control their delegations and only authorized parties read audit metadata in `supabase\tests\delegations_audit_rls.test.sql`
- [ ] T070 [P] [US3] Add Playwright flow for grant, revoke, filter audit history, and real-time update states in `frontend\tests\e2e\delegation-audit.spec.ts`

### Implementation for User Story 3

- [ ] T071 [P] [US3] Implement delegation schemas and repository in `backend\src\schemas\delegations.ts` and `backend\src\services\supabase\delegationRepository.ts`
- [ ] T072 [US3] Implement delegation service with allowed functions, allowed hosts, expiration, narrowing, and revocation semantics in `backend\src\services\policies\delegationService.ts`
- [ ] T073 [US3] Implement delegation list, create, and revoke routes in `backend\src\routes\delegations.ts`
- [ ] T074 [P] [US3] Implement audit event repository and filter query support in `backend\src\services\supabase\auditRepository.ts`
- [ ] T075 [US3] Implement audit event route with role-aware filters for agent, status, purpose, and time period in `backend\src\routes\audit.ts`
- [ ] T076 [US3] Enable Supabase Realtime publication for `audit_events` in `supabase\migrations\003_audit_realtime.sql`
- [ ] T077 [P] [US3] Implement patient delegated access management page with consent summary and revocation confirmation in `frontend\src\dashboards\patient\PatientDelegationsPage.tsx`
- [ ] T078 [P] [US3] Implement shared live audit log panel with filters, empty, loading, error, and recovery states in `frontend\src\features\audit-log\AuditLogPanel.tsx`
- [ ] T079 [US3] Add frontend audit subscription and delegation API hooks in `frontend\src\features\audit-log\useAuditEvents.ts` and `frontend\src\features\delegations\useDelegations.ts`
- [ ] T080 [US3] Measure revocation effectiveness within 2 seconds and audit visibility within 3 seconds in `backend\tests\performance\revocationAudit.performance.test.ts`

**Checkpoint**: All user stories are independently functional with patient control and live auditability.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, accessibility, performance, deployment, and documentation updates that span all stories.

- [ ] T081 [P] Document no-raw-record storage guarantees and Terminal 3 backend-only boundary in `docs\security\privacy-boundary.md`
- [ ] T082 [P] Update bounty documentation submission from research findings in `specs\001-zk-health-credential-sharing\terminal3-bounty-findings.md`
- [ ] T083 [P] Add accessibility and keyboard navigation checks for patient, clinic, and insurer dashboards in `frontend\tests\e2e\accessibility.spec.ts`
- [ ] T084 [P] Add responsive visual smoke tests for all role dashboards in `frontend\tests\e2e\responsive-dashboards.spec.ts`
- [ ] T085 Run and document quickstart validation results in `specs\001-zk-health-credential-sharing\quickstart.md`
- [ ] T086 Run backend test, frontend test, Playwright, RLS, and performance suites from `backend\package.json`, `frontend\package.json`, and `supabase\tests\`
- [ ] T087 Harden operational logging, rate limits, and repeated denied-request privacy protections in `backend\src\middleware\rateLimit.ts` and `backend\src\services\policies\privacyLeakageGuard.ts`
- [ ] T088 Prepare Heroku staging deployment checklist and environment separation verification in `docs\deployment\heroku.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope.
- **User Story 2 (Phase 4)**: Depends on Foundational and can run alongside US1 if repository/service contracts are coordinated; sequential priority is US1 then US2.
- **User Story 3 (Phase 5)**: Depends on Foundational and can run alongside US1/US2 if delegation API contracts are stable; sequential priority is US1 then US2 then US3.
- **Polish (Phase 6)**: Depends on the selected story scope being complete.

### User Story Dependencies

- **US1 Selectively Share Health Credentials**: No dependency on other stories after Phase 2; uses seeded or existing delegation metadata for independent testing.
- **US2 Share Claim Eligibility with Insurer**: No functional dependency on US1 after Phase 2, but reuses presentation and claim verification services.
- **US3 Manage Delegated Access and Audit History**: No functional dependency on US1/US2 after Phase 2, but makes delegation and audit controls production-complete for both recipient roles.

### Within Each User Story

- Write and run tests first; confirm failures before implementation.
- Backend schemas/repositories precede services.
- Services precede routes.
- Routes and API hooks precede page-level UI integration.
- Performance checks run after the story path is functional.

---

## Parallel Opportunities

- Phase 1 tasks T004, T005, T006, and T007 can run in parallel after T001.
- Phase 2 tasks marked `[P]` can run in parallel with T013-T021 sequencing respected.
- US1 tests T027-T033 can be created in parallel before implementation.
- US1 implementation can split across agent/credential services (T034-T037), proof/verification services (T038-T043), and frontend pages (T044-T047).
- US2 tests T049-T054 can be created in parallel before implementation.
- US2 implementation can split across backend claim work (T055-T059) and frontend insurer UI work (T060-T063).
- US3 tests T065-T070 can be created in parallel before implementation.
- US3 implementation can split across delegation backend work (T071-T076) and frontend audit/delegation UI work (T077-T079).
- Polish tasks T081-T084 can run in parallel once all selected story surfaces exist.

## Parallel Example: User Story 1

```powershell
# Independent test-writing tasks
Task: "T027 Add contract tests for POST /agents/register and GET /agents/me in backend\tests\contract\agents.contract.test.ts"
Task: "T028 Add contract tests for GET /credentials and POST /credentials/issue in backend\tests\contract\credentials.contract.test.ts"
Task: "T030 Add unit tests for clinic proof policy approval, denial, expiry, malformed proof, and identity mismatch in backend\tests\unit\clinicPolicyEvaluator.test.ts"
Task: "T033 Add Playwright flow for patient credential setup and clinic proof verification in frontend\tests\e2e\clinic-proof-sharing.spec.ts"

# Independent implementation tasks after contracts are agreed
Task: "T034 Implement Terminal 3 role-specific agent registration service in backend\src\services\terminal3\agentRegistrationService.ts"
Task: "T036 Implement credential metadata schemas and repository with hash/reference-only storage in backend\src\schemas\credentials.ts and backend\src\services\supabase\credentialRepository.ts"
Task: "T044 Implement patient onboarding and credential metadata UI in frontend\src\dashboards\patient\PatientCredentialsPage.tsx"
Task: "T045 Implement clinic dashboard proof request form in frontend\src\dashboards\clinic\ClinicProofRequestPage.tsx"
```

## Parallel Example: User Story 2

```powershell
Task: "T049 Add contract tests for insurer POST /presentations/generate and POST /claims/verify cases in backend\tests\contract\insurer-presentations.contract.test.ts"
Task: "T051 Add unit tests for insurer policy scope, overreach denial, and revoked delegation denial in backend\tests\unit\insurerPolicyEvaluator.test.ts"
Task: "T055 Implement insurer claim repository for proof-backed decisions in backend\src\services\supabase\insurerClaimRepository.ts"
Task: "T060 Implement insurer dashboard eligibility request UI in frontend\src\dashboards\insurer\InsurerEligibilityPage.tsx"
```

## Parallel Example: User Story 3

```powershell
Task: "T065 Add contract tests for GET /delegations, POST /delegations, and POST /delegations/{delegationId}/revoke in backend\tests\contract\delegations.contract.test.ts"
Task: "T066 Add contract tests for GET /audit-events filters in backend\tests\contract\audit-events.contract.test.ts"
Task: "T071 Implement delegation schemas and repository in backend\src\schemas\delegations.ts and backend\src\services\supabase\delegationRepository.ts"
Task: "T078 Implement shared live audit log panel with filters, empty, loading, error, and recovery states in frontend\src\features\audit-log\AuditLogPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundations.
3. Complete Phase 3 for clinic selective disclosure.
4. Stop and validate the US1 independent test, contract tests, RLS tests, Playwright flow, and 5-second proof decision target.
5. Demo the patient-to-clinic proof flow without raw medical record exposure.

### Incremental Delivery

1. Deliver Setup + Foundational infrastructure.
2. Deliver US1 for clinic proof sharing as the MVP.
3. Deliver US2 for insurer eligibility and claim decisions.
4. Deliver US3 for patient-managed delegation and live audit history.
5. Run Phase 6 hardening before staging promotion.

### Parallel Team Strategy

1. One developer owns Supabase schema/RLS and backend foundations.
2. One developer owns frontend shell and shared dashboard components.
3. After Phase 2, split by story: clinic flow, insurer flow, and delegation/audit flow.
4. Integrate through the OpenAPI contract and shared domain types.

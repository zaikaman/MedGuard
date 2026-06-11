# Implementation Plan: ZK Health Credential Sharing

**Branch**: `001-featurename-zk-health` | **Date**: 2026-06-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-zk-health-credential-sharing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build MedGuard as a web application with a React + Vite frontend and a Node.js +
Express backend. Supabase Auth handles real users and roles (`patient`, `clinic`,
`insurer`), while the Express backend is the only application boundary allowed
to call the Terminal 3 SDK. On signup, the backend registers separate Terminal 3
DIDs for Patient, Clinic, and Insurer agents as appropriate for the user's role.

The backend exposes REST endpoints for agent identity registration, credential
issuance metadata, selective ZK presentation generation, inter-agent claim
verification, and delegated access with expiry. Supabase stores role profiles,
agent metadata, credential hashes, presentation proof metadata, delegation
records, referrals, claim decisions, and real-time audit events. Raw health
records and PII remain in T3N and are never stored in Supabase or returned to
Clinic/Insurer dashboards.

## Technical Context

**Language/Version**: TypeScript on Node.js >=18; React 18 + Vite frontend; Express backend  
**Primary Dependencies**: React, Vite, React Router, Supabase JS client, Node.js, Express, Terminal 3 `@terminal3/t3n-sdk`, Zod or equivalent validation, Heroku (backend) + Vercel (frontend) deployment runtimes  
**Storage**: Supabase PostgreSQL for metadata, credential hashes, proof records, delegation records, referrals, claim decisions, and audit events; Supabase Auth for users; T3N for raw health records/PII and T3 agent execution context  
**Testing**: Vitest + React Testing Library for frontend units/components; Playwright for role dashboard flows; Node test runner or Vitest + Supertest for Express APIs; Supabase RLS policy tests; contract tests against OpenAPI examples; mocked Terminal 3 SDK integration tests plus testnet smoke tests when tokens are available  
**Target Platform**: Web app with Express backend deployed to Heroku and React + Vite frontend deployed to Vercel, with environment-separated config for local, staging, and production  
**Project Type**: Web application with separate frontend and backend services  
**Performance Goals**: 95% of proof request decisions visible within 5 seconds; 95% of revocations effective for new proof requests within 2 seconds; 95% of audit events visible within 3 seconds; support at least 1,000 proof decisions per hour  
**Constraints**: Terminal 3 SDK integration is backend-only; Supabase stores no raw health records or PII from T3N; RBAC enforced in Express middleware and Supabase RLS; all dashboards receive equal production-quality UI treatment; audit log updates must be live for all roles  
**Scale/Scope**: Three role dashboards, three T3 agent identities, REST API, Supabase schema/RLS, real-time audit panel, Heroku + Vercel deployment, and bounty documentation findings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: PASS. The plan separates frontend, backend, shared types,
  Supabase schema/migrations, and Terminal 3 integration boundaries. Terminal 3
  calls are isolated behind backend services; frontend consumes typed REST
  contracts only.
- **Testing Standards**: PASS. The plan includes component/unit tests, API tests,
  RLS policy tests, contract tests, Playwright role flows, mocked Terminal 3 SDK
  integration tests, and optional testnet smoke tests when tokens are available.
- **User Experience Consistency**: PASS. Patient, Clinic, and Insurer dashboards
  have equal fidelity, shared navigation primitives, shared audit log panel, and
  explicit loading/empty/error/success states.
- **Performance Requirements**: PASS. Proof decision, revocation, and audit
  visibility targets from the spec are retained and mapped to measurable tests.
- **Security, Privacy, Reliability**: PASS. Supabase Auth + Express RBAC +
  Supabase RLS are required. Raw health records remain in T3N; Supabase stores
  only hashes, metadata, policy state, proof artifacts, and audit events.

**Post-Design Re-check**: PASS. `research.md`, `data-model.md`,
`contracts/openapi.yaml`, and `quickstart.md` keep the same boundaries: Terminal
3 SDK is backend-only, Supabase RLS mirrors Express RBAC, and no endpoint or
table accepts raw health record payloads.

## Project Structure

### Documentation (this feature)

```text
specs/001-zk-health-credential-sharing/
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- terminal3-bounty-findings.md
|-- contracts/
|   `-- openapi.yaml
|-- checklists/
|   `-- requirements.md
`-- spec.md
```

### Source Code (repository root)

```text
backend/
|-- src/
|   |-- app.ts
|   |-- server.ts
|   |-- config/
|   |-- middleware/
|   |   |-- requireAuth.ts
|   |   `-- requireRole.ts
|   |-- routes/
|   |   |-- agents.ts
|   |   |-- credentials.ts
|   |   |-- presentations.ts
|   |   |-- claims.ts
|   |   |-- delegations.ts
|   |   |-- referrals.ts
|   |   `-- audit.ts
|   |-- services/
|   |   |-- terminal3/
|   |   |-- supabase/
|   |   |-- policies/
|   |   `-- audit/
|   |-- schemas/
|   `-- types/
`-- tests/
    |-- contract/
    |-- integration/
    |-- rls/
    `-- unit/

frontend/
|-- src/
|   |-- app/
|   |-- auth/
|   |-- components/
|   |-- dashboards/
|   |   |-- patient/
|   |   |-- clinic/
|   |   `-- insurer/
|   |-- features/
|   |   |-- audit-log/
|   |   |-- credentials/
|   |   |-- delegations/
|   |   |-- presentations/
|   |   |-- referrals/
|   |   `-- claims/
|   |-- lib/
|   |-- routes/
|   `-- styles/
`-- tests/
    |-- component/
    |-- e2e/
    `-- unit/

supabase/
|-- migrations/
|-- seed.sql
`-- tests/
```

**Structure Decision**: Use a two-service web app structure (`frontend/` and
`backend/`) plus `supabase/` migrations/tests. Shared contracts are generated
from `specs/001-zk-health-credential-sharing/contracts/openapi.yaml` during
implementation or imported manually as typed schemas.

## Complexity Tracking

No constitution violations or unjustified complexity. The three-dashboard
surface and dual RBAC/RLS enforcement are required by the feature description
and privacy model.

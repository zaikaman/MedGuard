# Research: ZK Health Credential Sharing

## Decision: Use Terminal 3 ADK only from the Express backend

**Rationale**: Terminal 3 documentation describes the ADK as a TypeScript /
JavaScript SDK for building agent tenant applications on T3N, including tenant
identity onboarding, tenant-scoped data, TEE contracts, and cross-tenant calls.
Keeping SDK calls in Express avoids exposing developer keys, T3 session handling,
or agent operation details to browsers.

**Alternatives considered**:
- Frontend SDK calls: rejected because it would expose too much T3 operational
  surface to the browser and conflict with the requirement that SDK integration
  is backend-only.
- Direct Supabase Edge Functions for T3 calls: rejected for the initial plan
  because the user requested Node.js + Express backend on Heroku.

Sources:
- https://docs.terminal3.io/developers/adk/overview/what-is-adk
- https://docs.terminal3.io/developers/adk/get-started/prerequisites/set-up-dev-env

## Decision: Model agents as Supabase metadata plus T3 `did:t3n` identities

**Rationale**: Terminal 3 provides DIDs for humans and agents and documents a
custom `did:t3n` method. Supabase will store only DID strings, role linkage,
registration status, and non-sensitive metadata. T3N remains the boundary for
private data and agent execution context.

**Alternatives considered**:
- Store agent private keys in Supabase: rejected because it violates the privacy
  boundary and would create unnecessary key custody risk.
- Use one DID for all roles: rejected because the feature requires separate
  Patient, Clinic, and Insurer agent identities.

Sources:
- https://docs.terminal3.io/intro/components/did
- https://docs.terminal3.io/t3n/overview/what-is-t3n

## Decision: Implement role-specific AI agents as constrained backend services

**Rationale**: The hackathon evaluates agentic solutions, so Patient, Clinic,
and Insurer must be more than DID records. Each role needs an AI-agent service
that can reason over non-sensitive context, select approved tools, and produce
auditable actions. Agents run only in the Express backend, use Terminal 3 DIDs as
verifiable identity, and call a narrow tool allowlist that enforces policy before
any proof, claim, referral, or delegation action.

**Alternatives considered**:
- DID-only "agents": rejected because it does not satisfy the agentic focus of
  the bounty and leaves no autonomous workflow to demonstrate.
- Browser-run agents: rejected because prompts, tools, secrets, and Terminal 3
  SDK calls must not be exposed to the client.
- Fully autonomous actions without approval gates: rejected because healthcare
  data disclosure and claim decisions require policy checks, auditability, and
  user-visible control.

## Decision: Treat ZK presentations as derived proof artifacts, not records

**Rationale**: Terminal 3 VC docs describe VPs as data derived from one or more
VCs and note ZK proofs for selective disclosure. Supabase can store presentation
proof metadata and proof hashes for auditability, but raw medical records and
PII stay in T3N.

**Alternatives considered**:
- Store full VCs in Supabase: rejected because it risks raw or linkable health
  data leakage.
- Store only audit text with no proof metadata: rejected because verification,
  dispute handling, and compliance review need durable proof references.

Sources:
- https://docs.terminal3.io/intro/components/vc
- https://docs.terminal3.io/t3n/how-t3n-works/tees

## Decision: Enforce delegated access in both application policy and database policy

**Rationale**: Terminal 3 delegation docs describe agent DID, authorized TEE
contract, authorized functions, allowed hosts, and revocation. MedGuard should
mirror this with Express policy checks before T3 calls and Supabase RLS for
stored metadata. Revocation must block new proof requests immediately.

**Alternatives considered**:
- Express-only RBAC: rejected because direct Supabase reads or bugs could bypass
  role constraints.
- RLS-only RBAC: rejected because Terminal 3 calls must also be guarded before
  any proof generation or verification side effect.

Sources:
- https://docs.terminal3.io/t3n/data-owner-guide/delegate-access
- https://docs.terminal3.io/t3n/use-cases/delegate-access-to-agent

## Decision: Build three equal-fidelity dashboards with a shared audit panel

**Rationale**: The feature explicitly requires patient, clinic, and insurer
roles, each with a polished dashboard and equal visual fidelity. A shared audit
log component keeps terminology, event severity, filtering, and real-time states
consistent across the product.

**Alternatives considered**:
- Patient-first MVP with basic clinic/insurer screens: rejected because it
  violates the equal-fidelity requirement.
- Separate visual systems per role: rejected because it increases cognitive load
  and weakens audit consistency.

## Decision: Deploy backend on Heroku and frontend on Vercel

**Rationale**: Heroku and Vercel provide separate environments that keep frontend
public config apart from backend secrets such as Supabase service role keys and
Terminal 3 developer keys. The Heroku backend service is the only runtime with
T3 SDK credentials.

**Alternatives considered**:
- Single static deployment only: rejected because Express backend is required.
- Store secrets in frontend environment variables: rejected because browser
  builds expose frontend variables.
- Railway single-platform deployment: rejected in favor of best-in-class
  platform approach (Heroku for backend, Vercel for frontend).

## Terminal 3 Onboarding and Documentation Findings

These findings should be submitted to Terminal 3 for the bounty documentation
gap category. A full submission draft is in `terminal3-bounty-findings.md`.

- Documentation bug: "Set Up Development Environment" says "Quick 4 steps" but
  the page lists five numbered steps.
- Documentation gap: bounty wording and user-facing requirements refer to
  "Agent Auth SDK", while the docs primarily describe "T3 Agent Developer Kit
  (ADK)" and `@terminal3/t3n-sdk`; clarify whether these are the same product
  surface.
- Documentation gap: current docs explain tenant DID onboarding and delegation,
  but the path for registering multiple app-specific agent DIDs for distinct
  product roles is not obvious from the onboarding flow.
- Documentation gap: delegation docs define authorized functions/hosts but do
  not provide a healthcare-style selective-disclosure example with revocation
  semantics and audit event expectations.

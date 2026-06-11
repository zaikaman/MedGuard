<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Template principle 1 -> I. Code Quality and Maintainability
- Template principle 2 -> II. Testing Standards Are Required
- Template principle 3 -> III. Consistent User Experience
- Template principle 4 -> IV. Performance Budgets and Measurement
- Template principle 5 -> V. Security, Privacy, and Operational Reliability
Added sections:
- Product and Engineering Constraints
- Development Workflow and Quality Gates
Removed sections:
- None
Templates requiring updates:
- updated .specify/templates/plan-template.md
- updated .specify/templates/spec-template.md
- updated .specify/templates/tasks-template.md
- not present .specify/templates/commands/*.md
Follow-up TODOs:
- Mandatory before_constitution git hook failed because
  .specify/extensions/git/scripts/powershell/initialize-repo.ps1 contains malformed
  quoted mojibake text. Repository already contains .git, so constitution work continued.
- No current plan.md was present to read.
-->
# MedGuard Constitution

## Core Principles

### I. Code Quality and Maintainability
All production code MUST be clear, typed where the platform supports it, modular,
and aligned with the existing project structure. Each change MUST keep behavior
localized to the smallest practical boundary, avoid hidden global state, and
prefer explicit data contracts over implicit coupling. Public interfaces,
domain rules, and non-obvious decisions MUST be documented close to the code or
in the feature plan.

Rationale: MedGuard is a healthcare-oriented product surface. Ambiguous,
duplicated, or tightly coupled code makes safety-critical behavior harder to
review, test, and maintain.

### II. Testing Standards Are Required
Every feature or bug fix that changes behavior MUST include automated tests at
the most useful level: unit tests for deterministic logic, integration tests for
cross-module workflows, contract tests for APIs and schemas, and end-to-end or
visual tests for critical user journeys. Tests MUST be written or updated before
implementation is considered complete, MUST cover expected paths and meaningful
edge cases, and MUST be run before handoff. Any omitted test MUST be documented
with a concrete reason and a follow-up task.

Rationale: Tests are the project record that clinical, operational, and user
flows continue to work as the system changes.

### III. Consistent User Experience
User-facing changes MUST follow existing interaction patterns, terminology,
accessibility expectations, and visual hierarchy. Interfaces MUST be responsive,
keyboard-accessible where applicable, readable at supported viewport sizes, and
consistent in validation, empty states, errors, loading states, and success
feedback. New UX patterns MUST be justified in the plan and validated against
the primary user scenarios in the specification.

Rationale: Inconsistent healthcare workflows create avoidable cognitive load
and increase the chance that users miss important information.

### IV. Performance Budgets and Measurement
Each feature plan MUST define measurable performance goals relevant to the
change, such as p95 response time, page load time, interaction latency, memory
use, bundle impact, query volume, or background job duration. Implementations
MUST avoid unnecessary work in hot paths, N+1 data access, avoidable blocking
I/O, and unbounded client or server processing. Performance-sensitive changes
MUST include measurement before release or a documented reason measurement is
not applicable.

Rationale: MedGuard must remain responsive under real operational load, not only
in isolated development scenarios.

### V. Security, Privacy, and Operational Reliability
Changes MUST protect sensitive health and account data by default. Access
control, input validation, error handling, auditability, and secure secret
handling MUST be considered for every feature. Logs MUST be useful for support
and debugging while avoiding sensitive data leakage. Failure modes MUST be
designed so users receive clear feedback and the system remains recoverable.

Rationale: Privacy, traceability, and predictable recovery are baseline
requirements for a medical guardrail product.

## Product and Engineering Constraints

Feature specifications MUST define target users, primary workflows, measurable
success criteria, accessibility expectations, and performance outcomes. Plans
MUST identify technology choices, data contracts, dependencies, operational
constraints, and risk areas before implementation begins. Any added dependency,
abstraction, background process, or persistent data model MUST have a clear
reason tied to a user scenario or maintainability requirement.

Features that touch user data, clinical context, authentication, authorization,
notifications, or reporting MUST include explicit edge cases for invalid input,
missing data, stale data, permission boundaries, and recoverable failures.

## Development Workflow and Quality Gates

All implementation plans MUST pass the Constitution Check before research and
again after design. The check MUST confirm:

- Code quality boundaries and ownership are explicit.
- Automated test coverage is planned for changed behavior.
- UX states and accessibility requirements are defined for user-facing work.
- Performance goals and measurement approach are documented.
- Security, privacy, and operational reliability risks are addressed.

Tasks MUST be organized so each user story is independently testable and can be
validated without relying on unrelated stories. A feature is not complete until
its tests pass, linting or formatting checks pass where configured, relevant
performance checks are complete, and any intentional exceptions are documented
in the plan or task list.

## Governance

This constitution supersedes conflicting local conventions, generated templates,
and informal process notes. Amendments MUST be proposed with a summary of the
principle or workflow change, the reason for the change, and the templates or
runtime guidance affected. Versioning follows semantic versioning:

- MAJOR for removing or redefining principles in a way that changes governance.
- MINOR for adding principles, required sections, or materially expanding gates.
- PATCH for clarifications that do not change compliance obligations.

Every specification, plan, and task list MUST be reviewed for constitution
compliance. Reviewers MUST block changes that bypass required tests, ignore
performance or UX requirements, weaken privacy protections, or leave
unexplained exceptions. When compliance cannot be achieved immediately, the
exception MUST be recorded with a named follow-up before delivery.

**Version**: 1.0.0 | **Ratified**: 2026-06-11 | **Last Amended**: 2026-06-11

# Quickstart: ZK Health Credential Sharing

## Prerequisites

- Node.js >=18
- Supabase project with email OTP Auth and Realtime enabled
- Terminal 3 testnet developer key and DID from the Terminal 3 claim flow
- Heroku account for backend deployment
- Vercel account for frontend deployment
- Local environment files for frontend and backend

## 1. Configure Environment

Create backend environment variables:

```text
NODE_ENV=development
PORT=4000
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
T3N_API_KEY=
T3N_ENVIRONMENT=testnet
T3N_AGENT_REGISTRATION_CONTRACT=
T3N_PRESENTATION_CONTRACT=
T3N_VERIFICATION_CONTRACT=
FRONTEND_ORIGIN=http://localhost:5173
```

Create frontend environment variables:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:4000
```

Backend secrets must never be exposed through Vite variables.

## 2. Initialize Supabase

1. Enable Supabase email OTP sign-in and configure the project email provider or
   Supabase development email delivery.
2. Create enum types for `role`, agent status, delegation status, proof status,
   verification status, claim status, and audit severity.
3. Apply migrations for tables in `data-model.md`.
4. Enable RLS on every table.
5. Add policies matching the RLS summary in `data-model.md`.
6. Enable Realtime for `audit_events`.

## 3. Start Local Services

```powershell
Set-Location D:\MedGuard
cd backend
npm install
npm run dev
```

In a second terminal:

```powershell
Set-Location D:\MedGuard
cd frontend
npm install
npm run dev
```

## 4. Verify Role Onboarding

1. Enter an email address and select the patient role.
2. Submit the Supabase email OTP request.
3. Verify the one-time code from email and confirm the app creates a patient
   profile row for the authenticated user.
4. Confirm the backend registers a Patient Agent DID through Terminal 3 and
   stores only DID metadata in Supabase.
5. Repeat OTP onboarding for clinic and insurer roles.
6. Confirm each user lands on the correct dashboard and cannot access another
   role's routes.

## 5. Verify Core Flows

Patient:
- Add credential metadata and confirm only hashes/references are stored.
- Create delegation for a clinic with expiry.
- Revoke delegation and confirm future requests are denied.

Clinic:
- Request a patient presentation.
- Submit a referral after approval.
- View approved presentations without raw health records.

Insurer:
- Request or receive eligibility proof.
- Approve or deny claim.
- View audit trail for decisions.

All roles:
- Confirm the shared audit log updates live.
- Confirm audit events omit raw records and PII.

## 6. Run Quality Gates

```powershell
Set-Location D:\MedGuard\backend
npm test

Set-Location D:\MedGuard\frontend
npm test
npm run test:e2e
```

Required checks:
- Express RBAC tests pass.
- Supabase RLS tests pass.
- REST contract tests match `contracts/openapi.yaml`.
- Playwright verifies patient, clinic, and insurer dashboard flows.
- Performance checks cover proof decision latency, revocation effectiveness, and
  audit event visibility.

## 7. Deploy to Heroku (Backend) + Vercel (Frontend)

1. Create a Heroku app for the backend (`backend/`) and a Vercel project for the frontend (`frontend/`).
2. Configure backend-only secrets (Supabase service role key, Terminal 3 keys) as Heroku Config Vars.
3. Configure frontend public variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`) in Vercel Environment Variables.
4. Set Heroku pipelines for staging and production environments.
5. Run Supabase migrations before promoting to production.
6. Smoke test email OTP login, role profile creation, DID registration, proof
   request, delegation revocation, claim decision, and live audit log.

## 8. Bounty Documentation Findings

Review `terminal3-bounty-findings.md` and submit verified onboarding bugs or
documentation gaps to Terminal 3 through the bounty channel or
`devrel@terminal3.io`.

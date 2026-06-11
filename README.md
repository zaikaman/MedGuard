# MedGuard

A multi-agent healthcare data platform using Terminal 3 Agent Auth SDK for zero-knowledge health credential sharing. Patients selectively disclose health credentials via ZK proofs to clinics and insurers — all without exposing raw medical records.

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│  Frontend   │────▶│    Backend       │────▶│  Supabase    │
│  React 18   │     │  Node + Express  │     │  PostgreSQL  │
│  Vite       │     │  TypeScript      │     │  + Auth + RLS│
│  Vercel     │     │  Heroku          │     │              │
└─────────────┘     └───────┬─────────┘     └──────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Terminal 3 T3N  │
                   │  TEE + DIDs + ZK │
                   │  (backend only)  │
                   └─────────────────┘
```

- **Backend**: Express API on Heroku — handles auth, Terminal 3 SDK calls, policy, audit
- **Frontend**: React 18 + Vite on Vercel — three role dashboards (patient, clinic, insurer)
- **Supabase**: Email OTP Auth, PostgreSQL metadata store, RLS policies, real-time audit events
- **Terminal 3**: TEE-secured agent DIDs, ZK proofs, raw health record boundary

## Prerequisites

- Node.js >=18 (see `.nvmrc`)
- Supabase project with email OTP Auth + Realtime enabled
- Terminal 3 testnet developer key

## Quick Start

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

See `specs/001-zk-health-credential-sharing/quickstart.md` for detailed setup.

## Project Structure

```
backend/        — Express API server
frontend/       — React + Vite dashboard app
supabase/       — Migrations, seed data, RLS tests
docs/           — Deployment and security documentation
specs/          — Feature specs, plans, research
```

## License

MIT

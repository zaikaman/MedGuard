# Heroku Deployment: Backend

## Prerequisites

- Heroku CLI installed and authenticated
- Git repository initialized

## Setup

1. Create a Heroku app:
   ```bash
   heroku create medguard-backend
   ```

2. Add the Node.js buildpack:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. Configure environment variables (Config Vars):
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=4000
   heroku config:set SUPABASE_URL=<your-supabase-url>
   heroku config:set SUPABASE_ANON_KEY=<your-supabase-anon-key>
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   heroku config:set T3N_API_KEY=<your-t3n-api-key>
   heroku config:set T3N_ENVIRONMENT=production
   heroku config:set T3N_AGENT_REGISTRATION_CONTRACT=<contract-address>
   heroku config:set T3N_PRESENTATION_CONTRACT=<contract-address>
   heroku config:set T3N_VERIFICATION_CONTRACT=<contract-address>
   heroku config:set FRONTEND_ORIGIN=<vercel-frontend-url>
   ```

4. Deploy:
   ```bash
   git push heroku main
   ```

## Staging Environment

Create a separate staging pipeline:
```bash
heroku create medguard-backend-staging
heroku pipelines:create medguard -a medguard-backend-staging --stage staging
heroku pipelines:add medguard -a medguard-backend --stage production
```

## Environment Separation

- **Production**: Production Config Vars with real API keys
- **Staging**: Separate Supabase project and Terminal 3 testnet keys
- Backend secrets must never appear in Vite frontend variables

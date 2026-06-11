# Vercel Deployment: Frontend

## Prerequisites

- Vercel CLI installed and authenticated
- Git repository pushed to GitHub

## Setup

1. Import the repository in the [Vercel Dashboard](https://vercel.com/new).

2. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. Set environment variables (public only):
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel env add VITE_API_BASE_URL
   ```
   The API base URL should point to the Heroku backend URL, e.g. `https://medguard-backend.herokuapp.com`.

4. Deploy:
   ```bash
   vercel --prod
   ```

## Staging Environment

Vercel automatically creates preview deployments for each Pull Request.
The staging environment should use the Heroku staging backend URL.

## Important Notes

- Only `VITE_` prefixed variables are exposed to the browser
- Never store backend secrets (service role key, Terminal 3 keys) in Vercel
- The API proxy in `vite.config.ts` is for local development only
- In production, the browser connects directly to the Heroku backend URL

# Vercel Deployment Guide — Pulse Frontend

This guide covers deploying the **Pulse Next.js frontend** to Vercel. The **FastAPI backend must be deployed separately** (Railway, Render, Fly.io, or VPS).

---

## Architecture Overview

```
┌─────────────────┐     HTTPS      ┌─────────────────┐
│   Vercel        │ ◄────────────► │  Backend API    │
│  (Frontend)     │  NEXT_PUBLIC   │  (FastAPI)      │
│                 │  _API_URL      │                 │
└─────────────────┘                └─────────────────┘
```

- **Frontend**: `client/` → Vercel (static + SSR)
- **Backend**: `server/` → Railway/Render/Fly.io/VPS (container)
- **Database**: Supabase/PostgreSQL (managed)

---

## Prerequisites

- [ ] GitHub repo with `client/` and `server/` folders
- [ ] Vercel account (free tier works)
- [ ] Backend deployed and accessible via HTTPS
- [ ] Supabase/PostgreSQL database running
- [ ] Domain (optional, for custom domain)

---

## Step 1: Prepare the Frontend for Vercel

### 1.1 Create `.env.example` in `client/`

```bash
# In client/ directory
cat > .env.example << 'EOF'
# Required: Backend API URL (must be HTTPS in production)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api/v1

# Optional: Analytics, feature flags
# NEXT_PUBLIC_GA_ID=
# NEXT_PUBLIC_SENTRY_DSN=
EOF
```

### 1.2 Verify `next.config.ts`

Current config is minimal. Add production optimizations:

```typescript
// client/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      // Add your backend domain for user avatars, etc.
      {
        protocol: "https",
        hostname: "your-backend-domain.com",
      },
    ],
  },
  // Enable output file tracing for better caching
  experimental: {
    outputFileTracingRoot: __dirname,
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 1.3 Update `package.json` — Ensure Build Script

Current scripts are fine:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

### 1.4 Test Local Build

```bash
cd client
npm run build
```

Should complete without errors. If TypeScript errors appear, fix them first.

---

## Step 2: Deploy Backend First (Required)

The frontend needs a working `NEXT_PUBLIC_API_URL`. Deploy backend **before** Vercel.

### Option A: Railway (Easiest for FastAPI)

1. Push `server/` to a GitHub repo (or use monorepo with Railway's `Dockerfile`)
2. Create `Dockerfile` in `server/`:

```dockerfile
# server/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

3. In Railway: New Project → Deploy from GitHub → Select repo → Set root to `server/`
4. Add environment variables in Railway dashboard
5. Get the generated HTTPS URL (e.g., `https://pulse-api.railway.app`)

### Option B: Render

Similar to Railway, use `Dockerfile` or native Python build.

### Option C: Fly.io

```bash
cd server
fly launch --dockerfile Dockerfile
fly deploy
```

### Option D: VPS (DigitalOcean, Linode, Hetzner)

Use Docker Compose with nginx + certbot for SSL.

---

## Step 3: Configure Supabase/Database

Ensure your database is accessible from the backend host.

### Supabase (Recommended)

1. Project created at https://supabase.com
2. Settings → Database → Connection pooling → Enable (port 6543)
3. Copy connection string:

```env
# For backend .env
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

4. Run migrations from backend host:
```bash
alembic upgrade head
```

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Connect Repository

1. Go to https://vercel.com/new
2. Import Git Repository → Select your repo
3. **Root Directory**: `client` (important!)
4. Framework Preset: **Next.js** (auto-detected)

### 4.2 Configure Build Settings

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `.next` (default) |
| Install Command | `npm install` |
| Development Command | `npm run dev` |

### 4.3 Add Environment Variables

In Vercel Project Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-domain.com/api/v1` | Production, Preview, Development |

> **Critical**: Must use HTTPS. Vercel blocks mixed content (HTTP API from HTTPS frontend).

### 4.4 Deploy

Click **Deploy**. First build takes 2-3 minutes.

---

## Step 5: Verify Deployment

### 5.1 Check Frontend

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Should load login page
3. Try registering a user

### 5.2 Check API Connection

Open browser DevTools → Network tab → Register → Check:
- Request to `https://your-backend.com/api/v1/auth/register` → **200 OK**
- No CORS errors
- No mixed content warnings

### 5.3 Test Full Flow

1. Register → Login → Dashboard
2. Create a client
3. Generate a draft
4. Verify data persists in Supabase

---

## Step 6: Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Project Settings → Domains → Add
2. Enter `app.yourdomain.com`
3. Vercel gives you DNS records (CNAME + A)

### 6.2 Configure DNS

| Type | Name | Value |
|------|------|-------|
| CNAME | `app` | `cname.vercel-dns.com` |
| A | `@` | `76.76.21.21` (Vercel's IP) |

### 6.3 Update Backend CORS

In backend `.env`:
```env
CORS_ORIGINS=["https://app.yourdomain.com", "https://your-project.vercel.app"]
```

Restart backend.

---

## Step 7: Preview Deployments (PRs)

Vercel auto-deploys PRs. For preview to work:

1. Backend needs a **staging environment** (separate Railway service, or Render preview)
2. In Vercel, preview deployments get unique URLs
3. Set `NEXT_PUBLIC_API_URL` per-preview via Vercel CLI or GitHub Actions

### GitHub Actions for Preview API URL

```yaml
# .github/workflows/vercel-preview.yml
name: Vercel Preview
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod=false'
          working-directory: ./client
        env:
          NEXT_PUBLIC_API_URL: https://staging-backend.yourdomain.com/api/v1
```

---

## Step 8: Production Checklist

| Item | Status |
|------|--------|
| Backend deployed with HTTPS | ☐ |
| Supabase/PostgreSQL accessible from backend | ☐ |
| `alembic upgrade head` run on backend | ☐ |
| Frontend builds locally (`npm run build`) | ☐ |
| `NEXT_PUBLIC_API_URL` set in Vercel (HTTPS) | ☐ |
| Backend CORS includes Vercel domain | ☐ |
| GitHub OAuth callback URLs updated | ☐ |
| Custom domain configured (optional) | ☐ |
| Preview deployments working | ☐ |
| Monitoring/alerts set up | ☐ |

---

## Troubleshooting

### Build Fails on Vercel

| Error | Fix |
|-------|-----|
| `Module not found` | Check import paths, case sensitivity (Linux vs Windows) |
| TypeScript errors | Run `npm run build` locally first |
| `NEXT_PUBLIC_API_URL` undefined | Add to Vercel Environment Variables |
| Font load errors | Ensure `@fontsource` packages in dependencies |

### Runtime Errors

| Issue | Fix |
|-------|-----|
| CORS error | Backend `CORS_ORIGINS` must include `https://*.vercel.app` and custom domain |
| 401 Unauthorized | Check JWT secret matches, token not expired |
| API calls fail | Verify `NEXT_PUBLIC_API_URL` ends with `/api/v1`, backend accessible |
| Mixed content | Backend MUST use HTTPS |

### Database Issues

| Issue | Fix |
|-------|-----|
| Connection timeout | Use Supabase connection pooler (port 6543), not direct (5432) |
| Migration fails | Run `alembic upgrade head` manually on backend host |
| SSL required | Supabase requires SSL — connection string should have `sslmode=require` |

---

## Environment Variable Reference

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### Backend (Railway/Render/Fly.io)
```env
# Security
SECRET_KEY=your-32-char-secret
ENCRYPTION_KEY=base64-32-byte-key
ALGORITHM=HS256

# Database
DATABASE_URL=postgresql://postgres:PASS@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true

# Redis (if using)
REDIS_URL=redis://default:PASS@redis-host:6379/0

# CORS
CORS_ORIGINS=["https://your-project.vercel.app", "https://app.yourdomain.com"]

# GitHub OAuth
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# AI
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

## Cost Estimate (Monthly)

| Service | Free Tier | Paid (Hobby) |
|---------|-----------|--------------|
| Vercel | ✅ Unlimited personal | $20/team |
| Railway | $5 credit/month | $5-20 |
| Render | ✅ 750 hrs/month | $7-25 |
| Fly.io | $5 credit/month | $5-20 |
| Supabase | ✅ 500MB DB, 2GB BW | $25 |
| **Total** | **~$0-5** | **~$30-90** |

---

## Quick Commands Reference

```bash
# Local development
cd client && npm run dev          # Frontend: localhost:3000
cd server && uvicorn app.main:app --reload --port 8000  # Backend

# Build test
cd client && npm run build

# Deploy backend (Railway)
cd server && railway up

# Deploy frontend (Vercel CLI)
cd client && vercel --prod

# Check logs
vercel logs https://your-project.vercel.app
railway logs
```

---

## Support Links

- [Vercel Next.js Docs](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Railway FastAPI Guide](https://docs.railway.com/guides/fastapi)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

*Generated for Pulse v1.0 — Frontend: Next.js 16 on Vercel, Backend: FastAPI on Railway/Render*
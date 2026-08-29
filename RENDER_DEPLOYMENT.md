# Render Deployment Guide — Pulse Backend (FastAPI)

This guide covers deploying the **Pulse FastAPI backend** to **Render**. The frontend deploys to Vercel separately.

---

## Why Render?

- ✅ Native Docker support
- ✅ Free tier: 750 hrs/month (enough for 24/7 hobby)
- ✅ Automatic HTTPS
- ✅ Easy environment variables
- ✅ PostgreSQL add-on available
- ✅ Zero-config deployments from GitHub

---

## Prerequisites

- [ ] GitHub repo with `server/` folder
- [ ] Render account (https://render.com)
- [ ] Supabase/PostgreSQL database (or use Render PostgreSQL)

---

## Step 1: Prepare Backend for Render

### 1.1 Create `Dockerfile` in `server/`

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

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Render uses $PORT)
EXPOSE 8000

# Run migrations then start server
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### 1.2 Verify `requirements.txt`

```text
fastapi==0.109.2
uvicorn[standard]==0.30.6
sqlalchemy==2.0.32
psycopg2-binary==2.9.9
pydantic==1.10.18
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
httpx==0.27.2
alembic==1.13.1
```

### 1.3 Verify `alembic.ini` Location

Ensure `alembic.ini` is in `server/` (not root):

```
server/
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
├── app/
├── Dockerfile
└── requirements.txt
```

### 1.4 Update `alembic/env.py` for Render

Ensure it reads `DATABASE_URL` from environment:

```python
# server/alembic/env.py
import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

config = context.config

# Override sqlalchemy.url from environment
if os.getenv("DATABASE_URL"):
    config.set_main_option("sqlalchemy.url", os.getenv("DATABASE_URL"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = None  # Or import your Base.metadata

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

---

## Step 2: Create Render Services

### 2.1 Create PostgreSQL Database (Optional — Supabase works too)

**Option A: Render PostgreSQL (Managed)**

1. Dashboard → New → PostgreSQL
2. Name: `pulse-db`
3. Plan: Free (1 GB, 90 days) or Starter ($7/mo)
4. Copy **Internal Connection String** (for backend):
   ```
   postgresql://user:pass@host:port/dbname
   ```

**Option B: Supabase (Recommended for Production)**

Use your existing Supabase project. Get connection string from Settings → Database → Connection pooling (port 6543):
```
postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
```

### 2.2 Create Web Service (FastAPI)

1. Dashboard → New → Web Service
2. **Connect Repository**: Select your GitHub repo
3. **Settings**:
   | Field | Value |
   |-------|-------|
   | Name | `pulse-api` |
   | Region | Oregon (US West) or closest to you |
   | Branch | `main` |
   | Root Directory | `server` |
   | Runtime | `Docker` |
   | Build Command | *(leave blank — Dockerfile handles it)* |
   | Start Command | *(leave blank — Dockerfile CMD handles it)* |

4. **Environment Variables** (add all):

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://...` | From Step 2.1 |
| `SECRET_KEY` | `openssl rand -hex 32` | Generate locally |
| `ENCRYPTION_KEY` | `openssl rand -base64 32` | Generate locally |
| `ALGORITHM` | `HS256` | |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | |
| `CORS_ORIGINS` | `["https://your-project.vercel.app", "https://app.yourdomain.com"]` | Add Vercel URL |
| `GITHUB_CLIENT_ID` | `xxx` | From GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | `xxx` | From GitHub OAuth app |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For AI drafts |
| `OPENAI_API_KEY` | `sk-...` | Fallback AI |
| `REDIS_URL` | *(optional)* | If using Redis |

5. **Advanced** → **Health Check Path**: `/health` (add this endpoint to FastAPI)

6. Click **Create Web Service**

---

## Step 3: Add Health Check Endpoint

In `server/app/main.py`, add:

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "pulse-api"}
```

Render will ping this to verify service is up.

---

## Step 4: Deploy and Verify

### 4.1 First Deploy

Render will:
1. Build Docker image
2. Run `alembic upgrade head` (from Dockerfile CMD)
3. Start `uvicorn` on `$PORT`

Watch logs in Render dashboard.

### 4.2 Verify Deployment

1. Get your URL: `https://pulse-api.onrender.com`
2. Test health: `https://pulse-api.onrender.com/health`
3. Test API docs: `https://pulse-api.onrender.com/docs`
4. Test CORS: Check headers include your Vercel domain

### 4.3 Run Migrations Manually (If Needed)

If `alembic upgrade head` fails in build:

1. Render Dashboard → Your Web Service → **Shell** tab
2. Run:
```bash
alembic upgrade head
```

---

## Step 5: Connect Frontend (Vercel)

### 5.1 Update Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://pulse-api.onrender.com/api/v1` | Production, Preview, Development |

### 5.2 Redeploy Frontend

```bash
# Trigger redeploy
vercel --prod
# Or push to main branch
```

---

## Step 6: Custom Domain (Optional)

### 6.1 Backend Custom Domain

1. Render Dashboard → `pulse-api` → Settings → Custom Domains
2. Add: `api.yourdomain.com`
3. Add DNS CNAME: `api` → `pulse-api.onrender.com`

### 6.2 Update CORS

In Render Environment Variables:
```env
CORS_ORIGINS=["https://your-project.vercel.app", "https://app.yourdomain.com"]
```

### 6.3 Update Vercel

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

---

## Step 7: Preview Deployments (PRs)

### 7.1 Render Preview Environments

Render auto-creates preview services for PRs:

1. Dashboard → `pulse-api` → Settings → **Preview Deployments** → Enable
2. Each PR gets: `https://pulse-api-pr-123.onrender.com`

### 7.2 Vercel Preview with Preview Backend

In Vercel, preview deployments need the preview backend URL.

**GitHub Actions** (`.github/workflows/vercel-preview.yml`):

```yaml
name: Vercel Preview
on:
  pull_request:
    types: [opened, synchronize, reopened]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Get Render Preview URL
        id: render
        run: |
          # Render preview URL pattern: https://pulse-api-pr-${{ github.event.number }}.onrender.com
          echo "url=https://pulse-api-pr-${{ github.event.number }}.onrender.com/api/v1" >> $GITHUB_OUTPUT
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod=false'
          working-directory: ./client
        env:
          NEXT_PUBLIC_API_URL: ${{ steps.render.outputs.url }}
```

---

## Render-Specific Tips

### Free Tier Limitations

| Limit | Free Tier |
|-------|-----------|
| Hours/month | 750 (enough for 24/7) |
| Spin-down | After 15 min inactivity |
| Cold start | ~30-60 seconds |
| Bandwidth | 100 GB/month |

**Workaround for spin-down**: Use a cron job (GitHub Actions) to ping `/health` every 10 min.

### Environment Variable Groups

Create **Environment Groups** in Render for shared vars across services:

1. Dashboard → Environment Groups → New Group
2. Name: `pulse-common`
3. Add shared vars: `SECRET_KEY`, `ENCRYPTION_KEY`, etc.
4. Attach to both Web Service and PostgreSQL

### Logs and Debugging

```bash
# View logs in Render Dashboard → Logs tab
# Or use Render CLI:
render logs pulse-api --tail
```

### Scaling

| Plan | CPUs | RAM | Price |
|------|------|-----|-------|
| Free | 0.5 | 512 MB | $0 |
| Starter | 1 | 1 GB | $7/mo |
| Standard | 2 | 4 GB | $25/mo |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails: `alembic: not found` | Ensure `alembic` in `requirements.txt` |
| Migration fails: `relation already exists` | Shell → `alembic stamp head && alembic upgrade head` |
| 502 Bad Gateway | Check health endpoint, ensure uvicorn binds to `0.0.0.0:$PORT` |
| CORS errors | Verify `CORS_ORIGINS` includes exact Vercel URL (no trailing slash) |
| Database connection timeout | Use Supabase pooler port 6543, not 5432 |
| Spin-down delays | Ping `/health` via cron, or upgrade to Starter |

---

## Quick Commands

```bash
# Local test with Docker
cd server
docker build -t pulse-api .
docker run -p 8000:8000 --env-file .env pulse-api

# Deploy via Render CLI (optional)
render deploy pulse-api

# View logs
render logs pulse-api --tail 100

# Shell into running container
render shell pulse-api
```

---

## Cost Summary

| Service | Free Tier | Paid |
|---------|-----------|------|
| Render Web Service | 750 hrs/mo, spins down | $7/mo (Starter) |
| Render PostgreSQL | 1 GB, 90 days | $7/mo (Starter) |
| Vercel Frontend | Unlimited personal | $20/team |
| Supabase (external) | 500 MB DB | $25/mo |
| **Total** | **~$0** | **~$14-60/mo** |

---

## Support Links

- [Render Docker Deploy](https://render.com/docs/deploy-docker-image)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
- [Render Custom Domains](https://render.com/docs/custom-domains)
- [Render Preview Deployments](https://render.com/docs/preview-deployments)
- [FastAPI on Render](https://render.com/docs/deploy-fastapi)

---

*Generated for Pulse v1.0 — Backend: FastAPI on Render, Frontend: Next.js 16 on Vercel*
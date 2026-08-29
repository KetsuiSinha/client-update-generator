# Pulse — Complete Project Setup Guide

This guide covers initializing the entire Pulse project: **FastAPI backend**, **Next.js 16 frontend**, and **database options**.

---

## Project Structure

```
client-update-generator/
├── client/                    # Next.js 16 Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   │   ├── dashboard/    # Protected dashboard routes
│   │   │   ├── login/        # Sign in page
│   │   │   └── register/     # Sign up page
│   │   ├── components/       # React components
│   │   │   ├── dashboard/    # DashboardLayout, DraftTrendChart
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/              # API client, auth context
│   │   └── hooks/            # Custom React hooks
│   ├── package.json
│   ├── tokens.css            # Design system (terracotta/amber, Cormorant/DM Sans)
│   └── next.config.ts
├── server/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/           # Auth, Clients, Drafts, Integrations
│   │   ├── services/         # GitHub, Ingestion, LLM, Relevance
│   │   ├── models/           # SQLAlchemy models
│   │   └── core/             # Config, DB, Security
│   ├── requirements.txt
│   ├── docker-compose.yml    # Postgres + Redis
│   └── alembic/              # Database migrations
├── DATABASE_SETUP.md         # Supabase/MongoDB detailed guide
├── OPENCODE_SETUP.md         # OpenCode Desktop configuration
└── SETUP.md                  # This file
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.11+ | Backend runtime |
| **Node.js** | 18+ | Frontend runtime |
| **npm** | 9+ | Frontend package manager |
| **Docker** | 24+ | Local Postgres + Redis (optional) |
| **Git** | 2.40+ | Version control |

---

## 1. Backend Setup (FastAPI)

### 1.1 Create Virtual Environment

```bash
cd server

# Create venv
python -m venv venv

# Activate
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### 1.2 Install Dependencies

```bash
pip install -r requirements.txt
```

**requirements.txt:**
```
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

### 1.3 Configure Environment

```bash
# Copy example and edit
cp .env.example .env
```

**Required `.env` variables:**
```env
# Application
APP_NAME="Pulse API"
API_V1_PREFIX="/api/v1"
DEBUG=true

# Security (REQUIRED - generate with: openssl rand -hex 32)
SECRET_KEY=your-32-char-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENCRYPTION_KEY=your-base64-encoded-32-byte-key  # For token encryption

# Database (choose ONE)
# Option A: SQLite (dev - default)
DATABASE_URL=sqlite:///./pulse.db

# Option B: PostgreSQL (local Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulse

# Option C: Supabase (production)
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Redis (for caching/background jobs)
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# GitHub OAuth (for integration)
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# AI Providers (at least one required for draft generation)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

### 1.4 Run Database Migrations

```bash
# Initialize Alembic (first time only)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 1.5 Start Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

**Verify:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- OpenAPI: http://localhost:8000/openapi.json

---

## 2. Database Options

### Option A: SQLite (Development Default)
- **Zero config** — file `pulse.db` created automatically
- Good for: local development, testing
- Limitations: no concurrent writes, no production use

### Option B: PostgreSQL via Docker (Local Development)

```bash
cd server
docker-compose up -d
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: pulse-postgres
    environment:
      POSTGRES_DB: pulse
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pulse"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: pulse-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  adminer:
    image: adminer:4.8.1
    container_name: pulse-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
```

**Access:**
- Postgres: `localhost:5432` (user: postgres, pass: postgres, db: pulse)
- Adminer: http://localhost:8080
- Redis: `localhost:6379`

**Update `.env`:**
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulse
REDIS_URL=redis://localhost:6379/0
```

### Option C: Supabase (Production)

See `DATABASE_SETUP.md` for detailed guide.

**Quick steps:**
1. Create project at https://supabase.com
2. Settings → Database → Copy connection string
3. Update `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres
   ```
4. Run migrations: `alembic upgrade head`

---

## 3. Frontend Setup (Next.js 16)

### 3.1 Install Dependencies

```bash
cd client
npm install
```

### 3.2 Configure Environment

```bash
# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
```

### 3.3 Start Development Server

```bash
npm run dev
```

**Verify:** http://localhost:3000

### 3.4 Build for Production

```bash
npm run build
npm start
```

---

## 4. Running Both Servers

### Terminal 1: Backend
```bash
cd server
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd client
npm run dev
```

### Terminal 3: Database (if using Docker)
```bash
cd server
docker-compose up -d
```

### Access Points
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Adminer (DB UI) | http://localhost:8080 |

---

## 5. GitHub OAuth Setup

Required for **GitHub integration** (fetching commits, PRs, issues).

### 5.1 Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Configure:
   - **Application name**: Pulse (or your name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8000/api/v1/auth/github/callback`
3. Copy **Client ID** and **Client Secret**

### 5.2 Add to Backend `.env`

```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

### 5.3 Test OAuth Flow

1. Start backend
2. Visit: http://localhost:8000/api/v1/auth/github
3. Should redirect to GitHub → authorize → redirect back to frontend

---

## 6. AI Provider Keys

Required for **draft generation** (at least one).

### Anthropic (Recommended — Claude)
1. Get key: https://console.anthropic.com/settings/keys
2. Add to backend `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```

### OpenAI (Fallback — GPT)
1. Get key: https://platform.openai.com/api-keys
2. Add to backend `.env`:
   ```env
   OPENAI_API_KEY=sk-...
   ```

### Test AI Generation
```bash
# In backend directory with venv active
python -c "
from app.services.llm import generate_draft
import asyncio
result = asyncio.run(generate_draft(...))
print(result)
"
```

---

## 7. Docker Compose (Full Stack)

### Start All Services
```bash
cd server
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Reset Database (Careful — destroys data!)
```bash
docker-compose down -v
docker-compose up -d
# Then run: alembic upgrade head
```

---

## 8. Alembic Migrations

### Common Commands

```bash
cd server

# Create new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show history
alembic history --verbose
```

### Migration Files Location
```
server/alembic/versions/
```

---

## 9. Environment Variable Templates

### Backend (server/.env.example)
```env
# Application
APP_NAME="Pulse API"
API_V1_PREFIX="/api/v1"
DEBUG=true

# Security (REQUIRED)
SECRET_KEY=generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ENCRYPTION_KEY=base64-encoded-32-byte-key

# Database (choose one)
# DATABASE_URL=sqlite:///./pulse.db
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulse
# DATABASE_URL=postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# AI Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

### Frontend (client/.env.example)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 10. Troubleshooting

### Backend Issues

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Ensure venv activated, run `pip install -r requirements.txt` |
| `DATABASE_URL` errors | Check `.env` exists, verify connection string format |
| Migration fails | Delete `alembic/versions/*.py`, re-run `alembic revision --autogenerate` |
| CORS errors | Ensure `CORS_ORIGINS` matches frontend URL exactly |
| GitHub OAuth fails | Verify callback URL matches exactly: `http://localhost:8000/api/v1/auth/github/callback` |
| AI generation fails | Check API key valid, verify provider has credits |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| `npm install` fails | Delete `node_modules`, `package-lock.json`, re-run `npm install` |
| TypeScript errors | Run `npm run build` to see full errors |
| API calls fail | Verify `NEXT_PUBLIC_API_URL` in `.env.local`, check backend running |
| Hydration mismatch | Check for client/server rendering differences |

### Database Issues

| Issue | Solution |
|-------|----------|
| Postgres connection refused | Ensure Docker container running: `docker-compose ps` |
| Migration "relation already exists" | Run `alembic stamp head` then `alembic upgrade head` |
| SQLite "database locked" | Ensure no other process using `pulse.db` |
| Supabase timeout | Add `?pgbouncer=true` to connection string, use port 6543 |

### Docker Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Change ports in `docker-compose.yml` (5432→5433, 6379→6380) |
| Volume permission errors | Run `docker-compose down -v` and restart |
| Adminer can't connect | Wait for postgres healthcheck to pass |

---

## 11. Development Workflow

### Daily Start
```bash
# Terminal 1
cd server && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd client && npm run dev

# Terminal 3 (if using Docker)
cd server && docker-compose up -d
```

### Making Changes
1. **Backend**: Edit `server/app/` → auto-reloads
2. **Frontend**: Edit `client/src/` → hot reload
3. **Database models**: Edit `server/app/models/` → create migration → `alembic upgrade head`

### Before Commit
```bash
# Backend
cd server && python -m pytest tests/ -v

# Frontend
cd client && npm run lint && npm run build
```

---

## 12. Production Deployment Checklist

- [ ] Use PostgreSQL (not SQLite)
- [ ] Set `DEBUG=false`
- [ ] Generate strong `SECRET_KEY` (32+ chars)
- [ ] Generate `ENCRYPTION_KEY` (32 bytes, base64)
- [ ] Use Supabase or managed Postgres
- [ ] Configure reverse proxy (nginx) + HTTPS
- [ ] Set up Gunicorn/Uvicorn workers
- [ ] Configure Celery + Redis for background jobs
- [ ] Set up monitoring/logging
- [ ] Configure backup strategy for database

---

## Quick Reference Commands

```bash
# Backend
cd server
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
alembic upgrade head
alembic revision --autogenerate -m "msg"

# Frontend
cd client
npm run dev
npm run build
npm run lint

# Database
cd server
docker-compose up -d
docker-compose down -v

# Full stack
docker-compose -f server/docker-compose.yml up -d
```

---

## Support

- **README.md** — Project overview
- **DATABASE_SETUP.md** — Detailed Supabase/MongoDB guide
- **OPENCODE_SETUP.md** — OpenCode Desktop configuration
- **API Docs** — http://localhost:8000/docs (when backend running)

---

*Generated for Pulse v1.0 — AI Client Updates for Agencies*
# Pulse — Database Setup Guide

This guide covers initializing Pulse with **Supabase (PostgreSQL)** or **MongoDB**.

---

## Current Architecture

- **Backend**: FastAPI + SQLAlchemy 2.0
- **Current DB**: SQLite (dev) → PostgreSQL (prod via Docker)
- **ORM**: SQLAlchemy (sync)
- **Migrations**: Alembic

---

## Option 1: Supabase (Recommended — PostgreSQL)

Supabase is managed PostgreSQL. Zero code changes needed — just update the connection string.

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose region, set database password, wait for provisioning (~2 min)
3. Go to **Settings → Database** → Copy **Connection String (URI)**

   Format:
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

### 2. Configure Environment

**Server (`server/.env`):**
```env
# Replace with your Supabase connection string
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres

# Required for auth
SECRET_KEY=your-32-char-secret-key-here
CORS_ORIGINS=["http://localhost:3000"]

# Optional: GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Optional: AI providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Encryption key for token storage (32 bytes, base64)
ENCRYPTION_KEY=your-base64-encoded-32-byte-key
```

**Client (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3. Run Migrations

```bash
cd server
source venv/bin/activate  # Windows: venv\Scripts\activate
alembic upgrade head
```

### 4. Verify Connection

```bash
# Test DB connectivity
python -c "from app.core.database import engine; print(engine.url)"

# Or use Supabase Dashboard → Table Editor to see tables
```

### 5. Enable Row Level Security (Optional but Recommended)

Supabase RLS adds per-row access control. For Pulse:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tone_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

-- Example policy: users see only their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "clients_own_data" ON clients
  FOR ALL USING (user_id = auth.uid());

-- Repeat for drafts, integrations, etc.
```

> **Note**: RLS requires Supabase Auth (not the current JWT auth). For now, application-level filtering in the API is sufficient.

### 6. Production Deploy Notes

- Use **Supabase Connection Pooler** (PgBouncer) for serverless:
  ```
  postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
  ```
- Set `pool_pre_ping=True` and `pool_recycle=300` in `database.py`
- Enable **Point-in-Time Recovery** in Supabase dashboard

---

## Option 2: MongoDB (Requires Code Changes)

MongoDB requires replacing SQLAlchemy with an async ODM like **Beanie** or **Motor**. This is a significant refactor.

### 1. Install Dependencies

```bash
cd server
pip install motor beanie pymongo[snappy]
# Or: pip install motor beanie
```

Update `requirements.txt`:
```
fastapi==0.109.2
uvicorn[standard]==0.30.6
motor==3.3.2
beanie==1.23.6
pydantic==2.8.2  # v2 required for Beanie
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
python-dotenv==1.0.1
httpx==0.27.2
```

### 2. New Database Module (`app/core/mongodb.py`)

```python
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models import __all__ as all_models  # Import all document models

client: AsyncIOMotorClient = None

async def init_mongodb():
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    # Initialize Beanie with document models
    await init_beanie(database=db, document_models=all_models)

async def close_mongodb():
    if client:
        client.close()

def get_mongodb():
    return client[settings.MONGODB_DB_NAME]
```

### 3. Update Config (`app/core/config.py`)

```python
class Settings(BaseSettings):
    # ... existing settings ...
    
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "pulse"
    
    # Remove DATABASE_URL, REDIS_URL
```

### 4. Convert Models to Beanie Documents

**Example: `app/models/user.py`**
```python
from beanie import Document
from pydantic import EmailStr
from datetime import datetime

class User(Document):
    email: EmailStr
    full_name: str | None = None
    hashed_password: str
    is_active: bool = True
    created_at: datetime = datetime.utcnow()
    
    class Settings:
        name = "users"
        indexes = ["email"]
```

**All models need conversion:**
- `User` → `Document`
- `Client` → `Document`
- `Draft` → `Document`
- `Integration` → `Document`
- `ToneProfile` → `Document`
- `ActivityEvent` → `Document`

### 5. Update API Routes for Async

```python
# Before (SQLAlchemy sync)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# After (MongoDB async)
async def get_db():
    db = get_mongodb()
    yield db
```

All route handlers become `async def` and use `await` for DB operations.

### 6. MongoDB Atlas Setup (Production)

1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pulse?retryWrites=true&w=majority
   ```
3. Add to `server/.env`:
   ```env
   MONGODB_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/pulse?retryWrites=true&w=majority
   MONGODB_DB_NAME=pulse
   ```

### 7. Indexes & Performance

Beanie auto-creates indexes from model definitions. For production:

```python
class Draft(Document):
    # ...
    class Settings:
        indexes = [
            "client_id",
            "week_of",
            "status",
            [("client_id", 1), ("week_of", -1)],  # Compound
        ]
```

---

## Quick Comparison

| Aspect | Supabase (PostgreSQL) | MongoDB |
|--------|----------------------|---------|
| **Code Changes** | None (drop-in) | Major (new ODM, async routes) |
| **Migration Tool** | Alembic (built-in) | Beanie auto-index / manual |
| **Relational Data** | Native (FK, joins) | Manual references / `$lookup` |
| **Auth Integration** | Supabase Auth (optional) | Custom / Clerk / Auth0 |
| **Realtime** | Supabase Realtime | Change Streams |
| **Cost (Hobby)** | Free tier generous | Free tier (M0) limited |
| **Type Safety** | SQLAlchemy + Pydantic | Beanie + Pydantic v2 |

---

## Recommendation

**Use Supabase.** It's PostgreSQL-compatible, requires zero backend changes, and gives you:
- Managed Postgres with backups/PoITR
- Optional Auth, Realtime, Storage, Edge Functions
- Dashboard for data exploration
- Generous free tier (500MB DB, 2GB bandwidth)

Only choose MongoDB if you have a specific need for flexible schemas or massive horizontal scaling.

---

## Quick Start Checklist (Supabase)

- [ ] Create Supabase project
- [ ] Copy connection string to `server/.env` → `DATABASE_URL`
- [ ] Set `SECRET_KEY`, `CORS_ORIGINS`, OAuth keys
- [ ] Run `alembic upgrade head` in `server/`
- [ ] Start backend: `uvicorn app.main:app --reload --port 8000`
- [ ] Start frontend: `npm run dev` in `client/`
- [ ] Visit `http://localhost:3000` → Register → Test

---

## Troubleshooting

**`alembic upgrade head` fails with "relation already exists"**
```bash
# Stamp current state without running migrations
alembic stamp head
```

**Supabase connection times out**
- Check IP allowlist in Supabase → Settings → Database → **Connection Pooling** → Allowed IPs (add `0.0.0.0/0` for dev)
- Use pooler port `6543` instead of `5432`

**CORS errors**
- Ensure `CORS_ORIGINS` in `.env` matches your frontend URL exactly (no trailing slash)

**Migration import errors**
```bash
# From server/ directory
PYTHONPATH=. alembic upgrade head
```
# Pulse — AI Client Updates for Agencies

Turn project activity into polished client updates in minutes. Connect GitHub, Linear, Slack, Trello. Built for agencies managing 10–50 clients.

## Overview

Pulse automates the weekly client update process by:

1. **Ingesting activity** from connected tools (GitHub, Linear, Slack, Trello)
2. **Filtering for relevance** using rule-based scoring (threshold ≥ 30)
3. **Generating structured drafts** via LLM (Claude/OpenAI) matching client tone profiles
4. **Enabling review & edit** in a split-view dashboard
5. **Delivering** via copy-to-clipboard, email, Slack, or Notion

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy 2.0, SQLite (dev) / PostgreSQL (prod) |
| **Auth** | JWT + GitHub OAuth, bcrypt passwords, token encryption |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **UI** | Tailwind CSS v4, shadcn/ui components, Lucide icons |
| **LLM** | Anthropic Claude (primary) / OpenAI GPT (fallback) |
| **Date handling** | date-fns |

## Project Structure

```
client-update-generator/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/     # Protected dashboard routes
│   │   │   │   ├── page.tsx           # Overview with stats
│   │   │   │   ├── clients/           # Client CRUD
│   │   │   │   ├── drafts/            # Draft list + editor
│   │   │   │   │   └── new/           # Generate new draft
│   │   │   │   └── settings/          # Integrations, tone, account
│   │   │   ├── login/               # Sign in page
│   │   │   └── register/            # Sign up page
│   │   ├── components/
│   │   │   ├── dashboard/       # DashboardLayout (sidebar + auth guard)
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── api.ts           # Typed API client + endpoints
│   │   │   └── auth.tsx         # Auth context (login/register/logout)
│   │   └── hooks/
│   └── package.json
├── server/                     # FastAPI backend
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── auth.py           # JWT + GitHub OAuth
│   │   │   ├── clients.py        # Client CRUD
│   │   │   └── drafts.py         # Draft gen, list, update, finalize
│   │   ├── services/
│   │   │   ├── github.py         # GitHub API client + normalization
│   │   │   ├── ingestion.py      # Activity ingestion pipeline
│   │   │   ├── relevance.py      # Rule-based relevance scoring
│   │   │   └── llm.py            # LLM prompt building + providers
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   └── core/                # Config, security, encryption, DB
│   └── requirements.txt
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- GitHub OAuth App (for GitHub integration)

### Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # Then edit with your values
# Required: SECRET_KEY, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
# Optional: ANTHROPIC_API_KEY or OPENAI_API_KEY for AI generation

# Run database migrations (creates pulse.db)
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8000
```

Server runs at `http://localhost:8000` with API docs at `/api/v1/openapi.json`

### Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Configure environment
# Create .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:3000`

### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Set:
   - **Application name**: Pulse (or your name)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8000/api/v1/auth/github/callback`
3. Copy Client ID and Client Secret to `server/.env`

## Core Features

### 1. Authentication
- Email/password registration & login
- JWT access (30 min) + refresh tokens (7 days)
- GitHub OAuth for integration connection
- Protected routes redirect to `/login`

### 2. Client Management
- Create, list, delete clients
- Each client gets a default tone profile
- Link GitHub repositories via `ClientProjectLink`

### 3. Activity Ingestion
- Pulls commits, PRs, issues, releases from GitHub
- Normalizes to `ActivityEvent` with relevance scoring
- Runs on-demand (draft generation) or scheduled (weekly job)
- Deduplicates by `integration_id + source + raw_ref`

### 4. Relevance Scoring (0–100)
| Signal | Boost |
|--------|-------|
| Release/deploy | +25 |
| Merged PR | +20 |
| Feature commit (feat:/fix:) | +10–15 |
| Bot/dependabot | -20 |
| Trivial (typo/lint/chore) | -10 to -15 |

Threshold: **≥ 30** passes to draft generation

### 5. Draft Generation
```
Activity Events → LLM (Claude/OpenAI) → Structured JSON:
{
  "done": [...],
  "in_progress": [...],
  "blocked": [...],
  "next": [...]
}
```
- Uses client tone profile (formality, verbosity, examples)
- Falls back to rule-based mock if no LLM key configured
- Saves as `Draft` with status `draft` → `edited` → `sent`

### 6. Draft Editor
- Split view: list (left) + preview/edit (right)
- Per-section inline editing (Done/In Progress/Blocked/Next)
- Copy to clipboard, export .txt, mark Sent, delete

### 7. Tone Profiles
- Global default + per-client override
- Formality (1–10), Verbosity (1–10)
- Style notes + 1–3 example updates
- Stored as JSON, passed to LLM prompt

### 8. Integrations
- GitHub (fully implemented): OAuth, repo linking, activity sync
- Linear, Slack, Trello: stubbed for future

## API Endpoints

```
Auth:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
GET    /api/v1/auth/github              # OAuth redirect
GET    /api/v1/auth/github/callback     # OAuth callback
POST   /api/v1/auth/github/disconnect

Clients:
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/{id}
PATCH  /api/v1/clients/{id}
DELETE /api/v1/clients/{id}
POST   /api/v1/clients/{id}/drafts/generate
GET    /api/v1/clients/{id}/drafts

Drafts:
GET    /api/v1/drafts
GET    /api/v1/drafts/{id}
PATCH  /api/v1/drafts/{id}
POST   /api/v1/drafts/{id}/finalize
DELETE /api/v1/drafts/{id}
```

## Development Notes

### Running Tests (Backend)
```bash
cd server
python -m unittest discover -s tests -v
```

### Lint/Typecheck (Frontend)
```bash
cd client
npm run lint
npm run build   # includes TypeScript check
```

### Database
- Dev: SQLite file `pulse.db` (auto-created)
- Prod: Set `DATABASE_URL=postgresql://...` in `.env`
- Models in `server/app/models/__init__.py`
- Migrations via Alembic (`alembic revision --autogenerate -m "msg"`)

### Adding a New Integration
1. Add provider to `IntegrationProvider` enum in `schemas/__init__.py`
2. Create `services/{provider}.py` with client + normalization
3. Update `ingestion.py` to call new provider
4. Add OAuth flow in `auth.py` if needed
5. Add UI card in Settings page

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing key (32+ chars) |
| `DATABASE_URL` | Yes | SQLite or PostgreSQL URL |
| `CORS_ORIGINS` | Yes | Frontend origin(s) |
| `GITHUB_CLIENT_ID` | For GitHub | OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | For GitHub | OAuth app secret |
| `ANTHROPIC_API_KEY` | For AI | Claude API key |
| `OPENAI_API_KEY` | Fallback AI | GPT API key |
| `ENCRYPTION_KEY` | Prod | 32-byte key for token encryption |

## Deployment Notes

- Use PostgreSQL in production
- Set `DEBUG=False`, strong `SECRET_KEY`, `ENCRYPTION_KEY`
- Configure reverse proxy (nginx) + HTTPS
- Run backend with Gunicorn/Uvicorn workers
- Build frontend: `npm run build && npm start`
- Consider Celery + Redis for scheduled ingestion jobs

## License

MIT# Force redeploy Sun, Aug 30, 2026 12:39:30 PM
# Force redeploy Sun, Aug 30, 2026  1:08:37 PM

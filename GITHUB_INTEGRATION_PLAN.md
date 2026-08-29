# GitHub Integration + Ingestion Pipeline — Detailed Task Plan

**Project:** Pulse — Client Update Generator  
**Phase:** 1 (MVP — GitHub only)  
**Target:** 2–3 weeks

---

## Overview

This plan covers the complete GitHub integration: OAuth authentication, API client for fetching activity, background ingestion pipeline with normalization, rule-based relevance filtering, and draft generation endpoint.

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   GitHub    │────▶│  GitHub API      │────▶│  Ingestion       │
│   OAuth     │     │  Client Service  │     │  Job (Celery)    │
└─────────────┘     └──────────────────┘     └────────┬─────────┘
                                                      │
                                                      ▼
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Draft     │◀────│  Draft Gen       │◀────│  ActivityEvent   │
│   Endpoint  │     │  Endpoint        │     │  (PostgreSQL)    │
└─────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Task Breakdown

### 1. Infrastructure Setup (Day 1)

#### 1.1 Docker Compose for Local Development
- [ ] Create `docker-compose.yml` in `server/` with:
  - PostgreSQL 16 (port 5432, database `pulse`, user `postgres`/`postgres`)
  - Redis 7 (port 6379)
  - Adminer (port 8080) for DB inspection
- [ ] Update `.env` with local connection strings
- [ ] Verify `alembic` migrations run against local DB

#### 1.2 Celery Configuration
- [ ] Add `celery` and `celery[redis]` to `requirements.txt`
- [ ] Create `app/core/celery.py` — Celery app with Redis broker
- [ ] Create `app/core/celery_config.py` — task routes, beat schedule
- [ ] Add Celery worker startup script

---

### 2. GitHub OAuth Flow (Days 2–3)

#### 2.1 Database Migration
- [ ] Generate Alembic migration for any new columns (if needed)
- [ ] Verify `Integration` model has all required fields:
  - `provider` (github)
  - `access_token` (encrypted)
  - `refresh_token` (encrypted)
  - `expires_at`
  - `scopes` (JSON string)
  - `metadata` (JSON string for installation info)

#### 2.2 Encryption Utility
- [ ] Create `app/core/encryption.py` — Fernet-based token encryption
- [ ] Add `ENCRYPTION_KEY` to settings (generate via `Fernet.generate_key()`)
- [ ] Update `Integration` model methods: `set_access_token()`, `get_access_token()`

#### 2.3 OAuth Routes (`app/api/v1/auth.py`)
- [ ] `GET /auth/github` — Redirect to GitHub OAuth authorize URL
  - Scopes: `repo`, `read:user`, `read:org`, `user:email`
  - State parameter for CSRF protection
- [ ] `GET /auth/github/callback` — Handle GitHub callback
  - Exchange code for access token
  - Fetch user info + installation details
  - Create/update `Integration` record
  - Redirect to frontend dashboard with success
- [ ] `POST /auth/github/disconnect` — Revoke token, delete integration

#### 2.4 GitHub App vs OAuth App Decision
- [ ] **Decision point**: Use GitHub App (per-installation tokens, better for orgs) or OAuth App (simpler, per-user)
- [ ] For MVP: **OAuth App** — simpler, covers individual freelancer use case
- [ ] Document choice in `docs/architecture/github-auth-decision.md`

---

### 3. GitHub API Client Service (Days 4–5)

#### 3.1 Service Module: `app/services/github.py`
- [ ] `GitHubClient` class with:
  - `access_token` property (auto-refresh if expired)
  - Rate limit handling (respect `X-RateLimit-Remaining`, backoff on 403)
  - Pagination helper (Link header parsing)

#### 3.2 Core Methods
- [ ] `get_user_installations()` → list of repos/user has access to
- [ ] `get_repo_commits(owner, repo, since, until)` → commits in date range
- [ ] `get_repo_pull_requests(owner, repo, state, since)` → PRs (open/closed/merged)
- [ ] `get_repo_issues(owner, repo, state, since)` → issues
- [ ] `get_repo_releases(owner, repo)` → releases/tags

#### 3.3 Normalization Helpers
- [ ] `normalize_commit(commit, repo_full_name)` → `ActivityEvent` dict
- [ ] `normalize_pr(pr, repo_full_name)` → `ActivityEvent` dict
- [ ] `normalize_issue(issue, repo_full_name)` → `ActivityEvent` dict
- [ ] `normalize_release(release, repo_full_name)` → `ActivityEvent` dict

**Normalized Schema** (matches `ActivityEvent` model):
```python
{
    "source": "github",
    "event_type": "commit|pull_request|issue|release",
    "summary": "Human-readable one-liner",
    "actor": "github_username",
    "raw_payload": json.dumps(original_object),
    "timestamp": datetime,
    "relevance_score": 0  # set later by filter
}
```

---

### 4. Ingestion Background Job (Days 6–8)

#### 4.1 Job Module: `app/services/ingestion.py`
- [ ] `ingest_client_activity(client_id: int, weeks_back: int = 1)` — main entry point
  - Fetch all active `ClientIntegration` for client where provider=github
  - For each integration, call GitHub API client
  - Normalize events
  - Apply relevance filter
  - Bulk insert `ActivityEvent` records
  - Return summary: `{events_fetched, events_stored, events_filtered_out}`

#### 4.2 Scheduling (Celery Beat)
- [ ] Configure beat schedule in `celery_config.py`:
  - Weekly: every Monday 6 AM UTC → `ingest_all_clients_weekly`
  - On-demand: `ingest_client_activity.delay(client_id)`

#### 4.3 Orchestration Task
- [ ] `ingest_all_clients_weekly()` — iterate all clients with active GitHub integrations
- [ ] Add retry logic with exponential backoff (max 3 retries)
- [ ] Add logging/metrics (structured logs for debugging)

#### 4.4 Idempotency
- [ ] Prevent duplicate events: unique constraint on `(integration_id, source, event_type, raw_ref)` where `raw_ref` = commit SHA / PR number / issue number
- [ ] Use `ON CONFLICT DO NOTHING` (PostgreSQL) or check-before-insert

---

### 5. Rule-Based Relevance Filter (Day 9)

#### 5.1 Filter Module: `app/services/relevance.py`
- [ ] `RelevanceFilter` class with scoring rules:

**High Signal (+10 to +20):**
- Merged PR with "feat:", "feature:", "add:", "implement:"
- Release/tag created
- Issue closed with label "bug", "feature", "enhancement"
- Commit message contains: "deploy", "release", "ship", "launch", "fix"

**Medium Signal (+5 to +10):**
- PR opened (work in progress)
- Issue opened
- Commit with conventional commit prefixes: "fix:", "refactor:", "perf:"

**Low Signal (0 to +5):**
- Regular commits without clear signals
- PR review comments
- Issue comments

**Negative Signal (-10 to 0):**
- Commit message contains: "typo", "whitespace", "format", "lint", "chore:", "style:", "wip"
- Bot commits (dependabot, renovate)
- Merge commits (unless they represent a feature branch merge)

#### 5.2 Scoring Function
- [ ] `calculate_relevance(event: ActivityEvent) → int` (0–100)
- [ ] Store score in `ActivityEvent.relevance_score`
- [ ] Threshold: only events with score ≥ 30 passed to draft generation

---

### 6. Draft Generation Endpoint (Days 10–12)

#### 6.1 LLM Service: `app/services/llm.py`
- [ ] Abstract provider interface (Claude, OpenAI, etc.)
- [ ] `generate_draft(activity_events: List[ActivityEvent], tone_profile: ToneProfile) → str`
- [ ] Prompt template with:
  - System prompt: role, structure (Done / In Progress / Blocked / Next)
  - Tone profile: formality, verbosity, example updates (few-shot)
  - Filtered activity events (sorted by relevance_score desc, then timestamp)

#### 6.2 API Endpoint: `app/api/v1/drafts.py`
- [ ] `POST /clients/{client_id}/drafts/generate`
  - Body: `{ "week_of": "2026-07-27" }` (optional, defaults to last Monday)
  - Fetch activity events for client + week
  - Fetch tone profile (or use default)
  - Call LLM service
  - Create `Draft` record with status="draft"
  - Return draft content + ID

- [ ] `GET /clients/{client_id}/drafts` — list drafts with pagination
- [ ] `GET /drafts/{draft_id}` — get single draft
- [ ] `PATCH /drafts/{draft_id}` — update draft content (user edits)
- [ ] `POST /drafts/{draft_id}/finalize` — mark as sent, capture diff for feedback loop

#### 6.3 Tone Profile Integration
- [ ] If `client.tone_profile_id` exists, load `ToneProfile.example_updates`
- [ ] Inject as few-shot examples in prompt
- [ ] Fallback: generic professional tone (no examples)

---

### 7. Database Migrations Summary

Run in order:
1. `alembic revision --autogenerate -m "add_encryption_key_to_settings"` (if needed)
2. `alembic revision --autogenerate -m "add_github_oauth_fields"` (if needed)
3. `alembic revision --autogenerate -m "add_unique_constraint_activity_events"` (for idempotency)

---

## File Structure After Implementation

```
server/app/
├── api/v1/
│   ├── auth.py           # + GitHub OAuth routes
│   ├── clients.py        # existing
│   └── drafts.py         # NEW: draft generation + management
├── core/
│   ├── celery.py         # NEW: Celery app
│   ├── celery_config.py  # NEW: beat schedule, routes
│   ├── encryption.py     # NEW: token encryption
│   └── ...
├── services/
│   ├── github.py         # NEW: GitHub API client
│   ├── ingestion.py      # NEW: background ingestion job
│   ├── relevance.py      # NEW: rule-based relevance filter
│   └── llm.py            # NEW: LLM draft generation
├── models.py             # existing (verify fields)
└── schemas/
    ├── draft.py          # NEW: draft request/response models
    └── ...
```

---

## Testing Checklist

- [ ] GitHub OAuth: connect → callback → token stored → can fetch repos
- [ ] Ingestion job: runs weekly, stores events, no duplicates
- [ ] Relevance filter: scores known event types correctly
- [ ] Draft generation: returns structured draft with 4 sections
- [ ] End-to-end: connect GitHub → ingest → generate draft → edit → finalize

---

## Dependencies to Add

```txt
# requirements.txt additions
celery==5.3.6
redis==5.0.1
cryptography==42.0.8  # for Fernet
anthropic==0.18.1     # or openai==1.12.0 for LLM
python-dateutil==2.9.0
```

---

## Estimated Timeline

| Week | Focus |
|------|-------|
| 1 | Infrastructure (Docker, Celery) + GitHub OAuth |
| 2 | GitHub API client + Ingestion job + Relevance filter |
| 3 | Draft generation endpoint + LLM integration + Testing |

---

## Next Immediate Action

**Start with Task 1.1:** Create `docker-compose.yml` in `server/` and verify local Postgres + Redis come up cleanly.
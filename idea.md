# Pulse — AI-Powered Client Update Generator for Freelancers & Agencies

> A working name — swap it for whatever you like. This doc covers the problem, product, architecture, AI approach, tech stack, MVP scope, and monetization plan.

---

## 1. The Problem

Freelancers and small agencies spend **2–3 hours per client per week** writing status updates. This work is:

- **Repetitive** — the raw information (tasks done, commits pushed, messages sent) already exists in tools like Trello, Asana, GitHub, and Slack.
- **High-stakes** — a bad or late update damages client trust and retention, so people can't just skip it.
- **Underserved by existing tools** — Notion, Trello, and Asana organize work but don't *communicate* it. There's no tool that turns raw project activity into a polished, client-ready narrative.

The freelancer's actual job — writing the update — is manual synthesis: open five tabs, remember what happened, translate internal jargon into client-friendly language, match the tone they've used before, and format it. That's exactly the kind of structured-but-messy synthesis task AI is good at, *if* it's fed the right data.

---

## 2. The Product

**Pulse connects to a freelancer's existing project tools, watches what actually happened during the week, and drafts a client-ready update automatically.** The freelancer reviews, tweaks if needed, and sends — in minutes instead of hours.

### Core user flow

1. Freelancer connects their tools (Trello, Asana, GitHub, Slack) and adds a client.
2. Freelancer uploads 1–3 examples of past updates they've sent that client (for tone calibration) — or skips this and uses a generic professional tone to start.
3. Every week (or on-demand), Pulse pulls the relevant activity for that client's project(s).
4. The AI layer turns that activity into a structured draft: what was done, what's in progress, what's blocked, what's next.
5. Freelancer reviews the draft in-app, edits inline, and either sends via Pulse (email) or copies it to their own channel (email, Slack, client portal).
6. Every approved/edited update becomes training signal — Pulse gets better at matching that freelancer's voice and that client's expectations over time.

### What makes this defensible (not a wrapper)

The AI-generation step (turning structured activity into prose) is the *easy* part — any LLM API can roughly do that with a good prompt. The actual hard engineering, and the reason this is a real product rather than a ChatGPT macro, is:

- **The integration layer**: pulling clean, structured signal out of messy, inconsistent tool activity (a GitHub commit message, a Trello card move, and a Slack thread all mean different things and need different parsing logic).
- **The relevance filter**: not everything that happened is update-worthy. Deciding what's signal vs. noise per client is a modeling problem, not a prompting problem.
- **Tone/voice personalization**: learning each freelancer's and client relationship's specific style from a small number of examples, and keeping it consistent over time.
- **The feedback loop**: every edit a user makes to a draft is data you can use to improve future drafts for that specific user/client pair — this compounds and is very hard for a competitor to replicate without your accumulated data.

---

## 3. How It Works — System Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Integrations    │────▶│  Ingestion &      │────▶│   Activity Store    │
│  (Trello, Asana, │     │  Normalization     │     │   (Postgres)        │
│  GitHub, Slack)  │     │  Layer             │     │                     │
└─────────────────┘     └──────────────────┘     └─────────┬──────────┘
                                                              │
                                                              ▼
                                                   ┌────────────────────┐
                                                   │  Relevance Filter   │
                                                   │  & Summarization    │
                                                   │  Pipeline           │
                                                   └─────────┬──────────┘
                                                              │
                                                              ▼
                                                   ┌────────────────────┐
                                                   │  Draft Generation   │
                                                   │  (LLM + tone/voice  │
                                                   │  personalization)   │
                                                   └─────────┬──────────┘
                                                              │
                                                              ▼
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│   User Review    │◀────│  Draft delivered  │◀────│   Draft Store &     │
│   & Edit UI       │     │  to dashboard/    │     │   Version History   │
│                   │     │  email             │     │                     │
└────────┬─────────┘     └──────────────────┘     └────────────────────┘
         │
         ▼
┌─────────────────┐
│  Edits captured  │──▶ feeds back into tone model + relevance filter
│  as training      │
│  signal            │
└─────────────────┘
```

### Layer-by-layer breakdown

**a) Integrations layer**
OAuth connections to Trello, Asana, GitHub, and Slack. Each integration has its own adapter that polls (or uses webhooks where available) for activity scoped to a specific project/board/channel the user maps to a client.

**b) Ingestion & normalization**
Raw events from each tool look completely different (a GitHub commit vs. a Trello card move vs. a Slack message). This layer converts them all into a common schema:

```json
{
  "source": "github",
  "client_id": "client_123",
  "type": "commit",
  "summary": "Fixed checkout page layout bug",
  "actor": "jordan",
  "timestamp": "2026-07-15T10:32:00Z",
  "raw_ref": "sha:9f2c1a"
}
```

**c) Relevance filter**
Not every event matters to a client. A typo-fix commit probably doesn't; a shipped feature does. This is a lightweight classifier (starts as heuristic rules, evolves into a trained model) that scores each event's "client-worthiness" before it reaches the generation step.

**d) Draft generation**
The filtered, structured activity gets passed to an LLM with a tone profile attached (built from past approved updates for that client). Output is a structured draft: Done / In Progress / Blocked / Next.

**e) Review & edit UI**
A clean editor where the freelancer sees the draft, makes changes, and either sends directly or exports.

**f) Feedback loop**
Diffs between the draft and the final sent version are stored and used to refine the tone model and relevance filter for that specific freelancer/client pair over time.

---

## 4. Tech Stack

### Frontend
- **Next.js (React) + TypeScript** — dashboard, client management, draft editor
- **Tailwind CSS** — fast, consistent styling
- **shadcn/ui** — component primitives for forms, tables, modals
- **React Query** — data fetching/caching against your API

### Backend
- **Node.js (NestJS or Express) or Python (FastAPI)** — either works; FastAPI is a natural fit if your relevance/tone models end up in Python (most ML tooling is Python-first)
- **PostgreSQL** — core relational data: users, clients, integrations, activity events, drafts, edit history
- **Redis** — job queues, caching, rate-limit handling for integration polling
- **BullMQ (Node) or Celery (Python)** — background job processing for scheduled activity pulls and draft generation

### Integrations
- **Trello API**, **Asana API**, **GitHub REST/GraphQL API**, **Slack API** — OAuth2 for each, webhook subscriptions where supported (GitHub, Slack), polling fallback for the rest (Trello, Asana)

### AI Layer
- **LLM API (Claude or similar)** for the actual draft generation step — this is the one place an LLM API call is appropriate, because generation is genuinely a text task
- **Lightweight relevance classifier**: starts as rule-based scoring (event type, keywords, actor role), evolves into a small trained model (logistic regression or gradient-boosted trees on engineered features) once you have enough labeled data from user edits
- **Tone/voice profile**: built from embeddings of past approved updates, injected into the generation prompt as few-shot examples + style descriptors — this is prompt engineering done well, not fine-tuning, and is enough for v1

### Infra
- **Vercel** (frontend) + **Railway or Render** (backend/DB) for fast MVP deployment, migrate to **AWS/GCP** as you scale
- **Stripe** — subscription billing
- **Resend or Postmark** — transactional email for sending updates and notifications
- **PostHog or Mixpanel** — product analytics (crucial for a usage-based SaaS like this)

---

## 5. Data Model (simplified)

```
users
 ├── id, email, name, tone_preferences

integrations
 ├── id, user_id, provider (trello/asana/github/slack), oauth_token, scope_config

clients
 ├── id, user_id, name, tone_profile_id, delivery_preference (email/manual)

client_project_links
 ├── id, client_id, integration_id, external_project_ref

activity_events
 ├── id, client_id, source, type, summary, actor, timestamp, relevance_score

drafts
 ├── id, client_id, week_of, content, status (draft/edited/sent)

draft_edits
 ├── id, draft_id, diff, edited_at   -- feeds the feedback loop
```

---

## 6. MVP Scope (build this first, nothing more)

To validate the idea fast, resist the urge to build all four integrations and the full tone-learning system on day one.

**Phase 1 (2–3 weeks):**
- One integration only — **GitHub** (easiest API, most freelancer devs already use it) or **Trello** (broadest freelancer audience, not just devs)
- Manual client setup (no auto-mapping yet)
- Simple rule-based relevance filter (keyword/event-type based, not ML yet)
- LLM-generated draft with a single default tone, no personalization yet
- Basic review/edit UI, manual copy-paste send (skip email sending infra initially)
- No billing yet — just get 10–15 freelancers using it for free and talking to you

**Phase 2 (once Phase 1 validates):**
- Add Slack + Asana integrations
- Add tone personalization from past examples
- Add in-app sending (email) + Stripe billing
- Start collecting edit-diff data to improve relevance filtering

**Phase 3 (growth):**
- Multi-client dashboards, team/agency accounts (multiple seats)
- Trained relevance model replacing rules
- Auto client-project mapping via smart suggestions
- Slack bot / browser extension for even lower-friction usage

---

## 7. Monetization

- **Per-seat SaaS pricing**, tiered by number of active clients tracked:
  - **Starter** — $15/mo, up to 3 clients
  - **Growth** — $30/mo, up to 10 clients
  - **Agency** — custom pricing, multi-seat, unlimited clients
- Natural expansion revenue as freelancers grow their client base — the pricing scales with the exact metric that drives their pain (more clients = more update-writing time saved).

---

## 8. Why This Can Work

- **Clear, painful, recurring problem** — not a "nice to have," it's a weekly time sink people already complain about.
- **Data you already have access to** — no need to convince users to change their workflow; you plug into tools they already use.
- **Compounding moat** — every sent update and every edit makes the product better for that specific user, which is hard for a fast-follower to copy without your usage data.
- **Fast path to validation** — you can build a rough v1 in 2–3 weeks and get real freelancers using it before writing a single line of billing code.

---

## 9. Immediate Next Steps

1. Talk to 10 freelancers/agency owners this week — validate the pain is real and find out which tool (GitHub, Trello, Asana, Slack) matters most to start with.
2. Build Phase 1 MVP scoped to one integration.
3. Get 10–15 people using it for free, watch what they edit and why — that's your product roadmap.
4. Layer in tone personalization and billing once you see people actually relying on it week over week.
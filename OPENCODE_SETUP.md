# Pulse — OpenCode Desktop Setup Guide

This guide walks you through setting up the **client-update-generator** (Pulse) project in the OpenCode desktop app.

---

## Prerequisites

- OpenCode Desktop installed at: `C:\Users\nishc\AppData\Local\Programs\@opencode-aidesktop\OpenCode.exe`
- Project location: `C:\Users\nishc\Downloads\Project\client-update-generator`
- Node.js 18+ and Python 3.11+ installed

---

## Quick Start (3 Steps)

### 1. Open Project in OpenCode Desktop

**Option A: Drag & Drop**
1. Open OpenCode Desktop
2. Drag the folder `C:\Users\nishc\Downloads\Project\client-update-generator\client` into the OpenCode window

**Option B: File → Open Folder**
1. OpenCode Desktop → File → Open Folder
2. Navigate to: `C:\Users\nishc\Downloads\Project\client-update-generator\client`
3. Click "Select Folder"

**Option C: Command Line**
```cmd
"C:\Users\nishc\AppData\Local\Programs\@opencode-aidesktop\OpenCode.exe" "C:\Users\nishc\Downloads\Project\client-update-generator\client"
```

---

### 2. Configure API Keys (First Run)

OpenCode will prompt for API keys on first launch. You need **at least one**:

| Provider | Where to Get Key | Required For |
|----------|------------------|--------------|
| **OpenRouter** (recommended) | https://openrouter.ai/keys | All models (Claude, GPT, Gemini, etc.) |
| **Anthropic** | https://console.anthropic.com/settings/keys | Claude models directly |
| **OpenAI** | https://platform.openai.com/api-keys | GPT models directly |

**Recommended: OpenRouter** — gives access to 100+ models with one key.

1. In OpenCode Desktop: Settings (gear icon) → API Keys
2. Click "Add Key" → Select "OpenRouter"
3. Paste your key → Save
4. Set default model: `anthropic/claude-sonnet-4` (or your preference)

---

### 3. Verify Setup

In the OpenCode chat input, type:
```
Read the project structure and summarize what this Pulse project does.
```

You should see OpenCode explore the codebase and give you a summary.

---

## Project Structure

```
client-update-generator/
├── client/                    # Next.js 16 Frontend (OpenCode works here)
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/     # Main dashboard (recently redesigned)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── components/
│   │   │   ├── dashboard/     # DashboardLayout, DraftTrendChart
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── api.ts         # Typed API client
│   │   │   └── auth.tsx       # Auth context
│   │   └── hooks/
│   ├── package.json
│   ├── tokens.css             # Design system (terracotta/amber, Cormorant/DM Sans)
│   └── opencode.json          # OpenCode config
├── server/                    # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/            # Auth, Clients, Drafts, Integrations
│   │   ├── services/          # GitHub, Ingestion, LLM, Relevance
│   │   ├── models/            # SQLAlchemy models
│   │   └── core/              # Config, DB, Security
│   ├── requirements.txt
│   └── docker-compose.yml     # Postgres + Redis
└── DATABASE_SETUP.md          # Supabase/MongoDB setup guide
```

---

## Useful OpenCode Prompts for This Project

### Dashboard & UI
```
Add unit tests for the DraftTrendChart component using Vitest + React Testing Library
```

```
Create a clients list page at /dashboard/clients with search, filter, and pagination
```

```
Add a dark/light mode toggle to the dashboard header using the existing tokens.css variables
```

### Backend Integration
```
Generate TypeScript types from the FastAPI OpenAPI schema at http://localhost:8000/openapi.json
```

```
Add React Query (TanStack Query) for data fetching and caching on the dashboard
```

### Features
```
Implement real-time draft updates using Supabase Realtime subscriptions
```

```
Add a "Generate Draft" wizard with step-by-step form at /dashboard/drafts/new
```

```
Create a settings page for managing GitHub/Linear/Slack integrations
```

### Code Quality
```
Run the linter and fix all TypeScript errors in the client folder
```

```
Add ESLint + Prettier configuration matching the project's style
```

---

## Running the Project

### Terminal 1: Backend
```cmd
cd C:\Users\nishc\Downloads\Project\client-update-generator\server
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### Terminal 2: Frontend
```cmd
cd C:\Users\nishc\Downloads\Project\client-update-generator\client
npm run dev
```
App: http://localhost:3000

### Terminal 3: Database (Optional - Docker)
```cmd
cd C:\Users\nishc\Downloads\Project\client-update-generator\server
docker-compose up -d
```
Postgres: localhost:5432 | Adminer: http://localhost:8080

---

## OpenCode Desktop Tips

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+P` | Command palette |
| `Ctrl+X` + `L` | Switch session |
| `Ctrl+X` + `M` | Switch model |
| `Ctrl+X` + `N` | New session |
| `Tab` | Switch Build/Plan agent |
| `Enter` (x2) | Submit prompt |

### Model Selection
Click the model name in the status bar to switch:
- `anthropic/claude-sonnet-4` — Best for coding (recommended)
- `openai/gpt-4o` — Good alternative
- `google/gemini-2.5-pro` — Large context

### Sessions
- Each chat = one session
- Sessions persist across restarts
- View history: `Ctrl+X` → `L`

### File Operations
- OpenCode shows diffs before applying
- Accept/Reject individual changes
- "Apply All" for multi-file edits

---

## Troubleshooting

### "OpenCode.exe not found"
```cmd
# Check if installed
dir "C:\Users\nishc\AppData\Local\Programs\@opencode-aidesktop\OpenCode.exe"

# Reinstall if missing
npm install -g @opencode-ai/desktop@latest
```

### API Key Errors
- Verify key is valid at provider dashboard
- Check no extra whitespace in key
- Try regenerating key

### Model Not Available
- Some models require specific provider access
- Use OpenRouter for broadest model access
- Check model name spelling: `anthropic/claude-sonnet-4`

### Project Not Loading
- Ensure you opened the `client/` subfolder (not the root)
- Check `package.json` exists in opened folder
- Restart OpenCode Desktop

---

## Next Steps After Setup

1. **Explore the dashboard** — Ask OpenCode to walk you through `src/app/dashboard/page.tsx`
2. **Run the dev servers** — Test the live app at localhost:3000
3. **Pick a feature** — Use the prompts above or describe what you want to build
4. **Commit changes** — OpenCode can stage/commit via git commands

---

## Resources

- **OpenCode Docs**: https://opencode.ai/docs
- **OpenCode Discord**: https://discord.gg/opencode
- **Pulse README**: `../README.md`
- **Database Setup**: `../DATABASE_SETUP.md`
- **Design System**: `./tokens.css` + `../gstack/DESIGN.md`

---

*Generated for Pulse project — OpenCode Desktop v1.18.3+*
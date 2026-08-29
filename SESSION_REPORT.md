# Pulse — Client Update Generator | Session Report

**Project:** `client-update-generator`  
**Date:** July 18, 2026  
**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui

---

## Project Structure
```
client-update-generator/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout with fonts
│   │   │   ├── page.tsx       # Landing page
│   │   │   └── globals.css    # Imports tokens.css
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components (Button, Card, etc.)
│   │   │   ├── navigation.tsx # Fixed nav with modal triggers
│   │   │   ├── hero.tsx       # Hero section + dashboard mockup
│   │   │   ├── logos.tsx      # Integration logos strip
│   │   │   ├── features.tsx   # 6 feature cards with terracotta accents
│   │   │   ├── how-it-works.tsx # 4-step timeline
│   │   │   ├── pricing.tsx    # 3-tier pricing ($7/$15/Custom)
│   │   │   ├── cta.tsx        # Dark CTA section
│   │   │   ├── footer.tsx     # 5-column footer
│   │   │   └── sign-in-modal.tsx # 3-mode modal (signin/signup/demo)
│   │   └── lib/utils.ts
│   ├── tokens.css             # Hallmark design system (OKLCH tokens)
│   ├── next.config.ts         # Image domains config
│   └── package.json
├── server/                    # Empty (for future backend)
└── idea.md                    # Product specification
```

---

## Design System (Hallmark)

**Macrostructure:** Marquee Hero  
**Theme:** Studio (custom terracotta + indigo)  
**Typography:** Cormorant Garamond (display) + DM Sans (body)  
**Colors:** OKLCH tokens in `tokens.css`

### Key Color Tokens
| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--color-terracotta` | `oklch(0.52 0.18 32)` ≈ `#C1613D` | `oklch(0.62 0.18 32)` | **Primary brand** |
| `--color-terracotta-strong` | `oklch(0.45 0.2 32)` | `oklch(0.68 0.2 32)` | Hover states |
| `--color-terracotta-soft` | `oklch(0.92 0.06 32)` | `oklch(0.26 0.08 32)` | Badge backgrounds |
| `--color-accent` (indigo) | `oklch(0.38 0.18 255)` | `oklch(0.68 0.18 255)` | Secondary actions |
| `--color-ink` | `oklch(0.12 0.01 45)` | `oklch(0.98 0.005 85)` | Body text |
| `--color-ink-emphasis` | `oklch(0.45 0.22 255)` | `oklch(0.7 0.22 255)` | Hero emphasis |
| `--color-paper` | `oklch(0.96 0.008 85)` | `oklch(0.13 0.01 45)` | Background |

**Primary mapped to terracotta** (`--primary: var(--color-terracotta)`) so shadcn Button `variant="default"` uses terracotta.

---

## Landing Page Sections

1. **Navigation** — Fixed, backdrop blur, "Book Demo" opens demo modal
2. **Hero** — Headline, subhead, dual CTAs, trust badges, **dashboard mockup below copy**
3. **Logos** — 10 integration logos (GitHub, Linear, Slack, Trello, Notion, Figma, Vercel, Retool, Loom, Asana) via simpleicons.org CDN
4. **Features** — 6 cards with terracotta icons, checkmarks, hover borders
5. **How It Works** — 4-step alternating layout with terracotta step numbers + timeline
6. **Pricing** — 3 tiers: **Starter $7**, **Growth $15**, **Agency Custom** (terracotta checkmarks, popular badge)
7. **CTA** — Dark indigo section, "Ready to stop writing... and start sending?" (terracotta emphasis)
8. **Footer** — 5-column + social links

---

## Sign-In Modal (`sign-in-modal.tsx`)

**3 Modes:** `signin` | `signup` | `demo`  
**Triggered by:** Nav "Book Demo" (demo), Hero "Book a Demo" (demo)  
**Features:**
- Mode switching via footer links
- Form fields adapt per mode:
  - Demo: name, company, client count dropdown, optional message
  - Signup: name, email, company, password
  - Signin: email only
- Terracotta focus rings, terracotta links, terracotta "Book Demo" button
- Accessible: ARIA labels, focus trap, backdrop click close, ESC close

---

## Pricing (Updated)

| Plan | Price | Clients | Key Features |
|------|-------|---------|--------------|
| Starter | **$7/mo** | 3 | GitHub+Slack, weekly drafts, 1 tone example, 14-day history |
| Growth | **$15/mo** | 10 | All 4 integrations, daily/weekly, 3 tone examples, Slack/Notion push, 3 seats |
| Agency | **Custom** | Unlimited | Custom webhooks, ML relevance, SSO, dedicated manager, unlimited seats |

**Agency tier shows "Custom" not a dollar amount.** Popular badge on Growth (terracotta).

---

## Removed / Cleaned Up
- ❌ "SOC 2 Type II" mentions
- ❌ Integration logo strip below CTA
- ❌ "Sign In" from navigation (only "Book Demo" button)
- ❌ Testimonials section
- ❌ Light gray placeholder colors in forms → all terracotta focus rings

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `client/tokens.css` | Complete design system (colors, spacing, type, motion) |
| `client/src/app/layout.tsx` | Font loading (Cormorant + DM Sans) |
| `client/src/app/page.tsx` | Page composition |
| `client/src/components/hero.tsx` | Hero + dashboard mockup |
| `client/src/components/pricing.tsx` | Pricing cards |
| `client/src/components/sign-in-modal.tsx` | 3-mode auth modal |
| `client/src/components/ui/button.tsx` | Uses `--primary` (terracotta) |
| `client/next.config.ts` | Allows simpleicons.org images |

---

## Commands
```bash
cd client-update-generator/client
npm run dev      # http://localhost:3000
npm run build    # Production build
```

---

## Next Steps (Suggested)
1. Backend API in `server/` (FastAPI/Express + PostgreSQL + Redis)
2. OAuth integrations (GitHub, Linear, Slack, Trello)
3. Dashboard app (client management, draft editor, settings)
4. AI draft generation pipeline (ingestion → relevance → tone → generation)
5. Email/Slack/Notion delivery
6. Stripe billing + webhook handling

---

**To resume:** Open new session, reference this file, and continue from "Next Steps" or any section above.
# ProfilePulse — Claude Code Project Memory

---

## 1. Project Name and Purpose

**ProfilePulse** is a personal LinkedIn intelligence assistant. It helps the user keep their LinkedIn profile active and relevant by surfacing AI-generated post ideas, trending topics, repost suggestions, analytics, and alerts.

> **CRITICAL PRODUCT RULE — never break this:**
> ProfilePulse NEVER posts or acts on LinkedIn on the user's behalf.
> It only reads data and suggests actions. The user executes everything manually.

The app is read-only with respect to LinkedIn. It imports data (via CSV export or future browser extension), analyses it locally, and presents suggestions through a dashboard UI.

---

## 2. Who Is Building This / Local Environment

- **Solo developer** — personal project, single-user app
- **Running on Windows** — always use Windows-compatible commands
- **Preferred terminal:** Git Bash (not cmd.exe)
- **PowerShell** acceptable as secondary shell
- **Project root:** `D:\ProfilePulse`
- **GitHub repo:** https://github.com/smannahra/profilepulse
- **PostgreSQL** running locally on port **5433** (non-default — always use 5433, not 5432)
- No CI/CD configured yet

---

## 3. Tech Stack with Versions

Sourced from `package.json` (actual installed versions):

| Package | Version |
|---|---|
| next | 14.2.35 |
| react | ^18 |
| react-dom | ^18 |
| typescript | ^5 |
| tailwindcss | ^3.4.1 |
| shadcn (CLI) | ^4.0.7 |
| prisma | ^7.5.0 |
| @prisma/client | ^7.5.0 |
| @prisma/adapter-pg | ^7.5.0 |
| pg | ^8.20.0 |
| @types/pg | ^8.18.0 |
| recharts | ^3.8.0 |
| papaparse | ^5.5.3 |
| @types/papaparse | ^5.5.2 |
| date-fns | ^4.1.0 |
| lucide-react | ^0.577.0 |
| dotenv | ^17.3.1 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.5.0 |
| tsx | ^4.21.0 |
| ts-node | ^10.9.2 |

**Important Prisma 7 note:** Prisma 7 requires a driver adapter. This project uses
`@prisma/adapter-pg` with `PrismaPg`. The Prisma client is NOT instantiated with
just `new PrismaClient()` — it always requires `{ adapter }` with a PrismaPg instance.
See `lib/prisma.ts` for the correct pattern.

**Tailwind CSS v3 note:** `globals.css` uses standard Tailwind v3 syntax
(`@tailwind base/components/utilities` + HSL CSS variables). Do NOT use
Tailwind v4 syntax (`@import "shadcn/tailwind.css"`, `oklch` colours) — it breaks the build.

---

## 4. Folder Structure

```
D:\ProfilePulse\
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — sets <html> and page title
│   ├── page.tsx                      # Root route — redirects to /dashboard
│   ├── globals.css                   # Tailwind v3 base styles + shadcn HSL vars
│   └── dashboard/
│       ├── layout.tsx                # Dashboard shell: sidebar + topbar wrapper
│       ├── page.tsx                  # /dashboard — greeting, stat cards, quick actions
│       ├── profile/
│       │   └── page.tsx              # /dashboard/profile — profile setup form
│       ├── trends/
│       │   └── page.tsx              # /dashboard/trends — trending topics table
│       ├── post-ideas/
│       │   └── page.tsx              # /dashboard/post-ideas — original ideas + reposts
│       └── analytics/
│           └── page.tsx              # /dashboard/analytics — recharts placeholder charts
│
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx               # Fixed left sidebar, nav items, red dot badge on Trends
│   │   └── topbar.tsx                # Top header bar with app name + Sync Now button
│   └── ui/                           # shadcn/ui components (do not manually edit)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       └── textarea.tsx
│
├── lib/
│   ├── prisma.ts                     # Prisma singleton using PrismaPg adapter
│   ├── utils.ts                      # shadcn cn() helper (clsx + tailwind-merge)
│   └── generated/
│       └── prisma/                   # Prisma 7 generated client (gitignored)
│           └── client.ts             # Correct import: from "./generated/prisma/client"
│
├── prisma/
│   ├── schema.prisma                 # All models + enums
│   └── seed.ts                       # Seeds default user (id=1) + placeholder data
│
├── .env                              # DATABASE_URL — gitignored, never commit
├── .gitignore
├── CLAUDE.md                         # This file — read by Claude Code at session start
├── components.json                   # shadcn config (style: base-nova)
├── next.config.mjs                   # Minimal Next.js config (empty overrides)
├── package.json
├── prisma.config.ts                  # Prisma 7 config — reads DATABASE_URL via dotenv
├── tailwind.config.ts                # Full shadcn colour token mapping for Tailwind v3
├── tsconfig.json
└── tsconfig.seed.json                # tsconfig override for seed script
```

---

## 5. Database Schema Summary

Schema file: `prisma/schema.prisma`
Generated client output: `lib/generated/prisma`

### Models

**User**
- `id` Int (PK, autoincrement)
- `name`, `email` (unique), `role`, `industry`, `tone`, `postingGoal` — all String with defaults
- `topics` — String, comma-separated list of expertise topics (e.g. "Machine Learning,Python")
- `createdAt`, `updatedAt` — DateTime
- Relations: has many Posts, Suggestions, ActivityLogs
- **Single-user assumption: default user always has id = 1**

**Post**
- `id`, `userId` (FK to User), `linkedinPostId` (unique, optional)
- `content`, `postedAt`, `likeCount`, `commentCount`, `synced`
- `source` — enum PostSource (IMPORT | EXTENSION)
- `createdAt`
- Relations: belongs to User, has many Comments

**Comment**
- `id`, `postId` (FK to Post)
- `authorName`, `content`, `createdAt`
- `needsReply` Boolean (default true), `replySuggestion` String (optional), `replied` Boolean (default false)
- Relations: belongs to Post

**Suggestion**
- `id`, `userId` (FK to User)
- `type` — enum SuggestionType (IDEA | REPOST | TOPIC)
- `title`, `body`, `source` (optional)
- `dismissed` Boolean (default false), `createdAt`
- Relations: belongs to User

**ActivityLog**
- `id`, `userId` (FK to User)
- `action` String, `metadata` String (optional), `date` DateTime
- Relations: belongs to User

### Enums
- `PostSource`: IMPORT | EXTENSION
- `SuggestionType`: IDEA | REPOST | TOPIC

---

## 6. How to Run the App Locally

### First-time setup (Windows / Git Bash)
```bash
# 1. Install dependencies
npm install

# 2. Set your database password in .env
# Edit .env — ensure port is 5433:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/profilepulse?schema=public"

# 3. Create the database (in psql or pgAdmin):
# CREATE DATABASE profilepulse;

# 4. Push schema to the database
npm run db:push

# 5. Seed with default user and placeholder data
npm run db:seed

# 6. Start the dev server
npm run dev
```

App runs at: http://localhost:3000 — auto-redirects to /dashboard

### After cloning fresh from GitHub
```bash
npm install
npm run db:generate   # regenerate Prisma client after clone
npm run db:push       # only if schema changed
npm run dev
```

---

## 7. Environment Variables

File: `.env` (gitignored — never commit)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma database connection string |

Example value:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/profilepulse?schema=public"
```

**Note:** Port is **5433** (non-default). Using 5432 will fail on this machine.

**Planned but NOT yet in codebase:**
- `ANTHROPIC_API_KEY` — needed for Claude API integration (Session 2+). Not yet referenced anywhere in the project.

### Supabase migration (future)
Only change `DATABASE_URL` in `.env` to the Supabase connection string. Nothing else changes.

---

## 8. NPM Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Next.js dev server at localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Sync schema to database (no migration files created) |
| `npm run db:seed` | Run `prisma/seed.ts` via tsx — seeds user id=1 + placeholder data |
| `npm run db:studio` | Open Prisma Studio GUI at localhost:5555 |

---

## 9. What Was Built in Session 1

- Next.js 14 app scaffolded with TypeScript, Tailwind CSS v3, App Router
- All dependencies installed (see Section 3)
- Prisma 7 schema with 5 models and 2 enums
- Prisma client configured with `@prisma/adapter-pg` (required for Prisma 7)
- `prisma db push` run — all tables exist in local PostgreSQL on port 5433
- Seed script at `prisma/seed.ts` (creates user id=1, 3 placeholder suggestions, 1 activity log)
- Dashboard layout with fixed 220px sidebar and sticky topbar
- Sidebar with 5 nav items, active state highlighting, red dot badge on Trends
- 5 pages with placeholder/mock data:
  - `/dashboard` — time-aware greeting (date-fns), 3 stat cards, 3 quick action buttons
  - `/dashboard/profile` — form with 5 fields (client component, no DB wiring yet)
  - `/dashboard/trends` — 8-row mock trending topics table with relevance badges
  - `/dashboard/post-ideas` — 3 original idea cards + 2 repost suggestion cards
  - `/dashboard/analytics` — 4 recharts charts (bar, horizontal bar, line, radar) with mock data
- shadcn/ui components installed: button, card, badge, input, label, textarea, separator
- Root route redirects to `/dashboard`
- CSS fixed: replaced shadcn v4/Tailwind v4 globals.css with correct Tailwind v3 HSL format
- GitHub repo created and pushed: https://github.com/smannahra/profilepulse

---

## 10. What Needs to Be Built in Session 2 Onwards

### Scaffolded but not connected to real data
- Profile form — UI exists, save does nothing (needs `POST /api/profile`)
- Dashboard stat cards — show hardcoded numbers
- Trends page — shows mock data, no live discovery
- Post Ideas — hardcoded cards, no AI generation
- Analytics charts — static mock data arrays, no real post metrics
- All quick action buttons — no functionality

### Session 2 priorities
1. Wire profile form to DB — `GET /api/profile` and `POST /api/profile`
2. LinkedIn CSV import — file upload + papaparse parsing to populate `Post` table
3. Connect analytics to real data from `Post` table
4. Add `ANTHROPIC_API_KEY` and Claude API for post idea generation
5. Build `POST /api/generate-ideas` endpoint
6. Connect DB Suggestions to Post Ideas page

### Planned but not started
- `app/api/` directory — no API routes exist yet
- Claude / Anthropic API — no integration, no key usage
- LinkedIn CSV import — papaparse installed but unused
- Real trend discovery
- Comment reply suggestion generation
- ActivityLog writes from user actions
- Dismissing suggestions in UI
- Browser extension data ingestion
- Supabase deployment

---

## 11. Project Rules and Coding Conventions

1. **Never build LinkedIn auto-posting or autonomous actions.** Read-only and suggestion-only.
2. **Single-user app** — always assume user id = 1. No auth system planned.
3. **Supabase migration must stay simple** — only `DATABASE_URL` should ever need to change.
4. **TypeScript everywhere** — no plain `.js` files in `app/`, `components/`, or `lib/`.
5. **Use shadcn/ui** for all new UI components. Do not add other component libraries.
6. **Tailwind CSS for all styling.** No CSS modules or styled-components.
7. **Next.js App Router conventions** — layouts in `layout.tsx`, pages in `page.tsx`. Use `"use client"` only when required (event handlers, hooks, browser APIs).
8. **Windows-compatible commands** in all docs and scripts. Git Bash is preferred.
9. **Do not rename or restructure existing files** without a clear reason.
10. **Do not document features as completed if they are only planned.**
11. **Prisma 7 adapter pattern** — always use `new PrismaClient({ adapter })` with PrismaPg. Never use bare `new PrismaClient()`.
12. **Tailwind v3 CSS only** — never use Tailwind v4 syntax or `oklch` colour values in CSS.
13. **Prisma client import path:**
    - From `lib/` files: `from "./generated/prisma/client"`
    - From `prisma/` scripts: `from "../lib/generated/prisma/client"`

---

## 12. Known Gaps / Current Status

### Real and working now
- Full app scaffolds, routes, and layout render correctly
- Database schema synced to PostgreSQL (port 5433)
- All 5 pages render without errors
- shadcn components styled correctly with Tailwind v3 HSL tokens
- TypeScript compiles clean (`tsc --noEmit` passes)
- Prisma client generates successfully

### Placeholder / mock data right now
- Dashboard stat cards: hardcoded strings
- Trends table: 8 hardcoded rows
- Post Ideas: 5 hardcoded cards
- Analytics charts: static mock data arrays
- Profile form: client-side state only, no DB persistence
- All quick action buttons: no-ops

### Not yet implemented
- `app/api/` — no API routes exist yet
- Claude / Anthropic API integration
- LinkedIn CSV import logic (papaparse installed but unused)
- Real trend discovery
- Comment reply suggestion generation
- ActivityLog recording from user actions
- Supabase deployment

### To be decided
- Source of trend data (news API vs scraping vs manual input)
- Whether browser extension is in near-term scope
- Auth approach if the app ever becomes multi-user

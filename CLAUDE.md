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
| @anthropic-ai/sdk | ^0.78.0 |
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

**Anthropic SDK note:** `new Anthropic()` auto-reads `ANTHROPIC_API_KEY` from the environment.
Model used throughout: `claude-sonnet-4-6`. All AI calls are server-side only (API routes).

**shadcn Button note:** The installed Button component does NOT support the `asChild` prop.
Use `<Link>` with Tailwind classes directly for link-styled buttons instead.

---

## 4. Folder Structure

```
D:\ProfilePulse\
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — sets <html> and page title
│   ├── page.tsx                      # Root route — redirects to /dashboard
│   ├── globals.css                   # Tailwind v3 base styles + shadcn HSL vars
│   ├── api/                          # All API routes (created Session 2)
│   │   ├── profile/
│   │   │   └── route.ts              # GET + POST /api/profile — load/save user record
│   │   ├── import/
│   │   │   └── route.ts              # POST /api/import — LinkedIn CSV import via papaparse
│   │   ├── trends/
│   │   │   └── route.ts              # GET /api/trends — cached or ?refresh=true → Anthropic
│   │   └── post-ideas/
│   │       └── route.ts              # GET /api/post-ideas — cached or ?refresh=true → Anthropic
│   └── dashboard/
│       ├── layout.tsx                # Dashboard shell: sidebar + topbar wrapper
│       ├── page.tsx                  # /dashboard — real DB stats, quick-action link buttons
│       ├── profile/
│       │   └── page.tsx              # /dashboard/profile — form wired to /api/profile
│       ├── trends/
│       │   └── page.tsx              # /dashboard/trends — live data, Refresh Trends button
│       ├── post-ideas/
│       │   └── page.tsx              # /dashboard/post-ideas — live data, Generate Ideas button
│       ├── import/
│       │   └── page.tsx              # /dashboard/import — drag-and-drop CSV upload UI
│       └── analytics/
│           └── page.tsx              # /dashboard/analytics — recharts charts (still mock data)
│
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx               # Fixed left sidebar — 6 nav items (Import Data added S2)
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
│   ├── profile-context.ts            # buildProfileContext(userId) — formats user for AI prompts
│   ├── utils.ts                      # shadcn cn() helper (clsx + tailwind-merge)
│   └── generated/
│       └── prisma/                   # Prisma 7 generated client (gitignored)
│           └── client.ts             # Correct import: from "./generated/prisma/client"
│
├── prisma/
│   ├── schema.prisma                 # All models + enums
│   └── seed.ts                       # Seeds default user (id=1) + placeholder data
│
├── .env                              # DATABASE_URL + ANTHROPIC_API_KEY — gitignored, never commit
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
- **How body is used in Session 2:**
  - TOPIC: `body` = plain text (the "why it's trending" sentence); `source` = `"AI-relevance:N"`
  - IDEA: `body` = JSON string `{ hook, keyPoints[], cta }`; `source` = `"AI-generated"`
  - REPOST: `body` = JSON string `{ originalPost, commentSuggestion }`; `source` = `"AI-generated"`

**ActivityLog**
- `id`, `userId` (FK to User)
- `action` String, `metadata` String (optional), `date` DateTime
- Relations: belongs to User
- **Written by import route:** action = `"CSV_IMPORT"`, metadata = JSON `{ imported, skipped, filename }`

### Enums
- `PostSource`: IMPORT | EXTENSION
- `SuggestionType`: IDEA | REPOST | TOPIC

---

## 6. How to Run the App Locally

### First-time setup (Windows / Git Bash)
```bash
# 1. Install dependencies
npm install

# 2. Set environment variables in .env
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/profilepulse?schema=public"
# ANTHROPIC_API_KEY="sk-ant-..."

# 3. Create the database (in psql or pgAdmin):
# CREATE DATABASE profilepulse;

# 4. Push schema to the database
npm run db:push

# 5. Seed with default user
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
| `ANTHROPIC_API_KEY` | Yes | Powers trends + post ideas generation |

Example:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5433/profilepulse?schema=public"
ANTHROPIC_API_KEY="sk-ant-..."
```

**Note:** Port is **5433** (non-default). Using 5432 will fail on this machine.

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
- Sidebar with 5 nav items, active state highlighting
- 5 pages with placeholder/mock data:
  - `/dashboard` — time-aware greeting (date-fns), 3 stat cards, 3 quick action buttons
  - `/dashboard/profile` — form with 5 fields (client component, no DB wiring)
  - `/dashboard/trends` — 8-row mock trending topics table with relevance badges
  - `/dashboard/post-ideas` — 3 original idea cards + 2 repost suggestion cards
  - `/dashboard/analytics` — 4 recharts charts (bar, horizontal bar, line, radar) with mock data
- shadcn/ui components installed: button, card, badge, input, label, textarea, separator
- Root route redirects to `/dashboard`
- CSS fixed: replaced shadcn v4/Tailwind v4 globals.css with correct Tailwind v3 HSL format
- GitHub repo created and pushed: https://github.com/smannahra/profilepulse

---

## 10. What Was Built in Session 2

Session 2 replaced all mock/placeholder data with real functionality. All items below are complete and working.

### New files created

**`lib/profile-context.ts`**
- Exports `buildProfileContext(userId: number): Promise<string>`
- Reads user from DB, returns formatted multi-line string for use in Anthropic prompts
- Used by both `/api/trends` and `/api/post-ideas`

**`app/api/profile/route.ts`**
- `GET` — returns User record for id=1
- `POST` — upserts User record (name, role, industry, tone, topics, postingGoal)

**`app/api/import/route.ts`**
- `POST` — accepts `multipart/form-data` with a `file` field (CSV only)
- Uses papaparse to parse, auto-detects LinkedIn CSV column names via a normalised alias map
- Mapped columns: content, postedAt, likeCount, commentCount, linkedinPostId
- Deduplicates by `linkedinPostId` if present
- Writes `Post` records with `source: IMPORT`
- Writes an `ActivityLog` entry on completion
- Returns `{ imported, skipped, total }`

**`app/api/trends/route.ts`**
- `GET` (no params) — returns cached TOPIC `Suggestion` records from DB as `TrendItem[]`
- `GET ?refresh=true` — calls Anthropic (`claude-sonnet-4-6`), deletes old TOPIC suggestions, saves new ones
- Each trend: `{ title, why, relevance }` — relevance stored in `source` field as `"AI-relevance:N"`

**`app/api/post-ideas/route.ts`**
- `GET` (no params) — returns cached IDEA + REPOST `Suggestion` records from DB
- `GET ?refresh=true` — calls Anthropic (`claude-sonnet-4-6`), deletes old IDEA/REPOST suggestions, saves new ones
- IDEA body stored as JSON: `{ hook, keyPoints[], cta }`
- REPOST body stored as JSON: `{ originalPost, commentSuggestion }`
- Returns `{ originalIdeas[], repostSuggestions[] }`

**`app/dashboard/import/page.tsx`**
- Client component — drag-and-drop zone + file input (CSV only)
- Shows selected filename + size
- Upload button POSTs to `/api/import`
- Shows success result (`imported / skipped`) or error message

### Updated files

**`app/dashboard/profile/page.tsx`**
- Now loads profile on mount via `GET /api/profile`
- Saves via `POST /api/profile`
- Fields correctly mapped to DB schema: `role` (was "headline"), `industry` (was "targetAudience")
- Added `tone` field — select with 5 options: professional, casual, thought-leader, storyteller, educational
- Full loading, saving, and error states

**`app/dashboard/trends/page.tsx`**
- Converted to client component
- Fetches from `/api/trends` on load (shows cached)
- "Refresh Trends" button fetches `/api/trends?refresh=true` → triggers Anthropic call
- Loading spinner, error banner, empty state with generate prompt

**`app/dashboard/post-ideas/page.tsx`**
- Converted to client component
- Fetches from `/api/post-ideas` on load (shows cached)
- "Generate Ideas" button fetches `/api/post-ideas?refresh=true` → triggers Anthropic call
- Copy-to-clipboard on each idea card (full text) and repost comment
- Loading spinner, error banner, empty state with generate prompt

**`app/dashboard/page.tsx`**
- Now an `async` server component — queries DB directly
- Stat cards show real data: TOPIC suggestion count today, IDEA suggestion count today, last IMPORT post date
- Quick action buttons are `<Link>` components navigating to the relevant pages

**`components/dashboard/sidebar.tsx`**
- Added **Import Data** nav item (Upload icon → `/dashboard/import`)
- Removed red dot badge from Trends (no longer needed)
- Now 6 nav items: Dashboard, Profile Setup, Trends, Post Ideas, Import Data, Analytics

---

## 11. Current Status After Session 2

### Real and working
- Profile form — loads from DB, saves to DB
- LinkedIn CSV import — file upload, papaparse parsing, deduplication, persists to Post table
- Trends page — AI-generated via Anthropic, cached in DB, refreshable on demand
- Post Ideas page — AI-generated via Anthropic, cached in DB, regenerable on demand
- Dashboard stat cards — real counts from DB (topics today, ideas today, last import date)
- Dashboard quick actions — navigate to relevant pages
- `buildProfileContext()` — feeds user profile into every AI prompt
- ActivityLog written on CSV import
- TypeScript compiles clean (`tsc --noEmit` passes)

### Still using mock/placeholder data
- `/dashboard/analytics` — 4 recharts charts still use static mock arrays (not connected to Post table)

### Not yet implemented
- Analytics connected to real Post data
- Dismiss suggestion button in UI
- Comment reply suggestion generation
- ActivityLog writes beyond CSV import
- Browser extension data ingestion
- Supabase deployment

---

## 12. Session 3 — Planned: Intelligence Engine Upgrade

Session 3 has not started. Nothing below exists in the codebase yet.

Anticipated work:
- Connect analytics charts to real Post data from the database
- Improve AI prompt quality using imported post history as additional context
- Suggestion dismissal — wire the `dismissed` field to a UI action
- Comment reply suggestions — surface `needsReply` comments and generate `replySuggestion` via AI
- ActivityLog UI — display recent actions somewhere in the dashboard

---

## 13. Project Rules and Coding Conventions

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
14. **Anthropic model:** always use `claude-sonnet-4-6`. Do not use other model strings.
15. **AI calls are server-side only** — never call Anthropic from client components or expose the API key to the browser.
16. **shadcn Button has no `asChild` prop** — use `<Link>` with inline Tailwind classes for link-as-button patterns.

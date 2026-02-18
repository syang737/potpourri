# CLAUDE.md

## Project Overview

Potpourri is a daily top-10 trivia game built with Next.js 16 (App Router). Players guess the top 10 items for a daily topic (e.g., "Most Populated Countries") by searching an autocomplete dropdown. Incorrect guesses cost lives (5 total). Puzzles are organized by "verticals" (categories like countries, movies, languages).

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)
- **Frontend**: React 19, Tailwind CSS v4
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Prisma 7.4.0 with `@prisma/adapter-neon`
- **Auth**: bcryptjs for admin passwords, cookie-based sessions for players
- **Hosting**: Vercel

## Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate + migrate deploy + next build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database (npx tsx prisma/seed.ts)
npx prisma generate  # Regenerate Prisma client (required after schema changes)
npx tsc --noEmit     # Type-check without emitting
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (header, footer, analytics)
│   ├── page.tsx                  # Home page
│   ├── about/page.tsx            # About page
│   ├── puzzle/[id]/page.tsx      # Direct puzzle page
│   ├── vertical/[slug]/page.tsx  # Vertical-specific puzzle page
│   ├── admin/                    # Admin dashboard (puzzles, verticals, answer pool)
│   └── api/                      # API routes (see below)
├── components/                   # React components (all "use client")
│   ├── GamePage.tsx              # Entry point: fetches today's puzzle
│   ├── PuzzleView.tsx            # Core game logic and UI
│   ├── GuessInputDropdown.tsx    # Autocomplete search input
│   ├── AnswerList.tsx            # Displays ranked answers
│   ├── StatsModal.tsx            # End-of-game results modal
│   ├── LivesIndicator.tsx        # Heart icons for remaining lives
│   ├── VerticalBadge.tsx         # Category badge
│   └── PotMascot.tsx             # SVG mascot
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── session.ts                # Player session management (cookies)
│   ├── admin-auth.ts             # Admin auth (token-based)
│   └── aliases.ts                # Query expansion for search (country abbreviations)
└── generated/prisma/             # Auto-generated Prisma client (git-ignored)
```

## API Routes

### Public
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/puzzle/today` | Get today's puzzle + session state |
| GET | `/api/puzzle/[id]` | Get specific puzzle + session state |
| POST | `/api/puzzle/[id]/guess` | Submit a guess |
| POST | `/api/puzzle/[id]/reveal` | Reveal all answers (give up) |
| GET | `/api/puzzle/[id]/stats` | Get puzzle statistics |
| GET | `/api/vertical/[slug]/pool` | Get full answer pool for a vertical (cached) |
| GET | `/api/vertical/[slug]/search` | Search answers by query (legacy, unused by client) |

### Admin (requires auth)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/check` | Check auth status |
| GET/POST | `/api/admin/puzzles` | List/create puzzles |
| GET | `/api/admin/puzzles/[id]` | Get puzzle for editing |
| POST | `/api/admin/puzzles/[id]/publish` | Publish a puzzle |
| GET | `/api/admin/verticals` | List verticals |
| GET/POST | `/api/admin/vertical/[id]/answer-pool` | List/create pool items |
| DELETE | `/api/admin/vertical/[id]/answer-pool/[itemId]` | Delete pool item |
| POST | `/api/admin/vertical/[id]/answer-pool/import` | Bulk import pool items |

## Database Schema

Key models in `prisma/schema.prisma`:

- **Vertical** — Categories (slug, name). Each has an answer pool and puzzles.
- **AnswerPoolItem** — Possible answers within a vertical (label, normalizedLabel for search). Indexed on `(verticalId, normalizedLabel)`.
- **Puzzle** — Daily challenge with a topic, vertical, scheduledFor date, and status (DRAFT → SCHEDULED → PUBLISHED → ARCHIVED).
- **PuzzleAnswer** — Maps 10 ranked answers to a puzzle (rank 1-10).
- **Session** — Player sessions tracked via httpOnly cookies.
- **GuessLog** — Each guess attempt (puzzleId, sessionId, answerPoolItemId, isCorrect).
- **SessionPuzzleSummary** — Aggregated progress per player per puzzle.
- **PuzzleStats** — Aggregate statistics (score/guess histograms as JSON).
- **AdminUser** — Admin accounts (EDITOR or ADMIN role).

## Key Architecture Decisions

### Answer Search (Client-Side Caching)
All answer searching is done client-side. When a puzzle loads, `PuzzleView` fetches the entire answer pool for the vertical via `/api/vertical/[slug]/pool`. The pool endpoint has:
- **Server-side in-memory cache** (1-hour TTL) to avoid repeated DB queries
- **Cache-Control headers** (`max-age=3600, stale-while-revalidate=1800`) for browser/CDN caching

`GuessInputDropdown` filters the pool locally using `expandQuery()` from `lib/aliases.ts`, which handles abbreviations (e.g., "US" → "United States").

### Session Management
- Player sessions use a `session_id` httpOnly cookie (1-year expiry)
- Sessions are created/validated in `lib/session.ts` on guess/reveal API calls
- Admin auth uses separate token-based sessions stored in server memory

### Game Flow
1. `GamePage` fetches today's puzzle from `/api/puzzle/today`
2. `PuzzleView` mounts, loads answer pool, renders game UI
3. Player types in `GuessInputDropdown` → filters pool client-side → selects answer
4. Submit calls `POST /api/puzzle/[id]/guess` → validates server-side → returns updated state
5. Game ends when all 10 found or 5 lives lost → `StatsModal` shows results

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (Neon serverless). Required.
- `NODE_ENV` — Controls cookie security (`production` = secure cookies)

## Path Aliases

- `@/*` maps to `./src/*` (configured in tsconfig.json)

## Conventions

- All React components use `"use client"` directive (client-side rendering)
- Tailwind CSS v4 with custom design tokens (warm-brown, accent, peach, mint, etc.)
- Prisma client is a singleton (`lib/prisma.ts`), cached globally in development
- Database labels are stored with a `normalizedLabel` (lowercase) for case-insensitive search
- UI uses rounded-2xl corners, font-bold/extrabold typography throughout

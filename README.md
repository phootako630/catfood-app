# 喵粮管家 · Cat Diet Tracker

A small PWA for households to track a cat's daily food intake against a
vet-prescribed gram target — with multiple family members logging feedings in
real time so nobody double-feeds.

Built for real family use: precise gram-based quotas, multi-person sync, and
weight trend tracking.

## Features

- **Daily feeding log** — quick-add buttons + custom gram amounts; a ring shows
  how much of the daily quota has been fed and how much remains.
- **Over-limit warning** — visual alert once the day's total exceeds the quota.
- **Multi-person real-time sync** — family members in the same household see each
  other's entries instantly (Supabase Realtime). Each entry shows who fed.
- **Undo** — remove your own mis-entries.
- **Households & invite codes** — create a household or join an existing one with
  a 6-character invite code. Data is isolated per household via row-level security.
- **Diet plans** — set the vet-prescribed daily quota; edit any time.
- **Weight tracking** — log weight over time with a trend chart and an optional
  target-weight reference line (Recharts).
- **i18n** — Chinese / English toggle, persisted to `localStorage`.
- **Editable display name** for each family member.

## Tech Stack

- **React 19 + TypeScript** (Vite)
- **Supabase** — PostgreSQL, Auth, and Realtime
- **Tailwind CSS** for styling
- **Recharts** for the weight trend chart
- **React Router** (HashRouter, for iframe/proxy compatibility)
- **Vitest** for unit tests

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is enough)

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase project credentials:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

In the Supabase SQL Editor, create the schema: `households`, `profiles`, `cats`,
`diet_plans`, `feeding_logs`, `weight_logs`. Enable row-level security and add
policies that isolate data by `household_id`. A registration trigger
(`handle_new_user`) creates a profile on signup (with `household_id = NULL`) so
the user can then choose to create or join a household.

Foreign keys for the author columns (`feeding_logs.fed_by`,
`weight_logs.recorded_by`, `diet_plans.created_by`) must reference
`public.profiles(id)` — not `auth.users` — so PostgREST can resolve the
`profiles:fed_by(...)` joins used in the app.

### 4. Run

```bash
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run lint` | Run ESLint |

## Tests

Unit tests cover the timezone-aware "today" window used to fetch a day's
feedings (`src/lib/dateRange.ts`). This logic guards against a real bug where the
timezone offset was applied twice, causing afternoon feedings in UTC+8 to fall
outside the day window and appear to vanish.

```bash
npm test
```

## Notes

- Uses **HashRouter** rather than BrowserRouter so the app works inside an iframe
  proxy without a blank screen.
- Email confirmation is disabled in Supabase for low-friction family use.
- Food intake is tracked in **grams** against a vet-set quota — no calorie math.

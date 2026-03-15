# CLAUDE.md — AI Instructions for the Rep Project

## What This App Is

**Rep** is a minimal focus timer web app. Users set a goal and a duration (1–30 min), run a timed "rep", write a quick retrospective note, and see their history by date. Think Pomodoro, but stripped down.

- **Guest users**: data stored in `localStorage`
- **Signed-in users**: data synced to Supabase DB, with weekly/monthly/yearly statistics unlocked

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18 + TypeScript (Create React App) |
| Backend / Auth | Supabase (PostgreSQL + Supabase Auth) |
| Charting | Recharts |
| Styling | Plain CSS (one `.css` file per component) |
| Routing | None — `activeTab` state in `App.tsx` controls views |

---

## Project Structure

```
src/
├── App.tsx                        # Root: layout, timer logic, tab switching, modal orchestration
├── App.css
├── types/
│   └── index.ts                   # Rep and User type definitions
├── supabaseClient.ts              # Supabase singleton client
├── contexts/
│   └── AuthContext.tsx            # Auth state (user, isAuthenticated), sign-in/up/out, session management
├── hooks/
│   └── useReps.tsx                # All rep CRUD: loads/saves to Supabase (authed) or localStorage (guest)
├── utils/
│   └── logger.ts                  # Styled console logger (info / warn / error)
└── components/
    ├── CurrentRep.tsx             # Timer UI + rep creation form (+ button → form → active countdown)
    ├── RepList.tsx                # List of completed reps for the selected date
    ├── RepCard.tsx                # Individual rep card
    ├── RepDetailModal.tsx         # Rep detail view + delete trigger
    ├── RetrospectiveModal.tsx     # Post-rep notes entry modal
    ├── Dashboard.tsx              # Daily summary: total time, rep count, average time
    ├── CalendarSection.tsx        # Date picker with per-day rep-count indicators
    ├── BaseModal.tsx              # Reusable modal shell (overlay + optional header/footer + body)
    ├── ConfirmModal.tsx           # Generic yes/no confirmation dialog (built on BaseModal)
    ├── ErrorBoundary.tsx          # React error boundary wrapping the main panels
    ├── Statistics/
    │   └── Statistics.tsx         # Weekly / Monthly / Yearly bar charts (auth-gated full-page view)
    └── Auth/
        ├── AuthModal.tsx          # Login / Signup modal container
        ├── Login.tsx              # Login form
        ├── Signup.tsx             # Signup form
        └── UserProfile.tsx        # User info displayed in the header
```

---

## Key Architectural Patterns

### Dual Storage (`useReps` hook)
`useReps` is the single source of truth for rep data. It transparently handles both backends:
- **Authenticated users** → reads/writes Supabase `reps` table
- **Guests** → reads/writes `localStorage['repList']`

All consumers just call `addRep()`, `deleteRep()`, `getFilteredReps()` — no storage logic leaks out. This is the primary "deep module" in the codebase.

> Exception: `Statistics.tsx` fetches its own data directly from Supabase for date-range queries. This is intentional — `useReps` loads all-time data which isn't suitable for filtered chart queries.

### Timer (in `App.tsx`)
Timer state lives entirely in `App.tsx`. The approach is **absolute end-time**:
- `endTime = Date.now() + remainingSeconds * 1000` is stored when the timer runs
- Each tick recomputes remaining from `endTime`, so pause/resume stays accurate
- On resume, `endTime` is recalculated from the current `remainingSeconds`

Do not move timer logic into `CurrentRep` — it's intentionally kept in `App.tsx` to let `handleCompleteRep` fire correctly.

### Tab-Based Navigation
`activeTab: 'daily' | 'dashboard'` in `App.tsx` switches between:
- `'daily'` — the main two-panel view (calendar + rep list on left, current rep + dashboard on right)
- `'dashboard'` — the `Statistics` full-page view

### Modal Orchestration
All modals are controlled from `App.tsx` via boolean open-state + associated data state (e.g., `repToReview`, `repToDelete`). Modals themselves are stateless about *which* rep they show — they receive it as a prop.

### BaseModal Pattern
All dialogs use `BaseModal` as the shell. Don't create new modal overlay logic — compose with `BaseModal` instead.

### Data Normalization (`Rep` type)
`Rep` has both `initial_seconds` (DB column name) and `initialSeconds` (legacy client field). `useReps` normalizes all incoming data to always populate both, preventing NaN issues downstream. Always keep both fields in sync when constructing a `Rep` object.

---

## Supabase Schema (relevant tables)

**`reps`**: `id`, `goal`, `notes`, `completed_at`, `initial_seconds`, `user_id`

**`users`**: `id`, `last_successful_rep_minutes`

(`last_successful_rep_minutes` stores the timer duration of the user's last successful rep, used to pre-fill the slider on next visit. For guests, this is stored in `localStorage['lastSuccessfulRepMinutes']`.)

---

## Common Pitfalls

- **Dual `initial_seconds` / `initialSeconds` fields** — always normalize both when creating or loading a `Rep`. See `useReps` data pipeline for reference.
- **Rep creation restricted to today** — `handleStartRep` in `App.tsx` enforces this. Don't bypass it.
- **`Statistics` fetches independently** — it does not use `useReps`. It queries Supabase directly with date filters.
- **Timer is App-level state** — `endTime`, `remainingSeconds`, `isPaused` all live in `App.tsx`. Resist the urge to push them down.

---

## Working Principles

### 1. Deep Module Design
When adding features or refactoring, prefer **deep modules**: narrow, simple interfaces hiding complex logic inside. The model is `useReps` — callers never care whether they're hitting Supabase or `localStorage`. Apply this when designing new hooks, contexts, or utilities: expose only what callers actually need, keep the internals private.

### 2. Pragmatic Application of Principles
Do **not** apply architectural principles rigidly at the cost of stability. Specifically:
- Don't refactor a **functioning** module just to make it cleaner
- If following a principle would mean rewriting large swaths of working code with no concrete bug or feature motivation, skip it
- The bar for touching working code is: there's a bug, a new feature requires it, or the existing structure actively causes problems

When in doubt, prefer leaving working code alone over "improving" it speculatively.

### 3. Keep This File Current
After completing any significant change — new feature, major refactor, schema change, notable architectural decision — **update this file**. Verify that component names, file paths, architectural descriptions, and schema info still match reality. Outdated docs are worse than no docs.

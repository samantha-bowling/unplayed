# Application Health Check — Execution Plan

Scope locked from your feedback. Three small, independent batches. No DB migrations, no behavior changes.

## Batch 1 — Console sweep (Tier 1)

**Approach:** introduce a tiny helper, not inline guards.

- Create `src/lib/dev-log.ts`:
  ```ts
  const isDev = import.meta.env.DEV;
  export const devLog  = (...a: unknown[]) => { if (isDev) console.log(...a); };
  export const devWarn = (...a: unknown[]) => { if (isDev) console.warn(...a); };
  // console.error stays as-is everywhere — useful for prod observability
  ```
- Sweep all `console.log` / `console.warn` calls in `src/**` → replace with `devLog` / `devWarn`. ~270 sites across ~80 files, top offenders: `supabase-debug.ts`, `use-game-picks.tsx`, `use-paginated-library.tsx`, `SteamAuthHandler.tsx`, `enhanced-steam-api.ts`, `useDirectRpcMetrics.tsx`, `useDirectRpcSpending.tsx`, `QueueManagerPage.tsx`.
- Leave `console.error` untouched (intentional prod visibility).
- Leave `supabase/functions/**` untouched (Deno runtime, separate logging story).
- Leave `console.log` calls already gated by `process.env.NODE_ENV === 'development'` or `import.meta.env.DEV` untouched.

**Risk:** zero — same runtime behavior in dev, silent in prod (which is already the stated policy).

## Batch 2 — Migration file cleanup (Tier 1)

- Inspect `supabase/migrations/add-performance-indexes.sql` (the only non-timestamped file).
- Check via `supabase--read_query` against `pg_indexes` whether each index in that file already exists.
  - If **all present** → delete the file (already applied historically, just lingering).
  - If **any missing** → wrap into a proper timestamped migration and apply via `supabase--migration`.
- Either way, the migrations directory ends up clean and timestamp-ordered.

**Risk:** low — read-only check first, only writes if indexes are genuinely missing.

## Batch 3 — Framer-motion duplicate check (Tier 2, kept per your call)

- Grep `package.json` + `src/**` for: `framer-motion`, `motion/react`, `@react-spring`, `react-spring`, `gsap`, `lottie`, `auto-animate`.
- Confirm only `framer-motion` is in use. Report findings inline in the closing message — no code change unless a duplicate is found.

**Risk:** zero — pure inspection.

## Batch 4 — Error boundary spot-check (your addition)

Not a full audit. Verify these two flows have a visible failure UI, not a silent hang:

1. **Steam auth flow** — `SteamAuthHandler.tsx`, `AuthCallbackHandler.tsx`, `SteamLoginButton.tsx`, `LoginErrorPage.tsx`. Confirm `try/catch` paths route to `LoginErrorPage` or surface a Sonner error toast, and that the auth route is wrapped in `DataErrorBoundary` (or equivalent).
2. **Library sync / import** — `useLibraryImport`, `import-library` edge function call site, `ImportProgressIndicator`. Confirm failure → toast + progress indicator resets, no spinner-forever state.

Deliverable: a short written assessment of any gaps + targeted fixes only where a real silent-failure path exists. No speculative wrapping of components that already have coverage.

**Risk:** low — additive only, won't touch happy paths.

## Out of scope (explicitly)

- The 53 SECURITY DEFINER linter warnings (intentional design).
- Page splits for `QueueManagerPage.tsx` / `Index.tsx`.
- Dependency upgrades.
- Refresh / query-key / RLS refactors.

## Order of execution

Batch 1 → Batch 2 → Batch 3 (report) → Batch 4 (report + targeted fixes). Each batch independently revertible.

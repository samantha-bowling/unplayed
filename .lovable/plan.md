

## Comprehensive Review & Improved Hero Section UX

### Impact Analysis

Before implementing, here is how the plan interacts with other parts of the app:

**No negative impact on other pages.** The changes are isolated to `Index.tsx` (hero section display) and `format-utils.ts` (new utility function). No calculation logic, hooks, or data pipelines are modified.

| Area | Impact | Detail |
|------|--------|--------|
| Dashboard refresh (`refreshAllData`) | None | Function logic unchanged; we only change what text appears below the button |
| `useDashboardRefresh` hook | None | Not used on Index.tsx; used elsewhere and untouched |
| `useMetricsRefresh` hook | None | Still called the same way; no changes |
| `useUnplayedData` | None | Still provides `lastRefreshed` (from `profile.last_sync`); we just use it differently |
| `useUserMetrics` | Read-only | We read `lastCalculated` from this existing hook for the refresh timestamp |
| Dust/Spend/Library pages | None | No shared state modified |
| Import edge function | None | It already updates `users.last_sync` on completion |

### Current Data Sources (already in the DB)

- **Last import time**: `users.last_sync` — updated by the `import-library` edge function every time it runs. Already available via `useProfile()` → `profile.last_sync`.
- **Last dashboard refresh time**: `user_metrics.last_calculated` — updated by `calculate_user_metrics_with_clean_score` RPC every time metrics are recalculated. Already available via `useUserMetrics()` → `lastCalculated`.

Both are persistent DB values, so they survive page reloads — unlike the current `useState` approach.

### Changes

**File: `src/utils/format-utils.ts`** — Add `formatRelativeTime` helper

A small function that converts a Date to a human-readable relative string: "just now", "5 minutes ago", "3 days ago", "2 weeks ago", etc.

**File: `src/pages/Index.tsx`** — Hero section updates

1. **Remove `lastImportTime` and `lastDashboardRefreshTime` local state** — these are volatile and reset on page reload.

2. **Read persistent timestamps from existing hooks**:
   - Import time: `profile.last_sync` (already available from `useProfile`)
   - Refresh time: `userMetrics?.lastCalculated` (add `useUserMetrics` import, already cached)

3. **Add descriptive text under each button**:
   - Import: "Fetches any new games added to your Steam library"
   - Refresh: "Recalculates your dust scores and dashboard stats"

4. **Show persistent relative timestamps** under each button:
   - "Last synced: 3 days ago" (with full date in tooltip)
   - "Last refreshed: 1 day ago" (with full date in tooltip)

5. **Add a gentle nudge** when `profile.last_sync` is older than 7 days:
   - Small amber text: "It's been a while — sync to catch new purchases!"

6. **Remove the ambiguous "Data last updated" line** (currently line 339-343) since per-button timestamps replace it.

### No database changes needed

All data sources already exist. No migrations, no new edge functions.


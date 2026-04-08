

## Dust Score Pages Consistency Review

### Current State

The Dust Report page has four tabs: Dust Score, Clean Score, Top Dust, and Analysis. After reviewing the code and database, here is what is working correctly and what needs fixing.

### What is Already Working

- **Clean Score progress bars**: Correctly normalized to each factor's max (15, 30, 35, 20) with "X/max" labels
- **Dust breakdown refresh**: `refresh_user_dust_breakdowns` DB function exists and is called during metrics refresh
- **Top Dust tab**: Uses real `game_dust_breakdowns` data with 5-factor tooltips
- **Dust Score tab**: Shows averaged per-game factors with clarifying text ("average per-game breakdown")
- **Analysis tab dustiest genre**: Now uses real `dustBreakdowns` data grouped by genre score tier instead of fake calculations

### Remaining Issue: Stale Breakdown Data (Critical)

The database shows **590 out of 1,067** records in `game_dust_breakdowns` do not match the current `user_games.dust_score`. While `refresh_user_dust_breakdowns` exists and is called during manual "Refresh Data" clicks, it only runs for the current user on demand. This means:

1. Users who haven't clicked "Refresh Data" since the function was added still have stale breakdowns
2. The Dust Score tab averages, Top Dust rankings, Biggest Opportunity, and Oldest Neglected cards may show outdated scores

**Root cause**: The `game_dust_breakdowns` table was populated during early batch runs and never auto-synced. The trigger on `user_games` updates `dust_score` there but does not propagate to `game_dust_breakdowns`.

### Plan

**Step 1: Auto-refresh breakdowns on page load when stale**

In `DustPage.tsx`, add logic that checks whether the user's breakdowns are stale (e.g., `last_calculated` older than the most recent `user_games.updated_at`) and automatically triggers `refresh_user_dust_breakdowns` in the background. This ensures data is fresh without requiring manual action.

- File: `src/pages/DustPage.tsx`
- Add a `useEffect` that calls `supabase.rpc('refresh_user_dust_breakdowns', { p_user_id })` if breakdowns are missing or outdated, then refetches the query

**Step 2: Add a staleness check query**

Create a small helper or inline query that compares the latest `game_dust_breakdowns.last_calculated` for the user against `user_games.updated_at` to determine if a refresh is needed.

- File: `src/pages/DustPage.tsx` (inline) or a small utility hook

**Step 3: Ensure Top Dust tab shows more than 10 games**

The `TopDustContributors` component accepts a "Show top" dropdown (5/10/15/20), but `DustPage.tsx` only passes `dustBreakdowns?.slice(0, 10)` as contributors. This caps the list at 10 regardless of selection.

- File: `src/pages/DustPage.tsx` line 80
- Change: Pass the full `dustBreakdowns` array (or at least top 20) instead of slicing to 10

### Technical Details

| File | Change |
|------|--------|
| `src/pages/DustPage.tsx` | Add auto-refresh logic for stale breakdowns on mount; pass full contributors array |
| No new migrations needed | `refresh_user_dust_breakdowns` already exists |
| No new edge functions | Uses existing RPC call |

### Impact

- All four Dust tabs will show accurate, up-to-date data
- Users visiting the page for the first time since the fix will see a brief loading state while breakdowns sync
- Subsequent visits will be fast (data already fresh)
- Top Dust dropdown will correctly show 5/10/15/20 games


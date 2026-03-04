

# Comprehensive Cleanup & Optimization Plan

## Summary

8 action items from the assessment, organized into 4 phases. Each phase is independent and can be implemented sequentially.

---

## Phase 1: Fix 1000-Row Query Limit (High Priority)

**Problem:** Supabase returns max 1000 rows by default. Users with 1000+ games silently lose data in two hooks.

**Files:**
- `src/hooks/use-library-data.tsx` — the `user_games` query (line ~86)
- `src/hooks/useUnplayedData.tsx` — the `user_games` query (line ~41)

**Fix:** Add a loop-based fetcher that paginates using `.range(from, to)` in chunks of 1000 until all rows are returned. Extract a shared `fetchAllUserGames()` utility that both hooks call. No UI changes needed.

```text
fetchAllUserGames(userId):
  allData = []
  page = 0
  loop:
    data = supabase.from('user_games')...range(page*1000, (page+1)*1000-1)
    allData.push(...data)
    if data.length < 1000: break
    page++
  return allData
```

---

## Phase 2: Delete Dead Code (Low Effort, High Cleanup Value)

### 2a. Delete `IndexOptimized.tsx`
- File has zero imports anywhere in the codebase
- Delete `src/pages/IndexOptimized.tsx` (439 lines)

### 2b. Delete unused spending hooks
The actual dependency chain is:
- **Used:** `useUnifiedSpendingDataV2` (by SpendingEstimate, SpendingSummary, SpendingInsights, SpendPage, useDashboardData)
- **Used internally:** `useDirectRpcSpending` (by useUnifiedSpendingDataV2 only, exports a function)
- **Used internally:** `useSpendingMetrics` (by useUnifiedSpendingData, use-total-library-spending)
- **Used internally:** `use-total-library-spending` (need to check consumers)

**Unused (zero external consumers):**
- `src/hooks/use-spending-data.tsx` — 0 importers → **delete**
- `src/hooks/use-spending-data-enhanced.tsx` — 0 importers outside itself → **delete**
- `src/hooks/use-spending-data-simple.tsx` — 0 importers outside itself → **delete**

After verifying `use-total-library-spending.tsx` and `useUnifiedSpendingData.tsx` consumer chains, those may also be deletable, but they depend on `useSpendingMetrics` which is used by other hooks. Will verify during implementation.

### 2c. Delete duplicate query keys file
- `src/hooks/use-query-keys.ts` is imported by 19 files
- `src/hooks/use-query-keys-optimized.ts` is imported by 2 files (useUnplayedData, useRefreshCache)
- Both are actively used — merging them requires updating imports across 19+ files
- **Action:** Merge `use-query-keys-optimized.ts` exports into `use-query-keys.ts` and update the 2 files that import the optimized version

---

## Phase 3: Add Route-Level Code Splitting

**Problem:** All 15+ page components are eagerly imported in `App.tsx`. The `Suspense` wrapper already exists but does nothing without lazy imports.

**Fix:** Convert all page imports in `App.tsx` to `React.lazy()`:
```ts
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const DustPage = lazy(() => import('./pages/DustPage'));
// etc.
```

Keep `Index` and `AuthPage` eager (most common entry points). Lazy-load everything else (~13 pages). The existing `Suspense` fallback already handles the loading state.

---

## Phase 4: Remove Excessive Console Logging

**Problem:** 700+ `console.log` calls across 43 files, many in hot paths.

**Action:**
- Remove all `console.log` statements from production code paths in hooks and utils
- Keep `console.error` and `console.warn` for actual error handling
- Keep logs guarded by `process.env.NODE_ENV === 'development'`
- Key files to clean: `transformUnplayedData.ts`, `use-library-data.tsx`, `normalize-games.ts`, `useUnplayedData.tsx`, `auth-utils.ts`

This is a bulk find-and-remove pass across ~43 files. Will prioritize the hottest paths (data hooks, transforms) and leave debug/admin pages alone.

---

## Database Cleanup (Separate — requires Supabase dashboard)

These items need SQL migrations:

1. **Remove duplicate RLS policies on `game_picks`:** Drop "Users can insert their own picks" (duplicate of "Users can create their own game picks") and "Users can view their own picks" (duplicate of "Users can see their own game picks")

2. **Drop orphaned HLTB artifacts:** Drop the `update_game_estimates_timestamp()` function (the trigger was already removed). The `game_estimates` table can stay or be dropped — it has no active consumers.

---

## Effort Summary

| Phase | Items | Files Changed | Effort |
|-------|-------|--------------|--------|
| 1 | Pagination fix | 3 (new util + 2 hooks) | Medium |
| 2 | Dead code deletion | ~6 deleted, ~2 updated | Low |
| 3 | Code splitting | 1 (App.tsx) | Low |
| 4 | Console cleanup | ~20-30 files | Low-Medium |
| DB | RLS + function cleanup | 1 migration | Very Low |


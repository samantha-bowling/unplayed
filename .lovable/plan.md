

## Batch 1a: Two Quick Fixes

### 1. Fix LeaderboardPage error toast spam
**File:** `src/pages/LeaderboardPage.tsx` (lines 62-68)

The error toast fires directly in the render body, causing it to re-trigger on every render. Wrap it in a `useEffect` with `error` as a dependency.

### 2. Remove DustPage debug console.logs
**File:** `src/pages/DustPage.tsx` (lines 36-47)

Delete the entire `useEffect` block that logs userMetrics, dustBreakdowns, and cleanScoreBreakdowns to the console.

Both are safe, isolated changes with zero UI/layout impact.


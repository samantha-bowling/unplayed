# Application-Wide Deep Dive: High-Impact, Low-Lift Improvements

## 1. Excessive Console Logging (892 matches across 54 files)

The codebase has ~892 `console.log` calls across 54 files. Key offenders beyond the picker (which was partially cleaned):

- `**UnplayedCounter.tsx**` (line 54-60) — logs on every render with user metrics
- `**DustScoreMeter.tsx**` (line 43-49) — logs on every render with dust data
- `**SpendingEstimate.tsx**` (line 24-29) — logs on every render
- `**use-user-metrics.ts**` — 3 logs per fetch cycle
- `**useUnifiedSpendingDataV2.tsx**` — 4 logs per fetch cycle
- `**AuthContext.tsx**` — 8+ logs during auth flow
- `**use-genre-stats.ts**`, `**use-dust-score-data.tsx**`, `**useDashboardData.tsx**`, `**usePriceDistribution.tsx**` — all log on fetch

**Fix:** Remove all non-error `console.log` calls from production components and hooks. Keep `console.error` and `console.warn` for genuine error handling. Gate any remaining debug logs behind `process.env.NODE_ENV === 'development'` (as `PrivacyPolicyDialog.tsx` already does correctly).

**Impact:** Reduces console noise, minor performance improvement from fewer string allocations on every render cycle.

## 2. Unused `useTransition` in App.tsx

`App.tsx` imports `useTransition` and renders a floating loader when `isPending` is true (line 32, 158-162), but `startTransition` is never called anywhere — `isPending` is always `false`. The loader never appears.

**Fix:** Remove the `useTransition` import, the `isPending` destructure, and the floating loader JSX (lines 27, 32, 157-162).

## 5. `document.cookie` Check in Render Path

Both `UnplayedCounter.tsx` (line 98) and `DustScoreMeter.tsx` (line 105) check `document.cookie.includes("demo_note_dismissed")` during render. This is a synchronous DOM read on every render, and cookies aren't reactive — the UI won't update if the cookie changes.

**Fix:** Replace with a `localStorage` check done once via `useState` initializer, or simply remove the cookie check and always show the demo note (it's already gated behind `isDemoMode`).

## 6. Missing `<meta>` Description / SEO

`index.html` likely has minimal meta tags. The app has `react-helmet-async` installed but pages don't appear to set page-specific titles or descriptions.

**Fix:** Add `<Helmet>` tags with page-specific titles to key pages (Index, Leaderboard, Dust, Spend, Library). Low lift, improves SEO and social sharing.

## 7. Leaderboard Page: `leaderboardWithCorrectRanks` Recalculates Every Render

`LeaderboardPage.tsx` line 70 computes `leaderboardWithCorrectRanks` with `.map()` on every render without `useMemo`. For large leaderboards this is wasteful.

**Fix:** Wrap in `useMemo` with `[leaderboardData, pagination.page, pagination.pageSize]` deps.

## 8. SteamLoader Dynamic Tailwind Classes Won't Work

`SteamLoader.tsx` lines 73, 116 use template literals for Tailwind classes: `bg-${variant === 'primary' ? 'unplayed-mint' : 'unplayed-amber'}/40`. Tailwind purges dynamically constructed class names — these styles only work by coincidence if the full class exists elsewhere.

**Fix:** Use a conditional map: `variant === 'primary' ? 'bg-unplayed-mint/40' : 'bg-unplayed-amber/40'`. Same pattern for the center dot.

---

## Proposed Implementation Plan

### Phase 1: Console Log Cleanup (highest impact on DX)

Remove ~60+ `console.log` calls from the most active components and hooks listed above. Keep error/warn logging.

### Phase 2: Code Quality Fixes

- Remove unused `useTransition` from `App.tsx`
- Fix SteamLoader dynamic Tailwind classes
- Replace `document.cookie` checks with localStorage in UnplayedCounter and DustScoreMeter
- Memoize `leaderboardWithCorrectRanks`

### Phase 4: SEO

- Add `<Helmet>` page titles to Index, Leaderboard, Dust, Spend, Library pages
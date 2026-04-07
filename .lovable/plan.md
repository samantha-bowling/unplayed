

## Consistency Fix Plan: Dust Score Quality + Clean Score Cleanup

### Current State (Confirmed)

**Clean Score on /dust:** Already reads from the database via `useUserMetrics()` and `useCleanScoreBreakdowns()`. The screenshot confirms the 4-factor DB system (Diversity 10, Recency 24, Backlog Conversion 13, Session Depth 20) is what users see. The client-side `calculateCleanScore` is NOT used on this page.

**Dust Score quality factor:** The DB function `calculate_enhanced_dust_score` uses low quality = high dust (Metacritic 90+ → 5 points). The client fallback in `use-dust-score-data.tsx` lines 150-154 uses the opposite (Metacritic 90+ → 20 points). You want the client philosophy: high quality + unplayed = high dust.

### Changes

**Step 1: Update DB function `calculate_enhanced_dust_score`** (database migration)

Align the quality score to match client philosophy (high quality unplayed = more shameful = higher dust):

| Metacritic | Current DB | New DB (matching client) |
|---|---|---|
| 90+ | 5 | 20 |
| 80+ | 8 | 17 |
| 70+ | 10 | 14 |
| 60+ | 12 | 10 |
| <60 | 15 | 6 |
| NULL | 10 | 10 (unchanged) |

This is a single `CREATE OR REPLACE FUNCTION` migration. The total score formula stays the same.

**Step 2: Remove dead client-side code**

- `src/utils/dust-score-utils.ts`: Remove `calculateEnhancedDustScore` (dead code, never imported elsewhere). Keep `processDustBreakdown` and `processDustBreakdowns` which are actively used.
- `src/utils/spending-calculations.ts`: Delete entirely (dead code, nothing imports from it).
- `src/utils/clean-score-utils.ts`: Remove `calculateCleanScore` function. Keep `CLEAN_SCORE_TIERS` export (actively used by components and `use-dust-score-data.tsx`).

**Step 3: Remove client clean score calculation from `use-dust-score-data.tsx`**

Lines 233-251 calculate a client-side clean score that populates `legacyCleanScoreBreakdown`. Since the Dust page already reads from the DB, this code path is only used for the `combinedData` fallback (line 350-354). Replace with DB-sourced values or safe defaults.

- Remove import of `calculateCleanScore`
- Remove the `gamesList` construction and `calculateCleanScore` call
- For `legacyCleanScoreBreakdown` in the combined data, use safe zero defaults (it's not displayed on the Dust page anymore)

**Step 4: Fix weight labels in `CleanScoreBreakdown.tsx`**

The UI currently shows "25% weight" for all 4 factors (lines 137, 163, 185, 209). The actual DB weights are: Diversity 15%, Recency 30%, Backlog Conversion 35%, Session Depth 20%. Update the labels to match.

### Risk Assessment

- **Low risk**: Removing dead code (Steps 2-3) — no functional change
- **Low risk**: Fixing weight labels (Step 4) — cosmetic only
- **Medium risk**: DB quality score change (Step 1) — affects future dust recalculations. Existing `user_games.dust_score` values won't change until next recalculation. Consider triggering a recalculation after migration, or accept gradual update.

### Files Changed

| File | Action |
|---|---|
| New migration SQL | Update `calculate_enhanced_dust_score` quality scores |
| `src/utils/dust-score-utils.ts` | Remove `calculateEnhancedDustScore` |
| `src/utils/spending-calculations.ts` | Delete file |
| `src/utils/clean-score-utils.ts` | Remove `calculateCleanScore`, keep `CLEAN_SCORE_TIERS` |
| `src/hooks/use-dust-score-data.tsx` | Remove client clean score calculation |
| `src/components/dust/CleanScoreBreakdown.tsx` | Fix weight % labels |


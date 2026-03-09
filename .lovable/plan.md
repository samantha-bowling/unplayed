

# HLTB Cleanup Plan

## Scope

Remove all HowLongToBeat integration: 3 edge functions, admin page HLTB sections, data hooks, types, and references. The `game_estimates` DB table stays (no migration needed — it's just unused data).

## Changes

### 1. Delete Edge Functions (3 files + config)
- **Delete** `supabase/functions/fetch-hltb-estimate/index.ts`
- **Delete** `supabase/functions/backfill-hltb-estimates/index.ts`
- **Delete** `supabase/functions/prioritize-hltb-games/index.ts`
- **`supabase/config.toml`** — remove `[functions.prioritize-hltb-games]` block

### 2. Clean `prioritize-smart-queue` Edge Function
- Remove `hasEstimate` from `ScoringWeights` interface and `DEFAULT_WEIGHTS`
- Remove the `game_estimates` query (lines ~140-150) and the `gamesWithEstimates` Set
- Remove the "Penalize games that already have estimates" scoring block (lines ~243-246)
- Remove `hasEstimate` from the scored game return object

### 3. Remove `game_estimates` Query from `useUnplayedData.tsx`
- Delete the `gameIds` memo, the `gameEstimatesData` query, and `isLoadingEstimates`
- Update `transformedData` memo to call `transformUserGameData(userGamesData)` without estimates
- Update `isLoading` to remove `isLoadingEstimates`

### 4. Clean `transformUnplayedData.ts`
- Remove `gameEstimatesData` parameter from `transformUserGameData`
- Remove `completionEstimate`, `mainStoryEstimate`, `averageEstimate`, `steamAppid`, `howLongToBeatId` field mappings
- Remove `potentialGameplayHours` calculation and field

### 5. Clean Types (`unplayed-data.types.ts`)
- Remove from `GameListItem`: `completionEstimate`, `mainStoryEstimate`, `averageEstimate`, `steamAppid`, `howLongToBeatId`
- Remove `potentialGameplayHours` from `UnplayedDataType`

### 6. Clean `use-query-keys-optimized.ts`
- Remove the `estimates` key group

### 7. Clean `use-dust-score-data.tsx`
- Remove `completionEstimate`, `mainStoryEstimate`, `averageEstimate`, `steamAppid`, `howLongToBeatId` from the fallback game object

### 8. Clean Demo/Fallback Data
- **`src/lib/demo-data.ts`** — remove `potentialGameplayHours` field and its type comment
- **`src/lib/data-service.ts`** — remove `potentialGameplayHours` from fallback object
- **`src/utils/normalize-games.ts`** — remove all `potentialGameplayHours` references

### 9. Rename Admin Page Route & Nav
- **`src/pages/AdminHltbDataPage.tsx`** — strip all HLTB stats/batch/prioritization sections; keep only the Metadata Consistency card. Rename component to `AdminDataManagerPage`
- **`src/App.tsx`** — rename route from `/admin/hltb-data` to `/admin/data-manager`, update import and redirects
- **`src/components/header/MobileMenu.tsx`** — rename nav link from "HLTB Data" to "Data Manager"


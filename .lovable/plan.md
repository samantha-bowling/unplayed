

## Dust Score Pages Consistency Review

### Issues Found

**1. Stale `game_dust_breakdowns` table (Critical)**
55% of records (590 of 1,067) in `game_dust_breakdowns` don't match the current `user_games.dust_score`. The trigger on `user_games` keeps dust scores fresh as time passes (e.g., age scores increase), but the breakdowns table is only populated during specific recalculation runs and never auto-updated. This means:
- **Dust Score tab**: The averaged quality/price/age/genre/playtime values shown in the progress bars are based on stale per-game data
- **Top Dust tab**: Individual game dust scores and breakdowns shown in tooltips are outdated
- **Biggest Opportunity / Oldest Neglected cards**: May show wrong dust scores

**Fix**: Create a DB function that refreshes `game_dust_breakdowns` for a user by re-reading from `user_games` + `games` tables and applying `calculate_enhanced_dust_score`. Call it during metrics refresh. Alternatively, add a trigger on `user_games` that keeps `game_dust_breakdowns` in sync.

**2. Clean Score progress bars are misleading (Medium)**
Each Clean Score factor has a different maximum: Diversity (0-15), Recency (0-30), Backlog Conversion (0-35), Session Depth (0-20). But the `<Progress>` component uses the raw value as a 0-100 percentage. So a maxed-out Diversity score of 15 renders as only 15% filled, while a maxed-out Backlog Conversion of 35 renders as 35% filled. This is visually confusing — all maxed-out bars should appear full.

**Fix**: Normalize each value to its own max before passing to Progress:
```
diversityPercent = (diversityScore / 15) * 100
recencyPercent = (recencyScore / 30) * 100
backlogPercent = (backlogConversionScore / 35) * 100
sessionDepthPercent = (sessionDepthScore / 20) * 100
```
Also update the subtitle text to show e.g. "12/15 (15% weight)" instead of just "15% weight".

**3. Analysis tab: Dustiest Genre uses fake dust scores (Medium)**
In `DustScorePerGame.tsx` line 94, the dustiest genre calculation uses `avgDustScore * 0.3` as a simplified proxy for played games instead of actual per-game dust scores from `user_games`. This produces inaccurate genre-level dust data.

**Fix**: Use actual dust scores from `dustBreakdowns` data (already available via the hook) instead of the `unplayedData` source with fake calculations. Pass `dustBreakdowns` as a prop or use the hook directly.

**4. Dust Score tab: averaged factors don't explain the total (Low)**
The page header says "Your total Dust Score of X" but the progress bars show **averaged** per-game factor scores. There's no clear connection between "Quality: 12" (an average) and the total score of 6,299 (a sum). Users may be confused about what the numbers mean.

**Fix**: Add clarifying text like "Average per-game breakdown" above the progress bars, and add a note: "Total = sum of all per-game scores across N games".

### Summary of Changes

| File | Change |
|------|--------|
| New migration | Create `refresh_user_dust_breakdowns(p_user_id)` function that syncs `game_dust_breakdowns` from `user_games` + `games` + `calculate_enhanced_dust_score` |
| `src/hooks/useMetricsRefresh.tsx` | Call the new breakdown refresh function during metrics refresh |
| `src/components/dust/CleanScoreBreakdown.tsx` | Normalize progress bars to each factor's max; show "X/max" labels |
| `src/components/dust/DustScorePerGame.tsx` | Replace fake genre dust calculation with real data from `useDustBreakdowns` |
| `src/components/dust/DustScoreBreakdown.tsx` | Add "Average per-game" label to clarify the relationship between factors and total |


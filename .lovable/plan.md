

## Add Average Dust Score to Leaderboard

The leaderboard currently shows only the raw total dust score, which scales with library size. Adding an "Avg Dust" column provides a normalized comparison without revealing game counts.

### Changes

**1. `src/hooks/use-leaderboard-data.tsx`**
- Add `total_games` to the select query on line 136
- This field already exists in the `LeaderboardEntry` type but isn't being fetched

**2. `src/pages/LeaderboardPage.tsx`**
- Add a 4th column header: **"Avg Dust"** (with `hidden md:table-cell` for mobile)
- For each row, compute and display `Math.round(entry.dust_score / entry.total_games)` in a secondary style
- Update the info tooltip (lines 228-237) to briefly mention the 5-factor formula and that Avg Dust normalizes for library size
- No game counts, library sizes, or player-specific numbers shown — just the averaged score

### What stays private
- `total_games` is fetched for the calculation only — it is **not** displayed anywhere
- No subtitle with game counts under player names


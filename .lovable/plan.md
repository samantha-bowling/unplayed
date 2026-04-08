

## Game DNA Tab for Library Page

### Concept

A new "Game DNA" tab on the `/library` page that synthesizes all available data into a personalized gamer profile. Instead of showing raw stats, it tells the user *who they are as a gamer* through six scored dimensions visualized as a radar/hexagon chart, plus supporting insights.

### Data Available (Already in DB)

All calculations are purely client-side from existing data -- no new tables, no new edge functions, no migrations needed.

| Data Source | Fields Used |
|---|---|
| `user_games` | playtime_minutes, dust_score, acquisition_date, last_played_date |
| `games` | genres, categories, price_cents, metacritic_score, release_date |
| `user_metrics` | total_games, played_games, unplayed_games, total_playtime_hours, average_dust_score, clean_score |
| `user_spending_metrics` | total_spent_cents, free_games, paid_games, confidence_score |
| `user_genre_stats` | genre_name, game_count, percentage |

### The Six DNA Dimensions (0-100 each)

1. **Collector** -- Library size relative to average Steam users. Based on `total_games`.
2. **Explorer** -- Genre diversity and willingness to try new things. Derived from unique genre count and genre distribution evenness (Shannon entropy across `user_genre_stats`).
3. **Completionist** -- How deeply games are played. Based on average playtime per played game and ratio of games with 10+ hours.
4. **Hoarder** -- Inverse of play rate. Based on unplayed percentage and average dust score. Higher = more hoarding.
5. **Bargain Hunter** -- Spending efficiency. Based on free game percentage, average price paid, and cost-per-hour of entertainment.
6. **Retro Gamer** -- Preference for older titles. Based on average release year age and percentage of vintage (11+ year) games.

### Visual Design

```text
                Collector
                  /    \
     Retro Gamer /      \ Explorer
                |        |
  Bargain Hunter \      / Completionist
                  \    /
                 Hoarder
```

A hexagonal radar chart rendered with SVG (no new dependencies), styled with the unplayed-mint color scheme. Each axis labeled with the dimension name and score. The filled area shows the user's "shape."

Below the radar chart: six cards in a 2x3 or 3x2 grid, one per dimension, showing:
- Dimension name and icon
- Score (0-100) with a small progress bar
- A witty one-liner based on score tier (e.g., Collector 90+ = "Your library has its own gravitational pull")
- Key stat that drives the score

### Additional Insights Section

Below the DNA dimensions, a "Library Personality" section with:
- **Gamer Archetype**: A single label based on the dominant 2-3 dimensions (e.g., "The Thoughtful Collector" if high Collector + high Explorer + low Hoarder)
- **Play Style**: Single-player vs Multiplayer preference (from `categories` data -- Single-player vs Multi-player/Co-op counts)
- **Platform Preference**: Controller vs Keyboard (from Full/Partial Controller Support category counts)
- **Most Unexpected Stat**: One auto-selected surprising insight (e.g., "You own 68 highly-rated games you've never touched")

### Implementation

| File | Change |
|---|---|
| `src/components/LibraryGameDNA.tsx` | New -- main Game DNA tab component with radar chart and dimension cards |
| `src/components/dna/DNARadarChart.tsx` | New -- SVG hexagonal radar chart component |
| `src/components/dna/DNADimensionCard.tsx` | New -- individual dimension score card |
| `src/components/dna/DNAPersonality.tsx` | New -- archetype and play style insights |
| `src/utils/game-dna-utils.ts` | New -- all scoring calculations (pure functions, no DB calls) |
| `src/pages/LibraryPage.tsx` | Add 5th tab "Game DNA" to the TabsList (change grid-cols-4 to grid-cols-5) |

### No Backend Changes

All six dimension scores are computed client-side from data already fetched by `useLibraryData()`, `useUserMetrics()`, and `useGenreStats()`. No new database tables, edge functions, or migrations required.


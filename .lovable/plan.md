

## Game DNA: Calculation Transparency + Radar Label Fix

### Two issues to fix:

**1. Radar chart labels clipped** — The SVG viewBox is `300x300` but labels at `RADIUS + 28` pixels from center extend beyond the viewBox edges, clipping "Retro Gamer", "Bargain Hunter", "Completionist", and "Hoarder". Fix: increase viewBox to `380x380`, adjust CENTER to 190, and increase label offset to `RADIUS + 35` for breathing room.

**2. No visibility into what scores mean** — Each dimension card currently shows a score, a one-liner, and a single stat. Users can't understand *why* they got 21 for Collector or what 21 means relative to the scale.

### Solution: Add calculation explanation to each dimension

Add a new `explanation` field to `DNADimension` that describes the scoring formula in plain language and shows the user's position on the scale. Examples:

- **Collector 21**: "Based on 83 games owned. Score reaches 50 at ~200 games and 100 at 400+."
- **Explorer 65**: "Based on 10 unique genres and how evenly you play across them."
- **Completionist 44**: "Based on 8.7h average per played game. Score reaches 100 at ~20h average."
- **Hoarder 58**: "64% unplayed games (70% weight) combined with dust score (30% weight)."
- **Bargain Hunter 23**: "Combines avg price paid, % free games, and cost per hour of play."
- **Retro Gamer 40**: "Based on 6.2yr average game age and 18% vintage (11+ year) games."

The dimension card will show a collapsible or always-visible explanation line below the existing content, styled subtly.

### Files to modify

| File | Change |
|------|--------|
| `src/utils/game-dna-utils.ts` | Add `explanation` field to `DNADimension` type; generate plain-language explanations in each `calc*` function showing the formula inputs and scale benchmarks |
| `src/components/dna/DNADimensionCard.tsx` | Display the new `explanation` text below the existing stat line |
| `src/components/dna/DNARadarChart.tsx` | Increase viewBox to `380x380`, adjust CENTER/label offsets to prevent label clipping |


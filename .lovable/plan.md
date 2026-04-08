

## Rename "Game DNA" → "Library DNA"

A copy-only change across the files that reference "Game DNA" in user-facing text. No logic, scoring, or file renaming needed — just updating strings.

### Changes

**`src/pages/LibraryPage.tsx`**
- Tab trigger label: "Game DNA" → "Library DNA"

**`src/components/LibraryGameDNA.tsx`**
- Heading: "Your Game DNA" → "Your Library DNA"
- Empty state text: "Import your Steam library to reveal your Game DNA" → "Import your Steam library to reveal your Library DNA"
- Subtitle: "Six dimensions that define who you are as a gamer, built from your entire Steam library." → "Six dimensions that define your gaming identity, built from your entire Steam library."
- Loading text: "Analyzing your DNA..." → "Analyzing your library DNA..."

**`src/components/dna/DNARadarChart.tsx`**
- SVG `aria-label`: "Game DNA Radar Chart" → "Library DNA Radar Chart"

No file renames, no logic changes, no new dependencies.




# Accessibility Improvements (Trimmed)

## What's Cut
- Phase 4 (color/context rank text, mood icon labels) — nice-to-have, minimal real-world impact
- GameCard `focus-within` keyboard overlay (#6) — more complex, better as a separate pass
- SVG chart `role="img"` (#11) — charts already have legends/tooltips
- Import progress live region (#4) — import flow is rare, low priority

## What Remains (3 focused phases)

### Phase 1: Live Regions (screen reader announcements)
1. `GameSpinner.tsx` — add `role="status"` + `aria-live="polite"` to container
2. `RandomPicker.tsx` — wrap pick result area in `aria-live="polite"` so selected game name is announced
3. `UnplayedCounter.tsx` / `SpendingMeter.tsx` — add visually hidden `<span>` with final value + `aria-live`, put `aria-hidden="true"` on animated display

### Phase 2: Button Labels
4. `GameCard.tsx` — add `aria-label` to icon-only buttons (Play, Steam link, Hide, Note)
5. `CleanScoreMeter.tsx`, `DustScoreMeter.tsx`, `ShelfLifeDescription.tsx` — add `aria-label="More info"` to info icon buttons
6. `LibraryPreview.tsx` — add `aria-label="Search games"` to search input, `aria-pressed` to toggle filter buttons

### Phase 3: Semantic HTML & Navigation
7. `Header.tsx` — add visually hidden skip-to-content link (`sr-only focus:not-sr-only`) + `id="main-content"` on main content wrapper
8. `Footer.tsx` — change `<a href="#">` modal triggers to `<button>` elements

**Total: ~8 files, all additive changes, zero visual impact.**


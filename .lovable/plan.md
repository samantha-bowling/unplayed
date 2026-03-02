

# Picker Improvements with LocalStorage Persistence

## Summary

Three phases of improvements. Phase 3 uses **localStorage** instead of Supabase to persist picks for authenticated users, avoiding database usage.

## Phase 1: Code Quality (no UI changes)
- Remove ~30 debug `console.log` statements from `RandomPicker.tsx`, `use-session-picker.tsx`, `use-game-picks.tsx`
- Remove unused `ScrollArea` imports from `SelectedGame.tsx` and `RecentPick.tsx`
- Fix duplicate "Launching game" toast — remove from `RandomPicker.handlePlayGame`, keep in `SelectedGame`
- Fix stale closure — call `selectRandomGame()` before `setTimeout`, pass result into the callback

## Phase 2: Accessibility & Mobile
- Replace `MoodFilterDropdown` internals with Radix `DropdownMenu` — adds keyboard nav, click-outside dismiss, removes manual `isDropdownOpen` state
- Fix mobile layout in `SelectedGame.tsx` and `RecentPick.tsx` — `flex-col md:flex-row`, `w-full md:w-1/3`

## Phase 3: LocalStorage Pick Persistence
- In `use-session-picker.tsx`, save `currentSessionPick` and `previousSessionPick` to localStorage keyed by user ID (e.g., `picker_picks_{userId}`)
- On mount, hydrate session state from localStorage if the same user is logged in
- Keep session-only (no persistence) for unauthenticated/demo users
- `use-game-picks.tsx` and the `game_picks` Supabase table remain untouched — no DB writes for picks

### localStorage schema
```json
{
  "currentPick": { "id": 123, "name": "...", ... },
  "previousPick": { "id": 456, "name": "...", ... },
  "timestamp": "2026-03-02T..."
}
```

Key: `steam_picker_${userId}`

Optional: expire after 7 days so stale picks don't persist indefinitely.


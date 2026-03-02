

## Dead Code Safety Check: Demo Mode Impact

### Files proposed for deletion

**`src/hooks/use-picker-data.tsx`** — Zero imports anywhere in the codebase. Confirmed dead code. No demo logic depends on it.

**`src/components/PickerGameCard.tsx`** — Zero imports anywhere in the codebase. Confirmed dead code. No demo logic depends on it.

### How demo mode flows through the picker today

1. `Index.tsx` renders `<RandomPicker />` with **no** `isDemo` prop
2. `RandomPicker` receives `isDemo` via the `withDemoIndicator` HOC, which reads from `useDemoMode()` context
3. `RandomPicker` uses `useSessionPicker` (not `usePickerData`) — this is the live hook
4. `isDemo` is only used for: logging, passing to `SelectedGame` and `RecentPick` (display-only), and the `MoodFilterDropdown` label
5. The actual game data in demo mode comes from `useUnplayedData` → which checks `useDemoMode().isDemo` internally and returns `DEMO_DATA` when true

### Conclusion

**Safe to delete both files.** Neither `use-picker-data.tsx` nor `PickerGameCard.tsx` is referenced anywhere. The demo data pipeline flows through `DemoModeContext` → `useUnplayedData` → `useSessionPicker` → `RandomPicker`, and none of those touch the dead files. Deleting them has zero impact on demo or live functionality.


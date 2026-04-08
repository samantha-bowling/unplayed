

## Fix: Stale Import Timestamp + Button Area Layout

### Bug 1: `last_sync` never updates

**Root cause**: The `import-library` edge function uses `safeImportNewGames()` from `import-analysis-utils.ts`, which does NOT call `updateUserLastSync()`. That function only exists in `database-utils.ts → processGamesInBatches()`, which is never called by the current import flow.

So `profile.last_sync` stays at whatever it was set to during your original import months ago.

**Fix**: Add an `updateUserLastSync` call in `import-library/index.ts` after the import processing completes (both in the background and synchronous paths). We'll update `last_sync` right after `safeImportNewGames` and `updateExistingGamesPlaytime` finish, before the calculation chain runs.

### Bug 2: Button area too tall

The two button columns each have `max-w-[220px]`, forcing the description text and timestamps to wrap into 3+ lines. The fix:

- Increase `max-w` from `220px` to `280px` on each column
- Switch to a horizontal layout with `sm:flex-row` and `sm:items-start` so on desktop the columns sit side by side more compactly
- Reduce vertical gaps between button, description, and timestamp from `mt-2` to `mt-1`

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/import-library/index.ts` | Add `last_sync` update after import processing |
| `src/pages/Index.tsx` | Widen button columns, tighten spacing |


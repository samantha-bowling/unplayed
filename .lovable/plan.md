

## Production Readiness Review

I reviewed the new batched dust-score recalculation feature across the edge function, database function, batch processor hook, and admin UI. Here are the findings:

### Critical Issues

**1. Edge function has no authentication or admin check**
`supabase/functions/recalculate-dust-scores/index.ts` uses the service role key to call the RPC but never validates who is calling it. Anyone with the project URL and anon key can invoke it and trigger mass updates to 302K records. This is the highest priority fix.

**Fix:** Validate the JWT from the `Authorization` header, then check admin role using the `is_admin()` database function before proceeding.

**2. No input validation on `batchSize`**
A caller could pass `batchSize: 999999` and cause the same timeout problem the batching was designed to prevent. The value should be clamped (e.g., 1–20000).

### Moderate Issues

**3. Excessive `console.log` statements in production code**
Per the project's console-logging policy, these files have non-essential `console.log` calls that should be removed or gated behind dev checks:
- `src/hooks/use-batch-processor.ts` — ~10 log statements
- `src/pages/QueueManagerPage.tsx` — ~5 log statements
- `supabase/functions/recalculate-dust-scores/index.ts` — 2 log statements (edge function logs are acceptable here since they're server-side and useful for debugging)

**4. `useBatchProcessor` cursor mismatch (minor, already worked around)**
The hook's `lastProcessedId` state is typed as `number` but dust scores use UUID cursors. The current `useRef` workaround is functional but slightly fragile — the `startAfter` from `options` (line 148) would send `0` on the first batch. The custom `processingFunction` in QueueManagerPage correctly ignores this and uses `dustCursorRef.current` instead, so it works, but it's worth noting.

### What's Already Good
- Route is protected with `ProtectedRoute` + `requiredRole="admin"`
- Database function uses `SECURITY DEFINER` with safe `search_path`
- `statement_timeout` of 120s per batch is appropriate
- CORS headers are present
- The `onComplete` callback correctly resets the cursor ref
- Temp table uses `ON COMMIT DROP`

### Plan (3 file changes)

| File | Change |
|------|--------|
| `supabase/functions/recalculate-dust-scores/index.ts` | Add JWT verification + admin role check; clamp `batchSize` to 1–20000 |
| `src/hooks/use-batch-processor.ts` | Remove or gate `console.log` calls behind dev check |
| `src/pages/QueueManagerPage.tsx` | Remove or gate `console.log` calls behind dev check |




## Plan: Batch User Metrics Recalculation + Bug Fix

### Summary

Create a new edge function to batch-recalculate `user_metrics` for all users (Stage 2 of the pipeline), add its UI to the admin Queue Manager page, and fix the existing single-user metrics calculator bug.

### Pipeline Context

```text
Stage 1: Dust Scores (per game)        ✅ Complete (302K records)
Stage 2: User Metrics (per user)        ← Building batch tool now
Stage 3: Leaderboard Snapshot           ← Existing button (run after Stage 2)
```

### Changes

**1. New Edge Function: `supabase/functions/recalculate-all-user-metrics/index.ts`**

- Admin-only auth (same pattern as `recalculate-dust-scores`)
- Fetches distinct `user_id` values from `user_games` with cursor-based pagination (UUID ordering)
- Calls `calculate_user_metrics_with_clean_score` RPC for each user in the batch
- Accepts `batchSize` (default 50, max 200) and `startAfter` (UUID cursor)
- Returns `{ processedCount, lastProcessedId, complete, success }`
- Handles per-user errors gracefully (logs and continues)

**2. Update `src/pages/QueueManagerPage.tsx`**

- Add a new "Batch User Metrics Recalculation" card (teal/cyan gradient) between the Dust Score card and the existing Batch Processing Controls card
- Uses `useBatchProcessor` with a `useRef` cursor (same pattern as dust processor)
- Batch size slider: 10-200, step 10, default 50
- Includes BatchProcessingControls + ProcessingFooter

- **Fix bug** in `calculateUserMetrics` (line 237): pass `metricsUserId` in the request body so the edge function can process a specific user instead of always the logged-in admin

**3. Update `supabase/functions/calculate-user-metrics/index.ts`**

- Read optional `target_user_id` from request body
- If provided and caller is admin, use `target_user_id` instead of the authenticated user's ID
- Add admin check via `is_admin` RPC when `target_user_id` is specified

### Execution After Implementation

1. Run "Batch Recalculate User Metrics" (new tool) — processes all users
2. Click "Trigger Leaderboard Calculation" (existing button)


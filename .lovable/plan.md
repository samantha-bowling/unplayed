

## Batched Dust Score Recalculation — Admin Tool

### Problem
The `recalculate_all_dust_scores()` function times out on 302K records even with a 300s timeout, because `calculate_enhanced_dust_score()` is called per-row (returning JSONB) inside a single massive CTE + UPDATE.

### Solution
Create a new batched version that processes chunks by ID range, and add an admin UI card to the Queue Manager page using the existing `useBatchProcessor` hook and `BatchProcessingControls`/`ProcessingFooter` components.

### Technical Details

**1. New database function: `recalculate_dust_scores_batch`**
- Accepts `p_batch_size INTEGER DEFAULT 5000` and `p_start_after_id UUID DEFAULT NULL`
- Selects the next `p_batch_size` user_games rows (ordered by `id`, after `p_start_after_id`)
- Runs the CTE + UPDATE on just that batch
- Returns `updated_count`, `last_processed_id`, `complete` (true when fewer rows than batch size were found)
- Uses `SET statement_timeout TO '120s'`

**2. Update the edge function `recalculate-dust-scores/index.ts`**
- Accept `batchSize` and `startAfter` in the request body
- Call `recalculate_dust_scores_batch` RPC instead of the all-at-once function
- Return `{ processedCount, lastProcessedId, complete }` matching `BatchProcessResponse`

**3. Add admin UI card to `QueueManagerPage.tsx`**
- New "Dust Score Recalculation" card using `useBatchProcessor` wired to the edge function
- `BatchProcessingControls` for batch size slider (default 5000, max 20000)
- `ProcessingFooter` with process, continuous mode, and reset buttons
- Progress indicator showing total processed and completion status

This reuses all existing batch processing patterns already in the codebase (same hook, same UI components used by the Steam queue processor).

### Files Changed
| File | Change |
|------|--------|
| `supabase/migrations/new.sql` | Create `recalculate_dust_scores_batch()` function |
| `supabase/functions/recalculate-dust-scores/index.ts` | Accept batch params, call new RPC |
| `src/pages/QueueManagerPage.tsx` | Add Dust Score Recalculation card |


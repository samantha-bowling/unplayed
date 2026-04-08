

## Production Readiness Review: Admin Panel & Data Pipeline

### What's Been Completed (All Good)

| Area | Status | Notes |
|------|--------|-------|
| QueueManagerPage reorganization | Done | 3 sections, collapsible tools, "when to use" docs |
| AdminDashboardPage cleanup | Done | Live stats, collapsible utilities, no dead placeholders |
| Legacy page deletion | Done | AdminSteamDataPage, AdminDataManagerPage removed |
| Route consolidation | Done | Redirects for old paths, `/auth-debug` → `/admin/auth-debug` |
| Breadcrumb navigation | Done | All admin sub-pages have back-nav to dashboard |
| AuthDebugPage wrapped in AdminLayout | Done | Consistent spacing and layout |
| Batch dust score recalculation | Done | Edge function + DB RPC working |
| Batch user metrics recalculation | Done | Edge function working (538 users) |
| Leaderboard manual trigger | Done | Working, 38 eligible users processed |

### One Outstanding Issue: Database Trigger Still Uses Legacy Formula

The `before_user_game_insert_update` trigger on `user_games` calls `update_dust_score()`, which still uses `calculate_dust_score(acquisition_date, release_date, playtime_minutes)` -- the **old** formula based only on age and ownership.

New users importing their library right now get **incorrect dust scores**. Their user metrics will then aggregate these wrong scores.

**Fix**: Update the `update_dust_score()` trigger function via a migration to call `calculate_enhanced_dust_score` instead. This is a single SQL migration:

```sql
CREATE OR REPLACE FUNCTION public.update_dust_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'pg_temp', 'public'
AS $$
DECLARE
  game_record RECORD;
  score_breakdown JSONB;
BEGIN
  SELECT release_date, 
         COALESCE(price_cents, 0) as price_cents, 
         COALESCE(genres, '{}') as genres, 
         metacritic_score
  INTO game_record
  FROM public.games WHERE id = NEW.game_id;

  score_breakdown := calculate_enhanced_dust_score(
    game_record.release_date,
    NEW.playtime_minutes,
    game_record.price_cents,
    game_record.genres,
    game_record.metacritic_score
  );

  NEW.dust_score := (score_breakdown->>'totalScore')::INTEGER;
  RETURN NEW;
END;
$$;
```

### Minor Issue: MetadataConsistencyCard Not Wrapped in CollapsibleToolCard

In Section 3 of QueueManagerPage, the `MetadataConsistencyCard` is rendered bare (line 637) while the other two tools in the section use the `CollapsibleToolCard` wrapper. This is a visual inconsistency.

**Fix**: Wrap it in a `CollapsibleToolCard` with appropriate description and "when to use" info, or leave it as-is if its own card already has collapsible behavior internally.

### Implementation Plan

1. **Apply trigger migration** -- Update `update_dust_score()` to use `calculate_enhanced_dust_score` (single SQL migration, no code changes)
2. **Wrap MetadataConsistencyCard** in `CollapsibleToolCard` for visual consistency in QueueManagerPage Section 3

### Files Modified

| File | Change |
|------|--------|
| New migration SQL | Update `update_dust_score()` trigger function |
| `src/pages/QueueManagerPage.tsx` | Wrap MetadataConsistencyCard in CollapsibleToolCard |


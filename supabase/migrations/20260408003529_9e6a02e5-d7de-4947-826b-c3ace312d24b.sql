
CREATE OR REPLACE FUNCTION public.recalculate_dust_scores_batch(
  p_batch_size INTEGER DEFAULT 5000,
  p_start_after_id UUID DEFAULT NULL
)
RETURNS TABLE(updated_count INTEGER, last_processed_id UUID, complete BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_temp', 'public'
SET statement_timeout TO '120s'
AS $function$
DECLARE
  batch_updated INTEGER := 0;
  last_id UUID;
  batch_count INTEGER := 0;
BEGIN
  CREATE TEMP TABLE _batch_ids ON COMMIT DROP AS
  SELECT ug.id
  FROM public.user_games ug
  WHERE (p_start_after_id IS NULL OR ug.id > p_start_after_id)
  ORDER BY ug.id
  LIMIT p_batch_size;

  SELECT COUNT(*) INTO batch_count FROM _batch_ids;

  -- Get the last ID using ORDER BY instead of MAX
  SELECT bid.id INTO last_id
  FROM _batch_ids bid
  ORDER BY bid.id DESC
  LIMIT 1;

  -- Update dust scores for this batch
  WITH new_scores AS (
    SELECT 
      ug.id,
      calculate_enhanced_dust_score(
        g.release_date,
        ug.playtime_minutes,
        COALESCE(g.price_cents, 0),
        COALESCE(g.genres, '{}'),
        g.metacritic_score
      ) as breakdown
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.id IN (SELECT bid.id FROM _batch_ids bid)
  )
  UPDATE public.user_games ug
  SET 
    dust_score = (ns.breakdown->>'totalScore')::INTEGER,
    updated_at = NOW()
  FROM new_scores ns
  WHERE ug.id = ns.id;

  GET DIAGNOSTICS batch_updated = ROW_COUNT;

  RETURN QUERY SELECT 
    batch_updated,
    last_id,
    (batch_count < p_batch_size);
END;
$function$;


CREATE OR REPLACE FUNCTION public.recalculate_all_dust_scores()
 RETURNS TABLE(updated_count integer, total_count integer, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_temp', 'public'
AS $function$
DECLARE
  total_records INTEGER := 0;
  updated_records INTEGER := 0;
BEGIN
  -- Count total records
  SELECT COUNT(*) INTO total_records FROM public.user_games;

  -- Batch update all dust scores in a single statement using the enhanced calculation
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
  )
  UPDATE public.user_games ug
  SET 
    dust_score = (ns.breakdown->>'totalScore')::INTEGER,
    updated_at = NOW()
  FROM new_scores ns
  WHERE ug.id = ns.id;

  GET DIAGNOSTICS updated_records = ROW_COUNT;

  RETURN QUERY SELECT 
    updated_records as updated_count,
    total_records as total_count,
    format('Successfully updated %s out of %s dust scores using enhanced algorithm', updated_records, total_records) as message;
END;
$function$;

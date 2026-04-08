
-- Step 1: Clean corrupt price data in games table
UPDATE public.games SET price_cents = NULL WHERE price_cents > 50000;

-- Step 2: Rewrite upsert_user_spending_metrics to use get_clean_game_price
CREATE OR REPLACE FUNCTION public.upsert_user_spending_metrics(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_temp', 'public'
AS $function$
DECLARE
  result JSONB;
  v_total_games INTEGER := 0;
  v_unplayed_games INTEGER := 0;
  v_free_games INTEGER := 0;
  v_paid_games INTEGER := 0;
  v_games_with_price_data INTEGER := 0;
  v_games_missing_price_data INTEGER := 0;
  v_total_spent_cents INTEGER := 0;
  v_unplayed_spent_cents INTEGER := 0;
  v_total_original_cents INTEGER := 0;
  v_unplayed_original_cents INTEGER := 0;
  v_confidence_score DECIMAL(3,2);
BEGIN
  -- Calculate spending metrics using validated prices (same approach as calculate_user_spending_metrics)
  WITH game_stats AS (
    SELECT 
      ug.playtime_minutes,
      CASE 
        WHEN ug.playtime_minutes = 0 OR ug.playtime_minutes IS NULL THEN true
        ELSE false
      END as is_unplayed,
      get_clean_game_price(ug.game_id, g.price_cents) as price_info
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.user_id = p_user_id
  ),
  calculated_metrics AS (
    SELECT 
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE is_unplayed) as unplayed_count,
      COUNT(*) FILTER (WHERE (price_info->>'is_free')::boolean = true) as free_count,
      COUNT(*) FILTER (WHERE (price_info->>'final_price_cents') IS NOT NULL AND (price_info->>'is_free')::boolean = false) as paid_count,
      COUNT(*) FILTER (WHERE price_info->>'confidence' != 'low') as priced_count,
      COUNT(*) FILTER (WHERE price_info->>'confidence' = 'low') as unpriced_count,
      COALESCE(SUM((price_info->>'final_price_cents')::integer), 0) as total_spent,
      COALESCE(SUM((price_info->>'original_price_cents')::integer), 0) as total_original,
      COALESCE(SUM(
        CASE 
          WHEN is_unplayed THEN (price_info->>'final_price_cents')::integer 
          ELSE 0 
        END
      ), 0) as unplayed_spent,
      COALESCE(SUM(
        CASE 
          WHEN is_unplayed THEN (price_info->>'original_price_cents')::integer
          ELSE 0 
        END
      ), 0) as unplayed_original
    FROM game_stats
  )
  SELECT 
    total_count,
    unplayed_count,
    free_count,
    paid_count,
    priced_count,
    unpriced_count,
    total_spent,
    total_original,
    unplayed_spent,
    unplayed_original,
    CASE 
      WHEN total_count > 0 THEN ROUND((priced_count::numeric / total_count::numeric), 2)
      ELSE 0.00
    END
  INTO 
    v_total_games,
    v_unplayed_games,
    v_free_games,
    v_paid_games,
    v_games_with_price_data,
    v_games_missing_price_data,
    v_total_spent_cents,
    v_total_original_cents,
    v_unplayed_spent_cents,
    v_unplayed_original_cents,
    v_confidence_score
  FROM calculated_metrics;
  
  -- Upsert into the metrics table
  INSERT INTO public.user_spending_metrics (
    user_id,
    total_spent_cents,
    unplayed_spent_cents,
    total_saved_cents,
    unplayed_saved_cents,
    total_games,
    unplayed_games,
    free_games,
    paid_games,
    games_with_price_data,
    games_missing_price_data,
    confidence_score,
    last_calculated
  ) VALUES (
    p_user_id,
    v_total_spent_cents,
    v_unplayed_spent_cents,
    CASE 
      WHEN v_total_original_cents > v_total_spent_cents THEN v_total_original_cents - v_total_spent_cents
      ELSE NULL
    END,
    CASE 
      WHEN v_unplayed_original_cents > v_unplayed_spent_cents THEN v_unplayed_original_cents - v_unplayed_spent_cents
      ELSE NULL
    END,
    v_total_games,
    v_unplayed_games,
    v_free_games,
    v_paid_games,
    v_games_with_price_data,
    v_games_missing_price_data,
    v_confidence_score,
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_spent_cents = EXCLUDED.total_spent_cents,
    unplayed_spent_cents = EXCLUDED.unplayed_spent_cents,
    total_saved_cents = EXCLUDED.total_saved_cents,
    unplayed_saved_cents = EXCLUDED.unplayed_saved_cents,
    total_games = EXCLUDED.total_games,
    unplayed_games = EXCLUDED.unplayed_games,
    free_games = EXCLUDED.free_games,
    paid_games = EXCLUDED.paid_games,
    games_with_price_data = EXCLUDED.games_with_price_data,
    games_missing_price_data = EXCLUDED.games_missing_price_data,
    confidence_score = EXCLUDED.confidence_score,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = NOW();
  
  -- Build and return the result
  result := jsonb_build_object(
    'total_games', v_total_games,
    'unplayed_games', v_unplayed_games,
    'free_games', v_free_games,
    'paid_games', v_paid_games,
    'games_with_price_data', v_games_with_price_data,
    'games_missing_price_data', v_games_missing_price_data,
    'total_spent_cents', v_total_spent_cents,
    'unplayed_spent_cents', v_unplayed_spent_cents,
    'total_saved_cents', CASE 
      WHEN v_total_original_cents > v_total_spent_cents THEN v_total_original_cents - v_total_spent_cents
      ELSE NULL
    END,
    'unplayed_saved_cents', CASE 
      WHEN v_unplayed_original_cents > v_unplayed_spent_cents THEN v_unplayed_original_cents - v_unplayed_spent_cents
      ELSE NULL
    END,
    'total_spent_dollars', ROUND(v_total_spent_cents::numeric / 100, 2),
    'unplayed_spent_dollars', ROUND(v_unplayed_spent_cents::numeric / 100, 2),
    'confidence_score', v_confidence_score,
    'currency', 'USD'
  );
  
  RETURN result;
END;
$function$;


CREATE OR REPLACE FUNCTION public.get_clean_game_price(p_game_id bigint, p_fallback_price_cents integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_temp', 'public'
AS $function$
DECLARE
  v_final_price_cents integer;
  v_initial_price_cents integer;
  v_currency text;
  v_last_checked timestamp with time zone;
  final_price integer;
  original_price integer;
  is_free boolean := false;
  confidence text := 'low';
  source text := 'unknown';
BEGIN
  -- First try to get price from game_prices table (most recent and accurate)
  SELECT 
    gp.final_price_cents,
    gp.initial_price_cents,
    gp.currency,
    gp.last_checked
  INTO
    v_final_price_cents,
    v_initial_price_cents,
    v_currency,
    v_last_checked
  FROM public.game_prices gp
  WHERE gp.app_id = p_game_id
  ORDER BY gp.last_checked DESC
  LIMIT 1;
  
  IF FOUND THEN
    final_price := validate_and_clean_game_price(v_final_price_cents);
    original_price := validate_and_clean_game_price(v_initial_price_cents);
    source := 'game_prices';
    confidence := 'high';
  ELSE
    -- Fallback to games table price
    final_price := validate_and_clean_game_price(p_fallback_price_cents);
    original_price := final_price;
    source := 'games_table';
    confidence := 'medium';
  END IF;
  
  -- Determine if game is free
  is_free := (final_price = 0);
  
  -- If we have no valid price data, mark as unknown
  IF final_price IS NULL THEN
    confidence := 'low';
    source := 'unknown';
  END IF;
  
  RETURN jsonb_build_object(
    'final_price_cents', final_price,
    'original_price_cents', original_price,
    'is_free', is_free,
    'confidence', confidence,
    'source', source,
    'currency', COALESCE(v_currency, 'USD')
  );
END;
$function$;

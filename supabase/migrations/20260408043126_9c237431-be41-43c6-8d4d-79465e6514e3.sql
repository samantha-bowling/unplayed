
CREATE OR REPLACE FUNCTION public.refresh_user_dust_breakdowns(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_temp', 'public'
SET statement_timeout TO '120s'
AS $function$
DECLARE
  updated_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  -- Delete breakdowns for games no longer in user's library
  DELETE FROM public.game_dust_breakdowns gdb
  WHERE gdb.user_id = p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.user_games ug
      WHERE ug.user_id = p_user_id AND ug.game_id = gdb.game_id
    );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Upsert all current game breakdowns
  WITH calculated AS (
    SELECT
      ug.game_id,
      g.name AS game_name,
      ug.playtime_minutes,
      g.release_date,
      g.header_image,
      g.image_url,
      calculate_enhanced_dust_score(
        g.release_date,
        COALESCE(ug.playtime_minutes, 0),
        COALESCE(g.price_cents, 0),
        COALESCE(g.genres, '{}'),
        g.metacritic_score
      ) AS breakdown
    FROM public.user_games ug
    JOIN public.games g ON g.id = ug.game_id
    WHERE ug.user_id = p_user_id
  )
  INSERT INTO public.game_dust_breakdowns (
    user_id, game_id, game_name, current_dust_score,
    age_score, quality_score, price_score, genre_score,
    playtime_factor, ownership_score,
    playtime_minutes, release_date, header_image, image_url,
    last_calculated
  )
  SELECT
    p_user_id,
    c.game_id,
    c.game_name,
    (c.breakdown->>'totalScore')::INTEGER,
    (c.breakdown->>'ageScore')::INTEGER,
    (c.breakdown->>'qualityScore')::INTEGER,
    (c.breakdown->>'priceScore')::INTEGER,
    (c.breakdown->>'genreScore')::INTEGER,
    (c.breakdown->>'playtimeFactor')::NUMERIC,
    0, -- ownership_score not in enhanced formula
    COALESCE(c.playtime_minutes, 0),
    c.release_date,
    c.header_image,
    c.image_url,
    NOW()
  FROM calculated c
  ON CONFLICT (user_id, game_id)
  DO UPDATE SET
    game_name = EXCLUDED.game_name,
    current_dust_score = EXCLUDED.current_dust_score,
    age_score = EXCLUDED.age_score,
    quality_score = EXCLUDED.quality_score,
    price_score = EXCLUDED.price_score,
    genre_score = EXCLUDED.genre_score,
    playtime_factor = EXCLUDED.playtime_factor,
    playtime_minutes = EXCLUDED.playtime_minutes,
    release_date = EXCLUDED.release_date,
    header_image = EXCLUDED.header_image,
    image_url = EXCLUDED.image_url,
    last_calculated = NOW();

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'updated_count', updated_count,
    'deleted_count', deleted_count
  );
END;
$function$;

-- Add unique constraint needed for the UPSERT if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'game_dust_breakdowns_user_id_game_id_key'
  ) THEN
    ALTER TABLE public.game_dust_breakdowns
    ADD CONSTRAINT game_dust_breakdowns_user_id_game_id_key
    UNIQUE (user_id, game_id);
  END IF;
END $$;

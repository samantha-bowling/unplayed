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
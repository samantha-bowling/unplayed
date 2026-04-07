CREATE OR REPLACE FUNCTION public.calculate_enhanced_dust_score(release_date date, playtime_minutes integer, price_cents integer DEFAULT 0, genres text[] DEFAULT '{}'::text[], metacritic_score integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_temp', 'public'
AS $function$
DECLARE
  age_score INTEGER;
  quality_score INTEGER;
  price_score INTEGER;
  genre_score INTEGER;
  playtime_factor DECIMAL;
  total_score INTEGER;
BEGIN
  -- 1. Age Score (based on release date)
  age_score := CASE
    WHEN release_date IS NULL THEN 15
    WHEN release_date < NOW() - INTERVAL '15 years' THEN 30
    WHEN release_date < NOW() - INTERVAL '10 years' THEN 25
    WHEN release_date < NOW() - INTERVAL '5 years' THEN 20
    WHEN release_date < NOW() - INTERVAL '2 years' THEN 15
    WHEN release_date < NOW() - INTERVAL '1 year' THEN 10
    ELSE 5
  END;

  -- 2. Quality Score (CORRECTED: high quality = high dust when unplayed)
  -- Excellent unplayed games are more shameful = higher dust
  quality_score := CASE
    WHEN metacritic_score IS NULL THEN 10
    WHEN metacritic_score >= 90 THEN 20
    WHEN metacritic_score >= 80 THEN 17
    WHEN metacritic_score >= 70 THEN 14
    WHEN metacritic_score >= 60 THEN 10
    ELSE 6
  END;

  -- 3. Price Score (higher price = higher dust potential)
  price_score := CASE
    WHEN price_cents >= 6000 THEN 15
    WHEN price_cents >= 4000 THEN 12
    WHEN price_cents >= 2000 THEN 10
    WHEN price_cents >= 1000 THEN 8
    WHEN price_cents > 0 THEN 5
    ELSE 2
  END;

  -- 4. Genre Score (some genres accumulate dust faster)
  genre_score := CASE
    WHEN EXISTS (
      SELECT 1 FROM unnest(genres) AS genre 
      WHERE genre ILIKE ANY(ARRAY['%Strategy%', '%Simulation%', '%RPG%', '%Turn-Based Strategy%', '%Grand Strategy%'])
    ) THEN 10
    WHEN EXISTS (
      SELECT 1 FROM unnest(genres) AS genre 
      WHERE genre ILIKE ANY(ARRAY['%Action%', '%Arcade%', '%Racing%', '%Sports%', '%Fighting%'])
    ) THEN 5
    ELSE 7
  END;

  -- 5. Playtime Factor
  playtime_factor := CASE
    WHEN playtime_minutes IS NULL OR playtime_minutes = 0 THEN 1.0
    WHEN playtime_minutes < 30 THEN 0.9
    WHEN playtime_minutes < 120 THEN 0.6
    WHEN playtime_minutes < 360 THEN 0.3
    ELSE 0.1
  END;

  -- Calculate total dust score
  total_score := GREATEST(1, LEAST(100, FLOOR((age_score + quality_score + price_score + genre_score) * playtime_factor)));

  RETURN jsonb_build_object(
    'qualityScore', quality_score,
    'priceScore', price_score,
    'ageScore', age_score,
    'genreScore', genre_score,
    'playtimeFactor', playtime_factor,
    'totalScore', total_score
  );
END;
$function$;
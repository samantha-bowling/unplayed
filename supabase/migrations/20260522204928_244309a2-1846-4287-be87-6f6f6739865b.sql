-- Drop public-facing policy
DROP POLICY IF EXISTS "Allow public read for public profiles" ON public.user_metrics;

-- Owner policies remain in place ("Users can view their own metrics", "Users can update their own metrics")

-- Create gated RPC for visitor access (safe fields only, no financial data, no game counts)
CREATE OR REPLACE FUNCTION public.get_public_user_metrics(p_user_id uuid)
RETURNS TABLE (
  clean_score integer,
  clean_score_tier text,
  clean_streak integer,
  total_playtime_hours numeric,
  recently_played_count integer,
  average_dust_score numeric,
  total_dust_score integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'pg_temp', 'public'
AS $$
BEGIN
  IF NOT public.is_profile_public(p_user_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    um.clean_score,
    um.clean_score_tier,
    um.clean_streak,
    um.total_playtime_hours,
    um.recently_played_count,
    um.average_dust_score,
    um.total_dust_score
  FROM public.user_metrics um
  WHERE um.user_id = p_user_id
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_user_metrics(uuid) TO anon, authenticated;
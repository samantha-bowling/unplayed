-- Drop public-facing policy
DROP POLICY IF EXISTS "Allow public read for public profiles" ON public.game_dust_breakdowns;

-- Owner policies remain in place ("Users can view their own game breakdowns", "Users can update their own game breakdowns")

-- Create gated RPC for visitor access (single dustiest game only)
CREATE OR REPLACE FUNCTION public.get_public_dustiest_game(p_user_id uuid)
RETURNS TABLE (
  game_name text,
  current_dust_score integer,
  header_image text
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
    gdb.game_name,
    gdb.current_dust_score,
    gdb.header_image
  FROM public.game_dust_breakdowns gdb
  WHERE gdb.user_id = p_user_id
  ORDER BY gdb.current_dust_score DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_dustiest_game(uuid) TO anon, authenticated;
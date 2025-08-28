-- Fix remaining functions without secure search paths

-- Fix remaining functions identified by security linter
ALTER FUNCTION public.update_updated_at_column() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.update_leaderboard_dust_rankings(timestamp with time zone) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.recalculate_all_dust_scores() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.mark_onboarding_complete() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.get_total_game_count() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.is_current_user_admin() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.update_dust_score() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.update_game_estimates_timestamp() 
SET search_path = pg_temp, public;

ALTER FUNCTION public.update_leaderboard_clean_rankings(timestamp with time zone) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.increment(integer) 
SET search_path = pg_temp, public;
-- Phase 2: Database Hardening - Fix search paths for all functions
-- Fix search path for all identified functions to prevent schema injection attacks

-- Update all critical functions with secure search path
ALTER FUNCTION public.calculate_user_metrics_with_clean_score(uuid) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.calculate_enhanced_dust_score(date, integer, integer, text[], integer) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.upsert_user_spending_metrics(uuid) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.calculate_dust_score(timestamp with time zone, date, integer) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.get_clean_game_price(bigint, integer) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.get_user_library_stats(uuid) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.get_dust_score_breakdown(bigint, timestamp with time zone, date, integer) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.get_user_game_dust_breakdown(uuid) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.calculate_user_spending_metrics(uuid) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.can_user_refresh_prices(uuid) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.get_stale_prices_for_refresh(integer) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.track_user_price_request(integer[]) 
SET search_path = pg_temp, public;

ALTER FUNCTION public.validate_and_clean_game_price(integer) 
SET search_path = pg_temp, public;

-- Revoke schema creation privileges from public to prevent injection
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create security events logging table for monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id bigserial PRIMARY KEY,
  happened_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  event_type text NOT NULL,
  target text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on security events table
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can insert security events
CREATE POLICY "Service role can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);
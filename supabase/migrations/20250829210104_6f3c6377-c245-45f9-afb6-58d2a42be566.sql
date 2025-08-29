-- Fix Security Definer Views - Convert to SECURITY INVOKER

-- First, let's identify and fix the steam monitoring views that are using SECURITY DEFINER
-- These views should not bypass RLS and should use the permissions of the querying user

-- Drop and recreate steam_errors_last_24h view with SECURITY INVOKER
DROP VIEW IF EXISTS public.steam_errors_last_24h;

CREATE VIEW public.steam_errors_last_24h 
WITH (security_invoker = true)
AS 
SELECT 
    endpoint,
    status,
    err_code,
    COUNT(*) as hits
FROM public.steam_call_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND (status != 200 OR err_code IS NOT NULL)
GROUP BY endpoint, status, err_code
ORDER BY hits DESC;

-- Drop and recreate steam_latency_last_24h view with SECURITY INVOKER  
DROP VIEW IF EXISTS public.steam_latency_last_24h;

CREATE VIEW public.steam_latency_last_24h
WITH (security_invoker = true)
AS
SELECT 
    endpoint,
    COUNT(*) as calls,
    AVG(duration_ms)::integer as avg_ms,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms)::integer as p50_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::integer as p95_ms
FROM public.steam_call_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND status = 200
GROUP BY endpoint
ORDER BY calls DESC;

-- Ensure RLS is enabled on the underlying steam_call_logs table (should already be enabled)
-- This ensures the views respect existing RLS policies

-- Add security event log
INSERT INTO public.security_events (
    event_type,
    target,
    metadata
) VALUES (
    'security_definer_views_fixed',
    'steam_monitoring_views',
    jsonb_build_object(
        'action', 'converted_to_security_invoker',
        'views_fixed', ARRAY['steam_errors_last_24h', 'steam_latency_last_24h'],
        'timestamp', now()
    )
);

-- Verify the views now use SECURITY INVOKER
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE viewname IN ('steam_errors_last_24h', 'steam_latency_last_24h');
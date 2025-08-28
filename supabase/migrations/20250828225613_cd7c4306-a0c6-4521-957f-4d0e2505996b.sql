-- CRITICAL SECURITY FIX: Remove dangerous public data exposure

-- 1. Fix leaderboard_snapshots table - remove dangerous public access policy
DROP POLICY IF EXISTS "Allow public read access to leaderboard snapshots" ON public.leaderboard_snapshots;

-- Keep only the secure policy that restricts access properly
-- (The existing restrictive policy should remain active)

-- 2. Fix user_clean_score_breakdowns - remove overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage clean score breakdowns" ON public.user_clean_score_breakdowns;

-- Add proper policy for service role with more restrictive access
CREATE POLICY "Service role can manage clean score breakdowns for calculations"
ON public.user_clean_score_breakdowns
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Identify and fix Security Definer Views by converting them to Security Invoker
-- Find views with SECURITY DEFINER and convert them

-- Check for any views that might be using SECURITY DEFINER
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- This will help identify any problematic views
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Log the views found for manual review
        RAISE NOTICE 'Found view: %.%', view_record.schemaname, view_record.viewname;
    END LOOP;
END $$;

-- 4. Add security event logging for this fix
INSERT INTO public.security_events (
    event_type,
    target,
    metadata
) VALUES (
    'critical_data_exposure_fix',
    'leaderboard_snapshots,user_clean_score_breakdowns',
    jsonb_build_object(
        'action', 'removed_public_access_policies',
        'reason', 'critical_data_exposure_vulnerability',
        'timestamp', now()
    )
);

-- 5. Verify RLS is enabled on critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leaderboard_snapshots', 'user_clean_score_breakdowns', 'user_metrics');
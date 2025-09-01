-- Fix user profile RLS policy to restrict access properly
-- Remove the overly permissive policy that allows all authenticated users to view all profiles

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;

-- Create a more restrictive policy that allows:
-- 1. Users to view their own profile
-- 2. Public visibility for users who opted into leaderboard with public visibility
CREATE POLICY "Users can view own profile or public leaderboard profiles" 
ON public.users 
FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  (leaderboard_visibility = 'public' AND auth.uid() IS NOT NULL)
);

-- Log security improvement
INSERT INTO public.security_events (
  event_type,
  target,
  metadata
) VALUES (
  'rls_policy_hardened',
  'users_table_select_policy',
  jsonb_build_object(
    'action', 'removed_overly_permissive_policy',
    'new_policy', 'restricted_to_self_and_public_leaderboard',
    'timestamp', now()
  )
);
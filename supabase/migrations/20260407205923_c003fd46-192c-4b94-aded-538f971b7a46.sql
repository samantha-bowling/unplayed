-- Fix 1: Restrict users table INSERT to service_role only (prevents anonymous pre-creation)
DROP POLICY IF EXISTS "Allow service role to create users" ON public.users;

CREATE POLICY "Allow service role to create users"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can create own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Fix 2: Restrict security_events INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert security events" ON public.security_events;

CREATE POLICY "Service role can insert security events"
  ON public.security_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Fix 3: Remove overly permissive cross-user SELECT on users table
-- Public profile access should go through v_public_profiles view
DROP POLICY IF EXISTS "Users can view own profile or public profiles" ON public.users;
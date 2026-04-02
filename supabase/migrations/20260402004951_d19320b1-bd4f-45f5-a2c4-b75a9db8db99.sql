-- Fix 1: Donors table - broken admin policy
DROP POLICY IF EXISTS "Allow admin to manage all donors" ON public.donors;

CREATE POLICY "Allow admin to manage all donors"
  ON public.donors
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fix 2: Leaderboard calculation locks - restrict to service_role
DROP POLICY IF EXISTS "Service role can manage calculation locks" ON public.leaderboard_calculation_locks;

CREATE POLICY "Service role can manage calculation locks"
  ON public.leaderboard_calculation_locks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
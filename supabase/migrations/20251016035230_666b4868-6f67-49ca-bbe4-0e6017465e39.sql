-- Step 1: Create security definer function to check if profile is public
-- This prevents recursive RLS issues by running with elevated privileges
CREATE OR REPLACE FUNCTION public.is_profile_public(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = check_user_id
    AND profile_visibility = 'public'
  )
$$;

-- Step 2: Add public read policies to stats tables using the security definer function

-- Allow public read on user_metrics for public profiles
CREATE POLICY "Allow public read for public profiles"
ON public.user_metrics
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_profile_public(user_id)
);

-- Allow public read on user_genre_stats for public profiles
CREATE POLICY "Allow public read for public profiles"
ON public.user_genre_stats
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_profile_public(user_id)
);

-- Allow public read on game_dust_breakdowns for public profiles
CREATE POLICY "Allow public read for public profiles"
ON public.game_dust_breakdowns
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_profile_public(user_id)
);

-- Allow public read on user_games for public profiles
CREATE POLICY "Allow public read for public profiles"
ON public.user_games
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_profile_public(user_id)
);

-- Step 3: Fix leaderboard_snapshots to prevent recursive RLS
-- Drop the existing recursive policy
DROP POLICY IF EXISTS "Users can read own snapshots or public/anonymous snapshots"
  ON public.leaderboard_snapshots;

-- Create new policy using the security definer function
CREATE POLICY "Allow read for public profiles or anonymous entries"
ON public.leaderboard_snapshots
FOR SELECT
USING (
  auth.uid() = user_id
  OR is_anonymous = true
  OR public.is_profile_public(user_id)
);
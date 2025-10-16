-- Step 1: Create read-only view for public profiles
-- Only exposes safe, whitelisted columns
CREATE OR REPLACE VIEW public.v_public_profiles AS
SELECT
  id,
  steam_name,
  steam_avatar,
  steam_id,
  profile_username,
  profile_tagline,
  profile_theme,
  profile_main_stat,
  profile_badge_1,
  profile_badge_2,
  profile_badge_3,
  background_animation_pack,
  show_mint_glow,
  profile_visibility,
  leaderboard_visibility,
  created_at
FROM public.users
WHERE profile_visibility = 'public';

-- Grant SELECT access to authenticated and anon users
GRANT SELECT ON public.v_public_profiles TO authenticated, anon;

-- Step 2: Drop old RLS policies that check leaderboard_visibility for profile access
DROP POLICY IF EXISTS "Public users can view public profile fields with customization" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile or public leaderboard profiles" ON public.users;

-- Step 3: Create new RLS policy aligned with profile_visibility
CREATE POLICY "Users can view own profile or public profiles"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR profile_visibility = 'public'
);
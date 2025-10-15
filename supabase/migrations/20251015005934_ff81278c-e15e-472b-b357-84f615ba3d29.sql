-- Add profile customization columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_theme text NOT NULL DEFAULT 'dust_tier',
ADD COLUMN IF NOT EXISTS profile_tagline varchar(50),
ADD COLUMN IF NOT EXISTS profile_badge_1 text NOT NULL DEFAULT 'total_games',
ADD COLUMN IF NOT EXISTS profile_badge_2 text NOT NULL DEFAULT 'total_playtime';

-- Add index on profile_theme for potential analytics
CREATE INDEX IF NOT EXISTS idx_users_profile_theme ON public.users(profile_theme);

-- Add index on leaderboard_visibility for efficient public profile queries
CREATE INDEX IF NOT EXISTS idx_users_leaderboard_visibility ON public.users(leaderboard_visibility);

-- Update RLS policy to allow reading profile customization fields for public profiles
-- This extends the existing policy to include the new fields
CREATE POLICY "Public users can view public profile fields with customization"
  ON public.users
  FOR SELECT
  USING (
    leaderboard_visibility = 'public' 
    AND auth.uid() IS NOT NULL
  );

-- Ensure users can update their own profile customization
-- This should already be covered by existing policies, but making it explicit
CREATE POLICY "Users can update own profile customization"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
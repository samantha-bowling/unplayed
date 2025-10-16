-- Add profile_visibility column to users table with explicit constraint
ALTER TABLE public.users 
ADD COLUMN profile_visibility text NOT NULL DEFAULT 'public'
CONSTRAINT chk_profile_visibility CHECK (profile_visibility IN ('public', 'private'));

-- Add index for performance on profile visibility queries
CREATE INDEX idx_users_profile_visibility ON public.users(profile_visibility);

-- Add descriptive comment
COMMENT ON COLUMN public.users.profile_visibility IS 
  'Controls profile page visibility (independent of leaderboard_visibility). Options: public (anyone can view profile page), private (only owner can view profile page). Does not affect leaderboard appearance.';
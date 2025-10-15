-- Add username change tracking for 30-day cooldown
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_username_change TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.users.last_username_change IS 
'Tracks when the user last changed their profile_username for 30-day cooldown enforcement';

-- Create index for faster case-insensitive lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_username_lower 
ON public.users (LOWER(profile_username));
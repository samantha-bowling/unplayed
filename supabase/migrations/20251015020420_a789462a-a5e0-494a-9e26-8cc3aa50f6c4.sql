-- Phase 1: Add profile enhancement columns
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_badge_3 text NOT NULL DEFAULT 'clean_score',
ADD COLUMN IF NOT EXISTS profile_username text UNIQUE,
ADD COLUMN IF NOT EXISTS show_mint_glow boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS background_animation_pack text NOT NULL DEFAULT 'gaming';

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_users_profile_username 
ON public.users(profile_username) 
WHERE profile_username IS NOT NULL;

-- Add constraint for username format (3-20 chars, lowercase alphanumeric + underscores)
ALTER TABLE public.users 
ADD CONSTRAINT profile_username_format 
CHECK (profile_username IS NULL OR profile_username ~ '^[a-z0-9_]{3,20}$');

-- Update RLS policies to include new profile fields in public queries
-- The existing policies should automatically cover the new columns
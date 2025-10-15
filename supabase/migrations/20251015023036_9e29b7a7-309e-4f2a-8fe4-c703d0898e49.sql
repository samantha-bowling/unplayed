-- Add main stat selector column
ALTER TABLE public.users 
ADD COLUMN profile_main_stat text NOT NULL DEFAULT 'dust_score';

-- Make additional badge columns nullable (users can choose 0-3 additional stats)
ALTER TABLE public.users
ALTER COLUMN profile_badge_1 DROP NOT NULL,
ALTER COLUMN profile_badge_2 DROP NOT NULL,
ALTER COLUMN profile_badge_3 DROP NOT NULL;

-- Update defaults to NULL
ALTER TABLE public.users
ALTER COLUMN profile_badge_1 SET DEFAULT NULL,
ALTER COLUMN profile_badge_2 SET DEFAULT NULL,
ALTER COLUMN profile_badge_3 SET DEFAULT NULL;

COMMENT ON COLUMN public.users.profile_main_stat IS 'User-selected main/featured stat displayed prominently on profile';
COMMENT ON COLUMN public.users.profile_badge_1 IS 'First additional stat (optional, 0-3 total)';
COMMENT ON COLUMN public.users.profile_badge_2 IS 'Second additional stat (optional, 0-3 total)';
COMMENT ON COLUMN public.users.profile_badge_3 IS 'Third additional stat (optional, 0-3 total)';
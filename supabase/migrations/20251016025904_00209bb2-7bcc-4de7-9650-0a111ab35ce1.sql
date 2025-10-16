-- Add user consent column for showing library value on public leaderboards
-- This addresses privacy concerns about financial data exposure

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS show_library_value_on_leaderboard boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.show_library_value_on_leaderboard IS 
'User consent to display library_value_cents on public leaderboard profiles';

-- Update leaderboard snapshot insertion to respect this setting
-- Note: The leaderboard calculation function will need to be updated to use this column
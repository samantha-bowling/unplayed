
-- Add columns to track leaderboard opt-in flow
ALTER TABLE public.users 
ADD COLUMN leaderboard_prompt_shown BOOLEAN DEFAULT FALSE,
ADD COLUMN leaderboard_opted_out_explicitly BOOLEAN DEFAULT FALSE;

-- Update existing users who have visibility set to 'off' to mark them as explicitly opted out
UPDATE public.users 
SET leaderboard_opted_out_explicitly = TRUE 
WHERE leaderboard_visibility = 'off';

-- Update existing users who have visibility set to something other than 'off' to mark prompt as shown
UPDATE public.users 
SET leaderboard_prompt_shown = TRUE 
WHERE leaderboard_visibility != 'off';

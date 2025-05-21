
-- Add indexes for commonly queried fields to improve performance

-- Add index to user_games.game_id for faster joins
CREATE INDEX IF NOT EXISTS idx_user_games_game_id 
ON public.user_games (game_id);

-- Add index to user_games.user_id for faster queries by user
CREATE INDEX IF NOT EXISTS idx_user_games_user_id 
ON public.user_games (user_id);

-- Add index to user_games.playtime_minutes for filtering unplayed games
CREATE INDEX IF NOT EXISTS idx_user_games_playtime 
ON public.user_games (playtime_minutes);

-- Add index to user_games.dust_score for sorting
CREATE INDEX IF NOT EXISTS idx_user_games_dust_score 
ON public.user_games (dust_score);

-- Add index to user_games.hidden for filtering
CREATE INDEX IF NOT EXISTS idx_user_games_hidden 
ON public.user_games (hidden);

-- Add index to user_games.acquisition_date for sorting
CREATE INDEX IF NOT EXISTS idx_user_games_acquisition_date 
ON public.user_games (acquisition_date);

-- Add index to user_games.last_played_date for sorting
CREATE INDEX IF NOT EXISTS idx_user_games_last_played_date 
ON public.user_games (last_played_date);

-- Add index to games.name for text search operations
CREATE INDEX IF NOT EXISTS idx_games_name 
ON public.games (name);

-- Add GIN index on games.genres array for faster genre filtering
CREATE INDEX IF NOT EXISTS idx_games_genres 
ON public.games USING GIN (genres);

-- Add GIN index on games.categories array for faster category filtering
CREATE INDEX IF NOT EXISTS idx_games_categories 
ON public.games USING GIN (categories);

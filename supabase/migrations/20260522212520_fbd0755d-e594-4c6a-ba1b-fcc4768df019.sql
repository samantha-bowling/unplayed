-- Backfill missing performance indexes from the orphan add-performance-indexes.sql file.
-- The other 5 indexes from that file already exist in the database.
CREATE INDEX IF NOT EXISTS idx_user_games_playtime
  ON public.user_games (playtime_minutes);

CREATE INDEX IF NOT EXISTS idx_user_games_hidden
  ON public.user_games (hidden);

CREATE INDEX IF NOT EXISTS idx_user_games_acquisition_date
  ON public.user_games (acquisition_date);

CREATE INDEX IF NOT EXISTS idx_user_games_last_played_date
  ON public.user_games (last_played_date);

CREATE INDEX IF NOT EXISTS idx_games_name
  ON public.games (name);
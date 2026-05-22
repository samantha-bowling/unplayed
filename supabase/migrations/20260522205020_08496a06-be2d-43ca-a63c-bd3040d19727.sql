-- Finding 3: scrub existing leaderboard snapshots
UPDATE public.leaderboard_snapshots
SET library_value_cents = NULL
WHERE user_id NOT IN (
  SELECT id FROM public.users WHERE show_library_value_on_leaderboard = true
);

UPDATE public.leaderboard_snapshots
SET total_games = 0,
    played_games = 0,
    unplayed_games = 0;

-- Finding 4: drop authenticated INSERT policy on games (only service role inserts)
DROP POLICY IF EXISTS "Authenticated users can insert games" ON public.games;
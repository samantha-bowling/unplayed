
-- Add unique constraint to prevent duplicate leaderboard entries for the same user on the same day
ALTER TABLE public.leaderboard_snapshots 
ADD CONSTRAINT unique_user_snapshot_date 
UNIQUE (user_id, snapshot_date);

-- Clean up existing duplicates by keeping only the most recent entry per user per day
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, DATE(snapshot_date) 
           ORDER BY snapshot_date DESC
         ) as rn
  FROM public.leaderboard_snapshots
)
DELETE FROM public.leaderboard_snapshots 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

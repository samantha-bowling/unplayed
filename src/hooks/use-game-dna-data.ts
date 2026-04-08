
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface GameDNAExtraData {
  spending: {
    total_spent_cents: number;
    free_games: number;
    paid_games: number;
    total_games: number;
  } | null;
  ageData: {
    avgYearsOld: number;
    vintagePct: number;
  };
}

export const useGameDNAData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['game-dna-extra', user?.id],
    queryFn: async (): Promise<GameDNAExtraData> => {
      if (!user) return { spending: null, ageData: { avgYearsOld: 0, vintagePct: 0 } };

      // Fetch spending and game ages in parallel
      const [spendingResult, ageResult] = await Promise.all([
        supabase
          .from('user_spending_metrics')
          .select('total_spent_cents, free_games, paid_games, total_games')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('user_games')
          .select('game_id, games!user_games_game_id_fkey(release_date)')
          .eq('user_id', user.id),
      ]);

      const spending = spendingResult.data ?? null;

      // Calculate age data from games with release dates
      const now = new Date();
      let totalAge = 0;
      let countWithDate = 0;
      let vintageCount = 0;

      if (ageResult.data) {
        for (const ug of ageResult.data) {
          const game = ug.games as unknown as { release_date: string | null };
          if (game?.release_date) {
            const releaseYear = new Date(game.release_date).getFullYear();
            const age = now.getFullYear() - releaseYear;
            totalAge += age;
            countWithDate++;
            if (age >= 11) vintageCount++;
          }
        }
      }

      const totalGames = ageResult.data?.length || 1;

      return {
        spending,
        ageData: {
          avgYearsOld: countWithDate > 0 ? totalAge / countWithDate : 0,
          vintagePct: (vintageCount / totalGames) * 100,
        },
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
};

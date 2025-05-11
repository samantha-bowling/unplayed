import { useMemo } from 'react';
import { GamePick } from '@/types/picks.types';

interface PreviouslyPickedInfo {
  isPreviouslyPicked: boolean;
  lastPickedAt: string | null;
  timesPickedCount: number;
}

/**
 * Hook that provides information about previously picked games
 * @param picks Game pick history from useGamePicks
 * @param gameId ID of game to check
 * @returns Object with pick information
 */
export const usePreviouslyPicked = (picks: GamePick[] | undefined, gameId: number): PreviouslyPickedInfo => {
  return useMemo(() => {
    if (!picks || picks.length === 0 || !gameId) {
      return {
        isPreviouslyPicked: false,
        lastPickedAt: null,
        timesPickedCount: 0
      };
    }

    // Filter picks for this specific game
    const gamePicks = picks.filter(pick => pick.game_id === gameId);
    
    // If no picks found for this game, return default values
    if (gamePicks.length === 0) {
      return {
        isPreviouslyPicked: false,
        lastPickedAt: null,
        timesPickedCount: 0
      };
    }

    // Get the most recent pick
    const mostRecentPick = gamePicks.sort(
      (a, b) => new Date(b.picked_at).getTime() - new Date(a.picked_at).getTime()
    )[0];

    return {
      isPreviouslyPicked: true,
      lastPickedAt: mostRecentPick.picked_at,
      timesPickedCount: gamePicks.length
    };
  }, [picks, gameId]);
};

export default usePreviouslyPicked;


import { useState, useMemo } from 'react';
import useUnplayedData from '@/hooks/use-unplayed-data';
import useGamePicks from '@/hooks/use-game-picks';
import { GameListItem } from '@/types/unplayed-data.types';
import { filterGamesByMood, filterOutRecentPicks } from '@/utils/game-mapping';
import { useAuth } from '@/context/AuthContext';

type PickerScope = 'unplayed' | 'all';

/**
 * Hook to provide filtered game data for the picker
 */
export const usePickerData = () => {
  const { data: unplayedData, isLoading: isLoadingLibrary } = useUnplayedData();
  const { picks, isLoadingPicks, savePick } = useGamePicks();
  const { user } = useAuth();
  const [scope, setScope] = useState<PickerScope>('unplayed');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  
  // Get recent pick IDs for duplicate prevention
  const recentPickIds = useMemo(() => {
    if (!picks) return [];
    return picks.map(pick => pick.game_id);
  }, [picks]);
  
  // Filter games based on selected criteria
  const filteredGames = useMemo(() => {
    if (!unplayedData || !unplayedData.gamesList) return [];
    
    // First filter by scope (unplayed vs all)
    let gamePool = unplayedData.gamesList;
    if (scope === 'unplayed') {
      gamePool = gamePool.filter(game => game.playtimeMinutes === 0);
    }
    
    // Then filter by mood if selected
    let moodFiltered = gamePool;
    if (activeMood) {
      moodFiltered = filterGamesByMood(moodFiltered, activeMood);
    }
    
    // Finally, filter out recent picks if enabled
    if (preventDuplicates && user) {
      return filterOutRecentPicks(moodFiltered, recentPickIds);
    }
    
    return moodFiltered;
  }, [unplayedData, scope, activeMood, recentPickIds, preventDuplicates, user]);

  // Select a random game from the filtered pool
  const selectRandomGame = (): GameListItem | null => {
    if (!filteredGames.length) return null;
    
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const selectedGame = filteredGames[randomIndex];
    
    // If user is authenticated, save the pick to the database
    if (user && selectedGame) {
      savePick({
        gameId: selectedGame.id,
        filters: activeMood ? { mood: activeMood } : undefined
      });
    }
    
    return selectedGame;
  };
  
  return {
    games: filteredGames,
    totalGames: filteredGames.length,
    isLoading: isLoadingLibrary || isLoadingPicks,
    scope,
    setScope,
    activeMood,
    setActiveMood,
    preventDuplicates,
    setPreventDuplicates,
    selectRandomGame,
    recentPicks: picks,
  };
};

export default usePickerData;

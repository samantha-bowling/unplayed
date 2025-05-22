
import { useState, useMemo, useEffect } from 'react';
import useUnplayedData from '@/hooks/use-unplayed-data';
import useGamePicks from '@/hooks/use-game-picks';
import { GameListItem } from '@/types/unplayed-data.types';
import { filterGamesByMood, filterOutRecentPicks } from '@/utils/game-mapping';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';

type PickerScope = 'unplayed' | 'all';

/**
 * Hook to provide filtered game data for the picker
 */
export const usePickerData = () => {
  const { data: unplayedData, isLoading: isLoadingLibrary } = useUnplayedData();
  const { picks, isLoadingPicks, savePick } = useGamePicks();
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const [scope, setScope] = useState<PickerScope>('unplayed');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  
  // Log data received
  useEffect(() => {
    console.log('usePickerData - unplayedData:', unplayedData);
    console.log('usePickerData - gamesList length:', unplayedData?.gamesList?.length || 0);
    console.log('usePickerData - demo mode:', isDemo);
  }, [unplayedData, isDemo]);
  
  // Get recent pick IDs for duplicate prevention
  const recentPickIds = useMemo(() => {
    if (!picks) return [];
    return picks.map(pick => pick.game_id);
  }, [picks]);
  
  // Filter games based on selected criteria
  const filteredGames = useMemo(() => {
    if (!unplayedData || !unplayedData.gamesList) {
      console.log('usePickerData - No gamesList available');
      return [];
    }
    
    console.log('usePickerData - Filtering from gamesList of size:', unplayedData.gamesList.length);
    
    // First filter by scope (unplayed vs all)
    let gamePool = unplayedData.gamesList;
    if (scope === 'unplayed') {
      gamePool = gamePool.filter(game => game.playtimeMinutes === 0);
      console.log('usePickerData - After unplayed filter:', gamePool.length);
    }
    
    // Then filter by mood if selected
    let moodFiltered = gamePool;
    if (activeMood) {
      moodFiltered = filterGamesByMood(moodFiltered, activeMood);
      console.log('usePickerData - After mood filter:', moodFiltered.length);
    }
    
    // Filter by additional source filters if present
    if (sourceFilter === 'shelfLife' && unplayedData.shelfLife) {
      // Get the ids of the oldest games from shelfLife
      const oldestGameIds = new Set(unplayedData.shelfLife.map(game => game.id));
      moodFiltered = moodFiltered.filter(game => oldestGameIds.has(game.id));
      console.log('usePickerData - After shelfLife filter:', moodFiltered.length);
    }
    
    // Finally, filter out recent picks if enabled
    if (preventDuplicates && user) {
      const finalFiltered = filterOutRecentPicks(moodFiltered, recentPickIds);
      console.log('usePickerData - After duplicate filter:', finalFiltered.length);
      return finalFiltered;
    }
    
    return moodFiltered;
  }, [unplayedData, scope, activeMood, recentPickIds, preventDuplicates, user, sourceFilter]);

  // Select a random game from the filtered pool
  const selectRandomGame = (): GameListItem | null => {
    console.log('selectRandomGame - Selecting from filtered games:', filteredGames.length);
    
    if (!filteredGames.length) {
      console.log('selectRandomGame - No games available after filtering');
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const selectedGame = filteredGames[randomIndex];
    
    console.log('selectRandomGame - Selected game:', selectedGame);
    
    // If user is authenticated, save the pick to the database
    if (user && selectedGame) {
      savePick({
        gameId: selectedGame.id,
        filters: {
          mood: activeMood || undefined,
          source: sourceFilter || undefined
        }
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
    sourceFilter,
    setSourceFilter,
    preventDuplicates,
    setPreventDuplicates,
    selectRandomGame,
    recentPicks: picks,
  };
};

export default usePickerData;

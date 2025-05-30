import { useState, useMemo, useEffect } from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import useGamePicks from '@/hooks/use-game-picks';
import { GameListItem } from '@/types/unplayed-data.types';
import { filterGamesByMood, filterOutRecentPicks } from '@/utils/game-mapping';
import { useAuth } from '@/context/AuthContext';

type PickerScope = 'unplayed' | 'all';

/**
 * Hook to provide filtered game data for the picker with proper session state management
 */
export const usePickerData = () => {
  const { data: unifiedData, stats: unifiedStats, isLoading: isLoadingLibrary } = useUnifiedLibraryData();
  const { recentPick, isLoadingPicks, savePick, isSaving } = useGamePicks();
  const { user } = useAuth();
  const [scope, setScope] = useState<PickerScope>('unplayed');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  
  // Session state management - tracks current session pick separately from database
  const [currentSessionPick, setCurrentSessionPick] = useState<GameListItem | null>(null);
  const [hasPickedInSession, setHasPickedInSession] = useState(false);
  
  // Simplified authentication check - no more demo mode conflicts
  const isAuthenticated = !!user;

  // Transform unified data to gamesList format
  const gamesList = useMemo(() => {
    if (!unifiedData) return [];
    
    return unifiedData.map(game => ({
      id: game.game_id,
      name: game.games.name,
      playtimeMinutes: game.playtime_minutes || 0,
      lastPlayedDate: game.last_played_date,
      image: game.games.image_url,
      releaseDate: game.games.release_date,
      price: game.games.price_cents ? game.games.price_cents / 100 : 0,
      dustScore: game.dust_score || 0,
      addedDate: game.acquisition_date || new Date().toISOString(),
      genres: game.games.genres || []
    }));
  }, [unifiedData]);
  
  // Log data received
  useEffect(() => {
    console.log('usePickerData - unifiedData:', unifiedData);
    console.log('usePickerData - gamesList length:', gamesList?.length || 0);
    console.log('usePickerData - authenticated:', isAuthenticated);
    console.log('usePickerData - user:', user);
  }, [unifiedData, gamesList, isAuthenticated, user]);
  
  // Get recent pick IDs for duplicate prevention
  const recentPickIds = useMemo(() => {
    const ids = [];
    
    // Add the current session pick if exists
    if (currentSessionPick) {
      ids.push(currentSessionPick.id);
    }
    
    // Add the database recent pick if exists and different from current session
    if (recentPick && (!currentSessionPick || recentPick.game_id !== currentSessionPick.id)) {
      ids.push(recentPick.game_id);
    }
    
    return ids;
  }, [recentPick, currentSessionPick]);
  
  // Filter games based on selected criteria
  const filteredGames = useMemo(() => {
    if (!gamesList?.length) {
      console.log('usePickerData - No gamesList available');
      return [];
    }
    
    console.log('usePickerData - Filtering from gamesList of size:', gamesList.length);
    
    // First filter by scope (unplayed vs all)
    let gamePool = gamesList;
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
    if (sourceFilter === 'shelfLife' && unifiedStats?.shelfLife) {
      // Get the ids of the oldest games from shelfLife
      const oldestGameIds = new Set(unifiedStats.shelfLife.map(game => game.id));
      moodFiltered = moodFiltered.filter(game => oldestGameIds.has(game.id));
      console.log('usePickerData - After shelfLife filter:', moodFiltered.length);
    }
    
    // Finally, filter out recent picks if enabled
    if (preventDuplicates && isAuthenticated) {
      const finalFiltered = filterOutRecentPicks(moodFiltered, recentPickIds);
      console.log('usePickerData - After duplicate filter:', finalFiltered.length);
      return finalFiltered;
    }
    
    return moodFiltered;
  }, [gamesList, scope, activeMood, recentPickIds, preventDuplicates, isAuthenticated, sourceFilter, unifiedStats]);

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
    
    // Update session state
    setCurrentSessionPick(selectedGame);
    setHasPickedInSession(true);
    
    // Save to database if user is authenticated
    if (isAuthenticated && selectedGame) {
      console.log('selectRandomGame - Saving pick to database for authenticated user');
      savePick({
        gameId: selectedGame.id,
        filters: {
          mood: activeMood || undefined,
          source: sourceFilter || undefined
        }
      });
    } else {
      console.log('selectRandomGame - Skipping database save (user not authenticated)');
    }
    
    return selectedGame;
  };

  // Reset session state when filters change significantly
  const resetSessionState = () => {
    setCurrentSessionPick(null);
    setHasPickedInSession(false);
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
    recentPick,
    currentSessionPick,
    hasPickedInSession,
    resetSessionState,
    isSaving: isAuthenticated ? isSaving : false, // Only show saving state for authenticated users
    user, // Add user to the return object
  };
};

export default usePickerData;

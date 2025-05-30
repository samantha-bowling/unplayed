
import { useState, useMemo, useEffect } from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { GameListItem } from '@/types/unplayed-data.types';
import { filterGamesByMood, filterOutRecentPicks } from '@/utils/game-mapping';
import { useAuth } from '@/context/AuthContext';

type PickerScope = 'unplayed' | 'all';

/**
 * Simplified session-only picker hook that doesn't persist picks to database
 */
export const useSessionPicker = () => {
  const { data: unifiedData, stats: unifiedStats, isLoading: isLoadingLibrary } = useUnifiedLibraryData();
  const { user } = useAuth();
  const [scope, setScope] = useState<PickerScope>('unplayed');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  
  // Session-only state - tracks current and previous picks
  const [currentSessionPick, setCurrentSessionPick] = useState<GameListItem | null>(null);
  const [previousSessionPick, setPreviousSessionPick] = useState<GameListItem | null>(null);
  const [hasPickedInSession, setHasPickedInSession] = useState(false);
  
  // Clear session state when user changes (login/logout)
  useEffect(() => {
    console.log('User authentication changed, clearing session picks');
    setCurrentSessionPick(null);
    setPreviousSessionPick(null);
    setHasPickedInSession(false);
  }, [user?.id]);

  // Transform unified data to gamesList format with proper typing
  const gamesList = useMemo(() => {
    if (!unifiedData) return [];
    
    return unifiedData.map(game => ({
      id: game.game_id,
      name: game.games.name,
      image: game.games.image_url || game.games.header_image || '',
      playtimeMinutes: game.playtime_minutes || 0,
      lastPlayed: game.last_played_date,
      added: game.acquisition_date,
      price: game.games.price_cents ? game.games.price_cents / 100 : 0,
      genres: game.games.genres || [],
      notes: game.notes,
      hidden: game.hidden || false,
      releaseDate: game.games.release_date,
      metacritic: game.games.metacritic_score,
      categories: game.games.categories || [],
      completionEstimate: null,
      mainStoryEstimate: null,
      averageEstimate: null,
      steamAppid: null,
      howLongToBeatId: null,
    })) as GameListItem[];
  }, [unifiedData]);
  
  // Log data received
  useEffect(() => {
    console.log('useSessionPicker - unifiedData:', unifiedData);
    console.log('useSessionPicker - gamesList length:', gamesList?.length || 0);
    console.log('useSessionPicker - authenticated:', !!user);
  }, [unifiedData, gamesList, user]);
  
  // Get recent pick IDs for duplicate prevention (session only)
  const recentPickIds = useMemo(() => {
    const ids = [];
    
    if (currentSessionPick) {
      ids.push(currentSessionPick.id);
    }
    
    if (previousSessionPick && previousSessionPick.id !== currentSessionPick?.id) {
      ids.push(previousSessionPick.id);
    }
    
    return ids;
  }, [currentSessionPick, previousSessionPick]);
  
  // Filter games based on selected criteria
  const filteredGames = useMemo(() => {
    if (!gamesList?.length) {
      console.log('useSessionPicker - No gamesList available');
      return [];
    }
    
    console.log('useSessionPicker - Filtering from gamesList of size:', gamesList.length);
    
    // First filter by scope (unplayed vs all)
    let gamePool = gamesList;
    if (scope === 'unplayed') {
      gamePool = gamePool.filter(game => game.playtimeMinutes === 0);
      console.log('useSessionPicker - After unplayed filter:', gamePool.length);
    }
    
    // Then filter by mood if selected
    let moodFiltered = gamePool;
    if (activeMood) {
      moodFiltered = filterGamesByMood(moodFiltered, activeMood);
      console.log('useSessionPicker - After mood filter:', moodFiltered.length);
    }
    
    // Filter by additional source filters if present
    if (sourceFilter === 'shelfLife' && unifiedStats?.shelfLife) {
      const oldestGameIds = new Set(unifiedStats.shelfLife.map(game => game.id));
      moodFiltered = moodFiltered.filter(game => oldestGameIds.has(game.id));
      console.log('useSessionPicker - After shelfLife filter:', moodFiltered.length);
    }
    
    // Finally, filter out recent picks if enabled
    if (preventDuplicates) {
      const finalFiltered = filterOutRecentPicks(moodFiltered, recentPickIds);
      console.log('useSessionPicker - After duplicate filter:', finalFiltered.length);
      return finalFiltered;
    }
    
    return moodFiltered;
  }, [gamesList, scope, activeMood, recentPickIds, preventDuplicates, sourceFilter, unifiedStats]);

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
    
    // Move current pick to previous if it exists
    if (currentSessionPick) {
      setPreviousSessionPick(currentSessionPick);
    }
    
    // Update session state
    setCurrentSessionPick(selectedGame);
    setHasPickedInSession(true);
    
    return selectedGame;
  };

  // Reset session state when filters change significantly
  const resetSessionState = () => {
    setCurrentSessionPick(null);
    setPreviousSessionPick(null);
    setHasPickedInSession(false);
  };
  
  return {
    games: filteredGames,
    totalGames: filteredGames.length,
    isLoading: isLoadingLibrary,
    scope,
    setScope,
    activeMood,
    setActiveMood,
    sourceFilter,
    setSourceFilter,
    preventDuplicates,
    setPreventDuplicates,
    selectRandomGame,
    currentSessionPick,
    previousSessionPick,
    hasPickedInSession,
    resetSessionState,
    user,
  };
};

export default useSessionPicker;

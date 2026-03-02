
import { useState, useMemo, useEffect, useCallback } from 'react';
import useUnplayedData from '@/hooks/useUnplayedData';
import { GameListItem } from '@/types/unplayed-data.types';
import { filterGamesByMood, filterOutRecentPicks } from '@/utils/game-mapping';
import { useAuth } from '@/context/AuthContext';

type PickerScope = 'unplayed' | 'all';

const STORAGE_KEY_PREFIX = 'steam_picker_';
const EXPIRY_DAYS = 7;

interface PersistedPicks {
  currentPick: GameListItem | null;
  previousPick: GameListItem | null;
  timestamp: string;
}

function loadPicksFromStorage(userId: string): PersistedPicks | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed: PersistedPicks = JSON.parse(raw);
    // Expire after 7 days
    const age = Date.now() - new Date(parsed.timestamp).getTime();
    if (age > EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function savePicksToStorage(userId: string, current: GameListItem | null, previous: GameListItem | null) {
  try {
    const data: PersistedPicks = {
      currentPick: current,
      previousPick: previous,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

/**
 * Simplified session-only picker hook with localStorage persistence for authenticated users
 */
export const useSessionPicker = () => {
  const { data: unplayedData, isLoading: isLoadingLibrary } = useUnplayedData();
  const { user } = useAuth();
  const [scope, setScope] = useState<PickerScope>('unplayed');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [preventDuplicates, setPreventDuplicates] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  
  // Session state
  const [currentSessionPick, setCurrentSessionPick] = useState<GameListItem | null>(null);
  const [previousSessionPick, setPreviousSessionPick] = useState<GameListItem | null>(null);
  const [hasPickedInSession, setHasPickedInSession] = useState(false);
  
  // Hydrate from localStorage on mount / user change
  useEffect(() => {
    if (user?.id) {
      const stored = loadPicksFromStorage(user.id);
      if (stored) {
        setCurrentSessionPick(stored.currentPick);
        setPreviousSessionPick(stored.previousPick);
        setHasPickedInSession(!!stored.currentPick);
      } else {
        setCurrentSessionPick(null);
        setPreviousSessionPick(null);
        setHasPickedInSession(false);
      }
    } else {
      // Unauthenticated — clear session state, no persistence
      setCurrentSessionPick(null);
      setPreviousSessionPick(null);
      setHasPickedInSession(false);
    }
  }, [user?.id]);
  
  // Persist to localStorage whenever picks change (authenticated only)
  useEffect(() => {
    if (user?.id && hasPickedInSession) {
      savePicksToStorage(user.id, currentSessionPick, previousSessionPick);
    }
  }, [user?.id, currentSessionPick, previousSessionPick, hasPickedInSession]);
  
  // Get recent pick IDs for duplicate prevention
  const recentPickIds = useMemo(() => {
    const ids: number[] = [];
    if (currentSessionPick) ids.push(currentSessionPick.id);
    if (previousSessionPick && previousSessionPick.id !== currentSessionPick?.id) {
      ids.push(previousSessionPick.id);
    }
    return ids;
  }, [currentSessionPick, previousSessionPick]);
  
  // Filter games based on selected criteria
  const filteredGames = useMemo(() => {
    if (!unplayedData?.gamesList) return [];
    
    let gamePool = unplayedData.gamesList;
    if (scope === 'unplayed') {
      gamePool = gamePool.filter(game => game.playtimeMinutes === 0);
    }
    
    let moodFiltered = gamePool;
    if (activeMood) {
      moodFiltered = filterGamesByMood(moodFiltered, activeMood);
    }
    
    if (sourceFilter === 'shelfLife' && unplayedData.shelfLife) {
      const oldestGameIds = new Set(unplayedData.shelfLife.map(game => game.id));
      moodFiltered = moodFiltered.filter(game => oldestGameIds.has(game.id));
    }
    
    if (preventDuplicates) {
      return filterOutRecentPicks(moodFiltered, recentPickIds);
    }
    
    return moodFiltered;
  }, [unplayedData, scope, activeMood, recentPickIds, preventDuplicates, sourceFilter]);

  // Select a random game from the filtered pool
  const selectRandomGame = useCallback((): GameListItem | null => {
    if (!filteredGames.length) return null;
    
    const randomIndex = Math.floor(Math.random() * filteredGames.length);
    const selectedGame = filteredGames[randomIndex];
    
    // Move current pick to previous if it exists
    if (currentSessionPick) {
      setPreviousSessionPick(currentSessionPick);
    }
    
    setCurrentSessionPick(selectedGame);
    setHasPickedInSession(true);
    
    return selectedGame;
  }, [filteredGames, currentSessionPick]);

  const resetSessionState = useCallback(() => {
    setCurrentSessionPick(null);
    setPreviousSessionPick(null);
    setHasPickedInSession(false);
    if (user?.id) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${user.id}`);
    }
  }, [user?.id]);
  
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

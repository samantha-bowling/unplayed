import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { isGameUnplayed } from '@/utils/game-definitions';

// Type definitions for our data
type Game = {
  id: number;
  name: string;
  image_url: string | null;
  header_image: string | null;
  release_date: string | null;
  metacritic_score: number | null;
  genres: string[] | null;
  categories: string[] | null;
  price_cents: number | null;
};

type UserGame = {
  id: string;
  game_id: number;
  playtime_minutes: number | null;
  hidden: boolean | null;
  dust_score: number | null;
  last_played_date: string | null;
  acquisition_date: string | null;
  notes: string | null;
};

export type LibraryGame = Game & {
  userGame: UserGame;
}

export type SortOption = 'name' | 'dust_score' | 'acquisition_date' | 'playtime_minutes' | 'last_played_date';

type SortDirection = 'asc' | 'desc';

type FilterOptions = {
  search: string;
  hideIgnored: boolean;
  onlyUnplayed: boolean;
  selectedGenre: string;
  genres: string[];
  categories: string[];
};

// Storage key for persisting view preferences
const STORAGE_KEY = "unplayed-library-view-preferences";

export function useLibraryData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Load persisted sort settings from localStorage
  const loadPersistedSettings = () => {
    try {
      const savedPreferences = localStorage.getItem(STORAGE_KEY);
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        return {
          sortBy: parsed.sortBy || 'name',
          sortDirection: parsed.sortDirection || 'asc',
          viewMode: parsed.viewMode || 'grid'
        };
      }
    } catch (e) {
      console.error("Error loading view preferences", e);
    }
    
    return { sortBy: 'name' as SortOption, sortDirection: 'asc' as SortDirection, viewMode: 'grid' as 'grid' | 'zen' };
  };
  
  const persistedSettings = loadPersistedSettings();
  
  // State for filtering and sorting
  const [sortBy, setSortBy] = useState<SortOption>(persistedSettings.sortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(persistedSettings.sortDirection);
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>(persistedSettings.viewMode);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    hideIgnored: false,
    onlyUnplayed: false,
    selectedGenre: '',
    genres: [],
    categories: [],
  });

  // Save sort and view settings to localStorage when they change
  useEffect(() => {
    const preferences = { sortBy, sortDirection, viewMode };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [sortBy, sortDirection, viewMode]);

  // Fetch all user games with joined game data
  const { data, isLoading, error } = useQuery({
    queryKey: ['libraryGames', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          id,
          game_id,
          playtime_minutes,
          hidden,
          dust_score,
          last_played_date,
          acquisition_date,
          notes,
          games:game_id(
            id, 
            name, 
            image_url,
            header_image,
            release_date,
            metacritic_score,
            genres,
            categories,
            price_cents
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Transform the nested data into a flatter structure
      return data.map((item: any): LibraryGame => ({
        ...item.games,
        userGame: {
          id: item.id,
          game_id: item.game_id,
          playtime_minutes: item.playtime_minutes,
          hidden: item.hidden,
          dust_score: item.dust_score,
          last_played_date: item.last_played_date,
          acquisition_date: item.acquisition_date,
          notes: item.notes,
        }
      }));
    },
    enabled: !!user,
  });

  // Apply filters and sorting to the data
  const filteredAndSortedGames = useMemo(() => {
    if (!data) return [];

    let result = [...data];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(game => 
        game.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter out ignored games if hideIgnored is true
    if (filters.hideIgnored) {
      result = result.filter(game => !game.userGame.hidden);
    }

    // Filter to only unplayed games if onlyUnplayed is true - UPDATED to use standardized logic
    if (filters.onlyUnplayed) {
      result = result.filter(game => 
        isGameUnplayed(game.userGame.playtime_minutes)
      );
    }

    // Filter by selected genre
    if (filters.selectedGenre) {
      result = result.filter(game => 
        game.genres && game.genres.includes(filters.selectedGenre)
      );
    }

    // Filter by genres list
    if (filters.genres.length > 0) {
      result = result.filter(game => 
        game.genres && filters.genres.some(genre => game.genres?.includes(genre))
      );
    }

    // Filter by categories
    if (filters.categories.length > 0) {
      result = result.filter(game => 
        game.categories && filters.categories.some(category => game.categories?.includes(category))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'dust_score':
          valueA = a.userGame.dust_score ?? 0;
          valueB = b.userGame.dust_score ?? 0;
          break;
        case 'acquisition_date':
          valueA = a.userGame.acquisition_date ? new Date(a.userGame.acquisition_date).getTime() : 0;
          valueB = b.userGame.acquisition_date ? new Date(b.userGame.acquisition_date).getTime() : 0;
          break;
        case 'playtime_minutes':
          valueA = a.userGame.playtime_minutes ?? 0;
          valueB = b.userGame.playtime_minutes ?? 0;
          break;
        case 'last_played_date':
          valueA = a.userGame.last_played_date ? new Date(a.userGame.last_played_date).getTime() : 0;
          valueB = b.userGame.last_played_date ? new Date(b.userGame.last_played_date).getTime() : 0;
          break;
        default:
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
      }

      // Handle different data types properly
      let compareResult = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        compareResult = valueA.localeCompare(valueB);
      } else {
        compareResult = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
      
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

    console.log(`Applied sorting: ${sortBy} ${sortDirection}, result count: ${result.length}`);
    return result;
  }, [data, filters, sortBy, sortDirection]);

  // Mark game as played
  const markAsPlayed = useMutation({
    mutationFn: async ({ userGameId, playtime = 60 }: { userGameId: string; playtime?: number }) => {
      const { data, error } = await supabase
        .from('user_games')
        .update({
          playtime_minutes: playtime,
          last_played_date: new Date().toISOString()
        })
        .eq('id', userGameId)
        .eq('user_id', user?.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libraryGames', user?.id] });
    }
  });

  // Toggle game hidden status
  const toggleGameHidden = useMutation({
    mutationFn: async ({ userGameId, hidden }: { userGameId: string; hidden: boolean }) => {
      const { data, error } = await supabase
        .from('user_games')
        .update({ hidden })
        .eq('id', userGameId)
        .eq('user_id', user?.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libraryGames', user?.id] });
    }
  });

  // Save note for game
  const saveGameNote = useMutation({
    mutationFn: async ({ userGameId, note }: { userGameId: string; note: string }) => {
      const { data, error } = await supabase
        .from('user_games')
        .update({ notes: note })
        .eq('id', userGameId)
        .eq('user_id', user?.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libraryGames', user?.id] });
    }
  });

  // Filter updaters
  const updateSearchFilter = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const toggleHideIgnored = useCallback(() => {
    setFilters(prev => ({ ...prev, hideIgnored: !prev.hideIgnored }));
  }, []);

  const toggleOnlyUnplayed = useCallback(() => {
    setFilters(prev => ({ ...prev, onlyUnplayed: !prev.onlyUnplayed }));
  }, []);
  
  const updateSelectedGenre = useCallback((genre: string) => {
    setFilters(prev => ({ ...prev, selectedGenre: genre }));
  }, []);

  const updateGenreFilters = useCallback((genres: string[]) => {
    setFilters(prev => ({ ...prev, genres }));
  }, []);

  const updateCategoryFilters = useCallback((categories: string[]) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);
  
  const updateViewMode = useCallback((mode: 'grid' | 'zen') => {
    setViewMode(mode);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      hideIgnored: false,
      onlyUnplayed: false,
      selectedGenre: '',
      genres: [],
      categories: [],
    });
  }, []);

  // Updated sorting function to match the expected signature from paginated hook
  const updateSort = useCallback((option: SortOption, direction?: 'asc' | 'desc') => {
    console.log(`Updating sort from ${sortBy} ${sortDirection} to ${option}`);
    if (direction) {
      // If direction is explicitly provided, use it
      setSortBy(option);
      setSortDirection(direction);
      console.log(`Set sort to: ${option} ${direction}`);
    } else if (sortBy === option) {
      // Toggle direction if clicking the same sort option
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      console.log(`Toggled sort direction to: ${newDirection}`);
    } else {
      setSortBy(option);
      setSortDirection('asc');
      console.log(`Changed sort to: ${option} asc`);
    }
  }, [sortBy, sortDirection]);

  // Find a game by id (for jumping to/highlighting games)
  const findGameById = useCallback((gameId: number) => {
    return filteredAndSortedGames.find(game => game.id === gameId);
  }, [filteredAndSortedGames]);

  return {
    games: filteredAndSortedGames,
    isLoading,
    error,
    // Filters
    filters,
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    updateSelectedGenre,
    updateGenreFilters,
    updateCategoryFilters,
    resetFilters,
    // Sorting
    sortBy,
    sortDirection,
    updateSort,
    // View Mode
    viewMode,
    updateViewMode,
    // Actions
    markAsPlayed,
    toggleGameHidden,
    saveGameNote,
    findGameById,
  };
}

export default useLibraryData;

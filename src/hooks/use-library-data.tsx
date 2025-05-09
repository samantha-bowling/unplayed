
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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
  genres: string[];
  categories: string[];
};

export function useLibraryData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State for filtering and sorting
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    hideIgnored: false,
    onlyUnplayed: false,
    genres: [],
    categories: [],
  });

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
            categories
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

    // Filter to only unplayed games if onlyUnplayed is true
    if (filters.onlyUnplayed) {
      result = result.filter(game => 
        !game.userGame.playtime_minutes || game.userGame.playtime_minutes === 0
      );
    }

    // Filter by genres
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
          valueA = a.name;
          valueB = b.name;
          break;
        case 'dust_score':
          valueA = a.userGame.dust_score || 0;
          valueB = b.userGame.dust_score || 0;
          break;
        case 'acquisition_date':
          valueA = a.userGame.acquisition_date ? new Date(a.userGame.acquisition_date).getTime() : 0;
          valueB = b.userGame.acquisition_date ? new Date(b.userGame.acquisition_date).getTime() : 0;
          break;
        case 'playtime_minutes':
          valueA = a.userGame.playtime_minutes || 0;
          valueB = b.userGame.playtime_minutes || 0;
          break;
        case 'last_played_date':
          valueA = a.userGame.last_played_date ? new Date(a.userGame.last_played_date).getTime() : 0;
          valueB = b.userGame.last_played_date ? new Date(b.userGame.last_played_date).getTime() : 0;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }

      const compareResult = valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      return sortDirection === 'asc' ? compareResult : -compareResult;
    });

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

  const updateGenreFilters = useCallback((genres: string[]) => {
    setFilters(prev => ({ ...prev, genres }));
  }, []);

  const updateCategoryFilters = useCallback((categories: string[]) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      hideIgnored: false,
      onlyUnplayed: false,
      genres: [],
      categories: [],
    });
  }, []);

  // Sorting updaters
  const updateSort = useCallback((option: SortOption) => {
    if (sortBy === option) {
      // Toggle direction if clicking the same sort option
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDirection('asc');
    }
  }, [sortBy]);

  return {
    games: filteredAndSortedGames,
    isLoading,
    error,
    // Filters
    filters,
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    updateGenreFilters,
    updateCategoryFilters,
    resetFilters,
    // Sorting
    sortBy,
    sortDirection,
    updateSort,
    // Actions
    markAsPlayed,
    toggleGameHidden,
    saveGameNote,
  };
}

export default useLibraryData;

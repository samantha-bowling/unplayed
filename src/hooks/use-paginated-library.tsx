import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { LibraryGame, SortOption } from '@/hooks/use-library-data';
import { queryKeys } from './use-query-keys';

// Constants for pagination
const DEFAULT_PAGE_SIZE = 24;

type PaginationOptions = {
  page: number;
  pageSize: number;
};

type FilterOptions = {
  search: string;
  hideIgnored: boolean;
  onlyUnplayed: boolean;
  selectedGenre: string;
};

// Return type containing paginated data and pagination controls
export type PaginatedLibraryResult = {
  games: LibraryGame[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: FilterOptions;
  sortBy: SortOption;
  sortDirection: 'asc' | 'desc';
  // Filter actions
  updateSearchFilter: (search: string) => void;
  toggleHideIgnored: () => void;
  toggleOnlyUnplayed: () => void;
  updateSelectedGenre: (genre: string) => void;
  resetFilters: () => void;
  // Pagination actions
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
  // Sort actions
  updateSort: (option: SortOption) => void;
  // Game actions
  markAsPlayed: (userGameId: string) => Promise<void>;
  toggleGameHidden: (userGameId: string, hidden: boolean) => Promise<void>;
  saveGameNote: (userGameId: string, note: string) => Promise<void>;
};

/**
 * Hook to provide paginated library data with server-side filtering and sorting
 */
export function usePaginatedLibrary(): PaginatedLibraryResult {
  const { user } = useAuth();
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    hideIgnored: false,
    onlyUnplayed: false,
    selectedGenre: '',
  });
  
  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Count query to get total number of games (for pagination)
  const countQuery = useQuery({
    queryKey: queryKeys.libraryGamesCount(user?.id, filters),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('user_games')
        .select('game_id', { count: 'exact' })
        .eq('user_id', user.id);
      
      // Apply filters
      if (filters.hideIgnored) {
        query = query.eq('hidden', false);
      }
      
      if (filters.onlyUnplayed) {
        query = query.eq('playtime_minutes', 0);
      }
      
      // Handle genre filtering
      if (filters.selectedGenre && filters.selectedGenre.trim() !== '') {
        // First get game ids that match the genre
        try {
          console.log('Fetching games with genre:', filters.selectedGenre);
          const { data: genreGames, error: genreError } = await supabase
            .from('games')
            .select('id')
            .contains('genres', [filters.selectedGenre.trim()]);
          
          if (genreError) {
            console.error('Error fetching games by genre:', genreError);
            return { count: 0 };
          }
          
          if (genreGames && genreGames.length > 0) {
            // Filter user_games by the game ids that match the genre
            query = query.in('game_id', genreGames.map(g => g.id));
          } else {
            console.log('No games found with genre:', filters.selectedGenre);
            return { count: 0 };
          }
        } catch (error) {
          console.error('Exception when filtering by genre:', error);
          return { count: 0 };
        }
      }
      
      // Apply search filter if provided
      if (filters.search && filters.search.trim() !== '') {
        // We need to modify our strategy here - we'll get the game IDs first
        try {
          const { data: gameIds, error: searchError } = await supabase
            .from('games')
            .select('id')
            .ilike('name', `%${filters.search.trim()}%`);
          
          if (searchError) {
            console.error('Error searching games:', searchError);
            return { count: 0 };
          }
          
          if (gameIds && gameIds.length > 0) {
            query = query.in('game_id', gameIds.map(g => g.id));
          } else {
            // No games match the search, return empty result
            console.log('No games found matching search:', filters.search);
            return { count: 0 };
          }
        } catch (error) {
          console.error('Exception when searching games:', error);
          return { count: 0 };
        }
      }
      
      try {
        const { count, error } = await query;
        
        if (error) {
          console.error('Error counting games:', error);
          throw error;
        }
        
        return { count: count || 0 };
      } catch (error) {
        console.error('Exception in count query:', error);
        throw error;
      }
    },
    enabled: !!user,
  });
  
  // Main data query - UPDATED to include dependencies for proper invalidation
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.paginatedLibraryGames(user?.id, pagination.page, pagination.pageSize, filters, sortBy, sortDirection),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Calculate pagination range
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      
      let query = supabase
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
        .eq('user_id', user.id)
        .range(from, to);
      
      // Apply filters
      if (filters.hideIgnored) {
        query = query.eq('hidden', false);
      }
      
      if (filters.onlyUnplayed) {
        query = query.eq('playtime_minutes', 0);
      }
      
      // Handle genre filtering
      if (filters.selectedGenre && filters.selectedGenre.trim() !== '') {
        try {
          console.log('Fetching games with genre for main query:', filters.selectedGenre);
          const { data: genreGames, error: genreError } = await supabase
            .from('games')
            .select('id')
            .contains('genres', [filters.selectedGenre.trim()]);
          
          if (genreError) {
            console.error('Error fetching games by genre:', genreError);
            return [];
          }
          
          if (genreGames && genreGames.length > 0) {
            // Filter user_games by the game ids that match the genre
            query = query.in('game_id', genreGames.map(g => g.id));
          } else {
            console.log('No games found with genre:', filters.selectedGenre);
            return [];
          }
        } catch (error) {
          console.error('Exception when filtering by genre:', error);
          return [];
        }
      }
      
      // Add search filter if provided
      if (filters.search && filters.search.trim() !== '') {
        try {
          // We need a different strategy for text search
          // First get the game IDs that match the search
          const { data: gameIds, error: searchError } = await supabase
            .from('games')
            .select('id')
            .ilike('name', `%${filters.search.trim()}%`);
          
          if (searchError) {
            console.error('Error searching games:', searchError);
            return [];
          }
          
          if (gameIds && gameIds.length > 0) {
            query = query.in('game_id', gameIds.map(g => g.id));
          } else {
            // No games match the search, return empty array
            console.log('No games found matching search:', filters.search);
            return [];
          }
        } catch (error) {
          console.error('Exception when searching games:', error);
          return [];
        }
      }
      
      // Add sorting - IMPROVED logging
      console.log(`Applying sort: ${sortBy} ${sortDirection}`);
      switch (sortBy) {
        case 'name':
          // For name, we need to sort by the joined games table
          query = query.order('games(name)', { ascending: sortDirection === 'asc' });
          break;
        case 'dust_score':
          query = query.order('dust_score', { ascending: sortDirection === 'asc', nullsFirst: false });
          break;
        case 'acquisition_date':
          query = query.order('acquisition_date', { ascending: sortDirection === 'asc', nullsFirst: false });
          break;
        case 'playtime_minutes':
          query = query.order('playtime_minutes', { ascending: sortDirection === 'asc', nullsFirst: true });
          break;
        case 'last_played_date':
          query = query.order('last_played_date', { ascending: sortDirection === 'asc', nullsFirst: true });
          break;
        default:
          // Default to sorting by name
          query = query.order('games(name)', { ascending: true });
      }
      
      try {
        const { data: userGames, error: fetchError } = await query;
        
        if (fetchError) {
          console.error('Error fetching user games:', fetchError);
          throw fetchError;
        }
        
        if (!userGames) {
          return [];
        }
        
        console.log(`Fetched ${userGames.length} games with sort: ${sortBy} ${sortDirection}`);
        
        // Transform the nested data into a flatter structure
        return userGames.map((item: any): LibraryGame => ({
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
      } catch (error) {
        console.error('Exception in main data query:', error);
        throw error;
      }
    },
    enabled: !!user,
  });
  
  // Pagination controls
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, page)
    }));
  }, []);
  
  const nextPage = useCallback(() => {
    const totalPages = Math.ceil((countQuery.data?.count || 0) / pagination.pageSize);
    if (pagination.page < totalPages) {
      setPagination(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  }, [pagination.page, pagination.pageSize, countQuery.data?.count]);
  
  const previousPage = useCallback(() => {
    if (pagination.page > 1) {
      setPagination(prev => ({
        ...prev,
        page: prev.page - 1
      }));
    }
  }, [pagination.page]);
  
  const setPageSize = useCallback((size: number) => {
    setPagination({
      page: 1, // Reset to first page when changing page size
      pageSize: size
    });
  }, []);
  
  // Filter controls
  const updateSearchFilter = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);
  
  const toggleHideIgnored = useCallback(() => {
    setFilters(prev => ({ ...prev, hideIgnored: !prev.hideIgnored }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  const toggleOnlyUnplayed = useCallback(() => {
    setFilters(prev => ({ ...prev, onlyUnplayed: !prev.onlyUnplayed }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  const updateSelectedGenre = useCallback((genre: string) => {
    setFilters(prev => ({ ...prev, selectedGenre: genre }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      hideIgnored: false,
      onlyUnplayed: false,
      selectedGenre: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);
  
  // Sort controls - IMPROVED with logging
  const updateSort = useCallback((option: SortOption) => {
    console.log(`Paginated: Updating sort from ${sortBy} ${sortDirection} to ${option}`);
    if (sortBy === option) {
      // Toggle direction if clicking the same sort option
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
      console.log(`Paginated: Toggled sort direction to: ${newDirection}`);
    } else {
      setSortBy(option);
      setSortDirection('asc');
      console.log(`Paginated: Changed sort to: ${option} asc`);
    }
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page on sort change
  }, [sortBy, sortDirection]);
  
  // Action handlers (simplified, actual mutations would need proper implementation)
  const markAsPlayed = async (userGameId: string) => {
    if (!user) return;
    
    await supabase
      .from('user_games')
      .update({
        playtime_minutes: 60,
        last_played_date: new Date().toISOString()
      })
      .eq('id', userGameId)
      .eq('user_id', user.id);
  };
  
  const toggleGameHidden = async (userGameId: string, hidden: boolean) => {
    if (!user) return;
    
    await supabase
      .from('user_games')
      .update({ hidden })
      .eq('id', userGameId)
      .eq('user_id', user.id);
  };
  
  const saveGameNote = async (userGameId: string, note: string) => {
    if (!user) return;
    
    await supabase
      .from('user_games')
      .update({ notes: note })
      .eq('id', userGameId)
      .eq('user_id', user.id);
  };
  
  // Calculate pagination metadata
  const totalItems = countQuery.data?.count || 0;
  const totalPages = Math.ceil(totalItems / pagination.pageSize);
  const hasNextPage = pagination.page < totalPages;
  const hasPreviousPage = pagination.page > 1;
  
  return {
    games: data || [],
    isLoading: isLoading || countQuery.isLoading,
    error: error as Error || null,
    pagination: {
      currentPage: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
    filters,
    sortBy,
    sortDirection,
    // Filter actions
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    updateSelectedGenre,
    resetFilters,
    // Pagination actions
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    // Sort action
    updateSort,
    // Game actions
    markAsPlayed,
    toggleGameHidden,
    saveGameNote,
  };
}

export default usePaginatedLibrary;

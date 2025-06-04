
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

// Debug version of useLibraryData to investigate the 1000 vs 1621 games issue
export function useLibraryDataDebug() {
  const { user } = useAuth();
  
  // Fetch all user games with joined game data - NO LIMITS
  const { data, isLoading, error } = useQuery({
    queryKey: ['libraryGamesDebug', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔍 DEBUG: Fetching ALL user games for user:', user.id);
      
      // First, get total count
      const { count: totalCount, error: countError } = await supabase
        .from('user_games')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (countError) {
        console.error('❌ DEBUG: Error getting count:', countError);
        throw countError;
      }
      
      console.log('📊 DEBUG: Total user_games count in database:', totalCount);
      
      // Now fetch all games with joins - NO LIMIT
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
      
      if (error) {
        console.error('❌ DEBUG: Error fetching games:', error);
        throw error;
      }
      
      console.log('📦 DEBUG: Fetched games array length:', data?.length);
      console.log('📦 DEBUG: Sample games:', data?.slice(0, 3));
      
      // Check for any null games (broken relationships)
      const nullGames = data?.filter(item => !item.games) || [];
      if (nullGames.length > 0) {
        console.warn('⚠️ DEBUG: Found user_games with null games relationship:', nullGames.length);
      }
      
      // Transform the nested data into a flatter structure
      const transformedData = data?.map((item: any) => ({
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
      })).filter(game => game.id) || []; // Filter out any with null games
      
      console.log('✅ DEBUG: Final transformed data length:', transformedData.length);
      console.log('✅ DEBUG: First few transformed games:', transformedData.slice(0, 3));
      
      return transformedData;
    },
    enabled: !!user,
  });

  return {
    games: data || [],
    isLoading,
    error,
    totalCount: data?.length || 0
  };
}

export default useLibraryDataDebug;

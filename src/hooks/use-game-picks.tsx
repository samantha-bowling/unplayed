
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick, GamePickFilters } from '@/types/picks.types';

// Type for Supabase-compatible JSON
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Custom hook for managing game picks
 */
export const useGamePicks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  // Query to fetch user's most recent pick with full game data and user game data
  const {
    data: recentPick,
    isLoading: isLoadingPicks,
    error: picksError,
  } = useQuery({
    queryKey: ['gamePicks', user?.id],
    queryFn: async () => {
      if (!isAuthenticated) return null;

      console.log('Fetching recent pick for user:', user.id);

      const { data: pickData, error } = await supabase
        .from('game_picks')
        .select(`
          id,
          game_id,
          picked_at,
          filters,
          games (
            id,
            name,
            image_url,
            header_image,
            release_date,
            price_cents,
            genres,
            categories,
            description,
            developer,
            publisher
          ),
          user_games (
            acquisition_date,
            playtime_minutes
          )
        `)
        .eq('user_id', user.id)
        .order('picked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching recent pick:', error);
        throw error;
      }

      console.log('Recent pick data:', pickData);

      // Transform the data to match our GamePick interface if data exists
      if (!pickData) return null;

      return {
        id: pickData.id,
        game_id: pickData.game_id,
        picked_at: pickData.picked_at,
        filters: pickData.filters as GamePickFilters,
        game: pickData.games,
        userGameData: pickData.user_games?.[0]
      } as GamePick;
    },
    enabled: isAuthenticated,
  });

  // Mutation for saving a new pick using PostgreSQL upsert
  const {
    mutate: savePick,
    isPending: isSaving,
    error: saveError
  } = useMutation({
    mutationFn: async ({ gameId, filters }: { gameId: number; filters?: GamePickFilters }) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to save picks');
      }

      console.log('Attempting to save game pick:', { gameId, userId: user.id, filters });

      // Use PostgreSQL upsert (ON CONFLICT DO UPDATE) for better race condition handling
      const { data, error } = await supabase
        .from('game_picks')
        .upsert(
          {
            user_id: user.id,
            game_id: gameId,
            filters: (filters as unknown as Json) || {},
            picked_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (error) {
        console.error('Error saving game pick:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Successfully saved game pick:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log('Game pick saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['gamePicks', user?.id] });
      toast({
        title: "Game picked!",
        description: "Your selection has been saved.",
      });
    },
    onError: (error: any) => {
      console.error('Error saving game pick:', {
        message: error.message,
        code: error.code,
        fullError: error
      });
      
      // Only show error toast for actual failures (not race condition conflicts that resolve)
      toast({
        title: "Failed to save pick",
        description: "Your selection could not be saved. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    recentPick,
    isLoadingPicks,
    picksError,
    savePick,
    isSaving,
    saveError
  };
};

export default useGamePicks;

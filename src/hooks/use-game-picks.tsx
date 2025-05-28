
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

      // First, get the most recent pick
      const { data: pickData, error: pickError } = await supabase
        .from('game_picks')
        .select('*')
        .eq('user_id', user.id)
        .order('picked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pickError) {
        console.error('Error fetching recent pick:', pickError);
        throw pickError;
      }

      if (!pickData) {
        console.log('No recent pick found');
        return null;
      }

      console.log('Recent pick found:', pickData);

      // Get the game data for this pick
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', pickData.game_id)
        .single();

      if (gameError) {
        console.error('Error fetching game data:', gameError);
        // Don't throw here, we can still return the pick without full game data
      }

      // Get the user's game data for this specific game
      const { data: userGameData, error: userGameError } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', pickData.game_id)
        .maybeSingle();

      if (userGameError) {
        console.error('Error fetching user game data:', userGameError);
        // Don't throw here, we can still return the pick without user game data
      }

      console.log('Complete pick data assembled:', {
        pick: pickData,
        game: gameData,
        userGame: userGameData
      });

      // Transform the data to match our GamePick interface
      return {
        id: pickData.id,
        game_id: pickData.game_id,
        picked_at: pickData.picked_at,
        filters: pickData.filters as GamePickFilters,
        game: gameData,
        userGameData: userGameData
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
      
      // Handle specific RLS error
      if (error.code === '42501') {
        toast({
          title: "Authentication required",
          description: "Please make sure you're logged in to save picks.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to save pick",
          description: "Your selection could not be saved. Please try again.",
          variant: "destructive",
        });
      }
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

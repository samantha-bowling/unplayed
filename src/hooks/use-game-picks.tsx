
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

  // Query to fetch user's most recent pick with full game data
  const {
    data: recentPick,
    isLoading: isLoadingPicks,
    error: picksError,
  } = useQuery({
    queryKey: ['gamePicks', user?.id],
    queryFn: async () => {
      if (!isAuthenticated) return null;

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
          )
        `)
        .eq('user_id', user.id)
        .order('picked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Transform the data to match our GamePick interface if data exists
      if (!pickData) return null;

      return {
        id: pickData.id,
        game_id: pickData.game_id,
        picked_at: pickData.picked_at,
        filters: pickData.filters as GamePickFilters,
        game: pickData.games
      } as GamePick;
    },
    enabled: isAuthenticated,
  });

  // Mutation for saving a new pick (using upsert logic)
  const {
    mutate: savePick,
    isPending: isSaving,
    error: saveError
  } = useMutation({
    mutationFn: async ({ gameId, filters }: { gameId: number; filters?: GamePickFilters }) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to save picks');
      }

      // Use upsert logic to replace any existing pick for this user
      const { data, error } = await supabase
        .from('game_picks')
        .upsert({
          user_id: user.id,
          game_id: gameId,
          filters: filters as unknown as Json || {},
          picked_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamePicks', user?.id] });
      toast({
        title: "Game picked!",
        description: "Your selection has been saved.",
      });
    },
    onError: (error) => {
      console.error('Error saving game pick:', error);
      toast({
        title: "Failed to save pick",
        description: "Your selection could not be saved.",
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

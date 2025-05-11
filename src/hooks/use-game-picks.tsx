import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick, GamePickFilters } from '@/types/picks.types';

/**
 * Custom hook for managing game picks
 */
export const useGamePicks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  // Query to fetch user's pick history
  const {
    data: picks,
    isLoading: isLoadingPicks,
    error: picksError,
  } = useQuery({
    queryKey: ['gamePicks', user?.id],
    queryFn: async () => {
      if (!isAuthenticated) return [];

      const { data: pickData, error } = await supabase
        .from('game_picks')
        .select(`
          id,
          game_id,
          picked_at,
          filters
        `)
        .order('picked_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return pickData as GamePick[];
    },
    enabled: isAuthenticated,
  });

  // Mutation for saving a new pick
  const {
    mutate: savePick,
    isPending: isSaving,
    error: saveError
  } = useMutation({
    mutationFn: async ({ gameId, filters }: { gameId: number; filters?: GamePickFilters }) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to save picks');
      }

      const { data, error } = await supabase
        .from('game_picks')
        .insert({
          user_id: user.id,
          game_id: gameId,
          filters: filters || {},
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
    picks,
    isLoadingPicks,
    picksError,
    savePick,
    isSaving,
    saveError
  };
};

export default useGamePicks;

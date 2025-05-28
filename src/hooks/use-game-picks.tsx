
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick, GamePickFilters } from '@/types/picks.types';
import { 
  getAuthDebugInfo, 
  testGamePicksRLS, 
  logDatabaseError, 
  debugSupabaseOperation 
} from '@/utils/supabase-debug';

// Type for Supabase-compatible JSON
type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * Custom hook for managing game picks with enhanced debugging
 */
export const useGamePicks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user;

  // Debug authentication state when it changes
  useEffect(() => {
    if (user) {
      console.log('🔐 useGamePicks - User authenticated:', user.id);
      // Test RLS policies when user becomes authenticated
      testGamePicksRLS();
    } else {
      console.log('🔐 useGamePicks - User not authenticated');
    }
  }, [user]);

  // Query to fetch user's most recent pick with full game data and user game data
  const {
    data: recentPick,
    isLoading: isLoadingPicks,
    error: picksError,
  } = useQuery({
    queryKey: ['gamePicks', user?.id],
    queryFn: async () => {
      if (!isAuthenticated) {
        console.log('🔍 Query skipped - user not authenticated');
        return null;
      }

      console.log('🔍 Fetching recent pick for user:', user.id);

      // Enhanced debug info for the query
      const authInfo = await getAuthDebugInfo();
      console.log('🔍 Auth info during query:', authInfo);

      // First, get the most recent pick with enhanced debugging
      const pickResult = await debugSupabaseOperation(
        () => supabase
          .from('game_picks')
          .select('*')
          .eq('user_id', user.id)
          .order('picked_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        {
          operation: 'SELECT',
          table: 'game_picks',
          details: { userId: user.id, operation: 'get recent pick' }
        }
      );

      if (pickResult.error) {
        // Enhanced error handling with specific guidance
        console.error('🔒 Error fetching recent pick:', pickResult.error);
        
        // Don't throw for permission errors in authenticated users - this indicates RLS issues
        if (pickResult.error.code === '42501' || pickResult.error.code === 'PGRST301') {
          console.error('🔒 RLS permission issue - this should not happen for authenticated users');
          console.error('🔒 Recommended actions:');
          console.error('   1. Check if game_picks table has RLS enabled');
          console.error('   2. Verify RLS policies exist for SELECT operations');
          console.error('   3. Ensure policies allow user to access their own picks');
          return null;
        }
        throw pickResult.error;
      }

      const pickData = pickResult.data;
      if (!pickData) {
        console.log('✅ No recent pick found for user');
        return null;
      }

      console.log('✅ Recent pick found:', pickData);

      // Get the game data for this pick with debugging
      const gameResult = await debugSupabaseOperation(
        () => supabase
          .from('games')
          .select('*')
          .eq('id', pickData.game_id)
          .single(),
        {
          operation: 'SELECT',
          table: 'games',
          details: { gameId: pickData.game_id }
        }
      );

      if (gameResult.error) {
        console.error('⚠️ Error fetching game data - continuing without it:', gameResult.error);
      }

      // Get the user's game data for this specific game with debugging
      const userGameResult = await debugSupabaseOperation(
        () => supabase
          .from('user_games')
          .select('*')
          .eq('user_id', user.id)
          .eq('game_id', pickData.game_id)
          .maybeSingle(),
        {
          operation: 'SELECT',
          table: 'user_games',
          details: { userId: user.id, gameId: pickData.game_id }
        }
      );

      if (userGameResult.error) {
        console.error('⚠️ Error fetching user game data - continuing without it:', userGameResult.error);
      }

      console.log('✅ Complete pick data assembled:', {
        pick: pickData,
        game: gameResult.data,
        userGame: userGameResult.data
      });

      // Transform the data to match our GamePick interface
      return {
        id: pickData.id,
        game_id: pickData.game_id,
        picked_at: pickData.picked_at,
        filters: pickData.filters as GamePickFilters,
        game: gameResult.data,
        userGameData: userGameResult.data
      } as GamePick;
    },
    enabled: isAuthenticated,
  });

  // Mutation for saving a new pick using PostgreSQL upsert with enhanced debugging
  const {
    mutate: savePick,
    isPending: isSaving,
    error: saveError
  } = useMutation({
    mutationFn: async ({ gameId, filters }: { gameId: number; filters?: GamePickFilters }) => {
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to save picks');
      }

      console.log('🔍 Attempting to save game pick:', { gameId, userId: user.id, filters });

      // Debug authentication before attempting save
      const authInfo = await getAuthDebugInfo();
      console.log('🔍 Auth info during save:', authInfo);

      // Use PostgreSQL upsert (ON CONFLICT DO UPDATE) for better race condition handling
      const saveResult = await debugSupabaseOperation(
        () => supabase
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
          .single(),
        {
          operation: 'UPSERT',
          table: 'game_picks',
          details: { userId: user.id, gameId, filters }
        }
      );

      if (saveResult.error) {
        console.error('💥 Error saving game pick:', saveResult.error);
        throw saveResult.error;
      }

      console.log('✅ Successfully saved game pick:', saveResult.data);
      return saveResult.data;
    },
    onSuccess: (data) => {
      console.log('✅ Game pick saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['gamePicks', user?.id] });
      
      // Only show success toast for actual user-initiated saves
      toast({
        title: "Game picked!",
        description: "Your selection has been saved.",
      });
    },
    onError: (error: any) => {
      console.error('💥 Error saving game pick:', error);
      
      // Enhanced error handling with specific guidance
      if (error.code === '42501') {
        console.error('🔒 RLS permission error during save');
        console.error('🔒 This indicates a database policy issue, not a user authentication issue');
        console.error('🔒 User ID:', user?.id);
        console.error('🔒 User auth status:', isAuthenticated);
        
        // Only show authentication toast if user appears to be truly unauthenticated
        if (!user || !isAuthenticated) {
          toast({
            title: "Authentication required",
            description: "Please make sure you're logged in to save picks.",
            variant: "destructive",
          });
        } else {
          // For authenticated users, this is a configuration issue
          console.error('🔒 Database configuration issue - RLS policies may be missing or incorrect');
        }
      } else if (error.code === 'PGRST301') {
        console.error('🔒 No matching RLS policy - check game_picks table policies');
      } else if (error.message?.includes('duplicate key') || error.code === '23505') {
        // Unique constraint violation - this is expected with upserts, don't show error
        console.log('ℹ️ Duplicate key during upsert - this is normal behavior');
      } else {
        // Show toast for genuine errors that users should know about
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

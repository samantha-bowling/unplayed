
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { GameListItem } from '@/types/unplayed-data.types';
import { GamePick, GamePickFilters } from '@/types/picks.types';
import { queryKeys } from '@/hooks/use-query-keys';
import { devLog } from '../lib/dev-log';
import { 
  getAuthDebugInfo, 
  testGamePicksRLS, 
  logDatabaseError
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
      devLog('🔐 useGamePicks - User authenticated:', user.id);
      // Test RLS policies when user becomes authenticated
      testGamePicksRLS();
    } else {
      devLog('🔐 useGamePicks - User not authenticated');
    }
  }, [user]);

  // Query to fetch user's most recent pick with full game data and user game data
  const {
    data: recentPick,
    isLoading: isLoadingPicks,
    error: picksError,
  } = useQuery({
    queryKey: queryKeys.gamePicks(user?.id),
    queryFn: async () => {
      if (!isAuthenticated) {
        devLog('🔍 Query skipped - user not authenticated');
        return null;
      }

      devLog('🔍 Fetching recent pick for user:', user.id);

      // Enhanced debug info for the query
      const authInfo = await getAuthDebugInfo();
      devLog('🔍 Auth info during query:', authInfo);

      // First, get the most recent pick with enhanced debugging
      const { data: pickData, error: pickError } = await supabase
        .from('game_picks')
        .select('*')
        .eq('user_id', user.id)
        .order('picked_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pickError) {
        // Enhanced error handling with specific guidance
        console.error('🔒 Error fetching recent pick:', pickError);
        logDatabaseError('SELECT', 'game_picks', pickError, { userId: user.id, operation: 'get recent pick' });
        
        // Don't throw for permission errors in authenticated users - this indicates RLS issues
        if (pickError.code === '42501' || pickError.code === 'PGRST301') {
          console.error('🔒 RLS permission issue - this should not happen for authenticated users');
          console.error('🔒 Recommended actions:');
          console.error('   1. Check if game_picks table has RLS enabled');
          console.error('   2. Verify RLS policies exist for SELECT operations');
          console.error('   3. Ensure policies allow user to access their own picks');
          return null;
        }
        throw pickError;
      }

      if (!pickData) {
        devLog('✅ No recent pick found for user');
        return null;
      }

      devLog('✅ Recent pick found:', pickData);

      // Get the game data for this pick with debugging
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', pickData.game_id)
        .single();

      if (gameError) {
        console.error('⚠️ Error fetching game data - continuing without it:', gameError);
        logDatabaseError('SELECT', 'games', gameError, { gameId: pickData.game_id });
      }

      // Get the user's game data for this specific game with debugging
      const { data: userGameData, error: userGameError } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_id', pickData.game_id)
        .maybeSingle();

      if (userGameError) {
        console.error('⚠️ Error fetching user game data - continuing without it:', userGameError);
        logDatabaseError('SELECT', 'user_games', userGameError, { userId: user.id, gameId: pickData.game_id });
      }

      devLog('✅ Complete pick data assembled:', {
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

      devLog('🔍 Attempting to save game pick:', { gameId, userId: user.id, filters });

      // Debug authentication before attempting save
      const authInfo = await getAuthDebugInfo();
      devLog('🔍 Auth info during save:', authInfo);

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
        console.error('💥 Error saving game pick:', error);
        logDatabaseError('UPSERT', 'game_picks', error, { userId: user.id, gameId, filters });
        throw error;
      }

      devLog('✅ Successfully saved game pick:', data);
      return data;
    },
    onSuccess: (data) => {
      devLog('✅ Game pick saved successfully:', data);
      // Invalidate the specific user's game picks cache using the correct query key
      queryClient.invalidateQueries({ queryKey: queryKeys.gamePicks(user?.id) });
      
      // Only show success toast for actual user-initiated saves
      toast("Game picked!", {
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
          toast.error("Authentication required", {
            description: "Please make sure you're logged in to save picks.",
          });
        } else {
          // For authenticated users, this is a configuration issue
          console.error('🔒 Database configuration issue - RLS policies may be missing or incorrect');
        }
      } else if (error.code === 'PGRST301') {
        console.error('🔒 No matching RLS policy - check game_picks table policies');
      } else if (error.message?.includes('duplicate key') || error.code === '23505') {
        // Unique constraint violation - this is expected with upserts, don't show error
        devLog('ℹ️ Duplicate key during upsert - this is normal behavior');
      } else {
        // Show toast for genuine errors that users should know about
        toast.error("Failed to save pick", {
          description: "Your selection could not be saved. Please try again.",
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

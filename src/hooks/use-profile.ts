
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type UserProfile = {
  id: string;
  steam_id?: string;
  steam_name?: string;
  steam_avatar?: string;
  role?: string;
  onboarding_complete?: boolean;
  leaderboard_visibility?: 'off' | 'anonymous' | 'public';
  leaderboard_prompt_shown?: boolean;
  leaderboard_opted_out_explicitly?: boolean;
  profile_theme?: string;
  profile_tagline?: string;
  profile_main_stat?: string;
  profile_badge_1?: string | null;
  profile_badge_2?: string | null;
  profile_badge_3?: string | null;
  profile_username?: string;
  show_mint_glow?: boolean;
  background_animation_pack?: string;
  created_at?: string;
  updated_at?: string;
  last_sync?: string;
  last_username_change?: string;
};

const PROFILE_CACHE_KEY = 'profile';

/**
 * Hook for accessing and managing user profile data with caching and deduplication.
 * This is the single source of truth for user profile data in the application.
 */
export function useProfile() {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  // Query for user profile data
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [PROFILE_CACHE_KEY, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log(`[useProfile] Fetching profile for user ${user.id}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('[useProfile] Error fetching profile:', error);
        throw error;
      }
      
      console.log('[useProfile] Profile fetched:', data);
      return data as UserProfile | null;
    },
    enabled: !!user?.id && !!session,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
  });
  
  // Mutation for updating user profile
  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (profileData: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      console.log('[useProfile] Updating profile:', profileData);
      
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error('[useProfile] Error updating profile:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Update cache with new profile data
      queryClient.setQueryData([PROFILE_CACHE_KEY, user?.id], data);
      console.log('[useProfile] Profile updated successfully:', data);
    }
  });
  
  // Helper to determine if the user has linked their Steam account
  const hasSteamLinked = !!profile?.steam_id;
  
  // Force refresh the profile data
  const refreshProfile = async (force: boolean = false) => {
    if (force) {
      // Invalidate the cache to force a fresh fetch
      queryClient.invalidateQueries({ queryKey: [PROFILE_CACHE_KEY, user?.id] });
    }
    
    return refetch();
  };

  // Check username availability for vanity URLs
  const checkUsernameAvailability = async (username: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-username-availability', {
        body: { username: username.toLowerCase().trim() }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to check username availability:', error);
      throw error;
    }
  };
  
  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating,
    hasSteamLinked,
    refreshProfile,
    checkUsernameAvailability,
  };
}

export default useProfile;

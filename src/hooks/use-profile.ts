
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type ProfileVisibility = 'public' | 'private';

export type UserProfile = {
  id: string;
  steam_id?: string;
  steam_name?: string;
  steam_avatar?: string;
  role?: string; // ⚠️ DEPRECATED - kept for backward compatibility
  roles?: string[]; // ✅ NEW - from user_roles table
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
  profile_visibility?: ProfileVisibility;
  show_library_value_on_leaderboard?: boolean;
  created_at?: string;
  updated_at?: string;
  last_sync?: string;
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
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('[useProfile] Error fetching profile:', error);
        throw error;
      }
      
      // Map user_roles array to simple roles string array
      const profileWithRoles = data ? {
        ...data,
        roles: Array.isArray(data.user_roles) 
          ? data.user_roles.map((r: any) => r.role) 
          : []
      } : null;
      
      console.log('[useProfile] Profile fetched with roles:', profileWithRoles);
      return profileWithRoles as UserProfile | null;
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
      // Invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: [PROFILE_CACHE_KEY, user?.id] });
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
  
  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating,
    hasSteamLinked,
    refreshProfile,
  };
}

export default useProfile;

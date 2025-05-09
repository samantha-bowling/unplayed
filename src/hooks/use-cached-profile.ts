
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const PROFILE_CACHE_KEY = 'unplayed_profile_cache';
const PROFILE_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

type UserProfile = {
  id: string;
  steam_id: string;
  steam_name: string;
  steam_avatar: string;
  last_sync: string | null;
};

export type CachedProfileData = {
  profile: UserProfile;
  timestamp: number;
  version: number; // For schema versioning
};

export function useCachedProfile() {
  const { profile, user } = useAuth();
  const [cachedProfile, setCachedProfile] = useState<UserProfile | null>(null);
  
  // Try to load from cache on init
  useEffect(() => {
    if (!user) return;
    
    try {
      const cachedData = localStorage.getItem(PROFILE_CACHE_KEY);
      if (cachedData) {
        const parsed: CachedProfileData = JSON.parse(cachedData);
        
        // Check if cache is still valid
        const isExpired = Date.now() - parsed.timestamp > PROFILE_CACHE_TTL;
        const isCorrectUser = parsed.profile.id === user.id;
        
        if (!isExpired && isCorrectUser) {
          setCachedProfile(parsed.profile);
        }
      }
    } catch (error) {
      console.error('Error parsing cached profile', error);
    }
  }, [user]);
  
  // Update cache when profile changes
  useEffect(() => {
    if (profile && user) {
      const cacheData: CachedProfileData = {
        profile,
        timestamp: Date.now(),
        version: 1 // Increment when profile schema changes
      };
      
      try {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
        setCachedProfile(profile);
      } catch (error) {
        console.error('Error caching profile', error);
      }
    }
  }, [profile, user]);
  
  const invalidateCache = () => {
    localStorage.removeItem(PROFILE_CACHE_KEY);
    setCachedProfile(null);
  };
  
  return {
    // Use cached profile if available, otherwise use the one from context
    // This prevents UI flicker during profile loading
    profile: cachedProfile || profile,
    isFromCache: Boolean(cachedProfile && !profile),
    invalidateCache
  };
}

export default useCachedProfile;

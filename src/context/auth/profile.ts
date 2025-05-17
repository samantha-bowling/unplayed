
// src/context/auth/profile.ts
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from './types';

// Maximum number of profile refresh attempts to prevent infinite loops
const MAX_REFRESH_ATTEMPTS = 5;

// Function to fetch user profile with retry logic
export async function fetchUserProfile(
  user: User | null,
  setProfile: (profile: any) => void,
  setError: (error: AuthError | null) => void,
  profileRefreshAttempts: number,
  setEnhancedStatus: (status: any) => void
): Promise<any> {
  if (!user) return null;
  
  try {
    setEnhancedStatus('PROFILE_LOADING');
    
    // Track retry attempts
    if (profileRefreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      console.warn(`[Auth] Max profile refresh attempts (${MAX_REFRESH_ATTEMPTS}) reached for user ${user.id}`);
      setEnhancedStatus('PROFILE_ERROR');
      setError({
        code: 'profile_refresh_max_retries',
        message: `Maximum profile refresh attempts reached (${MAX_REFRESH_ATTEMPTS})`,
        timestamp: Date.now(),
      });
      return null;
    }
    
    console.log(`Refreshing profile for user ${user.id} (attempt ${profileRefreshAttempts + 1})`);
    
    // Calculate backoff delay based on attempt number (exponential backoff)
    const backoffDelay = Math.min(100 * Math.pow(2, profileRefreshAttempts), 3000);
    if (profileRefreshAttempts > 0) {
      console.log(`[Auth] Using backoff delay of ${backoffDelay}ms for profile refresh`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load profile:', error.message);
      setEnhancedStatus('PROFILE_ERROR');
      setError({
        code: 'profile_refresh_error',
        message: error.message,
        timestamp: Date.now(),
      });
      return null;
    }

    console.log('Profile refreshed successfully:', data ? 'found' : 'not found');
    
    // Store the result - might be null if user doesn't exist in users table yet
    setProfile(data);
    setEnhancedStatus(data ? 'PROFILE_LOADED' : 'PROFILE_ERROR');
    
    return data;
  } catch (error: any) {
    console.error('Failed to load profile:', error.message);
    setError({
      code: 'profile_refresh_error',
      message: error.message,
      timestamp: Date.now(),
    });
    setEnhancedStatus('PROFILE_ERROR');
    return null;
  }
}

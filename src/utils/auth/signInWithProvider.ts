
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthStorage, AuthState } from '../auth-service';

export const signInWithProvider = async (
  provider: 'discord' | 'twitch',
  redirectTo?: string
): Promise<void> => {
  console.log(`[Auth] Signing in with ${provider}, redirect: ${redirectTo || 'default'}`);
  
  try {
    // Update auth state
    AuthStorage.setAuthState(AuthState.LOADING);
    
    // Set flags with automatic expiration as a safety mechanism
    AuthStorage.setAuthFlag('AUTH_IN_PROGRESS', 'true', 5 * 60 * 1000); // 5 minutes max

    // Make sure we have a valid redirect URL
    const normalizedRedirectTo = redirectTo || `${window.location.origin}/auth/callback`;
    console.log(`[Auth] Using redirect URL: ${normalizedRedirectTo}`);
    
    console.log(`[Auth] Using Supabase OAuth for ${provider}`);
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: normalizedRedirectTo,
        scopes: provider === 'discord' ? 'identify email' : undefined,
      },
    });

    if (error) {
      console.error(`[Auth] ${provider} sign in error:`, error);
      // Update auth state to error
      AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
      // Clear auth flags on error
      removeSessionFlagsOnError();
      throw error;
    }

    console.log(`[Auth] ${provider} sign in initiated`, data);
    
  } catch (error: any) {
    console.error(`[Auth] Sign in with ${provider} failed:`, error);
    toast.error(`Login with ${provider} failed: ${error.message}`);
    // Update auth state to error
    AuthStorage.setAuthState(AuthState.UNAUTHENTICATED);
    // Clear auth flags on error
    removeSessionFlagsOnError();
    throw error;
  }
};

function removeSessionFlagsOnError() {
  try {
    AuthStorage.removeAuthFlag('AUTH_IN_PROGRESS');
  } catch (err) {
    console.error('[Auth] Failed to clear auth session flags:', err);
  }
}

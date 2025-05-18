
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthSessionManager, { AuthFlowState } from './AuthSessionManager';

export const signInWithProvider = async (
  provider: 'discord' | 'twitch',
  redirectTo?: string
): Promise<void> => {
  console.log(`[Auth] Signing in with ${provider}, redirect: ${redirectTo || 'default'}`);
  
  try {
    // Update auth flow state
    AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_STARTED);
    
    // Set flags with automatic expiration as a safety mechanism
    AuthSessionManager.setAuthFlag('AUTH_STARTED', 'true', 5 * 60 * 1000); // 5 minutes max
    AuthSessionManager.setAuthFlag('AUTH_IN_PROGRESS', 'true', 5 * 60 * 1000); // 5 minutes max

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
      // Update auth flow state to error
      AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
      // Clear auth flags on error
      removeSessionFlagsOnError();
      throw error;
    }

    console.log(`[Auth] ${provider} sign in initiated`, data);
    
  } catch (error: any) {
    console.error(`[Auth] Sign in with ${provider} failed:`, error);
    toast.error(`Login with ${provider} failed: ${error.message}`);
    // Update auth flow state to error
    AuthSessionManager.setAuthFlowState(AuthFlowState.AUTH_ERROR);
    // Clear auth flags on error
    removeSessionFlagsOnError();
    throw error;
  }
};

function removeSessionFlagsOnError() {
  try {
    AuthSessionManager.removeAuthFlag('AUTH_STARTED');
    AuthSessionManager.removeAuthFlag('AUTH_IN_PROGRESS');
  } catch (err) {
    console.error('[Auth] Failed to clear auth session flags:', err);
  }
}

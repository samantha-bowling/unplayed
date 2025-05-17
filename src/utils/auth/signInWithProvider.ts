
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setSessionFlag } from '@/utils/auth-session-flags';

export const signInWithProvider = async (
  provider: 'discord' | 'twitch' | 'steam',
  redirectTo?: string
): Promise<void> => {
  console.log(`[Auth] Signing in with ${provider}, redirect: ${redirectTo || 'default'}`);
  
  try {
    // Set flags that we're starting an auth flow
    // This helps prevent demo mode flickering and other race conditions
    setSessionFlag('AUTH_STARTED');
    setSessionFlag('AUTH_IN_PROGRESS');

    // Make sure we have a valid redirect URL
    const normalizedRedirectTo = redirectTo || `${window.location.origin}/auth/callback`;
    console.log(`[Auth] Using redirect URL: ${normalizedRedirectTo}`);
    
    if (provider === 'steam') {
      // Custom redirect for Steam handled via Edge Function
      // Mark that this is a Steam login to help with returning users flow
      setSessionFlag('STEAM_AUTH_ATTEMPTED');
      
      const steamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?redirectTo=${encodeURIComponent(normalizedRedirectTo)}`;
      console.log(`[Auth] Redirecting to Steam auth: ${steamUrl}`);
      window.location.href = steamUrl;
      return;
    }

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
      // Clear auth flags on error
      removeSessionFlagsOnError();
      throw error;
    }

    console.log(`[Auth] ${provider} sign in initiated`, data);
    
  } catch (error: any) {
    console.error(`[Auth] Sign in with ${provider} failed:`, error);
    toast.error(`Login with ${provider} failed: ${error.message}`);
    // Clear auth flags on error
    removeSessionFlagsOnError();
    throw error;
  }
};

function removeSessionFlagsOnError() {
  try {
    sessionStorage.removeItem('authStarted');
    sessionStorage.removeItem('authInProgress');
  } catch (err) {
    console.error('Failed to clear auth session flags:', err);
  }
}

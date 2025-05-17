
// src/context/auth/actions.ts
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { signInWithProvider as baseSignInWithProvider } from '@/utils/auth/signInWithProvider';
import { removeSessionFlag, setSessionFlag } from '@/utils/auth-session-flags';

// Sign in with provider (Discord, Twitch)
export async function signInWithProvider(
  provider: 'discord' | 'twitch',
  setIsLoading: (loading: boolean) => void,
  setLastError: (error: any) => void,
  options?: { redirectTo?: string }
): Promise<void> {
  try {
    setIsLoading(true);
    await baseSignInWithProvider(provider, options?.redirectTo);
  } catch (error: any) {
    toast.error(`Login with ${provider} failed: ${error.message}`);
    setLastError({
      code: 'oauth_error',
      message: error.message,
      timestamp: Date.now(),
    });
  } finally {
    setIsLoading(false);
  }
}

// Sign in with email (magic link)
export async function signInWithEmail(
  email: string,
  setIsLoading: (loading: boolean) => void,
  setLastError: (error: any) => void
): Promise<void> {
  try {
    setIsLoading(true);
    setSessionFlag('AUTH_STARTED');
    
    const { error } = await supabase.auth.signInWithOtp({ email });
    
    if (error) throw error;
    
    toast.success('Check your email for a magic link!');
  } catch (error: any) {
    toast.error(`Magic link login failed: ${error.message}`);
    setLastError({
      code: 'email_login_error',
      message: error.message,
      timestamp: Date.now(),
    });
    removeSessionFlag('AUTH_STARTED');
  } finally {
    setIsLoading(false);
  }
}

// Sign out
export async function signOut(
  setAuthStatus: (status: any) => void,
  setAppAuthState: (state: any) => void,
  setSession: (session: any) => void,
  setUser: (user: any) => void,
  setProfile: (profile: any) => void
): Promise<void> {
  try {
    await supabase.auth.signOut();
    setAuthStatus('UNAUTHENTICATED');
    setAppAuthState('ANONYMOUS');
    setSession(null);
    setUser(null);
    setProfile(null);
    removeSessionFlag('JUST_LOGGED_IN');
    removeSessionFlag('AUTH_IN_PROGRESS');
    removeSessionFlag('AUTH_STARTED');
    
    toast.info('You have been signed out');
  } catch (error: any) {
    toast.error(`Sign out failed: ${error.message}`);
  }
}

// Session refresh
export async function refreshSession(
  setEnhancedStatus: (status: any) => void,
  setSession: (session: any) => void,
  setUser: (user: any) => void,
  setLastError: (error: any) => void
): Promise<any> {
  try {
    console.log('🔄 Refreshing session...');
    setEnhancedStatus('TOKEN_REFRESHING');
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('🔄 Failed to refresh session:', error.message);
      setLastError({
        code: 'session_refresh_error',
        message: error.message,
        timestamp: Date.now(),
      });
      setEnhancedStatus('TOKEN_REFRESH_ERROR');
      throw error;
    }
    
    if (!data.session) {
      console.warn('🔄 No session found during refresh');
      setEnhancedStatus('SESSION_NOT_FOUND');
      return null;
    }
    
    console.log('🔄 Session refreshed successfully');
    setSession(data.session);
    setUser(data.session.user);
    setEnhancedStatus('SESSION_FOUND');
    return data.session;
  } catch (error: any) {
    console.error('🔄 Failed to refresh session:', error.message);
    setLastError({
      code: 'session_refresh_error',
      message: error.message,
      timestamp: Date.now(),
    });
    setEnhancedStatus('TOKEN_REFRESH_ERROR');
    return null;
  }
}

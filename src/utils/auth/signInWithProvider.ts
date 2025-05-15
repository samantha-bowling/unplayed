
import { supabase } from '@/integrations/supabase/client';

export const signInWithProvider = async (
  provider: 'discord' | 'twitch' | 'steam',
  redirectTo?: string
): Promise<void> => {
  if (provider === 'email') {
    throw new Error('Email login should use signInWithEmail instead.');
  }

  if (provider === 'steam') {
    // Custom redirect for Steam handled via Edge Function
    const steamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?redirectTo=${encodeURIComponent(redirectTo || `${window.location.origin}/auth/callback`)}`;
    window.location.href = steamUrl;
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }
};

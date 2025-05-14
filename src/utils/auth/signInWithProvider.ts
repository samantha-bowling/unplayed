// src/utils/auth/signInWithProvider.ts

import { supabase } from '@/integrations/supabase/client'

export async function signInWithProvider(provider: 'email' | 'discord' | 'twitch') {
  if (provider === 'email') {
    throw new Error('Use a separate email sign-in function. This utility handles OAuth providers only.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + '/auth/callback',
    },
  });

  if (error) {
    console.error(`[signInWithProvider] OAuth error with ${provider}:`, error);
    throw error;
  }
}

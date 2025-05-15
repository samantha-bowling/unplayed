
// src/utils/auth/signInWithProvider.ts

import { supabase } from '@/integrations/supabase/client'

export function getRedirectUrl(customRedirectTo?: string): string {
  // Get the base URL (either the current origin or a specified URL)
  const baseUrl = customRedirectTo || window.location.origin;
  return `${baseUrl}/auth/callback`;
}

export async function signInWithProvider(provider: 'discord' | 'twitch', redirectTo?: string) {
  if (provider === 'email') {
    throw new Error('Use a separate email sign-in function. This utility handles OAuth providers only.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectUrl(redirectTo),
    },
  });

  if (error) {
    console.error(`[signInWithProvider] OAuth error with ${provider}:`, error);
    throw error;
  }
}

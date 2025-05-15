

// src/utils/auth/signInWithProvider.ts

import { supabase } from '@/integrations/supabase/client'

// Define supported providers
export type AuthProvider = 'discord' | 'twitch';

export function getRedirectUrl(customRedirectTo?: string): string {
  // Get the base URL (either the current origin or a specified URL)
  const baseUrl = customRedirectTo || window.location.origin;
  return `${baseUrl}/auth/callback`;
}

export async function signInWithProvider(provider: AuthProvider, redirectTo?: string) {
  // More type-safe check compared to string equality with 'email'
  // (email is not in the AuthProvider type, so this comparison would never match)
  
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


import { createBrowserClient } from "@supabase/ssr";
import { createClient as createServerClient } from "@supabase/supabase-js";

const isBrowser = typeof window !== "undefined";

const SUPABASE_URL = "https://supabase.unplayed.wtf";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const createClient = () => {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
};

export const supabase = isBrowser ? createClient() : undefined;

// Server-side usage (if needed)
export const createAdminClient = () => {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

import type { SupabaseClient } from '@supabase/supabase-js';

function is401(err: unknown) {
  return typeof err === 'object' && err !== null && 'status' in err && (err as any).status === 401;
}

export async function withSession<T>(
  supabase: SupabaseClient,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (is401(e)) {
      // Best-effort refresh then single retry
      await supabase.auth.refreshSession().catch(() => {});
      return await fn();
    }
    throw e;
  }
}
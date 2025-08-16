import { supabase } from '@/integrations/supabase/client';
import { withSession } from './withSession';

/**
 * Generic helper for calling Supabase Edge Functions with auth.
 */
export async function callSupabaseFunction<T = any>(
  name: string,
  payload: Record<string, any>,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  return withSession(supabase, async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error('Unauthorized: No Supabase session found');
    }

    const res = await fetch(`https://gwmygthanyycveyqqspr.functions.supabase.co/${name}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: method === 'POST' ? JSON.stringify(payload) : undefined,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error(err?.error || `Function ${name} failed: ${res.status}`);
      (error as any).status = res.status;
      throw error;
    }

    return res.json();
  });
}

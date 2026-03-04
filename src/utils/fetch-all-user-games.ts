import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 1000;

/**
 * Fetches ALL user_games rows for a user, paginating in chunks of 1000
 * to avoid the Supabase default row limit.
 */
export async function fetchAllUserGames(
  userId: string,
  select: string,
  orderBy?: { column: string; ascending: boolean }
) {
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('user_games')
      .select(select)
      .eq('user_id', userId)
      .range(from, to);

    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      allData = allData.concat(data);
    }

    hasMore = (data?.length ?? 0) === PAGE_SIZE;
    page++;
  }

  return allData;
}

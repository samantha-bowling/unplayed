// src/utils/auth/callUpsertUser.ts

export const callUpsertUser = async (user: any) => {
  try {
    const response = await fetch('https://supabase.unplayed.wtf/functions/v1/upsert-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[callUpsertUser] Upsert failed:', error);
      throw new Error(error.message || 'Failed to upsert user');
    }

    const data = await response.json();
    console.log('[callUpsertUser] Upsert successful:', data);
    return data;
  } catch (err: any) {
    console.error('[callUpsertUser] Unexpected error:', err);
    throw err;
  }
};


// src/utils/auth/callUpsertUser.ts

export type UpsertUserPayload = {
  id: string;
  steam_id: string;
  steam_name: string;
  steam_avatar?: string;
  onboarding_complete?: boolean;
};

export async function callUpsertUser(payload: UpsertUserPayload) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upsert-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('🔴 Upsert failed:', result.error);
      throw new Error(result.error || 'Unknown error while upserting user');
    }

    return result.user;
  } catch (err: any) {
    console.error('❌ callUpsertUser error:', err);
    throw err;
  }
}

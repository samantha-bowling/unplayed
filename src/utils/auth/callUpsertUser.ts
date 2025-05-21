
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
    console.log('🔄 Calling upsert-user with payload:', payload);
    
    // Use the Netlify redirect path instead of direct Supabase function URL
    const response = await fetch(`/api/upsert-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('📥 Upsert user response:', result);

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

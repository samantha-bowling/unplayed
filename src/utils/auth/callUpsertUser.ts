import { devLog } from '../../lib/dev-log';

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
    devLog('🔄 Calling upsert-user with payload:', payload);
    
    // Get auth session for JWT token
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('❌ No active session found');
      throw new Error('Authentication required to update user profile');
    }
    
    const response = await fetch(`https://gwmygthanyycveyqqspr.supabase.co/functions/v1/upsert-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bXlndGhhbnl5Y3ZleXFxc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTAxMjUsImV4cCI6MjA2MjMyNjEyNX0.zrL5sYy8LE4ErMRL-W-yuZZR10EYyrgIS9Kj-EfUw80',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    devLog('📥 Upsert user response:', result);

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

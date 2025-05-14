// src/utils/auth/callUpsertUser.ts

import { supabase } from '@/integrations/supabase/client'

export async function callUpsertUser(): Promise<void> {
  const session = (await supabase.auth.getSession()).data.session
  if (!session?.user) throw new Error('User session not found')

  const { id, user_metadata } = session.user

  const steamId = user_metadata?.steam_id || null
  const personaName = user_metadata?.full_name || user_metadata?.name || user_metadata?.user_name || null
  const avatar = user_metadata?.avatar_url || user_metadata?.picture || null

  if (!personaName || !avatar) {
    console.warn('[callUpsertUser] Missing personaName or avatar for user:', id)
  }

  const response = await fetch('/functions/v1/upsert-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: id,
      steamId,
      personaName,
      avatar,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`[callUpsertUser] Failed to upsert user: ${error}`)
  }

  console.log('[callUpsertUser] Successfully upserted user', id)
}

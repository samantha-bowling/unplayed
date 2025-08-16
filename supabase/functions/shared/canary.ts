// Canary rollout system for Steam client v2

export function isCanaryEnabledForUser(userId: string | null | undefined): boolean {
  const mode = Deno.env.get("STEAM_CLIENT_V2") || "off"; // off | canary | on
  
  if (mode === "on") return true;
  if (mode === "off") return false;
  if (!userId) return false;

  // ~10% bucket based on user ID hash
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  
  return Math.abs(hash) % 10 === 0;
}

/**
 * Get Steam client based on canary flag
 */
export function getSteamClientForUser(userId: string | null | undefined) {
  return isCanaryEnabledForUser(userId) ? 'v2' : 'legacy';
}

/**
 * Log canary decision for debugging
 */
export function logCanaryDecision(userId: string | null | undefined, endpoint: string) {
  const enabled = isCanaryEnabledForUser(userId);
  const mode = Deno.env.get("STEAM_CLIENT_V2") || "off";
  
  console.log(`Canary decision: ${endpoint} - User: ${userId?.slice(0, 8)}... - Mode: ${mode} - Using: ${enabled ? 'v2' : 'legacy'}`);
  
  return enabled;
}
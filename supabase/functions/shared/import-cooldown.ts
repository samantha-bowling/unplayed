// Per-user import cooldown guard (server-side only)

const USER_IMPORT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// In-memory cooldown tracking (could be moved to Redis or DB for multi-instance)
const userCooldowns = new Map<string, number>();

/**
 * Check if user can perform import operation
 */
export function canUserImport(userId: string): boolean {
  const lastImport = userCooldowns.get(userId);
  if (!lastImport) return true;
  
  const timeSinceLastImport = Date.now() - lastImport;
  return timeSinceLastImport >= USER_IMPORT_COOLDOWN_MS;
}

/**
 * Get remaining cooldown time in seconds
 */
export function getUserImportCooldown(userId: string): number {
  const lastImport = userCooldowns.get(userId);
  if (!lastImport) return 0;
  
  const timeSinceLastImport = Date.now() - lastImport;
  const remainingMs = USER_IMPORT_COOLDOWN_MS - timeSinceLastImport;
  
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

/**
 * Mark user as having performed import
 */
export function markUserImportAttempt(userId: string): void {
  userCooldowns.set(userId, Date.now());
  
  // Clean up old entries (older than 2x cooldown period)
  const cutoff = Date.now() - (USER_IMPORT_COOLDOWN_MS * 2);
  for (const [uid, timestamp] of userCooldowns.entries()) {
    if (timestamp < cutoff) {
      userCooldowns.delete(uid);
    }
  }
}

/**
 * Check and enforce import cooldown
 */
export function enforceImportCooldown(userId: string): { allowed: boolean; remainingSeconds: number } {
  const allowed = canUserImport(userId);
  const remainingSeconds = getUserImportCooldown(userId);
  
  if (allowed) {
    markUserImportAttempt(userId);
  }
  
  return { allowed, remainingSeconds };
}
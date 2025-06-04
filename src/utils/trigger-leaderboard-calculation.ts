
import { callSupabaseFunction } from './supabase-functions';

/**
 * Manually trigger the leaderboard calculation
 */
export async function triggerLeaderboardCalculation(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('Triggering manual leaderboard calculation...');
    
    const result = await callSupabaseFunction('trigger-leaderboard-calculation', {});
    
    console.log('Leaderboard calculation result:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error triggering leaderboard calculation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

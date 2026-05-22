import { callSupabaseFunction } from './supabase-functions';
import { devLog } from '../lib/dev-log';

export interface FixMetadataOptions {
  dryRun?: boolean;
  prioritizeUserGames?: boolean;
}

export interface FixMetadataResponse {
  success?: boolean;
  message: string;
  dryRun?: boolean;
  inconsistentCount: number;
  userOwnedCount: number;
  otherGamesCount?: number;
  totalQueued?: number;
  totalErrors?: number;
  wouldQueue?: number;
  sampleGames?: Array<{
    id: number;
    name: string;
    priority: number;
  }>;
  nextSteps?: string[];
}

/**
 * Fix inconsistent game metadata by re-queueing games for Steam Store API updates
 */
export async function fixInconsistentMetadata(
  options: FixMetadataOptions = {}
): Promise<FixMetadataResponse> {
  const { dryRun = false, prioritizeUserGames = true } = options;
  
  devLog(`[fixInconsistentMetadata] Starting ${dryRun ? 'dry run' : 'live'} metadata fix`);
  
  try {
    const result = await callSupabaseFunction<FixMetadataResponse>(
      'fix-inconsistent-metadata',
      {
        dryRun,
        prioritizeUserGames
      }
    );
    
    devLog('[fixInconsistentMetadata] Result:', result);
    return result;
  } catch (error) {
    console.error('[fixInconsistentMetadata] Error:', error);
    throw new Error(`Failed to fix metadata: ${error.message}`);
  }
}

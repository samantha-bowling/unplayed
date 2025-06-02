
import { useCallback } from 'react';
import { useRefreshCooldown } from './useRefreshCooldown';
import { useRefreshCache } from './useRefreshCache';
import { useRefreshState } from './useRefreshState';
import { useRefreshAuth } from './useRefreshAuth';
import { useToast } from '@/hooks/use-toast';
import { callSupabaseFunction } from '@/utils/supabase-functions';

export const useLibraryImport = () => {
  const { 
    canPerformOperation, 
    markOperationPerformed, 
    showCooldownToast,
    getRemainingCooldown,
    timestamps 
  } = useRefreshCooldown();
  
  const { invalidateCacheDelayed } = useRefreshCache();
  const { setOperationLoading, isOperationLoading } = useRefreshState(['import']);
  const { validateUserOperation } = useRefreshAuth();
  const { toast } = useToast();

  const importLibrary = useCallback(async (steamId: string) => {
    // Validate user can perform operation
    if (!validateUserOperation('Import Library')) {
      return;
    }

    // Check cooldown
    if (!canPerformOperation('import')) {
      showCooldownToast('Import');
      return;
    }

    setOperationLoading('import', true);

    try {
      console.log('🚀 Starting smart library import...');
      
      const data = await callSupabaseFunction('import-library', {
        steamId: steamId,
      });

      if (data.success) {
        markOperationPerformed('import');
        
        toast({
          title: `Import ${data.status === 'complete' ? 'completed' : 'started'}`,
          description: data.status === 'complete' 
            ? `Successfully imported ${data.imported || 0} new games and updated ${data.updated || 0} existing games.`
            : `Found ${data.totalGames || 0} games. Processing ${data.newGamesFound || 0} new games in background.`
        });

        // Invalidate unplayed and library caches after import
        invalidateCacheDelayed('unplayed', 1000);

        return data;
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setOperationLoading('import', false);
    }
  }, [validateUserOperation, canPerformOperation, showCooldownToast, setOperationLoading, markOperationPerformed, invalidateCacheDelayed, toast]);

  return {
    importLibrary,
    isImporting: isOperationLoading('import'),
    canImport: canPerformOperation('import'),
    getRemainingCooldown: () => getRemainingCooldown('import'),
    lastImport: timestamps.import,
  };
};

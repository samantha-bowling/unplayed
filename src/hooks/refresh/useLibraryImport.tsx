import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRefreshCooldown } from './useRefreshCooldown';
import { useRefreshCache } from './useRefreshCache';
import { useRefreshAuth } from './useRefreshAuth';
import { useToast } from '@/hooks/use-toast';
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { supabase } from '@/integrations/supabase/client';
import { withSession } from '@/utils/withSession';

export const useLibraryImport = () => {
  const { 
    canPerformOperation, 
    markOperationPerformed, 
    showCooldownToast,
    getRemainingCooldown,
    timestamps 
  } = useRefreshCooldown();
  
  const { invalidateCacheDelayed } = useRefreshCache();
  const { validateUserOperation } = useRefreshAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ['library-import'],
    mutationFn: async (steamId: string) => {
      return withSession(supabase, async () => {
        const data = await callSupabaseFunction('import-library', {
          steamId: steamId,
        });
        return data;
      });
    },
    onSuccess: async (data) => {
      markOperationPerformed('import');
      
      // Detect partial failures based on warnings
      const hasWarnings = data.warnings && data.warnings.length > 0;
      const hasCalculationFailures = hasWarnings && 
        data.warnings.some(warning => 
          warning.includes('calculation') || 
          warning.includes('metrics') || 
          warning.includes('dashboard')
        );

      if (hasCalculationFailures) {
        toast({
          title: `Import ${data.status === 'complete' ? 'completed' : 'started'}`,
          description: data.status === 'complete' 
            ? `Successfully imported ${data.imported || 0} new games and updated ${data.updated || 0} existing games. Dashboard metrics are calculating in the background - refresh your dashboard in 2-3 minutes for updated stats.`
            : `Found ${data.totalGames || 0} games. Processing ${data.newGamesFound || 0} new games in background. Dashboard metrics will calculate automatically - refresh your dashboard in a few minutes for updated stats.`
        });
      } else if (hasWarnings) {
        toast({
          title: `Import ${data.status === 'complete' ? 'completed' : 'started'}`,
          description: data.status === 'complete' 
            ? `Successfully imported ${data.imported || 0} new games and updated ${data.updated || 0} existing games. ${data.warnings[0]}`
            : `Found ${data.totalGames || 0} games. Processing ${data.newGamesFound || 0} new games in background. ${data.warnings[0]}`
        });
      } else {
        toast({
          title: `Import ${data.status === 'complete' ? 'completed' : 'started'}`,
          description: data.status === 'complete' 
            ? `Successfully imported ${data.imported || 0} new games and updated ${data.updated || 0} existing games.`
            : `Found ${data.totalGames || 0} games. Processing ${data.newGamesFound || 0} new games in background.`
        });
      }

      // Fire-and-forget cache invalidation
      (async () => {
        try {
          // Invalidate only what the import affects
          queryClient.invalidateQueries({ predicate: q => {
            const k0 = q.queryKey[0];
            return k0 === 'library' || k0 === 'counts' || k0 === 'metadata' || k0 === 'spend' || k0 === 'unplayed';
          }});
          
          // Invalidate unplayed and library caches after import
          invalidateCacheDelayed('unplayed', 1000);
          
          toast({
            title: "Data refreshed",
            description: "Your dashboard has been updated with the latest information."
          });
        } catch (e) {
          console.error('cache-invalidation-after-import', e);
          toast({
            title: "Import succeeded",
            description: "Your games were imported, but dashboard refresh failed. Use Manual Refresh.",
            variant: "destructive"
          });
        }
      })().catch(() => {});
    },
    onError: (error: unknown) => {
      console.error('library-import', error);
      const errorMessage = error instanceof Error ? error.message : "Please try again later.";
      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive"
      });
    },
    onSettled: () => {
      // Guarantees UI cleanup even if refresh throws
    },
  });

  const importLibrary = async (steamId: string) => {
    // Validate user can perform operation
    if (!validateUserOperation('Import Library')) {
      return;
    }

    // Check cooldown
    if (!canPerformOperation('import')) {
      showCooldownToast('Import');
      return;
    }

    return mutation.mutateAsync(steamId);
  };

  return {
    importLibrary,
    isImporting: mutation.isPending,
    canImport: canPerformOperation('import'),
    getRemainingCooldown: () => getRemainingCooldown('import'),
    lastImport: timestamps.import,
  };
};

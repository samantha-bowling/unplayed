import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, BarChart, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AdminLayout from '@/layouts/AdminLayout';
import ProcessingFooter from "@/components/admin/ProcessingFooter";
import BatchProcessingControls from "@/components/admin/BatchProcessingControls";
import AdminStatsCard from "@/components/admin/AdminStatsCard";
import { useBatchProcessor } from "@/hooks/use-batch-processor";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { StatItem } from "@/components/admin/AdminStatsCard";
import { fixInconsistentMetadata, FixMetadataOptions, FixMetadataResponse } from "@/utils/fix-metadata";

// Define TypeScript interfaces for better type safety
interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

interface SyncData {
  id: string;
  last_sync: string;
  processed_apps: number;
  total_apps: number;
  status: string;
}

// Response type for the Steam processing function
interface SteamProcessResponse {
  processedCount?: number;
  success?: boolean;
  message?: string;
  lastProcessedId?: number;
  complete?: boolean;
}

const AdminSteamDataPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(10);
  const [lastSync, setLastSync] = useState<SyncData | null>(null);
  const [metadataResult, setMetadataResult] = useState<FixMetadataResponse | null>(null);
  const [isFixingMetadata, setIsFixingMetadata] = useState(false);

  // Fetch queue statistics
  const fetchQueueStats = useCallback(async (): Promise<QueueStats> => {
    try {
      // First try to use edge function
      const { data: statusCounts, error: functionError } = await supabase.functions.invoke(
        'get-queue-stats-by-status'
      );
      
      if (functionError) {
        console.error("Edge function error:", functionError);
        // Fallback to direct counts
        return await fetchQueueStatsDirectly();
      }
      
      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from("steam_app_queue")
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error("Error fetching total count:", countError);
        throw countError;
      }

      // Get the most recent sync record
      const { data: syncData, error: syncError } = await supabase
        .from("steam_app_sync")
        .select('*')
        .order('last_sync', { ascending: false })
        .limit(1)
        .single();

      if (syncError && syncError.code !== 'PGRST116') {
        // PGRST116 is the "No rows returned" error - this is fine for first run
        console.error("Error fetching sync data:", syncError);
      } else if (syncData) {
        setLastSync(syncData);
      }
      
      // Process the statistics from the Edge function
      // Initialize with zeros
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: totalCount || 0
      };

      // Map the Edge function results to our stats object
      if (statusCounts && Array.isArray(statusCounts)) {
        statusCounts.forEach((item: { status: string; count: number }) => {
          if (item.status in stats) {
            stats[item.status as keyof QueueStats] = item.count;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error("Error in fetchQueueStats:", error);
      toast.error("Failed to load queue statistics");
      // Attempt direct counting as fallback
      return await fetchQueueStatsDirectly();
    }
  }, []);

  // Fallback method that counts each status individually
  const fetchQueueStatsDirectly = async (): Promise<QueueStats> => {
    try {
      console.log("Using fallback direct counting method");
      
      // Get total count
      const { count: totalCount, error: totalError } = await supabase
        .from("steam_app_queue")
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      // Count each status individually
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: totalCount || 0
      };
      
      // Execute count queries for each status
      for (const status of statuses) {
        const { count, error } = await supabase
          .from("steam_app_queue")
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        
        if (!error && count !== null) {
          stats[status as keyof QueueStats] = count;
        }
      }
      
      // Get the most recent sync record
      const { data: syncData, error: syncError } = await supabase
        .from("steam_app_sync")
        .select('*')
        .order('last_sync', { ascending: false })
        .limit(1)
        .single();
      
      if (!syncError && syncData) {
        setLastSync(syncData);
      }
      
      return stats;
    } catch (error) {
      console.error("Error in direct count fallback:", error);
      toast.error("Failed to load queue statistics using fallback method");
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };
    }
  };

  // Use our shared hooks for stats and batch processing
  const { stats, isLoading: statsLoading, fetchStats } = useAdminStats<QueueStats>(fetchQueueStats);
  
  const appProcessor = useBatchProcessor<SteamProcessResponse>({
    processingFunction: async (options) => {
      return supabase.functions.invoke("fetch-steam-app-details", {
        body: { processBatch: true, batchSize: options.batchSize || batchSize }
      }).then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
    },
    onSuccess: () => {
      fetchStats();
    },
    continuousInterval: 2000 // 2 second delay between batches in continuous mode
  });

  // Fetch the Steam app list
  const fetchSteamAppList = async () => {
    try {
      setIsLoading(true);
      toast.info("Fetching Steam app list...");
      
      const { data, error } = await supabase.functions.invoke("fetch-steam-app-list");
      
      if (error) {
        console.error("Error fetching Steam app list:", error);
        toast.error("Failed to fetch Steam app list");
        setIsLoading(false);
        return;
      }
      
      toast.success("Steam app list fetch initiated successfully!");
      console.log("App list fetch response:", data);
      
      // Reload stats after a short delay
      setTimeout(() => {
        fetchStats();
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      console.error("Error calling app list function:", err);
      toast.error("Error occurred while fetching app list");
      setIsLoading(false);
    }
  };

  // Fix inconsistent metadata function
  const handleFixInconsistentMetadata = async (dryRun: boolean = true) => {
    try {
      setIsFixingMetadata(true);
      
      if (dryRun) {
        toast.info("Analyzing games with inconsistent metadata...");
      } else {
        toast.info("Fixing inconsistent metadata - re-queueing games...");
      }

      const options: FixMetadataOptions = {
        dryRun,
        prioritizeUserGames: true
      };

      const result = await fixInconsistentMetadata(options);
      setMetadataResult(result);

      if (dryRun) {
        toast.success(`Analysis complete! Found ${result.inconsistentCount} games with inconsistent metadata`);
      } else {
        toast.success(`Successfully queued ${result.totalQueued} games for metadata update!`);
        // Refresh stats after queueing
        setTimeout(() => {
          fetchStats();
        }, 2000);
      }

      console.log('Metadata fix result:', result);

    } catch (err) {
      console.error('Error fixing metadata:', err);
      toast.error(`Error: ${err.message || 'Failed to fix metadata'}`);
    } finally {
      setIsFixingMetadata(false);
    }
  };

  // Convert our stats object to the format expected by AdminStatsCard
  const getStatItems = (): StatItem[] => {
    if (!stats) return [];
    
    return [
      { key: "pending", label: "Pending", value: stats.pending },
      { key: "processing", label: "Processing", value: stats.processing },
      { key: "completed", label: "Completed", value: stats.completed },
      { key: "failed", label: "Failed", value: stats.failed },
      { key: "total", label: "Total", value: stats.total },
    ];
  };

  return (
    <div className="container py-24 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Steam Data Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" /> 
              Steam App Catalog
            </CardTitle>
            <CardDescription>
              Fetch and update the Steam application catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                This will fetch the complete list of applications from Steam and queue them for processing.
              </p>
              {lastSync && (
                <div className="text-sm">
                  <p><span className="font-medium">Last Sync:</span> {new Date(lastSync.last_sync).toLocaleString()}</p>
                  <p><span className="font-medium">Status:</span> {lastSync.status}</p>
                  <p><span className="font-medium">Apps Processed:</span> {lastSync.processed_apps} / {lastSync.total_apps}</p>
                  
                  {lastSync.total_apps > 0 && (
                    <Progress 
                      className="mt-2" 
                      value={lastSync.processed_apps / lastSync.total_apps * 100} 
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardHeader className="pt-0">
            <ProcessingFooter
              isProcessing={isLoading}
              onProcess={fetchSteamAppList}
              processText="Fetch Steam App List"
              processingText="Fetching..."
            />
          </CardHeader>
        </Card>

        <AdminStatsCard
          title="Queue Statistics"
          description="Current status of the Steam app processing queue"
          icon={<BarChart className="h-5 w-5" />}
          stats={getStatItems()}
          onRefresh={fetchStats}
          isLoading={statsLoading}
          footerContent={
            <ProcessingFooter
              isProcessing={appProcessor.isProcessing}
              onProcess={() => appProcessor.processBatch({ batchSize })}
              processText={`Process Next Batch (${batchSize})`}
              processingText="Processing..."
              disabled={!stats || stats.pending === 0}
            />
          }
        />
      </div>

      {/* New Metadata Consistency Card */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="mr-2 h-5 w-5" />
              Metadata Consistency
            </CardTitle>
            <CardDescription>
              Fix games with inconsistent image metadata by re-queueing them for Steam Store API updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="text-gray-400">
                This will identify games that have image_url but missing header_image, then re-queue them 
                for processing with the updated Steam Store API logic to ensure consistent metadata.
              </p>
              <p className="text-gray-400">
                User-owned games will be prioritized for faster processing.
              </p>
            </div>

            {metadataResult && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">
                  {metadataResult.dryRun ? 'Analysis Results' : 'Fix Results'}
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Inconsistent Games</p>
                    <p className="font-bold text-lg">{metadataResult.inconsistentCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User-Owned</p>
                    <p className="font-bold text-lg text-green-600">{metadataResult.userOwnedCount}</p>
                  </div>
                  {metadataResult.dryRun ? (
                    <div>
                      <p className="text-muted-foreground">Would Queue</p>
                      <p className="font-bold text-lg text-blue-600">{metadataResult.wouldQueue || 0}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-muted-foreground">Queued</p>
                        <p className="font-bold text-lg text-blue-600">{metadataResult.totalQueued || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Errors</p>
                        <p className="font-bold text-lg text-red-600">{metadataResult.totalErrors || 0}</p>
                      </div>
                    </>
                  )}
                </div>

                {metadataResult.sampleGames && metadataResult.sampleGames.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Sample games to be processed:</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {metadataResult.sampleGames.slice(0, 5).map((game, index) => (
                        <div key={index} className="text-xs p-2 bg-background rounded flex justify-between">
                          <span className="truncate">{game.name}</span>
                          <span className="text-muted-foreground ml-2">Priority: {game.priority}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {metadataResult.nextSteps && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Next Steps:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {metadataResult.nextSteps.map((step, index) => (
                        <li key={index}>• {step}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardHeader className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <ProcessingFooter
                isProcessing={isFixingMetadata}
                onProcess={() => handleFixInconsistentMetadata(true)}
                processText="Analyze Metadata (Dry Run)"
                processingText="Analyzing..."
              />
              <ProcessingFooter
                isProcessing={isFixingMetadata}
                onProcess={() => handleFixInconsistentMetadata(false)}
                processText="Fix Metadata (Live)"
                processingText="Fixing..."
              />
            </div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Controls</CardTitle>
          <CardDescription>
            Manage the Steam data processing workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BatchProcessingControls
            batchSize={batchSize}
            onBatchSizeChange={setBatchSize}
            batchSizeMin={5}
            batchSizeMax={50}
            batchSizeStep={5}
            showWarningThreshold={30}
            warningMessage="Higher risk of rate limiting"
            continuousMode={appProcessor.continuousMode}
            processedCount={appProcessor.processedCount}
            lastProcessedId={appProcessor.lastProcessedId}
            processComplete={appProcessor.processComplete}
          />
          
          <ProcessingFooter
            isProcessing={appProcessor.isProcessing}
            onProcess={() => appProcessor.processBatch({ batchSize })}
            processText={`Process Batch (${batchSize} Games)`}
            processingText="Processing..."
            disabled={appProcessor.processComplete || !stats || stats.pending === 0}
            continuousMode={appProcessor.continuousMode}
            onToggleContinuous={appProcessor.toggleContinuousMode}
            continuousText="Enable Continuous Processing"
            stopContinuousText="Pause Continuous Processing"
            continuousDisabled={appProcessor.processComplete || !stats || stats.pending === 0}
            onReset={appProcessor.resetProcessor}
            resetDisabled={appProcessor.isProcessing || (appProcessor.lastProcessedId === 0 && appProcessor.processedCount === 0)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSteamDataPage;

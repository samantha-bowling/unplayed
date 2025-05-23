
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BarChart, AlertTriangle, AlertCircle, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from '@/layouts/AdminLayout';
import AdminStatsCard, { StatItem } from "@/components/admin/AdminStatsCard";
import BatchProcessingControls from "@/components/admin/BatchProcessingControls";
import ProcessingFooter from "@/components/admin/ProcessingFooter";
import { useBatchProcessor } from "@/hooks/use-batch-processor";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Define TypeScript interfaces for better type safety
interface HltbStats {
  total: number;
  withEstimates: number;
  withoutEstimates: number;
  percentCoverage: number;
}

// Response type for the HLTB processing function
interface HltbProcessResponse {
  processedCount: number;
  successCount: number;
  errorCount: number;
  lastProcessedId: number;
  complete: boolean;
  results: any[];
  debug?: {
    foundGames: number;
    batchesProcessed: number;
    authPresent: boolean;
  };
}

// Response type for the HLTB prioritization function
interface HltbPrioritizeResponse {
  processed: number;
  found: number;
  prioritized: number;
  gamesWithData: Array<{
    id: number;
    name: string;
    hltb_name: string;
  }>;
}

const AdminHltbDataPage = () => {
  const [batchSize, setBatchSize] = useState(5);
  const [processLimit, setProcessLimit] = useState(50);
  const [lastError, setLastError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [priorityResults, setPriorityResults] = useState<HltbPrioritizeResponse | null>(null);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [priorityLimit, setPriorityLimit] = useState(100);

  // Fetch HLTB statistics
  const fetchHltbStats = useCallback(async (): Promise<HltbStats> => {
    console.log('[AdminHltbDataPage] Fetching HLTB stats');
    try {
      // Get total games count
      const { count: totalCount, error: totalError } = await supabase
        .from("games")
        .select('*', { count: 'exact', head: true });
      
      if (totalError) {
        console.error('[AdminHltbDataPage] Error fetching total games:', totalError);
        throw totalError;
      }
      
      // Get count of games with HLTB estimates
      const { count: withEstimatesCount, error: estimatesError } = await supabase
        .from("game_estimates")
        .select('*', { count: 'exact', head: true });
      
      if (estimatesError) {
        console.error('[AdminHltbDataPage] Error fetching game estimates count:', estimatesError);
        throw estimatesError;
      }
      
      // Calculate statistics
      const withoutEstimates = totalCount! - withEstimatesCount!;
      const percentCoverage = totalCount! > 0 
        ? Math.round((withEstimatesCount! / totalCount!) * 100) 
        : 0;
      
      const stats = {
        total: totalCount || 0,
        withEstimates: withEstimatesCount || 0,
        withoutEstimates,
        percentCoverage
      };
      
      console.log('[AdminHltbDataPage] HLTB stats fetched successfully:', stats);
      return stats;
    } catch (error) {
      console.error('[AdminHltbDataPage] Error in fetchHltbStats:', error);
      throw error;
    }
  }, []);

  const { stats, isLoading, fetchStats } = useAdminStats<HltbStats>(fetchHltbStats);
  
  const hltbProcessor = useBatchProcessor<HltbProcessResponse>({
    processingFunction: async (options) => {
      console.log('[AdminHltbDataPage] Processing function called with options:', options);
      setLastError(null); // Clear previous errors
      setDebugInfo(null); // Clear previous debug info
      
      try {
        console.log('[AdminHltbDataPage] Making request to backfill-hltb-estimates...');
        
        const { data, error } = await supabase.functions.invoke("backfill-hltb-estimates", {
          body: options
        });
        
        console.log('[AdminHltbDataPage] Function response received:', { data, error });
        
        if (error) {
          console.error('[AdminHltbDataPage] Supabase function error:', error);
          const errorMessage = `Function error: ${error.message || 'Unknown error'}`;
          setLastError(errorMessage);
          throw new Error(errorMessage);
        }
        
        if (!data) {
          console.error('[AdminHltbDataPage] No data returned from function');
          const errorMessage = 'No data returned from processing function';
          setLastError(errorMessage);
          throw new Error(errorMessage);
        }
        
        // Store debug information
        if (data.debug) {
          setDebugInfo(data.debug);
          console.log('[AdminHltbDataPage] Debug info:', data.debug);
        }
        
        console.log('[AdminHltbDataPage] Processing function completed successfully:', data);
        return data;
      } catch (err) {
        console.error('[AdminHltbDataPage] Error in processing function:', err);
        const errorMessage = err.message || 'Unknown error occurred';
        setLastError(errorMessage);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('[AdminHltbDataPage] Processing successful:', data);
      
      const message = data.successCount > 0 
        ? `Processed ${data.processedCount} games (${data.successCount} successes, ${data.errorCount} errors)`
        : `Processed ${data.processedCount} games - no successful HLTB matches found`;
      
      if (data.successCount > 0) {
        toast.success(message);
      } else {
        toast.info(message);
      }
      
      // If complete, refresh stats
      if (data.complete) {
        console.log('[AdminHltbDataPage] Processing complete, refreshing stats');
        fetchStats();
      }
    },
    onError: (error) => {
      console.error('[AdminHltbDataPage] Processing error:', error);
      const errorMessage = error?.message || 'An unknown error occurred during processing';
      setLastError(errorMessage);
      toast.error(`Processing failed: ${errorMessage}`);
    },
    continuousInterval: 5000
  });

  const statsItems: StatItem[] = stats ? [
    { key: 'total', label: 'Total Games', value: stats.total.toLocaleString() },
    { key: 'withEstimates', label: 'Games with HLTB Estimates', value: stats.withEstimates.toLocaleString() },
    { key: 'withoutEstimates', label: 'Games without HLTB Estimates', value: stats.withoutEstimates.toLocaleString() },
    { key: 'percentCoverage', label: 'Coverage', value: `${stats.percentCoverage}%` }
  ] : [];

  const handleProcessBatch = useCallback(() => {
    console.log('[AdminHltbDataPage] Process batch button clicked');
    setLastError(null); // Clear previous errors
    setDebugInfo(null); // Clear previous debug info
    
    hltbProcessor.processBatch({
      batchSize: batchSize,
      limit: processLimit
    });
  }, [hltbProcessor, batchSize, processLimit]);

  const handlePrioritizeHltbGames = useCallback(async () => {
    console.log('[AdminHltbDataPage] Prioritize HLTB games button clicked');
    setLastError(null);
    setIsPrioritizing(true);
    setPriorityResults(null);
    
    try {
      console.log('[AdminHltbDataPage] Making request to prioritize-hltb-games...');
      
      const { data, error } = await supabase.functions.invoke("prioritize-hltb-games", {
        body: { limit: priorityLimit }
      });
      
      if (error) {
        console.error('[AdminHltbDataPage] Function error:', error);
        setLastError(`Error prioritizing games: ${error.message}`);
        toast.error(`Failed to prioritize games: ${error.message}`);
        return;
      }
      
      console.log('[AdminHltbDataPage] Prioritization successful:', data);
      setPriorityResults(data as HltbPrioritizeResponse);
      
      if (data.prioritized > 0) {
        toast.success(`Found and prioritized ${data.prioritized} games with HLTB data`);
      } else if (data.found > 0) {
        toast.info(`Found ${data.found} games with HLTB data but couldn't prioritize them`);
      } else {
        toast.info(`Processed ${data.processed} games but found none with HLTB data`);
      }
      
      // Refresh stats to show updated numbers
      fetchStats();
      
    } catch (err) {
      console.error('[AdminHltbDataPage] Error in prioritization:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setLastError(errorMessage);
      toast.error(`Prioritization failed: ${errorMessage}`);
    } finally {
      setIsPrioritizing(false);
    }
  }, [priorityLimit, fetchStats]);

  return (
    <AdminLayout requiredRole="admin">
      <div className="container max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HLTB Data Manager</h1>
          <p className="text-gray-400">
            Manage and monitor HowLongToBeat data integration for your game catalog.
          </p>
        </div>

        {/* Error Alert */}
        {lastError && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Processing Error:</strong> {lastError}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <div className="mb-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Debug Info:</strong> Found {debugInfo.foundGames} games, processed {debugInfo.batchesProcessed} batches, auth present: {debugInfo.authPresent ? 'Yes' : 'No'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* HLTB Data Coverage Card */}
          <AdminStatsCard
            title="HLTB Data Coverage"
            description="Current status of HowLongToBeat data integration"
            icon={<Clock className="h-5 w-5 text-unplayed-mint" />}
            stats={statsItems}
            onRefresh={fetchStats}
            isLoading={isLoading}
            footerContent={
              stats && (
                <div className="w-full space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Coverage</span>
                    <span className="text-sm font-medium">{stats.percentCoverage}%</span>
                  </div>
                  <Progress value={stats.percentCoverage} className="h-2" />
                </div>
              )
            }
          />

          {/* Batch Processing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-unplayed-amber" />
                HLTB Batch Processing
              </CardTitle>
              <CardDescription>
                Process games without HLTB estimates in batches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BatchProcessingControls
                batchSize={batchSize}
                onBatchSizeChange={setBatchSize}
                batchSizeMin={1}
                batchSizeMax={10}
                batchSizeStep={1}
                batchSizeLabel="HLTB API Batch Size"
                processLimit={processLimit}
                onProcessLimitChange={setProcessLimit}
                processLimitLabel="Games to Process"
                continuousMode={hltbProcessor.continuousMode}
                processedCount={hltbProcessor.processedCount}
                lastProcessedId={hltbProcessor.lastProcessedId}
                processComplete={hltbProcessor.processComplete}
                showWarningThreshold={5}
                warningMessage="Higher values may hit HLTB rate limits"
              />
            </CardContent>
            <CardHeader className="pt-0">
              <ProcessingFooter
                isProcessing={hltbProcessor.isProcessing}
                onProcess={handleProcessBatch}
                processText={`Process Batch (${processLimit} games)`}
                processingText="Processing HLTB data..."
                disabled={hltbProcessor.processComplete || !stats || stats.withoutEstimates === 0}
                continuousMode={hltbProcessor.continuousMode}
                onToggleContinuous={hltbProcessor.toggleContinuousMode}
                continuousDisabled={hltbProcessor.processComplete || !stats || stats.withoutEstimates === 0}
                onReset={hltbProcessor.resetProcessor}
                resetDisabled={hltbProcessor.isProcessing || (hltbProcessor.lastProcessedId === 0 && hltbProcessor.processedCount === 0)}
              />
            </CardHeader>
          </Card>
        </div>

        {/* HLTB Smart Prioritization Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5 text-unplayed-mint" />
              HLTB Smart Prioritization
            </CardTitle>
            <CardDescription>
              Identify games with HLTB data and prioritize them in the processing queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block" htmlFor="priority-limit">
                  Games to Check: {priorityLimit}
                </label>
                <input 
                  id="priority-limit" 
                  type="range" 
                  min={10} 
                  max={500} 
                  step={10} 
                  value={priorityLimit} 
                  onChange={(e) => setPriorityLimit(parseInt(e.target.value))} 
                  className="w-full"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Number of games to check against the HLTB database (higher values take longer)
                </p>
              </div>
              <div>
                <Button 
                  onClick={handlePrioritizeHltbGames} 
                  disabled={isPrioritizing}
                  size="lg"
                  className="whitespace-nowrap"
                >
                  {isPrioritizing ? 'Prioritizing...' : 'Find HLTB Games'}
                </Button>
              </div>
            </div>
            
            {priorityResults && (
              <div className="mt-4 space-y-3">
                <div className="flex gap-4 flex-wrap">
                  <div className="bg-gray-800 rounded-md px-4 py-2">
                    <span className="block text-xs text-gray-400">Processed</span>
                    <span className="text-lg font-bold">{priorityResults.processed}</span>
                  </div>
                  <div className="bg-gray-800 rounded-md px-4 py-2">
                    <span className="block text-xs text-gray-400">Found on HLTB</span>
                    <span className="text-lg font-bold">{priorityResults.found}</span>
                  </div>
                  <div className="bg-gray-800 rounded-md px-4 py-2">
                    <span className="block text-xs text-gray-400">Prioritized</span>
                    <span className="text-lg font-bold">{priorityResults.prioritized}</span>
                  </div>
                </div>
                
                {priorityResults.gamesWithData && priorityResults.gamesWithData.length > 0 && (
                  <div>
                    <Separator className="my-4" />
                    <h3 className="text-sm font-medium mb-2">Found Games With HLTB Data:</h3>
                    <div className="bg-gray-900/50 rounded-md p-3 max-h-60 overflow-y-auto text-xs">
                      <ul className="space-y-1">
                        {priorityResults.gamesWithData.map((game) => (
                          <li key={game.id} className="flex justify-between">
                            <span className="font-medium">{game.name}</span>
                            <span className="text-gray-400">→ {game.hltb_name}</span>
                          </li>
                        ))}
                      </ul>
                      {priorityResults.found > priorityResults.gamesWithData.length && (
                        <p className="mt-2 text-gray-400">
                          ...and {priorityResults.found - priorityResults.gamesWithData.length} more games
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional info card */}
        <Card>
          <CardHeader>
            <CardTitle>About HLTB Integration</CardTitle>
            <CardDescription>
              Understanding how HowLongToBeat data is integrated with your game catalog
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400">
              HowLongToBeat provides estimates for how long it takes to complete games. This data is fetched from the HLTB API
              and stored in the game_estimates table. The data includes main story completion time, completionist time, and extra content time.
            </p>
            
            <div className="rounded-md bg-black/50 p-3 border border-gray-800 space-y-2">
              <h4 className="font-medium text-sm">Data Processing Notes:</h4>
              <ul className="text-xs text-gray-400 list-disc pl-4 space-y-1">
                <li>Game titles are matched against the HLTB database using fuzzy matching</li>
                <li>The Smart Prioritization feature identifies games available in HLTB and prioritizes them in the queue</li>
                <li>Batch processing helps manage rate limits and large catalogs</li>
                <li>Some games may not have HLTB estimates available</li>
                <li>The API has rate limits that prevent processing too many games at once</li>
                <li>Processing uses a LEFT JOIN query for optimal performance</li>
              </ul>
            </div>

            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-md bg-gray-900/50 p-3 border border-gray-700 space-y-2">
                <h4 className="font-medium text-sm text-yellow-400">Debug Information:</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Processing State: {hltbProcessor.isProcessing ? 'Active' : 'Idle'}</div>
                  <div>Continuous Mode: {hltbProcessor.continuousMode ? 'Enabled' : 'Disabled'}</div>
                  <div>Last Processed ID: {hltbProcessor.lastProcessedId}</div>
                  <div>Total Processed: {hltbProcessor.processedCount}</div>
                  <div>Complete: {hltbProcessor.processComplete ? 'Yes' : 'No'}</div>
                  {lastError && <div className="text-red-400">Last Error: {lastError}</div>}
                  {debugInfo && (
                    <div className="text-blue-400">
                      Last Run: Found {debugInfo.foundGames} games, {debugInfo.batchesProcessed} batches, Auth: {debugInfo.authPresent ? 'Present' : 'Missing'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHltbDataPage;

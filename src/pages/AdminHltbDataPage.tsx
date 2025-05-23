
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, BarChart, AlertTriangle, AlertCircle } from "lucide-react";
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
}

const AdminHltbDataPage = () => {
  const [batchSize, setBatchSize] = useState(5);
  const [processLimit, setProcessLimit] = useState(50);
  const [lastError, setLastError] = useState<string | null>(null);

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
      
      try {
        const { data, error } = await supabase.functions.invoke("backfill-hltb-estimates", {
          body: options
        });
        
        if (error) {
          console.error('[AdminHltbDataPage] Supabase function error:', error);
          throw new Error(`Function error: ${error.message || 'Unknown error'}`);
        }
        
        if (!data) {
          console.error('[AdminHltbDataPage] No data returned from function');
          throw new Error('No data returned from processing function');
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
      toast.success(`Processed ${data.processedCount} games (${data.successCount} successes, ${data.errorCount} errors)`);
      
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
    
    hltbProcessor.processBatch({
      batchSize: batchSize,
      limit: processLimit
    });
  }, [hltbProcessor, batchSize, processLimit]);

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

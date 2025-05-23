
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, BarChart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from '@/layouts/AdminLayout';
import AdminStatsCard, { StatItem } from "@/components/admin/AdminStatsCard";
import BatchProcessingControls from "@/components/admin/BatchProcessingControls";
import ProcessingFooter from "@/components/admin/ProcessingFooter";
import { useBatchProcessor } from "@/hooks/use-batch-processor";
import { useAdminStats } from "@/hooks/use-admin-stats";

// Define TypeScript interfaces for better type safety
interface HltbStats {
  total: number;
  withEstimates: number;
  withoutEstimates: number;
  percentCoverage: number;
}

const AdminHltbDataPage = () => {
  const [batchSize, setBatchSize] = useState(5);
  const [processLimit, setProcessLimit] = useState(50);

  // Fetch HLTB statistics
  const fetchHltbStats = useCallback(async (): Promise<HltbStats> => {
    // Get total games count
    const { count: totalCount, error: totalError } = await supabase
      .from("games")
      .select('*', { count: 'exact', head: true });
    
    if (totalError) throw totalError;
    
    // Get count of games with HLTB estimates
    const { count: withEstimatesCount, error: estimatesError } = await supabase
      .from("game_estimates")
      .select('*', { count: 'exact', head: true });
    
    if (estimatesError) throw estimatesError;
    
    // Calculate statistics
    const withoutEstimates = totalCount! - withEstimatesCount!;
    const percentCoverage = totalCount! > 0 
      ? Math.round((withEstimatesCount! / totalCount!) * 100) 
      : 0;
    
    return {
      total: totalCount || 0,
      withEstimates: withEstimatesCount || 0,
      withoutEstimates,
      percentCoverage
    };
  }, []);

  const { stats, isLoading, fetchStats } = useAdminStats<HltbStats>(fetchHltbStats);
  
  const hltbProcessor = useBatchProcessor({
    processingFunction: async (options) => {
      return supabase.functions.invoke("backfill-hltb-estimates", {
        body: options
      }).then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
    },
    onSuccess: (data) => {
      toast.success(`Processed ${data.processedCount} games (${data.successCount} successes, ${data.errorCount} errors)`);
      
      // If complete, refresh stats
      if (data.complete) {
        fetchStats();
      }
    },
    continuousInterval: 5000
  });

  const statsItems: StatItem[] = stats ? [
    { key: 'total', label: 'Total Games', value: stats.total.toLocaleString() },
    { key: 'withEstimates', label: 'Games with HLTB Estimates', value: stats.withEstimates.toLocaleString() },
    { key: 'withoutEstimates', label: 'Games without HLTB Estimates', value: stats.withoutEstimates.toLocaleString() },
    { key: 'percentCoverage', label: 'Coverage', value: `${stats.percentCoverage}%` }
  ] : [];

  return (
    <AdminLayout requiredRole="admin">
      <div className="container max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HLTB Data Manager</h1>
          <p className="text-gray-400">
            Manage and monitor HowLongToBeat data integration for your game catalog.
          </p>
        </div>

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
              />
            </CardContent>
            <CardHeader className="pt-0">
              <ProcessingFooter
                isProcessing={hltbProcessor.isProcessing}
                onProcess={() => hltbProcessor.processBatch({
                  batchSize: batchSize,
                  limit: processLimit
                })}
                processText={`Process Batch (${processLimit} games)`}
                processingText="Processing..."
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
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHltbDataPage;

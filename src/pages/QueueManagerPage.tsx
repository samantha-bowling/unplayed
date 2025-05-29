
import React, { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap, Loader2 } from "lucide-react";
import AdminLayout from '@/layouts/AdminLayout';
import QueueStatsCard from "@/components/admin/QueueStatsCard";
import BatchProcessingControls from "@/components/admin/BatchProcessingControls";
import ProcessingFooter from "@/components/admin/ProcessingFooter";
import SmartPrioritizationCard from "@/components/admin/SmartPrioritizationCard";
import MetadataConsistencyCard from '@/components/admin/MetadataConsistencyCard';
import { useBatchProcessor } from "@/hooks/use-batch-processor";
import { useAdminStats } from "@/hooks/use-admin-stats";

// Interface for queue statistics
interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// Response type for the Steam processing function
interface SteamProcessResponse {
  processedCount: number;
  success: boolean;
  message?: string;
  lastProcessedId?: number;
  complete?: boolean;
}

const QueueManagerPage = () => {
  const [userId, setUserId] = useState<string>("");
  const [priorityLevel, setPriorityLevel] = useState<number>(10);
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false);
  
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
      
      // Process the statistics from the Edge function
      // Initialize with zeros
      const newStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      // Map the Edge function results to our stats object
      if (statusCounts && Array.isArray(statusCounts)) {
        statusCounts.forEach((item: { status: string; count: number }) => {
          if (item.status === "total") {
            newStats.total = item.count;
          } else if (item.status in newStats) {
            newStats[item.status as keyof typeof newStats] = item.count;
          }
        });
      }

      // If total wasn't included in the response, calculate it
      if (newStats.total === 0) {
        newStats.total = newStats.pending + newStats.processing + 
                         newStats.completed + newStats.failed;
      }

      return newStats;
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
      const newStats = {
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
          newStats[status as keyof typeof newStats] = count;
        }
      }
      
      return newStats;
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

  // Use our hooks for stats and batch processing
  const { stats, isLoading, fetchStats } = useAdminStats<QueueStats>(fetchQueueStats);
  
  const queueProcessor = useBatchProcessor<SteamProcessResponse>({
    processingFunction: async (options) => {
      return supabase.functions.invoke("fetch-steam-app-details", {
        body: { processBatch: true, batchSize: options.batchSize }
      }).then(({ data, error }) => {
        if (error) throw error;
        return data;
      });
    },
    onSuccess: (data) => {
      toast.success("Processing batch initiated successfully!");
      console.log("Batch processing response:", data);
      
      // Refresh queue stats after processing
      fetchStats();
    },
    continuousInterval: 3000 // 3 second delay between batches in continuous mode
  });

  const prioritizeUserGames = async () => {
    if (!userId) {
      toast.error("Please enter a User ID");
      return;
    }
    
    try {
      setIsPrioritizing(true);
      toast.info("Prioritizing user games...");
      
      const { data, error } = await supabase.functions.invoke("prioritize-user-games", {
        body: { 
          userId: userId,
          priority: priorityLevel
        }
      });
      
      if (error) {
        console.error("Error prioritizing user games:", error);
        toast.error("Failed to prioritize user games");
        return;
      }
      
      toast.success(`Successfully prioritized ${data?.queuedGames || 0} games for processing!`);
      console.log("Prioritization response:", data);
      
      // Refresh queue stats after prioritization
      await fetchStats();
      
    } catch (err) {
      console.error("Error prioritizing games:", err);
      toast.error("Error occurred while prioritizing games");
    } finally {
      setIsPrioritizing(false);
    }
  };

  return (
    <AdminLayout requiredRole="admin">
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Queue Manager</h1>
          <p className="text-gray-400">
            Advanced controls for managing the Steam game processing queue and data consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <QueueStatsCard 
            stats={stats || { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }}
            onRefresh={fetchStats}
            isLoading={isLoading}
            processedCount={queueProcessor.processedCount}
          />
          <SmartPrioritizationCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-700/20 border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-lg">Batch Processing Controls</CardTitle>
              <CardDescription>
                Configure and control batch processing operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchProcessingControls
                batchSize={queueProcessor.batchSize}
                onBatchSizeChange={queueProcessor.setBatchSize}
                continuousMode={queueProcessor.continuousMode}
                processedCount={queueProcessor.processedCount}
                lastProcessedId={queueProcessor.lastProcessedId}
                processComplete={queueProcessor.processComplete}
                showWarningThreshold={30}
                warningMessage="Large batches may cause timeouts"
              />
              <div className="mt-6">
                <ProcessingFooter
                  isProcessing={queueProcessor.isProcessing}
                  onProcess={queueProcessor.processBatch}
                  processText="Process Batch"
                  processingText="Processing..."
                  continuousMode={queueProcessor.continuousMode}
                  onToggleContinuous={queueProcessor.toggleContinuousMode}
                  onReset={queueProcessor.resetProcessor}
                  resetDisabled={queueProcessor.isProcessing}
                />
              </div>
            </CardContent>
          </Card>

          <MetadataConsistencyCard />
        </div>

        <Card className="bg-gradient-to-br from-purple-900/40 to-purple-700/20 border-purple-400/30">
          <CardHeader>
            <CardTitle className="text-lg">Smart User Prioritization</CardTitle>
            <CardDescription>
              Prioritize games for specific users to improve their experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                type="text"
                placeholder="Enter Steam User ID or UUID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority-level">Priority Level: {priorityLevel}</Label>
              <Slider
                id="priority-level"
                min={1}
                max={100}
                step={1}
                value={[priorityLevel]}
                onValueChange={(value) => setPriorityLevel(value[0])}
                className="py-4"
              />
            </div>

            <button
              onClick={prioritizeUserGames}
              disabled={isPrioritizing || !userId}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
            >
              {isPrioritizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prioritizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Prioritize User Games
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QueueManagerPage;

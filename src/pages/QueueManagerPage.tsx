
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
  const [batchSize, setBatchSize] = useState<number>(25);
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
      <div className="container max-w-7xl mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Queue Manager</h1>
          <p className="text-gray-400">
            Advanced tools for managing the Steam game processing queue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Queue Statistics Card */}
          <QueueStatsCard 
            stats={stats || {
              pending: 0,
              processing: 0,
              completed: 0,
              failed: 0,
              total: 0
            }}
            onRefresh={fetchStats}
            isLoading={isLoading}
            processedCount={queueProcessor.processedCount}
          />

          {/* Batch Processing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Batch Processing</CardTitle>
              <CardDescription>
                Configure and manage batch processing of Steam app details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <BatchProcessingControls
                batchSize={batchSize}
                onBatchSizeChange={setBatchSize}
                batchSizeMin={5}
                batchSizeMax={50}
                batchSizeStep={5}
                batchSizeLabel="Batch Size"
                showWarningThreshold={30}
                warningMessage="Higher risk of rate limiting"
                continuousMode={queueProcessor.continuousMode}
                processedCount={queueProcessor.processedCount}
                lastProcessedId={queueProcessor.lastProcessedId}
                processComplete={queueProcessor.processComplete}
              />
            </CardContent>
            <CardHeader className="pt-0">
              <ProcessingFooter
                isProcessing={queueProcessor.isProcessing}
                onProcess={() => queueProcessor.processBatch({ batchSize: batchSize })}
                processText={`Process Batch (${batchSize} Games)`}
                processingText="Processing..."
                disabled={queueProcessor.processComplete || !stats || stats.pending === 0}
                continuousMode={queueProcessor.continuousMode}
                onToggleContinuous={queueProcessor.toggleContinuousMode}
                continuousText="Enable Continuous Processing"
                stopContinuousText="Pause Continuous Processing"
                continuousDisabled={queueProcessor.processComplete || !stats || stats.pending === 0}
                onReset={queueProcessor.resetProcessor}
                resetDisabled={queueProcessor.isProcessing || (queueProcessor.lastProcessedId === 0 && queueProcessor.processedCount === 0)}
              />
            </CardHeader>
          </Card>
        </div>

        {/* Prioritize User Games Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Prioritize User Games</CardTitle>
            <CardDescription>
              Set high priority for a specific user's games in the processing queue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                placeholder="Enter Supabase User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <p className="text-xs text-gray-400">
                Enter the Supabase User ID to prioritize all their games in the processing queue.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority-level">Priority Level: {priorityLevel}</Label>
              <Slider
                id="priority-level"
                min={1}
                max={10}
                step={1}
                value={[priorityLevel]}
                onValueChange={(value) => setPriorityLevel(value[0])}
                className="py-4"
              />
              <p className="text-xs text-gray-400">
                Higher priority (10) means games will be processed before lower priority items.
              </p>
            </div>
          </CardContent>
          <CardHeader className="pt-0">
            <div className="w-full">
              <button
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                onClick={prioritizeUserGames}
                disabled={!userId || isPrioritizing}
              >
                {isPrioritizing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Prioritizing...
                  </>
                ) : (
                  "Prioritize User's Games"
                )}
              </button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QueueManagerPage;

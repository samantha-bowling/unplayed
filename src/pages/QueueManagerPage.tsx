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
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Queue Manager</h1>
          <p className="text-gray-400">
            Advanced controls for managing the Steam game processing queue and data consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <QueueStatsCard />
          <SmartPrioritizationCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <BatchProcessingControls />
          <MetadataConsistencyCard />
        </div>

        <ProcessingFooter />
      </div>
    </AdminLayout>
  );
};

export default QueueManagerPage;

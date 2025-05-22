import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Loader2 } from "lucide-react";
import QueueStatsCard from "@/components/admin/QueueStatsCard";
import AdminLayout from '@/layouts/AdminLayout';

const QueueManagerPage = () => {
  const [batchSize, setBatchSize] = useState<number>(25);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const [priorityLevel, setPriorityLevel] = useState<number>(10);
  const [continuousMode, setContinuousMode] = useState<boolean>(false);
  const [processedCount, setProcessedCount] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });

  // Fetch queue statistics on load
  useEffect(() => {
    fetchQueueStats();
  }, []);

  // Handle continuous processing mode
  useEffect(() => {
    let intervalId: number | undefined;

    if (continuousMode && !isProcessing) {
      // Start processing with a delay to prevent overwhelming the system
      intervalId = window.setInterval(async () => {
        await processBatch();
        // Refresh stats after processing
        await fetchQueueStats();
      }, 3000); // 3 second delay between batches
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [continuousMode, isProcessing]);

  const fetchQueueStats = async () => {
    try {
      setIsLoadingStats(true);
      // Get total counts for different statuses
      // First try to use edge function
      const { data: statusCounts, error: functionError } = await supabase.functions.invoke(
        'get-queue-stats-by-status'
      );
      
      if (functionError) {
        console.error("Edge function error:", functionError);
        // Fallback to direct counts
        await fetchQueueStatsDirectly();
        return;
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

      setStats(newStats);
    } catch (error) {
      console.error("Error in fetchQueueStats:", error);
      toast.error("Failed to load queue statistics");
      // Attempt direct counting as fallback
      await fetchQueueStatsDirectly();
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fallback method that counts each status individually
  const fetchQueueStatsDirectly = async () => {
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
      
      setStats(newStats);
    } catch (error) {
      console.error("Error in direct count fallback:", error);
      toast.error("Failed to load queue statistics using fallback method");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const processBatch = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      toast.info(`Processing batch of ${batchSize} Steam app details...`);
      
      const { data, error } = await supabase.functions.invoke("fetch-steam-app-details", {
        body: { processBatch: true, batchSize: batchSize }
      });
      
      if (error) {
        console.error("Error processing app details:", error);
        toast.error("Failed to process app details");
        return;
      }
      
      toast.success("Processing batch initiated successfully!");
      console.log("Batch processing response:", data);
      
      // Increment processed count for tracking
      setProcessedCount(prev => prev + batchSize);
      
    } catch (err) {
      console.error("Error calling batch processing:", err);
      toast.error("Error occurred while processing batch");
    } finally {
      setIsProcessing(false);
    }
  };

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
      await fetchQueueStats();
      
    } catch (err) {
      console.error("Error prioritizing games:", err);
      toast.error("Error occurred while prioritizing games");
    } finally {
      setIsPrioritizing(false);
    }
  };

  const toggleContinuousMode = () => {
    if (!continuousMode && stats.pending > 0) {
      toast.info("Continuous processing enabled. This will automatically process batches until paused.");
    } else if (continuousMode) {
      toast.info("Continuous processing paused.");
    }
    setContinuousMode(!continuousMode);
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
            stats={stats}
            onRefresh={fetchQueueStats}
            isLoading={isLoadingStats}
            processedCount={processedCount}
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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="batch-size">Batch Size: {batchSize} games</Label>
                  {batchSize > 30 && (
                    <div className="flex items-center text-amber-500 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Higher risk of rate limiting
                    </div>
                  )}
                </div>
                <Slider
                  id="batch-size"
                  min={5}
                  max={50}
                  step={5}
                  value={[batchSize]}
                  onValueChange={(value) => setBatchSize(value[0])}
                  className="py-4"
                />
                <p className="text-xs text-gray-400">
                  Adjust batch size based on your needs. Larger batches process more games but might hit rate limits.
                </p>
              </div>
              
              {continuousMode && (
                <div className="rounded-md bg-blue-950/50 p-3 border border-blue-800">
                  <div className="flex items-center text-blue-400 mb-2">
                    <Zap className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Continuous Mode Active</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Automatically processing batches of {batchSize} games with 3-second intervals between batches.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                onClick={processBatch} 
                disabled={isProcessing || stats.pending === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process Batch (${batchSize} Games)`
                )}
              </Button>
              
              <Button 
                variant={continuousMode ? "destructive" : "outline"}
                onClick={toggleContinuousMode}
                disabled={stats.pending === 0}
                className="w-full"
              >
                {continuousMode ? "Pause Continuous Processing" : "Enable Continuous Processing"}
              </Button>
            </CardFooter>
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
          <CardFooter>
            <Button 
              onClick={prioritizeUserGames}
              disabled={!userId || isPrioritizing}
              className="w-full"
            >
              {isPrioritizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prioritizing...
                </>
              ) : (
                "Prioritize User's Games"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default QueueManagerPage;

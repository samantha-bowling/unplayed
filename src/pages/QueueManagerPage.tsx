import React, { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Zap, Loader2, Calculator, Trophy, RefreshCw, Wind, Users, ChevronDown, Info } from "lucide-react";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import AdminLayout from '@/layouts/AdminLayout';
import QueueStatsCard from "@/components/admin/QueueStatsCard";
import BatchProcessingControls from "@/components/admin/BatchProcessingControls";
import ProcessingFooter from "@/components/admin/ProcessingFooter";
import SmartPrioritizationCard from "@/components/admin/SmartPrioritizationCard";
import MetadataConsistencyCard from '@/components/admin/MetadataConsistencyCard';
import HeaderImageEnhancementCard from '@/components/admin/HeaderImageEnhancementCard';
import { useBatchProcessor, type BatchProcessResponse } from "@/hooks/use-batch-processor";
import { useAdminStats } from "@/hooks/use-admin-stats";
import { triggerLeaderboardCalculation } from "@/utils/trigger-leaderboard-calculation";

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

/** Collapsible card wrapper for admin tools */
const CollapsibleToolCard = ({
  children,
  title,
  icon: Icon,
  description,
  whenToUse,
  gradient,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  description: string;
  whenToUse: string[];
  gradient: string;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={gradient}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-white/5 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Icon className="mr-2 h-5 w-5" />
                {title}
              </CardTitle>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
            <CardDescription>{description}</CardDescription>
            {!isOpen && whenToUse.length > 0 && (
              <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{whenToUse[0]}</span>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {whenToUse.length > 0 && (
              <div className="mb-4 rounded-md bg-black/20 border border-white/10 p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-1.5">When to use:</p>
                {whenToUse.map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground">• {item}</p>
                ))}
              </div>
            )}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const QueueManagerPage = () => {
  const [userId, setUserId] = useState<string>("");
  const [priorityLevel, setPriorityLevel] = useState<number>(10);
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false);
  const [metricsUserId, setMetricsUserId] = useState<string>("");
  const [isCalculatingMetrics, setIsCalculatingMetrics] = useState<boolean>(false);
  const [isCalculatingLeaderboard, setIsCalculatingLeaderboard] = useState<boolean>(false);
  
  // Fetch queue statistics
  const fetchQueueStats = useCallback(async (): Promise<QueueStats> => {
    try {
      const { data: statusCounts, error: functionError } = await supabase.functions.invoke(
        'get-queue-stats-by-status'
      );
      
      if (functionError) {
        console.error("Edge function error:", functionError);
        return await fetchQueueStatsDirectly();
      }
      
      const newStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      };

      if (statusCounts && Array.isArray(statusCounts)) {
        statusCounts.forEach((item: { status: string; count: number }) => {
          if (item.status === "total") {
            newStats.total = item.count;
          } else if (item.status in newStats) {
            newStats[item.status as keyof typeof newStats] = item.count;
          }
        });
      }

      if (newStats.total === 0) {
        newStats.total = newStats.pending + newStats.processing + 
                         newStats.completed + newStats.failed;
      }

      return newStats;
    } catch (error) {
      console.error("Error in fetchQueueStats:", error);
      toast.error("Failed to load queue statistics");
      return await fetchQueueStatsDirectly();
    }
  }, []);

  const fetchQueueStatsDirectly = async (): Promise<QueueStats> => {
    try {
      const { count: totalCount, error: totalError } = await supabase
        .from("steam_app_queue")
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      
      const statuses = ['pending', 'processing', 'completed', 'failed'];
      const newStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: totalCount || 0
      };
      
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
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
    }
  };

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
      fetchStats();
    },
    continuousInterval: 3000
  });

  const dustCursorRef = useRef<string | null>(null);
  const dustProcessor = useBatchProcessor<BatchProcessResponse>({
    processingFunction: async (options) => {
      const { data, error } = await supabase.functions.invoke("recalculate-dust-scores", {
        body: {
          batchSize: options.batchSize,
          startAfter: dustCursorRef.current,
        }
      });
      if (error) throw error;
      if (data?.lastProcessedId) {
        dustCursorRef.current = data.lastProcessedId;
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Recalculated ${data.processedCount} dust scores`);
    },
    onComplete: () => {
      dustCursorRef.current = null;
    },
    continuousInterval: 5000,
  });

  const metricsCursorRef = useRef<string | null>(null);
  const metricsProcessor = useBatchProcessor<BatchProcessResponse>({
    processingFunction: async (options) => {
      const { data, error } = await supabase.functions.invoke("recalculate-all-user-metrics", {
        body: {
          batchSize: options.batchSize,
          startAfter: metricsCursorRef.current,
        }
      });
      if (error) throw error;
      if (data?.lastProcessedId) {
        metricsCursorRef.current = data.lastProcessedId;
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Recalculated metrics for ${data.processedCount} users`);
    },
    onComplete: () => {
      metricsCursorRef.current = null;
    },
    continuousInterval: 8000,
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
        body: { userId, priority: priorityLevel }
      });
      
      if (error) {
        console.error("Error prioritizing user games:", error);
        toast.error("Failed to prioritize user games");
        return;
      }
      
      toast.success(`Successfully prioritized ${data?.queuedGames || 0} games for processing!`);
      await fetchStats();
    } catch (err) {
      console.error("Error prioritizing games:", err);
      toast.error("Error occurred while prioritizing games");
    } finally {
      setIsPrioritizing(false);
    }
  };

  const calculateUserMetrics = async () => {
    if (!metricsUserId) {
      toast.error("Please enter a User ID");
      return;
    }
    
    try {
      setIsCalculatingMetrics(true);
      toast.info("Calculating user metrics...");
      
      const { data, error } = await supabase.functions.invoke("calculate-user-metrics", {
        body: { target_user_id: metricsUserId },
      });
      
      if (error) {
        console.error("Error calculating user metrics:", error);
        toast.error("Failed to calculate user metrics");
        return;
      }
      
      toast.success(`Successfully calculated metrics! Processed ${data?.metrics?.total_games || 0} games`);
    } catch (err) {
      console.error("Error calculating metrics:", err);
      toast.error("Error occurred while calculating metrics");
    } finally {
      setIsCalculatingMetrics(false);
    }
  };

  const handleLeaderboardCalculation = async () => {
    try {
      setIsCalculatingLeaderboard(true);
      toast.info("Triggering leaderboard calculation...");
      
      const result = await triggerLeaderboardCalculation();
      
      if (result.success) {
        toast.success("Leaderboard calculation completed successfully!");
      } else {
        toast.error(`Failed to calculate leaderboard: ${result.error}`);
      }
    } catch (err) {
      console.error("Error triggering leaderboard calculation:", err);
      toast.error("Error occurred while calculating leaderboard");
    } finally {
      setIsCalculatingLeaderboard(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-24">
        <AdminBreadcrumb currentPage="Game Queue Manager" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Game Queue Manager</h1>
          <p className="text-muted-foreground">
            Advanced controls for managing the Steam game processing queue and data pipeline.
          </p>
        </div>

        <div className="space-y-8">
          {/* ─── Section 1: Steam Queue Management ─── */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Steam Queue Management</h2>
              <p className="text-sm text-muted-foreground">Process pending Steam apps, prioritize queue items, and enhance metadata.</p>
            </div>

            <QueueStatsCard 
              stats={stats || { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }}
              onRefresh={fetchStats}
              isLoading={isLoading}
              processedCount={queueProcessor.processedCount}
            />

            {/* Batch Processing Controls — directly below Queue Stats */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-blue-700/20 border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-lg">Steam Queue Processor</CardTitle>
                <CardDescription>
                  Fetch metadata for pending apps in the queue. Controls the batch size and continuous processing.
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

            <SmartPrioritizationCard />
            <HeaderImageEnhancementCard />
          </section>

          {/* ─── Section 2: Data Pipeline (Batch Recalculation) ─── */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Data Pipeline Tools</h2>
              <p className="text-sm text-muted-foreground">
                Three-stage batch recalculation flow: <span className="font-medium text-orange-400">Dust Scores</span> → <span className="font-medium text-teal-400">User Metrics</span> → <span className="font-medium text-yellow-400">Leaderboard</span>. 
                These are maintenance/backfill tools — new imports are handled automatically by database triggers.
              </p>
            </div>

            <CollapsibleToolCard
              title="Dust Score Recalculation"
              icon={Wind}
              description="Batch recalculate all dust scores using the enhanced algorithm (~302K records)"
              whenToUse={[
                "After changing the dust score formula or its weighting factors.",
                "For backfilling scores on legacy data that used the old formula.",
                "Not needed for routine operations — the database trigger handles new imports automatically.",
              ]}
              gradient="bg-gradient-to-br from-orange-900/40 to-orange-700/20 border-orange-400/30"
            >
              <BatchProcessingControls
                batchSize={dustProcessor.batchSize}
                onBatchSizeChange={dustProcessor.setBatchSize}
                batchSizeMin={1000}
                batchSizeMax={20000}
                batchSizeStep={1000}
                batchSizeLabel="Batch Size"
                continuousMode={dustProcessor.continuousMode}
                processedCount={dustProcessor.processedCount}
                lastProcessedId={dustProcessor.lastProcessedId}
                processComplete={dustProcessor.processComplete}
                showWarningThreshold={10000}
                warningMessage="Large batches may timeout"
              />
              <div className="mt-6">
                <ProcessingFooter
                  isProcessing={dustProcessor.isProcessing}
                  onProcess={dustProcessor.processBatch}
                  processText="Recalculate Batch"
                  processingText="Recalculating..."
                  continuousMode={dustProcessor.continuousMode}
                  onToggleContinuous={dustProcessor.toggleContinuousMode}
                  onReset={() => { dustCursorRef.current = null; dustProcessor.resetProcessor(); }}
                  resetDisabled={dustProcessor.isProcessing}
                />
              </div>
            </CollapsibleToolCard>

            <CollapsibleToolCard
              title="Batch User Metrics Recalculation"
              icon={Users}
              description="Recalculate metrics (clean score, dust totals, library value) for all users"
              whenToUse={[
                "Run after a bulk dust score recalculation to aggregate per-user stats.",
                "Processes ~538 users. Run this before triggering the leaderboard.",
                "Not needed after individual user imports — metrics auto-calculate on import.",
              ]}
              gradient="bg-gradient-to-br from-teal-900/40 to-cyan-700/20 border-teal-400/30"
            >
              <BatchProcessingControls
                batchSize={metricsProcessor.batchSize}
                onBatchSizeChange={metricsProcessor.setBatchSize}
                batchSizeMin={10}
                batchSizeMax={200}
                batchSizeStep={10}
                batchSizeLabel="Users per Batch"
                continuousMode={metricsProcessor.continuousMode}
                processedCount={metricsProcessor.processedCount}
                lastProcessedId={metricsProcessor.lastProcessedId}
                processComplete={metricsProcessor.processComplete}
                showWarningThreshold={100}
                warningMessage="Large batches may be slow (1 RPC per user)"
              />
              <div className="mt-6">
                <ProcessingFooter
                  isProcessing={metricsProcessor.isProcessing}
                  onProcess={metricsProcessor.processBatch}
                  processText="Recalculate Batch"
                  processingText="Recalculating..."
                  continuousMode={metricsProcessor.continuousMode}
                  onToggleContinuous={metricsProcessor.toggleContinuousMode}
                  onReset={() => { metricsCursorRef.current = null; metricsProcessor.resetProcessor(); }}
                  resetDisabled={metricsProcessor.isProcessing}
                />
              </div>
            </CollapsibleToolCard>

            <CollapsibleToolCard
              title="Leaderboard Management"
              icon={Trophy}
              description="Manually trigger leaderboard calculations and rankings updates"
              whenToUse={[
                "Run after user metrics are up to date to snapshot all rankings.",
                "Auto-runs daily at midnight UTC — manual trigger for immediate updates.",
                "Results appear immediately on the public leaderboard page.",
              ]}
              gradient="bg-gradient-to-br from-yellow-900/40 to-yellow-700/20 border-yellow-400/30"
            >
              <div className="space-y-4">
                <button
                  onClick={handleLeaderboardCalculation}
                  disabled={isCalculatingLeaderboard}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  {isCalculatingLeaderboard ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating Leaderboard...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Trigger Leaderboard Calculation
                    </>
                  )}
                </button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Processes all users with leaderboard visibility enabled</p>
                  <p>• Calculates dust scores and clean scores for rankings</p>
                  <p>• Updates rank changes compared to previous snapshot</p>
                </div>
              </div>
            </CollapsibleToolCard>
          </section>

          {/* ─── Section 3: Single-User Tools ─── */}
          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Single-User Tools</h2>
              <p className="text-sm text-muted-foreground">Manual tools for debugging or handling individual user support cases.</p>
            </div>

            <CollapsibleToolCard
              title="Smart User Prioritization"
              icon={Zap}
              description="Prioritize games for specific users to improve their experience"
              whenToUse={[
                "Bump a specific user's games to the front of the processing queue.",
                "Useful when a user reports missing game data or stale metadata.",
              ]}
              gradient="bg-gradient-to-br from-purple-900/40 to-purple-700/20 border-purple-400/30"
            >
              <div className="space-y-4">
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
              </div>
            </CollapsibleToolCard>

            <CollapsibleToolCard
              title="User Metrics Calculator"
              icon={Calculator}
              description="Calculate and populate user metrics data for a specific user"
              whenToUse={[
                "Debug tool for recalculating a single user's metrics manually.",
                "Useful for support tickets or verifying formula changes on one user.",
              ]}
              gradient="bg-gradient-to-br from-green-900/40 to-green-700/20 border-green-400/30"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metrics-user-id">User ID</Label>
                  <Input
                    id="metrics-user-id"
                    type="text"
                    placeholder="Enter User UUID"
                    value={metricsUserId}
                    onChange={(e) => setMetricsUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Calculates metrics for the specified user (admin override)
                  </p>
                </div>

                <button
                  onClick={calculateUserMetrics}
                  disabled={isCalculatingMetrics || !metricsUserId}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  {isCalculatingMetrics ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating Metrics...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Calculate User Metrics
                    </>
                  )}
                </button>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Calculates total games, unplayed games, spending data</p>
                  <p>• Generates genre statistics and shelf life data</p>
                  <p>• Creates dust score breakdowns for top contributors</p>
                </div>
              </div>
            </CollapsibleToolCard>

            <MetadataConsistencyCard />
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default QueueManagerPage;

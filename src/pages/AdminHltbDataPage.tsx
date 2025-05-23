
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Clock, BarChart, AlertTriangle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import AdminLayout from '@/layouts/AdminLayout';

// Define TypeScript interfaces for better type safety
interface HltbStats {
  total: number;
  withEstimates: number;
  withoutEstimates: number;
  percentCoverage: number;
}

const AdminHltbDataPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<HltbStats>({
    total: 0,
    withEstimates: 0,
    withoutEstimates: 0,
    percentCoverage: 0
  });
  const [batchSize, setBatchSize] = useState(5);
  const [processLimit, setProcessLimit] = useState(50);
  const [lastProcessedId, setLastProcessedId] = useState(0);
  const [processComplete, setProcessComplete] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [continuousMode, setContinuousMode] = useState(false);
  
  // Fetch HLTB statistics on load
  useEffect(() => {
    fetchHltbStats();
  }, []);
  
  // Handle continuous processing mode
  useEffect(() => {
    let intervalId: number | undefined;

    if (continuousMode && !isProcessing && !processComplete) {
      // Start processing with a delay to prevent overwhelming the system
      intervalId = window.setInterval(async () => {
        await processBatch();
        // Stop if processing is complete
        if (processComplete) {
          setContinuousMode(false);
        }
      }, 5000); // 5 second delay between batches
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [continuousMode, isProcessing, processComplete]);

  const fetchHltbStats = async () => {
    try {
      setIsLoading(true);
      
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
      
      setStats({
        total: totalCount || 0,
        withEstimates: withEstimatesCount || 0,
        withoutEstimates,
        percentCoverage
      });
      
    } catch (error) {
      console.error("Error fetching HLTB stats:", error);
      toast.error("Failed to load HLTB statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const processBatch = async () => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      toast.info(`Processing batch of HLTB estimates (limit: ${processLimit}, batch size: ${batchSize})...`);
      
      // Call the backfill-hltb-estimates function
      const { data, error } = await supabase.functions.invoke("backfill-hltb-estimates", {
        body: {
          limit: processLimit,
          batchSize: batchSize,
          startAfter: lastProcessedId
        }
      });
      
      if (error) {
        console.error("Error processing HLTB estimates:", error);
        toast.error("Failed to process HLTB estimates");
        return;
      }
      
      // Update state with results
      if (data) {
        setLastProcessedId(data.lastProcessedId || lastProcessedId);
        setProcessComplete(data.complete || false);
        setProcessedCount(prev => prev + (data.processedCount || 0));
        
        // Notify user
        toast.success(`Processed ${data.processedCount} games (${data.successCount} successes, ${data.errorCount} errors)`);
        
        // If complete, refresh stats
        if (data.complete) {
          toast.success("Processing complete! No more games to process.");
          await fetchHltbStats();
          setContinuousMode(false);
        }
      }
      
    } catch (err) {
      console.error("Error calling HLTB batch processing:", err);
      toast.error("Error occurred while processing batch");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetProcessor = () => {
    setLastProcessedId(0);
    setProcessComplete(false);
    setProcessedCount(0);
    toast.info("Processor reset. Will start from the beginning.");
  };

  const toggleContinuousMode = () => {
    if (!continuousMode && stats.withoutEstimates > 0) {
      toast.info("Continuous processing enabled. This will automatically process batches until complete.");
    } else if (continuousMode) {
      toast.info("Continuous processing paused.");
    }
    setContinuousMode(!continuousMode);
  };

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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5 text-unplayed-mint" /> 
                HLTB Data Coverage
              </CardTitle>
              <CardDescription>
                Current status of HowLongToBeat data integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-unplayed-mint" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">Total Games</TableCell>
                          <TableCell className="text-right">{stats.total.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Games with HLTB Estimates</TableCell>
                          <TableCell className="text-right">{stats.withEstimates.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Games without HLTB Estimates</TableCell>
                          <TableCell className="text-right">{stats.withoutEstimates.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Coverage</TableCell>
                          <TableCell className="text-right">{stats.percentCoverage}%</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Coverage</span>
                        <span className="text-sm font-medium">{stats.percentCoverage}%</span>
                      </div>
                      <Progress value={stats.percentCoverage} className="h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={fetchHltbStats} 
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Statistics
              </Button>
            </CardFooter>
          </Card>

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
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="process-limit">Games to Process: {processLimit}</Label>
                  {processLimit > 200 && (
                    <div className="flex items-center text-amber-500 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Large batch may timeout
                    </div>
                  )}
                </div>
                <Slider
                  id="process-limit"
                  min={10}
                  max={500}
                  step={10}
                  value={[processLimit]}
                  onValueChange={(value) => setProcessLimit(value[0])}
                  className="py-4"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batch-size">HLTB API Batch Size: {batchSize}</Label>
                <Slider
                  id="batch-size"
                  min={1}
                  max={10}
                  step={1}
                  value={[batchSize]}
                  onValueChange={(value) => setBatchSize(value[0])}
                  className="py-4"
                />
                <p className="text-xs text-gray-400">
                  Smaller batch sizes are more reliable but slower. Larger batch sizes may exceed rate limits.
                </p>
              </div>
              
              {processedCount > 0 && (
                <div className="rounded-md bg-blue-950/50 p-3 border border-blue-800">
                  <div className="text-sm text-blue-400">
                    <span className="font-medium">Progress:</span> Processed {processedCount} games
                    {processComplete && <span className="ml-2 text-green-400">(Complete)</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Last processed ID: {lastProcessedId}
                  </div>
                </div>
              )}
              
              {continuousMode && (
                <div className="rounded-md bg-purple-950/50 p-3 border border-purple-800">
                  <div className="flex items-center text-purple-400 mb-2">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-sm font-medium">Continuous Mode Active</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Automatically processing batches with 5-second intervals between batches.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                onClick={processBatch} 
                disabled={isProcessing || processComplete || stats.withoutEstimates === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Process Batch (${processLimit} games)`
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button 
                  variant={continuousMode ? "destructive" : "outline"}
                  onClick={toggleContinuousMode}
                  disabled={processComplete || stats.withoutEstimates === 0}
                >
                  {continuousMode ? "Stop" : "Start"} Continuous
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={resetProcessor}
                  disabled={isProcessing || (lastProcessedId === 0 && processedCount === 0)}
                >
                  Reset Processor
                </Button>
              </div>
            </CardFooter>
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

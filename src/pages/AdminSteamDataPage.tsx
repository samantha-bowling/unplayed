
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Database, BarChart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const AdminSteamDataPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [queueStats, setQueueStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });
  const [lastSync, setLastSync] = useState<any>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Fetch queue statistics
  useEffect(() => {
    fetchQueueStats();
  }, []);

  const fetchQueueStats = async () => {
    try {
      // Get counts of queue items by status
      const { data: statsCounts, error: statsError } = await supabase
        .from("steam_app_queue")
        .select('status, count(*)', { count: 'exact' })
        .group('status');

      if (statsError) throw statsError;

      // Get total count
      const { count: totalCount, error: countError } = await supabase
        .from("steam_app_queue")
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Get the most recent sync record
      const { data: syncData, error: syncError } = await supabase
        .from("steam_app_sync")
        .select('*')
        .order('last_sync', { ascending: false })
        .limit(1)
        .single();

      if (syncError && syncError.code !== 'PGRST116') {
        // PGRST116 is the "No rows returned" error - this is fine for first run
        throw syncError;
      }

      // Process the statistics
      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: totalCount || 0
      };

      if (statsCounts) {
        statsCounts.forEach((item: any) => {
          if (item.status in stats) {
            stats[item.status as keyof typeof stats] = item.count;
          }
        });
      }

      setQueueStats(stats);
      if (syncData) {
        setLastSync(syncData);
      }
    } catch (error) {
      console.error("Error fetching queue statistics:", error);
      toast.error("Failed to load queue statistics");
    }
  };

  // Fetch the Steam app list
  const fetchSteamAppList = async () => {
    try {
      setIsLoading(true);
      toast.info("Fetching Steam app list...");
      
      const { data, error } = await supabase.functions.invoke("fetch-steam-app-list");
      
      if (error) {
        console.error("Error fetching Steam app list:", error);
        toast.error("Failed to fetch Steam app list");
        return;
      }
      
      toast.success("Steam app list fetch initiated successfully!");
      console.log("App list fetch response:", data);
      
      // Reload stats after a short delay
      setTimeout(() => {
        fetchQueueStats();
        setIsLoading(false);
      }, 2000);
    } catch (err) {
      console.error("Error calling app list function:", err);
      toast.error("Error occurred while fetching app list");
      setIsLoading(false);
    }
  };

  // Process a batch of app details
  const processBatch = async () => {
    try {
      setIsFetchingDetails(true);
      toast.info("Processing batch of Steam app details...");
      
      const { data, error } = await supabase.functions.invoke("fetch-steam-app-details", {
        body: { processBatch: true, batchSize: 10 }
      });
      
      if (error) {
        console.error("Error processing app details:", error);
        toast.error("Failed to process app details");
        return;
      }
      
      toast.success("Processing batch initiated successfully!");
      console.log("Batch processing response:", data);
      
      // Reload stats after a short delay
      setTimeout(() => {
        fetchQueueStats();
        setIsFetchingDetails(false);
      }, 2000);
    } catch (err) {
      console.error("Error calling batch processing:", err);
      toast.error("Error occurred while processing batch");
      setIsFetchingDetails(false);
    }
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
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={fetchSteamAppList} 
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Fetching...' : 'Fetch Steam App List'}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Queue Statistics
            </CardTitle>
            <CardDescription>
              Current status of the Steam app processing queue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Pending</TableCell>
                    <TableCell>{queueStats.pending}</TableCell>
                    <TableCell>{queueStats.total > 0 ? `${(queueStats.pending / queueStats.total * 100).toFixed(1)}%` : '0%'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Processing</TableCell>
                    <TableCell>{queueStats.processing}</TableCell>
                    <TableCell>{queueStats.total > 0 ? `${(queueStats.processing / queueStats.total * 100).toFixed(1)}%` : '0%'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Completed</TableCell>
                    <TableCell>{queueStats.completed}</TableCell>
                    <TableCell>{queueStats.total > 0 ? `${(queueStats.completed / queueStats.total * 100).toFixed(1)}%` : '0%'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Failed</TableCell>
                    <TableCell>{queueStats.failed}</TableCell>
                    <TableCell>{queueStats.total > 0 ? `${(queueStats.failed / queueStats.total * 100).toFixed(1)}%` : '0%'}</TableCell>
                  </TableRow>
                  <TableRow className="font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell>{queueStats.total}</TableCell>
                    <TableCell>100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              onClick={processBatch} 
              disabled={isFetchingDetails || queueStats.pending === 0}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingDetails ? 'animate-spin' : ''}`} />
              {isFetchingDetails ? 'Processing...' : 'Process Next Batch'}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Controls</CardTitle>
          <CardDescription>
            Manage the Steam data processing workflow
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button 
            onClick={fetchQueueStats} 
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSteamDataPage;

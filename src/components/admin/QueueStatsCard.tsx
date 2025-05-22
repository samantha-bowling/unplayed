
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RefreshCw } from "lucide-react";

type QueueStatItem = {
  status: string;
  count: number;
};

interface QueueStatsCardProps {
  stats: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  };
  onRefresh: () => void;
  isLoading?: boolean;
  processedCount?: number;
}

const QueueStatsCard: React.FC<QueueStatsCardProps> = ({ 
  stats, 
  onRefresh, 
  isLoading = false,
  processedCount = 0
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Queue Statistics</CardTitle>
        <CardDescription>
          Current status of the Steam app processing queue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium">Pending</p>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="mr-2">{stats.pending}</Badge>
                <Progress
                  value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
                  className="h-2"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Processing</p>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="mr-2">{stats.processing}</Badge>
                <Progress
                  value={stats.total > 0 ? (stats.processing / stats.total) * 100 : 0}
                  className="h-2"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm font-medium">Completed</p>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="mr-2">{stats.completed}</Badge>
                <Progress
                  value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                  className="h-2"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Failed</p>
              <div className="flex items-center mt-1">
                <Badge variant="outline" className="mr-2">{stats.failed}</Badge>
                <Progress
                  value={stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}
                  className="h-2"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-gray-800">
            <p className="text-sm font-medium">Total Items in Queue</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          
          {processedCount > 0 && (
            <div className="pt-2 border-t border-gray-800">
              <p className="text-sm font-medium">Processed in this session</p>
              <p className="text-xl font-medium">{processedCount} games</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={onRefresh}
          disabled={isLoading}
          className="w-full"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh Statistics'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QueueStatsCard;

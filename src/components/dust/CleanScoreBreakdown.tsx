
import { CleanScoreBreakdown as CleanBreakdownType } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Medal, Calendar } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CleanScoreBreakdownProps {
  cleanScore: number;
  breakdown?: CleanBreakdownType;
  cleanStreak?: number;
  recentlyPlayedCount?: number;
}

const CleanScoreBreakdown = ({ 
  cleanScore, 
  breakdown, 
  cleanStreak = 0, 
  recentlyPlayedCount = 0 
}: CleanScoreBreakdownProps) => {
  // If no breakdown data is available, show placeholder
  if (!breakdown) {
    return (
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle>Clean Score Breakdown</CardTitle>
          <CardDescription>How your clean score is calculated</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <p className="text-gray-400">No breakdown data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-cyan-400" />
          Clean Score Breakdown
        </CardTitle>
        <CardDescription>
          Your Clean Score of {cleanScore} is calculated from these factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2 text-center text-cyan-400">🎮</span>
                  <span className="text-sm font-medium">Completion Rate</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-cyan-400">{breakdown.completionRate}%</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of your library you've played at least once</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={breakdown.completionRate} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-cyan-400 mt-[-8px] rounded-full" style={{ width: `${breakdown.completionRate}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                40% weight in your total score
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-sm font-medium">Engagement Factor</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-amber-400">{breakdown.engagementFactor}%</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How much time you've spent playing relative to expected playtime</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={breakdown.engagementFactor} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-amber-400 mt-[-8px] rounded-full" style={{ width: `${breakdown.engagementFactor}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                30% weight in your total score
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium">Recency Factor</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-green-400">{breakdown.recencyFactor}%</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How active you've been in the last 30 days</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={breakdown.recencyFactor} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-green-400 mt-[-8px] rounded-full" style={{ width: `${breakdown.recencyFactor}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                30% weight in your total score
              </p>
            </div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Gaming Activity</h3>
            <div className="space-y-4 text-sm">
              <div className="flex flex-col">
                <div className="flex items-center">
                  <Medal className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-gray-300">Clean Streak</span>
                  <span className="ml-auto text-amber-400 font-bold">{cleanStreak} days</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 pl-6">
                  {cleanStreak > 3 
                    ? "Impressive consistency!" 
                    : cleanStreak > 0 
                    ? "Keep the momentum going!" 
                    : "Start a streak by playing today!"}
                </p>
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-gray-300">Recently Played Games</span>
                  <span className="ml-auto text-green-400 font-bold">{recentlyPlayedCount}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 pl-6">Games played in the last 30 days</p>
              </div>
              
              {breakdown.completionRate > 0 && (
                <div className="flex flex-col">
                  <div className="flex items-center">
                    <span className="w-4 h-4 mr-2 text-center text-cyan-400">🧹</span>
                    <span className="text-gray-300">Backlog Cleaned</span>
                    <span className="ml-auto text-cyan-400 font-bold">{breakdown.completionRate}%</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 pl-6">
                    {breakdown.completionRate < 25 
                      ? "Still lots of untouched games" 
                      : breakdown.completionRate < 50 
                      ? "Making progress on your backlog" 
                      : breakdown.completionRate < 75 
                      ? "Good job tackling your library" 
                      : "Amazing library management!"}
                  </p>
                </div>
              )}
              
              <p className="pt-2 text-gray-400 italic">
                The final formula: (Completion × 0.4) + (Engagement × 0.3) + (Recency × 0.3) = Clean Score
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanScoreBreakdown;

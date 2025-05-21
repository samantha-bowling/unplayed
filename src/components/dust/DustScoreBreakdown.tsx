
import { DustScoreBreakdown as DustBreakdownType } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wind, Clock, Play } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DustScoreBreakdownProps {
  totalScore: number;
  breakdown?: DustBreakdownType;
}

const DustScoreBreakdown = ({ totalScore, breakdown }: DustScoreBreakdownProps) => {
  // Debug logging
  console.log("DustScoreBreakdown component received:", { totalScore, breakdown });

  // If no breakdown data is available, show placeholder
  if (!breakdown) {
    return (
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle>Dust Score Breakdown</CardTitle>
          <CardDescription>How your dust score is calculated</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <p className="text-gray-400">No breakdown data available</p>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate percentages for the visualizations
  const total = totalScore || 1; // Prevent division by zero
  const ageScorePercent = Math.round((breakdown.ageScore / total) * 100);
  const ownershipScorePercent = Math.round((breakdown.ownershipScore / total) * 100);
  const playtimeFactorPercent = Math.round(breakdown.playtimeFactor * 100);
  
  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-unplayed-mint" />
          Dust Score Breakdown
        </CardTitle>
        <CardDescription>
          Your total Dust Score of {totalScore} is calculated from these factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-unplayed-amber" />
                  <span className="text-sm font-medium">Age Score</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-unplayed-amber">{breakdown.ageScore}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Points based on how old the games in your library are</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={ageScorePercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-unplayed-amber mt-[-8px] rounded-full" style={{ width: `${ageScorePercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                {ageScorePercent}% of your total score comes from game age
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="w-4 h-4 mr-2 text-center text-unplayed-mint">📅</span>
                  <span className="text-sm font-medium">Ownership Score</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-unplayed-mint">{breakdown.ownershipScore}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Points based on how long you've owned your games</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={ownershipScorePercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-unplayed-mint mt-[-8px] rounded-full" style={{ width: `${ownershipScorePercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                {ownershipScorePercent}% of your total score comes from ownership time
              </p>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <Play className="h-4 w-4 mr-2 text-unplayed-pink" />
                  <span className="text-sm font-medium">Playtime Factor</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-unplayed-pink">{breakdown.playtimeFactor.toFixed(1)}x</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Multiplier based on your game playtime (lower for played games)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={playtimeFactorPercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-unplayed-pink mt-[-8px] rounded-full" style={{ width: `${playtimeFactorPercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                Playtime reduces your dust score by {(100 - playtimeFactorPercent)}%
              </p>
            </div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">How It's Calculated</h3>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-unplayed-amber font-bold">Age Score:</span> Based on how old the games in your library are. Older games get higher scores.
              </p>
              <p>
                <span className="text-unplayed-mint font-bold">Ownership Score:</span> Based on how long you've owned each game. Games owned for years accumulate more dust.
              </p>
              <p>
                <span className="text-unplayed-pink font-bold">Playtime Factor:</span> A multiplier that reduces your score for games you've played. Unplayed games get the full factor of 1.0x.
              </p>
              <p className="pt-2 text-gray-400 italic">
                The final formula: (Age Score + Ownership Score) × Playtime Factor = Dust Score
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DustScoreBreakdown;

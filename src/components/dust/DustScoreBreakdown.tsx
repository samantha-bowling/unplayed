
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
  
  // Ensure we have valid values for calculation
  const ageScore = breakdown.ageScore || 0;
  const ownershipScore = breakdown.ownershipScore || 0;
  const playtimeFactor = breakdown.playtimeFactor || 1.0;
  
  // Calculate percentages for the visualizations
  const actualTotal = totalScore || 1; // Prevent division by zero
  
  // Calculate what percentage each component contributes to the total
  const rawTotal = ageScore + ownershipScore;
  const ageScorePercent = Math.round((ageScore / (rawTotal || 1)) * 100);
  const ownershipScorePercent = Math.round((ownershipScore / (rawTotal || 1)) * 100);
  const playtimeFactorPercent = Math.round(playtimeFactor * 100);
  
  // Define dust score tiers based on total score
  const getDustTier = () => {
    if (totalScore < 1000) return {
      name: "Freshly Polished",
      color: "#A3F7BF",
      description: "Your library is well-maintained with minimal dust. Keep up the good work!"
    };
    if (totalScore < 5000) return {
      name: "Dust Storm Brewing",
      color: "#FF9F39",
      description: "You're starting to accumulate some dust. Consider playing a few neglected games."
    };
    if (totalScore < 10000) return {
      name: "Duststorm Warning",
      color: "#F6AD55",
      description: "Your backlog is becoming concerning. Time to make a dent in those unplayed games."
    };
    return {
      name: "Hoarder's Horizon",
      color: "#FF3C38",
      description: "Your library has reached critical dust levels. Serious intervention needed!"
    };
  };
  
  const dustTier = getDustTier();
  
  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wind className="h-5 w-5 text-unplayed-mint" />
          Dust Score Breakdown
        </CardTitle>
        <CardDescription>
          Your total Dust Score of {totalScore.toLocaleString()} is calculated from these factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="text-lg font-bold text-unplayed-amber">{ageScore}</span>
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
                {ageScorePercent}% of your raw score comes from game age
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
                      <span className="text-lg font-bold text-unplayed-mint">{ownershipScore}</span>
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
                {ownershipScorePercent}% of your raw score comes from ownership time
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
                      <span className="text-lg font-bold text-unplayed-pink">{playtimeFactor.toFixed(2)}x</span>
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
            <div>
              <h3 className="text-lg font-medium mb-2">Your Dust Tier</h3>
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: dustTier.color }}></div>
                <span className="font-medium" style={{ color: dustTier.color }}>{dustTier.name}</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{dustTier.description}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">What It Means</h3>
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
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/20 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">How to Improve</h3>
          <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
            <li>Play the games with the highest dust scores first</li>
            <li>Focus on games you've owned for a long time</li>
            <li>Play newer game purchases before they accumulate dust</li>
            <li>Set aside regular time to tackle your backlog</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DustScoreBreakdown;

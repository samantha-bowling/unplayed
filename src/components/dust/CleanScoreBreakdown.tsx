
import { CleanScoreBreakdown as CleanBreakdownType } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, Medal, Calendar, HelpCircle } from 'lucide-react';
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

  // Define comprehensive tier information
  const getTierInfo = () => {
    if (cleanScore >= 90) return {
      name: "Pristine Collection",
      color: "#4ade80",
      description: "Your library management is exemplary. You play most of your games and engage deeply with them.",
      tips: [
        "Maintain your excellent habits",
        "Consider streaming or sharing your library management techniques",
        "You're in the top percentile of Steam library managers!"
      ]
    };
    if (cleanScore >= 75) return {
      name: "Dust-Free Shelf",
      color: "#22d3ee",
      description: "Your library is very well maintained with thoughtful curation and regular play sessions.",
      tips: [
        "Keep your momentum going",
        "Try to play a wider variety of your games",
        "You're close to reaching pristine status!"
      ]
    };
    if (cleanScore >= 50) return {
      name: "Reasonably Clean",
      color: "#60a5fa",
      description: "You're doing better than most gamers at maintaining your library, but there's room for improvement.",
      tips: [
        "Try to increase your play frequency",
        "Set aside time each week to try new games in your library",
        "Focus on games you've owned longest"
      ]
    };
    if (cleanScore >= 25) return {
      name: "Needs a Wipe",
      color: "#f59e0b",
      description: "Your library is showing signs of neglect with many unplayed titles accumulating dust.",
      tips: [
        "Create a schedule to play your backlog",
        "Consider using the random game picker regularly",
        "Try the '2-hour rule': give each unplayed game at least 2 hours"
      ]
    };
    return {
      name: "Filthy Casual",
      color: "#f87171",
      description: "Your library is severely neglected. You have many unplayed or barely touched games collecting dust.",
      tips: [
        "Focus on playing games you already own before buying new ones",
        "Consider hiding games you know you'll never play",
        "Try playing one new game from your library each week"
      ]
    };
  };
  
  const tierInfo = getTierInfo();
  
  return (
    <Card className="terminal-container">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-cyan-400" />
              Clean Score Breakdown
            </CardTitle>
            <CardDescription>
              Your Clean Score of {cleanScore} is calculated from these factors
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">How to Improve</h3>
              <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                {tierInfo.tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Medal className="h-4 w-4 mr-2 text-amber-400" />
                  <span className="text-gray-300 font-medium mr-1">Clean Streak</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-gray-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Clean Streak counts the consecutive days you've played your games. Playing at least one game each day maintains your streak.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="ml-auto text-amber-400 font-bold">{cleanStreak} days</span>
                </div>
                <p className="text-xs text-gray-400">
                  {cleanStreak > 3 
                    ? "Impressive consistency!" 
                    : cleanStreak > 0 
                    ? "Keep the momentum going!" 
                    : "Start a streak by playing today!"}
                </p>
              </div>
              
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-gray-300 font-medium">Recently Played Games</span>
                  <span className="ml-auto text-green-400 font-bold">{recentlyPlayedCount}</span>
                </div>
                <p className="text-xs text-gray-400">Games played in the last 30 days</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-3">
              <h3 className="text-lg font-medium mb-1">Your Clean Tier</h3>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tierInfo.color }}></div>
                <span className="font-medium" style={{ color: tierInfo.color }}>
                  {tierInfo.name}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {tierInfo.description}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">What It Means</h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-cyan-400 font-bold">Completion Rate:</span> Percentage of your library that you've played at least once.
                </p>
                <p>
                  <span className="text-amber-400 font-bold">Engagement Factor:</span> How deeply you engage with the games you play compared to expected playtime.
                </p>
                <p>
                  <span className="text-green-400 font-bold">Recency Factor:</span> How active you've been with your library in the past 30 days.
                </p>
              </div>
            </div>
            
            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Clean Score Tiers</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#4ade80]"></div>
                    <span className="font-medium text-[#4ade80]">Pristine Collection</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">90-100</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#22d3ee]"></div>
                    <span className="font-medium text-[#22d3ee]">Dust-Free Shelf</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">75-89</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#60a5fa]"></div>
                    <span className="font-medium text-[#60a5fa]">Reasonably Clean</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">50-74</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#f59e0b]"></div>
                    <span className="font-medium text-[#f59e0b]">Needs a Wipe</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">25-49</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#f87171]"></div>
                    <span className="font-medium text-[#f87171]">Filthy Casual</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">0-24</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CleanScoreBreakdown;

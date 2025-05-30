import { CleanScoreBreakdown as CleanBreakdownType, CleanStreakMetadata } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, ShieldCheck, Calendar, HelpCircle, Trophy, Zap, Target, Brush, Medal } from 'lucide-react';
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
  recentlyPlayedUnplayed?: number;
  cleanStreakMetadata?: CleanStreakMetadata;
}

const CleanScoreBreakdown = ({ 
  cleanScore, 
  breakdown, 
  cleanStreak = 0, 
  recentlyPlayedCount = 0,
  recentlyPlayedUnplayed = 0,
  cleanStreakMetadata
}: CleanScoreBreakdownProps) => {
  // If no breakdown data is available, show placeholder
  if (!breakdown) {
    return (
      <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
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

  // Get streak quality icon and color
  const getStreakQuality = () => {
    const quality = cleanStreakMetadata?.streakQuality || 'bronze';
    switch (quality) {
      case 'gold':
        return { icon: Trophy, color: '#ffd700', label: 'Gold Streak' };
      case 'silver':
        return { icon: Medal, color: '#c0c0c0', label: 'Silver Streak' };
      default:
        return { icon: Target, color: '#cd7f32', label: 'Bronze Streak' };
    }
  };

  const streakQuality = getStreakQuality();
  
  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brush className="h-5 w-5 text-cyan-400" />
              Clean Score Breakdown
            </CardTitle>
            <CardDescription className="text-base mt-3">
              Your Clean Score of <span className="text-white font-bold">{cleanScore}</span> is calculated from these factors
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
                  <ShieldCheck className="h-4 w-4 mr-2 text-cyan-400" />
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

            {/* Enhanced Clean Streak Section */}
            <div className="space-y-3">
              <div className="bg-black/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <streakQuality.icon className="h-5 w-5 mr-2" style={{ color: streakQuality.color }} />
                  <span className="text-gray-300 font-medium mr-1">Clean Streak</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-sm">
                        <div className="space-y-2">
                          <p><strong>Grace Period:</strong> 1-2 day breaks won't reset your streak - life happens!</p>
                          <p><strong>Minimum Sessions:</strong> Play for 30+ minutes to count towards streak</p>
                          <p><strong>Streak Decay:</strong> Long breaks gradually reduce streak instead of instant reset</p>
                          {cleanStreakMetadata?.averageSessionLength && (
                            <p><strong>Your Average:</strong> {cleanStreakMetadata.averageSessionLength} min/session</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="ml-auto font-bold" style={{ color: streakQuality.color }}>
                    {cleanStreak} days
                  </span>
                </div>
                
                <div className="text-xs text-gray-400 space-y-1">
                  <p className="font-medium" style={{ color: streakQuality.color }}>
                    {streakQuality.label}
                  </p>
                  {cleanStreakMetadata?.gracePeriodUsed && (
                    <p className="text-yellow-400">Grace period active - keep it up!</p>
                  )}
                  {cleanStreakMetadata?.lastPlayDate && (
                    <p>Last played: {new Date(cleanStreakMetadata.lastPlayDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Calendar className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-gray-300 font-medium">Recently Played Games</span>
                  <span className="ml-auto text-green-400 font-bold">{recentlyPlayedCount}</span>
                </div>
                <p className="text-xs text-gray-400">Games played in the last 30 days</p>
              </div>

              {/* New Recently Played Unplayed Section */}
              <div className="bg-black/20 rounded-lg p-3">
                <div className="flex items-center mb-1">
                  <Zap className="h-4 w-4 mr-2 text-purple-400" />
                  <span className="text-gray-300 font-medium">Backlog Progress</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-gray-500 cursor-help ml-1" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Games that had zero playtime when you signed up but you've since started playing. This shows your progress in tackling your backlog!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="ml-auto text-purple-400 font-bold">{recentlyPlayedUnplayed}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {recentlyPlayedUnplayed > 0 
                    ? "Great progress conquering your backlog!" 
                    : "Start playing some unplayed games to see progress here"}
                </p>
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
              <h3 className="text-lg font-medium mb-2">Clean Streak System</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-green-400 font-medium">Grace Period</p>
                    <p className="text-gray-300">1-2 day breaks won't reset your streak. Taking breaks is healthy!</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-amber-400 font-medium">Minimum Sessions</p>
                    <p className="text-gray-300">Play for 30+ minutes to count towards your streak</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-blue-400 font-medium">Gradual Decay</p>
                    <p className="text-gray-300">Long breaks reduce your streak gradually, not instantly</p>
                  </div>
                </div>
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

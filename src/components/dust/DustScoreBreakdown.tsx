
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Beaker, TrendingUp, Calendar, DollarSign, Gamepad2, Clock, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DustScoreBreakdownProps {
  totalScore: number;
  breakdown?: {
    qualityScore: number;
    priceScore: number;
    ageScore: number;
    genreScore: number;
    playtimeFactor: number;
  };
}

const DustScoreBreakdown: React.FC<DustScoreBreakdownProps> = ({
  totalScore,
  breakdown
}) => {
  // Use graceful defaults if breakdown is not provided
  const defaultBreakdown = {
    qualityScore: 10,  // Neutral for missing Metacritic
    priceScore: 7,     // Slightly above free for missing price
    ageScore: 15,      // Moderate for missing release date
    genreScore: 7,     // Neutral for missing genres
    playtimeFactor: 1.0 // Unplayed for missing playtime
  };

  const actualBreakdown = breakdown || defaultBreakdown;

  // Map new 5-factor scores back to original 3-factor display for consistency
  const factors = [
    {
      name: "Age Score",
      value: actualBreakdown.ageScore,
      description: "How old this game is - older games accumulate more dust naturally",
      icon: Calendar,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20"
    },
    {
      name: "Ownership Score", 
      value: actualBreakdown.priceScore, // Map price score to ownership for display consistency
      description: "How long you've owned this game and how much it cost - expensive games create guilt dust",
      icon: DollarSign,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      name: "Popularity Score",
      value: actualBreakdown.qualityScore, // Map quality score to popularity for display consistency
      description: "How critically acclaimed this game is - high-rated games create shame dust when unplayed",
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    }
  ];

  const playtimeFactorPercentage = Math.round(actualBreakdown.playtimeFactor * 100);

  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-unplayed-mint" />
          Dust Score Breakdown™
        </CardTitle>
        <p className="text-gray-400 mt-2">
          Scientific analysis of your library's dust accumulation factors
        </p>
      </CardHeader>
      
      <CardContent>
        {/* Total Score Display */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-unplayed-pink/20 border-2 border-unplayed-pink/30 mb-4">
            <span className="text-3xl font-bold text-unplayed-pink">{totalScore}</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Total Dust Score</h3>
          <p className="text-sm text-gray-400">
            {totalScore >= 50 ? "Critical dust accumulation detected!" : 
             totalScore >= 30 ? "Moderate dust levels" : 
             "Dust levels under control"}
          </p>
        </div>

        {/* Factor Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {factors.map((factor) => {
            const Icon = factor.icon;
            return (
              <div key={factor.name} className={`${factor.bgColor} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${factor.color}`} />
                    <span className="font-medium text-white">{factor.name}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-gray-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{factor.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className={`text-lg font-bold ${factor.color}`}>
                    {factor.value}
                  </span>
                </div>
                
                {/* Visual bar for the score */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${factor.color.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min((factor.value / 30) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playtime Multiplier */}
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-white">Playtime Multiplier</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-gray-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Reduces dust score based on playtime. Unplayed games get full score (100%), 
                      while well-played games get minimal dust (10%).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-lg font-bold text-cyan-400">
              {playtimeFactorPercentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${playtimeFactorPercentage}%` }}
            ></div>
          </div>
          
          <p className="text-xs text-gray-400">
            {actualBreakdown.playtimeFactor === 1.0 ? "Completely unplayed - maximum dust potential!" :
             actualBreakdown.playtimeFactor >= 0.9 ? "Barely touched - high dust accumulation" :
             actualBreakdown.playtimeFactor >= 0.6 ? "Within refund window - moderate dust" :
             actualBreakdown.playtimeFactor >= 0.3 ? "Given a fair chance - reduced dust" :
             "Well played - minimal dust accumulation"}
          </p>
        </div>

        {/* Algorithm Info */}
        <div className="mt-6 p-4 bg-unplayed-mint/10 border border-unplayed-mint/20 rounded-lg">
          <h4 className="font-medium text-unplayed-mint mb-2">Dust Score Algorithm</h4>
          <p className="text-sm text-gray-300 leading-relaxed">
            Your dust score is calculated using the age of your games, how long you've owned them, 
            their critical reception, and your actual playtime. The algorithm rewards you for 
            playing games and penalizes digital hoarding.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DustScoreBreakdown;

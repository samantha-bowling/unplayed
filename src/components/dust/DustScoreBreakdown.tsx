
import React from 'react';
import { TrendingUp, Calendar, DollarSign, Gamepad2, Clock, Trophy, Target, Lightbulb } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

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

  // Define dust tiers
  const dustTiers = [
    { name: "Pristine", range: "0-20", color: "text-green-400", description: "Your library is spotless! You actually play your games." },
    { name: "Light Dust", range: "21-40", color: "text-blue-400", description: "A few cobwebs here and there, but mostly under control." },
    { name: "Moderate Accumulation", range: "41-60", color: "text-yellow-400", description: "Some dust bunnies are forming. Time to start playing!" },
    { name: "Heavy Buildup", range: "61-80", color: "text-orange-400", description: "Significant dust layers detected. Your wallet is crying." },
    { name: "Critical Mass", range: "81-100", color: "text-red-400", description: "Dust storm detected! You have a serious hoarding problem." },
  ];

  // Determine current tier
  const getCurrentTier = (score: number) => {
    if (score <= 20) return dustTiers[0];
    if (score <= 40) return dustTiers[1];
    if (score <= 60) return dustTiers[2];
    if (score <= 80) return dustTiers[3];
    return dustTiers[4];
  };

  const currentTier = getCurrentTier(totalScore);

  // Define all 5 factors with their individual progress bars
  const factors = [
    {
      name: "Quality Score",
      value: actualBreakdown.qualityScore,
      description: "High-rated games create shame dust when unplayed",
      icon: TrendingUp,
      color: "text-blue-400",
      progressColor: "#60a5fa"
    },
    {
      name: "Price Score", 
      value: actualBreakdown.priceScore,
      description: "Expensive games create guilt dust",
      icon: DollarSign,
      color: "text-green-400",
      progressColor: "#34d399"
    },
    {
      name: "Age Score",
      value: actualBreakdown.ageScore,
      description: "Older games accumulate more dust naturally",
      icon: Calendar,
      color: "text-amber-400",
      progressColor: "#fbbf24"
    },
    {
      name: "Genre Score",
      value: actualBreakdown.genreScore,
      description: "Unwanted genres collect dust faster",
      icon: Gamepad2,
      color: "text-purple-400",
      progressColor: "#a78bfa"
    },
    {
      name: "Playtime Factor",
      value: Math.round(actualBreakdown.playtimeFactor * 100),
      description: "Unplayed games get maximum dust accumulation",
      icon: Clock,
      color: "text-cyan-400",
      progressColor: "#22d3ee",
      isPercentage: true
    }
  ];

  return (
    <div className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-unplayed-mint mb-2">
          Your total Dust Score of {totalScore} is calculated from these 5 factors:
        </h2>
        <p className="text-gray-400">
          A scientific breakdown of your digital hoarding habits
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column - Factor Breakdown */}
        <div className="space-y-6">
          {factors.map((factor) => {
            const Icon = factor.icon;
            const displayValue = factor.isPercentage ? `${factor.value}%` : factor.value;
            const progressValue = factor.isPercentage ? factor.value : Math.min((factor.value / 30) * 100, 100);
            
            return (
              <div key={factor.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${factor.color}`} />
                    <span className="font-medium text-white">{factor.name}</span>
                  </div>
                  <span className={`text-xl font-bold ${factor.color}`}>
                    {displayValue}
                  </span>
                </div>
                
                <Progress 
                  value={progressValue} 
                  className="h-4"
                  style={{
                    '--progress-background': factor.progressColor
                  } as React.CSSProperties}
                />
                
                <p className="text-sm text-gray-400">
                  {factor.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column - Tier, Explanations, and Tips */}
        <div className="space-y-8">
          
          {/* Your Dust Tier */}
          <div className="bg-black/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className={`h-6 w-6 ${currentTier.color}`} />
              <h3 className="text-xl font-semibold text-white">Your Dust Tier</h3>
            </div>
            
            <div className="mb-4">
              <span className={`text-2xl font-bold ${currentTier.color}`}>
                {currentTier.name}
              </span>
              <span className="text-gray-400 ml-2">({currentTier.range})</span>
            </div>
            
            <p className="text-gray-300">
              {currentTier.description}
            </p>
          </div>

          {/* What It Means */}
          <div className="bg-black/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-6 w-6 text-unplayed-mint" />
              <h3 className="text-xl font-semibold text-white">What It Means</h3>
            </div>
            
            <div className="space-y-3 text-sm text-gray-300">
              <p><strong className="text-blue-400">Quality:</strong> Critically acclaimed games make you feel guilty for not playing them.</p>
              <p><strong className="text-green-400">Price:</strong> Expensive games create more dust because they represent wasted money.</p>
              <p><strong className="text-amber-400">Age:</strong> Older games naturally accumulate dust over time.</p>
              <p><strong className="text-purple-400">Genre:</strong> Games in genres you don't prefer collect dust faster.</p>
              <p><strong className="text-cyan-400">Playtime:</strong> Unplayed games get maximum dust; played games get less.</p>
            </div>
          </div>

          {/* How to Improve */}
          <div className="bg-black/30 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="h-6 w-6 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">How to Improve</h3>
            </div>
            
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Start playing your highest-rated unplayed games</li>
              <li>• Focus on expensive games you haven't touched</li>
              <li>• Try older games that have been sitting in your library</li>
              <li>• Hide or remove games in genres you don't enjoy</li>
              <li>• Even 30 minutes of playtime dramatically reduces dust</li>
            </ul>
          </div>

          {/* Dust Score Tiers */}
          <div className="bg-black/30 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Dust Score Tiers</h3>
            
            <div className="space-y-2">
              {dustTiers.map((tier, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className={`font-medium ${tier.color}`}>{tier.name}</span>
                  <span className="text-gray-400">{tier.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DustScoreBreakdown;

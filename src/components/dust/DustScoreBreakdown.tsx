
import { DustScoreBreakdown as DustBreakdownType } from '@/types/unplayed-data.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Wind, Clock, Play, Star, DollarSign, BookMarked } from 'lucide-react';
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
  console.log("DustScoreBreakdown received:", { totalScore, breakdown });

  // If no breakdown data is available, show placeholder
  if (!breakdown) {
    return (
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle>Dust Score Breakdown</CardTitle>
          <CardDescription>How your dust score is calculated</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <p className="text-gray-400">No breakdown data available - calculating real factors...</p>
        </CardContent>
      </Card>
    );
  }
  
  // Use real calculated values from Phase 2 data
  const qualityScore = breakdown.qualityScore || 0;
  const priceScore = breakdown.priceScore || 0;
  const ageScore = breakdown.ageScore || 0;
  const genreScore = breakdown.genreScore || 0;
  const playtimeFactor = breakdown.playtimeFactor || 1.0;
  
  // Calculate percentages for the visualizations based on real data
  const rawTotal = qualityScore + priceScore + ageScore + genreScore;
  const qualityPercent = rawTotal > 0 ? Math.round((qualityScore / rawTotal) * 100) : 0;
  const pricePercent = rawTotal > 0 ? Math.round((priceScore / rawTotal) * 100) : 0;
  const agePercent = rawTotal > 0 ? Math.round((ageScore / rawTotal) * 100) : 0;
  const genrePercent = rawTotal > 0 ? Math.round((genreScore / rawTotal) * 100) : 0;
  const playtimePercent = Math.round(playtimeFactor * 100);
  
  // Enhanced 8-tier dust score system with better granularity
  const getDustTier = () => {
    if (totalScore < 500) return {
      name: "Freshly Polished",
      color: "#A3F7BF",
      description: "Your library sparkles! You're a gaming efficiency master with minimal dust accumulation."
    };
    if (totalScore < 1500) return {
      name: "Light Dusting",
      color: "#90EE90",
      description: "A few games gathering dust, but nothing a quick gaming session can't fix!"
    };
    if (totalScore < 3500) return {
      name: "Dust Storm Brewing",
      color: "#FFD700",
      description: "You're starting to accumulate some dust. Time to dust off a few classics!"
    };
    if (totalScore < 7500) return {
      name: "Duststorm Warning",
      color: "#FF9F39",
      description: "Your backlog is becoming concerning. Consider making a strategic gaming plan."
    };
    if (totalScore < 15000) return {
      name: "Hoarder's Horizon",
      color: "#F6AD55",
      description: "You've crossed into serious collector territory. Your backlog has its own ecosystem!"
    };
    if (totalScore < 35000) return {
      name: "Dust Dynasty",
      color: "#FF6347",
      description: "You're building a gaming empire! Your unplayed collection could stock a small store."
    };
    if (totalScore < 75000) return {
      name: "Legendary Collector",
      color: "#8A2BE2",
      description: "Your collection has reached legendary status. You're preserving gaming history!"
    };
    return {
      name: "Mythical Archive",
      color: "#FF1493",
      description: "You've transcended mere collecting - you're a gaming library of Alexandria!"
    };
  };
  
  const dustTier = getDustTier();
  
  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-unplayed-mint" />
              Dust Score Breakdown
            </CardTitle>
            <CardDescription className="text-base mt-3">
              Your total Dust Score of <span className="font-bold" style={{ color: '#FAFAFA' }}>{totalScore.toLocaleString()}</span> is calculated from real data across these 5 factors
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
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  <span className="text-sm font-medium">Quality Score</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-yellow-400">{qualityScore}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on real Metacritic scores from your games - lower quality games get higher dust scores</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={qualityPercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-yellow-400 mt-[-8px] rounded-full" style={{ width: `${qualityPercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                {qualityPercent}% of your raw score comes from game quality
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-sm font-medium">Price Score</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-green-400">{priceScore}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on real game prices - more expensive unplayed games accumulate more dust</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={pricePercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-green-400 mt-[-8px] rounded-full" style={{ width: `${pricePercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                {pricePercent}% of your raw score comes from game pricing
              </p>
            </div>
            
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
                      <p>Based on real game release dates - older games get higher scores</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={agePercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-unplayed-amber mt-[-8px] rounded-full" style={{ width: `${agePercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                {agePercent}% of your raw score comes from game age
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <BookMarked className="h-4 w-4 mr-2 text-purple-400" />
                  <span className="text-sm font-medium">Genre Score</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-lg font-bold text-purple-400">{genreScore}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on real genre data - niche genres get higher scores</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={genrePercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-purple-400 mt-[-8px] rounded-full" style={{ width: `${genrePercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                {genrePercent}% of your raw score comes from genre rarity
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
                      <p>Real multiplier based on your actual game playtime (lower for played games)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={playtimePercent} className="h-2 bg-gray-700" />
              <div className="h-0.5 bg-unplayed-pink mt-[-8px] rounded-full" style={{ width: `${playtimePercent}%` }}></div>
              <p className="text-xs text-gray-400 mt-1">
                Real playtime reduces your dust score by {(100 - playtimePercent)}%
              </p>
            </div>

            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">How to Improve</h3>
              <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                <li>Play high-quality games you've been avoiding</li>
                <li>Focus on expensive games sitting in your backlog</li>
                <li>Tackle older games before they accumulate more dust</li>
                <li>Try games from genres you don't usually play</li>
                <li>Set aside regular time to reduce your unplayed collection</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-black/30 rounded-lg p-3">
              <h3 className="text-lg font-medium mb-1">Your Dust Tier</h3>
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: dustTier.color }}></div>
                <span className="font-medium" style={{ color: dustTier.color }}>
                  {dustTier.name}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {dustTier.description}
              </p>
            </div>

            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">What It Means</h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-yellow-400 font-bold">Quality:</span> Games with poor reviews or no Metacritic score get higher dust scores.
                </p>
                <p>
                  <span className="text-green-400 font-bold">Price:</span> More expensive unplayed games accumulate significantly more dust.
                </p>
                <p>
                  <span className="text-unplayed-amber font-bold">Age:</span> Older games get higher scores - classics deserve attention!
                </p>
                <p>
                  <span className="text-purple-400 font-bold">Genre:</span> Niche or rare genres get slightly higher scores.
                </p>
                <p>
                  <span className="text-unplayed-pink font-bold">Playtime:</span> Playing games significantly reduces their dust accumulation.
                </p>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Enhanced Dust Score Tiers</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#A3F7BF]"></div>
                    <span className="font-medium text-[#A3F7BF]">Freshly Polished</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">0-499</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#90EE90]"></div>
                    <span className="font-medium text-[#90EE90]">Light Dusting</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">500-1,499</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#FFD700]"></div>
                    <span className="font-medium text-[#FFD700]">Dust Storm Brewing</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">1,500-3,499</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#FF9F39]"></div>
                    <span className="font-medium text-[#FF9F39]">Duststorm Warning</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">3,500-7,499</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#F6AD55]"></div>
                    <span className="font-medium text-[#F6AD55]">Hoarder's Horizon</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">7,500-14,999</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#FF6347]"></div>
                    <span className="font-medium text-[#FF6347]">Dust Dynasty</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">15,000-34,999</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#8A2BE2]"></div>
                    <span className="font-medium text-[#8A2BE2]">Legendary Collector</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">35,000-74,999</span>
                </div>
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 bg-[#FF1493]"></div>
                    <span className="font-medium text-[#FF1493]">Mythical Archive</span>
                  </div>
                  <span className="text-xs text-gray-400 pl-5">75,000+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DustScoreBreakdown;

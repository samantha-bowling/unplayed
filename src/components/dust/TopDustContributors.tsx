
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skull, Clock, Calendar, HelpCircle, Star, DollarSign, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DustContributor {
  id: number;
  name: string;
  dustScore: number;
  addedDate: string;
  releaseDate: string;
  playtimeMinutes: number;
  image?: string;
  breakdown: {
    qualityScore: number;
    priceScore: number;
    ageScore: number;
    genreScore: number;
    playtimeFactor: number;
  };
}

interface TopDustContributorsProps {
  contributors: DustContributor[];
}

const TopDustContributors: React.FC<TopDustContributorsProps> = ({ contributors }) => {
  const [showTop, setShowTop] = React.useState("10");

  const displayedContributors = contributors.slice(0, parseInt(showTop));

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatPlaytime = (minutes: number) => {
    if (minutes === 0) return 'Unplayed';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Skull className="h-5 w-5 text-unplayed-pink" />
              Top Dust Contributors
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Games creating the most dust using our enhanced 5-factor algorithm
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Show top:</span>
            <Select value={showTop} onValueChange={setShowTop}>
              <SelectTrigger className="w-20 bg-black/40 border-unplayed-mint/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-400">games</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {displayedContributors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No dust contributors found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enhanced Header with 5-Factor Icons */}
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400 border-b border-gray-700 pb-2">
              <div className="col-span-4">Game</div>
              <div className="col-span-2 text-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center gap-1 cursor-help">
                        Dust Score
                        <HelpCircle className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enhanced 5-factor dust score: Quality + Price + Age + Genre + Playtime</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="col-span-3 text-center">5-Factor Breakdown</div>
              <div className="col-span-2 text-center">Release Date</div>
              <div className="col-span-1 text-center">Playtime</div>
            </div>

            {/* Games List with Enhanced Breakdown */}
            {displayedContributors.map((game, index) => (
              <div key={game.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-800 last:border-b-0 hover:bg-gray-800/30 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-unplayed-pink/20 flex items-center justify-center text-xs font-bold text-unplayed-pink">
                    {index + 1}
                  </div>
                  {game.image && (
                    <img 
                      src={game.image} 
                      alt={game.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{game.name}</p>
                  </div>
                </div>
                
                <div className="col-span-2 text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-lg font-bold text-unplayed-pink cursor-help">
                          {game.dustScore}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <p><strong>Enhanced 5-Factor Breakdown:</strong></p>
                          <p>Quality: {game.breakdown.qualityScore}</p>
                          <p>Price: {game.breakdown.priceScore}</p>
                          <p>Age: {game.breakdown.ageScore}</p>
                          <p>Genre: {game.breakdown.genreScore}</p>
                          <p>Playtime Factor: {game.breakdown.playtimeFactor}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Enhanced 5-Factor Visual Breakdown */}
                <div className="col-span-3 flex items-center justify-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <Star className="h-3 w-3 text-blue-400" />
                          <span className="text-xs text-blue-400">{game.breakdown.qualityScore}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Quality Score (Metacritic-based)</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <DollarSign className="h-3 w-3 text-green-400" />
                          <span className="text-xs text-green-400">{game.breakdown.priceScore}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Price Score</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <Calendar className="h-3 w-3 text-amber-400" />
                          <span className="text-xs text-amber-400">{game.breakdown.ageScore}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Age Score</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <Gamepad2 className="h-3 w-3 text-purple-400" />
                          <span className="text-xs text-purple-400">{game.breakdown.genreScore}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Genre Score</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-help">
                          <Clock className="h-3 w-3 text-cyan-400" />
                          <span className="text-xs text-cyan-400">{Math.round(game.breakdown.playtimeFactor * 100)}%</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent><p>Playtime Multiplier</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="text-sm text-gray-300">
                    {formatDate(game.releaseDate)}
                  </span>
                </div>
                
                <div className="col-span-1 text-center">
                  <span className={`text-sm ${game.playtimeMinutes === 0 ? 'text-unplayed-mint' : 'text-gray-300'}`}>
                    {formatPlaytime(game.playtimeMinutes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Enhanced algorithm now factors in game quality - high-rated unplayed games create more dust!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopDustContributors;

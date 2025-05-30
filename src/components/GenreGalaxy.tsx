
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Stars, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GenreGalaxyProps {
  genres: Array<{ genre: string; count: number }>;
  totalGames: number;
}

const GenreGalaxy = ({ genres, totalGames }: GenreGalaxyProps) => {
  // Take top 8 genres for the galaxy
  const galaxyGenres = genres.slice(0, 8);

  // Calculate star sizes based on genre popularity
  const getStarSize = (count: number) => {
    const maxCount = genres[0]?.count || 1;
    const ratio = count / maxCount;
    return 8 + (ratio * 12); // Size between 8px and 20px
  };

  // Get star intensity/brightness
  const getStarBrightness = (count: number) => {
    const maxCount = genres[0]?.count || 1;
    const ratio = count / maxCount;
    return 0.6 + (ratio * 0.4); // Opacity between 0.6 and 1.0
  };

  // Predefined constellation positions for consistent layout
  const constellationPositions = [
    { x: 15, y: 20 }, // Top left
    { x: 45, y: 15 }, // Top center
    { x: 75, y: 25 }, // Top right
    { x: 25, y: 45 }, // Mid left
    { x: 55, y: 40 }, // Mid center
    { x: 80, y: 55 }, // Mid right
    { x: 20, y: 75 }, // Bottom left
    { x: 65, y: 80 }, // Bottom right
  ];

  return (
    <Card className="bg-black/20 border border-gray-700 h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Stars className="h-5 w-5 text-purple-400" />
          <span>Genre Galaxy</span>
          <Tooltip>
            <TooltipTrigger>
              <Sparkles className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Your most popular genres visualized as a constellation. Brighter and larger stars represent genres with more games.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center">
        <div className="relative w-full h-48 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20 rounded-lg overflow-hidden">
          {/* Background stars for ambiance */}
          <div className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={`bg-star-${i}`}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Genre constellation stars */}
          <TooltipProvider>
            {galaxyGenres.map((genre, index) => {
              const position = constellationPositions[index] || { x: 50, y: 50 };
              const size = getStarSize(genre.count);
              const brightness = getStarBrightness(genre.count);
              
              return (
                <Tooltip key={genre.genre}>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-help group"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                      }}
                    >
                      {/* Main star */}
                      <div
                        className="bg-gradient-to-br from-yellow-300 via-purple-400 to-pink-400 rounded-full shadow-lg group-hover:scale-125 transition-transform duration-300"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          opacity: brightness,
                          boxShadow: `0 0 ${size * 1.5}px rgba(168, 85, 247, 0.4)`,
                        }}
                      />
                      
                      {/* Star glow effect */}
                      <div
                        className="absolute inset-0 bg-white/30 rounded-full blur-sm group-hover:blur-md transition-all duration-300"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                        }}
                      />
                      
                      {/* Genre label */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          {genre.genre}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{genre.genre}</p>
                      <p className="text-sm">{genre.count} games ({Math.round((genre.count / totalGames) * 100)}%)</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>

          {/* Constellation connections (subtle lines between nearby stars) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {galaxyGenres.slice(0, -1).map((_, index) => {
              const start = constellationPositions[index];
              const end = constellationPositions[index + 1];
              if (!start || !end) return null;
              
              return (
                <line
                  key={`connection-${index}`}
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke="rgba(168, 85, 247, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="2,3"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Galaxy legend */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Exploring your personal gaming universe • {galaxyGenres.length} constellations discovered
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenreGalaxy;

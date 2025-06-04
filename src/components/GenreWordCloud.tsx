
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Worm, HelpCircle } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RAINBOW_COLORS } from '@/utils/genre-processing';

const GenreWordCloud = () => {
  const { games: libraryGames } = useLibraryData();

  // Calculate genre statistics
  const genreStats = React.useMemo(() => {
    const genreCount: Record<string, number> = {};
    
    libraryGames.forEach(game => {
      const genres = game.genres || [];
      genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    return Object.entries(genreCount)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count);
  }, [libraryGames]);

  const maxCount = genreStats.length > 0 ? genreStats[0].count : 1;

  // Function to calculate font size based on count
  const getFontSize = (count: number) => {
    const baseSize = 12;
    const maxSize = 24;
    const ratio = count / maxCount;
    return baseSize + (maxSize - baseSize) * ratio;
  };

  // Convert rainbow colors to Tailwind classes
  const rainbowClasses = [
    'text-red-400',
    'text-orange-400', 
    'text-yellow-400',
    'text-green-400',
    'text-blue-400',
    'text-indigo-400',
    'text-purple-400',
    'text-pink-400',
    'text-rose-400',
    'text-cyan-400',
    'text-lime-400',
    'text-emerald-400',
  ];

  const getRainbowClass = (index: number) => rainbowClasses[index % rainbowClasses.length];

  return (
    <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Worm className="h-5 w-5 text-unplayed-mint" />
          <span>The Rainbow Genre Inchworm</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium mb-1">The Rainbow Genre Inchworm</p>
                  <p className="text-sm">A colorful visualization of your genre collection! Each genre crawls across the rainbow spectrum, with size indicating how many games you own in that genre. The inchworm moves through all the colors of gaming!</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {genreStats.length > 0 ? (
          <TooltipProvider>
            <div className="flex flex-wrap items-center justify-center gap-3 p-4">
              {genreStats.map((genre, index) => (
                <Tooltip key={genre.genre}>
                  <TooltipTrigger asChild>
                    <span
                      className={`font-semibold cursor-help transition-all duration-300 hover:scale-110 hover:drop-shadow-lg ${getRainbowClass(index)}`}
                      style={{
                        fontSize: `${getFontSize(genre.count)}px`,
                        lineHeight: '1.2',
                        textShadow: '0 0 8px currentColor'
                      }}
                    >
                      {genre.genre}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p className="font-medium">{genre.genre}</p>
                      <p className="text-sm">{genre.count} games</p>
                      <p className="text-xs text-gray-300">Segment #{index + 1} of the inchworm</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        ) : (
          <p className="text-gray-400 text-center py-8">No genre data available - the inchworm is still growing!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GenreWordCloud;

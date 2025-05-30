
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';

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

  // Color palette for genres
  const colors = [
    'text-unplayed-mint',
    'text-blue-400',
    'text-purple-400',
    'text-green-400',
    'text-unplayed-amber',
    'text-red-400',
    'text-pink-400',
    'text-cyan-400',
    'text-orange-400',
    'text-indigo-400'
  ];

  const getColor = (index: number) => colors[index % colors.length];

  return (
    <Card className="bg-black/20 border border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Cloud className="h-5 w-5 text-unplayed-mint" />
          <span>Genre Word Cloud</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {genreStats.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3 p-4">
            {genreStats.map((genre, index) => (
              <span
                key={genre.genre}
                className={`font-semibold cursor-default transition-opacity hover:opacity-80 ${getColor(index)}`}
                style={{
                  fontSize: `${getFontSize(genre.count)}px`,
                  lineHeight: '1.2'
                }}
                title={`${genre.genre}: ${genre.count} games`}
              >
                {genre.genre}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No genre data available</p>
        )}
      </CardContent>
    </Card>
  );
};

export default GenreWordCloud;

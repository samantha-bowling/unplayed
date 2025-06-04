
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, PieChart } from 'lucide-react';
import GenreGalaxy from './GenreGalaxy';
import GenreWordCloud from './GenreWordCloud';
import { useGenreStats } from '@/hooks/use-genre-stats';
import { Skeleton } from "@/components/ui/skeleton";

const LibraryGenresTab: React.FC = () => {
  const { data: genreStats, isLoading } = useGenreStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-unplayed-mint" />
              Genre Galaxy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GenreGalaxy />
          </CardContent>
        </Card>

        <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-unplayed-mint" />
              Genre Word Cloud
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GenreWordCloud />
          </CardContent>
        </Card>
      </div>

      {genreStats && genreStats.length > 0 && (
        <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-unplayed-mint" />
              Genre Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {genreStats.slice(0, 6).map((genre) => (
                <div 
                  key={genre.genreName}
                  className="p-4 bg-black/30 rounded-lg border border-gray-700/50 hover:border-unplayed-mint/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(163,247,191,0.2)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-300">
                      {genre.genreName}
                    </span>
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-600"
                      style={{ backgroundColor: genre.colorHex }}
                    ></div>
                  </div>
                  <div className="text-xl font-bold text-unplayed-mint">
                    {genre.gameCount}
                  </div>
                  <div className="text-sm text-gray-400">
                    {genre.percentage.toFixed(1)}% of library
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LibraryGenresTab;


import React from 'react';
import { Dna, Loader2 } from 'lucide-react';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { useGenreStats } from '@/hooks/use-genre-stats';
import { useGameDNAData } from '@/hooks/use-game-dna-data';
import { buildGameDNA } from '@/utils/game-dna-utils';
import DNARadarChart from '@/components/dna/DNARadarChart';
import DNADimensionCard from '@/components/dna/DNADimensionCard';
import DNAPersonality from '@/components/dna/DNAPersonality';

const LibraryGameDNA: React.FC = () => {
  const { data: metrics, isLoading: metricsLoading } = useUserMetrics();
  const { data: genreStats, isLoading: genreLoading } = useGenreStats();
  const { data: extraData, isLoading: extraLoading } = useGameDNAData();

  const isLoading = metricsLoading || genreLoading || extraLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground font-mono">Analyzing your DNA...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Dna className="h-12 w-12 mx-auto mb-4 opacity-40" />
        <p className="font-space text-lg">Import your Steam library to reveal your Game DNA</p>
      </div>
    );
  }

  const profile = buildGameDNA({
    metrics,
    genreStats,
    spendingMetrics: extraData?.spending ?? null,
    gameAgeData: extraData?.ageData ?? { avgYearsOld: 0, vintagePct: 0 },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Dna className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-space font-bold text-foreground">Your Game DNA</h2>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Six dimensions that define who you are as a gamer, built from your entire Steam library.
        </p>
      </div>

      {/* Radar Chart */}
      <DNARadarChart dimensions={profile.dimensions} />

      {/* Dimension Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {profile.dimensions.map(dim => (
          <DNADimensionCard key={dim.key} dimension={dim} />
        ))}
      </div>

      {/* Personality Section */}
      <DNAPersonality profile={profile} />
    </div>
  );
};

export default LibraryGameDNA;

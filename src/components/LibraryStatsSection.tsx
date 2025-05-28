
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GamepadIcon, TrendingUp } from 'lucide-react';

interface LibraryStatsSectionProps {
  totalGames: number;
  unplayedGames: number;
}

const LibraryStatsSection: React.FC<LibraryStatsSectionProps> = ({
  totalGames,
  unplayedGames
}) => {
  const unplayedPercentage = totalGames > 0 ? Math.round((unplayedGames / totalGames) * 100) : 0;

  return (
    <div className="mb-6">
      <Card className="bg-black/30 border border-unplayed-mint/20 hover:border-unplayed-mint/40 transition-all duration-300">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unplayed Games Count */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-unplayed-mint/20 rounded-lg flex items-center justify-center">
                <GamepadIcon className="h-6 w-6 text-unplayed-mint" />
              </div>
              <div>
                <div className="text-2xl font-bold text-unplayed-mint">
                  {unplayedGames}
                </div>
                <div className="text-sm text-gray-400">
                  unplayed Games
                </div>
              </div>
            </div>

            {/* Percentage of Library */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-unplayed-amber/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-unplayed-amber" />
              </div>
              <div>
                <div className="text-2xl font-bold text-unplayed-amber">
                  {unplayedPercentage}%
                </div>
                <div className="text-sm text-gray-400">
                  of library unplayed
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryStatsSection;

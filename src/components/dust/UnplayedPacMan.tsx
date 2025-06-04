
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cherry } from 'lucide-react';
import { useUserMetrics } from '@/hooks/use-user-metrics';

const UnplayedPacMan = () => {
  const { data: userMetrics, isLoading } = useUserMetrics();

  const playedPercentage = React.useMemo(() => {
    if (!userMetrics || userMetrics.totalGames === 0) return 0;
    const played = userMetrics.totalGames - userMetrics.unplayedGames;
    return Math.round((played / userMetrics.totalGames) * 100);
  }, [userMetrics]);

  const unplayedPercentage = 100 - playedPercentage;
  
  // Use the smaller percentage for the mouth opening
  const mouthPercentage = Math.min(playedPercentage, unplayedPercentage);
  const mouthAngle = (mouthPercentage / 100) * 60; // Max 60 degree mouth opening

  if (isLoading) {
    return (
      <Card className="terminal-container">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading Pac-Man data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="text-unplayed-mint">
          unplayed Pac-Man
        </CardTitle>
        <p className="text-sm text-gray-400">
          Your played vs unplayed library, but Pac-Man
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Blinking dots on the left */}
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 space-y-4">
            <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse pacman-dot" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse pacman-dot" style={{ animationDelay: '0.5s' }} />
            <div className="w-3 h-3 bg-yellow-300 rounded-full animate-pulse pacman-dot" style={{ animationDelay: '1s' }} />
          </div>

          {/* Pac-Man Circle */}
          <div className="relative">
            <svg width="160" height="160" viewBox="0 0 160 160" className="transform rotate-0">
              {/* Pac-Man body with mouth */}
              <path
                d={`M 80 80 L 80 20 A 60 60 0 1 1 80 140 Z`}
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="3"
                className="drop-shadow-lg"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${50 + mouthAngle}% ${50 - mouthAngle}%, 100% 0%, 100% 100%, ${50 + mouthAngle}% ${50 + mouthAngle}%, 50% 100%)`
                }}
              />
              {/* Eye */}
              <circle cx="65" cy="45" r="6" fill="#000" />
            </svg>
          </div>

          {/* Bouncing Cherry */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <Cherry 
              className="w-8 h-8 text-red-500 cherry-bounce cherry-glow" 
              fill="currentColor"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{playedPercentage}%</div>
            <div className="text-sm text-gray-400">Played</div>
            <div className="text-xs text-gray-500">
              {userMetrics ? userMetrics.totalGames - userMetrics.unplayedGames : 0} games
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-unplayed-red">{unplayedPercentage}%</div>
            <div className="text-sm text-gray-400">Unplayed</div>
            <div className="text-xs text-gray-500">
              {userMetrics?.unplayedGames || 0} games
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          Mouth opening represents the smaller percentage ({mouthPercentage}%)
        </div>
      </CardContent>
    </Card>
  );
};

export default UnplayedPacMan;


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
  
  // Convert mouth percentage to angle (0-90 degrees max)
  const mouthAngle = (mouthPercentage / 100) * 90;

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
        <div className="relative w-80 h-64 flex items-center justify-center">
          {/* Blinking dots on the left */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-6">
            <div 
              className="w-4 h-4 bg-yellow-300 rounded-full animate-pulse" 
              style={{ animationDelay: '0s', animationDuration: '1.5s' }} 
            />
            <div 
              className="w-4 h-4 bg-yellow-300 rounded-full animate-pulse" 
              style={{ animationDelay: '0.5s', animationDuration: '1.5s' }} 
            />
            <div 
              className="w-4 h-4 bg-yellow-300 rounded-full animate-pulse" 
              style={{ animationDelay: '1s', animationDuration: '1.5s' }} 
            />
          </div>

          {/* Pac-Man Circle */}
          <div className="relative">
            <svg width="120" height="120" viewBox="0 0 120 120" className="transform">
              {/* Pac-Man body - perfect circle with mouth cut out */}
              <defs>
                <clipPath id="pacmanMouth">
                  <polygon points={`60,60 60,${60 - Math.cos(mouthAngle * Math.PI / 180) * 50} ${60 + Math.sin(mouthAngle * Math.PI / 180) * 50},${60 - Math.cos(mouthAngle * Math.PI / 180) * 50} 110,60 ${60 + Math.sin(mouthAngle * Math.PI / 180) * 50},${60 + Math.cos(mouthAngle * Math.PI / 180) * 50} 60,${60 + Math.cos(mouthAngle * Math.PI / 180) * 50}`} />
                </clipPath>
              </defs>
              
              {/* Full circle */}
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="#FFD700" 
                stroke="#FFA500" 
                strokeWidth="2"
                clipPath="url(#pacmanMouth)"
                className="drop-shadow-lg"
              />
              
              {/* Eye */}
              <circle cx="50" cy="35" r="4" fill="#000" />
            </svg>
          </div>

          {/* Bouncing Cherry on the right */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <Cherry 
              className="w-8 h-8 text-red-500 animate-bounce" 
              fill="currentColor"
              style={{ animationDuration: '2s' }}
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
            <div className="text-sm text-gray-400">unplayed</div>
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

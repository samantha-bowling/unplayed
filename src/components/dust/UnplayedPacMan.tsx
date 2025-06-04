
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Cherry } from 'lucide-react';
import { useUserMetrics } from '@/hooks/use-user-metrics';

const UnplayedPacMan: React.FC = () => {
  const { data: userMetrics } = useUserMetrics();

  const totalGames = userMetrics?.totalGames || 0;
  const playedGames = userMetrics?.playedGames || 0;
  const unplayedGames = userMetrics?.unplayedGames || 0;

  const playedPercentage = totalGames > 0 ? (playedGames / totalGames) * 100 : 0;
  const unplayedPercentage = totalGames > 0 ? (unplayedGames / totalGames) * 100 : 0;

  // The mouth represents whichever percentage is smaller
  const isPlayedSmaller = playedPercentage < unplayedPercentage;
  const mouthPercentage = isPlayedSmaller ? playedPercentage : unplayedPercentage;
  const bodyPercentage = 100 - mouthPercentage;

  // Calculate the angle for the mouth opening
  const mouthAngle = (mouthPercentage / 100) * 360;
  const mouthStartAngle = isPlayedSmaller ? 30 : 210; // Mouth facing right for played, left for unplayed

  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-yellow-400" />
          Library Pac-Man
        </CardTitle>
        <p className="text-gray-400 mt-2">
          Your gaming journey visualized
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-center relative">
          {/* Blinking dots on the left */}
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse delay-300"></div>
            <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse delay-700"></div>
          </div>

          {/* Pac-Man circle */}
          <div className="relative">
            <svg width="200" height="200" className="transform rotate-0">
              {/* Main Pac-Man body */}
              <path
                d={`M 100 100 L 100 50 A 50 50 0 ${bodyPercentage > 50 ? 1 : 0} 1 ${
                  100 + 50 * Math.cos((mouthStartAngle + mouthAngle) * Math.PI / 180)
                } ${
                  100 + 50 * Math.sin((mouthStartAngle + mouthAngle) * Math.PI / 180)
                } Z`}
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="2"
                className="drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6))'
                }}
              />
              
              {/* Eye */}
              <circle
                cx="120"
                cy="80"
                r="4"
                fill="#000"
                className="animate-pulse"
              />
            </svg>

            {/* Center stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-lg font-bold text-yellow-100">
                {totalGames}
              </div>
              <div className="text-xs text-yellow-200">
                Total Games
              </div>
            </div>
          </div>

          {/* Bouncing, glowing cherry */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <Cherry 
              className="h-8 w-8 text-red-500 animate-bounce" 
              style={{
                filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))',
                animation: 'bounce 1s infinite, pulse 2s infinite'
              }}
            />
          </div>
        </div>

        {/* Stats below */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-500/20 rounded-lg border border-green-500/30">
            <div className="text-2xl font-bold text-green-400">
              {playedGames}
            </div>
            <div className="text-sm text-green-300">
              Played Games
            </div>
            <div className="text-xs text-gray-400">
              {playedPercentage.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
            <div className="text-2xl font-bold text-orange-400">
              {unplayedGames}
            </div>
            <div className="text-sm text-orange-300">
              Unplayed Games
            </div>
            <div className="text-xs text-gray-400">
              {unplayedPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Pac-Man interpretation */}
        <div className="mt-4 p-3 bg-black/30 rounded-lg">
          <div className="text-sm text-gray-300 text-center">
            <strong className="text-yellow-400">Pac-Man's mouth</strong> represents your{' '}
            <span className={isPlayedSmaller ? 'text-green-400' : 'text-orange-400'}>
              {isPlayedSmaller ? 'played' : 'unplayed'}
            </span>{' '}
            games ({mouthPercentage.toFixed(1)}%)
          </div>
          <div className="text-xs text-gray-400 text-center mt-1">
            {isPlayedSmaller 
              ? "You have more games to discover than you've played!" 
              : "You're making good progress through your library!"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnplayedPacMan;

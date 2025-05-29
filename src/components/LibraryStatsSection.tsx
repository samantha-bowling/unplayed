
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GamepadIcon, TrendingUp, Clock, Activity, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';

interface LibraryStatsSectionProps {
  totalGames: number;
  unplayedGames: number;
}

const LibraryStatsSection: React.FC<LibraryStatsSectionProps> = ({
  totalGames,
  unplayedGames
}) => {
  const navigate = useNavigate();
  const { data: dashboardData } = useDashboardData();
  
  const unplayedPercentage = totalGames > 0 ? Math.round((unplayedGames / totalGames) * 100) : 0;
  
  // Calculate total playtime in hours
  const totalPlaytimeHours = Math.round(dashboardData.totalPlaytime || 0);
  
  // Format playtime display
  const formatPlaytime = (hours: number) => {
    if (hours < 1) return "< 1h";
    if (hours < 100) return `${hours}h`;
    if (hours < 1000) return `${Math.round(hours / 10) * 10}h`;
    return `${Math.round(hours / 100) * 100}h`;
  };

  const handleLibraryValueClick = () => {
    navigate('/spend');
  };

  return (
    <div className="mb-6">
      <Card className="bg-black/30 border border-unplayed-mint/20 hover:border-unplayed-mint/40 transition-all duration-300">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            {/* Total Playtime */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {formatPlaytime(totalPlaytimeHours)}
                </div>
                <div className="text-sm text-gray-400">
                  total playtime
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {dashboardData.recentlyPlayedCount || 0}
                </div>
                <div className="text-sm text-gray-400">
                  played recently
                </div>
              </div>
            </div>

            {/* Library Value - Clickable Button */}
            <div className="lg:col-span-2 flex items-center justify-center">
              <Button
                onClick={handleLibraryValueClick}
                variant="outline"
                className="bg-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/30 border-emerald-400/30 h-16 px-8"
              >
                <DollarSign className="mr-3 h-6 w-6" />
                <div className="text-left">
                  <div className="text-lg font-bold">View Library Value</div>
                  <div className="text-xs opacity-75">Check your spending</div>
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryStatsSection;

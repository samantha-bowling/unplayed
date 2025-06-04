
import React from 'react';
import { useLibraryData } from '@/hooks/use-library-data';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GamepadIcon, Clock, TrendingUp } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

const LibraryOverview: React.FC = () => {
  const { data: libraryData, isLoading } = useLibraryData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Games",
      value: libraryData?.totalGames || 0,
      icon: GamepadIcon,
      color: "text-unplayed-mint",
      bgColor: "bg-unplayed-mint/10",
      borderColor: "border-unplayed-mint/30"
    },
    {
      title: "Played Games", 
      value: libraryData?.playedGames || 0,
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
      borderColor: "border-green-400/30"
    },
    {
      title: "Unplayed Games",
      value: libraryData?.unplayedGames || 0, 
      icon: Clock,
      color: "text-orange-400",
      bgColor: "bg-orange-400/10",
      borderColor: "border-orange-400/30"
    },
    {
      title: "Completion Rate",
      value: `${libraryData?.completionRate || 0}%`,
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10", 
      borderColor: "border-blue-400/30"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={stat.title}
            className={`terminal-container border ${stat.borderColor} shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LibraryOverview;

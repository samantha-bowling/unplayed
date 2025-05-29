
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import CountUp from 'react-countup';
import { Layers } from 'lucide-react';

const UnplayedCounter = () => {
  const { data, isLoading } = useUnplayedData();

  if (isLoading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Unplayed Games
          </CardTitle>
          <CardDescription>Games you haven't played yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-8 w-24 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const unplayedCount = data?.unplayedGames || 0;
  const totalGames = data?.totalGames || 0;
  const unplayedPercentage = totalGames > 0 ? Math.round((unplayedCount / totalGames) * 100) : 0;

  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Unplayed Games
        </CardTitle>
        <CardDescription>Games you haven't played yet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold">
            <CountUp end={unplayedCount} duration={2} />
          </div>
          <div className="text-muted-foreground text-sm">
            of {totalGames} total ({unplayedPercentage}%)
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnplayedCounter;

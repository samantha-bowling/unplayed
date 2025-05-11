
import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type RankChangeIndicatorProps = {
  change: number | null;
  className?: string;
};

const RankChangeIndicator = ({ change, className }: RankChangeIndicatorProps) => {
  // If change is null or zero, show a neutral indicator
  if (change === null || change === 0) {
    return (
      <span className={cn("inline-flex items-center text-gray-400", className)}>
        <Minus className="h-3 w-3" />
      </span>
    );
  }

  // Positive change means the rank improved (e.g., moved from rank 10 to rank 5)
  if (change > 0) {
    return (
      <span className={cn("inline-flex items-center text-emerald-500", className)} title={`Improved by ${change} position${change > 1 ? 's' : ''}`}>
        <TrendingUp className="h-3 w-3 mr-1" />
        {change}
      </span>
    );
  }

  // Negative change means the rank worsened (e.g., moved from rank 5 to rank 10)
  return (
    <span className={cn("inline-flex items-center text-red-500", className)} title={`Dropped by ${Math.abs(change)} position${Math.abs(change) > 1 ? 's' : ''}`}>
      <TrendingDown className="h-3 w-3 mr-1" />
      {Math.abs(change)}
    </span>
  );
};

export default RankChangeIndicator;

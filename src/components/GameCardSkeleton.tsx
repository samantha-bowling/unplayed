
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const GameCardSkeleton = () => {
  return (
    <div className="bg-black/30 border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 h-full">
      {/* Game image skeleton */}
      <Skeleton className="w-full aspect-[3/2] bg-gray-800/50" />
      
      {/* Game content skeleton */}
      <div className="p-3 space-y-2">
        {/* Title skeleton */}
        <Skeleton className="h-5 w-3/4 bg-gray-800/50" />
        
        {/* Status line skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3 bg-gray-800/50" />
          <Skeleton className="h-4 w-1/4 bg-gray-800/50" />
        </div>
        
        {/* Button skeleton */}
        <div className="pt-2">
          <Skeleton className="h-9 w-full bg-gray-800/50 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default GameCardSkeleton;

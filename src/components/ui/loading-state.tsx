
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SteamLoader } from '@/components/SteamLoader';
import { cn } from '@/lib/utils';

export type LoadingVariant = 'skeleton' | 'spinner' | 'steam' | 'progress';
export type LoadingSize = 'sm' | 'md' | 'lg';
export type LoadingContentType = 'card' | 'list' | 'grid' | 'dashboard' | 'text' | 'custom';

interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  contentType?: LoadingContentType;
  message?: string;
  progress?: number;
  className?: string;
  count?: number; // For multiple skeleton items
  children?: React.ReactNode; // For custom loading content
}

// Skeleton variants for different content types
const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn("bg-black/30 border border-gray-800 rounded-lg overflow-hidden p-4 space-y-3", className)}>
    <Skeleton className="w-full h-32 bg-gray-800/50" />
    <Skeleton className="h-5 w-3/4 bg-gray-800/50" />
    <Skeleton className="h-4 w-1/2 bg-gray-800/50" />
    <Skeleton className="h-9 w-full bg-gray-800/50 rounded-md" />
  </div>
);

const SkeletonList = ({ className, count = 3 }: { className?: string; count?: number }) => (
  <div className={cn("space-y-3", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3 bg-black/30 rounded-lg">
        <Skeleton className="h-12 w-12 rounded bg-gray-800/50" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4 bg-gray-800/50" />
          <Skeleton className="h-3 w-1/2 bg-gray-800/50" />
        </div>
        <Skeleton className="h-8 w-16 bg-gray-800/50" />
      </div>
    ))}
  </div>
);

const SkeletonGrid = ({ className, count = 6 }: { className?: string; count?: number }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const SkeletonDashboard = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    {/* Hero stats */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-black/30 border border-gray-800 rounded-lg p-6 text-center">
          <Skeleton className="h-8 w-24 mx-auto mb-2 bg-gray-800/50" />
          <Skeleton className="h-12 w-32 mx-auto mb-2 bg-gray-800/50" />
          <Skeleton className="h-4 w-full bg-gray-800/50" />
        </div>
      ))}
    </div>
    
    {/* Content sections */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4 bg-gray-800/50" />
        <SkeletonList count={4} />
      </div>
      <div className="bg-black/30 border border-gray-800 rounded-lg p-6">
        <Skeleton className="h-6 w-48 mb-4 bg-gray-800/50" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full bg-gray-800/50" />
          <Skeleton className="h-4 w-3/4 bg-gray-800/50" />
        </div>
      </div>
    </div>
  </div>
);

const SkeletonText = ({ className, count = 3 }: { className?: string; count?: number }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className={cn("h-4 bg-gray-800/50", i === count - 1 ? "w-2/3" : "w-full")} />
    ))}
  </div>
);

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'skeleton',
  size = 'md',
  contentType = 'card',
  message,
  progress,
  className,
  count = 3,
  children
}) => {
  // Custom content override
  if (children) {
    return <div className={cn("animate-pulse", className)}>{children}</div>;
  }

  // Steam loader variant
  if (variant === 'steam') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <SteamLoader 
          message={message || "Loading..."} 
          size={size} 
          variant="primary" 
        />
      </div>
    );
  }

  // Spinner variant
  if (variant === 'spinner') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8", className)}>
        <div className={cn(
          "animate-spin rounded-full border-2 border-unplayed-mint/30 border-t-unplayed-mint",
          size === 'sm' && "h-6 w-6",
          size === 'md' && "h-8 w-8",
          size === 'lg' && "h-12 w-12"
        )} />
        {message && (
          <p className={cn(
            "mt-3 text-unplayed-mint font-mono",
            size === 'sm' && "text-xs",
            size === 'md' && "text-sm",
            size === 'lg' && "text-base"
          )}>
            {message}
          </p>
        )}
      </div>
    );
  }

  // Progress variant
  if (variant === 'progress') {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 space-y-4", className)}>
        <div className="w-full max-w-md">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{message || "Loading..."}</span>
            {progress !== undefined && <span>{Math.round(progress)}%</span>}
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-unplayed-mint h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress || 0}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Skeleton variants based on content type
  const skeletonProps = { className, count };
  
  switch (contentType) {
    case 'card':
      return <SkeletonCard className={className} />;
    case 'list':
      return <SkeletonList {...skeletonProps} />;
    case 'grid':
      return <SkeletonGrid {...skeletonProps} />;
    case 'dashboard':
      return <SkeletonDashboard className={className} />;
    case 'text':
      return <SkeletonText {...skeletonProps} />;
    default:
      return <SkeletonCard className={className} />;
  }
};

export default LoadingState;

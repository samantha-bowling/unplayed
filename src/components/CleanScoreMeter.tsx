
import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { transformToDashboardMetrics } from '@/utils/data-transforms';
import useDustScoreData from '@/hooks/use-dust-score-data';
import { CLEAN_SCORE_TIERS } from '@/utils/clean-score-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Medal, Trophy, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CleanScoreProps extends WithDemoProps {
  score?: number;
}

const CleanScoreMeter = ({
  score,
  isDemo = false
}: CleanScoreProps) => {
  const { stats: unifiedStats } = useUnifiedLibraryData();
  const { data } = useDustScoreData();

  const dashboardMetrics = unifiedStats ? transformToDashboardMetrics(unifiedStats) : {
    unplayedGames: 0,
    totalGames: 0,
    dustScore: 0,
    totalPlaytime: 0,
    cleanScore: 0,
    recentlyPlayedCount: 0,
    playedGames: 0,
  };

  const actualScore = score ?? data?.cleanScore ?? dashboardMetrics.cleanScore ?? 0;
  
  // Simple fallback: find tier directly from score if data.cleanTier is missing
  const cleanTier = data?.cleanTier || CLEAN_SCORE_TIERS.find(
    tier => actualScore >= tier.range[0] && actualScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];
  
  const [animatedScore, setAnimatedScore] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    const duration = 2000;
    const start = 0;
    const end = actualScore;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = (end - start) / totalFrames;
    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      const currentValue = Math.round(start + increment * currentFrame);
      setAnimatedScore(currentValue);
      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);
    return () => clearInterval(timer);
  }, [actualScore]);

  const getTierColor = () => cleanTier?.color || '#22d3ee';
  const getTierName = () => cleanTier?.name || 'Calculating...';

  const cleanStreak = data?.cleanStreak || 0;
  const cleanStreakMetadata = data?.cleanStreakMetadata || {
    streakQuality: 'bronze',
    gracePeriodUsed: false
  };
  
  const hasCleanStreak = cleanStreak > 1;

  // Get streak quality icon and color
  const getStreakQuality = () => {
    const quality = cleanStreakMetadata?.streakQuality || 'bronze';
    switch (quality) {
      case 'gold':
        return { icon: Trophy, color: '#ffd700', label: 'Gold' };
      case 'silver':
        return { icon: Medal, color: '#c0c0c0', label: 'Silver' };
      default:
        return { icon: Target, color: '#cd7f32', label: 'Bronze' };
    }
  };

  const streakQuality = getStreakQuality();

  return (
    <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <div className="mb-4 flex items-center">
        <h3 className="terminal-header text-2xl mb-0">Clean Score™</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 text-gray-500 hover:text-gray-400">
                <InfoIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Clean Score measures how well you're engaging with your game library based on
                completion rate, engagement depth, and recent activity.
                Higher scores indicate more active playing habits.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="terminal-content flex flex-col items-center">
        <div className="relative w-48 h-48 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={getTierColor()}
              strokeWidth="8"
              strokeDasharray={`${Math.min(animatedScore / 100, 1) * 283} 283`}
              className="transition-all duration-300"
            />
          </svg>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-help">
                  <span className="text-4xl font-bold font-vt" style={{ color: getTierColor() }}>
                    {animatedScore}
                  </span>
                  <span className="text-gray-400 text-xs mt-1">CLEAN SCORE</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-center">
                <p className="text-sm">completion × engagement × recency</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {actualScore >= 90 && (
            <>
              <div className="absolute top-0 right-4 animate-pulse">✨</div>
              <div className="absolute bottom-8 left-0 animate-pulse delay-300">✨</div>
              <div className="absolute top-12 left-4 animate-pulse delay-700">✨</div>
            </>
          )}
        </div>

        <div className="text-center mt-2">
          <p className="text-xl font-medium" style={{ color: getTierColor() }}>{getTierName()}</p>
          
          {/* Clean Streak Display */}
          {hasCleanStreak && (
            <div className="flex items-center justify-center gap-2 mt-3 p-2 bg-black/20 rounded-lg">
              <streakQuality.icon 
                size={18} 
                className="animate-pulse" 
                style={{ color: streakQuality.color }}
              />
              <div className="text-left">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium" style={{ color: streakQuality.color }}>
                    {streakQuality.label} Streak
                  </span>
                  <span className="text-sm font-bold" style={{ color: streakQuality.color }}>
                    {cleanStreak} days
                  </span>
                </div>
                {cleanStreakMetadata?.gracePeriodUsed && (
                  <span className="text-xs text-yellow-400">Grace period active</span>
                )}
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mt-3">
            {actualScore < 25
              ? "You're barely playing your games. Time to dust off some titles!"
              : actualScore < 50
              ? "You're making some progress. Keep up the momentum."
              : actualScore < 75
              ? "You're doing well at playing your library. Nice balance!"
              : "Outstanding! You're getting great value from your collection."}
          </p>
        </div>

        {user && !isDemo && (
          <div className="mt-4 pt-2">
            <Link
              to="/dust"
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm rounded-md transition-colors"
            >
              View Detailed Report
            </Link>
          </div>
        )}

        {isDemo && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-auto pt-4 text-center flex justify-center">
            <p className="text-sm text-cyan-400">You're in Demo Mode. Sign in to track your Clean Score.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(CleanScoreMeter);


import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import useDustScoreData from '@/hooks/use-dust-score-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Medal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CleanScoreProps extends WithDemoProps {
  score?: number;
}

const CleanScoreMeter = ({
  score,
  isDemo = false
}: CleanScoreProps) => {
  const {
    data
  } = useDustScoreData();

  const actualScore = score ?? data.cleanScore ?? 0;
  const cleanTier = data.cleanTier;
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

  const cleanStreak = data.cleanStreak || 0;
  const hasCleanStreak = cleanStreak > 1;

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
          {hasCleanStreak && (
            <div className="flex items-center justify-center gap-1 mt-2 text-amber-300">
              <Medal size={16} className="animate-pulse" />
              <span className="text-sm">Clean Streak: {cleanStreak} days</span>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-2">
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
            <p className="text-sm text-cyan-400">You’re in Demo Mode. Sign in to track your Clean Score.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(CleanScoreMeter);

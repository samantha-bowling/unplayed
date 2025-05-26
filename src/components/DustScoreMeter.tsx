
import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import useDustScoreData from '@/hooks/use-dust-score-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import CleanScoreMeterSmall from './dust/CleanScoreMeterSmall';

interface DustScoreProps extends WithDemoProps {
  score?: number;
}

const DustScoreMeter = ({
  score,
  isDemo = false
}: DustScoreProps) => {
  const { data, isLoading } = useDustScoreData();
  const actualScore = score ?? data.dustScore;
  const [animatedScore, setAnimatedScore] = useState(0);
  const { user } = useAuth();

  // Debug logging to help trace the issue
  useEffect(() => {
    console.log("DustScoreMeter received score:", score);
    console.log("DustScoreMeter using actualScore:", actualScore);
    console.log("Full dust data:", data);
  }, [score, actualScore, data]);

  useEffect(() => {
    if (actualScore === undefined || actualScore === null) return;
    
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

  // Updated severity thresholds for total dust scores
  const getSeverityColor = () => {
    if (actualScore < 1000) return 'text-green-400';
    if (actualScore < 5000) return 'text-orange-400';
    if (actualScore < 10000) return 'text-amber-600';
    return 'text-unplayed-red';
  };

  const getSeverityText = () => {
    if (actualScore < 1000) return 'Freshly Polished ✨';
    if (actualScore < 5000) return 'Dust Storm Brewing 🌬️';
    if (actualScore < 10000) return 'Duststorm Warning 🌪️';
    return "Hoarder's Horizon 🤍";
  };

  const showCleanScore = data.cleanScore !== undefined && user;

  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="terminal-container equal-height-container">
        <h3 className="terminal-header text-2xl mb-0">Dust Score™</h3>
        <div className="terminal-content flex flex-col items-center justify-center p-8">
          <div className="animate-pulse">
            <div className="w-32 h-32 rounded-full bg-gray-700"></div>
          </div>
          <p className="text-gray-400 mt-4">Calculating dust...</p>
        </div>
      </div>
    );
  }

  // Calculate circle scale factor for large numbers to fit in circle
  const getScaleFactor = () => {
    if (actualScore < 1000) return 1;
    if (actualScore < 10000) return 10;
    if (actualScore < 100000) return 100;
    return 1000;
  };
  
  const scaleFactor = getScaleFactor();
  const scaledScore = actualScore / scaleFactor;
  const maxDisplayScore = 1500; // Maximum value for the circle

  return (
    <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <div className="mb-4 flex items-center">
        <h3 className="terminal-header text-2xl mb-0">Dust Score™</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 text-gray-500 hover:text-gray-400">
                <InfoIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Dust Score shows your total accumulated dust across all games.
                Higher scores indicate more neglected games in your library.
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
              stroke={actualScore < 1000 ? '#A3F7BF' : actualScore < 5000 ? '#FF9F39' : actualScore < 10000 ? '#F6AD55' : '#FF3C38'}
              strokeWidth="8"
              strokeDasharray={`${Math.min(scaledScore / maxDisplayScore, 1) * 283} 283`}
              className="transition-all duration-300"
            />
          </svg>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-help">
                  <span className={`${getSeverityColor()} text-4xl font-bold font-vt ${actualScore >= 10000 ? 'text-3xl' : ''}`}>
                    {formatNumber(animatedScore)}
                  </span>
                  <span className="text-gray-400 text-xs mt-1">DUST UNITS</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-center">
                <p className="text-sm">Total dust accumulated across all your games</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="text-center mt-2">
          <p className={`${getSeverityColor()} text-xl font-medium`}>{getSeverityText()}</p>
          <p className="text-sm text-gray-400 mt-2">
            {actualScore < 1000
              ? "Your library is in good shape! Keep it up."
              : actualScore < 5000
              ? "Some games could use your attention soon."
              : actualScore < 10000
              ? "Warning: Your backlog is getting out of control."
              : "Critical: Your library has reached dust apocalypse levels."}
          </p>
        </div>

        {showCleanScore && (
          <div className="mt-6 pt-3 border-t border-gray-700 w-full flex justify-center">
            <CleanScoreMeterSmall score={data.cleanScore || 0} tier={data.cleanTier} />
          </div>
        )}

        {user && !isDemo && (
          <div className="mt-4 pt-2">
            <Link
              to="/dust"
              className="px-4 py-2 bg-unplayed-mint/20 hover:bg-unplayed-mint/30 text-unplayed-mint text-sm rounded-md transition-colors"
            >
              View Detailed Report
            </Link>
          </div>
        )}

        {isDemo && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-auto pt-4 text-center flex justify-center">
            <p className="text-sm text-unplayed-mint">
              You're in Demo Mode. Sign in to track your Dust Score.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(DustScoreMeter);

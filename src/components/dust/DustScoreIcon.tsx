
import React, { useMemo } from 'react';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { formatDustScore } from '@/utils/dust-score-display';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DustScoreIconProps {
  score: number;
  isDemo?: boolean;
}

const DustScoreIcon: React.FC<DustScoreIconProps> = ({
  score,
  isDemo = false
}) => {
  // Animated counter with demo-aware speed
  const animatedScore = useAnimatedCounter({
    targetValue: score,
    duration: 2000,
    isDemo
  });

  // Calculate severity data based on dust score using new 8-tier system
  const severityData = useMemo(() => {
    if (score < 500) {
      return {
        icon: '✨',
        severity: 'Freshly Polished',
        description: 'Your library sparkles! Gaming efficiency master.',
        color: '#A3F7BF', // Light green
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30',
        progress: Math.min((score / 500) * 100, 100),
        progressColor: 'bg-green-500'
      };
    } else if (score < 1500) {
      return {
        icon: '🌱',
        severity: 'Light Dusting',
        description: 'A few games gathering dust, nothing serious!',
        color: '#90EE90', // Light green
        bgColor: 'bg-lime-500/20',
        borderColor: 'border-lime-500/30',
        progress: Math.min(((score - 500) / 1000) * 100, 100),
        progressColor: 'bg-lime-500'
      };
    } else if (score < 3500) {
      return {
        icon: '🌬️',
        severity: 'Dust Storm Brewing',
        description: 'Starting to accumulate dust. Time for action!',
        color: '#FFD700', // Gold
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/30',
        progress: Math.min(((score - 1500) / 2000) * 100, 100),
        progressColor: 'bg-yellow-500'
      };
    } else if (score < 7500) {
      return {
        icon: '⚠️',
        severity: 'Duststorm Warning',
        description: 'Your backlog is becoming concerning.',
        color: '#FF9F39', // Orange
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/30',
        progress: Math.min(((score - 3500) / 4000) * 100, 100),
        progressColor: 'bg-orange-500'
      };
    } else if (score < 15000) {
      return {
        icon: '📦',
        severity: "Hoarder's Horizon",
        description: 'Serious collector territory. Your backlog has its own ecosystem!',
        color: '#F6AD55', // Light orange
        bgColor: 'bg-amber-600/20',
        borderColor: 'border-amber-600/30',
        progress: Math.min(((score - 7500) / 7500) * 100, 100),
        progressColor: 'bg-amber-600'
      };
    } else if (score < 35000) {
      return {
        icon: '👑',
        severity: 'Dust Dynasty',
        description: 'Building a gaming empire! Your collection could stock a store.',
        color: '#FF6347', // Tomato red
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/30',
        progress: Math.min(((score - 15000) / 20000) * 100, 100),
        progressColor: 'bg-red-500'
      };
    } else if (score < 75000) {
      return {
        icon: '🏆',
        severity: 'Legendary Collector',
        description: 'Legendary status achieved. Preserving gaming history!',
        color: '#8A2BE2', // Blue violet
        bgColor: 'bg-purple-600/20',
        borderColor: 'border-purple-600/30',
        progress: Math.min(((score - 35000) / 40000) * 100, 100),
        progressColor: 'bg-purple-600'
      };
    } else {
      return {
        icon: '🧙‍♂️',
        severity: 'Mythical Archive',
        description: "You're a gaming library of Alexandria!",
        color: '#FF1493', // Deep pink
        bgColor: 'bg-pink-600/20',
        borderColor: 'border-pink-600/30',
        progress: Math.min(((score - 75000) / 25000) * 100, 100),
        progressColor: 'bg-pink-600'
      };
    }
  }, [score]);

  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      {/* Large Severity Icon */}
      <div className="text-6xl mb-2">
        {severityData.icon}
      </div>

      {/* Horizontal Progress Bar */}
      <div className="w-full max-w-48">
        <Progress 
          value={severityData.progress} 
          className="h-3 bg-gray-700"
          style={{
            '--progress-background': severityData.progressColor
          } as React.CSSProperties}
        />
      </div>

      {/* Score Display */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${severityData.bgColor} ${severityData.borderColor} rounded-lg px-4 py-3 border cursor-help`}>
              <div 
                className="text-2xl font-bold font-vt text-center mb-1"
                style={{ color: severityData.color }}
              >
                {formatDustScore(animatedScore)}
              </div>
              <div className="text-xs text-gray-400 text-center uppercase tracking-wide">
                DUST UNITS
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-center max-w-xs">
            <p className="text-sm">Total dust accumulated across all your games</p>
            <p className="text-xs text-gray-400 mt-1">Higher scores = more neglected games</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Severity Text */}
      <div className="text-center max-w-xs">
        <p 
          className="text-lg font-medium mb-1"
          style={{ color: severityData.color }}
        >
          {severityData.severity}
        </p>
        <p className="text-sm text-gray-400">
          {severityData.description}
        </p>
      </div>
    </div>
  );
};

export default DustScoreIcon;

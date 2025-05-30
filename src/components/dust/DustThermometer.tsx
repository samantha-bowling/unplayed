
import React, { useMemo } from 'react';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { formatDustScore } from '@/utils/dust-score-display';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DustThermometerProps {
  score: number;
  isDemo?: boolean;
}

const DustThermometer: React.FC<DustThermometerProps> = ({
  score,
  isDemo = false
}) => {
  // Animated counter with demo-aware speed
  const animatedScore = useAnimatedCounter({
    targetValue: score,
    duration: 2000,
    isDemo
  });

  // Calculate thermometer fill and color based on dust score
  const thermometerData = useMemo(() => {
    let fillPercentage: number;
    let color: string;
    let bgColor: string;
    let severity: string;
    let description: string;

    if (score < 1000) {
      fillPercentage = Math.min((score / 1000) * 25, 25); // 0-25% of thermometer
      color = '#10b981'; // Green
      bgColor = 'bg-green-500/20';
      severity = 'Freshly Polished ✨';
      description = 'Your library is in good shape!';
    } else if (score < 5000) {
      fillPercentage = 25 + Math.min(((score - 1000) / 4000) * 25, 25); // 25-50%
      color = '#f59e0b'; // Orange
      bgColor = 'bg-orange-500/20';
      severity = 'Dust Storm Brewing 🌬️';
      description = 'Some games could use attention soon.';
    } else if (score < 10000) {
      fillPercentage = 50 + Math.min(((score - 5000) / 5000) * 25, 25); // 50-75%
      color = '#f97316'; // Red-orange
      bgColor = 'bg-orange-600/20';
      severity = 'Duststorm Warning 🌪️';
      description = 'Your backlog is getting out of control.';
    } else {
      fillPercentage = 75 + Math.min(((score - 10000) / 40000) * 25, 25); // 75-100%
      color = '#dc2626'; // Red
      bgColor = 'bg-red-600/20';
      severity = "Hoarder's Horizon 💀";
      description = 'Dust apocalypse levels detected.';
    }

    return {
      fillPercentage: Math.min(fillPercentage, 100),
      color,
      bgColor,
      severity,
      description
    };
  }, [score]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Thermometer Container */}
      <div className="relative">
        {/* Thermometer Background */}
        <div className="w-16 h-64 bg-gray-700 rounded-full border-4 border-gray-600 relative overflow-hidden">
          {/* Thermometer Fill */}
          <div 
            className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000 ease-out"
            style={{
              height: `${thermometerData.fillPercentage}%`,
              backgroundColor: thermometerData.color,
              boxShadow: `0 0 20px ${thermometerData.color}40`
            }}
          />
          
          {/* Thermometer Scale Lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-2">
            {[0, 25, 50, 75, 100].map((mark) => (
              <div 
                key={mark}
                className="w-full h-0.5 bg-gray-500 opacity-50"
              />
            ))}
          </div>
        </div>

        {/* Thermometer Bulb */}
        <div 
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full border-4 border-gray-600 transition-all duration-1000"
          style={{
            backgroundColor: thermometerData.color,
            boxShadow: `0 0 15px ${thermometerData.color}60`
          }}
        />

        {/* Scale Labels */}
        <div className="absolute -right-16 inset-y-0 flex flex-col justify-between py-2 text-xs text-gray-400">
          <span>100K+</span>
          <span>10K</span>
          <span>5K</span>
          <span>1K</span>
          <span>0</span>
        </div>
      </div>

      {/* Score Display */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`${thermometerData.bgColor} rounded-lg px-6 py-4 border cursor-help`}>
              <div 
                className="text-3xl font-bold font-vt text-center mb-1"
                style={{ color: thermometerData.color }}
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
          className="text-lg font-medium mb-2"
          style={{ color: thermometerData.color }}
        >
          {thermometerData.severity}
        </p>
        <p className="text-sm text-gray-400">
          {thermometerData.description}
        </p>
      </div>
    </div>
  );
};

export default DustThermometer;

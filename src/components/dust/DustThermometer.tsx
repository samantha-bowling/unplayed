
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

  // Calculate thermometer fill and color based on dust score using new 8-tier system
  const thermometerData = useMemo(() => {
    let fillPercentage: number;
    let color: string;
    let bgColor: string;
    let severity: string;
    let description: string;

    if (score < 500) {
      fillPercentage = Math.min((score / 500) * 12.5, 12.5); // 0-12.5% of thermometer
      color = '#A3F7BF'; // Light green
      bgColor = 'bg-green-500/20';
      severity = 'Freshly Polished ✨';
      description = 'Your library sparkles! Gaming efficiency master.';
    } else if (score < 1500) {
      fillPercentage = 12.5 + Math.min(((score - 500) / 1000) * 12.5, 12.5); // 12.5-25%
      color = '#90EE90'; // Light green
      bgColor = 'bg-lime-500/20';
      severity = 'Light Dusting 🌱';
      description = 'A few games gathering dust, nothing serious!';
    } else if (score < 3500) {
      fillPercentage = 25 + Math.min(((score - 1500) / 2000) * 12.5, 12.5); // 25-37.5%
      color = '#FFD700'; // Gold
      bgColor = 'bg-yellow-500/20';
      severity = 'Dust Storm Brewing 🌬️';
      description = 'Starting to accumulate dust. Time for action!';
    } else if (score < 7500) {
      fillPercentage = 37.5 + Math.min(((score - 3500) / 4000) * 12.5, 12.5); // 37.5-50%
      color = '#FF9F39'; // Orange
      bgColor = 'bg-orange-500/20';
      severity = 'Duststorm Warning ⚠️';
      description = 'Your backlog is becoming concerning.';
    } else if (score < 15000) {
      fillPercentage = 50 + Math.min(((score - 7500) / 7500) * 12.5, 12.5); // 50-62.5%
      color = '#F6AD55'; // Light orange
      bgColor = 'bg-amber-600/20';
      severity = "Hoarder's Horizon 📦";
      description = 'Serious collector territory. Your backlog has its own ecosystem!';
    } else if (score < 35000) {
      fillPercentage = 62.5 + Math.min(((score - 15000) / 20000) * 12.5, 12.5); // 62.5-75%
      color = '#FF6347'; // Tomato red
      bgColor = 'bg-red-500/20';
      severity = 'Dust Dynasty 👑';
      description = 'Building a gaming empire! Your collection could stock a store.';
    } else if (score < 75000) {
      fillPercentage = 75 + Math.min(((score - 35000) / 40000) * 12.5, 12.5); // 75-87.5%
      color = '#8A2BE2'; // Blue violet
      bgColor = 'bg-purple-600/20';
      severity = 'Legendary Collector 🏆';
      description = 'Legendary status achieved. Preserving gaming history!';
    } else {
      fillPercentage = 87.5 + Math.min(((score - 75000) / 25000) * 12.5, 12.5); // 87.5-100%
      color = '#FF1493'; // Deep pink
      bgColor = 'bg-pink-600/20';
      severity = 'Mythical Archive 🧙‍♂️';
      description = "You're a gaming library of Alexandria!";
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
            {[0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100].map((mark) => (
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
          <span>75K+</span>
          <span>35K</span>
          <span>15K</span>
          <span>7.5K</span>
          <span>3.5K</span>
          <span>1.5K</span>
          <span>500</span>
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


import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useCleanSpendingData } from '@/hooks/use-clean-spending-data';
import { Clock, RefreshCw, AlertCircle, CheckCircle, TrendingUp, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface EnhancedSpendingMeterProps extends WithDemoProps {
  onlyUnplayed?: boolean;
  showRefreshButton?: boolean;
}

const EnhancedSpendingMeter = ({ 
  onlyUnplayed = true,
  showRefreshButton = true,
  isDemo = false 
}: EnhancedSpendingMeterProps) => {
  const { 
    data, 
    isLoading, 
    error, 
    refreshPrices, 
    isRefreshing,
    canRefresh,
    isOnCooldown,
    cooldownRemaining,
    formatCooldown
  } = useCleanSpendingData(onlyUnplayed);

  const [animatedAmount, setAnimatedAmount] = useState(0);

  // Animate the spending amount
  useEffect(() => {
    if (data?.totalSpent) {
      const duration = 2000;
      const start = 0;
      const end = data.totalSpent;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const increment = (end - start) / totalFrames;
      let currentFrame = 0;

      const timer = setInterval(() => {
        currentFrame++;
        const currentValue = start + increment * currentFrame;
        setAnimatedAmount(currentValue);
        if (currentFrame === totalFrames) {
          clearInterval(timer);
        }
      }, frameDuration);

      return () => clearInterval(timer);
    }
  }, [data?.totalSpent]);

  if (isLoading) {
    return (
      <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
        <h3 className="terminal-header text-2xl mb-4">
          {onlyUnplayed ? 'Unplayed Value (Enhanced)' : 'Total Library Value (Enhanced)'}
        </h3>
        <div className="terminal-content flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
        <h3 className="terminal-header text-2xl mb-4">
          {onlyUnplayed ? 'Unplayed Value (Enhanced)' : 'Total Library Value (Enhanced)'}
        </h3>
        <div className="terminal-content">
          <div className="flex items-center gap-2 text-red-400 mb-4">
            <AlertCircle size={20} />
            <span>Error loading enhanced spending data</span>
          </div>
          {showRefreshButton && (
            <Button 
              onClick={refreshPrices}
              disabled={isRefreshing || !canRefresh}
              className="w-full"
              variant="outline"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle size={16} className="text-green-400" />;
      case 'medium': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'low': return <AlertCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="terminal-header text-2xl mb-0">
            {onlyUnplayed ? 'Unplayed Value' : 'Total Library Value'}
          </h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
                  <Database className="w-3 h-3 mr-1" />
                  Enhanced
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Using enhanced price validation and clean data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {showRefreshButton && !isDemo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={refreshPrices}
                  disabled={isRefreshing || !canRefresh}
                  size="sm"
                  variant="ghost"
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : isOnCooldown ? (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      {formatCooldown()}
                    </>
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRefreshing ? (
                  "Refreshing prices with enhanced validation..."
                ) : isOnCooldown ? (
                  `Refresh available in ${formatCooldown()}`
                ) : (
                  "Refresh prices with enhanced validation"
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="terminal-content">
        {/* Main spending display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold font-vt text-cyan-400 mb-2">
            ${animatedAmount.toFixed(2)}
          </div>
          
          {data.totalSaved && data.totalSaved > 0 && (
            <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
              <TrendingUp size={16} />
              <span>Saved ${data.totalSaved.toFixed(2)} from discounts</span>
            </div>
          )}
        </div>

        {/* Progress bar for refresh if in progress */}
        {isRefreshing && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Refreshing with enhanced validation...</span>
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Enhanced data quality indicators */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-cyan-300">{data.paidGamesCount}</div>
            <div className="text-xs text-gray-400">Paid Games</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-300">{data.freeGamesCount}</div>
            <div className="text-xs text-gray-400">Free Games</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-300">{data.unknownPriceGamesCount}</div>
            <div className="text-xs text-gray-400">Unknown Price</div>
          </div>
        </div>

        {/* Enhanced confidence and data quality */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getConfidenceIcon(data.confidence)}
              <span className={`text-sm ${getConfidenceColor(data.confidence)}`}>
                {data.confidence.charAt(0).toUpperCase() + data.confidence.slice(1)} Confidence
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              {data.dataQuality.dataQualityPercentage.toFixed(1)}% validated
            </Badge>
          </div>

          {data.displayInfo.warningText && (
            <div className="text-xs text-yellow-400 bg-yellow-400/10 p-2 rounded">
              {data.displayInfo.warningText}
            </div>
          )}

          <div className="text-xs text-gray-400 bg-gray-800/50 p-2 rounded">
            {data.displayInfo.confidenceText}
          </div>
        </div>

        {/* Last updated info */}
        <div className="text-xs text-gray-500 text-center mt-4 pt-2 border-t border-gray-700">
          Enhanced validation • Last updated: {new Date(data.refreshedAt).toLocaleString()}
        </div>

        {isDemo && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-4 pt-2 text-center">
            <p className="text-sm text-cyan-400">You're in Demo Mode. Connect Steam to see real enhanced spending data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(EnhancedSpendingMeter);

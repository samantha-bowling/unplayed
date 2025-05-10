
import { useState, useEffect, useRef } from 'react';
import useSpendingData from '@/hooks/use-spending-data';
import CurrencyAmount from '@/components/ui/currency-amount';
import { Link } from 'react-router-dom';
import { RefreshCcw, ExternalLink } from 'lucide-react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SectionHeading from '@/components/ui/SectionHeading';

interface SpendingEstimateProps {
  amount?: number;
  showMoreDetailsLink?: boolean;
}

const SpendingEstimate = ({ 
  amount, 
  showMoreDetailsLink = true 
}: SpendingEstimateProps) => {
  const { data: spendingData, isLoading, refreshPrices, isRefreshing } = useSpendingData();
  const { isDemo } = useDemoMode();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const initializedRef = useRef(false);
  
  // Use amount from props if provided, otherwise use spending data
  const spendingAmount = amount !== undefined 
    ? amount 
    : spendingData?.totalSpent || 0;
  
  useEffect(() => {
    if (isVisible && !initializedRef.current) {
      initializedRef.current = true;
      const duration = 2000;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const increment = spendingAmount / totalFrames;
      let currentFrame = 0;
      
      const timer = setInterval(() => {
        currentFrame++;
        const value = Math.min(increment * currentFrame, spendingAmount);
        setAnimatedAmount(value);
        
        if (currentFrame === totalFrames) {
          clearInterval(timer);
        }
      }, frameDuration);
      
      return () => clearInterval(timer);
    }
  }, [isVisible, spendingAmount]);

  const handleRefresh = () => {
    if (!isRefreshing) {
      refreshPrices();
    }
  };

  return (
    <div className="terminal-container equal-height-container">
<SectionHeading
  actions={
    !isDemo && user && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleRefresh}
              disabled={isRefreshing || !isVisible}
            >
              <RefreshCcw
                size={16}
                className={`text-gray-400 hover:text-unplayed-mint ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Refresh price data from Steam store</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
>
  Spending Estimate
</SectionHeading>
      <div className="terminal-content flex flex-col h-full">
        {isVisible ? (
          <div className="animate-fade-in flex flex-col h-full">
            <div className="flex flex-col items-center py-4">
              <div className="text-4xl md:text-5xl font-bold text-unplayed-red mb-2">
                {isLoading ? (
                  <span className="opacity-50">Calculating...</span>
                ) : (
                  <CurrencyAmount amount={animatedAmount} currency={spendingData?.currency || 'USD'} />
                )}
              </div>
              
              <p className="text-gray-300 text-center mb-2">
                Spent on unplayed games
              </p>

              {spendingData?.totalSaved && spendingData.totalSaved > 0 && (
                <p className="text-unplayed-mint text-sm">
                  You saved <CurrencyAmount amount={spendingData.totalSaved} /> from sales!
                </p>
              )}
              
              {showMoreDetailsLink && user && !isDemo && (
                <Link 
                  to="/spend" 
                  className="mt-4 inline-flex items-center text-unplayed-mint hover:underline text-sm"
                >
                  See detailed breakdown <ExternalLink size={14} className="ml-1" />
                </Link>
              )}
              
              <button 
                onClick={() => {
                  setIsVisible(false);
                  initializedRef.current = false;
                }}
                className="mt-6 btn-secondary"
              >
                Hide Financial Damage
              </button>
            </div>
            
            <div className="mt-auto text-sm text-gray-400 text-center pb-2">
              Based on{isDemo ? ' estimated' : ' current'} Steam store prices
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-300 mb-6">
              Do you really want to see how much money you've spent on games you've never played?
            </p>
            
            <button 
              onClick={() => setIsVisible(true)}
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Show Me The Damage'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingEstimate;

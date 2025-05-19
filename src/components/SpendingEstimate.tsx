import { useState } from 'react';
import useSpendingData from '@/hooks/use-spending-data';
import { RefreshCcw } from 'lucide-react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SpendingMeter from './SpendingMeter';

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
  const { status, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  // Use amount from props if provided, otherwise use spending data
  const spendingAmount = amount !== undefined 
    ? amount 
    : (spendingData?.totalSpent || 0);

  const handleRefresh = () => {
    if (!isRefreshing) {
      refreshPrices();
    }
  };

  // Only show refresh when authenticated and not in demo mode
  const showRefresh = !isDemo && status !== 'LOADING';

  return (
    <div className="terminal-container equal-height-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="terminal-header text-2xl">Spending Estimate</h3>
        {showRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
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
        )}
      </div>
      
      <div className="terminal-content flex flex-col h-full">
        {isVisible ? (
          <SpendingMeter
            amount={spendingAmount}
            currency={spendingData?.currency || 'USD'}
            isLoading={isLoading}
            showDetailsLink={showMoreDetailsLink}
            onHideClick={() => setIsVisible(false)}
            totalSaved={spendingData?.totalSaved}
            isDemo={isDemo}
            hasUser={!!user}
          />
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

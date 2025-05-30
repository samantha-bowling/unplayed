
import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { useEnhancedSpendingData } from '@/hooks/use-spending-data-enhanced';
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
  const { data: spendingData, isLoading: dataLoading, refreshPrices, isRefreshing } = useEnhancedSpendingData();
  const { isDemo } = useDemoMode();
  const { status, isLoading: authLoading, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  // Use amount from props if provided, otherwise use enhanced spending data (unplayed only)
  const spendingAmount = amount !== undefined ? amount : spendingData.totalSpent;

  console.log('SpendingEstimate - Enhanced data:', {
    totalSpent: spendingData.totalSpent,
    confidence: spendingData.confidence,
    dataQuality: spendingData.dataQuality,
    usingAmount: spendingAmount
  });

  const handleRefresh = async () => {
    if (!isRefreshing) {
      await refreshPrices();
    }
  };

  // Only show refresh when authenticated and not in demo mode
  const showRefresh = !isDemo && status !== 'LOADING';

  return (
    <div className="terminal-container equal-height-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="terminal-header text-2xl">Spending Estimate</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-sm text-gray-400 cursor-help underline decoration-dotted">
                  All prices shown in USD
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Prices are converted to USD for consistency. Original Steam store prices may vary by region.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
            currency={'USD'}
            isLoading={dataLoading || authLoading}
            showDetailsLink={showMoreDetailsLink}
            onHideClick={() => setIsVisible(false)}
            totalSaved={spendingData.totalSaved}
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
              disabled={dataLoading || authLoading}
            >
              {dataLoading || authLoading ? 'Loading...' : 'Show Me The Damage'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingEstimate;

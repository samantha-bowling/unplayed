
import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { useEnhancedSpendingData } from '@/hooks/use-spending-data-enhanced';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SpendingMeter from './SpendingMeter';

interface SpendingEstimateProps {
  showMoreDetailsLink?: boolean;
}

const SpendingEstimate = ({ 
  showMoreDetailsLink = true 
}: SpendingEstimateProps) => {
  const { data: spendingData, isLoading: dataLoading, refreshPrices, isRefreshing } = useEnhancedSpendingData();
  const { isDemo } = useDemoMode();
  const { status, isLoading: authLoading, user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  // Use unplayed spending data from enhanced hook
  const spendingAmount = spendingData?.totalSpent || 0;

  console.log('SpendingEstimate - Using unplayed spending data:', {
    totalSpent: spendingData?.totalSpent,
    confidence: spendingData?.confidence,
    dataQuality: spendingData?.dataQuality,
    finalAmount: spendingAmount
  });

  const handleRefresh = async () => {
    if (!isRefreshing && refreshPrices) {
      await refreshPrices();
    }
  };

  // Only show refresh when authenticated and not in demo mode
  const showRefresh = !isDemo && status !== 'LOADING';

  return (
    <div className="terminal-container equal-height-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="terminal-header text-2xl">unplayed Value</h3>
          <p className="text-sm text-gray-400">
            How much your unplayed games are worth
          </p>
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
            totalSaved={spendingData?.totalSaved || null}
            isDemo={isDemo}
            hasUser={!!user}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-300 mb-6">
              Ready to see how much your unplayed games are worth?
            </p>
            
            <button 
              onClick={() => setIsVisible(true)}
              className="bg-unplayed-pink hover:bg-unplayed-pink/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              disabled={dataLoading || authLoading}
            >
              {dataLoading || authLoading ? 'Loading...' : 'Show me the damage'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingEstimate;

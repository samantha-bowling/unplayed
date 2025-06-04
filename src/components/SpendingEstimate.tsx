
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import SpendingMeter from './SpendingMeter';

interface SpendingEstimateProps {
  showMoreDetailsLink?: boolean;
}

const SpendingEstimate = ({ 
  showMoreDetailsLink = true 
}: SpendingEstimateProps) => {
  const { data: spendingData, isLoading: dataLoading } = useUnifiedSpendingDataV2();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  console.log('SpendingEstimate - Using unified spending data V2:', {
    unplayedSpent: spendingData.unplayedSpent,
    currency: spendingData.currency,
    lastCalculated: spendingData.lastCalculated,
    source: 'user_spending_metrics_v2'
  });

  return (
    <div className="terminal-container equal-height-container">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="terminal-header text-2xl">unplayed Value</h3>
          <p className="text-sm text-gray-400">
            How much your unplayed games are worth
          </p>
        </div>
      </div>
      
      <div className="terminal-content flex flex-col h-full">
        {isVisible ? (
          <SpendingMeter
            amount={spendingData.unplayedSpent}
            currency={spendingData.currency}
            isLoading={dataLoading}
            showDetailsLink={showMoreDetailsLink}
            onHideClick={() => setIsVisible(false)}
            totalSaved={spendingData.unplayedSaved}
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
              disabled={dataLoading}
            >
              {dataLoading ? 'Loading...' : 'Show me the damage'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingEstimate;

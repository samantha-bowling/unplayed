
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SpendingMeter from './SpendingMeter';

interface SpendingEstimateProps {
  showMoreDetailsLink?: boolean;
}

const SpendingEstimate = ({ 
  showMoreDetailsLink = true 
}: SpendingEstimateProps) => {
  const { data: spendingData, isLoading: dataLoading, refreshSpendingData } = useUnifiedSpendingDataV2();
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAutoCalculating, setIsAutoCalculating] = useState(false);
  

  // In demo mode, use demo data
  if (isDemo) {
    const demoSpendingData = {
      unplayedSpent: demoData.unplayedSpent || 189.50,
      currency: 'USD',
      lastCalculated: new Date().toISOString(),
      unplayedSaved: 45.25 // Demo savings amount
    };

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
              amount={demoSpendingData.unplayedSpent}
              currency={demoSpendingData.currency}
              isLoading={false}
              showDetailsLink={showMoreDetailsLink}
              onHideClick={() => setIsVisible(false)}
              totalSaved={demoSpendingData.unplayedSaved}
              hasUser={true} // Show as if user is connected in demo
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-gray-300 mb-6">
                Ready to see how much your unplayed games are worth?
              </p>
              
              <button 
                onClick={() => setIsVisible(true)}
                className="bg-unplayed-pink hover:bg-unplayed-pink/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Show me the damage
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if we have meaningful spending data
  const hasSpendingData = spendingData.lastCalculated && spendingData.unplayedSpent >= 0;

  const handleShowDamage = async () => {
    if (!user) {
      toast.error("Authentication required", {
        description: "Please sign in to view your spending data.",
      });
      return;
    }

    // If we already have recent data, just show it
    if (hasSpendingData) {
      setIsVisible(true);
      return;
    }

    // If no data exists, auto-trigger calculation
    setIsAutoCalculating(true);
    
    try {
      toast("Calculating your spending", {
        description: "Analyzing your library value for the first time..."
      });

      // Call the spending calculation function directly
      const { data: functionResult, error } = await supabase.functions.invoke(
        'calculate-user-spending',
        {
          body: {
            user_id: user.id,
            force_refresh: true
          }
        }
      );

      if (error) {
        throw error;
      }

      if (!functionResult?.success) {
        throw new Error(functionResult?.error || 'Failed to calculate spending metrics');
      }

      // Refresh the spending data to get the latest values
      await refreshSpendingData();
      
      toast("Spending calculated!", {
        description: "Your library value has been analyzed successfully."
      });

      // Now show the results
      setIsVisible(true);
      
    } catch (error) {
      console.error('Error auto-calculating spending:', error);
      toast.error("Calculation failed", {
        description: "There was a problem calculating your spending. Please try refreshing your dashboard.",
      });
    } finally {
      setIsAutoCalculating(false);
    }
  };

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
              onClick={handleShowDamage}
              className="bg-unplayed-pink hover:bg-unplayed-pink/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={dataLoading || isAutoCalculating}
            >
              {isAutoCalculating ? 'Calculating...' : 
               dataLoading ? 'Loading...' : 
               'Show me the damage'}
            </button>
            
            {isAutoCalculating && (
              <p className="text-sm text-gray-400 mt-2">
                This may take a moment for first-time calculation
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingEstimate;

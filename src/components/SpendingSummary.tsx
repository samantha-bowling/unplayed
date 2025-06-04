
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CurrencyAmount from '@/components/ui/currency-amount';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';

const SpendingSummary = () => {
  const { data: spendingData, isLoading, refreshSpendingData } = useUnifiedSpendingDataV2();

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
      await refreshSpendingData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const averagePricePerGame = spendingData.paidGames > 0 
    ? spendingData.totalLibraryValue / spendingData.paidGames 
    : 0;

  if (isLoading) {
    return (
      <div className="terminal-container p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-unplayed-mint animate-spin" />
          <span className="ml-2 text-lg text-gray-300">Calculating spending data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-unplayed-mint">
              Your Steam Library Value
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRefreshPrices}
                    variant="outline"
                    size="sm"
                    disabled={isRefreshing}
                    className="bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? "Updating..." : "Refresh Prices"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Update game prices from Steam store</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Library Value */}
          <div className="text-center py-6 border-2 border-unplayed-mint/30 rounded-lg bg-black/30">
            <div className="text-4xl font-bold text-unplayed-mint mb-2">
              <CurrencyAmount amount={spendingData.totalLibraryValue} currency={spendingData.currency} />
            </div>
            <p className="text-gray-300 text-lg">Total Library Value</p>
            <p className="text-sm text-gray-400 mt-1">
              Based on current Steam store prices
            </p>
          </div>

          {/* Unplayed Games Highlight */}
          <div className="text-center py-6 border-2 border-unplayed-red/50 rounded-lg bg-unplayed-red/10">
            <div className="text-3xl font-bold text-unplayed-red mb-2">
              <CurrencyAmount amount={spendingData.unplayedSpent} currency={spendingData.currency} />
            </div>
            <p className="text-white text-lg">Spent on Unplayed Games</p>
            <p className="text-sm text-gray-300 mt-1">
              {spendingData.unplayedGames} games gathering dust
            </p>
            {spendingData.unplayedSaved && spendingData.unplayedSaved > 0 && (
              <p className="text-unplayed-mint text-sm mt-2">
                You saved <CurrencyAmount amount={spendingData.unplayedSaved} currency={spendingData.currency} /> from sales!
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-black/30 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-white">{spendingData.totalGames}</div>
              <div className="text-sm text-gray-400">Total Games</div>
            </div>
            
            <div className="text-center p-4 bg-black/30 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-green-400">{spendingData.freeGames}</div>
              <div className="text-sm text-gray-400">Free Games</div>
            </div>
            
            <div className="text-center p-4 bg-black/30 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-unplayed-mint">
                <CurrencyAmount amount={averagePricePerGame} currency={spendingData.currency} />
              </div>
              <div className="text-sm text-gray-400">Avg Price/Game</div>
            </div>
            
            <div className="text-center p-4 bg-black/30 rounded-lg border border-gray-700">
              <div className="text-2xl font-bold text-blue-400">{spendingData.paidGames}</div>
              <div className="text-sm text-gray-400">Paid Games</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality & Methodology */}
      <Card className="bg-black/20 border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-lg text-gray-300">
            <Info className="w-5 h-5 mr-2" />
            Data Quality & Methodology
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Quality Indicator */}
          <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${
                spendingData.confidence === 'high' ? 'bg-green-500' :
                spendingData.confidence === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="text-white font-medium">
                  Data Confidence: {spendingData.confidence.toUpperCase()}
                </p>
                <p className="text-sm text-gray-400">
                  {spendingData.gamesWithPriceData}/{spendingData.gamesWithPriceData + spendingData.gamesMissingPriceData} games have price data 
                  ({spendingData.dataQualityPercentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>

          {/* Missing Data Warning */}
          {spendingData.gamesMissingPriceData > 0 && (
            <div className="flex items-start p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-medium">
                  {spendingData.gamesMissingPriceData} games have unknown pricing
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  These may be delisted games, region-locked, or have missing store data
                </p>
              </div>
            </div>
          )}

          {/* Methodology */}
          <div className="text-sm text-gray-400 space-y-2">
            <p>
              <strong>Calculation Method:</strong> Values are based on current Steam store prices where available. 
              Free games are properly identified and excluded from spending calculations.
            </p>
            <p>
              <strong>Discount Tracking:</strong> When available, we track original prices vs. discounted prices 
              to show you how much you've saved from sales.
            </p>
            {spendingData.lastCalculated && (
              <p>
                <strong>Last Updated:</strong> {formatLastUpdated(spendingData.lastCalculated)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpendingSummary;

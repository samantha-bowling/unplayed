
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign } from 'lucide-react';
import { useTopExpensiveUnplayedGames } from '@/hooks/useTopExpensiveUnplayedGames';
import CurrencyAmount from '@/components/ui/currency-amount';

const TopExpensiveUnplayedGames = () => {
  const { data: expensiveGames, isLoading } = useTopExpensiveUnplayedGames();

  if (isLoading) {
    return (
      <Card className="bg-black/20 border border-unplayed-mint/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-unplayed-mint animate-spin" />
            <span className="ml-2 text-sm text-gray-400">Loading top games...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!expensiveGames || expensiveGames.length === 0) {
    return (
      <Card className="bg-black/20 border border-unplayed-mint/20">
        <CardHeader>
          <CardTitle className="text-unplayed-mint">Top 3 Most Expensive unplayed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No expensive unplayed games found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
      <CardHeader>
        <CardTitle className="text-unplayed-mint">Top 3 Most Expensive unplayed</CardTitle>
        <p className="text-sm text-gray-400">Your priciest backlog items</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {expensiveGames.slice(0, 3).map((game, index) => (
          <div key={game.id} className="flex items-center space-x-4 p-3 rounded-lg bg-black/30 border border-gray-700">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-unplayed-mint font-bold">
                #{index + 1}
              </div>
            </div>
            
            <div className="flex-grow min-w-0">
              <h4 className="text-white font-medium truncate">{game.name}</h4>
              <div className="flex items-center space-x-2 mt-1">
                <CurrencyAmount 
                  amount={game.price} 
                  currency={game.currency}
                  className="text-unplayed-red font-bold"
                />
              </div>
            </div>

            {game.headerImage && (
              <div className="flex-shrink-0">
                <img 
                  src={game.headerImage} 
                  alt={game.name}
                  className="w-16 h-9 object-cover rounded border border-gray-600"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopExpensiveUnplayedGames;

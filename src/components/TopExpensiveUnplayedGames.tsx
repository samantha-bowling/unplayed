
import React from 'react';
import { Loader2, DollarSign, ExternalLink } from 'lucide-react';
import { useTopExpensiveUnplayedGames } from '@/hooks/useTopExpensiveUnplayedGames';
import CurrencyAmount from '@/components/ui/currency-amount';
import { Button } from '@/components/ui/button';

const TopExpensiveUnplayedGames = () => {
  const { data: expensiveGames, isLoading } = useTopExpensiveUnplayedGames();

  const handlePlayNow = (gameId: number, gameName: string) => {
    // Launch Steam game using steam:// protocol
    const steamUrl = `steam://rungameid/${gameId}`;
    window.open(steamUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="terminal-container shadow-[0_0_20px_rgba(163,247,191,0.15)] p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-unplayed-mint animate-spin" />
          <span className="ml-2 text-sm text-gray-400">Loading top games...</span>
        </div>
      </div>
    );
  }

  if (!expensiveGames || expensiveGames.length === 0) {
    return (
      <div className="terminal-container shadow-[0_0_20px_rgba(163,247,191,0.15)] p-6">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-unplayed-mint mb-2">
            Most Expensive Unplayed Games
          </h3>
          <p className="text-gray-400">
            Your priciest backlog investments waiting to be played
          </p>
        </div>
        <div className="text-center py-8 text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No expensive unplayed games found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-container shadow-[0_0_20px_rgba(163,247,191,0.15)] p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-unplayed-mint mb-2">
          Most Expensive Unplayed Games
        </h3>
        <p className="text-gray-400">
          Your priciest backlog investments waiting to be played
        </p>
      </div>
      
      <div className="space-y-4">
        {expensiveGames.slice(0, 3).map((game, index) => (
          <div 
            key={game.id} 
            className="group flex items-center space-x-4 p-4 rounded-lg bg-black/30 border border-gray-700 hover:border-unplayed-mint/50 transition-all duration-200 relative"
          >
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

            {/* Play Now Button - appears on hover */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                onClick={() => handlePlayNow(game.id, game.name)}
                size="sm"
                className="bg-unplayed-mint text-black hover:bg-unplayed-mint/90 font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Play Now
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopExpensiveUnplayedGames;

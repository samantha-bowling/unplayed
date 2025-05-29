
import React from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';

interface LibraryHeroSectionProps {
  unplayedCount: number;
  totalGames: number;
  onViewExpensive?: () => void;
}

const LibraryHeroSection: React.FC<LibraryHeroSectionProps> = ({
  unplayedCount,
  totalGames,
  onViewExpensive
}) => {
  const unplayedPercentage = totalGames > 0 ? Math.round((unplayedCount / totalGames) * 100) : 0;

  return (
    <section className="w-full navbar-offset pb-8 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
          Greetings, Commander of the Backlog
        </h1>
        <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
          Your mission: conquer {unplayedCount} unplayed games ({unplayedPercentage}% of your arsenal). 
          Time to turn your digital dust into gaming gold.
        </p>
        {onViewExpensive && (
          <div className="flex justify-center">
            <Button 
              onClick={onViewExpensive}
              variant="outline"
              className="bg-unplayed-amber/20 text-unplayed-amber font-semibold hover:bg-unplayed-amber/30 border-unplayed-amber/30"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              View Most Expensive Unplayed
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LibraryHeroSection;

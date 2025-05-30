
import React from 'react';

interface LibraryHeroSectionProps {
  unplayedCount: number;
  totalGames: number;
}

const LibraryHeroSection: React.FC<LibraryHeroSectionProps> = ({
  unplayedCount,
  totalGames,
}) => {
  const unplayedPercentage = totalGames > 0 ? Math.round((unplayedCount / totalGames) * 100) : 0;

  // Dynamic messaging based on unplayed percentage
  const getDynamicMessage = () => {
    if (unplayedPercentage <= 25) {
      return "Your backlog is under control! Time to celebrate your gaming prowess.";
    } else if (unplayedPercentage <= 50) {
      return "A moderate backlog - you're walking the fine line between enthusiasm and excess.";
    } else if (unplayedPercentage <= 75) {
      return "Your library is getting dusty... time to start some adventures!";
    } else {
      return "Houston, we have a backlog problem. But hey, at least you're prepared for anything!";
    }
  };

  return (
    <section className="w-full navbar-offset pb-8">
      <div className="max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
          Command Center
        </h1>
        <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
          {getDynamicMessage()}
        </p>
      </div>
    </section>
  );
};

export default LibraryHeroSection;

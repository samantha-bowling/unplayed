import React from 'react';
import { SteamLoader } from '@/components/SteamLoader';
import DustScoreBreakdown from '@/components/dust/CleanScoreBreakdown';
import DustScoreChart from '@/components/dust/DustScoreChart';
import GameSuggestion from '@/components/dust/GameSuggestion';
import GenreBreakdown from '@/components/dust/GenreBreakdown';
import LibraryPreview from '@/components/dust/LibraryPreview';
import ShelfLife from '@/components/dust/ShelfLife';
import SpendingBreakdown from '@/components/dust/SpendingBreakdown';
import { useDustScoreData } from '@/hooks/use-dust-score-data';
import { useEnhancedSpendingData } from '@/hooks/use-spending-data';

const DustPage = () => {
  const { data: dustData, isLoading, error } = useDustScoreData();
  const { data: enhancedSpendingData } = useEnhancedSpendingData();

  if (isLoading) {
    return <SteamLoader />;
  }

  if (error) {
    console.error('Error loading dust score data:', error);
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading dust score data.</p>
      </div>
    );
  }

  if (!dustData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No dust score data available.</p>
      </div>
    );
  }

  // Create a legacy breakdown for display compatibility
  const legacyBreakdown = dustData.cleanScoreBreakdown 
    ? {
        completionRate: dustData.cleanScoreBreakdown.backlogConversionScore || 0,
        engagementFactor: dustData.cleanScoreBreakdown.sessionDepthScore || 0,
        recencyFactor: dustData.cleanScoreBreakdown.recencyScore || 0
      }
    : {
        completionRate: 0,
        engagementFactor: 0,
        recencyFactor: 0
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header Section */}
      <header className="py-6 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-semibold text-white text-center">
            Your Library Dust Score: <span className="text-unplayed-mint">{dustData.dustScore}</span>
          </h1>
          <p className="text-gray-400 text-center mt-2">
            A measure of how well you're utilizing your Steam library
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        {/* Dust Score Chart Section */}
        <section className="mb-12">
          <DustScoreChart dustScore={dustData.dustScore} breakdown={dustData.dustScoreBreakdown} />
        </section>

        {/* Game Suggestion Section */}
        <section className="mb-12">
          <GameSuggestion topDustContributors={dustData.topDustContributors} />
        </section>

        {/* Genre Breakdown Section */}
        <section className="mb-12">
          <GenreBreakdown />
        </section>

        {/* Spending Breakdown Section */}
        <section className="mb-12">
          <SpendingBreakdown enhancedSpendingData={enhancedSpendingData} />
        </section>

        {/* Library Preview Section */}
        <section className="mb-12">
          <LibraryPreview />
        </section>

        {/* Shelf Life Section */}
        <section className="mb-12">
          <ShelfLife />
        </section>

        {/* Clean Score Section */}
        <section className="mb-12">
          <CleanScoreBreakdown 
            cleanScore={dustData.cleanScore || 0}
            breakdown={legacyBreakdown}
            cleanStreak={dustData.cleanStreak}
            recentlyPlayedCount={dustData.recentlyPlayedCount}
            recentlyPlayedUnplayed={dustData.recentlyPlayedUnplayed}
            cleanStreakMetadata={dustData.cleanStreakMetadata}
          />
        </section>

        {/* Footer Section */}
        <footer className="text-center text-gray-500 mt-8">
          <p>&copy; 2023 Dust Score. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default DustPage;


import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import RandomPicker from '@/components/RandomPicker';
import DustScoreMeter from '@/components/DustScoreMeter';
import CleanScoreMeter from '@/components/CleanScoreMeter';
import UnplayedCounter from '@/components/UnplayedCounter';
import SpendingMeter from '@/components/SpendingMeter';
import LibraryPreview from '@/components/LibraryPreview';
import SteamLoader from '@/components/SteamLoader';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DashboardLayout from '@/layouts/DashboardLayout';
import LinkSteamAccount from '@/components/LinkSteamAccount';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import GenreGalaxy from '@/components/GenreGalaxy';
import RecentPick from '@/components/RecentPick';
import { useGamePicks } from '@/hooks/use-game-picks';

const IndexOptimized = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { isFullScreenMode } = useFullScreenMode();
  const { data: unplayedData, isLoading, error } = useUnplayedData();
  const { recentPick } = useGamePicks();
  const [showSteamLoader, setShowSteamLoader] = useState(false);
  const [hideSpending, setHideSpending] = useState(false);

  // If user is null and we're not in demo mode, show the auth page
  if (!user && !isDemo) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col justify-center items-center px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6 gradient-text">Welcome to unplayed</h1>
            <p className="text-lg text-gray-300 mb-8">
              Stop buying games you'll never play. Track your Steam library, discover hidden gems, and actually play what you own.
            </p>
            <LinkSteamAccount />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state while data is being fetched
  if (isLoading && !isDemo) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col justify-center items-center">
          <SteamLoader />
        </div>
      </DashboardLayout>
    );
  }

  // Show error state if there's an error and we're not in demo mode
  if (error && !isDemo) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex flex-col justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-red-400">Error Loading Data</h2>
            <p className="text-gray-300 mb-4">We couldn't load your library data.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      {!isFullScreenMode && <Header />}
      <div className={`min-h-screen ${!isFullScreenMode ? 'navbar-offset' : ''}`}>
        {/* Hero Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-text font-space">
                Your Gaming Dashboard
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Track your library, discover hidden gems, and actually play what you own.
              </p>
            </div>

            {/* Main Dashboard Grid */}
            <div className="dashboard-grid mb-12">
              <RandomPicker />
              <DustScoreMeter />
              <UnplayedCounter />
              <CleanScoreMeter />
              {!hideSpending && (
                <SpendingMeter
                  amount={unplayedData?.totalSpent || 0}
                  isLoading={isLoading}
                  onHideClick={() => setHideSpending(true)}
                  isDemo={isDemo}
                  hasUser={!!user}
                />
              )}
              <RecentPick recentPick={recentPick} isDemo={isDemo} />
            </div>
          </div>
        </section>

        {/* Library Preview Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-unplayed-mint font-space">Your Library</h2>
              <p className="text-gray-300">A quick look at your collection</p>
            </div>
            <LibraryPreview />
          </div>
        </section>

        {/* Genre Galaxy Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-unplayed-pink font-space">Genre Galaxy</h2>
              <p className="text-gray-300">Explore your gaming universe</p>
            </div>
            <GenreGalaxy 
              genres={unplayedData?.genres?.map(genre => ({ genre: genre.name, count: genre.value })) || []}
              totalGames={unplayedData?.totalGames || 0}
            />
          </div>
        </section>
      </div>
      {!isFullScreenMode && <Footer />}
    </>
  );
};

export default IndexOptimized;

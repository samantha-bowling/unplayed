
import Header from "../components/Header";
import DustScoreMeter from "../components/DustScoreMeter";
import UnplayedCounter from "../components/UnplayedCounter";
import GenreHoarding from "../components/GenreHoarding";
import ShelfLife from "../components/ShelfLife";
import RandomPicker from "../components/RandomPicker";
import LibraryPreview from "../components/LibraryPreview";
import SpendingEstimate from "../components/SpendingEstimate";
import Footer from "../components/Footer";
import FullScreenModeWrapper from "@/components/FullScreenModeWrapper";
import { useAuth } from "@/context/AuthContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useDemoMode } from "@/context/DemoModeContext";
import useUnplayedData from "@/hooks/use-unplayed-data";
import SteamLoginButton from "@/components/SteamLoginButton";

const Index = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { data: unplayedData, isLoading } = useUnplayedData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();

  // In Full Screen Mode, show only the focused component
  if (isFullScreenMode && focusedComponent) {
    return <FullScreenModeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          {focusedComponent === 'library' && <LibraryPreview zenModeFullScreen={true} />}
          {focusedComponent === 'picker' && <RandomPicker fullScreen={true} />}
        </div>
      </FullScreenModeWrapper>;
  }
  
  return <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        {/* Hero section - Add header spacing */}
        <section className="w-full navbar-offset pb-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
              Your PC games are gathering dust.
            </h1>
            <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
              unplayed helps you conquer your massive Steam backlog and actually play the games you own.
            </p>
            <div className="flex justify-center">
              <SteamLoginButton centered />
            </div>
          </div>
        </section>
        
        {/* Dashboard section */}
        <section id="dashboard" className="w-full py-8 px-4 bg-black/30">
          <div className="max-w-7xl mx-auto">
            {/* Add Demo Mode Banner */}
            {!user && <div className="mb-6 glass-panel p-4 border-unplayed-amber/30 border rounded-lg">
                <h3 className="text-lg font-medium text-unplayed-amber mb-2">
                  🔍 Demo Mode Active
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  You're viewing example data. Connect your Steam account to see your personal gaming stats.
                </p>
                
              </div>}
            
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-mint">Dashboard</span>
              <span className="text-white">.exe</span>
            </h2>
            
            <div className="dashboard-grid">
              <UnplayedCounter count={unplayedData.unplayedGames} />
              <DustScoreMeter score={unplayedData.dustScore} />
              <SpendingEstimate amount={unplayedData.totalSpent} />
            </div>
            
            <div className="mt-4">
              <GenreHoarding />
            </div>
            
            <div className="mt-4">
              <ShelfLife />
            </div>
          </div>
        </section>
        
        {/* Library preview section */}
        <section id="library" className="w-full py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-pink">Library</span>
              <span className="text-white">.exe</span>
            </h2>
            
            <LibraryPreview />
          </div>
        </section>
        
        {/* Random picker section */}
        <section id="picker" className="w-full py-8 px-4 bg-black/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-amber">Picker</span>
              <span className="text-white">.exe</span>
            </h2>
            
            <RandomPicker />
          </div>
        </section>
        
        {/* Call to action */}
        <section className="w-full py-10 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold font-space mb-4 text-white">
              Ready to confront your backlog?
            </h2>
            <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
              Connect your Steam account and start using your unplayed games today.
            </p>
            <div className="flex justify-center">
              <SteamLoginButton centered />
            </div>
            
            <p className="text-sm text-gray-500 mt-4 mb-2">We use Steam's Web API. Your account details are safe.</p>
          </div>
        </section>
        
        <Footer />
      </div>
    </FullScreenModeWrapper>;
};
export default Index;

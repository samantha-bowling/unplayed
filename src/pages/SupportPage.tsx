
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HallOfThanks from "@/components/HallOfThanks";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SupportPage = () => {
  const {
    isFullScreenMode,
    toggleFullScreenMode
  } = useFullScreenMode();
  const [isFullScreenModeActive, setIsFullScreenModeActive] = useState(false);

  // Enable full screen mode effect for this page by default
  useEffect(() => {
    if (!isFullScreenMode) {
      toggleFullScreenMode();
      setIsFullScreenModeActive(true);
    }

    // Cleanup - return to previous state if needed
    return () => {
      if (isFullScreenModeActive) {
        toggleFullScreenMode();
      }
    };
  }, []);
  
  return <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section - Using our header spacing utility class */}
      <section className="navbar-offset flex-grow flex flex-col items-center justify-center px-4 pb-12 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-unplayed-mint">
          Support Unplayed
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
          Like Unplayed? It's built by a nostalgic gamer and powered by love, caffeine, and indecision.
        </p>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="https://donate.stripe.com/6oE4jHd5H9ZhbrW5kk" target="_blank" rel="noopener noreferrer" className="inline-block">
                <Button className="bg-unplayed-pink hover:bg-unplayed-pink/90 text-white font-bold py-3 px-6 rounded-md text-lg">
                  Donate via Stripe 💖
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-gray-900/90 border border-gray-700 text-gray-200 p-3">
              <p>Donations help cover hosting, updates, coffee, and support new features for fellow indecisive gamers everywhere.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      {/* Hall of Thanks section */}
      <section className="py-8 px-4 mb-8">
        <HallOfThanks />
      </section>
      
      <Footer />
    </div>;
};

export default SupportPage;

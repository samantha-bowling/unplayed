
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HallOfThanks from "@/components/HallOfThanks";
import Footer from "@/components/Footer";
import { useZenMode } from "@/context/ZenModeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SupportPage = () => {
  const {
    isZenMode,
    toggleZenMode
  } = useZenMode();
  const [isZenModeActive, setIsZenModeActive] = useState(false);

  // Enable zen mode effect for this page by default
  useEffect(() => {
    if (!isZenMode) {
      toggleZenMode();
      setIsZenModeActive(true);
    }

    // Cleanup - return to previous state if needed
    return () => {
      if (isZenModeActive) {
        toggleZenMode();
      }
    };
  }, []);
  
  return <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 py-12 text-center relative overflow-hidden">
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

      {/* Hall of Thanks section - moved up */}
      <section className="py-8 px-4 mb-8">
        <HallOfThanks />
      </section>
      
      <Footer />
    </div>;
};

export default SupportPage;

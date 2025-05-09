
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HallOfThanks from "@/components/HallOfThanks";
import Footer from "@/components/Footer";
import { useZenMode } from "@/context/ZenModeContext";

const SupportPage = () => {
  const { isZenMode, toggleZenMode } = useZenMode();
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero section */}
      <section className="flex-grow flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-unplayed-mint">
          Support Unplayed
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
          Like Unplayed? It's built by a nostalgic gamer and powered by love, caffeine, and indecision.
        </p>
        
        <a 
          href="https://donate.stripe.com/6oE4jHd5H9ZhbrW5kk" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button className="bg-unplayed-pink hover:bg-unplayed-pink/90 text-white font-bold py-3 px-6 rounded-md text-lg">
            Donate via Stripe 💖
          </Button>
        </a>
        
        {/* How it helps section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-unplayed-mint">How It Helps</h2>
          <p className="text-gray-300">
            Donations help cover hosting, updates, coffee, and support new features
            for fellow indecisive gamers everywhere.
          </p>
          <div className="mt-4 text-4xl">🎮 ☕ 💻</div>
        </div>
      </section>

      {/* Hall of Thanks section */}
      <section className="py-16 px-4">
        <HallOfThanks />
      </section>
      
      <Footer />
    </div>
  );
};

export default SupportPage;

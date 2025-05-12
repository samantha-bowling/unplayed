
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Info } from "lucide-react";
import HallOfThanks from "@/components/HallOfThanks";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const SupportPage = () => {
  const { isFullScreenMode, toggleFullScreenMode } = useFullScreenMode();
  const [gameCount, setGameCount] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = () => {
    if (!gameCount || gameCount < 1) {
      setError("Please enter at least 1 game");
      setResult(null);
      return;
    }

    if (gameCount > 10000) {
      setError("Whoa, collector.");
      setResult(null);
      return;
    }

    setError(null);
    // Calculate cost: games × $0.00002 × 12 months per year
    const yearlyGameCost = gameCount * 0.00002 * 12;
    setResult(yearlyGameCost);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section - Using our header spacing utility class */}
      <section className="navbar-offset flex-grow flex flex-col items-center justify-center px-4 pb-8 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-unplayed-mint">
          Dust ≠ Free
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
          Turns out the cost of digital dust adds up.
        </p>
        
        <div className="glass-panel p-6 max-w-md w-full mx-auto mb-8">
          <div className="mb-4">
            <label htmlFor="gameCount" className="block text-sm font-medium text-gray-300 mb-1 text-left">
              How many games are in your Steam library?
            </label>
            <Input
              id="gameCount"
              type="number"
              min="1"
              max="10000"
              value={gameCount || ''}
              onChange={(e) => setGameCount(parseInt(e.target.value, 10) || 0)}
              className="bg-black/40 border-gray-700"
            />
            {error && (
              <p className="text-sm text-amber-400 mt-1 text-left">{error}</p>
            )}
          </div>
          
          <Button 
            onClick={calculateCost} 
            className="w-full bg-unplayed-mint text-black hover:bg-unplayed-mint/90 mb-4"
          >
            Calculate
          </Button>
          
          {result !== null && (
            <div className="bg-black/30 border border-unplayed-mint/30 p-4 rounded-md">
              <p className="text-lg font-medium text-unplayed-mint">
                Your library costs us around ${result.toFixed(2)}/year to host.
              </p>
              <p className="text-sm text-gray-300 mt-1">
                That's cheaper than the next bundle you buy that you'll never touch.
              </p>
            </div>
          )}
        </div>
        
        <p className="text-lg max-w-2xl mx-auto mb-6 text-gray-300">
          If you're enjoying unplayed, consider donating today to keep the lights on and be forever immortalized in the Hall of Thanks 🤍
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
              <div className="flex items-start">
                <Info className="w-4 h-4 mr-2 mt-1 text-unplayed-mint" />
                <p>Based on unplayed's real monthly infrastructure costs (Supabase, bandwidth, database storage, etc.) divided by total user & library volume. We average $0.00002 per game per user per month.</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      {/* Hall of Thanks section */}
      <section className="py-8 px-4 mb-8">
        <HallOfThanks />
      </section>
      
      <Footer />
    </div>
  );
};

export default SupportPage;

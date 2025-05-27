import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Info, Sparkles, Gamepad2, Package, Archive, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HallOfThanks from "@/components/HallOfThanks";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

// Define tier structure based on game count
interface Tier {
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  thresholdGames: number;
}

const TIERS: Tier[] = [
  {
    name: "Indie Curator",
    description: "Small but mighty collection. Quality over quantity!",
    icon: Gamepad2,
    color: "text-unplayed-mint",
    thresholdGames: 0, // 0-99 games
  },
  {
    name: "Backlog Brawler",
    description: "Your games could cover a wall. Bold ambitions!",
    icon: Package,
    color: "text-unplayed-amber",
    thresholdGames: 100, // 100-499 games
  },
  {
    name: "Bundle Hoarder",
    description: "We see those Humble receipts. No sale left behind!",
    icon: Archive,
    color: "text-unplayed-pink",
    thresholdGames: 500, // 500-999 games
  },
  {
    name: "Dust Lord",
    description: "May your storage be infinite. All hail!",
    icon: Star,
    color: "text-unplayed-red",
    thresholdGames: 1000, // 1000+ games
  },
];

interface SupportPageProps {
  totalGameCountProp?: number;
}

const SupportPage = ({ totalGameCountProp }: SupportPageProps) => {
  const { isFullScreenMode, toggleFullScreenMode } = useFullScreenMode();
  const [gameCount, setGameCount] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);
  const [totalGameCount, setTotalGameCount] = useState<number>(19400000); // Default value before fetch
  
  // Use prop if provided (from admin page), otherwise fetch from Supabase
  useEffect(() => {
    if (totalGameCountProp) {
      setTotalGameCount(totalGameCountProp);
    } else {
      const fetchTotalGameCount = async () => {
        try {
          const { count, error } = await supabase
            .from('user_games')
            .select('*', { count: 'exact', head: true });
            
          if (error) {
            console.error('Error fetching total game count:', error);
            return;
          }
          
          if (count !== null) {
            setTotalGameCount(count);
          }
        } catch (err) {
          console.error('Error in fetchTotalGameCount:', err);
        }
      };
      
      fetchTotalGameCount();
    }
  }, [totalGameCountProp]);
  
  // Determine the user's tier based on game count
  useEffect(() => {
    if (gameCount > 0 && result !== null) {
      // Find the highest tier they qualify for (working backwards)
      for (let i = TIERS.length - 1; i >= 0; i--) {
        if (gameCount >= TIERS[i].thresholdGames) {
          setCurrentTier(TIERS[i]);
          break;
        }
      }
    }
  }, [gameCount, result]);
  
  // Animate the amount counting up
  useEffect(() => {
    if (result !== null && showFinalResult) {
      const duration = 1500;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const increment = result / totalFrames;
      let currentFrame = 0;
      
      const timer = setInterval(() => {
        currentFrame++;
        const value = Math.min(increment * currentFrame, result);
        setAnimatedAmount(value);
        
        if (currentFrame === totalFrames) {
          clearInterval(timer);
        }
      }, frameDuration);
      
      return () => clearInterval(timer);
    }
  }, [result, showFinalResult]);

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
    setIsCalculating(true);
    
    // Calculate cost: games × $0.00002 × 12 months per year
    const yearlyGameCost = gameCount * 0.00002 * 12;
    setResult(yearlyGameCost);
    
    // Simulate calculation time for dramatic effect
    setTimeout(() => {
      setIsCalculating(false);
      setTimeout(() => {
        setShowFinalResult(true);
      }, 300);
    }, 1500);
  };

  const resetCalculation = () => {
    setShowFinalResult(false);
    setResult(null);
    setAnimatedAmount(0);
    setCurrentTier(null);
  };

  // Estimate a rounded donation amount (nearest dollar above their cost)
  const suggestedDonation = result ? Math.max(1, Math.ceil(result)) : 1;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section */}
      <section className="navbar-offset flex-grow flex flex-col items-center justify-center px-4 pb-8 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-unplayed-mint relative z-10">
          Dust <span className="text-unplayed-pink">≠</span> Free
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300 relative z-10">
          Turns out the cost of digital dust adds up. What's your collection costing us?
        </p>
        
        <div className="glass-panel p-6 max-w-md w-full mx-auto mb-8 relative z-10 border border-white/10 overflow-hidden">
          {!showFinalResult ? (
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
                disabled={isCalculating}
              />
              {error && (
                <p className="text-sm text-amber-400 mt-1 text-left">{error}</p>
              )}
            </div>
          ) : null}

          {!showFinalResult && !isCalculating && (
            <Button 
              onClick={calculateCost} 
              className="w-full bg-unplayed-mint text-black hover:bg-unplayed-mint/90 mb-4"
            >
              Calculate
            </Button>
          )}
          
          {/* Calculating animation */}
          <AnimatePresence>
            {isCalculating && (
              <motion.div 
                className="py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="flex flex-col items-center"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Sparkles className="h-10 w-10 text-unplayed-amber mb-3" />
                  <p className="text-gray-300">Calculating dust accumulation...</p>
                  
                  <div className="mt-3 flex space-x-2">
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-unplayed-mint"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-unplayed-mint"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    />
                    <motion.div 
                      className="h-2 w-2 rounded-full bg-unplayed-mint"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results display */}
          <AnimatePresence>
            {showFinalResult && currentTier && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative"
              >
                {/* Tier reveal */}
                <motion.div 
                  className={`p-4 rounded-md border ${currentTier.color === 'text-unplayed-mint' ? 'border-unplayed-mint/30' : 
                    currentTier.color === 'text-unplayed-amber' ? 'border-unplayed-amber/30' : 
                    currentTier.color === 'text-unplayed-pink' ? 'border-unplayed-pink/30' : 
                    'border-unplayed-red/30'}`}
                  style={{ 
                    background: `radial-gradient(circle at center, ${
                      currentTier.color === 'text-unplayed-mint' ? 'rgba(163, 247, 191, 0.15)' : 
                      currentTier.color === 'text-unplayed-amber' ? 'rgba(255, 216, 102, 0.15)' : 
                      currentTier.color === 'text-unplayed-pink' ? 'rgba(239, 93, 255, 0.15)' : 
                      'rgba(255, 60, 56, 0.15)'
                    } 0%, transparent 70%)` 
                  }}
                >
                  <div className="flex justify-center mb-3">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.3 }}
                      className={`p-2 rounded-full ${
                        currentTier.color === 'text-unplayed-mint' ? 'bg-unplayed-mint/20' : 
                        currentTier.color === 'text-unplayed-amber' ? 'bg-unplayed-amber/20' : 
                        currentTier.color === 'text-unplayed-pink' ? 'bg-unplayed-pink/20' : 
                        'bg-unplayed-red/20'
                      }`}
                    >
                      <currentTier.icon className={`h-8 w-8 ${currentTier.color}`} />
                    </motion.div>
                  </div>
                  
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className={`text-xl font-bold mb-1 ${currentTier.color}`}
                  >
                    {currentTier.name}
                  </motion.h2>
                  
                  <p className="text-gray-300 text-sm mb-3">{currentTier.description}</p>
                  
                  <div className="bg-black/30 p-3 rounded-md my-3">
                    <p className="text-sm text-gray-400 mb-1">Annual hosting cost:</p>
                    <p className={`text-2xl font-bold ${currentTier.color}`}>
                      ${animatedAmount.toFixed(2)}
                    </p>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <p className="text-sm text-gray-300 mb-4">
                      That's what it costs us to keep your {gameCount} game{gameCount !== 1 ? 's' : ''} dust-free in our cloud.
                    </p>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={resetCalculation} 
                        variant="outline" 
                        className="flex-1 text-xs border-gray-700"
                      >
                        Recalculate
                      </Button>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`https://donate.stripe.com/6oE4jHd5H9ZhbrW5kk?amount=${suggestedDonation}00`} 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="flex-1">
                              <Button className={`w-full text-white ${
                                currentTier.color === 'text-unplayed-mint' ? 'bg-unplayed-mint hover:bg-unplayed-mint/90 text-black' : 
                                currentTier.color === 'text-unplayed-amber' ? 'bg-unplayed-amber hover:bg-unplayed-amber/90 text-black' : 
                                currentTier.color === 'text-unplayed-pink' ? 'bg-unplayed-pink hover:bg-unplayed-pink/90' : 
                                'bg-unplayed-red hover:bg-unplayed-red/90'
                              }`}>
                                Donate ${suggestedDonation}
                              </Button>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs bg-gray-900/90 border border-gray-700 text-gray-200 p-3">
                            <p>Round up to ${suggestedDonation} and cover the cost of your dusty games—plus help us keep the server lights on! 💖</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                </motion.div>
                
                {/* Decorative sparkles */}
                <motion.div 
                  className="absolute -top-2 -right-2"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: 10 }}
                  transition={{ delay: 0.9 }}
                >
                  <Sparkles className={`h-5 w-5 ${currentTier.color}`} />
                </motion.div>
                <motion.div 
                  className="absolute -bottom-2 -left-2"
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: -10 }}
                  transition={{ delay: 1 }}
                >
                  <Sparkles className={`h-5 w-5 ${currentTier.color}`} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Info section if not showing result */}
          {!showFinalResult && !isCalculating && (
            <div className="text-xs text-gray-400 mt-1 text-left flex items-start">
              <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-unplayed-mint" />
              <p>Based on unplayed's real monthly infrastructure costs (Supabase, bandwidth, database storage, etc.) divided by total users. We average $0.00002 per game per user per month.</p>
            </div>
          )}
        </div>
        
        {!showFinalResult && (
          <>
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
                <TooltipContent side="top" className="max-w-xs bg-gray-900/90 border border-gray-700 text-gray-200 p-3">
                  <div className="flex items-start">
                    <Info className="w-4 h-4 mr-2 mt-1 text-unplayed-mint" />
                    <p>Your donation helps us fight the good fight against dusty Steam libraries. Every penny goes towards our mission of helping gamers actually play their games!</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
        
        {/* Statistics counter */}
        <motion.div 
          className="mt-8 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <p>Unplayed is currently hosting over <span className="text-unplayed-mint font-medium">
            {(totalGameCount).toLocaleString()}
          </span> dusty games across all users</p>
        </motion.div>
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

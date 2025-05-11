
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import HallOfThanks from "@/components/HallOfThanks";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallback } from "react";
import { RefreshCw } from "lucide-react";

const SupportPage = () => {
  const {
    isFullScreenMode,
    toggleFullScreenMode
  } = useFullScreenMode();

  // Admin function to trigger tier calculation
  const calculateTiers = useCallback(async () => {
    try {
      toast.info("Calculating donor tiers...");
      
      // Call the calculate-donor-tiers function
      const { data, error } = await supabase.functions.invoke("calculate-donor-tiers");
      
      if (error) {
        console.error("Error calculating tiers:", error);
        toast.error("Failed to calculate donor tiers");
        return;
      }
      
      toast.success("Donor tiers calculated successfully!");
      console.log("Tier calculation result:", data);
      
      // Reload the page to see updated tiers
      window.location.reload();
    } catch (err) {
      console.error("Error calling tier calculation:", err);
      toast.error("Error occurred while calculating tiers");
    }
  }, []);

  return <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section - Using our header spacing utility class */}
      <section className="navbar-offset flex-grow flex flex-col items-center justify-center px-4 pb-12 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-unplayed-mint">
          Support Unplayed
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">Like Unplayed? It's built by a nostalgic gamer and powered by love, caffeine, and indecision. Keep Unplayed FREE (I hate ads too) by donating today!</p>
        
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
        
        {/* Admin tools section - More visible but still subtle */}
        <div className="mt-8 pt-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Admin Tools</h3>
            <div className="flex items-center">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-700 bg-black/50 hover:bg-black/70"
                onClick={calculateTiers}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Recalculate Donor Tiers
              </Button>
              <p className="ml-3 text-xs text-gray-500">Updates donor tier rankings based on donation amounts</p>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>;
};
export default SupportPage;

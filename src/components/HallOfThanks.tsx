
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DonorGrid from "./DonorGrid";
import { Tables } from "@/integrations/supabase/types";
import { Heart, Crown, Sparkles } from "lucide-react";
import { Separator } from "./ui/separator";

const HallOfThanks = () => {
  const [donors, setDonors] = useState<Tables<"donors">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const { data, error } = await supabase
          .from("donors")
          .select("*")
          .eq("approved", true)
          .order("created_at", { ascending: false });

        if (error) throw new Error(error.message);
        setDonors(data || []);
      } catch (err) {
        console.error("Error fetching donors:", err);
        setError("Failed to load our supporters. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, []);

  // Count donors by tier
  const tierCounts = {
    legendary: donors.filter(d => d.tier === "legendary").length,
    radiant: donors.filter(d => d.tier === "radiant").length,
    appreciated: donors.filter(d => d.tier === "appreciated" || !d.tier).length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-unplayed-mint relative">
        Hall of Thanks 
        <span className="inline-block ml-2 relative">
          <Heart 
            className="inline-block pulsating-heart text-unplayed-pink" 
            fill="currentColor"
            size={40}
          />
        </span>
      </h1>

      {/* Tier legend */}
      <div className="flex flex-wrap justify-center gap-6 mb-6">
        <div className="flex items-center">
          <Crown className="h-5 w-5 mr-2 text-unplayed-amber" />
          <span className="text-unplayed-amber font-medium">Legendary Supporters</span>
          <span className="text-gray-400 ml-2 text-sm">{tierCounts.legendary}</span>
        </div>
        <div className="flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-unplayed-mint" />
          <span className="text-unplayed-mint font-medium">Radiant Supporters</span>
          <span className="text-gray-400 ml-2 text-sm">{tierCounts.radiant}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-300 font-medium">Appreciated Supporters</span>
          <span className="text-gray-400 ml-2 text-sm">{tierCounts.appreciated}</span>
        </div>
      </div>
      
      <Separator className="mb-6 bg-gray-800" />
      
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading our amazing supporters...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : donors.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-unplayed-mint/30 rounded-lg bg-black/30">
          <p className="text-xl text-unplayed-mint">No supporters yet? Be the first!</p>
          <p className="mt-2 text-gray-400">
            Your name could be floating here in pixel glory.
          </p>
        </div>
      ) : (
        <DonorGrid donors={donors} />
      )}
    </div>
  );
};

export default HallOfThanks;


import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DonorGrid from "./DonorGrid";
import { Tables } from "@/integrations/supabase/types";
import { Heart } from "lucide-react";

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

      <style jsx>{`
        @keyframes pulse-glow {
          0% {
            filter: drop-shadow(0 0 4px rgba(239, 93, 255, 0.6));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 0 10px rgba(239, 93, 255, 0.9));
            transform: scale(1.1);
          }
          100% {
            filter: drop-shadow(0 0 4px rgba(239, 93, 255, 0.6));
            transform: scale(1);
          }
        }

        .pulsating-heart {
          animation: pulse-glow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default HallOfThanks;

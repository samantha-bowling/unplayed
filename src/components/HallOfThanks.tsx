
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DonorGrid from "./DonorGrid";
import { Tables } from "@/integrations/supabase/types";

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
      <h2 className="text-3xl font-bold text-center mb-8 terminal-header text-unplayed-mint">
        Hall of Thanks <span className="animate-pulse">🧡</span>
      </h2>
      
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

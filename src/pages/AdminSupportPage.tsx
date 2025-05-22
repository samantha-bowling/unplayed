
import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import SupportPage from "./SupportPage";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthPermission } from "@/hooks/use-auth-permission";

const AdminSupportPage = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuthPermission();
  
  // Check if this is the old Steam Data page and redirect if so
  if (location.pathname === "/auth/steam-data") {
    return <Navigate to="/admin/queue-manager" replace />;
  }

  // Check admin permission using our new utility
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Admin function to trigger tier calculation
  const calculateTiers = useCallback(async () => {
    try {
      setIsCalculating(true);
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
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return (
    <>
      {/* First render the regular support page content */}
      <SupportPage />
      
      {/* Then add the admin tools overlay */}
      <div className="max-w-7xl mx-auto px-4 -mt-4 pb-8">
        <div className="border-t border-gray-800 pt-6">
          <div className="bg-black/30 border border-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-unplayed-mint mb-4">Admin Tools</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 bg-black/50 hover:bg-black/70"
                  onClick={calculateTiers}
                  disabled={isCalculating}
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                  {isCalculating ? 'Calculating...' : 'Recalculate Donor Tiers'}
                </Button>
                <p className="ml-3 text-sm text-gray-400">Updates donor tier rankings based on donation amounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSupportPage;

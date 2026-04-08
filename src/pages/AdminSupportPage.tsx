import { useCallback, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import SupportPage from "./SupportPage";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthPermission } from "@/hooks/use-auth-permission";
import AdminLayout from "@/layouts/AdminLayout";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";

const AdminSupportPage = () => {
  const [isCalculating, setIsCalculating] = useState(false);
  const [isRefreshingCount, setIsRefreshingCount] = useState(false);
  const [totalGameCount, setTotalGameCount] = useState<number>(1946);
  const location = useLocation();
  const { isAdmin } = useAuthPermission();

  if (location.pathname === "/auth/steam-data") {
    return <Navigate to="/admin/queue-manager" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const fetchTotalGameCount = useCallback(async () => {
    try {
      setIsRefreshingCount(true);
      const { data, error } = await supabase.rpc('get_total_game_count');
      if (error) {
        console.error('Error fetching total game count:', error);
        toast.error('Failed to refresh game count');
        return;
      }
      if (data !== null) {
        setTotalGameCount(data);
        toast.success('Game count refreshed successfully');
      }
    } catch (err) {
      console.error('Error in fetchTotalGameCount:', err);
      toast.error('Error occurred while refreshing game count');
    } finally {
      setIsRefreshingCount(false);
    }
  }, []);

  useEffect(() => {
    fetchTotalGameCount();
  }, [fetchTotalGameCount]);

  const calculateTiers = useCallback(async () => {
    try {
      setIsCalculating(true);
      toast.info("Calculating donor tiers...");
      const { data, error } = await supabase.functions.invoke("calculate-donor-tiers");
      if (error) {
        console.error("Error calculating tiers:", error);
        toast.error("Failed to calculate donor tiers");
        return;
      }
      toast.success("Donor tiers calculated successfully!");
      console.log("Tier calculation result:", data);
      window.location.reload();
    } catch (err) {
      console.error("Error calling tier calculation:", err);
      toast.error("Error occurred while calculating tiers");
    } finally {
      setIsCalculating(false);
    }
  }, []);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-24">
        <AdminBreadcrumb currentPage="Admin Support" />

        {/* Render the regular support page content */}
        <SupportPage totalGameCountProp={totalGameCount} />

        {/* Admin tools section */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-700/10 border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-unplayed-mint mb-4">Admin Tools</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-3"
                  onClick={calculateTiers}
                  disabled={isCalculating}
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                  {isCalculating ? 'Calculating...' : 'Recalculate Donor Tiers'}
                </Button>
                <p className="text-sm text-muted-foreground">Updates donor tier rankings based on donation amounts</p>
              </div>

              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-3"
                  onClick={fetchTotalGameCount}
                  disabled={isRefreshingCount}
                >
                  <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRefreshingCount ? 'animate-spin' : ''}`} />
                  {isRefreshingCount ? 'Refreshing...' : 'Refresh Game Count'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Updates the total game count displayed on the page (currently: {totalGameCount.toLocaleString()})
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupportPage;

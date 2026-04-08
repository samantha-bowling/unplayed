
import AuthDebug from "@/components/AuthDebug";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import AdminLayout from "@/layouts/AdminLayout";
import AdminBreadcrumb from "@/components/admin/AdminBreadcrumb";

const AuthDebugPage = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [nextRefresh, setNextRefresh] = useState<number | null>(null);
  const { refreshProfile } = useProfile();

  useEffect(() => {
    if (autoRefresh) {
      refreshProfile().catch(error => {
        console.error("Error in auto-refresh:", error);
        toast.error("Auto-refresh Error", {
          description: String(error) || "Failed to refresh profile",
        });
      });

      const intervalTime = 30000;
      const interval = window.setInterval(() => {
        refreshProfile().catch(error => {
          console.error("Error in auto-refresh:", error);
        });
      }, intervalTime);

      const countdown = window.setInterval(() => {
        setNextRefresh(prev => {
          if (prev === null || prev <= 0) return intervalTime / 1000;
          return prev - 1;
        });
      }, 1000);

      setNextRefresh(intervalTime / 1000);

      return () => {
        window.clearInterval(interval);
        window.clearInterval(countdown);
        setNextRefresh(null);
      };
    }
  }, [autoRefresh, refreshProfile]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-24">
        <AdminBreadcrumb currentPage="Authentication Debug" />

        <div className="bg-red-900/30 border border-red-700 rounded-md mb-6 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-400 mr-2 flex-shrink-0" />
            <h2 className="font-bold text-red-300">Developer/Admin Tool Only</h2>
          </div>
          <p className="text-red-200 mt-2 pl-8">
            This page exposes sensitive debugging information and is not intended for regular users.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-unplayed-mint">Authentication Debug</h1>
          <div className="flex items-center space-x-2">
            <Button
              variant={autoRefresh ? "destructive" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center space-x-2"
            >
              <Webhook className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Stop Auto-refresh' : 'Start Auto-refresh'}</span>
            </Button>
            {autoRefresh && nextRefresh !== null && (
              <span className="text-sm text-muted-foreground">
                Next refresh in {nextRefresh}s
              </span>
            )}
          </div>
        </div>

        <p className="text-muted-foreground mb-6">
          This page provides tools for diagnosing and troubleshooting authentication issues.
        </p>
        <Separator className="my-6" />
        <AuthDebug />

        <div className="mt-8 p-6 terminal-container">
          <h2 className="text-xl font-bold text-unplayed-amber mb-4">Documentation</h2>
          <p className="text-muted-foreground mb-4">
            This debug page helps identify issues with the Steam authentication process.
            It provides visibility into the current authentication state and enables testing
            of direct connections to the authentication endpoints.
          </p>

          <h3 className="text-lg font-semibold text-unplayed-mint mt-6 mb-2">Authentication Flow</h3>
          <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
            <li>User initiates Steam login via <code>signInWithSteam()</code></li>
            <li>The auth system determines the appropriate Steam auth URL</li>
            <li>User is redirected to Steam's OpenID login page</li>
            <li>After successful Steam login, user is sent to the callback URL</li>
            <li>The callback is processed by our Edge Function</li>
            <li>Edge Function creates/updates Supabase user and links to Steam account</li>
            <li>User is redirected back to the app with authentication parameters</li>
            <li>The app processes these parameters and establishes a session</li>
          </ol>

          <h3 className="text-lg font-semibold text-unplayed-mint mt-6 mb-2">Potential Issues</h3>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li><strong>DNS Configuration:</strong> Domain redirects not properly configured</li>
            <li><strong>Edge Function:</strong> Missing environment variables (e.g., service role key)</li>
            <li><strong>Redirect URLs:</strong> Incorrect callback URLs in Steam Developer Portal</li>
            <li><strong>CORS:</strong> Cross-origin request issues blocking API calls</li>
            <li><strong>Session Handling:</strong> Problems with JWT token creation or validation</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuthDebugPage;

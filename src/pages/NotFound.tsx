
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FullScreenLayout } from "@/layouts";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import AuthErrorHandler from "@/components/AuthErrorHandler";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isAuthRelated, setIsAuthRelated] = useState(false);

  useEffect(() => {
    // Log error for monitoring
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "Search params:",
      location.search,
      "State:",
      location.state
    );

    // Check if this 404 is likely auth-related
    const hasAuthParams = location.search.includes('auth_success') || 
                          location.search.includes('error_code') || 
                          location.search.includes('steam_id');
    
    if (hasAuthParams || location.pathname.includes('/auth')) {
      setIsAuthRelated(true);
      
      // If we have error codes but ended up here, redirect to login-error page
      if (location.search.includes('error_code')) {
        navigate(`/login-error${location.search}`);
        return;
      }
      
      // Show toast for auth-related errors
      toast.error("Authentication Error", {
        description: "There was a problem with the authentication process. Please try again.",
      });
    }
  }, [location.pathname, location.search, navigate]);

  return (
    <FullScreenLayout>
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="p-4 rounded-full bg-red-900/30 border border-red-700/30">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">Page Not Found</h1>
          
          {isAuthRelated ? (
            <>
              <p className="text-xl text-gray-300 mb-6">
                We encountered an issue during the authentication process.
              </p>
              <div className="mb-8 p-4 bg-gray-800/50 rounded-md border border-gray-700 text-left text-sm">
                <p className="font-mono text-gray-300 mb-2">Debugging information:</p>
                <p className="font-mono text-gray-400">Path: {location.pathname}</p>
                <p className="font-mono text-gray-400">Query: {location.search || "none"}</p>
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/auth')}
                  className="w-full bg-unplayed-mint text-black hover:bg-unplayed-mint/80"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Authentication Again
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-gray-600"
                >
                  <Home className="mr-2 h-4 w-4" /> Return to Home Page
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xl text-gray-300 mb-6">
                Sorry, the page you're looking for doesn't exist.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-unplayed-mint text-black hover:bg-unplayed-mint/80"
              >
                <Home className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </>
          )}
        </div>
      </div>
    </FullScreenLayout>
  );
};

export default NotFound;

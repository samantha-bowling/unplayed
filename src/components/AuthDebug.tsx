
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { AuthStatus, AuthError, useAuth } from '@/context/AuthContext';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * AuthDebug component for troubleshooting authentication issues
 * This component provides diagnostics and debugging tools for Steam authentication
 */
const AuthDebug = () => {
  const { session, user, status, error, refreshProfile } = useAuth();
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionAge, setSessionAge] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Calculate session age
  useEffect(() => {
    if (session?.expires_at) {
      const updateSessionAge = () => {
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const expiresIn = expiresAt - now;
        
        if (expiresIn <= 0) {
          setSessionAge('Expired');
        } else {
          const minutes = Math.floor(expiresIn / 60);
          const seconds = expiresIn % 60;
          setSessionAge(`${minutes}m ${seconds}s`);
        }
      };
      
      updateSessionAge();
      const interval = setInterval(updateSessionAge, 1000);
      return () => clearInterval(interval);
    } else {
      setSessionAge(null);
    }
  }, [session]);
  
  // Handle profile refresh
  const handleRefreshProfile = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      toast({
        title: "Profile Refreshed",
        description: "Profile data has been successfully refreshed",
      });
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast({
        title: "Refresh Failed",
        description: String(error) || "Failed to refresh profile data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };
  
  // Test the direct Supabase function URL
  const testSteamAuthEndpoint = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        'https://gwmygthanyycveyqqspr.supabase.co/functions/v1/steam-auth/debug',
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      setDebugResults(data);
    } catch (error) {
      setDebugResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test the Netlify redirect
  const testNetlifyRedirect = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/steam/health', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setDebugResults(data);
    } catch (error) {
      setDebugResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get current session data
  const getCurrentSession = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setDebugResults({ error: error.message });
        return;
      }
      
      setDebugResults(data);
    } catch (error) {
      setDebugResults({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format JSON data for display
  const formatJSON = (data: any) => {
    return JSON.stringify(data, null, 2);
  };
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  // Get a readable status description
  const getStatusDescription = (status: AuthStatus) => {
    switch (status) {
      case AuthStatus.LOADING:
        return 'Loading authentication state';
      case AuthStatus.AUTHENTICATED:
        return 'User is authenticated';
      case AuthStatus.UNAUTHENTICATED:
        return 'User is not authenticated';
      default:
        return 'Unknown status';
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle className="text-unplayed-mint">Authentication Diagnostics</CardTitle>
          <CardDescription>
            Tools for troubleshooting authentication issues
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="status">
          <div className="px-6">
            <TabsList className="mb-4">
              <TabsTrigger value="status">Current Status</TabsTrigger>
              <TabsTrigger value="tests">Connection Tests</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="status" className="space-y-4">
            <CardContent className="space-y-4">
              <div 
                className={`p-4 border border-gray-700 rounded-md cursor-pointer ${expandedSection === 'auth-status' ? 'bg-gray-800' : ''}`}
                onClick={() => toggleSection('auth-status')}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium mb-1 text-white">Auth Status</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefreshProfile();
                    }}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh Profile'}
                  </Button>
                </div>
                <div className="flex gap-4 mb-2">
                  <span className="text-gray-400">Status:</span>
                  <span className={
                    status === AuthStatus.AUTHENTICATED 
                      ? 'text-green-500' 
                      : status === AuthStatus.LOADING 
                        ? 'text-blue-500'
                        : 'text-yellow-500'
                  }>
                    {status}
                  </span>
                </div>
                <div className="flex gap-4 mb-2">
                  <span className="text-gray-400">Description:</span>
                  <span className="text-gray-300">
                    {getStatusDescription(status)}
                  </span>
                </div>
                
                {expandedSection === 'auth-status' && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Auth Status Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {formatJSON({ status, description: getStatusDescription(status) })}
                    </pre>
                  </div>
                )}
              </div>
              
              <div 
                className={`p-4 border border-gray-700 rounded-md cursor-pointer ${expandedSection === 'session-data' ? 'bg-gray-800' : ''}`}
                onClick={() => toggleSection('session-data')}
              >
                <h3 className="text-lg font-medium mb-1 text-white">Session Data</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex gap-2">
                    <span className="text-gray-400">Session:</span>
                    <span className={session ? 'text-green-500' : 'text-yellow-500'}>
                      {session ? 'Active' : 'None'}
                    </span>
                  </div>
                  
                  {session && (
                    <>
                      <div className="flex gap-2">
                        <span className="text-gray-400">Expires in:</span>
                        <span className={
                          sessionAge === 'Expired' ? 'text-red-500' : 
                          (sessionAge && parseInt(sessionAge) < 5) ? 'text-amber-500' : 
                          'text-green-500'
                        }>
                          {sessionAge || 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className="text-gray-400">Provider:</span>
                        <span className="text-blue-400">
                          {session?.provider_token ? 'Steam' : 'None'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {expandedSection === 'session-data' && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Session Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {session ? formatJSON({
                        access_token: session.access_token ? '***' : null,
                        refresh_token: session.refresh_token ? '***' : null,
                        expires_at: session.expires_at,
                        provider_token: session.provider_token ? '***' : null,
                        provider_refresh_token: session.provider_refresh_token ? '***' : null,
                      }) : 'No session data'}
                    </pre>
                  </div>
                )}
              </div>
              
              <div 
                className={`p-4 border border-gray-700 rounded-md cursor-pointer ${expandedSection === 'user-data' ? 'bg-gray-800' : ''}`}
                onClick={() => toggleSection('user-data')}
              >
                <h3 className="text-lg font-medium mb-1 text-white">User Data</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <div className="flex gap-2">
                    <span className="text-gray-400">User:</span>
                    <span className={user ? 'text-green-500' : 'text-yellow-500'}>
                      {user ? user.id.substring(0, 8) + '...' : 'Not signed in'}
                    </span>
                  </div>
                  
                  {user && user.user_metadata && (
                    <>
                      <div className="flex gap-2">
                        <span className="text-gray-400">Steam ID:</span>
                        <span className="text-blue-400">
                          {user.user_metadata.steam_id || 'None'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-blue-400">
                          {user.user_metadata.name || 'None'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                
                {expandedSection === 'user-data' && user && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">User Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {formatJSON({
                        id: user.id,
                        email: user.email,
                        created_at: user.created_at,
                        updated_at: user.updated_at,
                        app_metadata: user.app_metadata,
                        user_metadata: user.user_metadata,
                      })}
                    </pre>
                  </div>
                )}
              </div>
              
              <div 
                className={`p-4 border border-gray-700 rounded-md cursor-pointer ${expandedSection === 'error-data' ? 'bg-gray-800' : ''}`}
                onClick={() => toggleSection('error-data')}
              >
                <h3 className="text-lg font-medium mb-1 text-white">Last Error</h3>
                <div className="flex gap-4">
                  <span className="text-gray-400">Error:</span>
                  <span className={error ? 'text-red-500' : 'text-green-500'}>
                    {error ? error.code : 'None'}
                  </span>
                </div>
                
                {error && (
                  <div className="mt-2 bg-red-900/20 border border-red-800/50 rounded px-3 py-2 flex items-start">
                    <AlertCircle className="text-red-400 h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-200">{error.message}</p>
                  </div>
                )}
                
                {expandedSection === 'error-data' && error && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Error Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {formatJSON(error)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="tests" className="space-y-4">
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Test Steam Auth Function</h3>
                  <p className="text-sm text-gray-400">
                    Test the direct connection to the Supabase Steam Auth function
                  </p>
                  <Button 
                    onClick={testSteamAuthEndpoint} 
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? 'Testing...' : 'Test Direct Function URL'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Test Netlify Redirect</h3>
                  <p className="text-sm text-gray-400">
                    Test the Netlify redirect to the Steam Auth function
                  </p>
                  <Button 
                    onClick={testNetlifyRedirect}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? 'Testing...' : 'Test Netlify Redirect'}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Get Current Session</h3>
                  <p className="text-sm text-gray-400">
                    Fetch the current session data from Supabase
                  </p>
                  <Button 
                    onClick={getCurrentSession}
                    disabled={isLoading}
                    variant="outline"
                  >
                    {isLoading ? 'Loading...' : 'Load Session Data'}
                  </Button>
                </div>
                
                {debugResults && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-medium text-white">Test Results</h3>
                    <div className="bg-gray-900 p-4 rounded overflow-auto max-h-96">
                      <pre className="text-xs">
                        {formatJSON(debugResults)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="docs" className="space-y-4">
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Authentication Troubleshooting</h3>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-unplayed-mint">Common Issues</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>DNS settings between domains (IONOS and Netlify)</li>
                    <li>Redirect URLs in Steam Developer settings</li>
                    <li>Service role key not configured properly</li>
                    <li>CORS headers and preflight requests</li>
                    <li>Netlify redirects configuration</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-unplayed-mint">Diagnostics Path</h4>
                  <ol className="list-decimal pl-5 text-sm space-y-1">
                    <li>Verify direct Edge Function access</li>
                    <li>Check Netlify redirect functionality</li>
                    <li>Validate session handling</li>
                    <li>Test external services connectivity</li>
                    <li>Examine error details and logs</li>
                  </ol>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-unplayed-mint">Temporary Solutions</h4>
                  <p className="text-sm text-gray-300">
                    While DNS or other configuration issues are being resolved, the application can:
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Use direct Supabase function URLs instead of domain redirects</li>
                    <li>Provide demo mode functionality for users</li>
                    <li>Implement local session caching mechanisms</li>
                    <li>Create fallback authentication methods</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex justify-between">
          <p className="text-xs text-gray-500">
            This diagnostic tool is for development use only
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthDebug;

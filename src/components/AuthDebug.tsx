
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { AuthStatus, EnhancedAuthStatus, useAuth } from '@/context/AuthContext';

/**
 * AuthDebug component for troubleshooting authentication issues
 * This component provides diagnostics and debugging tools for Steam authentication
 */
const AuthDebug = () => {
  const { session, user, authStatus, enhancedStatus, lastError } = useAuth();
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
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
                <h3 className="text-lg font-medium mb-1 text-white">Auth Status</h3>
                <div className="flex gap-4 mb-2">
                  <span className="text-gray-400">Status:</span>
                  <span className={
                    authStatus === AuthStatus.AUTHENTICATED 
                      ? 'text-green-500' 
                      : authStatus === AuthStatus.LOADING 
                        ? 'text-blue-500'
                        : 'text-yellow-500'
                  }>
                    {authStatus}
                  </span>
                </div>
                <div className="flex gap-4 mb-2">
                  <span className="text-gray-400">Enhanced:</span>
                  <span className={
                    enhancedStatus.includes('ERROR') 
                      ? 'text-red-500' 
                      : enhancedStatus === EnhancedAuthStatus.LIBRARY_READY
                        ? 'text-green-500'
                        : 'text-blue-500'
                  }>
                    {enhancedStatus}
                  </span>
                </div>
                {expandedSection === 'auth-status' && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Auth Status Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {formatJSON({ authStatus, enhancedStatus })}
                    </pre>
                  </div>
                )}
              </div>
              
              <div 
                className={`p-4 border border-gray-700 rounded-md cursor-pointer ${expandedSection === 'session-data' ? 'bg-gray-800' : ''}`}
                onClick={() => toggleSection('session-data')}
              >
                <h3 className="text-lg font-medium mb-1 text-white">Session Data</h3>
                <div className="flex gap-4">
                  <span className="text-gray-400">Session:</span>
                  <span className={session ? 'text-green-500' : 'text-yellow-500'}>
                    {session ? 'Active' : 'None'}
                  </span>
                </div>
                {expandedSection === 'session-data' && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Session Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {session ? formatJSON({
                        access_token: session.access_token ? '***' : null,
                        refresh_token: session.refresh_token ? '***' : null,
                        expires_at: session.expires_at,
                        provider_token: session.provider_token,
                        provider_refresh_token: session.provider_refresh_token,
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
                <div className="flex gap-4">
                  <span className="text-gray-400">User:</span>
                  <span className={user ? 'text-green-500' : 'text-yellow-500'}>
                    {user ? user.id.substring(0, 8) + '...' : 'Not signed in'}
                  </span>
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
                  <span className={lastError ? 'text-red-500' : 'text-green-500'}>
                    {lastError ? lastError.code : 'None'}
                  </span>
                </div>
                {expandedSection === 'error-data' && lastError && (
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">Error Details:</p>
                    <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto max-h-80">
                      {formatJSON(lastError)}
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

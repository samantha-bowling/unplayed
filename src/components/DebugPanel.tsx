
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import useAuthPermission from '@/hooks/use-auth-permission';
import { 
  getAuthDebugInfo, 
  testGamePicksRLS, 
  testUserTableAccess 
} from '@/utils/supabase-debug';

/**
 * Debug panel for troubleshooting authentication and database issues
 * Only visible to authenticated admin users in development or when explicitly enabled
 */
const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user, status } = useAuth();
  const { isAdmin, isLoading: isLoadingPermissions } = useAuthPermission();

  // Only show to authenticated admin users in development or when debug flag is set
  const shouldShowDebugPanel = 
    user && // Must be authenticated
    isAdmin && // Must be admin
    !isLoadingPermissions && // Permissions must be loaded
    (process.env.NODE_ENV === 'development' || 
     localStorage.getItem('enableDebugPanel') === 'true');

  if (!shouldShowDebugPanel) {
    return null;
  }

  const runAuthDebug = async () => {
    console.log('🔍 Running auth debug...');
    const authInfo = await getAuthDebugInfo();
    setDebugInfo(authInfo);
  };

  const runRLSTest = async () => {
    console.log('🔒 Running RLS test...');
    await testGamePicksRLS();
  };

  const runTableAccessTest = async () => {
    console.log('🔍 Running table access test...');
    await testUserTableAccess();
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <Card className="bg-gray-900 border-amber-500">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-800 pb-2">
              <CardTitle className="flex items-center text-sm text-amber-400">
                <Bug className="h-4 w-4 mr-2" />
                Debug Panel (Admin)
                {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="space-y-3 pt-0">
              {/* Current Status */}
              <div className="text-xs space-y-1">
                <div className="text-gray-400">Auth Status: <span className="text-white">{status}</span></div>
                <div className="text-gray-400">User ID: <span className="text-white">{user?.id || 'None'}</span></div>
                <div className="text-gray-400">Admin: <span className="text-white">{isAdmin ? 'Yes' : 'No'}</span></div>
              </div>

              {/* Debug Actions */}
              <div className="space-y-2">
                <Button
                  onClick={runAuthDebug}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  Check Auth State
                </Button>
                
                <Button
                  onClick={runRLSTest}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  disabled={!user}
                >
                  Test Game Picks RLS
                </Button>
                
                <Button
                  onClick={runTableAccessTest}
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  disabled={!user}
                >
                  Test Table Access
                </Button>
              </div>

              {/* Debug Info Display */}
              {debugInfo && (
                <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
                  <div className="text-gray-400 mb-1">Auth Debug Info:</div>
                  <pre className="text-green-400 whitespace-pre-wrap">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}

              {/* Console Hint */}
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                💡 Check browser console for detailed logs
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
};

export default DebugPanel;


import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';

export const DemoModeIndicator: React.FC = () => {
  const { isDemo } = useDemoMode();
  const { user, signInWithSteam } = useAuth();
  
  if (!isDemo) return null;
  
  return (
    <div className="bg-unplayed-amber/20 border border-unplayed-amber/30 rounded-md p-2 mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <span className="text-unplayed-amber mr-2">📊</span>
        <span className="text-sm">
          {!user ? 'Example Data - Connect your Steam account to see your real stats' : 'Preview Mode'}
        </span>
      </div>
      {!user && (
        <button 
          onClick={() => signInWithSteam()} 
          className="text-xs bg-unplayed-mint text-black px-2 py-1 rounded"
        >
          Connect Steam
        </button>
      )}
    </div>
  );
};

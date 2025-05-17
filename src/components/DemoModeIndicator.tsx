
import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import SteamPrivacyChecklist from './SteamPrivacyChecklist';
import SteamLoginButton from './SteamLoginButton';

export const DemoModeIndicator: React.FC = () => {
  const { isDemo, demoData, isDemoExplicit, disableDemo } = useDemoMode();
  const { user, isAuthReady, signInWithProvider } = useAuth();

  // Only show when in demo mode and auth is ready
  if (!isDemo || !isAuthReady) return null;

  return (
    <motion.div
      className="rounded-md p-2 mb-4 flex flex-col"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {!user ? (
        // For non-authenticated users, show demo mode indicator
        <div className="bg-unplayed-amber/20 border border-unplayed-amber/30 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-unplayed-amber mr-2">📊</span>
            <span className="text-sm">
              Example Data ({demoData.unplayedGames} unplayed games) – Sign in to see your real stats
            </span>
          </div>
          <button
            onClick={() => signInWithProvider('discord', { redirectTo: window.location.origin })}
            className="text-xs bg-unplayed-mint text-black px-2 py-1 rounded hover:bg-unplayed-mint/90 transition-colors"
          >
            Sign in to sync
          </button>
        </div>
      ) : (
        // For authenticated users, handle differently based on explicit demo mode
        <>
          {isDemoExplicit ? (
            // User explicitly enabled demo mode
            <div className="bg-unplayed-amber/20 border border-unplayed-amber/30 rounded-md p-3 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-unplayed-amber mr-2">📊</span>
                <span className="text-sm">
                  Preview Mode - You are viewing example data
                </span>
              </div>
              <button
                onClick={disableDemo}
                className="text-xs bg-unplayed-mint text-black px-2 py-1 rounded hover:bg-unplayed-mint/90 transition-colors"
              >
                View my data
              </button>
            </div>
          ) : (
            // User is authenticated but needs to link Steam account
            <div className="bg-unplayed-pink/20 border border-unplayed-pink/30 rounded-md p-3 mb-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-unplayed-pink mr-2">🎮</span>
                  <span className="text-sm font-medium">
                    Link your Steam account to see your game stats
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <SteamPrivacyChecklist />
                </div>
                <div className="flex-shrink-0">
                  <SteamLoginButton showInHeader={false} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default DemoModeIndicator;

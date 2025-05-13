
import React from 'react';
import { useDemoMode } from '@/context/DemoModeContext';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

export const DemoModeIndicator: React.FC = () => {
  const { isDemo, demoData } = useDemoMode();
  const { user, signInWithProvider } = useAuth();

  if (!isDemo) return null;

  return (
    <motion.div
      className="bg-unplayed-amber/20 border border-unplayed-amber/30 rounded-md p-2 mb-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center">
        <span className="text-unplayed-amber mr-2">📊</span>
        <span className="text-sm">
          {!user
            ? `Example Data (${demoData.unplayedGames} unplayed games) – Sign in to see your real stats`
            : 'Preview Mode'}
        </span>
      </div>
      {!user && (
        <button
          onClick={() => signInWithProvider('discord')}
          className="text-xs bg-unplayed-mint text-black px-2 py-1 rounded hover:bg-unplayed-mint/90 transition-colors"
        >
          Sign in to sync
        </button>
      )}
    </motion.div>
  );
};

export default DemoModeIndicator;


import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SteamPrivacyErrorProps {
  onRetry: () => void;
  isLoading: boolean;
}

const SteamPrivacyError: React.FC<SteamPrivacyErrorProps> = ({ onRetry, isLoading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="terminal-box bg-black/50 border border-unplayed-amber/30 rounded-md p-5 w-full max-w-md mx-auto text-sm"
    >
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">😅</span>
        <h3 className="text-lg font-bold text-unplayed-amber">We couldn't access your game library.</h3>
      </div>
      
      <p className="text-gray-300 mb-4">
        Steam hides your games by default, but you can fix this:
      </p>
      
      <ol className="list-decimal list-inside space-y-2 pl-2 text-gray-300 mb-5">
        <li>Go to <a 
          href="https://steamcommunity.com/my/edit/settings" 
          target="_blank"
          rel="noopener noreferrer"
          className="text-unplayed-mint underline hover:text-unplayed-mint/80"
        >
          Steam Privacy Settings
        </a></li>
        <li>Set Game details to <strong>Public</strong></li>
        <li>Uncheck <strong>Always keep my total playtime private</strong></li>
      </ol>
      
      <div className="flex items-center justify-between">
        <Button
          onClick={onRetry}
          disabled={isLoading}
          variant="outline"
          className="border-unplayed-mint/40 text-unplayed-mint hover:bg-unplayed-mint/10"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Checking...' : 'Try Again'}
        </Button>
        
        <span className="text-xs text-gray-400">
          {isLoading ? 'Checking your library access...' : 'After making changes, click Try Again'}
        </span>
      </div>
    </motion.div>
  );
};

export default SteamPrivacyError;

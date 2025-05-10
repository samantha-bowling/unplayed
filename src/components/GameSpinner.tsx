
import React from 'react';
import { Loader2 } from 'lucide-react';

interface GameSpinnerProps {
  quip: string;
  source?: string;
}

const GameSpinner: React.FC<GameSpinnerProps> = ({ quip, source }) => {
  return (
    <div className="h-80 flex flex-col items-center justify-center relative">
      {/* Main spinning animation */}
      <div className="flex items-center mb-6">
        <Loader2 className="text-4xl text-unplayed-amber animate-spin h-12 w-12 mr-4" />
        <p className="text-lg text-gray-300 animate-pulse">{quip}</p>
      </div>
      
      {/* Source indicator if available */}
      {source && (
        <div className="absolute bottom-4 text-sm text-gray-400">
          Picking from: <span className="text-unplayed-mint">{source}</span>
        </div>
      )}
      
      {/* Digital effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-8 top-12 text-sm text-unplayed-mint/30 font-mono">selecting...</div>
        <div className="absolute right-12 bottom-8 text-xs text-unplayed-red/30 font-mono">filtering...</div>
        <div className="absolute right-32 top-24 text-xs text-unplayed-amber/20 font-mono">calculating...</div>
      </div>
    </div>
  );
};

export default GameSpinner;

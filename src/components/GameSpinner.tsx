
import React from 'react';

interface GameSpinnerProps {
  quip: string;
}

const GameSpinner: React.FC<GameSpinnerProps> = ({ quip }) => {
  return (
    <div className="h-80 flex items-center justify-center">
      <div className="text-4xl text-unplayed-amber animate-spin">⚙️</div>
      <p className="ml-4 text-lg text-gray-300 animate-pulse">{quip}</p>
    </div>
  );
};

export default GameSpinner;


import { useState, useEffect } from 'react';

interface UnplayedCounterProps {
  count?: number;
}

const UnplayedCounter = ({ count = 137 }: UnplayedCounterProps) => {
  const [animatedCount, setAnimatedCount] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = count / totalFrames;
    let currentFrame = 0;
    
    const timer = setInterval(() => {
      currentFrame++;
      const value = Math.min(Math.round(increment * currentFrame), count);
      setAnimatedCount(value);
      
      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);
    
    return () => clearInterval(timer);
  }, [count]);
  
  return (
    <div className="terminal-container">
      <h3 className="terminal-header text-2xl mb-2">Unplayed Games</h3>
      
      <div className="flex flex-col items-center py-6">
        <div className="text-5xl md:text-6xl font-bold font-vt gradient-text mb-2">
          {animatedCount}
        </div>
        
        <p className="text-gray-300 text-center text-lg">
          You've got <span className="text-unplayed-amber">{animatedCount}</span> unplayed.exe files
        </p>
        
        <div className="mt-4 text-sm text-gray-400 text-center">
          That's approximately{' '}
          <span className="text-unplayed-pink">
            {Math.round(animatedCount * 12.5)} hours
          </span>{' '}
          of potential gameplay
        </div>
      </div>
    </div>
  );
};

export default UnplayedCounter;

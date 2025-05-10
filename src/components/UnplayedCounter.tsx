
import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import useUnplayedData from '@/hooks/use-unplayed-data';

interface UnplayedCounterProps extends WithDemoProps {
  count?: number;
}

const UnplayedCounter = ({ count, isDemo = false }: UnplayedCounterProps) => {
  const { data: unplayedData } = useUnplayedData();
  // Use the provided count or fall back to unplayed data
  const actualCount = count ?? unplayedData.unplayedGames;
  
  const [animatedCount, setAnimatedCount] = useState(0);
  const { signInWithSteam } = useAuth();
  
  useEffect(() => {
    // Use a more reasonable animation duration for better performance
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = actualCount / totalFrames;
    let currentFrame = 0;
    
    const timer = setInterval(() => {
      currentFrame++;
      const value = Math.min(Math.round(increment * currentFrame), actualCount);
      setAnimatedCount(value);
      
      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);
    
    return () => clearInterval(timer);
  }, [actualCount]);
  
  return (
    <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <h3 className="terminal-header text-2xl mb-2">Unplayed Games</h3>
      
      <div className="terminal-content flex flex-col items-center py-6">
        <div className="text-5xl md:text-6xl font-bold font-vt text-unplayed-mint mb-2">
          {animatedCount}
        </div>
        
        <p className="text-gray-300 text-center text-lg">
          You've got <span className="text-unplayed-amber">{animatedCount}</span> unplayed.wtf files
        </p>
        
        <div className="mt-4 text-sm text-gray-400 text-center">
          That's approximately{' '}
          <span className="text-unplayed-pink">
            {Math.round(animatedCount * 12.5)} hours
          </span>{' '}
          of potential gameplay
        </div>
        
        {isDemo && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-auto pt-4 text-center">
            <button 
              onClick={() => signInWithSteam()} 
              className="text-sm text-unplayed-mint hover:underline"
            >
              Connect Steam to see your actual stats
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(UnplayedCounter);

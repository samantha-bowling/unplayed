
import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';

interface UnplayedCounterProps extends WithDemoProps {
  count?: number;
}

const UnplayedCounter = ({ count = 137, isDemo = false }: UnplayedCounterProps) => {
  const [animatedCount, setAnimatedCount] = useState(0);
  const { signInWithSteam } = useAuth();
  
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
    <div className={`terminal-container ${isDemo ? 'relative' : ''}`}>
      <h3 className="terminal-header text-2xl mb-2">Unplayed Games</h3>
      
      <div className="flex flex-col items-center py-6">
        <div className="text-5xl md:text-6xl font-bold font-vt gradient-text mb-2">
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
          <div className="mt-4 text-center">
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

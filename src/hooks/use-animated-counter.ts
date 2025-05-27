
import { useState, useEffect, useRef } from 'react';

interface UseAnimatedCounterOptions {
  targetValue: number;
  duration?: number;
  isDemo?: boolean;
}

/**
 * Reusable hook for animating numeric counters with demo-aware speeds
 */
export const useAnimatedCounter = ({ 
  targetValue, 
  duration = 2000, 
  isDemo = false 
}: UseAnimatedCounterOptions) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (targetValue === undefined || targetValue === null) return;
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // For demo mode, show final value immediately
    if (isDemo) {
      setAnimatedValue(targetValue);
      return;
    }
    
    // Animate for live data
    const start = 0;
    const end = targetValue;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = (end - start) / totalFrames;
    let currentFrame = 0;
    
    timerRef.current = setInterval(() => {
      currentFrame++;
      const currentValue = Math.round(start + increment * currentFrame);
      setAnimatedValue(currentValue);
      
      if (currentFrame === totalFrames) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }, frameDuration);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [targetValue, duration, isDemo]);

  return animatedValue;
};

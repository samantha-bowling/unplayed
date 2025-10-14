import { motion } from 'framer-motion';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { useMemo, useRef } from 'react';

const BAR_COUNT = 10;

export const AudioVisualizer = () => {
  const { frequencyData, status } = useAudioPlayer();
  const prefersReducedMotion = usePrefersReducedMotion();
  const previousHeights = useRef<number[]>(new Array(BAR_COUNT).fill(0.2));
  
  const isPlaying = status === 'playing';
  
  // Check hardware capability
  const isLowEndDevice = useMemo(() => {
    return navigator.hardwareConcurrency < 4;
  }, []);

  // Process frequency data with logarithmic scaling
  const bars = useMemo(() => {
    if (!isPlaying) {
      // Idle state - gentle pulse
      return new Array(BAR_COUNT).fill(0.2);
    }

    const dataSlice = Array.from(frequencyData.slice(0, BAR_COUNT));
    
    return dataSlice.map((value, index) => {
      // Logarithmic weighting for more musical feel
      const weighted = value * (1 + Math.log2(index + 1) / 4);
      const normalized = weighted / 255;
      
      // Lerp smoothing for decreasing values
      const prev = previousHeights.current[index];
      const smoothed = normalized > prev 
        ? normalized 
        : prev * 0.85 + normalized * 0.15;
      
      previousHeights.current[index] = smoothed;
      
      // Clamp between min and max
      return Math.max(0.15, Math.min(1, smoothed));
    });
  }, [frequencyData, isPlaying]);

  // Fallback for reduced motion or low-end devices
  if (prefersReducedMotion || isLowEndDevice) {
    return (
      <div className="flex items-end gap-1 h-12 w-20" aria-hidden="true">
        {new Array(BAR_COUNT).fill(0).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-unplayed-mint via-unplayed-pink to-unplayed-amber opacity-50"
            style={{ height: '40%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end gap-1 h-12 w-20" aria-hidden="true">
      {bars.map((value, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-unplayed-mint via-unplayed-pink to-unplayed-amber shadow-sm shadow-unplayed-mint/20"
          animate={{
            height: `${value * 100}%`
          }}
          transition={{ 
            duration: 0.1, 
            ease: 'linear' 
          }}
          style={{ 
            minHeight: '8px',
            willChange: 'height'
          }}
        />
      ))}
    </div>
  );
};

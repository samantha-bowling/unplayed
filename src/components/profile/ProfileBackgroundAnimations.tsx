import { useEffect, useState } from 'react';
import { ANIMATION_PACKS, AnimationPackId } from '@/lib/profile-animation-packs';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ProfileBackgroundAnimationsProps {
  packId: AnimationPackId;
  enabled?: boolean;
}

interface IconPosition {
  Icon: LucideIcon;
  left: string;
  top: string;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  specialAnimation?: 'spin' | 'pulse';
}

// Grid-based position generation (reusing zen mode pattern)
const generateAnimationPositions = (pack: typeof ANIMATION_PACKS[AnimationPackId]): IconPosition[] => {
  const positions: IconPosition[] = [];
  const { icons, count, specialAnimation } = pack;
  
  // Create 4x4 grid for better coverage
  const gridSize = 4;
  const cellWidth = 100 / gridSize;
  const cellHeight = 100 / gridSize;
  
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid.push({
        x: j * cellWidth + (cellWidth * 0.5),
        y: i * cellHeight + (cellHeight * 0.5),
      });
    }
  }
  
  // Shuffle grid for randomness
  const shuffledGrid = [...grid].sort(() => Math.random() - 0.5);
  
  // Duplicate icons to reach desired count
  const expandedIcons: LucideIcon[] = [];
  while (expandedIcons.length < count) {
    expandedIcons.push(...icons);
  }
  const randomizedIcons = expandedIcons.slice(0, count).sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    if (i < shuffledGrid.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.4 - cellWidth * 0.2);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.4 - cellHeight * 0.2);
      
      const IconComponent = randomizedIcons[i];
      
      positions.push({
        Icon: IconComponent,
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 0.8 + Math.random() * 2,
        duration: 15 + Math.random() * 10, // 15-25s
        size: 20 + Math.floor(Math.random() * 12), // 20-32px
        opacity: 0.2 + Math.random() * 0.3, // 0.2-0.5
        specialAnimation,
      });
    }
  }
  
  return positions;
};

export function ProfileBackgroundAnimations({ 
  packId, 
  enabled = true 
}: ProfileBackgroundAnimationsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [positions, setPositions] = useState<IconPosition[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if (enabled && !prefersReducedMotion) {
      const pack = ANIMATION_PACKS[packId];
      setPositions(generateAnimationPositions(pack));
      setRefreshKey(Date.now());
    }
  }, [packId, enabled, prefersReducedMotion]);
  
  // Don't render if disabled, 'none' pack, or user prefers reduced motion
  if (!enabled || packId === 'none' || prefersReducedMotion || positions.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {positions.map((pos, index) => {
        const { Icon, left, top, delay, duration, size, opacity, specialAnimation } = pos;
        
        // Determine animation class
        let animationClass = 'zen-float-slow';
        if (specialAnimation === 'spin') {
          animationClass = 'profile-egg-spin-float';
        } else if (specialAnimation === 'pulse') {
          animationClass = 'profile-heart-pulse-float';
        }
        
        return (
          <div
            key={`profile-anim-${refreshKey}-${index}`}
            className="absolute transition-all duration-300"
            style={{
              top,
              left,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
              zIndex: Math.floor(Math.random() * 3),
              opacity: 0,
              animation: `${animationClass} ${duration}s ease-in-out infinite alternate, 
                         zen-fade-in 3s ease-out forwards`,
            }}
          >
            <Icon
              size={size}
              className={cn(
                "text-white/20 transition-opacity duration-300",
                specialAnimation === 'pulse' && "text-unplayed-pink/30"
              )}
              strokeWidth={1.5}
            />
          </div>
        );
      })}
    </div>
  );
}

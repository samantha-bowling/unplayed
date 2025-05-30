
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

// Generate positions for floating game names
const generateGameNamePositions = (gameNames: string[], count: number) => {
  const positions = [];
  const actualCount = Math.min(count, gameNames.length); // Removed hardcoded 10 limit
  const gridSize = Math.ceil(Math.sqrt(actualCount * 1.5)); // Less dense grid
  const cellWidth = 100 / gridSize;
  const cellHeight = 100 / gridSize;

  // Create a grid of possible positions
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid.push({
        x: j * cellWidth + (cellWidth * 0.5),
        y: i * cellHeight + (cellHeight * 0.5),
      });
    }
  }
  
  // Shuffle the grid to get random positions
  const shuffledGrid = [...grid].sort(() => Math.random() - 0.5);
  
  // Shuffle game names for randomness
  const shuffledNames = [...gameNames].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < actualCount; i++) {
    if (i < shuffledGrid.length && i < shuffledNames.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.4 - cellWidth * 0.2);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.4 - cellHeight * 0.2);
      
      positions.push({
        name: shuffledNames[i],
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 0.8 + Math.random() * 4, // Longer, more varied delays
        duration: 10 + Math.random() * 10, // Slower duration between 10-20s
        fontSize: 12 + Math.floor(Math.random() * 6), // Random size between 12-18px
        opacity: 0.6 + Math.random() * 0.3, // Random opacity between 0.6-0.9
      });
    }
  }
  
  return positions;
};

interface FloatingGameNamesProps {
  gameNames: string[];
  count?: number;
}

const FloatingGameNames: React.FC<FloatingGameNamesProps> = ({ gameNames, count = 8 }) => {
  const [positions, setPositions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    if (gameNames.length > 0) {
      // Add timestamp to ensure randomness
      const timestamp = Date.now();
      setPositions(generateGameNamePositions(gameNames, count));
      setRefreshKey(timestamp);
    }
  }, [gameNames, count]);

  return (
    <>
      {positions.map((pos, index) => {
        const { name, left, top, delay, duration, fontSize, opacity } = pos;
        
        return (
          <div
            key={`game-name-${refreshKey}-${index}`}
            className="absolute transition-all duration-300 zen-game-item pointer-events-none select-none"
            style={{
              top,
              left,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
              zIndex: Math.floor(Math.random() * 3) + 1,
              opacity: 0,
              animation: `zen-float-stable-slow ${duration}s ease-in-out infinite alternate, 
                         zen-fade-in 4s ease-out forwards`,
            }}
          >
            <span 
              className={cn(
                "text-unplayed-mint font-medium transition-all duration-300",
                "hover:text-unplayed-mint whitespace-nowrap"
              )}
              style={{ 
                fontSize: `${fontSize}px`,
                textShadow: '0 0 15px rgba(163, 247, 191, 0.8), 0 0 5px rgba(163, 247, 191, 0.6)'
              }}
            >
              {name}
            </span>
          </div>
        );
      })}
    </>
  );
};

export default FloatingGameNames;

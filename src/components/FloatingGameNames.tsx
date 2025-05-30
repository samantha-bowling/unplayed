
import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

// Generate positions for floating game names
const generateGameNamePositions = (gameNames: string[], count: number) => {
  const positions = [];
  const actualCount = Math.min(count, gameNames.length);
  const gridSize = Math.ceil(Math.sqrt(actualCount * 2)); // Less dense than icons
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
  
  // Shuffle game names
  const shuffledNames = [...gameNames].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < actualCount; i++) {
    if (i < shuffledGrid.length && i < shuffledNames.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.6 - cellWidth * 0.3);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.6 - cellHeight * 0.3);
      
      positions.push({
        name: shuffledNames[i],
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 0.4 + Math.random() * 3, // Varied delays
        duration: 6 + Math.random() * 8, // Random duration between 6-14s
        fontSize: 12 + Math.floor(Math.random() * 8), // Random size between 12-20px
        opacity: 0.5 + Math.random() * 0.4, // Random opacity between 0.5-0.9
      });
    }
  }
  
  return positions;
};

interface FloatingGameNamesProps {
  gameNames: string[];
  count: number;
}

const FloatingGameNames: React.FC<FloatingGameNamesProps> = ({ gameNames, count }) => {
  const [positions, setPositions] = useState<any[]>([]);
  
  useEffect(() => {
    if (gameNames.length > 0) {
      setPositions(generateGameNamePositions(gameNames, count));
    }
  }, [gameNames, count]);

  return (
    <>
      {positions.map((pos, index) => {
        const { name, left, top, delay, duration, fontSize, opacity } = pos;
        
        return (
          <div
            key={`game-name-${index}`}
            className="absolute transition-all duration-300 zen-game-item pointer-events-none select-none"
            style={{
              top,
              left,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
              zIndex: Math.floor(Math.random() * 3) + 1,
              opacity: 0,
              animation: `zen-float-stable ${duration}s ease-in-out infinite alternate, 
                         zen-fade-in 3s ease-out forwards`,
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

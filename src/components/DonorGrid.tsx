
import { useEffect, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import FloatingIcons from "./FloatingIcons";

interface DonorGridProps {
  donors: Tables<"donors">[];
}

// Generate more dynamic positions for floating donor names
const generateZenPositions = (count: number) => {
  const positions = [];
  const gridSize = Math.ceil(Math.sqrt(count * 2)); // Create a grid with enough cells
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
  
  // Take the positions we need
  for (let i = 0; i < count; i++) {
    if (i < shuffledGrid.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.5 - cellWidth * 0.25);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.5 - cellHeight * 0.25);
      
      // Create more varied animation patterns
      const animationDirectionX = Math.random() > 0.5 ? 1 : -1;
      const animationDirectionY = Math.random() > 0.5 ? 1 : -1;
      const animationDistance = 2 + Math.random() * 3; // 2-5% movement range
      
      positions.push({
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 0.5, // Stagger the animations
        duration: 3 + Math.random() * 2, // Random duration between 3-5s
        fontSize: `${0.9 + Math.random() * 0.4}rem`, // Random font size between 0.9-1.3rem
        animDirectionX: animationDirectionX,
        animDirectionY: animationDirectionY,
        animDistance: animationDistance,
        initialRotation: Math.random() * 6 - 3, // Slight rotation between -3 and 3 degrees
        hoverColor: Math.random() > 0.5 ? 'text-unplayed-mint hover:text-unplayed-pink' : 'text-unplayed-mint hover:text-unplayed-amber'
      });
    }
  }
  
  return positions;
};

const DonorGrid = ({ donors }: DonorGridProps) => {
  const [positions, setPositions] = useState<any[]>([]);
  
  // Generate positions when donors change
  useEffect(() => {
    setPositions(generateZenPositions(donors.length));
  }, [donors.length]);

  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden border border-gray-800 bg-black/40">
      {/* Add our new FloatingIcons component */}
      <FloatingIcons count={donors.length} />
      
      {donors.map((donor, index) => (
        <div
          key={donor.id}
          className="absolute transition-all duration-300 zen-game-item"
          style={{
            top: positions[index]?.top || '50%',
            left: positions[index]?.left || '50%',
            transform: `translate(-50%, -50%) rotate(${positions[index]?.initialRotation || 0}deg)`,
            animationDelay: `${positions[index]?.delay || index * 0.5}s`,
            zIndex: Math.floor(Math.random() * 10) + 5, // Higher z-index than icons
            opacity: 0,
            animation: `
              zen-float-complex ${positions[index]?.duration || 4}s ease-in-out infinite alternate, 
              zen-fade-in 1.5s ease-out forwards
            `,
            // Define custom animation properties in style
            // These will be picked up by our updated keyframes in index.css
            '--anim-x': `${positions[index]?.animDirectionX * positions[index]?.animDistance || 2}%`,
            '--anim-y': `${positions[index]?.animDirectionY * positions[index]?.animDistance || 2}%`,
          } as React.CSSProperties}
        >
          <p className={`whitespace-nowrap text-glow transition-all duration-300 ${positions[index]?.hoverColor || 'text-unplayed-mint'}`} 
             style={{ fontSize: positions[index]?.fontSize || '1rem' }}>
            {donor.display_name}
          </p>
        </div>
      ))}
      
      <style>
        {`
        @keyframes zen-float-complex {
          0% {
            transform: translate(-50%, -50%) rotate(var(--rotation, 0deg));
          }
          100% {
            transform: translate(calc(-50% + var(--anim-x, 2%)), calc(-50% + var(--anim-y, 2%))) rotate(var(--rotation, 0deg));
          }
        }
        `}
      </style>
    </div>
  );
};

export default DonorGrid;


import { useEffect, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import FloatingIcons from "./FloatingIcons";
import DonorCard from "./DonorCard";

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
      });
    }
  }
  
  return positions;
};

// Sort donors by tier importance
const sortDonorsByTier = (donors: Tables<"donors">[]) => {
  return [...donors].sort((a, b) => {
    // Define tier importance (higher values are more important)
    const tierValue = {
      legendary: 3,
      radiant: 2,
      appreciated: 1,
      null: 0
    };
    
    // Get tier values, defaulting to 0 if undefined
    const tierA = tierValue[a.tier as keyof typeof tierValue] || 0;
    const tierB = tierValue[b.tier as keyof typeof tierValue] || 0;
    
    // First sort by tier
    if (tierA !== tierB) {
      return tierB - tierA; // Higher value tiers first
    }
    
    // Within same tier, sort by amount if available
    if (a.amount_cents && b.amount_cents) {
      return b.amount_cents - a.amount_cents;
    }
    
    // If same tier and amounts not available or equal, sort by creation date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
};

const DonorGrid = ({ donors }: DonorGridProps) => {
  const [positions, setPositions] = useState<any[]>([]);
  const sortedDonors = sortDonorsByTier(donors);
  
  // Generate positions when donors change
  useEffect(() => {
    setPositions(generateZenPositions(donors.length));
  }, [donors.length]);

  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden border border-gray-800 bg-black/40">
      {/* Add our FloatingIcons component */}
      <FloatingIcons count={donors.length} />
      
      {sortedDonors.map((donor, index) => (
        <DonorCard 
          key={donor.id}
          donor={donor}
          position={positions[index] || {
            top: '50%',
            left: '50%',
            delay: index * 0.5,
            duration: 4,
            fontSize: '1rem',
            animDirectionX: 1,
            animDirectionY: 1,
            animDistance: 2,
            initialRotation: 0
          }}
        />
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

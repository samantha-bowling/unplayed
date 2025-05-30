
import { useEffect, useState } from "react";
import {
  Gamepad2, Keyboard, Mouse, Monitor, Cpu, HardDrive, Terminal, Library,
  ListStart, ListEnd, Clock, Hourglass, Zap, BadgeCheck, Stars, Settings,
  SlidersHorizontal, Code, Puzzle, Wrench, Sparkles, Brain, Dice5, Ghost,
  Moon, Sun, Coffee, Headphones, Archive, Cloud, FolderOpen, Download,
  Bird, Egg, Cat, Dog, Fish, Rabbit, Rat, Shell, Snail,
  Squirrel, Turtle, Worm, Bug, HandHelping, HandMetal, Heart, HeartHandshake,
  Laugh, LeafyGreen, PartyPopper, Smile, Star, ThumbsUp, FileCode, FileHeart,
  Cake, Cherry, Cookie, Pizza, Lollipop, Popcorn, Candy, IceCreamCone,
  Popsicle, Castle, Flame, Flower, Gem, Gift, Headset, Joystick, Swords,
  Skull, WandSparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Array of all available Lucide icons components
const ICONS = [
  Gamepad2, Keyboard, Mouse, Monitor, Cpu, HardDrive, Terminal, Library,
  ListStart, ListEnd, Clock, Hourglass, Zap, BadgeCheck, Stars, Settings,
  SlidersHorizontal, Code, Puzzle, Wrench, Sparkles, Brain, Dice5, Ghost,
  Moon, Sun, Coffee, Headphones, Archive, Cloud, FolderOpen, Download,
  Bird, Egg, Cat, Dog, Fish, Rabbit, Rat, Shell, Snail,
  Squirrel, Turtle, Worm, Bug, HandHelping, HandMetal, Heart, HeartHandshake,
  Laugh, LeafyGreen, PartyPopper, Smile, Star, ThumbsUp, FileCode, FileHeart,
  Cake, Cherry, Cookie, Pizza, Lollipop, Popcorn, Candy, IceCreamCone,
  Popsicle, Castle, Flame, Flower, Gem, Gift, Headset, Joystick, Swords,
  Skull, WandSparkles
];

// Generate positions for floating icons
const generateIconPositions = (count: number) => {
  const positions = [];
  const actualCount = Math.min(count, 5); // Maximum 5 icons
  
  // Create a simple grid for positioning
  const gridSize = 3; // 3x3 grid for better spacing
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
  
  // Select random icons for each position - ensure randomness with timestamp
  const randomizedIcons = [...ICONS].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < actualCount; i++) {
    if (i < shuffledGrid.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.4 - cellWidth * 0.2);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.4 - cellHeight * 0.2);
      
      // Select a random icon for this position
      const IconComponent = randomizedIcons[i % randomizedIcons.length];
      
      positions.push({
        Icon: IconComponent,
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 1 + Math.random() * 3, // Longer delays
        duration: 12 + Math.random() * 8, // Slower duration between 12-20s
        size: 18 + Math.floor(Math.random() * 8), // Random size between 18-26px
        opacity: 0.3 + Math.random() * 0.3, // Random opacity between 0.3-0.6
      });
    }
  }
  
  return positions;
};

interface FloatingIconsProps {
  count?: number;
}

const FloatingIcons = ({ count = 5 }: FloatingIconsProps) => {
  const [positions, setPositions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    // Add timestamp to ensure true randomness
    const timestamp = Date.now();
    setPositions(generateIconPositions(Math.min(count, 5)));
    setRefreshKey(timestamp);
  }, [count]);

  return (
    <>
      {positions.map((pos, index) => {
        const { Icon, left, top, delay, duration, size, opacity } = pos;
        
        return (
          <div
            key={`icon-${refreshKey}-${index}`}
            className="absolute transition-all duration-300 zen-icon-item"
            style={{
              top,
              left,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
              zIndex: Math.floor(Math.random() * 5),
              opacity: 0,
              animation: `zen-float-slow ${duration}s ease-in-out infinite alternate, 
                         zen-fade-in 3s ease-out forwards`,
            }}
          >
            <Icon 
              size={size}
              className={cn(
                "text-gray-300 transition-all duration-300",
                "hover:scale-125 hover:text-gray-100"
              )}
              strokeWidth={1.5}
            />
          </div>
        );
      })}
    </>
  );
};

export default FloatingIcons;

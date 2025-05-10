
import { useEffect, useState } from "react";
import {
  Gamepad2, Keyboard, Mouse, Monitor, Cpu, HardDrive, Terminal, Library,
  ListStart, ListEnd, Clock, Hourglass, Zap, BadgeCheck, Stars, Settings,
  SlidersHorizontal, Code, Puzzle, Wrench, Sparkles, Brain, Dice5, Ghost,
  Moon, Sun, Coffee, Headphones, Archive, Cloud, FolderOpen, Download,
  Bird, Egg, Cat, Dog, Fish, Panda, Rabbit, Rat, Shell, Shrimp, Snail,
  Squirrel, Turtle, Worm, Bug, HandHelping, HandMetal, Heart, HeartHandshake,
  Laugh, LeafyGreen, PartyPopper, Smile, Star, ThumbsUp, FileCode, FileHeart,
  Cake, Cherry, Cookie, Grapes, Pizza, Lollipop, Popcorn, Candy, IceCreamCone,
  Popsicle, Castle, Flame, Flower, Gem, Gift, Gpu, Headset, Joystick, Swords,
  Skull, WandSparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Array of all available Lucide icons components
const ICONS = [
  Gamepad2, Keyboard, Mouse, Monitor, Cpu, HardDrive, Terminal, Library,
  ListStart, ListEnd, Clock, Hourglass, Zap, BadgeCheck, Stars, Settings,
  SlidersHorizontal, Code, Puzzle, Wrench, Sparkles, Brain, Dice5, Ghost,
  Moon, Sun, Coffee, Headphones, Archive, Cloud, FolderOpen, Download,
  Bird, Egg, Cat, Dog, Fish, Panda, Rabbit, Rat, Shell, Shrimp, Snail,
  Squirrel, Turtle, Worm, Bug, HandHelping, HandMetal, Heart, HeartHandshake,
  Laugh, LeafyGreen, PartyPopper, Smile, Star, ThumbsUp, FileCode, FileHeart,
  Cake, Cherry, Cookie, Grapes, Pizza, Lollipop, Popcorn, Candy, IceCreamCone,
  Popsicle, Castle, Flame, Flower, Gem, Gift, Gpu, Headset, Joystick, Swords,
  Skull, WandSparkles
];

// Generate positions for floating icons
const generateIconPositions = (count: number) => {
  const positions = [];
  const gridSize = Math.ceil(Math.sqrt(count * 3)); // More sparse grid than donor names
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
  
  // Select random icons for each position
  for (let i = 0; i < count; i++) {
    if (i < shuffledGrid.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.7 - cellWidth * 0.35);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.7 - cellHeight * 0.35);
      
      // Select a random icon for this position
      const IconComponent = ICONS[Math.floor(Math.random() * ICONS.length)];
      
      positions.push({
        Icon: IconComponent,
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 0.3 + Math.random() * 2, // More varied delays
        duration: 4 + Math.random() * 6, // Random duration between 4-10s
        size: 16 + Math.floor(Math.random() * 12), // Random size between 16-28px
        opacity: 0.4 + Math.random() * 0.3, // Random opacity between 0.4-0.7
      });
    }
  }
  
  return positions;
};

interface FloatingIconsProps {
  count: number;
}

const FloatingIcons = ({ count }: FloatingIconsProps) => {
  const [positions, setPositions] = useState<any[]>([]);
  
  useEffect(() => {
    // Use about 30% of donor count for icons, with a minimum of 5 and max of 25
    const iconCount = Math.min(25, Math.max(5, Math.floor(count * 0.3)));
    setPositions(generateIconPositions(iconCount));
  }, [count]);

  return (
    <>
      {positions.map((pos, index) => {
        const { Icon, left, top, delay, duration, size, opacity } = pos;
        
        return (
          <div
            key={`icon-${index}`}
            className="absolute transition-all duration-300 zen-icon-item"
            style={{
              top,
              left,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${delay}s`,
              zIndex: Math.floor(Math.random() * 5),
              opacity: 0,
              animation: `zen-float ${duration}s ease-in-out infinite alternate, 
                         zen-fade-in 2s ease-out forwards`,
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

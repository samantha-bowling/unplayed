
import { useEffect, useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DonorGridProps {
  donors: Tables<"donors">[];
}

// Array of emoji fallbacks for donors without avatars
const emojiOptions = ["🎮", "👾", "🕹️", "🎯", "🎲", "🧩", "🎪", "🏆", "🎨", "🎭", "🎧"];

// Get a consistent emoji for a donor based on their name
const getEmojiForName = (name: string): string => {
  const charSum = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return emojiOptions[charSum % emojiOptions.length];
};

// Get random position for floating effect
const getRandomPosition = () => {
  return {
    left: `${Math.random() * 80 + 10}%`,
    top: `${Math.random() * 80 + 10}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 10 + 15}s`,
  };
};

const DonorCard = ({ donor }: { donor: Tables<"donors"> }) => {
  const [position, setPosition] = useState(getRandomPosition());

  // Regenerate position when donor changes
  useEffect(() => {
    setPosition(getRandomPosition());
  }, [donor.id]);

  return (
    <div
      className="absolute transform transition-transform hover:scale-110"
      style={{
        ...position,
        animation: `float ${position.animationDuration} ease-in-out infinite`,
      }}
    >
      <Card className="bg-gray-800/60 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-4 flex items-center space-x-3">
          <Avatar className="h-10 w-10 bg-unplayed-mint/20">
            <AvatarFallback className="text-lg">
              {getEmojiForName(donor.display_name)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-white">{donor.display_name}</span>
        </CardContent>
      </Card>
    </div>
  );
};

const DonorGrid = ({ donors }: DonorGridProps) => {
  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden border border-gray-800">
      {donors.map((donor) => (
        <DonorCard key={donor.id} donor={donor} />
      ))}
      
      {/* Add floating animations */}
      <style>
        {`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-15px) rotate(2deg);
          }
          50% {
            transform: translateY(5px) rotate(-1deg);
          }
          75% {
            transform: translateY(-8px) rotate(1deg);
          }
        }
      `}
      </style>
    </div>
  );
};

export default DonorGrid;

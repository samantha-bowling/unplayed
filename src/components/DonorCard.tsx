
import { Tables } from "@/integrations/supabase/types";
import { Crown, Sparkles } from "lucide-react";
import { useState, useRef, useMemo, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DonorCardProps {
  donor: Tables<"donors">;
  position: {
    top: string;
    left: string;
    delay: number;
    duration: number;
    fontSize: string;
    animDirectionX: number;
    animDirectionY: number;
    animDistance: number;
    initialRotation: number;
  };
}

const DonorCard = ({ donor, position }: DonorCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCustomMessage = !!donor.thank_you_message && !donor.hidden;

  // Define tier-specific styles and properties
  const tierConfig = useMemo(() => {
    switch (donor.tier) {
      case "legendary":
        return {
          className: "text-unplayed-amber",
          hoverClassName: "hover:text-unplayed-amber",
          zIndex: 30,
          icon: <Crown className="h-4 w-4 inline-block mr-1 text-unplayed-amber" />,
          tooltip: "Legendary Supporter",
          glowColor: "rgba(255, 216, 102, 0.7)",
          sizeMultiplier: 1.25,
        };
      case "radiant":
        return {
          className: "text-unplayed-mint",
          hoverClassName: "hover:text-unplayed-mint",
          zIndex: 20,
          icon: <Sparkles className="h-4 w-4 inline-block mr-1 text-unplayed-mint" />,
          tooltip: "Radiant Supporter",
          glowColor: "rgba(163, 247, 191, 0.6)",
          sizeMultiplier: 1.1,
        };
      default:
        return {
          className: "text-gray-300",
          hoverClassName: "hover:text-unplayed-pink",
          zIndex: 10,
          icon: null,
          tooltip: "Thank You!",
          glowColor: "rgba(255, 255, 255, 0.4)",
          sizeMultiplier: 1,
        };
    }
  }, [donor.tier]);

  // Calculate font size based on tier
  const fontSize = useMemo(() => {
    const baseSize = parseFloat(position.fontSize);
    return `${baseSize * tierConfig.sizeMultiplier}rem`;
  }, [position.fontSize, tierConfig.sizeMultiplier]);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className="absolute transition-all duration-300 zen-game-item"
            style={{
              top: position.top,
              left: position.left,
              transform: `translate(-50%, -50%) rotate(${position.initialRotation}deg)`,
              animationDelay: `${position.delay}s`,
              zIndex: tierConfig.zIndex,
              opacity: 0,
              animation: `
                zen-float-complex ${position.duration}s ease-in-out infinite alternate, 
                zen-fade-in 1.5s ease-out forwards
              `,
              '--anim-x': `${position.animDirectionX * position.animDistance}%`,
              '--anim-y': `${position.animDirectionY * position.animDistance}%`,
              textShadow: `0 0 8px ${tierConfig.glowColor}`,
            } as React.CSSProperties}
            onClick={() => hasCustomMessage && setIsExpanded(!isExpanded)}
            role={hasCustomMessage ? "button" : "presentation"}
            aria-expanded={hasCustomMessage ? isExpanded : undefined}
          >
            <p 
              className={`whitespace-nowrap transition-all duration-300 ${tierConfig.className} ${tierConfig.hoverClassName}`}
              style={{ fontSize: fontSize }}
            >
              {tierConfig.icon}
              {donor.display_name}
            </p>
            
            {isExpanded && hasCustomMessage && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 p-3 bg-gray-900/90 border border-gray-700 rounded-md z-50 min-w-[200px] max-w-[300px]">
                <p className="text-sm text-gray-200 italic">"{donor.thank_you_message}"</p>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-bold">{tierConfig.tooltip}</p>
            {hasCustomMessage && <p className="text-xs text-gray-300">(Click to see message)</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DonorCard;

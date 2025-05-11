
import React from 'react';

interface DiscordIconProps {
  className?: string;
  size?: number;
}

const DiscordIcon = ({ className, size = 24 }: DiscordIconProps) => {
  return (
    <img 
      src="/lovable-uploads/5598c2eb-4446-4866-9c2d-af87bf484780.png" 
      alt="Discord" 
      className={className}
      width={size}
      height={size}
      style={{ filter: 'invert(1)' }} // Makes the icon white to match other icons
    />
  );
};

export default DiscordIcon;

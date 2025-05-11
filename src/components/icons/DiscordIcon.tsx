
import React from 'react';

interface DiscordIconProps {
  className?: string;
  size?: number;
}

const DiscordIcon = ({ className, size = 24 }: DiscordIconProps) => {
  return (
    <img 
      src="/lovable-uploads/076b7bca-7641-4c84-b460-b4e98fd09452.png" 
      alt="Discord" 
      className={className}
      width={size}
      height={size}
      // Removed the invert filter since the new icon is already light colored
    />
  );
};

export default DiscordIcon;


import React from 'react';
import { motion } from 'framer-motion';

interface SteamLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary'; 
}

export const SteamLoader = ({ 
  message = "Loading...", 
  size = 'md', 
  variant = 'primary' 
}: SteamLoaderProps) => {
  // Size mappings
  const sizeMap = {
    sm: {
      wrapper: 'h-8 w-8',
      circle: 'h-6 w-6',
      stroke: 2,
      text: 'text-xs mt-1'
    },
    md: {
      wrapper: 'h-12 w-12',
      circle: 'h-8 w-8',
      stroke: 2.5,
      text: 'text-sm mt-2'
    },
    lg: {
      wrapper: 'h-16 w-16',
      circle: 'h-12 w-12',
      stroke: 3,
      text: 'text-base mt-3'
    }
  };

  // Color variants
  const colorMap = {
    primary: {
      outer: 'stroke-unplayed-mint',
      inner: 'stroke-unplayed-pink/70',
      text: 'text-unplayed-mint'
    },
    secondary: {
      outer: 'stroke-unplayed-amber',
      inner: 'stroke-unplayed-mint/70',
      text: 'text-unplayed-amber'
    }
  };

  const currentSize = sizeMap[size];
  const currentColor = colorMap[variant];

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative ${currentSize.wrapper}`}>
        {/* Steam particle animation */}
        <motion.div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
          initial={{ opacity: 0, y: 0 }}
          animate={{ 
            opacity: [0, 0.7, 0],
            y: [0, -20],
            scale: [0.7, 1.5, 0.2],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatDelay: 0.5
          }}
        >
          <div className={`h-2 w-2 rounded-full ${variant === 'primary' ? 'bg-unplayed-mint/40' : 'bg-unplayed-amber/40'}`}></div>
        </motion.div>

        {/* Outer spinning circle */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 50 50">
            <circle
              className={`${currentColor.outer} fill-none`}
              cx="25"
              cy="25"
              r="20"
              strokeWidth={currentSize.stroke}
              strokeDasharray="40 140"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Inner spinning circle (opposite direction) */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <svg className="w-full h-full" viewBox="0 0 50 50">
            <circle
              className={`${currentColor.inner} fill-none`}
              cx="25"
              cy="25"
              r="15"
              strokeWidth={currentSize.stroke - 0.5}
              strokeDasharray="30 80"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>

        {/* Center pulsing dot */}
        <motion.div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full ${variant === 'primary' ? 'bg-unplayed-mint' : 'bg-unplayed-amber'}`}
          initial={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: [0.6, 1.1, 0.6], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: `${currentSize.stroke * 2}px`, height: `${currentSize.stroke * 2}px` }}
        />
      </div>
      
      {/* Loading message with typing animation */}
      {message && (
        <motion.div 
          className={`${currentSize.text} ${currentColor.text} font-mono`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.span
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ 
              duration: 1.5, 
              ease: "easeInOut", 
              repeat: Infinity, 
              repeatType: "reverse"
            }}
            className="inline-block overflow-hidden whitespace-nowrap"
          >
            {message}
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

export default SteamLoader;


import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface AuthSuccessAnimationProps {
  username?: string;
  onComplete?: () => void;
}

const AuthSuccessAnimation = ({ username, onComplete }: AuthSuccessAnimationProps) => {
  // Run the onComplete callback after the animation finishes
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="flex flex-col items-center text-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Success checkmark with circle animation */}
        <motion.div
          className="relative h-20 w-20 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <svg className="w-full h-full" viewBox="0 0 50 50">
              <motion.circle
                cx="25"
                cy="25"
                r="20"
                fill="none" 
                strokeWidth="2"
                stroke="#a3f7bf"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              />
            </svg>
          </motion.div>
          
          {/* Check icon */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center text-unplayed-mint"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="h-12 w-12" />
          </motion.div>
        </motion.div>
        
        {/* Success message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <motion.h2 className="text-2xl font-space font-bold text-unplayed-mint mb-1">
            Authentication Successful
          </motion.h2>
          
          {username && (
            <motion.p 
              className="text-gray-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Welcome back, <span className="font-medium text-white">{username}</span>!
            </motion.p>
          )}
        </motion.div>
        
        {/* Loading dots */}
        <motion.div 
          className="mt-4 flex space-x-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7 }}
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-unplayed-mint"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2 }}
          />
          <motion.div
            className="h-2 w-2 rounded-full bg-unplayed-mint"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2, delay: 0.2 }}
          />
          <motion.div
            className="h-2 w-2 rounded-full bg-unplayed-mint"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2, delay: 0.4 }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AuthSuccessAnimation;

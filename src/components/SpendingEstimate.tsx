
import { useState, useEffect } from 'react';

interface SpendingEstimateProps {
  amount?: number;
}

const SpendingEstimate = ({ amount = 1298.75 }: SpendingEstimateProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  
  useEffect(() => {
    if (isVisible) {
      const duration = 2000;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const increment = amount / totalFrames;
      let currentFrame = 0;
      
      const timer = setInterval(() => {
        currentFrame++;
        const value = Math.min(increment * currentFrame, amount);
        setAnimatedAmount(value);
        
        if (currentFrame === totalFrames) {
          clearInterval(timer);
        }
      }, frameDuration);
      
      return () => clearInterval(timer);
    }
  }, [isVisible, amount]);

  return (
    <div className="terminal-container">
      <h3 className="terminal-header text-2xl mb-4">Spending Estimate</h3>
      
      {isVisible ? (
        <div className="animate-fade-in">
          <div className="flex flex-col items-center py-4">
            <div className="text-4xl md:text-5xl font-bold text-unplayed-red mb-2">
              ${animatedAmount.toFixed(2)}
            </div>
            
            <p className="text-gray-300 text-center">
              Spent on unplayed games
            </p>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="mt-6 btn-secondary"
            >
              Hide Financial Damage
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-400 text-center">
            Based on historical Steam prices and sales data
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-300 mb-4">
            Do you really want to see how much money you've spent on games you've never played?
          </p>
          
          <button 
            onClick={() => setIsVisible(true)}
            className="btn-primary mr-2"
          >
            Show Me The Damage
          </button>
        </div>
      )}
    </div>
  );
};

export default SpendingEstimate;

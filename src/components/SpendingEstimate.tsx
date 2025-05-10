
import { useState, useEffect } from 'react';
import useUnplayedData from '@/hooks/use-unplayed-data';

interface SpendingEstimateProps {
  amount?: number;
}

const SpendingEstimate = ({ amount }: SpendingEstimateProps) => {
  const { data: unplayedData } = useUnplayedData();
  const [isVisible, setIsVisible] = useState(false);
  const [animatedAmount, setAnimatedAmount] = useState(0);
  
  // Use amount from props if provided, otherwise use unplayedData
  const spendingAmount = amount !== undefined ? amount : unplayedData.totalSpent;
  
  useEffect(() => {
    if (isVisible) {
      const duration = 2000;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const increment = spendingAmount / totalFrames;
      let currentFrame = 0;
      
      const timer = setInterval(() => {
        currentFrame++;
        const value = Math.min(increment * currentFrame, spendingAmount);
        setAnimatedAmount(value);
        
        if (currentFrame === totalFrames) {
          clearInterval(timer);
        }
      }, frameDuration);
      
      return () => clearInterval(timer);
    }
  }, [isVisible, spendingAmount]);

  return (
    <div className="terminal-container equal-height-container">
      <h3 className="terminal-header text-2xl mb-4">Spending Estimate</h3>
      
      <div className="terminal-content">
        {isVisible ? (
          <div className="animate-fade-in flex flex-col h-full">
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
            
            <div className="mt-auto text-sm text-gray-400 text-center pb-2">
              Based on historical Steam prices and sales data
            </div>
          </div>
        ) : (
          <div className="text-center py-8 flex flex-col h-full">
            <p className="text-gray-300 mb-4">
              Do you really want to see how much money you've spent on games you've never played?
            </p>
            
            <button 
              onClick={() => setIsVisible(true)}
              className="btn-primary mr-2 mx-auto"
            >
              Show Me The Damage
            </button>
            
            <div className="mt-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingEstimate;

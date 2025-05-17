
import { useState, useEffect, useRef } from 'react';
import CurrencyAmount from '@/components/ui/currency-amount';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SpendingMeterProps {
  amount: number;
  currency?: string;
  isLoading: boolean;
  showDetailsLink?: boolean;
  onHideClick: () => void;
  totalSaved?: number | null;
  isDemo: boolean;
  hasUser: boolean;
}

const SpendingMeter = ({
  amount,
  currency = 'USD',
  isLoading,
  showDetailsLink = true,
  onHideClick,
  totalSaved,
  isDemo,
  hasUser
}: SpendingMeterProps) => {
  const [animatedAmount, setAnimatedAmount] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const [animationReady, setAnimationReady] = useState(false);

  // Delay animation start to ensure stable rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setAnimationReady(true);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Set up mounted ref for cleanup
    isMountedRef.current = true;
    
    // Cancel any in-flight animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Reset animation state when amount changes
    setAnimatedAmount(0);
    startTimeRef.current = null;
    
    // Don't start animation if we're still loading or animation isn't ready
    if (isLoading || !animationReady) return;
    
    // Use a small delay to ensure we're not animating during the render cycle
    const timeoutId = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      const duration = 2000; // Animation duration in ms
      
      const animate = (timestamp: number) => {
        if (!isMountedRef.current) return;
        
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Calculate the current value based on progress
        const currentValue = progress * amount;
        setAnimatedAmount(currentValue);
        
        // Continue animation if not complete
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };
      
      // Start the animation using requestAnimationFrame for smoother performance
      animationRef.current = requestAnimationFrame(animate);
    }, 50);
    
    // Clean up animation on unmount or data change
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [amount, isLoading, animationReady]);

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="flex flex-col items-center py-4">
        <div className="text-4xl md:text-5xl font-bold text-unplayed-red mb-2">
          {isLoading ? (
            <span className="opacity-50">Calculating...</span>
          ) : (
            <CurrencyAmount amount={animatedAmount} currency={currency} />
          )}
        </div>
        
        <p className="text-gray-300 text-center mb-2">
          Spent on unplayed games
        </p>

        {!isLoading && totalSaved && totalSaved > 0 && (
          <p className="text-unplayed-mint text-sm">
            You saved <CurrencyAmount amount={totalSaved} /> from sales!
          </p>
        )}
        
        {showDetailsLink && hasUser && !isDemo && (
          <Link 
            to="/spend" 
            className="mt-4 inline-flex items-center text-unplayed-mint hover:underline text-sm"
          >
            See detailed breakdown <ExternalLink size={14} className="ml-1" />
          </Link>
        )}
        
        <button 
          onClick={onHideClick}
          className="mt-6 btn-secondary"
          disabled={isLoading}
        >
          Hide Financial Damage
        </button>
      </div>
      
      <div className="mt-auto text-sm text-gray-400 text-center pb-2">
        Based on{isDemo ? ' estimated' : ' current'} Steam store prices
      </div>
    </div>
  );
};

export default SpendingMeter;

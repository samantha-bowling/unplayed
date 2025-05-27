
import { useState, useEffect, useMemo } from 'react';

interface UseProgressiveLoadingProps {
  totalItems: number;
  isLoading: boolean;
  batchSize?: number;
  isDemo?: boolean;
}

export const useProgressiveLoading = ({
  totalItems,
  isLoading,
  batchSize = 8,
  isDemo = false
}: UseProgressiveLoadingProps) => {
  const [visibleItems, setVisibleItems] = useState<number>(0);
  
  // Demo mode shows all items immediately, live mode loads progressively
  const shouldUseProgressive = !isDemo && totalItems > batchSize;
  
  // Reset visible items when items array changes
  useEffect(() => {
    if (!isLoading && totalItems > 0) {
      if (shouldUseProgressive) {
        // Progressive loading for live data
        const timer = setTimeout(() => {
          setVisibleItems(Math.min(batchSize, totalItems));
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // Immediate loading for demo mode or small libraries
        setVisibleItems(totalItems);
      }
    }
    return undefined;
  }, [totalItems, isLoading, batchSize, shouldUseProgressive]);
  
  // Add more items as user scrolls (only for progressive mode)
  useEffect(() => {
    if (!shouldUseProgressive || visibleItems >= totalItems) return;
    
    const handleScroll = () => {
      const scrolledToBottom = 
        window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 500;
      
      if (scrolledToBottom) {
        setVisibleItems(prev => Math.min(prev + batchSize, totalItems));
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleItems, totalItems, batchSize, shouldUseProgressive]);

  const loadMore = () => {
    setVisibleItems(prev => Math.min(prev + batchSize, totalItems));
  };

  return {
    visibleItems,
    hasMore: visibleItems < totalItems,
    loadMore,
    isProgressive: shouldUseProgressive
  };
};

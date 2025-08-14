import { useEffect, useRef, useCallback, useState } from 'react';

// WeakMap for caching to allow garbage collection
const imageCache = new WeakMap();
const componentCache = new WeakMap();

/**
 * Hook for optimizing memory usage in components
 */
export const useMemoryOptimizer = (componentName: string) => {
  const mountTimeRef = useRef<number>(Date.now());
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // Register cleanup function
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);

  // Create stable references for frequently changing props
  const createStableRef = useCallback(<T,>(value: T, key: string): T => {
    const cache = componentCache.get(createStableRef) || new Map();
    
    if (!cache.has(key) || cache.get(key) !== value) {
      cache.set(key, value);
    }
    
    componentCache.set(createStableRef, cache);
    return cache.get(key);
  }, []);

  // Image caching utility
  const getCachedImage = useCallback((src: string): Promise<HTMLImageElement> => {
    if (imageCache.has(getCachedImage)) {
      const cache = imageCache.get(getCachedImage);
      if (cache.has(src)) {
        return Promise.resolve(cache.get(src));
      }
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cache = imageCache.get(getCachedImage) || new Map();
        cache.set(src, img);
        imageCache.set(getCachedImage, cache);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Run all registered cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn(`Cleanup error in ${componentName}:`, error);
        }
      });

      // Clear refs to prevent memory leaks
      cleanupFunctionsRef.current = [];
      
      // Log component lifetime for debugging
      const lifetime = Date.now() - mountTimeRef.current;
      if (lifetime > 10000) { // Log if component lived more than 10 seconds
        console.debug(`${componentName} unmounted after ${lifetime}ms`);
      }
    };
  }, [componentName]);

  return {
    registerCleanup,
    createStableRef,
    getCachedImage,
    componentLifetime: () => Date.now() - mountTimeRef.current
  };
};

/**
 * Hook for debouncing state updates to reduce re-renders
 */
export const useDebounceState = <T,>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] => {
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [debouncedValue, setValue, immediateValue];
};

export default useMemoryOptimizer;
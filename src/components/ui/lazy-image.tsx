import React, { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  blur?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage = memo(({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.svg',
  blur = true,
  onLoad,
  onError
}: LazyImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            blur && !isLoaded && "blur-sm scale-105",
            isLoaded && "blur-0 scale-100"
          )}
        />
      )}
      
      {!isInView && (
        <div className="w-full h-full bg-muted/10 animate-pulse" />
      )}
      
      {isInView && !isLoaded && (
        <div className="absolute inset-0 bg-muted/10 animate-pulse" />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
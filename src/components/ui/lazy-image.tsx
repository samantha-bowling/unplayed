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
  sizes?: string;
  priority?: boolean;
  format?: 'auto' | 'webp' | 'avif' | 'original';
}

const LazyImage = memo(({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.svg',
  blur = true,
  onLoad,
  onError,
  sizes,
  priority = false,
  format = 'auto'
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

  const getOptimizedSrc = (originalSrc: string) => {
    if (format === 'original' || !originalSrc.includes('steampowered.com')) {
      return originalSrc;
    }
    
    // Check for WebP/AVIF support and modify Steam URLs accordingly
    const supportsWebP = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
    const supportsAVIF = document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
    
    if (format === 'auto') {
      if (supportsAVIF) {
        // Steam doesn't serve AVIF, but we can indicate preference
        return originalSrc;
      }
      if (supportsWebP) {
        // Steam doesn't serve WebP, but we keep original for compatibility
        return originalSrc;
      }
    }
    
    return originalSrc;
  };

  const imageSrc = hasError ? fallbackSrc : getOptimizedSrc(src);

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      {(isInView || priority) && (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            blur && !isLoaded && "blur-sm scale-105",
            isLoaded && "blur-0 scale-100"
          )}
        />
      )}
      
      {!isInView && !priority && (
        <div className="w-full h-full bg-muted/10 animate-pulse" />
      )}
      
      {(isInView || priority) && !isLoaded && (
        <div className="absolute inset-0 bg-muted/10 animate-pulse" />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
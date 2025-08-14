import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface PerformanceEntry extends globalThis.PerformanceEntry {
  value?: number;
  startTime: number;
  processingStart?: number;
  renderTime?: number;
  loadTime?: number;
}

export const usePerformanceMonitor = () => {
  const reportMetric = useCallback((metric: PerformanceMetrics) => {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }
    
    // In production, send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      Object.entries(metric).forEach(([name, value]) => {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: name,
          metric_value: Math.round(value),
          transport_type: 'beacon'
        });
      });
    }
  }, []);

  useEffect(() => {
    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceEntry[];
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            reportMetric({ lcp: lastEntry.startTime });
          }
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        return observer;
      } catch (e) {
        return null;
      }
    };

    // First Input Delay (FID)
    const observeFID = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceEntry[];
          entries.forEach((entry) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime;
              reportMetric({ fid });
            }
          });
        });
        observer.observe({ entryTypes: ['first-input'] });
        return observer;
      } catch (e) {
        return null;
      }
    };

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceEntry[];
          entries.forEach((entry) => {
            if (entry.value !== undefined && !(entry as any).hadRecentInput) {
              clsValue += entry.value;
            }
          });
          reportMetric({ cls: clsValue });
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        return observer;
      } catch (e) {
        return null;
      }
    };

    // First Contentful Paint (FCP)
    const observeFCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceEntry[];
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              reportMetric({ fcp: entry.startTime });
            }
          });
        });
        observer.observe({ entryTypes: ['paint'] });
        return observer;
      } catch (e) {
        return null;
      }
    };

    // Time to First Byte (TTFB)
    const measureTTFB = () => {
      try {
        const navigation = performance.getEntriesByType('navigation')[0] as any;
        if (navigation && navigation.responseStart && navigation.requestStart) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          reportMetric({ ttfb });
        }
      } catch (e) {
        // Ignore errors
      }
    };

    const observers = [
      observeLCP(),
      observeFID(),
      observeCLS(),
      observeFCP()
    ].filter(Boolean);

    measureTTFB();

    return () => {
      observers.forEach(observer => observer?.disconnect());
    };
  }, [reportMetric]);

  const trackCustomMetric = useCallback((name: string, value: number, unit = 'ms') => {
    reportMetric({ [name]: value });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Custom metric: ${name} = ${value}${unit}`);
    }
  }, [reportMetric]);

  return {
    trackCustomMetric
  };
};
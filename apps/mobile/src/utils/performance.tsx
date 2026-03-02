import React, { useEffect, useRef, useState } from 'react';
import { analyticsService } from './analytics';

// Extend Performance interface for non-standard memory API
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

// Performance Monitoring Hook
export const usePerformanceMonitor = (componentName: string) => {
  const startTime = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current;

        // Track Performance nur wenn es signifikant ist (> 16ms für 60fps)
        if (renderTime > 16) {
          analyticsService.trackPerformance('component_render_time', renderTime, {
            component_name: componentName,
            render_time_ms: Math.round(renderTime)
          });
        }
      }
    };
  }, [componentName]);

  const markLoadingComplete = () => {
    setIsLoading(false);
    if (startTime.current) {
      const loadTime = performance.now() - startTime.current;
      analyticsService.trackPerformance('component_load_time', loadTime, {
        component_name: componentName,
        load_time_ms: Math.round(loadTime)
      });
    }
  };

  return { isLoading, markLoadingComplete };
};

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
  usage: number;
}

// Memory Usage Monitor
export const useMemoryMonitor = () => {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    const checkMemory = () => {
      const perf = performance as ExtendedPerformance;
      if (typeof perf !== 'undefined' && perf.memory) {
        const memory = perf.memory;
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        });

        // Warnung bei hohem Memory-Verbrauch
        if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
          analyticsService.trackPerformance('high_memory_usage', memory.usedJSHeapSize, {
            usage_percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
          });
        }
      }
    };

    // Prüfe Memory alle 30 Sekunden
    const interval = setInterval(checkMemory, 30000);
    checkMemory(); // Sofortige Prüfung

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

interface NetworkInfo {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink?: number;
  rtt?: number;
}

// Network Performance Monitor
export const useNetworkMonitor = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: true,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      if (typeof navigator !== 'undefined' && (navigator as any).connection) {
        const connection = (navigator as any).connection;
        setNetworkInfo({
          isOnline: navigator.onLine,
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        });
      }
    };

    // Event Listener für Netzwerk-Änderungen
    if (typeof window !== 'undefined') {
      window.addEventListener('online', updateNetworkInfo);
      window.addEventListener('offline', updateNetworkInfo);

      if ((navigator as any).connection) {
        (navigator as any).connection.addEventListener('change', updateNetworkInfo);
      }
    }

    updateNetworkInfo(); // Initiale Prüfung

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', updateNetworkInfo);
        window.removeEventListener('offline', updateNetworkInfo);

        if ((navigator as any).connection) {
          (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
        }
      }
    };
  }, []);

  return networkInfo;
};

// App Performance Monitor (Hauptkomponente)
export const AppPerformanceMonitor = ({ children }: { children: React.ReactNode }) => {
  const memoryInfo = useMemoryMonitor();
  const networkInfo = useNetworkMonitor();

  useEffect(() => {
    // Track App-Start Performance
    const appStartTime = performance.now();

    analyticsService.trackPerformance('app_start_time', appStartTime, {
      memory_used: memoryInfo?.used || 0,
      network_type: networkInfo.connectionType
    });

    // Track Memory Usage regelmäßig
    const memoryInterval = setInterval(() => {
      if (memoryInfo) {
        analyticsService.trackPerformance('memory_usage', memoryInfo.used, {
          usage_percentage: memoryInfo.usage,
          total_memory: memoryInfo.total
        });
      }
    }, 60000); // Alle 60 Sekunden

    return () => {
      clearInterval(memoryInterval);
    };
  }, [memoryInfo, networkInfo]);

  // Warnung bei Performance-Problemen
  useEffect(() => {
    if (memoryInfo && memoryInfo.usage > 90) {
      console.warn('High memory usage detected:', memoryInfo.usage + '%');
    }

    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      analyticsService.trackPerformance('slow_network_detected', 0, {
        effective_type: networkInfo.effectiveType,
        connection_type: networkInfo.connectionType
      });
    }
  }, [memoryInfo, networkInfo]);

  return <>{ children } </>;
};

// Utility-Funktionen für Performance-Optimierung
export const performanceUtils = {
  // Debounce-Funktion für häufige Events
  debounce: (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle-Funktion für häufige Events
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return function executedFunction(this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Lazy Loading Helper
  lazyLoad: (importFunction: () => Promise<{ default: React.ComponentType<any> }>) => {
    return React.lazy(importFunction);
  },

  // Image Optimization Helper
  optimizeImage: (uri: string, width: number, height: number, quality = 80) => {
    // Hier würde man eine Bildoptimierung implementieren
    return {
      uri,
      width,
      height,
      quality
    };
  }
};

export default AppPerformanceMonitor;

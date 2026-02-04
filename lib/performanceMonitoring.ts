/**
 * Performance Monitoring Configuration
 * 
 * Configures performance monitoring with Vercel Analytics and custom logging.
 * Requirements: 19.1, 19.2
 */

// Performance metrics interface
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  // Page load metrics (Core Web Vitals)
  FCP: 1500, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift (score)
  TTFB: 600, // Time to First Byte (ms)
  
  // API response times (p95)
  API_RESPONSE: 500, // ms
  
  // Database query times (p95)
  DB_QUERY: 100, // ms
  
  // Bundle sizes
  INITIAL_BUNDLE: 200 * 1024, // 200KB
  TOTAL_PAGE_WEIGHT: 1024 * 1024, // 1MB
} as const;

// Performance monitoring class
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && process.env.NODE_ENV === 'production';
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).va) {
      (window as any).va('track', name, { value, ...metadata });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value}ms`, metadata);
    }

    // Check against thresholds
    this.checkThreshold(name, value);
  }

  /**
   * Check if metric exceeds threshold
   */
  private checkThreshold(name: string, value: number): void {
    const thresholdKey = name.toUpperCase().replace(/[^A-Z_]/g, '_') as keyof typeof PERFORMANCE_THRESHOLDS;
    const threshold = PERFORMANCE_THRESHOLDS[thresholdKey];

    if (threshold && value > threshold) {
      console.warn(`[Performance] ${name} exceeded threshold: ${value} > ${threshold}`);
      
      // Send alert if configured
      this.sendAlert(name, value, threshold);
    }
  }

  /**
   * Send performance alert
   */
  private sendAlert(name: string, value: number, threshold: number): void {
    // In production, this would send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry or other monitoring service
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureMessage(`Performance threshold exceeded: ${name}`, {
          level: 'warning',
          extra: { value, threshold },
        });
      }
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get metrics summary
   */
  getSummary(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};

    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
        };
      }

      const s = summary[metric.name];
      s.count++;
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
    });

    return summary;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): T | Promise<T> {
  const start = performance.now();

  const result = fn();

  if (result instanceof Promise) {
    return result.then(value => {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(name, duration, metadata);
      return value;
    });
  }

  const duration = performance.now() - start;
  performanceMonitor.recordMetric(name, duration, metadata);
  return result;
}

/**
 * Measure API request performance
 */
export async function measureApiRequest<T>(
  url: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fetchFn();
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric('api_response', duration, { url });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric('api_error', duration, { url, error: String(error) });
    throw error;
  }
}

/**
 * Measure database query performance
 */
export async function measureDbQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - start;
    
    performanceMonitor.recordMetric('db_query', duration, { query: queryName });
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric('db_error', duration, { query: queryName, error: String(error) });
    throw error;
  }
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: any): void {
  if (typeof window === 'undefined') return;

  const { name, value, id } = metric;

  // Record in our monitoring system
  performanceMonitor.recordMetric(name.toLowerCase(), value, { id });

  // Send to Vercel Analytics if available
  if ((window as any).va) {
    (window as any).va('track', name, { value, id });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}: ${value}`, { id });
  }
}

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Monitor page load performance
  if ('PerformanceObserver' in window) {
    // Monitor navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          performanceMonitor.recordMetric('ttfb', navEntry.responseStart - navEntry.requestStart);
          performanceMonitor.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart);
          performanceMonitor.recordMetric('load_complete', navEntry.loadEventEnd - navEntry.loadEventStart);
        }
      }
    });

    navObserver.observe({ entryTypes: ['navigation'] });

    // Monitor resource timing
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          performanceMonitor.recordMetric('resource_load', resourceEntry.duration, {
            name: resourceEntry.name,
            type: resourceEntry.initiatorType,
          });
        }
      }
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  // Log initialization
  console.log('[Performance Monitoring] Initialized');
}

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
}

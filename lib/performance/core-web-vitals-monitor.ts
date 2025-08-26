/**
 * Core Web Vitals Performance Monitor
 * Task 7.2 & 7.4: Real-time performance monitoring and error tracking
 */

export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType?: string;
}

export interface PerformanceAlert {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'error';
  timestamp: number;
  userAgent?: string;
  url: string;
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

class CoreWebVitalsMonitor {
  private alerts: PerformanceAlert[] = [];
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private onMetricCallback?: (metric: WebVitalsMetric) => void;
  private onAlertCallback?: (alert: PerformanceAlert) => void;

  constructor(
    onMetric?: (metric: WebVitalsMetric) => void,
    onAlert?: (alert: PerformanceAlert) => void
  ) {
    this.onMetricCallback = onMetric;
    this.onAlertCallback = onAlert;
  }

  /**
   * Initialize Core Web Vitals monitoring
   * Call this early in app initialization
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // CLS Observer
    this.observeCLS();
    
    // LCP Observer
    this.observeLCP();
    
    // FCP Observer
    this.observeFCP();
    
    // INP Observer (replaces FID)
    this.observeINP();
    
    // TTFB from Navigation Timing
    this.measureTTFB();
    
    // Monitor page visibility changes for more accurate measurements
    this.handleVisibilityChanges();
  }

  private observeCLS(): void {
    try {
      let clsValue = 0;
      
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        
        this.reportMetric({
          name: 'CLS',
          value: clsValue,
          rating: this.getRating('CLS', clsValue),
          delta: (entry as any).value,
          id: this.generateId(),
        });
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS monitoring not supported:', error);
    }
  }

  private observeLCP(): void {
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lcpEntry = entries[entries.length - 1];
          
          this.reportMetric({
            name: 'LCP',
            value: lcpEntry.startTime,
            rating: this.getRating('LCP', lcpEntry.startTime),
            delta: lcpEntry.startTime,
            id: this.generateId(),
          });
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP monitoring not supported:', error);
    }
  }

  private observeFCP(): void {
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.reportMetric({
              name: 'FCP',
              value: entry.startTime,
              rating: this.getRating('FCP', entry.startTime),
              delta: entry.startTime,
              id: this.generateId(),
            });
          }
        }
      }).observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.warn('FCP monitoring not supported:', error);
    }
  }

  private observeINP(): void {
    try {
      // INP is newer, fallback to FID if not available
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const inpValue = (entry as any).processingEnd - entry.startTime;
          
          this.reportMetric({
            name: 'INP',
            value: inpValue,
            rating: this.getRating('INP', inpValue),
            delta: inpValue,
            id: this.generateId(),
          });
        }
      });
      
      // Try INP first, fall back to FID
      try {
        observer.observe({ type: 'event', buffered: true });
      } catch {
        observer.observe({ type: 'first-input', buffered: true });
      }
    } catch (error) {
      console.warn('INP/FID monitoring not supported:', error);
    }
  }

  private measureTTFB(): void {
    try {
      // Measure TTFB on page load
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const ttfb = navigation.responseStart - navigation.requestStart;
          
          this.reportMetric({
            name: 'TTFB',
            value: ttfb,
            rating: this.getRating('TTFB', ttfb),
            delta: ttfb,
            id: this.generateId(),
          });
        }
      });
    } catch (error) {
      console.warn('TTFB monitoring failed:', error);
    }
  }

  private handleVisibilityChanges(): void {
    // Report final metrics when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportFinalMetrics();
      }
    });
  }

  private reportMetric(metric: WebVitalsMetric): void {
    this.metrics.set(metric.name, metric);
    
    // Check for performance alerts
    if (metric.rating === 'poor' || metric.rating === 'needs-improvement') {
      this.createAlert(metric);
    }
    
    // Call callback if provided
    this.onMetricCallback?.(metric);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${metric.name}:`, {
        value: `${Math.round(metric.value)}ms`,
        rating: metric.rating,
        threshold: THRESHOLDS[metric.name]
      });
    }
  }

  private createAlert(metric: WebVitalsMetric): void {
    const threshold = THRESHOLDS[metric.name];
    const alert: PerformanceAlert = {
      metric: metric.name,
      value: metric.value,
      threshold: threshold.good,
      severity: metric.rating === 'poor' ? 'error' : 'warning',
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    this.alerts.push(alert);
    this.onAlertCallback?.(alert);
  }

  private getRating(metricName: WebVitalsMetric['name'], value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[metricName];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private reportFinalMetrics(): void {
    // Send final metrics to analytics/monitoring service
    if (this.metrics.size > 0) {
      const finalMetrics = Array.from(this.metrics.values());
      
      // In a real app, send to analytics service
      console.log('📊 Final Core Web Vitals:', finalMetrics);
      
      // Send using beacon API for reliability
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', JSON.stringify({
          metrics: finalMetrics,
          alerts: this.alerts,
          timestamp: Date.now(),
          url: window.location.href,
        }));
      }
    }
  }

  // Public methods for manual reporting
  getMetrics(): Map<string, WebVitalsMetric> {
    return this.metrics;
  }

  getAlerts(): PerformanceAlert[] {
    return this.alerts;
  }

  getPerformanceScore(): number {
    if (this.metrics.size === 0) return 0;
    
    const scores: number[] = [];
    this.metrics.forEach((metric) => {
      switch (metric.rating) {
        case 'good': scores.push(100); break;
        case 'needs-improvement': scores.push(60); break;
        case 'poor': scores.push(20); break;
      }
    });
    
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
}

// Singleton instance
let monitorInstance: CoreWebVitalsMonitor | null = null;

export function initWebVitalsMonitoring(
  onMetric?: (metric: WebVitalsMetric) => void,
  onAlert?: (alert: PerformanceAlert) => void
): CoreWebVitalsMonitor {
  if (!monitorInstance) {
    monitorInstance = new CoreWebVitalsMonitor(onMetric, onAlert);
    monitorInstance.init();
  }
  return monitorInstance;
}

export function getWebVitalsMonitor(): CoreWebVitalsMonitor | null {
  return monitorInstance;
}

// Default initialization with basic logging
export function initBasicWebVitalsMonitoring(): CoreWebVitalsMonitor {
  return initWebVitalsMonitoring(
    (metric) => {
      // Basic console logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`📈 ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating})`);
      }
    },
    (alert) => {
      // Basic alert logging
      console.warn(`🚨 Performance Alert: ${alert.metric} = ${Math.round(alert.value)}ms (threshold: ${alert.threshold}ms)`);
    }
  );
}
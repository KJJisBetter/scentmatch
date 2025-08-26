/**
 * Performance Monitoring System
 * Tracks Core Web Vitals and custom performance metrics for mobile-first UX
 */

import { analytics } from '../analytics/analytics-client';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  isMobile: boolean;
  viewportWidth: number;
  connectionType?: string;
}

interface CoreWebVitals {
  CLS?: number; // Cumulative Layout Shift
  FCP?: number; // First Contentful Paint
  FID?: number; // First Input Delay
  LCP?: number; // Largest Contentful Paint
  TTFB?: number; // Time to First Byte
  TTI?: number; // Time to Interactive
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private isInitialized = false;
  private webVitals: CoreWebVitals = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Core Web Vitals tracking
      this.initializeWebVitals();
      
      // Initialize performance observer
      this.initializePerformanceObserver();
      
      // Track custom metrics
      this.trackCustomMetrics();
      
      // Set up periodic reporting
      this.setupPeriodicReporting();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Performance monitoring initialization failed:', error);
    }
  }

  private async initializeWebVitals() {
    try {
      // Use web-vitals library if available, otherwise use Performance API
      const { getCLS, getFCP, getFID, getLCP, getTTFB } = await import('web-vitals');
      
      getCLS((metric) => {
        this.webVitals.CLS = metric.value;
        this.recordMetric('cumulative_layout_shift', metric.value);
      });
      
      getFCP((metric) => {
        this.webVitals.FCP = metric.value;
        this.recordMetric('first_contentful_paint', metric.value);
      });
      
      getFID((metric) => {
        this.webVitals.FID = metric.value;
        this.recordMetric('first_input_delay', metric.value);
      });
      
      getLCP((metric) => {
        this.webVitals.LCP = metric.value;
        this.recordMetric('largest_contentful_paint', metric.value);
      });
      
      getTTFB((metric) => {
        this.webVitals.TTFB = metric.value;
        this.recordMetric('time_to_first_byte', metric.value);
      });
    } catch (error) {
      console.debug('web-vitals library not available, using fallback methods');
      this.fallbackWebVitalsTracking();
    }
  }

  private fallbackWebVitalsTracking() {
    // Fallback implementations using Performance API
    
    // Track FCP using Performance API
    const observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('first_contentful_paint', entry.startTime);
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });

    // Track LCP using Performance API
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('largest_contentful_paint', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private initializePerformanceObserver() {
    if (!window.PerformanceObserver) return;

    this.observer = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    // Observe navigation timing
    try {
      this.observer.observe({ entryTypes: ['navigation'] });
    } catch (error) {
      console.debug('Navigation timing not supported');
    }

    // Observe resource timing
    try {
      this.observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.debug('Resource timing not supported');
    }

    // Observe user timing
    try {
      this.observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.debug('User timing not supported');
    }
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'resource':
        this.processResourceEntry(entry as PerformanceResourceTiming);
        break;
      case 'measure':
        this.processMeasureEntry(entry);
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    // Track page load time
    const pageLoadTime = entry.loadEventEnd - entry.navigationStart;
    this.recordMetric('page_load_time', pageLoadTime);

    // Track time to interactive (simplified)
    const timeToInteractive = entry.domInteractive - entry.navigationStart;
    this.recordMetric('time_to_interactive', timeToInteractive);

    // Track DOM content loaded
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
    this.recordMetric('dom_content_loaded', domContentLoaded);
  }

  private processResourceEntry(entry: PerformanceResourceTiming) {
    // Track slow resources (>2s)
    const duration = entry.responseEnd - entry.startTime;
    if (duration > 2000) {
      analytics.track('slow_resource_detected', {
        resource_name: entry.name,
        duration,
        resource_type: this.getResourceType(entry.name),
        is_mobile: this.isMobileDevice(),
      });
    }
  }

  private processMeasureEntry(entry: PerformanceEntry) {
    // Track custom performance measures
    this.recordMetric(entry.name, entry.duration);
  }

  private trackCustomMetrics() {
    // Track mobile-specific metrics
    this.trackMobileMetrics();
    
    // Track quiz performance
    this.trackQuizMetrics();
    
    // Track collection performance
    this.trackCollectionMetrics();
    
    // Track bottom navigation performance
    this.trackBottomNavMetrics();
  }

  private trackMobileMetrics() {
    if (!this.isMobileDevice()) return;

    // Track viewport changes (orientation changes)
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        analytics.track('orientation_change', {
          new_width: window.innerWidth,
          new_height: window.innerHeight,
          is_landscape: window.innerWidth > window.innerHeight,
        });
      }, 100);
    });

    // Track touch interactions
    let touchStartTime = 0;
    document.addEventListener('touchstart', () => {
      touchStartTime = performance.now();
    });

    document.addEventListener('touchend', () => {
      const touchDuration = performance.now() - touchStartTime;
      if (touchDuration > 100) { // Only track longer touches
        this.recordMetric('touch_interaction_duration', touchDuration);
      }
    });
  }

  private trackQuizMetrics() {
    // Track quiz question rendering time
    const quizObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const addedElements = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === Node.ELEMENT_NODE) as Element[];
          
          addedElements.forEach(element => {
            if (element.classList.contains('quiz-question')) {
              const renderTime = performance.now();
              this.recordMetric('quiz_question_render_time', renderTime);
            }
          });
        }
      });
    });

    // Start observing when on quiz page
    if (window.location.pathname.includes('/quiz')) {
      quizObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  private trackCollectionMetrics() {
    // Track collection loading time
    performance.mark('collection-load-start');
    
    // Track when collection items are fully rendered
    const collectionObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          const addedElements = Array.from(mutation.addedNodes)
            .filter(node => node.nodeType === Node.ELEMENT_NODE) as Element[];
          
          addedElements.forEach(element => {
            if (element.classList.contains('collection-item')) {
              performance.mark('collection-load-end');
              performance.measure('collection-load-duration', 'collection-load-start', 'collection-load-end');
            }
          });
        }
      });
    });

    if (window.location.pathname.includes('/collection')) {
      collectionObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }

  private trackBottomNavMetrics() {
    const bottomNav = document.querySelector('[data-testid="bottom-navigation"]');
    if (!bottomNav) return;

    // Track bottom nav click responsiveness
    bottomNav.addEventListener('click', (event) => {
      const clickTime = performance.now();
      const target = event.target as Element;
      const button = target.closest('button');
      
      if (button) {
        const buttonText = button.textContent?.trim() || 'unknown';
        
        // Measure time until navigation completes
        const navigationStart = performance.now();
        
        // Listen for URL change or DOM change
        const checkNavigation = () => {
          const navigationEnd = performance.now();
          const navigationDuration = navigationEnd - navigationStart;
          
          analytics.track('bottom_nav_performance', {
            tab: buttonText.toLowerCase(),
            click_to_navigation_duration: navigationDuration,
            is_mobile: this.isMobileDevice(),
          });
        };

        // Check after a short delay
        setTimeout(checkNavigation, 100);
      }
    });
  }

  private setupPeriodicReporting() {
    // Report metrics every 30 seconds
    setInterval(() => {
      this.reportMetrics();
    }, 30000);

    // Report on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportMetrics();
      }
    });

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });
  }

  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      isMobile: this.isMobileDevice(),
      viewportWidth: window.innerWidth,
      connectionType: this.getConnectionType(),
    };

    this.metrics.push(metric);

    // Report immediately if it's a critical metric
    const criticalMetrics = ['largest_contentful_paint', 'cumulative_layout_shift', 'first_input_delay'];
    if (criticalMetrics.includes(name)) {
      analytics.trackPerformanceMetric(name, value);
    }
  }

  private reportMetrics() {
    if (this.metrics.length === 0) return;

    // Group metrics by name and calculate averages
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    // Report averages
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      analytics.trackPerformanceMetric(`avg_${name}`, average);
    });

    // Clear reported metrics
    this.metrics = [];
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
           || window.innerWidth <= 768;
  }

  private getConnectionType(): string {
    // @ts-ignore
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'javascript';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Public API
  public startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  public endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }

  public getWebVitals(): CoreWebVitals {
    return { ...this.webVitals };
  }

  public getCurrentMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public trackCustomEvent(name: string, duration: number, properties?: Record<string, any>) {
    analytics.track('custom_performance_event', {
      event_name: name,
      duration,
      is_mobile: this.isMobileDevice(),
      ...properties,
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
import { useEffect } from 'react';

export function usePerformanceMonitor() {
  useEffect(() => {
    // Track component mount time
    const startTime = performance.now();
    
    return () => {
      const mountTime = performance.now() - startTime;
      performanceMonitor.trackCustomEvent('component_lifecycle', mountTime, {
        action: 'unmount',
        component: 'unknown', // Can be enhanced to track specific components
      });
    };
  }, []);

  return {
    startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
    endMeasure: performanceMonitor.endMeasure.bind(performanceMonitor),
    trackCustomEvent: performanceMonitor.trackCustomEvent.bind(performanceMonitor),
    getWebVitals: performanceMonitor.getWebVitals.bind(performanceMonitor),
  };
}

export type { PerformanceMetric, CoreWebVitals };
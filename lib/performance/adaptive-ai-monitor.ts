/**
 * Adaptive AI Performance Monitor
 * 
 * Comprehensive monitoring system for the adaptive AI explanation system
 * Tracks Core Web Vitals, AI response times, and user experience metrics
 */

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay  
  cls: number; // Cumulative Layout Shift
  inp: number; // Interaction to Next Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte

  // AI Performance
  experienceDetectionTime: number;
  explanationGenerationTime: number;
  educationalContentLoadTime: number;
  cacheHitRate: number;
  fallbackUsageRate: number;

  // User Experience
  tooltipInteractionCount: number;
  progressiveDisclosureEngagement: number;
  beginnerConfidenceScore: number;
  
  // System Performance
  memoryUsage: number;
  componentRenderTime: number;
  bundleLoadTime: number;
}

export interface PerformanceBudget {
  lcp: number; // Target: 2.5s
  fid: number; // Target: 100ms
  cls: number; // Target: 0.1
  inp: number; // Target: 200ms
  fcp: number; // Target: 1.8s
  aiResponseTime: number; // Target: 2s
  cacheHitRate: number; // Target: 80%
}

export interface PerformanceAlert {
  metric: string;
  current: number;
  budget: number;
  severity: 'warning' | 'critical';
  timestamp: number;
  context?: string;
}

/**
 * Real-time performance monitoring for adaptive AI system
 */
class AdaptiveAIPerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  
  private budget: PerformanceBudget = {
    lcp: 2500, // 2.5s
    fid: 100,  // 100ms
    cls: 0.1,  // 0.1
    inp: 200,  // 200ms
    fcp: 1800, // 1.8s
    aiResponseTime: 2000, // 2s
    cacheHitRate: 80, // 80%
  };

  constructor() {
    this.initializeObservers();
    this.startMonitoring();
  }

  /**
   * Initialize Web Performance API observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        this.recordMetric('lcp', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // FID Observer
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // CLS Observer
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // INP Observer (using event timing as proxy)
      const inpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const inp = entry.processingEnd - entry.startTime;
          this.recordMetric('inp', inp);
        });
      });
      inpObserver.observe({ entryTypes: ['event'] });
      this.observers.push(inpObserver);
    }
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor FCP
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      if (navigation) {
        this.recordMetric('ttfb', navigation.responseStart);
      }

      // Get FCP from paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.recordMetric('fcp', fcpEntry.startTime);
      }
    });

    // Memory monitoring (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memoryUsage', memory.usedJSHeapSize / memory.jsHeapSizeLimit);
      }, 5000);
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: keyof PerformanceMetrics, value: number, context?: string): void {
    this.metrics[metric] = value;
    
    // Check against budget
    this.checkBudget(metric, value, context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Performance: ${metric} = ${value.toFixed(2)}${this.getUnit(metric)}`);
    }
  }

  /**
   * Record AI-specific performance metrics
   */
  recordAIMetric(type: 'experienceDetection' | 'explanationGeneration' | 'educationalContent', 
                 duration: number, 
                 cacheHit: boolean = false): void {
    switch (type) {
      case 'experienceDetection':
        this.recordMetric('experienceDetectionTime', duration, 'ai-experience-detection');
        break;
      case 'explanationGeneration':
        this.recordMetric('explanationGenerationTime', duration, 'ai-explanation');
        break;
      case 'educationalContent':
        this.recordMetric('educationalContentLoadTime', duration, 'educational-content');
        break;
    }

    // Update cache hit rate
    if (type === 'experienceDetection' || type === 'explanationGeneration') {
      this.updateCacheHitRate(cacheHit);
    }
  }

  /**
   * Record user interaction metrics
   */
  recordInteraction(type: 'tooltip' | 'progressiveDisclosure' | 'confidenceBoost'): void {
    switch (type) {
      case 'tooltip':
        const currentCount = this.metrics.tooltipInteractionCount || 0;
        this.recordMetric('tooltipInteractionCount', currentCount + 1);
        break;
      case 'progressiveDisclosure':
        const currentEngagement = this.metrics.progressiveDisclosureEngagement || 0;
        this.recordMetric('progressiveDisclosureEngagement', currentEngagement + 1);
        break;
      case 'confidenceBoost':
        // Track confidence boost effectiveness
        const currentScore = this.metrics.beginnerConfidenceScore || 0;
        this.recordMetric('beginnerConfidenceScore', Math.min(currentScore + 0.1, 1));
        break;
    }
  }

  /**
   * Update cache hit rate
   */
  private updateCacheHitRate(hit: boolean): void {
    const currentRate = this.metrics.cacheHitRate || 0;
    const newRate = hit ? Math.min(currentRate + 1, 100) : Math.max(currentRate - 0.5, 0);
    this.recordMetric('cacheHitRate', newRate);
  }

  /**
   * Check metric against performance budget
   */
  private checkBudget(metric: keyof PerformanceMetrics, value: number, context?: string): void {
    let budgetValue: number | undefined;
    
    switch (metric) {
      case 'lcp':
        budgetValue = this.budget.lcp;
        break;
      case 'fid':
        budgetValue = this.budget.fid;
        break;
      case 'cls':
        budgetValue = this.budget.cls;
        break;
      case 'inp':
        budgetValue = this.budget.inp;
        break;
      case 'fcp':
        budgetValue = this.budget.fcp;
        break;
      case 'experienceDetectionTime':
      case 'explanationGenerationTime':
        budgetValue = this.budget.aiResponseTime;
        break;
      case 'cacheHitRate':
        if (value < this.budget.cacheHitRate) {
          this.addAlert(metric, value, this.budget.cacheHitRate, 'warning', context);
        }
        return;
    }

    if (budgetValue && value > budgetValue) {
      const severity = value > budgetValue * 1.5 ? 'critical' : 'warning';
      this.addAlert(metric, value, budgetValue, severity, context);
    }
  }

  /**
   * Add performance alert
   */
  private addAlert(
    metric: string, 
    current: number, 
    budget: number, 
    severity: 'warning' | 'critical',
    context?: string
  ): void {
    const alert: PerformanceAlert = {
      metric,
      current,
      budget,
      severity,
      timestamp: Date.now(),
      context,
    };

    this.alerts.push(alert);
    
    // Keep only last 10 alerts
    if (this.alerts.length > 10) {
      this.alerts.shift();
    }

    // Log critical alerts
    if (severity === 'critical') {
      console.error(`🚨 Critical Performance Alert: ${metric} = ${current.toFixed(2)}${this.getUnit(metric)} (budget: ${budget}${this.getUnit(metric)})`);
    }
  }

  /**
   * Get unit for metric
   */
  private getUnit(metric: string): string {
    if (metric.includes('Time') || ['lcp', 'fid', 'inp', 'fcp', 'ttfb'].includes(metric)) {
      return 'ms';
    }
    if (metric === 'cls') {
      return '';
    }
    if (metric.includes('Rate') || metric.includes('Usage')) {
      return '%';
    }
    return '';
  }

  /**
   * Get current performance score (0-100)
   */
  getPerformanceScore(): number {
    const scores: number[] = [];

    // Core Web Vitals scores
    if (this.metrics.lcp) {
      scores.push(this.metrics.lcp <= 2500 ? 100 : Math.max(0, 100 - (this.metrics.lcp - 2500) / 25));
    }
    if (this.metrics.fid) {
      scores.push(this.metrics.fid <= 100 ? 100 : Math.max(0, 100 - (this.metrics.fid - 100) / 5));
    }
    if (this.metrics.cls) {
      scores.push(this.metrics.cls <= 0.1 ? 100 : Math.max(0, 100 - (this.metrics.cls - 0.1) * 500));
    }
    if (this.metrics.inp) {
      scores.push(this.metrics.inp <= 200 ? 100 : Math.max(0, 100 - (this.metrics.inp - 200) / 10));
    }

    // AI Performance scores
    if (this.metrics.explanationGenerationTime) {
      scores.push(this.metrics.explanationGenerationTime <= 2000 ? 100 : 
                 Math.max(0, 100 - (this.metrics.explanationGenerationTime - 2000) / 50));
    }
    if (this.metrics.cacheHitRate) {
      scores.push(this.metrics.cacheHitRate >= 80 ? 100 : this.metrics.cacheHitRate * 1.25);
    }

    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    score: number;
    metrics: Partial<PerformanceMetrics>;
    alerts: PerformanceAlert[];
    recommendations: string[];
  } {
    const score = this.getPerformanceScore();
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS');
    }
    if (this.metrics.fid && this.metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay - minimize JavaScript execution time');
    }
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      recommendations.push('Improve layout stability - ensure proper image dimensions and font loading');
    }
    if (this.metrics.explanationGenerationTime && this.metrics.explanationGenerationTime > 2000) {
      recommendations.push('Optimize AI response time - increase caching or use faster models');
    }
    if (this.metrics.cacheHitRate && this.metrics.cacheHitRate < 80) {
      recommendations.push('Improve cache effectiveness - optimize cache keys and TTL values');
    }

    return {
      score,
      metrics: this.metrics,
      alerts: this.alerts,
      recommendations,
    };
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      score: this.getPerformanceScore(),
      alerts: this.alerts,
    }, null, 2);
  }

  /**
   * Cleanup observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Export singleton instance
export const performanceMonitor = new AdaptiveAIPerformanceMonitor();

// Export hooks for React components
export function usePerformanceTracking() {
  const trackAI = (type: 'experienceDetection' | 'explanationGeneration' | 'educationalContent', 
                   duration: number, 
                   cacheHit: boolean = false) => {
    performanceMonitor.recordAIMetric(type, duration, cacheHit);
  };

  const trackInteraction = (type: 'tooltip' | 'progressiveDisclosure' | 'confidenceBoost') => {
    performanceMonitor.recordInteraction(type);
  };

  const getReport = () => performanceMonitor.getPerformanceReport();

  return { trackAI, trackInteraction, getReport };
}
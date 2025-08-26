/**
 * Performance Budget Monitor
 * Task 7.5: Create performance budgets and monitoring alerts
 * 
 * Monitors:
 * - Bundle sizes
 * - Core Web Vitals
 * - API response times
 * - Database query performance
 * - Resource loading times
 */

import { WebVitalsMetric, PerformanceAlert } from './core-web-vitals-monitor';

export interface PerformanceBudget {
  metric: string;
  budget: number;
  unit: 'ms' | 'kb' | 'mb' | 'score' | 'count' | 'ratio';
  threshold: {
    warning: number;
    error: number;
  };
  description: string;
}

export interface BudgetViolation {
  metric: string;
  currentValue: number;
  budgetValue: number;
  severity: 'warning' | 'error';
  timestamp: number;
  url?: string;
  userAgent?: string;
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  budgets: PerformanceBudget[];
  violations: BudgetViolation[];
  metrics: Record<string, number>;
  score: number;
  recommendations: string[];
}

// Default performance budgets for ScentMatch
const DEFAULT_BUDGETS: PerformanceBudget[] = [
  // Core Web Vitals
  {
    metric: 'LCP',
    budget: 2500,
    unit: 'ms',
    threshold: { warning: 2000, error: 2500 },
    description: 'Largest Contentful Paint - Critical for user experience'
  },
  {
    metric: 'FID',
    budget: 100,
    unit: 'ms',
    threshold: { warning: 80, error: 100 },
    description: 'First Input Delay - Interaction responsiveness'
  },
  {
    metric: 'INP',
    budget: 200,
    unit: 'ms',
    threshold: { warning: 150, error: 200 },
    description: 'Interaction to Next Paint - Ongoing responsiveness'
  },
  {
    metric: 'CLS',
    budget: 0.1,
    unit: 'score',
    threshold: { warning: 0.05, error: 0.1 },
    description: 'Cumulative Layout Shift - Visual stability'
  },
  {
    metric: 'FCP',
    budget: 1800,
    unit: 'ms',
    threshold: { warning: 1500, error: 1800 },
    description: 'First Contentful Paint - Perceived loading speed'
  },
  {
    metric: 'TTFB',
    budget: 800,
    unit: 'ms',
    threshold: { warning: 600, error: 800 },
    description: 'Time to First Byte - Server responsiveness'
  },

  // Resource budgets
  {
    metric: 'TotalPageSize',
    budget: 1500,
    unit: 'kb',
    threshold: { warning: 1200, error: 1500 },
    description: 'Total page size - Network efficiency'
  },
  {
    metric: 'JavaScriptSize',
    budget: 300,
    unit: 'kb',
    threshold: { warning: 250, error: 300 },
    description: 'JavaScript bundle size - Parse/compile time'
  },
  {
    metric: 'CSSSize',
    budget: 50,
    unit: 'kb',
    threshold: { warning: 40, error: 50 },
    description: 'CSS bundle size - Render blocking'
  },
  {
    metric: 'ImageSize',
    budget: 800,
    unit: 'kb',
    threshold: { warning: 600, error: 800 },
    description: 'Total image size - Visual content efficiency'
  },
  {
    metric: 'ResourceCount',
    budget: 50,
    unit: 'count',
    threshold: { warning: 40, error: 50 },
    description: 'Total resource count - Request overhead'
  },

  // API Performance
  {
    metric: 'SearchAPIResponseTime',
    budget: 500,
    unit: 'ms',
    threshold: { warning: 300, error: 500 },
    description: 'Search API response time'
  },
  {
    metric: 'FragranceDetailsAPIResponseTime',
    budget: 300,
    unit: 'ms',
    threshold: { warning: 200, error: 300 },
    description: 'Fragrance details API response time'
  },
  {
    metric: 'QuizAnalysisAPIResponseTime',
    budget: 1000,
    unit: 'ms',
    threshold: { warning: 700, error: 1000 },
    description: 'Quiz analysis API response time'
  },

  // Database Performance
  {
    metric: 'DatabaseQueryTime',
    budget: 100,
    unit: 'ms',
    threshold: { warning: 75, error: 100 },
    description: 'Average database query time'
  },
  {
    metric: 'DatabaseCacheHitRate',
    budget: 0.8,
    unit: 'ratio',
    threshold: { warning: 0.7, error: 0.6 },
    description: 'Database cache hit rate - Efficiency indicator'
  },

  // User Experience
  {
    metric: 'TimeToInteractive',
    budget: 3000,
    unit: 'ms',
    threshold: { warning: 2500, error: 3000 },
    description: 'Time to Interactive - Full usability'
  },
  {
    metric: 'TotalBlockingTime',
    budget: 300,
    unit: 'ms',
    threshold: { warning: 200, error: 300 },
    description: 'Total Blocking Time - Main thread availability'
  }
];

class PerformanceBudgetMonitor {
  private budgets: PerformanceBudget[] = [];
  private violations: BudgetViolation[] = [];
  private reports: PerformanceReport[] = [];
  private alertCallbacks: ((violation: BudgetViolation) => void)[] = [];

  constructor(customBudgets?: PerformanceBudget[]) {
    this.budgets = customBudgets || DEFAULT_BUDGETS;
  }

  /**
   * Check if current metrics violate performance budgets
   */
  checkBudgets(metrics: Record<string, number>, url?: string): PerformanceReport {
    const timestamp = Date.now();
    const currentViolations: BudgetViolation[] = [];
    const recommendations: string[] = [];

    // Check each budget
    for (const budget of this.budgets) {
      const currentValue = metrics[budget.metric];
      
      if (currentValue === undefined) continue;

      // Check for violations
      if (currentValue > budget.threshold.error) {
        const violation: BudgetViolation = {
          metric: budget.metric,
          currentValue,
          budgetValue: budget.budget,
          severity: 'error',
          timestamp,
          url,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        };
        
        currentViolations.push(violation);
        this.violations.push(violation);
        this.triggerAlert(violation);
        
        // Add recommendation
        recommendations.push(this.getRecommendation(budget, currentValue));
        
      } else if (currentValue > budget.threshold.warning) {
        const violation: BudgetViolation = {
          metric: budget.metric,
          currentValue,
          budgetValue: budget.budget,
          severity: 'warning',
          timestamp,
          url,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
        };
        
        currentViolations.push(violation);
        this.violations.push(violation);
        this.triggerAlert(violation);
        
        // Add recommendation
        recommendations.push(this.getRecommendation(budget, currentValue));
      }
    }

    // Calculate performance score (0-100)
    const score = this.calculatePerformanceScore(metrics);

    const report: PerformanceReport = {
      timestamp,
      url: url || (typeof window !== 'undefined' ? window.location.href : ''),
      budgets: this.budgets,
      violations: currentViolations,
      metrics,
      score,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };

    this.reports.push(report);
    
    // Keep only last 100 reports
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(-100);
    }

    return report;
  }

  /**
   * Monitor resource loading and check budgets
   */
  monitorResourceLoading(): Promise<PerformanceReport> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(this.checkBudgets({}));
        return;
      }

      // Wait for page load to complete
      window.addEventListener('load', () => {
        setTimeout(() => {
          const metrics = this.collectResourceMetrics();
          const report = this.checkBudgets(metrics);
          resolve(report);
        }, 1000); // Small delay to ensure all metrics are available
      });
    });
  }

  /**
   * Continuously monitor performance metrics
   */
  startContinuousMonitoring(intervalMs = 30000): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const interval = setInterval(() => {
      const metrics = this.collectAllMetrics();
      this.checkBudgets(metrics);
    }, intervalMs);

    return () => clearInterval(interval);
  }

  /**
   * Add custom alert callback
   */
  onBudgetViolation(callback: (violation: BudgetViolation) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Get performance recommendations based on current metrics
   */
  getPerformanceRecommendations(metrics: Record<string, number>): string[] {
    const recommendations: string[] = [];

    // LCP recommendations
    if (metrics.LCP > 2000) {
      recommendations.push('Optimize Largest Contentful Paint by preloading hero images and critical resources');
    }

    // JavaScript size recommendations
    if (metrics.JavaScriptSize > 200) {
      recommendations.push('Reduce JavaScript bundle size through code splitting and tree shaking');
    }

    // Image size recommendations
    if (metrics.ImageSize > 600) {
      recommendations.push('Optimize images using modern formats (WebP, AVIF) and appropriate sizing');
    }

    // API response time recommendations
    if (metrics.SearchAPIResponseTime > 300) {
      recommendations.push('Optimize search API with database indexing and query caching');
    }

    // Cache hit rate recommendations
    if (metrics.DatabaseCacheHitRate < 0.7) {
      recommendations.push('Improve database caching strategy for frequently accessed data');
    }

    // CLS recommendations
    if (metrics.CLS > 0.05) {
      recommendations.push('Fix layout shifts by specifying image dimensions and avoiding dynamic content insertion');
    }

    return recommendations;
  }

  private collectResourceMetrics(): Record<string, number> {
    if (typeof window === 'undefined') return {};

    const resources = performance.getEntriesByType('resource');
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;
    let imageSize = 0;

    resources.forEach((resource: any) => {
      const size = resource.transferSize || 0;
      totalSize += size;

      if (resource.name.includes('.js')) {
        jsSize += size;
      } else if (resource.name.includes('.css')) {
        cssSize += size;
      } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)) {
        imageSize += size;
      }
    });

    return {
      TotalPageSize: Math.round(totalSize / 1024),
      JavaScriptSize: Math.round(jsSize / 1024),
      CSSSize: Math.round(cssSize / 1024),
      ImageSize: Math.round(imageSize / 1024),
      ResourceCount: resources.length,
      TimeToInteractive: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart) : 0,
      TTFB: navigation ? Math.round(navigation.responseStart - navigation.requestStart) : 0
    };
  }

  private collectAllMetrics(): Record<string, number> {
    const resourceMetrics = this.collectResourceMetrics();
    
    // Get Core Web Vitals from performance observer if available
    const webVitalsMetrics: Record<string, number> = {};
    
    if (typeof window !== 'undefined' && (window as any).performanceMetrics) {
      const vitals = (window as any).performanceMetrics;
      webVitalsMetrics.LCP = vitals.lcp || 0;
      webVitalsMetrics.FCP = vitals.fcp || 0;
      webVitalsMetrics.CLS = vitals.cls || 0;
      webVitalsMetrics.FID = vitals.fid || 0;
      webVitalsMetrics.INP = vitals.inp || 0;
    }

    return {
      ...resourceMetrics,
      ...webVitalsMetrics
    };
  }

  private calculatePerformanceScore(metrics: Record<string, number>): number {
    let totalScore = 0;
    let metricsCount = 0;

    for (const budget of this.budgets) {
      const value = metrics[budget.metric];
      if (value === undefined) continue;

      let score = 100;
      
      if (value > budget.threshold.error) {
        score = 0;
      } else if (value > budget.threshold.warning) {
        const range = budget.threshold.error - budget.threshold.warning;
        const excess = value - budget.threshold.warning;
        score = Math.max(0, 50 - (excess / range) * 50);
      } else {
        // Good performance, score based on how far under warning threshold
        const range = budget.threshold.warning;
        score = Math.min(100, 90 + (range - value) / range * 10);
      }

      totalScore += score;
      metricsCount++;
    }

    return metricsCount > 0 ? Math.round(totalScore / metricsCount) : 0;
  }

  private getRecommendation(budget: PerformanceBudget, currentValue: number): string {
    const excess = currentValue - budget.threshold.warning;
    const percentageOver = Math.round((excess / budget.threshold.warning) * 100);
    
    switch (budget.metric) {
      case 'LCP':
        return `LCP is ${percentageOver}% over target. Consider preloading hero images and critical resources.`;
      case 'JavaScriptSize':
        return `JavaScript bundle is ${Math.round(excess)}KB over budget. Implement code splitting and remove unused code.`;
      case 'ImageSize':
        return `Image payload is ${Math.round(excess)}KB over budget. Optimize images with modern formats and compression.`;
      case 'CLS':
        return `Layout shift score is ${(excess * 100).toFixed(1)}% over target. Fix by specifying image dimensions and avoiding dynamic content.`;
      default:
        return `${budget.metric} is ${percentageOver}% over performance budget. ${budget.description}`;
    }
  }

  private triggerAlert(violation: BudgetViolation): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(violation);
      } catch (error) {
        console.error('Performance alert callback failed:', error);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = violation.severity === 'error' ? '🚨' : '⚠️';
      console.warn(
        `${emoji} Performance Budget Violation:`,
        `${violation.metric} = ${violation.currentValue}${this.getUnitForMetric(violation.metric)} ` +
        `(budget: ${violation.budgetValue}${this.getUnitForMetric(violation.metric)})`
      );
    }
  }

  private getUnitForMetric(metric: string): string {
    const budget = this.budgets.find(b => b.metric === metric);
    return budget ? budget.unit : '';
  }

  // Public methods for accessing data
  getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  getLatestReport(): PerformanceReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  getBudgets(): PerformanceBudget[] {
    return [...this.budgets];
  }

  updateBudget(metric: string, budget: Partial<PerformanceBudget>): void {
    const index = this.budgets.findIndex(b => b.metric === metric);
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...budget };
    }
  }

  addBudget(budget: PerformanceBudget): void {
    const existingIndex = this.budgets.findIndex(b => b.metric === budget.metric);
    if (existingIndex !== -1) {
      this.budgets[existingIndex] = budget;
    } else {
      this.budgets.push(budget);
    }
  }

  clearHistory(): void {
    this.violations = [];
    this.reports = [];
  }
}

// Singleton instance for global usage
let budgetMonitorInstance: PerformanceBudgetMonitor | null = null;

export function initPerformanceBudgetMonitor(
  customBudgets?: PerformanceBudget[]
): PerformanceBudgetMonitor {
  if (!budgetMonitorInstance) {
    budgetMonitorInstance = new PerformanceBudgetMonitor(customBudgets);
  }
  return budgetMonitorInstance;
}

export function getPerformanceBudgetMonitor(): PerformanceBudgetMonitor | null {
  return budgetMonitorInstance;
}

export { PerformanceBudgetMonitor, DEFAULT_BUDGETS };
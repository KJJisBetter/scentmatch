/**
 * Performance Optimization Suite - Main Export
 * Task 7: Complete Performance Optimization and Monitoring Integration
 * 
 * This file provides a unified interface to all performance optimization
 * and monitoring systems implemented for ScentMatch.
 */

// Core Web Vitals Monitoring
export {
  initWebVitalsMonitoring,
  getWebVitalsMonitor,
  initBasicWebVitalsMonitoring,
  type WebVitalsMetric,
  type PerformanceAlert
} from './core-web-vitals-monitor';

// Database Performance Optimization
export {
  DatabasePerformanceOptimizer
} from './database-performance-optimizer';

// Performance Budget Monitoring
export {
  initPerformanceBudgetMonitor,
  getPerformanceBudgetMonitor,
  PerformanceBudgetMonitor,
  DEFAULT_BUDGETS,
  type PerformanceBudget,
  type BudgetViolation,
  type PerformanceReport
} from './performance-budget-monitor';

// Error Tracking and UX Monitoring
export {
  initErrorTracking,
  getErrorTracker,
  useErrorTracking,
  ErrorTrackingMonitor,
  type ErrorEvent,
  type UserExperienceEvent,
  type PerformanceIssue
} from './error-tracking-monitor';

// Performance Suite Configuration
export interface PerformanceSuiteConfig {
  enableWebVitalsMonitoring?: boolean;
  enableDatabaseOptimization?: boolean;
  enableBudgetMonitoring?: boolean;
  enableErrorTracking?: boolean;
  userId?: string;
  customBudgets?: PerformanceBudget[];
  autoFlushErrors?: boolean;
  monitoringInterval?: number;
}

/**
 * Initialize the complete performance optimization suite
 * This is the main entry point for setting up all performance systems
 */
export function initPerformanceSuite(config: PerformanceSuiteConfig = {}) {
  const {
    enableWebVitalsMonitoring = true,
    enableBudgetMonitoring = true,
    enableErrorTracking = true,
    userId,
    customBudgets,
    autoFlushErrors = true,
    monitoringInterval = 30000
  } = config;

  console.log('🚀 Initializing ScentMatch Performance Suite...');

  let webVitalsMonitor = null;
  let budgetMonitor = null;
  let errorTracker = null;

  // 1. Initialize Core Web Vitals monitoring
  if (enableWebVitalsMonitoring && typeof window !== 'undefined') {
    webVitalsMonitor = initBasicWebVitalsMonitoring();
    console.log('✅ Core Web Vitals monitoring initialized');
  }

  // 2. Initialize Performance Budget monitoring
  if (enableBudgetMonitoring && typeof window !== 'undefined') {
    budgetMonitor = initPerformanceBudgetMonitor(customBudgets);
    
    // Set up automatic monitoring
    const stopContinuousMonitoring = budgetMonitor.startContinuousMonitoring(monitoringInterval);
    
    // Set up budget violation alerts
    budgetMonitor.onBudgetViolation((violation) => {
      console.warn(`🚨 Performance Budget Violation: ${violation.metric}`, violation);
    });
    
    console.log('✅ Performance Budget monitoring initialized');
  }

  // 3. Initialize Error Tracking
  if (enableErrorTracking && typeof window !== 'undefined') {
    errorTracker = initErrorTracking(userId);
    
    // Set up error callbacks
    errorTracker.onError((error) => {
      console.error(`🔥 Error Tracked: ${error.type}:${error.severity}`, error.message);
    });
    
    // Auto-flush errors if enabled
    if (autoFlushErrors) {
      setInterval(() => {
        errorTracker?.flushErrors();
      }, 60000); // Flush every minute
    }
    
    console.log('✅ Error tracking initialized');
  }

  // 4. Set up integrated performance reporting
  const getPerformanceReport = () => {
    const report = {
      timestamp: Date.now(),
      webVitals: webVitalsMonitor?.getMetrics() || new Map(),
      budgetStatus: budgetMonitor?.getLatestReport() || null,
      errorSummary: errorTracker?.getErrorSummary() || {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        recentErrors: []
      }
    };
    
    return report;
  };

  console.log('🎯 Performance Suite initialized successfully');

  return {
    webVitalsMonitor,
    budgetMonitor,
    errorTracker,
    getPerformanceReport,
    isInitialized: true
  };
}

/**
 * Performance optimization recommendations based on current metrics
 */
export function getPerformanceRecommendations(metrics: Record<string, number>): string[] {
  const recommendations: string[] = [];

  // Core Web Vitals recommendations
  if (metrics.LCP > 2500) {
    recommendations.push('🎯 Optimize Largest Contentful Paint by preloading hero images and critical resources');
  }

  if (metrics.FID > 100 || metrics.INP > 200) {
    recommendations.push('⚡ Improve interaction responsiveness by optimizing JavaScript execution');
  }

  if (metrics.CLS > 0.1) {
    recommendations.push('🔧 Fix layout shifts by specifying image dimensions and avoiding dynamic content insertion');
  }

  // Bundle size recommendations
  if (metrics.JavaScriptSize > 300) {
    recommendations.push('📦 Reduce JavaScript bundle size through code splitting and tree shaking');
  }

  // Database performance recommendations
  if (metrics.DatabaseQueryTime > 100) {
    recommendations.push('🗃️ Optimize database queries with better indexing and caching strategies');
  }

  // Cache performance recommendations
  if (metrics.DatabaseCacheHitRate < 0.8) {
    recommendations.push('💾 Improve caching effectiveness with better cache keys and TTL management');
  }

  return recommendations;
}

/**
 * Performance health check - validates all systems are working correctly
 */
export function performHealthCheck(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  systems: Record<string, boolean>;
  issues: string[];
  recommendations: string[];
} {
  const systems = {
    webVitalsMonitoring: !!getWebVitalsMonitor(),
    budgetMonitoring: !!getPerformanceBudgetMonitor(),
    errorTracking: !!getErrorTracker()
  };

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check each system
  if (!systems.webVitalsMonitoring) {
    issues.push('Core Web Vitals monitoring not initialized');
    recommendations.push('Initialize Web Vitals monitoring for performance tracking');
  }

  if (!systems.budgetMonitoring) {
    issues.push('Performance budget monitoring not active');
    recommendations.push('Set up performance budgets to prevent regressions');
  }

  if (!systems.errorTracking) {
    issues.push('Error tracking system not initialized');
    recommendations.push('Initialize error tracking for better debugging and monitoring');
  }

  // Determine overall status
  const healthySystems = Object.values(systems).filter(Boolean).length;
  const totalSystems = Object.values(systems).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthySystems === totalSystems) {
    status = 'healthy';
  } else if (healthySystems > totalSystems / 2) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    systems,
    issues,
    recommendations
  };
}

/**
 * Export performance metrics for external monitoring systems
 */
export function exportPerformanceMetrics(): {
  timestamp: number;
  metrics: Record<string, number>;
  alerts: any[];
  recommendations: string[];
  healthStatus: ReturnType<typeof performHealthCheck>;
} {
  const webVitalsMonitor = getWebVitalsMonitor();
  const budgetMonitor = getPerformanceBudgetMonitor();
  const errorTracker = getErrorTracker();

  const metrics: Record<string, number> = {};
  const alerts: any[] = [];

  // Collect Web Vitals metrics
  if (webVitalsMonitor) {
    const vitalsMetrics = webVitalsMonitor.getMetrics();
    vitalsMetrics.forEach((metric, name) => {
      metrics[name] = metric.value;
    });
  }

  // Collect budget violations as alerts
  if (budgetMonitor) {
    const latestReport = budgetMonitor.getLatestReport();
    if (latestReport) {
      alerts.push(...latestReport.violations);
    }
  }

  const recommendations = getPerformanceRecommendations(metrics);
  const healthStatus = performHealthCheck();

  return {
    timestamp: Date.now(),
    metrics,
    alerts,
    recommendations,
    healthStatus
  };
}

/**
 * Simple performance logger for development
 */
export function logPerformanceStatus(): void {
  if (process.env.NODE_ENV !== 'development') return;

  const status = performHealthCheck();
  const exported = exportPerformanceMetrics();

  console.group('📊 ScentMatch Performance Status');
  console.log(`Overall Health: ${status.status.toUpperCase()}`);
  console.log('Systems Status:', status.systems);
  
  if (status.issues.length > 0) {
    console.warn('Issues:', status.issues);
  }
  
  if (Object.keys(exported.metrics).length > 0) {
    console.log('Current Metrics:', exported.metrics);
  }
  
  if (exported.recommendations.length > 0) {
    console.log('Recommendations:', exported.recommendations);
  }
  
  console.groupEnd();
}

// Auto-initialize in browser environment with basic configuration
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  // Auto-initialize with basic configuration
  setTimeout(() => {
    initPerformanceSuite({
      enableWebVitalsMonitoring: true,
      enableBudgetMonitoring: true,
      enableErrorTracking: true,
      autoFlushErrors: true,
      monitoringInterval: 30000
    });
  }, 1000); // Small delay to ensure DOM is ready
}
/**
 * Error Tracking and User Experience Monitor
 * Task 7.4: Add error tracking and user experience monitoring
 * 
 * Features:
 * - JavaScript error tracking
 * - API error monitoring
 * - User session tracking
 * - Performance error detection
 * - Real-time error reporting
 */

export interface ErrorEvent {
  id: string;
  type: 'javascript' | 'api' | 'resource' | 'performance' | 'user';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface UserExperienceEvent {
  id: string;
  type: 'interaction' | 'navigation' | 'error' | 'performance';
  action: string;
  timestamp: number;
  duration?: number;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface PerformanceIssue {
  type: 'slow_api' | 'memory_leak' | 'large_bundle' | 'layout_shift' | 'slow_interaction';
  severity: 'warning' | 'error';
  details: string;
  timestamp: number;
  value: number;
  threshold: number;
}

class ErrorTrackingMonitor {
  private sessionId: string;
  private userId?: string;
  private errors: ErrorEvent[] = [];
  private uxEvents: UserExperienceEvent[] = [];
  private performanceIssues: PerformanceIssue[] = [];
  private errorCallbacks: ((error: ErrorEvent) => void)[] = [];
  private uxCallbacks: ((event: UserExperienceEvent) => void)[] = [];

  constructor(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.userId = userId;
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    // Global error handling
    this.setupGlobalErrorHandlers();
    
    // Unhandled promise rejections
    this.setupPromiseRejectionHandling();
    
    // Resource loading errors
    this.setupResourceErrorTracking();
    
    // API error monitoring
    this.setupAPIErrorMonitoring();
    
    // User experience tracking
    this.setupUXTracking();
    
    // Performance issue detection
    this.setupPerformanceMonitoring();
    
    // Page visibility changes
    this.setupVisibilityTracking();
  }

  private setupGlobalErrorHandlers(): void {
    // JavaScript runtime errors
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        metadata: {
          errorEvent: event.type
        }
      });
    });

    // Unhandled errors from event handlers
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'javascript',
        severity: 'high',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        metadata: {
          promise: true,
          reason: event.reason
        }
      });
    });
  }

  private setupPromiseRejectionHandling(): void {
    // Track promise rejections with more detail
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Track API errors
        if (!response.ok) {
          this.trackError({
            type: 'api',
            severity: response.status >= 500 ? 'critical' : 'medium',
            message: `API Error: ${response.status} ${response.statusText}`,
            url: args[0].toString(),
            metadata: {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries())
            }
          });
        }
        
        return response;
      } catch (error) {
        this.trackError({
          type: 'api',
          severity: 'critical',
          message: `Network Error: ${error.message}`,
          url: args[0].toString(),
          stack: error.stack,
          metadata: {
            networkError: true,
            fetchArgs: args
          }
        });
        throw error;
      }
    };
  }

  private setupResourceErrorTracking(): void {
    // Track resource loading failures
    window.addEventListener('error', (event) => {
      const target = event.target;
      
      if (target && target !== window) {
        const tagName = (target as HTMLElement).tagName?.toLowerCase();
        const src = (target as any).src || (target as any).href;
        
        if (['img', 'script', 'link', 'video', 'audio'].includes(tagName)) {
          this.trackError({
            type: 'resource',
            severity: tagName === 'script' ? 'high' : 'medium',
            message: `Failed to load ${tagName}: ${src}`,
            url: src,
            metadata: {
              resourceType: tagName,
              element: target
            }
          });
        }
      }
    }, true);
  }

  private setupAPIErrorMonitoring(): void {
    // Monitor XHR requests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      (this as any)._startTime = Date.now();
      (this as any)._method = method;
      (this as any)._url = url;
      return originalXHROpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(data) {
      const xhr = this;
      const startTime = (xhr as any)._startTime;
      const method = (xhr as any)._method;
      const url = (xhr as any)._url;

      xhr.addEventListener('loadend', () => {
        const duration = Date.now() - startTime;
        
        if (xhr.status >= 400) {
          window.errorTracker?.trackError({
            type: 'api',
            severity: xhr.status >= 500 ? 'critical' : 'medium',
            message: `XHR Error: ${method} ${url} - ${xhr.status} ${xhr.statusText}`,
            url,
            metadata: {
              method,
              status: xhr.status,
              statusText: xhr.statusText,
              duration,
              responseText: xhr.responseText?.substring(0, 500)
            }
          });
        }
        
        // Track slow API responses
        if (duration > 5000) { // > 5 seconds
          window.errorTracker?.trackPerformanceIssue({
            type: 'slow_api',
            severity: 'warning',
            details: `Slow API response: ${method} ${url}`,
            timestamp: Date.now(),
            value: duration,
            threshold: 5000
          });
        }
      });

      return originalXHRSend.apply(this, [data]);
    };
  }

  private setupUXTracking(): void {
    // Track user interactions
    ['click', 'touch', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const target = event.target as HTMLElement;
        const tagName = target.tagName.toLowerCase();
        
        this.trackUXEvent({
          type: 'interaction',
          action: `${eventType}_${tagName}`,
          metadata: {
            eventType,
            tagName,
            className: target.className,
            id: target.id,
            text: target.textContent?.substring(0, 100)
          }
        });
      }, { passive: true });
    });

    // Track page navigation
    const navigationStartTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      this.trackUXEvent({
        type: 'navigation',
        action: 'page_unload',
        duration: Date.now() - navigationStartTime
      });
    });

    // Track focus/blur for engagement
    document.addEventListener('visibilitychange', () => {
      this.trackUXEvent({
        type: 'interaction',
        action: document.hidden ? 'page_hidden' : 'page_visible'
      });
    });
  }

  private setupPerformanceMonitoring(): void {
    // Monitor Core Web Vitals issues
    if ('PerformanceObserver' in window) {
      // Layout shift issues
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if ((entry as any).value > 0.1) {
            this.trackPerformanceIssue({
              type: 'layout_shift',
              severity: 'warning',
              details: `Layout shift detected: ${(entry as any).value}`,
              timestamp: Date.now(),
              value: (entry as any).value,
              threshold: 0.1
            });
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });

      // Long tasks
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 50) {
            this.trackPerformanceIssue({
              type: 'slow_interaction',
              severity: 'warning',
              details: `Long task detected: ${Math.round(entry.duration)}ms`,
              timestamp: Date.now(),
              value: entry.duration,
              threshold: 50
            });
          }
        }
      }).observe({ entryTypes: ['longtask'] });
    }

    // Memory leak detection
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const totalMB = memory.totalJSHeapSize / 1024 / 1024;
        
        if (usedMB > 100) { // > 100MB
          this.trackPerformanceIssue({
            type: 'memory_leak',
            severity: usedMB > 200 ? 'error' : 'warning',
            details: `High memory usage: ${Math.round(usedMB)}MB / ${Math.round(totalMB)}MB`,
            timestamp: Date.now(),
            value: usedMB,
            threshold: 100
          });
        }
      }, 30000); // Check every 30 seconds
    }

    // Bundle size monitoring
    window.addEventListener('load', () => {
      setTimeout(() => {
        const resources = performance.getEntriesByType('resource');
        const jsSize = resources
          .filter((r: any) => r.name.includes('.js'))
          .reduce((total: number, r: any) => total + (r.transferSize || 0), 0);
        
        const jsSizeKB = jsSize / 1024;
        
        if (jsSizeKB > 300) { // > 300KB
          this.trackPerformanceIssue({
            type: 'large_bundle',
            severity: 'warning',
            details: `Large JavaScript bundle: ${Math.round(jsSizeKB)}KB`,
            timestamp: Date.now(),
            value: jsSizeKB,
            threshold: 300
          });
        }
      }, 2000);
    });
  }

  private setupVisibilityTracking(): void {
    // Track when user leaves page to batch send errors
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushErrors();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.flushErrors();
    });
  }

  public trackError(errorData: Omit<ErrorEvent, 'id' | 'timestamp' | 'sessionId' | 'userAgent'>): void {
    const error: ErrorEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      userId: this.userId,
      ...errorData
    };

    this.errors.push(error);
    this.errorCallbacks.forEach(callback => callback(error));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = error.severity === 'critical' ? '🚨' : error.severity === 'high' ? '🔥' : '⚠️';
      console.error(`${emoji} [${error.type.toUpperCase()}]`, error.message, error);
    }

    // Auto-flush critical errors
    if (error.severity === 'critical') {
      this.flushErrors();
    }
  }

  public trackUXEvent(eventData: Omit<UserExperienceEvent, 'id' | 'timestamp' | 'sessionId'>): void {
    const event: UserExperienceEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...eventData
    };

    this.uxEvents.push(event);
    this.uxCallbacks.forEach(callback => callback(event));

    // Keep only last 100 UX events to prevent memory issues
    if (this.uxEvents.length > 100) {
      this.uxEvents = this.uxEvents.slice(-100);
    }
  }

  public trackPerformanceIssue(issue: PerformanceIssue): void {
    this.performanceIssues.push(issue);

    // Convert performance issue to error for unified tracking
    this.trackError({
      type: 'performance',
      severity: issue.severity === 'error' ? 'high' : 'medium',
      message: issue.details,
      metadata: {
        performanceType: issue.type,
        value: issue.value,
        threshold: issue.threshold
      }
    });
  }

  public onError(callback: (error: ErrorEvent) => void): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  public onUXEvent(callback: (event: UserExperienceEvent) => void): () => void {
    this.uxCallbacks.push(callback);
    return () => {
      const index = this.uxCallbacks.indexOf(callback);
      if (index > -1) {
        this.uxCallbacks.splice(index, 1);
      }
    };
  }

  public flushErrors(): void {
    if (this.errors.length === 0) return;

    const payload = {
      errors: [...this.errors],
      uxEvents: [...this.uxEvents.slice(-20)], // Last 20 UX events for context
      performanceIssues: [...this.performanceIssues],
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Send to error tracking service
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/errors/track', JSON.stringify(payload));
    } else {
      // Fallback for browsers without sendBeacon
      fetch('/api/errors/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(err => console.warn('Failed to send error report:', err));
    }

    // Clear sent errors
    this.errors = [];
    this.performanceIssues = [];
  }

  public getErrorSummary(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorEvent[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errors.slice(-10)
    };
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global instance management
declare global {
  interface Window {
    errorTracker?: ErrorTrackingMonitor;
  }
}

let globalErrorTracker: ErrorTrackingMonitor | null = null;

export function initErrorTracking(userId?: string): ErrorTrackingMonitor {
  if (typeof window === 'undefined') {
    return {} as ErrorTrackingMonitor;
  }

  if (!globalErrorTracker) {
    globalErrorTracker = new ErrorTrackingMonitor(userId);
    window.errorTracker = globalErrorTracker;
  } else if (userId) {
    globalErrorTracker.setUserId(userId);
  }

  return globalErrorTracker;
}

export function getErrorTracker(): ErrorTrackingMonitor | null {
  return globalErrorTracker;
}

import React from 'react';

// React hook for error tracking
export function useErrorTracking(userId?: string) {
  React.useEffect(() => {
    const tracker = initErrorTracking(userId);
    
    // Setup React error boundary integration
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this looks like a React error
      const errorMessage = args.join(' ');
      if (errorMessage.includes('React') || errorMessage.includes('Component')) {
        tracker.trackError({
          type: 'javascript',
          severity: 'high',
          message: errorMessage,
          metadata: {
            reactError: true,
            args
          }
        });
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, [userId]);

  return globalErrorTracker;
}

export { ErrorTrackingMonitor };
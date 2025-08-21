'use client';

import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface PerformanceObserverProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  reportToAnalytics?: boolean;
}

export function PerformanceObserver({
  onMetricsUpdate,
  reportToAnalytics = true,
}: PerformanceObserverProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const metrics: PerformanceMetrics = {};

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new (window as any).PerformanceObserver(
          (entryList: any) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            metrics.lcp = lastEntry.startTime;

            if (onMetricsUpdate) {
              onMetricsUpdate(metrics);
            }

            if (
              reportToAnalytics &&
              typeof window !== 'undefined' &&
              (window as any).gtag
            ) {
              (window as any).gtag('event', 'web_vitals', {
                metric_name: 'LCP',
                metric_value: Math.round(lastEntry.startTime),
                metric_rating:
                  lastEntry.startTime < 2500
                    ? 'good'
                    : lastEntry.startTime < 4000
                      ? 'needs_improvement'
                      : 'poor',
              });
            }
          }
        );

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new (window as any).PerformanceObserver(
          (entryList: any) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              metrics.fid = entry.processingStart - entry.startTime;

              if (onMetricsUpdate) {
                onMetricsUpdate(metrics);
              }

              if (
                reportToAnalytics &&
                typeof window !== 'undefined' &&
                (window as any).gtag
              ) {
                (window as any).gtag('event', 'web_vitals', {
                  metric_name: 'FID',
                  metric_value: Math.round(
                    entry.processingStart - entry.startTime
                  ),
                  metric_rating:
                    entry.processingStart - entry.startTime < 100
                      ? 'good'
                      : entry.processingStart - entry.startTime < 300
                        ? 'needs_improvement'
                        : 'poor',
                });
              }
            });
          }
        );

        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new (window as any).PerformanceObserver(
          (entryList: any) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });

            metrics.cls = clsValue;

            if (onMetricsUpdate) {
              onMetricsUpdate(metrics);
            }
          }
        );

        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // First Contentful Paint (FCP)
        const fcpObserver = new (window as any).PerformanceObserver(
          (entryList: any) => {
            const entries = entryList.getEntries();
            entries.forEach((entry: any) => {
              if (entry.name === 'first-contentful-paint') {
                metrics.fcp = entry.startTime;

                if (onMetricsUpdate) {
                  onMetricsUpdate(metrics);
                }

                if (
                  reportToAnalytics &&
                  typeof window !== 'undefined' &&
                  (window as any).gtag
                ) {
                  (window as any).gtag('event', 'web_vitals', {
                    metric_name: 'FCP',
                    metric_value: Math.round(entry.startTime),
                    metric_rating:
                      entry.startTime < 1800
                        ? 'good'
                        : entry.startTime < 3000
                          ? 'needs_improvement'
                          : 'poor',
                  });
                }
              }
            });
          }
        );

        fcpObserver.observe({ entryTypes: ['paint'] });

        // Time to First Byte (TTFB)
        const navigationEntry = performance.getEntriesByType(
          'navigation'
        )[0] as any;
        if (navigationEntry) {
          metrics.ttfb =
            navigationEntry.responseStart - navigationEntry.requestStart;

          if (onMetricsUpdate) {
            onMetricsUpdate(metrics);
          }

          if (
            reportToAnalytics &&
            typeof window !== 'undefined' &&
            (window as any).gtag
          ) {
            (window as any).gtag('event', 'web_vitals', {
              metric_name: 'TTFB',
              metric_value: Math.round(
                navigationEntry.responseStart - navigationEntry.requestStart
              ),
              metric_rating:
                navigationEntry.responseStart - navigationEntry.requestStart <
                800
                  ? 'good'
                  : navigationEntry.responseStart -
                        navigationEntry.requestStart <
                      1800
                    ? 'needs_improvement'
                    : 'poor',
            });
          }
        }

        // Report final CLS on page unload
        const reportCLS = () => {
          if (
            reportToAnalytics &&
            typeof window !== 'undefined' &&
            (window as any).gtag
          ) {
            (window as any).gtag('event', 'web_vitals', {
              metric_name: 'CLS',
              metric_value: Math.round(clsValue * 1000) / 1000,
              metric_rating:
                clsValue < 0.1
                  ? 'good'
                  : clsValue < 0.25
                    ? 'needs_improvement'
                    : 'poor',
            });
          }
        };

        window.addEventListener('beforeunload', reportCLS);

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          fcpObserver.disconnect();
          window.removeEventListener('beforeunload', reportCLS);
        };
      } catch (error) {
        console.warn('Performance monitoring not available:', error);
        return () => {}; // Return empty cleanup function
      }
    }

    return () => {}; // Return empty cleanup function for other cases
  }, [onMetricsUpdate, reportToAnalytics]);

  return null; // This component doesn't render anything
}

// Hook for accessing performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  return {
    metrics,
    PerformanceObserver: () => (
      <PerformanceObserver onMetricsUpdate={setMetrics} />
    ),
  };
}

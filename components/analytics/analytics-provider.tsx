/**
 * Analytics Provider - React Context for Analytics Integration
 * Provides analytics, A/B testing, and performance monitoring throughout the app
 */

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { analytics } from '@/lib/analytics/analytics-client';
import { featureFlags } from '@/lib/ab-testing/feature-flags';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { deploymentManager } from '@/lib/rollout/deployment-manager';

interface AnalyticsContextType {
  analytics: typeof analytics;
  featureFlags: typeof featureFlags;
  performanceMonitor: typeof performanceMonitor;
  deploymentManager: typeof deploymentManager;
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  userId?: string;
  userProperties?: Record<string, any>;
}

export function AnalyticsProvider({ 
  children, 
  userId, 
  userProperties = {} 
}: AnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    // Initialize analytics with user data
    if (userId) {
      analytics.identify(userId);
      featureFlags.setUserId(userId);
    }

    // Set user properties
    Object.entries(userProperties).forEach(([key, value]) => {
      analytics.setUserProperty(key as any, value);
    });

    // Track initial page load
    analytics.track('app_initialized', {
      user_id: userId,
      has_user_id: !!userId,
      ...userProperties,
    });

    setIsInitialized(true);
  }, [userId, userProperties]);

  // Track page views on route changes
  useEffect(() => {
    const handleRouteChange = () => {
      analytics.track('page_view', {
        page: window.location.pathname,
        referrer: document.referrer,
      });
    };

    // Listen for route changes (Next.js specific)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const value: AnalyticsContextType = {
    analytics,
    featureFlags,
    performanceMonitor,
    deploymentManager,
    isInitialized,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics context
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}

// Specialized hooks for common use cases
export function useFeatureFlag(testKey: string) {
  const { featureFlags } = useAnalyticsContext();
  const [variant, setVariant] = React.useState<string | null>(null);
  const [config, setConfig] = React.useState<Record<string, any> | null>(null);

  useEffect(() => {
    const variantResult = featureFlags.getVariant(testKey);
    const configResult = featureFlags.getVariantConfig(testKey);
    
    setVariant(variantResult);
    setConfig(configResult);

    // Track exposure
    if (variantResult) {
      featureFlags.trackExposure(testKey, variantResult);
    }
  }, [testKey, featureFlags]);

  return { variant, config, isLoading: !variant && variant !== null };
}

export function useTrackEvent() {
  const { analytics } = useAnalyticsContext();
  
  return React.useCallback((event: string, properties?: Record<string, any>) => {
    analytics.track(event, properties);
  }, [analytics]);
}

export function usePerformanceTracking() {
  const { performanceMonitor } = useAnalyticsContext();
  
  return {
    startMeasure: performanceMonitor.startMeasure.bind(performanceMonitor),
    endMeasure: performanceMonitor.endMeasure.bind(performanceMonitor),
    trackCustomEvent: performanceMonitor.trackCustomEvent.bind(performanceMonitor),
  };
}

// HOC for automatic component tracking
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function AnalyticsWrappedComponent(props: P) {
    const { analytics } = useAnalyticsContext();
    
    useEffect(() => {
      const name = componentName || Component.displayName || Component.name || 'UnknownComponent';
      
      // Track component mount
      analytics.track('component_mounted', {
        component_name: name,
        timestamp: new Date().toISOString(),
      });

      // Track component unmount
      return () => {
        analytics.track('component_unmounted', {
          component_name: name,
          timestamp: new Date().toISOString(),
        });
      };
    }, [analytics]);

    return <Component {...props} />;
  };
}

// Component for tracking user interactions
interface TrackClickProps {
  event: string;
  properties?: Record<string, any>;
  children: ReactNode;
  className?: string;
}

export function TrackClick({ event, properties = {}, children, className }: TrackClickProps) {
  const trackEvent = useTrackEvent();
  
  const handleClick = (e: React.MouseEvent) => {
    trackEvent(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      target: (e.target as HTMLElement).tagName.toLowerCase(),
    });
  };

  return (
    <div className={className} onClick={handleClick}>
      {children}
    </div>
  );
}

// Component for A/B test variants
interface ABTestProps {
  testKey: string;
  children: (variant: string | null, config: Record<string, any> | null) => ReactNode;
  fallback?: ReactNode;
}

export function ABTest({ testKey, children, fallback }: ABTestProps) {
  const { variant, config, isLoading } = useFeatureFlag(testKey);
  
  if (isLoading) {
    return <>{fallback}</>;
  }
  
  return <>{children(variant, config)}</>;
}

// Component for performance boundary
interface PerformanceBoundaryProps {
  name: string;
  children: ReactNode;
}

export function PerformanceBoundary({ name, children }: PerformanceBoundaryProps) {
  const { startMeasure, endMeasure } = usePerformanceTracking();
  
  useEffect(() => {
    startMeasure(name);
    
    return () => {
      endMeasure(name);
    };
  }, [name, startMeasure, endMeasure]);
  
  return <>{children}</>;
}

export type { AnalyticsContextType };
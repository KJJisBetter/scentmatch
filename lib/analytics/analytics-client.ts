/**
 * Analytics Client - Production-ready analytics tracking
 * Supports Google Analytics 4, Mixpanel, and custom events
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  user_id?: string;
  session_id?: string;
}

interface UserProperties {
  user_id?: string;
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  quiz_completed?: boolean;
  collections_count?: number;
  mobile_user?: boolean;
  ab_test_groups?: Record<string, string>;
}

class AnalyticsClient {
  private isInitialized = false;
  private sessionId: string;
  private userId?: string;
  private userProperties: UserProperties = {};
  private eventQueue: AnalyticsEvent[] = [];
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    this.sessionId = this.generateSessionId();
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Google Analytics 4
      if (this.isProduction && process.env.NEXT_PUBLIC_GA4_ID) {
        await this.initializeGA4();
      }

      // Initialize Mixpanel for detailed user analytics
      if (this.isProduction && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
        await this.initializeMixpanel();
      }

      // Set initial user properties
      this.setUserProperty('mobile_user', this.isMobileDevice());
      this.setUserProperty('session_start', new Date().toISOString());

      this.isInitialized = true;
      this.flushEventQueue();
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }

  private async initializeGA4() {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // @ts-ignore
    window.dataLayer = window.dataLayer || [];
    // @ts-ignore
    window.gtag = function() { dataLayer.push(arguments); };
    // @ts-ignore
    gtag('js', new Date());
    // @ts-ignore
    gtag('config', process.env.NEXT_PUBLIC_GA4_ID);
  }

  private async initializeMixpanel() {
    // Import Mixpanel dynamically to avoid SSR issues
    const mixpanel = await import('mixpanel-browser');
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!);
  }

  private isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }

  private flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      this.sendEvent(event);
    }
  }

  private async sendEvent(event: AnalyticsEvent) {
    try {
      // Add session and user context
      const enrichedEvent = {
        ...event,
        properties: {
          ...event.properties,
          session_id: this.sessionId,
          user_id: this.userId,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          user_agent: navigator.userAgent,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          ...this.userProperties,
        },
      };

      // Send to Google Analytics 4
      if (this.isProduction && typeof window !== 'undefined' && window.gtag) {
        // @ts-ignore
        gtag('event', event.event, enrichedEvent.properties);
      }

      // Send to Mixpanel
      if (this.isProduction && typeof window !== 'undefined') {
        try {
          const mixpanel = await import('mixpanel-browser');
          mixpanel.track(event.event, enrichedEvent.properties);
        } catch (error) {
          console.debug('Mixpanel not available:', error);
        }
      }

      // Send to custom analytics endpoint for detailed tracking
      if (this.isProduction) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enrichedEvent),
        }).catch(error => console.debug('Custom analytics failed:', error));
      }

      // Development logging
      if (!this.isProduction) {
        console.log('📊 Analytics Event:', enrichedEvent);
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  // Public API
  public track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      user_id: this.userId,
      session_id: this.sessionId,
    };

    if (this.isInitialized) {
      this.sendEvent(analyticsEvent);
    } else {
      this.eventQueue.push(analyticsEvent);
    }
  }

  public identify(userId: string) {
    this.userId = userId;
    this.setUserProperty('user_id', userId);
  }

  public setUserProperty(key: keyof UserProperties, value: any) {
    this.userProperties[key] = value;
  }

  public getUserProperty(key: keyof UserProperties) {
    return this.userProperties[key];
  }

  // Mobile-first UX specific tracking
  public trackBottomNavClick(tab: string) {
    this.track('bottom_nav_click', {
      tab,
      navigation_type: 'bottom_nav',
      is_mobile: this.isMobileDevice(),
    });
  }

  public trackQuizStart() {
    this.track('quiz_started', {
      source: 'mobile_bottom_nav',
      is_mobile: this.isMobileDevice(),
    });
  }

  public trackCollectionSave(fragranceId: string) {
    this.track('collection_save', {
      fragrance_id: fragranceId,
      source: 'mobile_interface',
      is_mobile: this.isMobileDevice(),
    });
  }

  public trackPerformanceMetric(metric: string, value: number) {
    this.track('performance_metric', {
      metric,
      value,
      is_mobile: this.isMobileDevice(),
      viewport_width: window.innerWidth,
    });
  }
}

// Singleton instance
export const analytics = new AnalyticsClient();

// React hook for analytics
import { useEffect } from 'react';

export function useAnalytics() {
  useEffect(() => {
    // Track page view
    analytics.track('page_view', {
      page: window.location.pathname,
      is_mobile: analytics.getUserProperty('mobile_user'),
    });
  }, []);

  return analytics;
}

// Export types for TypeScript support
export type { AnalyticsEvent, UserProperties };
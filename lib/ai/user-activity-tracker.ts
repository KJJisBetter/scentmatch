/**
 * User Activity Tracker and Implicit Feedback Collection
 * 
 * Tracks user interactions across the application to build preference models
 * and provide real-time insights for the AI recommendation system.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

// Enhanced activity event types
export interface UserActivity {
  id?: string;
  user_id: string;
  session_id: string;
  activity_type: ActivityType;
  fragrance_id?: string;
  data: ActivityData;
  timestamp: number;
  client_timestamp: number;
  page_url?: string;
  user_agent?: string;
  viewport_size?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet';
}

export type ActivityType = 
  | 'page_view'
  | 'fragrance_view'
  | 'fragrance_rating'
  | 'fragrance_favorite'
  | 'collection_add'
  | 'collection_remove'
  | 'wishlist_add'
  | 'wishlist_remove'
  | 'search_query'
  | 'search_result_click'
  | 'filter_applied'
  | 'quiz_started'
  | 'quiz_completed'
  | 'recommendation_viewed'
  | 'recommendation_clicked'
  | 'recommendation_dismissed'
  | 'scroll_depth'
  | 'time_on_page'
  | 'button_click'
  | 'link_click'
  | 'form_interaction'
  | 'error_encountered'
  | 'feature_usage';

export interface ActivityData {
  // Common fields
  duration?: number;
  engagement_score?: number;
  
  // Page/view specific
  page_title?: string;
  referrer?: string;
  scroll_depth?: number;
  exit_intent?: boolean;
  
  // Fragrance specific
  fragrance_name?: string;
  brand?: string;
  scent_family?: string[];
  rating?: number;
  review_text?: string;
  
  // Search specific
  query?: string;
  results_count?: number;
  selected_result_position?: number;
  filters_applied?: Record<string, any>;
  
  // Interaction specific
  element_id?: string;
  element_type?: string;
  click_position?: { x: number; y: number };
  
  // Context
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  day_of_week?: string;
  weather?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  
  // Technical
  load_time?: number;
  error_message?: string;
  feature_name?: string;
  
  // Additional metadata
  [key: string]: any;
}

export interface ImplicitFeedback {
  user_id: string;
  fragrance_id: string;
  feedback_type: 'positive' | 'negative' | 'neutral';
  confidence: number;
  signals: ImplicitSignal[];
  aggregated_at: number;
}

export interface ImplicitSignal {
  signal_type: 'view_duration' | 'return_visits' | 'share_action' | 'save_action' | 'search_after_view' | 'similar_views';
  value: number;
  weight: number;
  timestamp: number;
}

export interface SessionMetrics {
  session_id: string;
  user_id: string;
  start_time: number;
  end_time?: number;
  total_duration?: number;
  page_views: number;
  fragrance_views: number;
  interactions: number;
  scroll_depth_avg: number;
  engagement_events: number;
  conversion_events: number;
  bounce?: boolean;
  exit_page?: string;
  referrer_type?: 'direct' | 'search' | 'social' | 'referral';
  device_info: {
    type: 'desktop' | 'mobile' | 'tablet';
    screen_size: string;
    browser: string;
    os: string;
  };
  preferences_detected?: string[];
  intent_signals?: string[];
}

/**
 * Client-side Activity Tracker
 * Captures user interactions in the browser
 */
export class ClientActivityTracker {
  private sessionId: string;
  private userId: string | null = null;
  private isTracking = false;
  private activityQueue: UserActivity[] = [];
  private sessionMetrics: Partial<SessionMetrics>;
  private lastActivityTime = Date.now();
  private pageStartTime = Date.now();
  private scrollDepth = 0;
  private interactionCount = 0;

  // Configuration
  private config = {
    batchSize: 10,
    flushInterval: 5000, // 5 seconds
    sessionTimeout: 1800000, // 30 minutes
    heartbeatInterval: 30000, // 30 seconds
    enableScrollTracking: true,
    enableClickTracking: true,
    enableFormTracking: true,
    enableErrorTracking: true,
    minViewDuration: 1000, // 1 second minimum
    scrollThreshold: 0.25 // Track at 25% intervals
  };

  private flushTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.userId = userId || null;
    this.sessionMetrics = {
      session_id: this.sessionId,
      user_id: this.userId || undefined,
      start_time: Date.now(),
      page_views: 0,
      fragrance_views: 0,
      interactions: 0,
      scroll_depth_avg: 0,
      engagement_events: 0,
      conversion_events: 0,
      device_info: this.getDeviceInfo()
    };

    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private getDeviceInfo() {
    const ua = navigator.userAgent;
    const screenSize = `${screen.width}x${screen.height}`;
    
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/Mobile|Android|iPhone/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/iPad|Tablet/i.test(ua)) {
      deviceType = 'tablet';
    }

    return {
      type: deviceType,
      screen_size: screenSize,
      browser: this.getBrowserName(ua),
      os: this.getOSName(ua)
    };
  }

  private getBrowserName(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.sessionMetrics.user_id = userId;
  }

  startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.setupEventListeners();
    this.startPeriodicFlush();
    this.startHeartbeat();
    
    // Track initial page view
    this.trackPageView();
  }

  stopTracking(): void {
    this.isTracking = false;
    this.removeEventListeners();
    this.stopPeriodicFlush();
    this.stopHeartbeat();
    this.flushQueue();
    this.endSession();
  }

  private initializeTracking(): void {
    // Auto-start tracking when page loads
    if (typeof window !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.startTracking());
      } else {
        this.startTracking();
      }

      // Handle page unload
      window.addEventListener('beforeunload', () => this.stopTracking());
      window.addEventListener('pagehide', () => this.stopTracking());
    }
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Scroll tracking
    if (this.config.enableScrollTracking) {
      window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    // Click tracking
    if (this.config.enableClickTracking) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    // Form tracking
    if (this.config.enableFormTracking) {
      document.addEventListener('submit', this.handleFormSubmit.bind(this), true);
      document.addEventListener('input', this.handleFormInput.bind(this), true);
    }

    // Error tracking
    if (this.config.enableErrorTracking) {
      window.addEventListener('error', this.handleError.bind(this));
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    }

    // Visibility change
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  private removeEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    document.removeEventListener('submit', this.handleFormSubmit.bind(this));
    document.removeEventListener('input', this.handleFormInput.bind(this));
    window.removeEventListener('error', this.handleError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  // Event Handlers
  private handleScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScrollDepth = scrollTop / scrollHeight;

    if (currentScrollDepth > this.scrollDepth) {
      this.scrollDepth = currentScrollDepth;
      
      // Track significant scroll milestones
      const milestones = [0.25, 0.5, 0.75, 0.9];
      for (const milestone of milestones) {
        if (currentScrollDepth >= milestone && this.scrollDepth < milestone) {
          this.trackActivity('scroll_depth', {
            scroll_depth: milestone,
            page_url: window.location.href
          });
        }
      }
    }
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    this.interactionCount++;
    this.sessionMetrics.interactions = this.interactionCount;

    const data: ActivityData = {
      element_type: target.tagName.toLowerCase(),
      element_id: target.id || undefined,
      click_position: { x: event.clientX, y: event.clientY },
      page_url: window.location.href
    };

    // Special handling for fragrance-related clicks
    if (target.closest('[data-fragrance-id]')) {
      const fragranceId = target.closest('[data-fragrance-id]')?.getAttribute('data-fragrance-id');
      if (fragranceId) {
        this.trackFragranceInteraction('fragrance_view', fragranceId, data);
        return;
      }
    }

    // Track recommendation clicks
    if (target.closest('[data-recommendation-id]')) {
      const recId = target.closest('[data-recommendation-id]')?.getAttribute('data-recommendation-id');
      this.trackActivity('recommendation_clicked', { ...data, recommendation_id: recId });
      return;
    }

    // Track general button/link clicks
    if (target.matches('button, a, [role="button"]')) {
      this.trackActivity('button_click', data);
    }
  }

  private handleFormSubmit(event: SubmitEvent): void {
    const form = event.target as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const data: ActivityData = {
      element_type: 'form',
      element_id: form.id || undefined,
      form_action: form.action,
      form_method: form.method,
      field_count: formData.size
    };

    // Special handling for search forms
    if (form.matches('[data-search-form]') || form.querySelector('input[type="search"]')) {
      const searchInput = form.querySelector('input[type="search"], input[name*="search"], input[name*="query"]') as HTMLInputElement;
      if (searchInput?.value) {
        this.trackActivity('search_query', {
          ...data,
          query: searchInput.value,
          query_length: searchInput.value.length
        });
      }
    } else {
      this.trackActivity('form_interaction', data);
    }
  }

  private handleFormInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input || input.type === 'password') return;

    // Track significant form interactions (but not every keystroke)
    if (['select', 'radio', 'checkbox'].includes(input.type)) {
      this.trackActivity('form_interaction', {
        element_type: input.type,
        element_id: input.id || undefined,
        element_name: input.name || undefined,
        value: input.value
      });
    }
  }

  private handleError(event: ErrorEvent): void {
    this.trackActivity('error_encountered', {
      error_message: event.message,
      error_filename: event.filename,
      error_line: event.lineno,
      error_column: event.colno,
      page_url: window.location.href
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.trackActivity('error_encountered', {
      error_message: event.reason?.toString() || 'Unhandled promise rejection',
      error_type: 'promise_rejection',
      page_url: window.location.href
    });
  }

  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Page became hidden - track time spent
      const timeOnPage = Date.now() - this.pageStartTime;
      if (timeOnPage > this.config.minViewDuration) {
        this.trackActivity('time_on_page', {
          duration: timeOnPage,
          page_url: window.location.href,
          exit_intent: true
        });
      }
    } else {
      // Page became visible again
      this.pageStartTime = Date.now();
    }
  }

  // Public tracking methods
  trackPageView(pageTitle?: string): void {
    if (!this.isTracking) return;

    this.sessionMetrics.page_views = (this.sessionMetrics.page_views || 0) + 1;
    this.pageStartTime = Date.now();

    this.trackActivity('page_view', {
      page_title: pageTitle || document.title,
      page_url: window.location.href,
      referrer: document.referrer,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`
    });
  }

  trackFragranceView(fragranceId: string, fragranceData?: any): void {
    if (!this.isTracking) return;

    this.sessionMetrics.fragrance_views = (this.sessionMetrics.fragrance_views || 0) + 1;

    this.trackFragranceInteraction('fragrance_view', fragranceId, {
      fragrance_name: fragranceData?.name,
      brand: fragranceData?.brand,
      scent_family: fragranceData?.scent_family,
      view_start_time: Date.now(),
      page_url: window.location.href
    });
  }

  trackFragranceRating(fragranceId: string, rating: number, reviewText?: string): void {
    this.sessionMetrics.conversion_events = (this.sessionMetrics.conversion_events || 0) + 1;

    this.trackFragranceInteraction('fragrance_rating', fragranceId, {
      rating,
      review_text: reviewText,
      timestamp: Date.now()
    });
  }

  trackSearchQuery(query: string, resultsCount?: number, filters?: Record<string, any>): void {
    this.trackActivity('search_query', {
      query,
      query_length: query.length,
      results_count: resultsCount,
      filters_applied: filters,
      timestamp: Date.now()
    });
  }

  trackRecommendationInteraction(recommendationId: string, action: 'viewed' | 'clicked' | 'dismissed'): void {
    this.trackActivity(`recommendation_${action}` as ActivityType, {
      recommendation_id: recommendationId,
      timestamp: Date.now()
    });
  }

  trackFeatureUsage(featureName: string, context?: Record<string, any>): void {
    this.trackActivity('feature_usage', {
      feature_name: featureName,
      ...context,
      timestamp: Date.now()
    });
  }

  // Private tracking methods
  private trackActivity(type: ActivityType, data: ActivityData = {}, fragranceId?: string): void {
    if (!this.isTracking) return;

    const activity: UserActivity = {
      user_id: this.userId || 'anonymous',
      session_id: this.sessionId,
      activity_type: type,
      fragrance_id: fragranceId,
      data: {
        ...data,
        time_of_day: this.getTimeOfDay(),
        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        device_type: this.sessionMetrics.device_info?.type
      },
      timestamp: Date.now(),
      client_timestamp: Date.now(),
      page_url: data.page_url || (typeof window !== 'undefined' ? window.location.href : undefined),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      viewport_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : undefined,
      device_type: this.sessionMetrics.device_info?.type
    };

    this.activityQueue.push(activity);
    this.lastActivityTime = Date.now();

    // Update engagement metrics
    if (['fragrance_rating', 'collection_add', 'wishlist_add'].includes(type)) {
      this.sessionMetrics.engagement_events = (this.sessionMetrics.engagement_events || 0) + 1;
    }

    // Flush if queue is full
    if (this.activityQueue.length >= this.config.batchSize) {
      this.flushQueue();
    }
  }

  private trackFragranceInteraction(type: ActivityType, fragranceId: string, data: ActivityData): void {
    this.trackActivity(type, data, fragranceId);
  }

  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    if (hour < 22) return 'evening';
    return 'night';
  }

  // Queue management
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushQueue();
    }, this.config.flushInterval);
  }

  private stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      // Check if session is still active
      const timeSinceLastActivity = Date.now() - this.lastActivityTime;
      if (timeSinceLastActivity > this.config.sessionTimeout) {
        this.endSession();
        this.stopTracking();
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.activityQueue.length === 0) return;

    const activities = [...this.activityQueue];
    this.activityQueue = [];

    try {
      // Send to server (implementation depends on your backend)
      await this.sendActivitiesToServer(activities);
    } catch (error) {
      console.error('Failed to send activities:', error);
      // Re-queue failed activities
      this.activityQueue.unshift(...activities);
    }
  }

  private async sendActivitiesToServer(activities: UserActivity[]): Promise<void> {
    // Implementation would send activities to your backend
    // For now, just log them or store in localStorage for development
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('scentmatch_activities') || '[]');
      localStorage.setItem('scentmatch_activities', JSON.stringify([...existing, ...activities]));
    }
  }

  private endSession(): void {
    this.sessionMetrics.end_time = Date.now();
    this.sessionMetrics.total_duration = this.sessionMetrics.end_time - this.sessionMetrics.start_time!;
    this.sessionMetrics.scroll_depth_avg = this.scrollDepth;
    
    // Determine if this was a bounce (single page view, short duration)
    this.sessionMetrics.bounce = 
      this.sessionMetrics.page_views === 1 && 
      (this.sessionMetrics.total_duration || 0) < 30000; // Less than 30 seconds

    // Send final session metrics
    this.sendSessionMetrics();
  }

  private async sendSessionMetrics(): Promise<void> {
    try {
      // Send session metrics to server
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('scentmatch_sessions') || '[]');
        localStorage.setItem('scentmatch_sessions', JSON.stringify([...existing, this.sessionMetrics]));
      }
    } catch (error) {
      console.error('Failed to send session metrics:', error);
    }
  }

  // Public API
  getSessionMetrics(): Partial<SessionMetrics> {
    return {
      ...this.sessionMetrics,
      scroll_depth_avg: this.scrollDepth,
      interactions: this.interactionCount
    };
  }

  getQueuedActivities(): UserActivity[] {
    return [...this.activityQueue];
  }

  isActive(): boolean {
    return this.isTracking;
  }
}

/**
 * Server-side Activity Processor
 * Processes activities and generates implicit feedback
 */
export class ActivityProcessor {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    this.supabase = createClient<Database>(
      supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  async processActivityBatch(activities: UserActivity[]): Promise<void> {
    try {
      // Store activities in database
      const { error } = await this.supabase
        .from('user_activities')
        .insert(activities);

      if (error) throw error;

      // Process implicit feedback
      await this.generateImplicitFeedback(activities);

    } catch (error) {
      console.error('Failed to process activity batch:', error);
      throw error;
    }
  }

  private async generateImplicitFeedback(activities: UserActivity[]): Promise<void> {
    const fragranceActivities = activities.filter(a => a.fragrance_id);
    
    for (const activity of fragranceActivities) {
      if (!activity.fragrance_id) continue;

      const feedback = await this.calculateImplicitFeedback(activity);
      if (feedback) {
        await this.storeImplicitFeedback(feedback);
      }
    }
  }

  private async calculateImplicitFeedback(activity: UserActivity): Promise<ImplicitFeedback | null> {
    if (!activity.fragrance_id) return null;

    const signals: ImplicitSignal[] = [];
    let overallConfidence = 0;
    let feedbackType: 'positive' | 'negative' | 'neutral' = 'neutral';

    // Analyze different signals
    switch (activity.activity_type) {
      case 'fragrance_view':
        if (activity.data.duration && activity.data.duration > 10000) { // > 10 seconds
          signals.push({
            signal_type: 'view_duration',
            value: activity.data.duration,
            weight: 0.3,
            timestamp: activity.timestamp
          });
          feedbackType = 'positive';
          overallConfidence += 0.3;
        }
        break;

      case 'fragrance_rating':
        if (activity.data.rating && activity.data.rating >= 4) {
          feedbackType = 'positive';
          overallConfidence += 0.8;
        } else if (activity.data.rating && activity.data.rating <= 2) {
          feedbackType = 'negative';
          overallConfidence += 0.8;
        }
        break;

      case 'collection_add':
      case 'wishlist_add':
        signals.push({
          signal_type: 'save_action',
          value: 1,
          weight: 0.7,
          timestamp: activity.timestamp
        });
        feedbackType = 'positive';
        overallConfidence += 0.7;
        break;
    }

    if (signals.length === 0 && overallConfidence === 0) return null;

    return {
      user_id: activity.user_id,
      fragrance_id: activity.fragrance_id,
      feedback_type: feedbackType,
      confidence: Math.min(overallConfidence, 1.0),
      signals,
      aggregated_at: Date.now()
    };
  }

  private async storeImplicitFeedback(feedback: ImplicitFeedback): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('implicit_feedback')
        .upsert({
          user_id: feedback.user_id,
          fragrance_id: feedback.fragrance_id,
          feedback_type: feedback.feedback_type,
          confidence: feedback.confidence,
          signals: feedback.signals,
          aggregated_at: new Date(feedback.aggregated_at).toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to store implicit feedback:', error);
    }
  }

  async getSessionAnalytics(sessionId: string): Promise<SessionMetrics | null> {
    try {
      const { data: activities, error } = await this.supabase
        .from('user_activities')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      if (!activities || activities.length === 0) return null;

      // Calculate session metrics from activities
      const firstActivity = activities[0];
      const lastActivity = activities[activities.length - 1];
      
      return {
        session_id: sessionId,
        user_id: firstActivity.user_id,
        start_time: firstActivity.timestamp,
        end_time: lastActivity.timestamp,
        total_duration: lastActivity.timestamp - firstActivity.timestamp,
        page_views: activities.filter(a => a.activity_type === 'page_view').length,
        fragrance_views: activities.filter(a => a.activity_type === 'fragrance_view').length,
        interactions: activities.filter(a => 
          ['fragrance_rating', 'collection_add', 'search_query'].includes(a.activity_type)
        ).length,
        scroll_depth_avg: this.calculateAverageScrollDepth(activities),
        engagement_events: activities.filter(a => 
          ['fragrance_rating', 'collection_add', 'wishlist_add'].includes(a.activity_type)
        ).length,
        conversion_events: activities.filter(a => 
          ['fragrance_rating', 'collection_add'].includes(a.activity_type)
        ).length,
        device_info: {
          type: firstActivity.device_type || 'desktop',
          screen_size: firstActivity.viewport_size || '',
          browser: this.extractBrowserFromUA(firstActivity.user_agent || ''),
          os: this.extractOSFromUA(firstActivity.user_agent || '')
        }
      };

    } catch (error) {
      console.error('Failed to get session analytics:', error);
      return null;
    }
  }

  private calculateAverageScrollDepth(activities: UserActivity[]): number {
    const scrollEvents = activities.filter(a => a.activity_type === 'scroll_depth');
    if (scrollEvents.length === 0) return 0;

    const totalDepth = scrollEvents.reduce((sum, event) => 
      sum + (event.data.scroll_depth || 0), 0
    );
    
    return totalDepth / scrollEvents.length;
  }

  private extractBrowserFromUA(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private extractOSFromUA(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  async getUserPreferenceProfile(userId: string): Promise<any> {
    try {
      // Get implicit feedback
      const { data: feedback, error } = await this.supabase
        .from('implicit_feedback')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Analyze feedback to build preference profile
      const preferences = {
        preferred_scent_families: [],
        preferred_brands: [],
        interaction_patterns: {},
        engagement_level: 'medium',
        last_updated: Date.now()
      };

      // This would contain more sophisticated analysis
      return preferences;

    } catch (error) {
      console.error('Failed to get user preference profile:', error);
      return null;
    }
  }
}

// Export singleton instance for client-side use
let trackerInstance: ClientActivityTracker | null = null;

export const getActivityTracker = (userId?: string): ClientActivityTracker => {
  if (!trackerInstance) {
    trackerInstance = new ClientActivityTracker(userId);
  } else if (userId && !trackerInstance.isActive()) {
    trackerInstance.setUserId(userId);
  }
  return trackerInstance;
};

export const createActivityProcessor = () => new ActivityProcessor();
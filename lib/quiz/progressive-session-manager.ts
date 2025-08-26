'use client';

import { GuestSessionManager } from './guest-session-manager';

interface SessionMetrics {
  session_token: string;
  start_time: number;
  quiz_completed_time?: number;
  total_time_spent: number;
  engagement_score: number;
  interaction_count: number;
  page_views: string[];
  conversion_attempts: number;
}

interface ProgressiveSessionData {
  quiz_results?: any;
  engagement_history: any[];
  investment_milestones: string[];
  conversion_readiness_score: number;
  session_metrics: SessionMetrics;
}

/**
 * Progressive Session Manager for Quiz Conversion Flow
 * 
 * Manages client-side session state for the progressive conversion experience.
 * Handles temporary storage, engagement tracking, and session persistence
 * across browser refreshes for 24-hour guest sessions.
 */
export class ProgressiveSessionManager {
  private sessionKey = 'scentmatch_progressive_session';
  private metricsKey = 'scentmatch_session_metrics';
  private engagementKey = 'scentmatch_engagement_buffer';
  private sessionData: ProgressiveSessionData | null = null;
  private eventBuffer: any[] = [];
  private autoSaveInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeSession();
    this.startAutoSave();
  }

  /**
   * Initialize session from localStorage or create new one
   */
  private initializeSession(): void {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (stored) {
        this.sessionData = JSON.parse(stored);
        this.validateSessionExpiry();
      } else {
        this.createNewSession();
      }

      // Load any buffered engagement events
      const bufferedEvents = localStorage.getItem(this.engagementKey);
      if (bufferedEvents) {
        this.eventBuffer = JSON.parse(bufferedEvents);
      }
    } catch (error) {
      console.error('Error initializing progressive session:', error);
      this.createNewSession();
    }
  }

  /**
   * Create new progressive session
   */
  private createNewSession(): void {
    const sessionToken = this.generateSessionToken();
    
    this.sessionData = {
      engagement_history: [],
      investment_milestones: [],
      conversion_readiness_score: 0,
      session_metrics: {
        session_token: sessionToken,
        start_time: Date.now(),
        total_time_spent: 0,
        engagement_score: 0,
        interaction_count: 0,
        page_views: ['/quiz'],
        conversion_attempts: 0
      }
    };

    this.persistSession();
  }

  /**
   * Store quiz results with progressive metadata
   */
  storeQuizResults(results: any): void {
    if (!this.sessionData) return;

    this.sessionData.quiz_results = {
      ...results,
      stored_at: Date.now(),
      progressive_session_token: this.sessionData.session_metrics.session_token
    };

    this.sessionData.session_metrics.quiz_completed_time = Date.now();
    this.addInvestmentMilestone('quiz_completed');
    this.incrementEngagementScore(0.3); // Base score for completing quiz

    this.persistSession();
  }

  /**
   * Track engagement event with progressive scoring
   */
  trackEngagement(event: {
    type: string;
    value?: any;
    context?: string;
    timestamp?: number;
  }): void {
    if (!this.sessionData) return;

    const enhancedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      session_token: this.sessionData.session_metrics.session_token
    };

    this.sessionData.engagement_history.push(enhancedEvent);
    this.sessionData.session_metrics.interaction_count++;
    
    // Calculate progressive engagement impact
    const engagementImpact = this.calculateEngagementImpact(event.type);
    this.incrementEngagementScore(engagementImpact);

    // Check for investment milestones
    this.checkInvestmentMilestones(event);

    // Buffer for server sync
    this.eventBuffer.push(enhancedEvent);
    localStorage.setItem(this.engagementKey, JSON.stringify(this.eventBuffer));

    this.persistSession();
  }

  /**
   * Get current investment/engagement score
   */
  getEngagementScore(): number {
    return this.sessionData?.session_metrics.engagement_score || 0;
  }

  /**
   * Get conversion readiness assessment
   */
  getConversionReadiness(): {
    score: number;
    readiness_level: 'low' | 'medium' | 'high';
    recommended_action: string;
    investment_indicators: string[];
  } {
    const score = this.getEngagementScore();
    const timeSpent = this.getTimeSpentMinutes();
    const interactionCount = this.sessionData?.session_metrics.interaction_count || 0;
    const milestones = this.sessionData?.investment_milestones || [];

    let readinessLevel: 'low' | 'medium' | 'high' = 'low';
    let recommendedAction = 'continue_exploration';

    if (score >= 0.7 || (score >= 0.5 && timeSpent >= 5)) {
      readinessLevel = 'high';
      recommendedAction = 'offer_soft_conversion';
    } else if (score >= 0.4 || interactionCount >= 3) {
      readinessLevel = 'medium';
      recommendedAction = 'build_investment';
    }

    return {
      score,
      readiness_level: readinessLevel,
      recommended_action: recommendedAction,
      investment_indicators: milestones
    };
  }

  /**
   * Track conversion attempt
   */
  trackConversionAttempt(type: 'offered' | 'accepted' | 'declined' | 'deferred'): void {
    if (!this.sessionData) return;

    this.sessionData.session_metrics.conversion_attempts++;
    this.trackEngagement({
      type: 'conversion_attempt',
      value: type,
      context: 'progressive_flow'
    });

    if (type === 'accepted') {
      this.addInvestmentMilestone('conversion_accepted');
    }
  }

  /**
   * Get session metrics for analytics
   */
  getSessionMetrics(): SessionMetrics | null {
    if (!this.sessionData) return null;

    // Update time spent
    this.sessionData.session_metrics.total_time_spent = 
      Date.now() - this.sessionData.session_metrics.start_time;

    return this.sessionData.session_metrics;
  }

  /**
   * Get buffered engagement events for server sync
   */
  getBufferedEvents(): any[] {
    return [...this.eventBuffer];
  }

  /**
   * Clear buffered events after successful sync
   */
  clearEventBuffer(): void {
    this.eventBuffer = [];
    localStorage.removeItem(this.engagementKey);
  }

  /**
   * Track page navigation for session continuity
   */
  trackPageView(path: string): void {
    if (!this.sessionData) return;

    if (!this.sessionData.session_metrics.page_views.includes(path)) {
      this.sessionData.session_metrics.page_views.push(path);
      this.trackEngagement({
        type: 'page_view',
        value: path,
        context: 'navigation'
      });
    }
  }

  /**
   * Check if session is still valid (24 hours)
   */
  isSessionValid(): boolean {
    if (!this.sessionData) return false;
    
    const sessionAge = Date.now() - this.sessionData.session_metrics.start_time;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    return sessionAge < maxAge;
  }

  /**
   * Get time spent in session (minutes)
   */
  getTimeSpentMinutes(): number {
    if (!this.sessionData) return 0;
    
    const timeSpent = Date.now() - this.sessionData.session_metrics.start_time;
    return Math.floor(timeSpent / (1000 * 60));
  }

  /**
   * Clean up session and stop auto-save
   */
  cleanup(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  // Private helper methods

  private validateSessionExpiry(): void {
    if (!this.isSessionValid()) {
      this.createNewSession();
    }
  }

  private persistSession(): void {
    if (this.sessionData) {
      localStorage.setItem(this.sessionKey, JSON.stringify(this.sessionData));
    }
  }

  private generateSessionToken(): string {
    return `progressive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoSave(): void {
    // Auto-save every 30 seconds
    this.autoSaveInterval = setInterval(() => {
      this.persistSession();
    }, 30000);
  }

  private calculateEngagementImpact(eventType: string): number {
    const impactScores: Record<string, number> = {
      'fragrance_detail_view': 0.15,
      'favorite_added': 0.25,
      'comparison_view': 0.10,
      'sample_interest': 0.30,
      'share_intent': 0.20,
      'time_milestone': 0.05,
      'page_view': 0.02,
      'scroll_depth': 0.03,
      'filter_usage': 0.08
    };

    return impactScores[eventType] || 0.01;
  }

  private incrementEngagementScore(increment: number): void {
    if (!this.sessionData) return;
    
    this.sessionData.session_metrics.engagement_score = Math.min(
      this.sessionData.session_metrics.engagement_score + increment,
      1.0 // Cap at 1.0
    );

    // Update conversion readiness
    this.sessionData.conversion_readiness_score = 
      this.sessionData.session_metrics.engagement_score;
  }

  private addInvestmentMilestone(milestone: string): void {
    if (!this.sessionData) return;
    
    if (!this.sessionData.investment_milestones.includes(milestone)) {
      this.sessionData.investment_milestones.push(milestone);
    }
  }

  private checkInvestmentMilestones(event: any): void {
    const timeSpent = this.getTimeSpentMinutes();
    const interactionCount = this.sessionData?.session_metrics.interaction_count || 0;

    // Time-based milestones
    if (timeSpent >= 2 && !this.sessionData?.investment_milestones.includes('time_invested_2min')) {
      this.addInvestmentMilestone('time_invested_2min');
    }
    
    if (timeSpent >= 5 && !this.sessionData?.investment_milestones.includes('time_invested_5min')) {
      this.addInvestmentMilestone('time_invested_5min');
    }

    // Interaction-based milestones
    if (interactionCount >= 5 && !this.sessionData?.investment_milestones.includes('high_interaction')) {
      this.addInvestmentMilestone('high_interaction');
    }

    // Event-specific milestones
    if (event.type === 'favorite_added' && !this.sessionData?.investment_milestones.includes('first_favorite')) {
      this.addInvestmentMilestone('first_favorite');
    }
  }
}

/**
 * Global instance for session management
 */
let progressiveSessionManager: ProgressiveSessionManager | null = null;

export function getProgressiveSessionManager(): ProgressiveSessionManager {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {} as ProgressiveSessionManager;
  }

  if (!progressiveSessionManager) {
    progressiveSessionManager = new ProgressiveSessionManager();
  }

  return progressiveSessionManager;
}

/**
 * Hook for React components to use progressive session
 */
export function useProgressiveSession() {
  const manager = getProgressiveSessionManager();

  return {
    trackEngagement: (event: any) => manager.trackEngagement(event),
    getEngagementScore: () => manager.getEngagementScore(),
    getConversionReadiness: () => manager.getConversionReadiness(),
    trackPageView: (path: string) => manager.trackPageView(path),
    trackConversionAttempt: (type: any) => manager.trackConversionAttempt(type),
    getSessionMetrics: () => manager.getSessionMetrics(),
    storeQuizResults: (results: any) => manager.storeQuizResults(results),
    isSessionValid: () => manager.isSessionValid(),
    getTimeSpentMinutes: () => manager.getTimeSpentMinutes()
  };
}
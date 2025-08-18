'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GuestSessionData {
  experience_level?: 'beginner' | 'enthusiast' | 'collector';
  gender_preference?: 'women' | 'men' | 'unisex' | 'all';
  quiz_responses?: Array<{
    question_id: string;
    answer_value: string;
    answer_metadata?: Record<string, any>;
    timestamp: string;
  }>;
  favorite_fragrances?: Array<{
    id: string;
    name: string;
    brand: string;
    popularity_score?: number;
    accords?: string[];
    rating?: number;
  }>;
  ai_profile?: {
    profile_name: string;
    style_descriptor: string;
    description: {
      paragraph_1: string;
      paragraph_2: string;
      paragraph_3: string;
    };
    uniqueness_score: number;
    personality_insights: string[];
  };
  preferences?: {
    accords?: string[];
    occasions?: string[];
    seasons?: string[];
    intensity?: 'light' | 'moderate' | 'strong';
  };
  interaction_history?: Array<{
    action: string;
    target: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  session_metadata?: {
    session_id: string;
    started_at: string;
    last_updated: string;
    completion_percentage: number;
    time_spent_seconds: number;
  };
}

/**
 * Custom Hook for Managing Guest Session Data
 *
 * Provides seamless data persistence and retrieval for guest quiz sessions
 * with automatic synchronization and conversion preparation.
 */
export function useGuestSession() {
  const [sessionData, setSessionData] = useState<GuestSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState(() => generateSessionId());

  // Initialize session data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('guest_quiz_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSessionData({
          ...parsed,
          session_metadata: {
            ...parsed.session_metadata,
            session_id: sessionId,
          },
        });
      } else {
        // Initialize new session
        const newSession: GuestSessionData = {
          session_metadata: {
            session_id: sessionId,
            started_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            completion_percentage: 0,
            time_spent_seconds: 0,
          },
        };
        setSessionData(newSession);
        localStorage.setItem('guest_quiz_session', JSON.stringify(newSession));
      }
    } catch (error) {
      console.error('Failed to load guest session data:', error);
      setSessionData(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Update session data with automatic persistence
  const updateSession = useCallback((updates: Partial<GuestSessionData>) => {
    setSessionData(prevData => {
      if (!prevData) return null;

      const updatedData = {
        ...prevData,
        ...updates,
        session_metadata: {
          ...prevData.session_metadata!,
          last_updated: new Date().toISOString(),
          completion_percentage: calculateCompletionPercentage({
            ...prevData,
            ...updates,
          }),
        },
      };

      // Persist to localStorage
      try {
        localStorage.setItem('guest_quiz_session', JSON.stringify(updatedData));
      } catch (error) {
        console.error('Failed to persist guest session data:', error);
      }

      return updatedData;
    });
  }, []);

  // Add quiz response
  const addQuizResponse = useCallback(
    (response: {
      question_id: string;
      answer_value: string;
      answer_metadata?: Record<string, any>;
    }) => {
      const newResponse = {
        ...response,
        timestamp: new Date().toISOString(),
      };

      updateSession({
        quiz_responses: [...(sessionData?.quiz_responses || []), newResponse],
      });

      // Track quiz progress
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'quiz_response_added', {
          question_id: response.question_id,
          session_id: sessionId,
          total_responses: (sessionData?.quiz_responses?.length || 0) + 1,
        });
      }
    },
    [sessionData, sessionId, updateSession]
  );

  // Set experience level
  const setExperienceLevel = useCallback(
    (level: 'beginner' | 'enthusiast' | 'collector') => {
      updateSession({ experience_level: level });

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'experience_level_set', {
          experience_level: level,
          session_id: sessionId,
        });
      }
    },
    [sessionId, updateSession]
  );

  // Set gender preference
  const setGenderPreference = useCallback(
    (preference: 'women' | 'men' | 'unisex' | 'all') => {
      updateSession({ gender_preference: preference });

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'gender_preference_set', {
          gender_preference: preference,
          session_id: sessionId,
        });
      }
    },
    [sessionId, updateSession]
  );

  // Add favorite fragrance
  const addFavoriteFragrance = useCallback(
    (fragrance: {
      id: string;
      name: string;
      brand: string;
      popularity_score?: number;
      accords?: string[];
      rating?: number;
    }) => {
      const currentFavorites = sessionData?.favorite_fragrances || [];

      // Avoid duplicates
      if (currentFavorites.find(f => f.id === fragrance.id)) {
        return;
      }

      updateSession({
        favorite_fragrances: [...currentFavorites, fragrance],
      });

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'favorite_fragrance_added', {
          fragrance_id: fragrance.id,
          fragrance_name: fragrance.name,
          brand: fragrance.brand,
          session_id: sessionId,
          total_favorites: currentFavorites.length + 1,
        });
      }
    },
    [sessionData, sessionId, updateSession]
  );

  // Remove favorite fragrance
  const removeFavoriteFragrance = useCallback(
    (fragranceId: string) => {
      const currentFavorites = sessionData?.favorite_fragrances || [];
      updateSession({
        favorite_fragrances: currentFavorites.filter(f => f.id !== fragranceId),
      });
    },
    [sessionData, updateSession]
  );

  // Set AI profile data
  const setAIProfile = useCallback(
    (profile: {
      profile_name: string;
      style_descriptor: string;
      description: {
        paragraph_1: string;
        paragraph_2: string;
        paragraph_3: string;
      };
      uniqueness_score: number;
      personality_insights: string[];
    }) => {
      updateSession({ ai_profile: profile });

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ai_profile_generated', {
          profile_name: profile.profile_name,
          uniqueness_score: profile.uniqueness_score,
          session_id: sessionId,
        });
      }
    },
    [sessionId, updateSession]
  );

  // Track interaction
  const trackInteraction = useCallback(
    (action: string, target: string, metadata?: Record<string, any>) => {
      const interaction = {
        action,
        target,
        timestamp: new Date().toISOString(),
        metadata,
      };

      updateSession({
        interaction_history: [
          ...(sessionData?.interaction_history || []),
          interaction,
        ],
      });
    },
    [sessionData, updateSession]
  );

  // Clear session data
  const clearSession = useCallback(() => {
    setSessionData(null);
    try {
      localStorage.removeItem('guest_quiz_session');
    } catch (error) {
      console.error('Failed to clear guest session data:', error);
    }
  }, []);

  // Get session quality score for conversion optimization
  const getSessionQuality = useCallback(() => {
    if (!sessionData) return 0;

    let quality = 0;
    if (sessionData.experience_level) quality += 0.2;
    if (sessionData.gender_preference) quality += 0.1;
    if (sessionData.quiz_responses && sessionData.quiz_responses.length >= 3)
      quality += 0.3;
    if (
      sessionData.favorite_fragrances &&
      sessionData.favorite_fragrances.length > 0
    )
      quality += 0.2;
    if (sessionData.ai_profile) quality += 0.2;

    return Math.round(quality * 100) / 100;
  }, [sessionData]);

  // Check if session is ready for conversion
  const isReadyForConversion = useCallback(() => {
    if (!sessionData) return false;

    return !!(
      sessionData.experience_level &&
      sessionData.quiz_responses &&
      sessionData.quiz_responses.length >= 2
    );
  }, [sessionData]);

  // Get conversion readiness score
  const getConversionReadiness = useCallback(() => {
    if (!sessionData) return 0;

    let readiness = 0;

    // Core requirements
    if (sessionData.experience_level) readiness += 0.3;
    if (sessionData.quiz_responses && sessionData.quiz_responses.length >= 2)
      readiness += 0.3;

    // Enhancement factors
    if (sessionData.ai_profile) readiness += 0.2;
    if (
      sessionData.favorite_fragrances &&
      sessionData.favorite_fragrances.length > 0
    )
      readiness += 0.15;
    if (sessionData.quiz_responses && sessionData.quiz_responses.length >= 4)
      readiness += 0.05;

    return Math.round(readiness * 100) / 100;
  }, [sessionData]);

  return {
    sessionData,
    isLoading,
    sessionId,

    // Core session management
    updateSession,
    clearSession,

    // Quiz data management
    addQuizResponse,
    setExperienceLevel,
    setGenderPreference,
    addFavoriteFragrance,
    removeFavoriteFragrance,
    setAIProfile,

    // Interaction tracking
    trackInteraction,

    // Conversion optimization
    getSessionQuality,
    isReadyForConversion,
    getConversionReadiness,
  };
}

/**
 * Generate Unique Session ID
 */
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate Session Completion Percentage
 */
function calculateCompletionPercentage(data: GuestSessionData): number {
  let completion = 0;

  if (data.experience_level) completion += 20;
  if (data.gender_preference) completion += 10;
  if (data.quiz_responses && data.quiz_responses.length >= 1) completion += 20;
  if (data.quiz_responses && data.quiz_responses.length >= 3) completion += 20;
  if (data.favorite_fragrances && data.favorite_fragrances.length > 0)
    completion += 15;
  if (data.ai_profile) completion += 15;

  return Math.min(completion, 100);
}

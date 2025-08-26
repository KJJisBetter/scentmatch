/**
 * Optimized Adaptive AI Hook
 * 
 * High-performance React hook for the adaptive AI explanation system
 * Includes caching, performance monitoring, and mobile optimizations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createOptimizedUnifiedEngine } from '@/lib/ai-sdk/performance-optimized-unified-engine';
import { createOptimizedExperienceDetector } from '@/lib/ai-sdk/performance-optimized-experience-detector';
import { optimizedAIClient } from '@/lib/ai-sdk/performance-optimized-client';
import { usePerformanceTracking } from '@/lib/performance/adaptive-ai-monitor';
import { createClientSupabase } from '@/lib/supabase/client';
import type { 
  UnifiedRecommendationRequest, 
  OptimizedRecommendationResult 
} from '@/lib/ai-sdk/performance-optimized-unified-engine';
import type { 
  UserExperienceLevel, 
  OptimizedExperienceAnalysis 
} from '@/lib/ai-sdk/performance-optimized-experience-detector';
import type { OptimizedExplanationResult } from '@/lib/ai-sdk/performance-optimized-client';

export interface AdaptiveAIState {
  // Loading states
  isAnalyzingExperience: boolean;
  isGeneratingRecommendations: boolean;
  isGeneratingExplanation: boolean;
  
  // Data
  experienceLevel: UserExperienceLevel;
  experienceAnalysis: OptimizedExperienceAnalysis | null;
  recommendations: OptimizedRecommendationResult | null;
  explanation: OptimizedExplanationResult | null;
  
  // Performance
  performanceScore: number;
  cacheHitRate: number;
  lastResponseTime: number;
  
  // Error handling
  error: string | null;
  hasError: boolean;
}

export interface AdaptiveAIActions {
  // Core actions
  analyzeUserExperience: (userId?: string, sessionData?: any) => Promise<OptimizedExperienceAnalysis>;
  generateRecommendations: (request: UnifiedRecommendationRequest) => Promise<OptimizedRecommendationResult>;
  generateExplanation: (
    fragranceId: string,
    fragranceDetails: string,
    userContext: string
  ) => Promise<OptimizedExplanationResult>;
  
  // Batch operations
  batchAnalyzeUsers: (userIds: string[]) => Promise<Map<string, OptimizedExperienceAnalysis>>;
  batchGenerateExplanations: (requests: any[]) => Promise<Map<string, OptimizedExplanationResult>>;
  
  // Performance utilities
  getPerformanceReport: () => any;
  clearCache: () => void;
  preloadEducationalContent: () => void;
  
  // State management
  reset: () => void;
  setExperienceLevel: (level: UserExperienceLevel) => void;
}

/**
 * Optimized adaptive AI hook with comprehensive performance features
 */
export function useOptimizedAdaptiveAI(userId?: string): AdaptiveAIState & AdaptiveAIActions {
  // State
  const [state, setState] = useState<AdaptiveAIState>({
    isAnalyzingExperience: false,
    isGeneratingRecommendations: false,
    isGeneratingExplanation: false,
    experienceLevel: 'beginner',
    experienceAnalysis: null,
    recommendations: null,
    explanation: null,
    performanceScore: 0,
    cacheHitRate: 0,
    lastResponseTime: 0,
    error: null,
    hasError: false,
  });

  // Refs for stable instances
  const supabase = useRef(createClientSupabase());
  const unifiedEngine = useRef(createOptimizedUnifiedEngine(supabase.current));
  const experienceDetector = useRef(createOptimizedExperienceDetector(supabase.current));
  
  // Performance tracking
  const { trackAI, trackInteraction, getReport } = usePerformanceTracking();

  // Error handling
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Adaptive AI Error (${context}):`, error);
    setState(prev => ({
      ...prev,
      error: error?.message || 'An unexpected error occurred',
      hasError: true,
    }));
  }, []);

  // Analyze user experience with caching and performance tracking
  const analyzeUserExperience = useCallback(async (
    targetUserId?: string,
    sessionData?: any
  ): Promise<OptimizedExperienceAnalysis> => {
    const startTime = performance.now();
    const userIdToAnalyze = targetUserId || userId;

    setState(prev => ({ 
      ...prev, 
      isAnalyzingExperience: true, 
      error: null, 
      hasError: false 
    }));

    try {
      const analysis = await experienceDetector.current.analyzeUserExperience(
        userIdToAnalyze,
        sessionData
      );

      // Track performance
      trackAI('experienceDetection', performance.now() - startTime, analysis.cachingUsed);

      setState(prev => ({
        ...prev,
        isAnalyzingExperience: false,
        experienceLevel: analysis.level,
        experienceAnalysis: analysis,
        lastResponseTime: analysis.processingTimeMs,
        cacheHitRate: analysis.cachingUsed ? 100 : prev.cacheHitRate,
      }));

      return analysis;

    } catch (error) {
      handleError(error, 'experience-analysis');
      setState(prev => ({ ...prev, isAnalyzingExperience: false }));
      
      // Return fallback beginner analysis
      const fallback: OptimizedExperienceAnalysis = {
        level: 'beginner',
        confidence: 0.9,
        indicators: {
          hasCompletedQuiz: false,
          collectionSize: 0,
          daysActive: 0,
          engagementScore: 0,
          fragranceKnowledgeSignals: [],
        },
        recommendedExplanationStyle: {
          maxWords: 35,
          complexity: 'simple',
          includeEducation: true,
          useProgressiveDisclosure: true,
          vocabularyLevel: 'basic',
        },
        cachingUsed: false,
        processingTimeMs: performance.now() - startTime,
        queryCount: 0,
      };

      return fallback;
    }
  }, [userId, trackAI, handleError]);

  // Generate recommendations with performance optimization
  const generateRecommendations = useCallback(async (
    request: UnifiedRecommendationRequest
  ): Promise<OptimizedRecommendationResult> => {
    const startTime = performance.now();

    setState(prev => ({ 
      ...prev, 
      isGeneratingRecommendations: true, 
      error: null, 
      hasError: false 
    }));

    try {
      const result = await unifiedEngine.current.generateOptimizedRecommendations({
        ...request,
        userId: request.userId || userId,
      });

      // Track performance
      trackAI('explanationGeneration', performance.now() - startTime, 
              result.caching.recommendationsCached);

      setState(prev => ({
        ...prev,
        isGeneratingRecommendations: false,
        recommendations: result,
        lastResponseTime: result.performance.totalProcessingTime,
        cacheHitRate: result.caching.cacheHitRate,
        performanceScore: result.confidence_score * 100,
      }));

      return result;

    } catch (error) {
      handleError(error, 'recommendation-generation');
      setState(prev => ({ ...prev, isGeneratingRecommendations: false }));
      throw error;
    }
  }, [userId, trackAI, handleError]);

  // Generate individual explanation with caching
  const generateExplanation = useCallback(async (
    fragranceId: string,
    fragranceDetails: string,
    userContext: string
  ): Promise<OptimizedExplanationResult> => {
    const startTime = performance.now();

    setState(prev => ({ 
      ...prev, 
      isGeneratingExplanation: true, 
      error: null, 
      hasError: false 
    }));

    try {
      let result: OptimizedExplanationResult;

      // Use experience level to determine explanation type
      if (state.experienceLevel === 'beginner') {
        result = await optimizedAIClient.explainForBeginnerOptimized(
          fragranceId,
          userContext,
          fragranceDetails
        );
      } else {
        const explanationStyle = state.experienceAnalysis?.recommendedExplanationStyle || {
          maxWords: 60,
          complexity: 'moderate' as const,
          includeEducation: false,
          useProgressiveDisclosure: true,
          vocabularyLevel: 'intermediate' as const,
        };

        result = await optimizedAIClient.explainRecommendationOptimized(
          fragranceId,
          userContext,
          fragranceDetails,
          state.experienceLevel,
          explanationStyle
        );
      }

      // Track performance
      trackAI('explanationGeneration', performance.now() - startTime, 
              result.performance.cacheHit);

      setState(prev => ({
        ...prev,
        isGeneratingExplanation: false,
        explanation: result,
        lastResponseTime: result.performance.responseTime,
        cacheHitRate: result.performance.cacheHit ? 100 : prev.cacheHitRate,
      }));

      return result;

    } catch (error) {
      handleError(error, 'explanation-generation');
      setState(prev => ({ ...prev, isGeneratingExplanation: false }));
      throw error;
    }
  }, [state.experienceLevel, state.experienceAnalysis, trackAI, handleError]);

  // Batch analyze multiple users
  const batchAnalyzeUsers = useCallback(async (
    userIds: string[]
  ): Promise<Map<string, OptimizedExperienceAnalysis>> => {
    const requests = userIds.map(id => ({ userId: id }));
    return await experienceDetector.current.batchAnalyzeUsers(requests);
  }, []);

  // Batch generate explanations
  const batchGenerateExplanations = useCallback(async (
    requests: any[]
  ): Promise<Map<string, OptimizedExplanationResult>> => {
    return await optimizedAIClient.batchExplainRecommendations(requests);
  }, []);

  // Get comprehensive performance report
  const getPerformanceReport = useCallback(() => {
    const report = getReport();
    const engineMetrics = unifiedEngine.current.getPerformanceMetrics();
    
    return {
      ...report,
      engine: engineMetrics,
      state: {
        experienceLevel: state.experienceLevel,
        hasExperienceAnalysis: !!state.experienceAnalysis,
        hasRecommendations: !!state.recommendations,
        lastResponseTime: state.lastResponseTime,
        cacheHitRate: state.cacheHitRate,
      },
    };
  }, [getReport, state]);

  // Clear all caches
  const clearCache = useCallback(() => {
    // This would need to be implemented in the cache manager
    console.log('Clearing adaptive AI caches...');
  }, []);

  // Preload educational content for performance
  const preloadEducationalContent = useCallback(() => {
    // This would preload common educational terms
    console.log('Preloading educational content...');
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isAnalyzingExperience: false,
      isGeneratingRecommendations: false,
      isGeneratingExplanation: false,
      experienceLevel: 'beginner',
      experienceAnalysis: null,
      recommendations: null,
      explanation: null,
      performanceScore: 0,
      cacheHitRate: 0,
      lastResponseTime: 0,
      error: null,
      hasError: false,
    });
  }, []);

  // Set experience level manually
  const setExperienceLevel = useCallback((level: UserExperienceLevel) => {
    setState(prev => ({ ...prev, experienceLevel: level }));
  }, []);

  // Auto-analyze experience on userId change
  useEffect(() => {
    if (userId && !state.experienceAnalysis) {
      analyzeUserExperience(userId);
    }
  }, [userId, state.experienceAnalysis, analyzeUserExperience]);

  // Track performance metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const report = getPerformanceReport();
      setState(prev => ({
        ...prev,
        performanceScore: report.score,
      }));
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [getPerformanceReport]);

  return {
    // State
    ...state,
    
    // Actions
    analyzeUserExperience,
    generateRecommendations,
    generateExplanation,
    batchAnalyzeUsers,
    batchGenerateExplanations,
    getPerformanceReport,
    clearCache,
    preloadEducationalContent,
    reset,
    setExperienceLevel,
  };
}

/**
 * Lightweight version for mobile or performance-critical scenarios
 */
export function useMobileOptimizedAdaptiveAI(userId?: string) {
  const fullHook = useOptimizedAdaptiveAI(userId);
  
  // Return only essential functionality for mobile
  return {
    // Essential state
    isLoading: fullHook.isAnalyzingExperience || 
               fullHook.isGeneratingRecommendations || 
               fullHook.isGeneratingExplanation,
    experienceLevel: fullHook.experienceLevel,
    recommendations: fullHook.recommendations,
    explanation: fullHook.explanation,
    error: fullHook.error,
    
    // Essential actions
    generateRecommendations: fullHook.generateRecommendations,
    generateExplanation: fullHook.generateExplanation,
    reset: fullHook.reset,
  };
}
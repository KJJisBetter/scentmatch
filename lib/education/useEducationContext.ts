"use client"

import { useState, useEffect, useCallback } from 'react';
import { UserEducationContext, EducationLevel } from './types';

const EDUCATION_STORAGE_KEY = 'scentmatch_education_context';

const DEFAULT_EDUCATION_CONTEXT: UserEducationContext = {
  is_beginner: true,
  experience_level: 'beginner',
  completed_tutorials: [],
  preferred_learning_style: 'tooltips',
  show_educational_content: true
};

/**
 * useEducationContext Hook
 * 
 * Manages user's educational context and preferences
 * for showing appropriate educational content throughout the app.
 */
export function useEducationContext() {
  const [context, setContext] = useState<UserEducationContext>(DEFAULT_EDUCATION_CONTEXT);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load education context from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(EDUCATION_STORAGE_KEY);
      if (stored) {
        const parsedContext = JSON.parse(stored);
        setContext(prevContext => ({
          ...DEFAULT_EDUCATION_CONTEXT,
          ...parsedContext
        }));
      }
    } catch (error) {
      console.warn('Failed to load education context:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save education context to localStorage
  const saveContext = useCallback((newContext: Partial<UserEducationContext>) => {
    const updatedContext = { ...context, ...newContext };
    setContext(updatedContext);
    
    try {
      localStorage.setItem(EDUCATION_STORAGE_KEY, JSON.stringify(updatedContext));
    } catch (error) {
      console.warn('Failed to save education context:', error);
    }
  }, [context]);

  // Update experience level
  const setExperienceLevel = useCallback((level: EducationLevel) => {
    const is_beginner = level === 'beginner';
    const show_educational_content = level !== 'advanced';
    
    saveContext({
      experience_level: level,
      is_beginner,
      show_educational_content
    });
  }, [saveContext]);

  // Mark tutorial as completed
  const completeTutorial = useCallback((tutorialId: string) => {
    const completed = [...context.completed_tutorials];
    if (!completed.includes(tutorialId)) {
      completed.push(tutorialId);
      saveContext({ completed_tutorials: completed });
    }
  }, [context.completed_tutorials, saveContext]);

  // Check if tutorial is completed
  const isTutorialCompleted = useCallback((tutorialId: string) => {
    return context.completed_tutorials.includes(tutorialId);
  }, [context.completed_tutorials]);

  // Toggle educational content visibility
  const toggleEducationalContent = useCallback(() => {
    saveContext({ show_educational_content: !context.show_educational_content });
  }, [context.show_educational_content, saveContext]);

  // Set learning style preference
  const setLearningStyle = useCallback((style: UserEducationContext['preferred_learning_style']) => {
    saveContext({ preferred_learning_style: style });
  }, [saveContext]);

  // Determine if user should see educational content
  const shouldShowEducation = useCallback((
    contentLevel: EducationLevel = 'beginner',
    forceShow: boolean = false
  ) => {
    if (forceShow) return true;
    if (!context.show_educational_content) return false;
    
    // Show beginner content to beginners and intermediates
    if (contentLevel === 'beginner') {
      return context.experience_level !== 'advanced';
    }
    
    // Show intermediate content to intermediates and advanced
    if (contentLevel === 'intermediate') {
      return context.experience_level !== 'beginner';
    }
    
    // Show advanced content only to advanced users
    return context.experience_level === 'advanced';
  }, [context]);

  // Get user-appropriate tooltip settings
  const getTooltipSettings = useCallback(() => {
    return {
      showDetailed: context.preferred_learning_style === 'detailed' || context.is_beginner,
      showConfidence: context.is_beginner,
      showExamples: context.preferred_learning_style === 'examples' || context.is_beginner
    };
  }, [context]);

  return {
    context,
    isLoaded,
    setExperienceLevel,
    completeTutorial,
    isTutorialCompleted,
    toggleEducationalContent,
    setLearningStyle,
    shouldShowEducation,
    getTooltipSettings,
    
    // Convenience getters
    isBeginnerMode: context.is_beginner,
    experienceLevel: context.experience_level,
    showEducationalContent: context.show_educational_content,
    learningStyle: context.preferred_learning_style
  };
}
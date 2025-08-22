/**
 * Tests for Education Context Hook
 * 
 * Ensures the education context properly manages user learning preferences
 * and provides appropriate educational content based on experience level.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEducationContext } from '@/lib/education/useEducationContext';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useEducationContext', () => {
  beforeEach(() => {
    localStorageMock.clear.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('initializes with default beginner context', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    expect(result.current.context).toEqual({
      is_beginner: true,
      experience_level: 'beginner',
      completed_tutorials: [],
      preferred_learning_style: 'tooltips',
      show_educational_content: true,
    });
    expect(result.current.isBeginnerMode).toBe(true);
    expect(result.current.experienceLevel).toBe('beginner');
    expect(result.current.showEducationalContent).toBe(true);
  });

  it('loads saved context from localStorage', () => {
    const savedContext = {
      is_beginner: false,
      experience_level: 'intermediate',
      completed_tutorials: ['concentration-basics'],
      preferred_learning_style: 'detailed',
      show_educational_content: true,
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedContext));
    
    const { result } = renderHook(() => useEducationContext());

    expect(result.current.context.experience_level).toBe('intermediate');
    expect(result.current.context.completed_tutorials).toEqual(['concentration-basics']);
    expect(result.current.context.preferred_learning_style).toBe('detailed');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    
    const { result } = renderHook(() => useEducationContext());

    // Should fallback to default context
    expect(result.current.context.experience_level).toBe('beginner');
    expect(result.current.isBeginnerMode).toBe(true);
  });

  it('updates experience level correctly', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    act(() => {
      result.current.setExperienceLevel('intermediate');
    });

    expect(result.current.context.experience_level).toBe('intermediate');
    expect(result.current.context.is_beginner).toBe(false);
    expect(result.current.context.show_educational_content).toBe(true);

    // Should save to localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'scentmatch_education_context',
      expect.stringContaining('"experience_level":"intermediate"')
    );
  });

  it('sets advanced users to hide educational content', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    act(() => {
      result.current.setExperienceLevel('advanced');
    });

    expect(result.current.context.experience_level).toBe('advanced');
    expect(result.current.context.is_beginner).toBe(false);
    expect(result.current.context.show_educational_content).toBe(false);
  });

  it('completes tutorials correctly', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    act(() => {
      result.current.completeTutorial('concentration-basics');
    });

    expect(result.current.context.completed_tutorials).toContain('concentration-basics');
    expect(result.current.isTutorialCompleted('concentration-basics')).toBe(true);
    expect(result.current.isTutorialCompleted('note-families')).toBe(false);

    // Should not add duplicate tutorials
    act(() => {
      result.current.completeTutorial('concentration-basics');
    });

    expect(result.current.context.completed_tutorials.filter(t => t === 'concentration-basics')).toHaveLength(1);
  });

  it('toggles educational content visibility', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    expect(result.current.context.show_educational_content).toBe(true);

    act(() => {
      result.current.toggleEducationalContent();
    });

    expect(result.current.context.show_educational_content).toBe(false);

    act(() => {
      result.current.toggleEducationalContent();
    });

    expect(result.current.context.show_educational_content).toBe(true);
  });

  it('updates learning style preference', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    act(() => {
      result.current.setLearningStyle('examples');
    });

    expect(result.current.context.preferred_learning_style).toBe('examples');
    expect(result.current.learningStyle).toBe('examples');
  });

  it('determines when to show educational content correctly', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    // Beginner should see beginner and intermediate content
    expect(result.current.shouldShowEducation('beginner')).toBe(true);
    expect(result.current.shouldShowEducation('intermediate')).toBe(false);
    expect(result.current.shouldShowEducation('advanced')).toBe(false);

    // Force show should always work
    expect(result.current.shouldShowEducation('advanced', true)).toBe(true);

    // Change to intermediate
    act(() => {
      result.current.setExperienceLevel('intermediate');
    });

    expect(result.current.shouldShowEducation('beginner')).toBe(true);
    expect(result.current.shouldShowEducation('intermediate')).toBe(true);
    expect(result.current.shouldShowEducation('advanced')).toBe(false);

    // Change to advanced
    act(() => {
      result.current.setExperienceLevel('advanced');
    });

    expect(result.current.shouldShowEducation('beginner')).toBe(false);
    expect(result.current.shouldShowEducation('intermediate')).toBe(false);
    expect(result.current.shouldShowEducation('advanced')).toBe(true);
  });

  it('provides appropriate tooltip settings', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    // Beginner settings
    let settings = result.current.getTooltipSettings();
    expect(settings.showDetailed).toBe(true);
    expect(settings.showConfidence).toBe(true);
    expect(settings.showExamples).toBe(true);

    // Change learning style
    act(() => {
      result.current.setLearningStyle('minimal');
    });

    settings = result.current.getTooltipSettings();
    expect(settings.showDetailed).toBe(true); // Still true for beginners
    expect(settings.showExamples).toBe(true); // Still true for beginners

    // Change to intermediate
    act(() => {
      result.current.setExperienceLevel('intermediate');
    });

    settings = result.current.getTooltipSettings();
    expect(settings.showConfidence).toBe(false); // Not beginner anymore
  });

  it('handles localStorage errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });
    
    const { result } = renderHook(() => useEducationContext());

    // Should not crash when localStorage fails
    act(() => {
      result.current.setExperienceLevel('intermediate');
    });

    expect(result.current.context.experience_level).toBe('intermediate');
  });

  it('provides correct convenience getters', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useEducationContext());

    expect(result.current.isBeginnerMode).toBe(true);
    expect(result.current.experienceLevel).toBe('beginner');
    expect(result.current.showEducationalContent).toBe(true);
    expect(result.current.learningStyle).toBe('tooltips');

    act(() => {
      result.current.setExperienceLevel('advanced');
      result.current.setLearningStyle('detailed');
    });

    expect(result.current.isBeginnerMode).toBe(false);
    expect(result.current.experienceLevel).toBe('advanced');
    expect(result.current.showEducationalContent).toBe(false);
    expect(result.current.learningStyle).toBe('detailed');
  });
});
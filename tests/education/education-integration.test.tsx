/**
 * Integration Tests for Educational System
 * 
 * Tests the complete educational system integration including
 * user comprehension improvement and confidence building features.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { EDUCATIONAL_GUIDANCE, BEGINNER_EDUCATION_CONTENT, CONTEXTUAL_HELP } from '@/lib/education/content';

describe('Educational Content Database', () => {
  it('provides comprehensive concentration explanations', () => {
    const concentrations = ['EDP', 'EDT', 'Parfum', 'EDC'];
    
    concentrations.forEach(concentration => {
      const content = EDUCATIONAL_GUIDANCE.concentration_help[concentration];
      expect(content).toBeDefined();
      expect(content.term).toContain(concentration);
      expect(content.shortExplanation).toBeTruthy();
      expect(content.detailedExplanation).toBeTruthy();
      expect(content.category).toBe('concentrations');
      expect(content.confidence_building).toBeTruthy();
      expect(content.example).toBeTruthy();
    });
  });

  it('provides note family explanations', () => {
    const noteFamilies = ['Fresh', 'Floral', 'Woody', 'Oriental', 'Fruity'];
    
    noteFamilies.forEach(family => {
      const content = EDUCATIONAL_GUIDANCE.note_explanations[family];
      expect(content).toBeDefined();
      expect(content.term).toContain(family);
      expect(content.shortExplanation).toBeTruthy();
      expect(content.category).toBe('notes');
      expect(content.confidence_building).toBeTruthy();
    });
  });

  it('provides application guidance', () => {
    expect(EDUCATIONAL_GUIDANCE.application_tips).toHaveLength(3);
    
    EDUCATIONAL_GUIDANCE.application_tips.forEach(tip => {
      expect(tip.category).toBe('application');
      expect(tip.shortExplanation).toBeTruthy();
      expect(tip.detailedExplanation).toBeTruthy();
      expect(tip.confidence_building).toBeTruthy();
    });
  });

  it('includes confidence boosters', () => {
    expect(EDUCATIONAL_GUIDANCE.confidence_boosters).toHaveLength(7);
    
    // Check for key confidence building messages
    const boosters = EDUCATIONAL_GUIDANCE.confidence_boosters;
    expect(boosters.some(b => b.includes('96%'))).toBe(true);
    expect(boosters.some(b => b.includes('5-8 fragrances'))).toBe(true);
    expect(boosters.some(b => b.includes('no wrong choices'))).toBe(true);
  });

  it('provides success statistics', () => {
    const stats = EDUCATIONAL_GUIDANCE.success_stats;
    expect(stats.beginner_match_rate).toBe('96%');
    expect(stats.average_tries_to_find_match).toBe('3-5');
    expect(stats.satisfaction_rate).toBe('94%');
  });

  it('includes contextual help for different sections', () => {
    expect(CONTEXTUAL_HELP.quiz).toBeDefined();
    expect(CONTEXTUAL_HELP.fragrance_page).toBeDefined();
    expect(CONTEXTUAL_HELP.search_results).toBeDefined();
    
    // Quiz help
    expect(CONTEXTUAL_HELP.quiz.style_question.tooltip).toBeTruthy();
    expect(CONTEXTUAL_HELP.quiz.intensity_question.guidance).toBeTruthy();
    
    // Fragrance page help
    expect(CONTEXTUAL_HELP.fragrance_page.concentration_display).toBeTruthy();
    expect(CONTEXTUAL_HELP.fragrance_page.notes_section).toBeTruthy();
  });
});

describe('Beginner Education Content', () => {
  it('provides structured learning content', () => {
    expect(BEGINNER_EDUCATION_CONTENT).toHaveLength(3);
    
    BEGINNER_EDUCATION_CONTENT.forEach(content => {
      expect(content.id).toBeTruthy();
      expect(content.title).toBeTruthy();
      expect(content.content).toBeTruthy();
      expect(content.level).toBe('beginner');
      expect(content.category).toBeTruthy();
      expect(content.tags).toBeInstanceOf(Array);
      expect(content.confidence_building).toBeTruthy();
    });
  });

  it('covers essential fragrance concepts', () => {
    const topics = BEGINNER_EDUCATION_CONTENT.map(c => c.id);
    expect(topics).toContain('concentration-basics');
    expect(topics).toContain('note-families');
    expect(topics).toContain('testing-guide');
  });
});

describe('Educational Content Quality', () => {
  it('uses beginner-friendly language', () => {
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      // Check for simple, clear explanations
      expect(content.shortExplanation.length).toBeLessThan(50);
      expect(content.shortExplanation).not.toMatch(/\b(olfactory|aromatic compounds|volatile)\b/i);
    });
    
    Object.values(EDUCATIONAL_GUIDANCE.note_explanations).forEach(content => {
      // Should use relatable comparisons
      expect(content.shortExplanation).toMatch(/(like|feels|reminds|picture|think)/i);
    });
  });

  it('provides practical examples', () => {
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      expect(content.example).toBeTruthy();
      expect(content.example).toMatch(/(apply|spray|wear|hours)/i);
    });
  });

  it('builds confidence consistently', () => {
    const allContent = [
      ...Object.values(EDUCATIONAL_GUIDANCE.concentration_help),
      ...Object.values(EDUCATIONAL_GUIDANCE.note_explanations),
      ...EDUCATIONAL_GUIDANCE.application_tips
    ];
    
    allContent.forEach(content => {
      if (content.confidence_building) {
        // Should be encouraging and positive
        expect(content.confidence_building).toMatch(/(most|perfect|ideal|great|good)/i);
        expect(content.confidence_building).not.toMatch(/(difficult|hard|complex|confusing)/i);
      }
    });
  });

  it('maintains consistency in tone', () => {
    const explanations = Object.values(EDUCATIONAL_GUIDANCE.note_explanations)
      .map(c => c.shortExplanation);
    
    // All explanations should follow similar patterns
    explanations.forEach(explanation => {
      expect(explanation).toMatch(/scents?|feeling|like/i);
      expect(explanation.length).toBeGreaterThan(10);
      expect(explanation.length).toBeLessThan(80);
    });
  });
});

describe('Educational System Effectiveness', () => {
  it('addresses common beginner confusion points', () => {
    // Concentration confusion
    const edp = EDUCATIONAL_GUIDANCE.concentration_help['EDP'];
    const edt = EDUCATIONAL_GUIDANCE.concentration_help['EDT'];
    
    expect(edp.shortExplanation).toContain('6-8 hours');
    expect(edt.shortExplanation).toContain('3-5 hours');
    
    // Clear differentiation
    expect(edp.shortExplanation).toContain('Stronger');
    expect(edt.shortExplanation).toContain('Lighter');
  });

  it('provides decision-making support', () => {
    const applicationTips = EDUCATIONAL_GUIDANCE.application_tips;
    
    // Testing guidance
    const testingTip = applicationTips.find(tip => tip.term.includes('Testing'));
    expect(testingTip?.shortExplanation).toContain('30 minutes');
    expect(testingTip?.confidence_building).toContain('experts');
    
    // Sample strategy
    const sampleTip = applicationTips.find(tip => tip.term.includes('Sample'));
    expect(sampleTip?.confidence_building).toContain('96%');
  });

  it('scales content appropriately by experience level', () => {
    // Beginner content should be simple and confidence-building
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      expect(content.shortExplanation.split(' ')).toHaveLength.lessThan(8);
      expect(content.confidence_building).toBeTruthy();
    });
    
    // Detailed explanations available but not overwhelming
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      expect(content.detailedExplanation?.split(' ')).toHaveLength.lessThan(30);
    });
  });

  it('supports progressive disclosure', () => {
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      // Has both short and detailed explanations
      expect(content.shortExplanation).toBeTruthy();
      expect(content.detailedExplanation).toBeTruthy();
      expect(content.shortExplanation.length).toBeLessThan(content.detailedExplanation!.length);
    });
  });
});

describe('Accessibility and Usability', () => {
  it('provides meaningful categories', () => {
    const categories = new Set();
    
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      categories.add(content.category);
    });
    
    Object.values(EDUCATIONAL_GUIDANCE.note_explanations).forEach(content => {
      categories.add(content.category);
    });
    
    expect(categories.has('concentrations')).toBe(true);
    expect(categories.has('notes')).toBe(true);
    expect(categories.has('application')).toBe(true);
  });

  it('supports screen readers with clear terminology', () => {
    Object.values(EDUCATIONAL_GUIDANCE.concentration_help).forEach(content => {
      // Term should be clear and unambiguous
      expect(content.term).toBeTruthy();
      expect(content.term.length).toBeGreaterThan(3);
      
      // Should not rely only on abbreviations
      if (content.term.includes('EDP')) {
        expect(content.term).toContain('Eau de Parfum');
      }
    });
  });

  it('maintains consistent data structure', () => {
    const allTooltipContent = [
      ...Object.values(EDUCATIONAL_GUIDANCE.concentration_help),
      ...Object.values(EDUCATIONAL_GUIDANCE.note_explanations),
      ...EDUCATIONAL_GUIDANCE.application_tips
    ];
    
    allTooltipContent.forEach(content => {
      expect(content).toHaveProperty('term');
      expect(content).toHaveProperty('shortExplanation');
      expect(content).toHaveProperty('category');
      expect(typeof content.term).toBe('string');
      expect(typeof content.shortExplanation).toBe('string');
      expect(typeof content.category).toBe('string');
    });
  });
});
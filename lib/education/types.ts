/**
 * Educational Content Types for ScentMatch
 * 
 * Defines TypeScript interfaces for the fragrance education system
 * that helps beginners understand terminology and build confidence.
 */

export interface EducationalTooltip {
  term: string;
  shortExplanation: string;
  detailedExplanation?: string;
  category: EducationCategory;
  confidence_building?: string;
  example?: string;
  learn_more_url?: string;
}

export interface EducationalContent {
  id: string;
  title: string;
  content: string;
  level: EducationLevel;
  category: EducationCategory;
  tags: string[];
  prerequisites?: string[];
  confidence_building?: string;
}

export interface ProgressiveEducation {
  beginner: EducationalContent[];
  intermediate: EducationalContent[];
  advanced: EducationalContent[];
}

export type EducationLevel = 'beginner' | 'intermediate' | 'advanced';

export type EducationCategory = 
  | 'concentrations'
  | 'notes'
  | 'application'
  | 'families'
  | 'terminology'
  | 'shopping_tips'
  | 'confidence_building';

export interface UserEducationContext {
  is_beginner: boolean;
  experience_level: EducationLevel;
  completed_tutorials: string[];
  preferred_learning_style: 'tooltips' | 'detailed' | 'examples' | 'minimal';
  show_educational_content: boolean;
}

export interface EducationalGuidance {
  concentration_help: Record<string, EducationalTooltip>;
  note_explanations: Record<string, EducationalTooltip>;
  application_tips: EducationalTooltip[];
  confidence_boosters: string[];
  success_stats: {
    beginner_match_rate: string;
    average_tries_to_find_match: string;
    satisfaction_rate: string;
  };
}
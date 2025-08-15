/**
 * Shared type definitions for the ScentMatch application
 */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  preferences?: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  preferredFragranceTypes?: string[];
  scentProfileInterests?: string[];
  notificationSettings?: NotificationSettings;
  recommendationSettings?: RecommendationSettings;
}

export interface NotificationSettings {
  emailUpdates: boolean;
  newRecommendations: boolean;
  collectionReminders: boolean;
  marketingEmails: boolean;
}

export interface RecommendationSettings {
  includeNicheBrands: boolean;
  priceRange?: {
    min: number;
    max: number;
  };
  preferSamples: boolean;
  complexityLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface Fragrance {
  id: string;
  name: string;
  brand: string;
  description?: string;
  notes: string[];
  imageUrl?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: FragranceAvailability;
  createdAt: string;
  updatedAt: string;
}

export interface FragranceAvailability {
  fullSize: boolean;
  sample: boolean;
  travelSize: boolean;
  discontinued: boolean;
}

export interface UserCollection {
  id: string;
  userId: string;
  fragrance: Fragrance;
  rating?: number;
  notes?: string;
  dateAdded: string;
  lastWorn?: string;
  wearCount?: number;
}

export interface Recommendation {
  id: string;
  userId: string;
  fragrance: Fragrance;
  confidence: number;
  reasoning: string;
  similarity: RecommendationSimilarity[];
  createdAt: string;
}

export interface RecommendationSimilarity {
  type: 'scent_profile' | 'user_preference' | 'collection_match';
  score: number;
  explanation: string;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface FragranceSearchFilters {
  brand?: string;
  notes?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: keyof FragranceAvailability;
  sortBy?: 'name' | 'brand' | 'popularity' | 'price';
  sortOrder?: 'asc' | 'desc';
}

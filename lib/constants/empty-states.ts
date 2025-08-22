import { 
  Search, 
  AlertCircle, 
  Package, 
  Wifi, 
  Heart,
  RefreshCw,
  WifiOff
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type EmptyStateType = 
  | 'no-results'
  | 'loading-error' 
  | 'network-error'
  | 'initial-browse'
  | 'empty-collection'
  | 'no-filters-applied';

export interface EmptyStateConfig {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryAction?: {
    label: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  secondaryAction?: {
    label: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
}

/**
 * Centralized configuration for empty state scenarios
 * Ensures consistent messaging and actions across the platform
 */
export const EMPTY_STATE_CONFIGS: Record<EmptyStateType, EmptyStateConfig> = {
  'no-results': {
    title: 'No fragrances found',
    description: 'Try different search terms or browse our collection.',
    icon: Package,
    primaryAction: {
      label: 'Clear search',
      variant: 'outline'
    }
  },
  
  'loading-error': {
    title: 'Something went wrong',
    description: "We're having trouble loading fragrances right now. Please try again.",
    icon: AlertCircle,
    primaryAction: {
      label: 'Try again',
      variant: 'default'
    }
  },
  
  'network-error': {
    title: 'Connection error',
    description: 'Please check your internet connection and try again.',
    icon: WifiOff,
    primaryAction: {
      label: 'Try again',
      variant: 'default'
    }
  },
  
  'initial-browse': {
    title: 'Start your fragrance discovery',
    description: 'Search for fragrances by name, brand, or scent notes to get started.',
    icon: Search
  },
  
  'empty-collection': {
    title: 'Your collection is empty',
    description: 'Start adding fragrances to build your personal collection.',
    icon: Heart,
    primaryAction: {
      label: 'Browse fragrances',
      variant: 'default'
    }
  },
  
  'no-filters-applied': {
    title: 'Explore our fragrance collection',
    description: 'Use the search bar or apply filters to discover fragrances.',
    icon: Search
  }
};

/**
 * Helper function to get empty state configuration by type
 */
export function getEmptyStateConfig(type: EmptyStateType): EmptyStateConfig {
  return EMPTY_STATE_CONFIGS[type];
}

/**
 * Helper function to determine empty state type based on conditions
 */
export function determineEmptyStateType(conditions: {
  hasQuery: boolean;
  hasResults: boolean;
  isError: boolean;
  isNetworkError: boolean;
  isInitialLoad: boolean;
}): EmptyStateType {
  const { hasQuery, hasResults, isError, isNetworkError, isInitialLoad } = conditions;
  
  if (isNetworkError) {
    return 'network-error';
  }
  
  if (isError) {
    return 'loading-error';
  }
  
  if (hasQuery && !hasResults) {
    return 'no-results';
  }
  
  if (isInitialLoad && !hasQuery) {
    return 'initial-browse';
  }
  
  return 'no-filters-applied';
}
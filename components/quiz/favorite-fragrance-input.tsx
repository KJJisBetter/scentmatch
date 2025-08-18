'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, X, CheckCircle, Loader2 } from 'lucide-react';

export type ExperienceLevel = 'beginner' | 'enthusiast' | 'collector';

interface FragranceOption {
  id: string;
  name: string;
  brand: string;
  popularity_score?: number;
  accords?: string[];
  rating?: number;
}

interface FavoriteFragranceInputProps {
  experienceLevel: ExperienceLevel;
  onFavoritesChange: (favorites: FragranceOption[]) => void;
  maxSelections: number;
  minSelections?: number;
  initialSelections?: FragranceOption[];
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * FavoriteFragranceInput Component
 *
 * Provides autocomplete fragrance search and selection for advanced users.
 * Adapts UI and expectations based on experience level:
 * - Beginner: Optional, simple selection
 * - Enthusiast: 1-3 selections encouraged
 * - Collector: 2-5 selections for better recommendations
 */
export function FavoriteFragranceInput({
  experienceLevel,
  onFavoritesChange,
  maxSelections,
  minSelections = 1,
  initialSelections = [],
  onComplete,
  onSkip,
}: FavoriteFragranceInputProps) {
  const [selectedFavorites, setSelectedFavorites] =
    useState<FragranceOption[]>(initialSelections);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FragranceOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/fragrances?search=${encodeURIComponent(query)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.fragrances || []);
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Failed to search fragrances:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setHasSearched(false);
    }
  }, []);

  // Debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce(performSearch, 300), [
    performSearch,
  ]);

  // Effect to trigger search
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Effect to notify parent of changes
  useEffect(() => {
    onFavoritesChange(selectedFavorites);
  }, [selectedFavorites, onFavoritesChange]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectFragrance = (fragrance: FragranceOption) => {
    if (selectedFavorites.find(f => f.id === fragrance.id)) return;

    if (selectedFavorites.length < maxSelections) {
      const newFavorites = [...selectedFavorites, fragrance];
      setSelectedFavorites(newFavorites);
      setSearchQuery(''); // Clear search after selection

      // Track fragrance selection
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'favorite_fragrance_selected', {
          fragrance_id: fragrance.id,
          fragrance_name: fragrance.name,
          brand: fragrance.brand,
          experience_level: experienceLevel,
          selection_count: newFavorites.length,
        });
      }
    }
  };

  const handleRemoveFavorite = (fragranceId: string) => {
    const newFavorites = selectedFavorites.filter(f => f.id !== fragranceId);
    setSelectedFavorites(newFavorites);
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Get experience-appropriate text
  const getExperienceText = () => {
    switch (experienceLevel) {
      case 'beginner':
        return {
          title: 'Fragrances You Love',
          subtitle: 'Choose a fragrance you currently wear or love (optional)',
          instruction:
            "This helps us understand your taste, but you can skip if you're not sure",
        };
      case 'enthusiast':
        return {
          title: 'Fragrances You Love',
          subtitle: 'Choose 1-3 fragrances you currently wear or love',
          instruction: 'Your favorites help us create better recommendations',
        };
      case 'collector':
        return {
          title: 'Your Collection Favorites',
          subtitle:
            'Select 2-5 fragrances from your collection to enhance recommendations',
          instruction:
            'Share your collection highlights for expert-level matching',
        };
      default:
        return {
          title: 'Favorite Fragrances',
          subtitle: 'Choose fragrances you love',
          instruction: 'Help us understand your preferences',
        };
    }
  };

  const experienceText = getExperienceText();
  const canContinue = selectedFavorites.length >= minSelections;
  const filteredResults = searchResults.filter(
    fragrance =>
      !selectedFavorites.find(selected => selected.id === fragrance.id)
  );

  return (
    <div className='max-w-2xl mx-auto'>
      <Card>
        <CardContent className='py-8'>
          <h2 className='text-2xl font-semibold text-center mb-2'>
            {experienceText.title}
          </h2>
          <p className='text-center text-muted-foreground mb-6'>
            {experienceText.subtitle}
          </p>

          {experienceLevel !== 'beginner' && (
            <p className='text-center text-sm text-purple-600 mb-6'>
              {experienceText.instruction}
            </p>
          )}

          {/* Search Input */}
          <div className='relative mb-6'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              type='text'
              placeholder='Search fragrances...'
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className='pl-10'
              role='searchbox'
              aria-label='Search for fragrances'
            />
            {isSearching && (
              <Loader2 className='absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-purple-500' />
            )}
          </div>

          {/* Selected Favorites */}
          {selectedFavorites.length > 0 && (
            <div className='mb-6'>
              <h4 className='font-medium mb-3'>Selected Favorites:</h4>
              <div className='flex flex-wrap gap-2'>
                {selectedFavorites.map(fragrance => (
                  <Badge
                    key={fragrance.id}
                    variant='secondary'
                    className='px-3 py-1 text-sm flex items-center gap-2'
                  >
                    <span>
                      {fragrance.brand} {fragrance.name}
                    </span>
                    <button
                      onClick={() => handleRemoveFavorite(fragrance.id)}
                      className='text-gray-500 hover:text-red-500 transition-colors'
                      aria-label={`Remove ${fragrance.name}`}
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {(searchQuery.length > 1 || hasSearched) && (
            <div className='mb-6'>
              <h4 className='font-medium mb-3'>
                {searchQuery
                  ? `Search Results for "${searchQuery}":`
                  : 'Recent Results:'}
              </h4>
              <div className='space-y-2 max-h-48 overflow-y-auto'>
                {isSearching ? (
                  <div className='text-center py-4'>
                    <Loader2 className='w-6 h-6 animate-spin mx-auto mb-2' />
                    <p className='text-muted-foreground'>
                      Searching fragrances...
                    </p>
                  </div>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map(fragrance => (
                    <button
                      key={fragrance.id}
                      onClick={() => handleSelectFragrance(fragrance)}
                      disabled={selectedFavorites.length >= maxSelections}
                      className='w-full p-3 text-left border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium group-hover:text-purple-700'>
                            {fragrance.brand} - {fragrance.name}
                          </div>
                          {fragrance.accords &&
                            fragrance.accords.length > 0 && (
                              <div className='text-xs text-muted-foreground mt-1'>
                                {fragrance.accords.slice(0, 3).join(', ')}
                              </div>
                            )}
                        </div>
                        {fragrance.rating && (
                          <div className='text-xs text-amber-600'>
                            ⭐ {fragrance.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                ) : searchQuery.length > 1 ? (
                  <p className='text-muted-foreground text-center py-4'>
                    No fragrances found matching "{searchQuery}"
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3'>
            {canContinue && (
              <Button onClick={handleComplete} className='flex-1'>
                <CheckCircle className='w-4 h-4 mr-2' />
                Continue with {selectedFavorites.length}{' '}
                {selectedFavorites.length === 1 ? 'favorite' : 'favorites'}
              </Button>
            )}
            <Button variant='outline' onClick={handleSkip} className='px-6'>
              {experienceLevel === 'beginner'
                ? 'Skip for now'
                : 'Skip favorites'}
            </Button>
          </div>

          {/* Selection Counter */}
          <p className='text-xs text-muted-foreground text-center mt-4'>
            {selectedFavorites.length}/{maxSelections} selected
            {minSelections > 0 &&
              selectedFavorites.length < minSelections &&
              ` (minimum ${minSelections})`}
          </p>

          {/* Experience-level specific guidance */}
          {experienceLevel === 'beginner' && selectedFavorites.length === 0 && (
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <p className='text-sm text-blue-800'>
                💡 <strong>New to fragrances?</strong> No problem! You can skip
                this step and we'll recommend popular choices to get you
                started.
              </p>
            </div>
          )}

          {experienceLevel === 'collector' && selectedFavorites.length < 2 && (
            <div className='mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg'>
              <p className='text-sm text-purple-800'>
                🎭 <strong>Collector tip:</strong> Selecting 2-5 favorites helps
                us understand your sophisticated taste and recommend niche
                discoveries.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

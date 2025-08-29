'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tag,
  Plus,
  X,
  Hash,
  Search,
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  Heart,
  Star,
} from 'lucide-react';

interface FragranceTag {
  id: string;
  name: string;
  color: string;
  category: 'mood' | 'occasion' | 'season' | 'time' | 'custom';
  usage_count: number;
}

interface FragranceTagsProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: FragranceTag[];
  compact?: boolean;
  maxTags?: number;
  placeholder?: string;
}

/**
 * Fragrance Tags Component - Task 2.2 (Phase 1B)
 *
 * Advanced tagging system for fragrances with autocomplete, categories,
 * and smart suggestions. Supports both predefined and custom tags.
 *
 * Features:
 * - Autocomplete with popular tags
 * - Tag categories (mood, occasion, season, time)
 * - Custom tag creation
 * - Color-coded tag display
 * - Bulk tag operations
 * - Smart tag suggestions based on fragrance data
 */
export function FragranceTags({
  selectedTags,
  onTagsChange,
  availableTags = [],
  compact = false,
  maxTags = 10,
  placeholder = 'Add tags...',
}: FragranceTagsProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Predefined tag suggestions organized by category
  const predefinedTags: Record<string, FragranceTag[]> = {
    mood: [
      {
        id: 'romantic',
        name: 'Romantic',
        color: 'pink',
        category: 'mood',
        usage_count: 245,
      },
      {
        id: 'confident',
        name: 'Confident',
        color: 'purple',
        category: 'mood',
        usage_count: 189,
      },
      {
        id: 'mysterious',
        name: 'Mysterious',
        color: 'indigo',
        category: 'mood',
        usage_count: 167,
      },
      {
        id: 'playful',
        name: 'Playful',
        color: 'yellow',
        category: 'mood',
        usage_count: 134,
      },
      {
        id: 'elegant',
        name: 'Elegant',
        color: 'blue',
        category: 'mood',
        usage_count: 298,
      },
      {
        id: 'fresh',
        name: 'Fresh',
        color: 'green',
        category: 'mood',
        usage_count: 402,
      },
    ],
    occasion: [
      {
        id: 'work',
        name: 'Work',
        color: 'gray',
        category: 'occasion',
        usage_count: 356,
      },
      {
        id: 'date-night',
        name: 'Date Night',
        color: 'red',
        category: 'occasion',
        usage_count: 267,
      },
      {
        id: 'casual',
        name: 'Casual',
        color: 'blue',
        category: 'occasion',
        usage_count: 445,
      },
      {
        id: 'formal',
        name: 'Formal',
        color: 'black',
        category: 'occasion',
        usage_count: 198,
      },
      {
        id: 'party',
        name: 'Party',
        color: 'purple',
        category: 'occasion',
        usage_count: 123,
      },
      {
        id: 'travel',
        name: 'Travel',
        color: 'green',
        category: 'occasion',
        usage_count: 89,
      },
    ],
    season: [
      {
        id: 'spring',
        name: 'Spring',
        color: 'green',
        category: 'season',
        usage_count: 234,
      },
      {
        id: 'summer',
        name: 'Summer',
        color: 'yellow',
        category: 'season',
        usage_count: 287,
      },
      {
        id: 'fall',
        name: 'Fall',
        color: 'orange',
        category: 'season',
        usage_count: 201,
      },
      {
        id: 'winter',
        name: 'Winter',
        color: 'blue',
        category: 'season',
        usage_count: 178,
      },
    ],
    time: [
      {
        id: 'morning',
        name: 'Morning',
        color: 'yellow',
        category: 'time',
        usage_count: 156,
      },
      {
        id: 'afternoon',
        name: 'Afternoon',
        color: 'orange',
        category: 'time',
        usage_count: 134,
      },
      {
        id: 'evening',
        name: 'Evening',
        color: 'purple',
        category: 'time',
        usage_count: 245,
      },
      {
        id: 'night',
        name: 'Night',
        color: 'indigo',
        category: 'time',
        usage_count: 189,
      },
    ],
  };

  // Combine all predefined tags
  const allPredefinedTags = Object.values(predefinedTags).flat();

  // Merge with available tags (from database)
  const allAvailableTags = [...allPredefinedTags, ...availableTags];

  // Filter suggestions based on input
  const suggestions = allAvailableTags
    .filter(
      tag =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedTags.includes(tag.id)
    )
    .sort((a, b) => b.usage_count - a.usage_count);

  // Get tag by ID
  const getTagById = (tagId: string): FragranceTag | undefined => {
    return allAvailableTags.find(tag => tag.id === tagId);
  };

  // Get tag color classes
  const getTagColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      green: 'bg-green-100 text-green-800 hover:bg-green-200',
      red: 'bg-red-100 text-red-800 hover:bg-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      pink: 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      orange: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
      indigo: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
      gray: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      black: 'bg-gray-800 text-white hover:bg-gray-900',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mood':
        return Heart;
      case 'occasion':
        return Calendar;
      case 'season':
        return Sparkles;
      case 'time':
        return Clock;
      default:
        return Tag;
    }
  };

  // Add tag
  const addTag = (tag: FragranceTag) => {
    if (selectedTags.length >= maxTags) return;

    if (!selectedTags.includes(tag.id)) {
      onTagsChange([...selectedTags, tag.id]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  // Remove tag
  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  // Create custom tag
  const createCustomTag = () => {
    if (!inputValue.trim() || selectedTags.length >= maxTags) return;

    const customTag: FragranceTag = {
      id: `custom-${Date.now()}`,
      name: inputValue.trim(),
      color: 'gray',
      category: 'custom',
      usage_count: 1,
    };

    addTag(customTag);
    setIsCreatingTag(false);
  };

  // Handle input changes
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setShowSuggestions(value.length > 0);
    setIsCreatingTag(false);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        const firstSuggestion = suggestions[0];
        if (firstSuggestion) {
          addTag(firstSuggestion);
        }
      } else if (inputValue.trim()) {
        createCustomTag();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setInputValue('');
    }
  };

  // Handle input blur
  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div
      className={`space-y-3 ${compact ? '' : 'p-4 border rounded-lg bg-gray-50'}`}
    >
      {!compact && (
        <div className='flex items-center space-x-2'>
          <Tag className='w-4 h-4 text-purple-600' />
          <h4 className='font-medium'>Tags</h4>
          <Badge variant='outline' className='text-xs'>
            {selectedTags.length}/{maxTags}
          </Badge>
        </div>
      )}

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {selectedTags.map(tagId => {
            const tag = getTagById(tagId);
            if (!tag) return null;

            return (
              <Badge
                key={tagId}
                className={`${getTagColorClass(tag.color)} cursor-pointer group`}
                onClick={() => removeTag(tagId)}
              >
                <span className='text-xs'>{tag.name}</span>
                <X className='w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity' />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Tag Input with Suggestions */}
      {selectedTags.length < maxTags && (
        <div className='relative'>
          <div className='relative'>
            <Hash className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleInputBlur}
              onFocus={() => setShowSuggestions(inputValue.length > 0)}
              placeholder={placeholder}
              className='pl-10 text-sm'
            />
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
              {/* Category Groups */}
              {Object.entries(predefinedTags).map(
                ([categoryName, categoryTags]) => {
                  const filteredCategoryTags = categoryTags.filter(
                    tag =>
                      tag.name
                        .toLowerCase()
                        .includes(inputValue.toLowerCase()) &&
                      !selectedTags.includes(tag.id)
                  );

                  if (filteredCategoryTags.length === 0) return null;

                  const CategoryIcon = getCategoryIcon(categoryName);

                  return (
                    <div
                      key={categoryName}
                      className='border-b border-gray-100 last:border-b-0'
                    >
                      <div className='px-3 py-2 bg-gray-50'>
                        <div className='flex items-center space-x-2 text-xs font-medium text-gray-600'>
                          <CategoryIcon className='w-3 h-3' />
                          <span className='capitalize'>{categoryName}</span>
                        </div>
                      </div>
                      <div className='p-2'>
                        {filteredCategoryTags.slice(0, 5).map(tag => (
                          <button
                            key={tag.id}
                            onClick={() => addTag(tag)}
                            className='w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 rounded text-left'
                          >
                            <div className='flex items-center space-x-2'>
                              <Badge
                                className={`${getTagColorClass(tag.color)} text-xs`}
                              >
                                {tag.name}
                              </Badge>
                            </div>
                            <span className='text-xs text-gray-500'>
                              {tag.usage_count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}

              {/* Custom Tag Creation */}
              {inputValue.trim() &&
                !allAvailableTags.some(
                  tag => tag.name.toLowerCase() === inputValue.toLowerCase()
                ) && (
                  <div className='border-t border-gray-100'>
                    <div className='p-2'>
                      <button
                        onClick={createCustomTag}
                        className='w-full flex items-center space-x-2 px-2 py-1.5 hover:bg-blue-50 rounded text-left'
                      >
                        <Plus className='w-3 h-3 text-blue-600' />
                        <span className='text-sm text-blue-600'>
                          Create tag "{inputValue.trim()}"
                        </span>
                      </button>
                    </div>
                  </div>
                )}

              {/* No suggestions */}
              {suggestions.length === 0 && !inputValue.trim() && (
                <div className='p-4 text-center text-sm text-gray-500'>
                  Start typing to see tag suggestions
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Popular Tags (Quick Add) */}
      {!compact && inputValue === '' && (
        <div className='space-y-3'>
          <h5 className='text-sm font-medium text-gray-700'>Popular Tags</h5>

          {Object.entries(predefinedTags).map(
            ([categoryName, categoryTags]) => {
              const CategoryIcon = getCategoryIcon(categoryName);
              const topTags = categoryTags
                .filter(tag => !selectedTags.includes(tag.id))
                .slice(0, 3);

              if (topTags.length === 0) return null;

              return (
                <div key={categoryName} className='space-y-2'>
                  <div className='flex items-center space-x-2 text-xs font-medium text-gray-600'>
                    <CategoryIcon className='w-3 h-3' />
                    <span className='capitalize'>{categoryName}</span>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    {topTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => addTag(tag)}
                        disabled={selectedTags.length >= maxTags}
                        className='disabled:opacity-50 disabled:cursor-not-allowed'
                      >
                        <Badge
                          className={`${getTagColorClass(tag.color)} cursor-pointer hover:scale-105 transition-transform text-xs`}
                        >
                          <Plus className='w-2 h-2 mr-1' />
                          {tag.name}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Tag Limits Info */}
      {selectedTags.length >= maxTags && (
        <div className='text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded px-2 py-1'>
          Maximum {maxTags} tags reached. Remove a tag to add more.
        </div>
      )}

      {/* Tag Management Help */}
      {!compact && selectedTags.length === 0 && (
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
          <div className='space-y-2'>
            <h5 className='text-sm font-medium text-blue-800 flex items-center'>
              <Sparkles className='w-3 h-3 mr-1' />
              Tag Benefits
            </h5>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-1 text-xs text-blue-700'>
              <div>• Find fragrances by mood quickly</div>
              <div>• Group by occasions or seasons</div>
              <div>• Create custom organization system</div>
              <div>• Get better AI recommendations</div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {!compact && (
        <div className='text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1'>
          <span className='font-medium'>Tips:</span> Press Enter to add • Click
          tags to remove •
          {selectedTags.length === 0
            ? ' Try popular tags below'
            : ` ${maxTags - selectedTags.length} slots remaining`}
        </div>
      )}
    </div>
  );
}

// Export utility functions for tag management
export const tagUtils = {
  /**
   * Extract tags from fragrance data for smart suggestions
   */
  extractSmartTags: (fragrance: any): string[] => {
    const smartTags: string[] = [];

    // Season-based tags
    if (fragrance.season_tags) {
      smartTags.push(...fragrance.season_tags);
    }

    // Personality-based tags
    if (fragrance.personality_tags) {
      smartTags.push(...fragrance.personality_tags);
    }

    // Scent family tags
    if (fragrance.fragrance_family) {
      smartTags.push(fragrance.fragrance_family.toLowerCase());
    }

    // Main accords as tags
    if (fragrance.main_accords) {
      smartTags.push(...fragrance.main_accords.slice(0, 3));
    }

    return smartTags;
  },

  /**
   * Get suggested tags based on collection analysis
   */
  getSuggestedTags: (collection: any[]): string[] => {
    const tagFrequency = new Map<string, number>();

    collection.forEach(item => {
      const smartTags = tagUtils.extractSmartTags(item.fragrances);
      smartTags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  },

  /**
   * Validate tag name
   */
  validateTagName: (name: string): { valid: boolean; error?: string } => {
    const trimmed = name.trim();

    if (!trimmed) {
      return { valid: false, error: 'Tag name cannot be empty' };
    }

    if (trimmed.length > 20) {
      return { valid: false, error: 'Tag name must be 20 characters or less' };
    }

    if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
      return { valid: false, error: 'Tag name contains invalid characters' };
    }

    return { valid: true };
  },

  /**
   * Format tag for display
   */
  formatTagName: (name: string): string => {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
  },
};

/**
 * Modern Fragrance Search using shadcn/ui Command
 *
 * Replaces custom search components with:
 * - Built-in keyboard navigation (arrow keys, enter, escape)
 * - Automatic accessibility (ARIA, screen reader support)
 * - Better performance (cmdk virtual scrolling)
 * - Consistent shadcn/ui styling
 * - ⌘K shortcut support
 * - Enhanced features with less code
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import {
  Search,
  Sparkles,
  Star,
  Package,
  Palette,
  Heart,
  TrendingUp,
  Filter,
  Loader2,
  Clock,
} from 'lucide-react';

interface FragranceSearchResult {
  id: string;
  text: string;
  type: 'fragrance' | 'brand' | 'note' | 'family' | 'command';
  confidence: number;
  description?: string;
  trending?: boolean;
  popular?: boolean;
  result_count?: number;
  metadata?: Record<string, any>;
}

interface FragranceCommandProps {
  // Inline mode props
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelect?: (item: FragranceSearchResult) => void;
  className?: string;

  // Dialog mode props
  trigger?: React.ReactNode;
  mode?: 'inline' | 'dialog';

  // Search behavior
  enableShortcuts?: boolean;
  showDefaultActions?: boolean;
  highlightMatches?: boolean;
  minQueryLength?: number;
  debounceMs?: number;
}

export function FragranceCommand({
  placeholder = 'Search fragrances, brands, or notes...',
  onSearch,
  onSelect,
  className = '',
  trigger,
  mode = 'inline',
  enableShortcuts = true,
  showDefaultActions = true,
  highlightMatches = true,
  minQueryLength = 2,
  debounceMs = 200,
}: FragranceCommandProps) {
  // State
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FragranceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // ⌘K keyboard shortcut
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableShortcuts]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('scentmatch-recent-searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  // Save recent search
  const saveRecentSearch = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < 2) return;

      try {
        const updated = [
          searchQuery,
          ...recentSearches.filter(s => s !== searchQuery),
        ].slice(0, 5);

        setRecentSearches(updated);
        localStorage.setItem(
          'scentmatch-recent-searches',
          JSON.stringify(updated)
        );
      } catch (error) {
        console.warn('Failed to save recent search:', error);
      }
    },
    [recentSearches]
  );

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(getDefaultResults());
      return;
    }

    if (query.length < minQueryLength) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, minQueryLength, debounceMs]);

  // Perform enhanced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/search/suggestions/enhanced?q=${encodeURIComponent(searchQuery)}&limit=12`
        );

        if (response.ok) {
          const data = await response.json();
          const searchResults: FragranceSearchResult[] = data.suggestions.map(
            (suggestion: any, index: number) => ({
              id: `${suggestion.type}-${suggestion.text}-${index}`,
              text: suggestion.text,
              type: suggestion.type,
              confidence: suggestion.confidence,
              trending: suggestion.trending,
              popular: suggestion.confidence > 0.8,
              result_count: suggestion.result_count,
              description: getItemDescription(suggestion.type),
            })
          );

          // Add search command for full search
          if (searchQuery.length >= minQueryLength) {
            searchResults.unshift({
              id: `search-${searchQuery}`,
              text: `Search for "${searchQuery}"`,
              type: 'command',
              confidence: 1,
              description: 'View all search results',
            });
          }

          setResults(searchResults);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [minQueryLength]
  );

  // Handle item selection
  const handleSelect = useCallback(
    (item: FragranceSearchResult) => {
      if (item.type === 'command') {
        // Extract search query from command text
        const searchQuery = item.text.match(/Search for "(.+)"/)?.[1] || query;
        saveRecentSearch(searchQuery);
        onSearch?.(searchQuery);
      } else {
        // Handle regular item selection
        saveRecentSearch(item.text);
        onSelect?.(item);
      }

      // Close dialog and reset
      if (mode === 'dialog') {
        setOpen(false);
        setQuery('');
      }
    },
    [onSelect, onSearch, query, mode, saveRecentSearch]
  );

  // Get default results when no query
  const getDefaultResults = (): FragranceSearchResult[] => {
    const defaults: FragranceSearchResult[] = [];

    // Add recent searches
    if (recentSearches.length > 0) {
      defaults.push(
        ...recentSearches.map((search, index) => ({
          id: `recent-${index}`,
          text: search,
          type: 'command' as const,
          confidence: 0.9,
          description: 'Recent search',
        }))
      );
    }

    // Add default actions if enabled
    if (showDefaultActions) {
      defaults.push(
        {
          id: 'browse-popular',
          text: 'Browse Popular Fragrances',
          type: 'command',
          confidence: 1,
          description: 'Discover trending and highly-rated fragrances',
        },
        {
          id: 'filter-samples',
          text: 'Find Sample Sizes',
          type: 'command',
          confidence: 1,
          description: 'Browse affordable samples and travel sizes',
        }
      );
    }

    // Add popular quick searches
    defaults.push(
      {
        id: 'dior-brand',
        text: 'Dior',
        type: 'brand',
        confidence: 0.9,
        popular: true,
        description: 'Luxury French fashion house',
      },
      {
        id: 'fresh-family',
        text: 'Fresh',
        type: 'family',
        confidence: 0.8,
        description: 'Clean, crisp, energizing scents',
      },
      {
        id: 'woody-family',
        text: 'Woody',
        type: 'family',
        confidence: 0.8,
        description: 'Warm, sophisticated fragrances',
      }
    );

    return defaults;
  };

  // Get item description
  const getItemDescription = (type: string): string => {
    switch (type) {
      case 'fragrance':
        return 'Fragrance';
      case 'brand':
        return 'Brand';
      case 'note':
        return 'Fragrance note';
      case 'family':
        return 'Scent family';
      case 'command':
        return 'Action';
      default:
        return '';
    }
  };

  // Get item icon
  const getItemIcon = (item: FragranceSearchResult) => {
    if (item.trending) return TrendingUp;
    if (item.popular) return Star;

    switch (item.type) {
      case 'fragrance':
        return Sparkles;
      case 'brand':
        return Package;
      case 'note':
        return Palette;
      case 'family':
        return Heart;
      case 'command':
        if (item.text.includes('Browse') || item.text.includes('Find'))
          return Filter;
        if (item.description === 'Recent search') return Clock;
        return Search;
      default:
        return Search;
    }
  };

  // Group results by type
  const groupedResults = results.reduce(
    (groups, item) => {
      let groupKey = item.type;

      // Special grouping logic
      if (item.type === 'command') {
        if (item.description === 'Recent search') {
          groupKey = 'recent' as any;
        } else if (item.text.includes('Search for')) {
          groupKey = 'search' as any;
        } else {
          groupKey = 'actions' as any;
        }
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey]?.push(item);
      return groups;
    },
    {} as Record<string, FragranceSearchResult[]>
  );

  // Render command content
  const renderCommandContent = () => (
    <>
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className='flex items-center justify-center py-6'>
              <Loader2 className='h-4 w-4 animate-spin mr-2' />
              Searching...
            </div>
          ) : (
            'No results found.'
          )}
        </CommandEmpty>

        {/* Search command */}
        {groupedResults.search && (
          <>
            <CommandGroup heading='Search'>
              {groupedResults.search.map(item => {
                const Icon = getItemIcon(item);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className='flex items-center space-x-3'
                  >
                    <Icon className='h-4 w-4' />
                    <div className='flex-1'>
                      <div className='font-medium'>{item.text}</div>
                      <div className='text-xs text-muted-foreground'>
                        {item.description}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Recent searches */}
        {groupedResults.recent && (
          <>
            <CommandGroup heading='Recent'>
              {groupedResults.recent.map(item => {
                const Icon = getItemIcon(item);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className='flex items-center space-x-3'
                  >
                    <Icon className='h-4 w-4' />
                    <span>{item.text}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Actions */}
        {groupedResults.actions && (
          <>
            <CommandGroup heading='Actions'>
              {groupedResults.actions.map(item => {
                const Icon = getItemIcon(item);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className='flex items-center space-x-3'
                  >
                    <Icon className='h-4 w-4' />
                    <div className='flex-1'>
                      <div className='font-medium'>{item.text}</div>
                      <div className='text-xs text-muted-foreground'>
                        {item.description}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Fragrances */}
        {groupedResults.fragrance && (
          <CommandGroup heading='Fragrances'>
            {groupedResults.fragrance.map(item => {
              const Icon = getItemIcon(item);
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item)}
                  className='flex items-center space-x-3'
                >
                  <Icon className='h-4 w-4' />
                  <div className='flex-1'>
                    <div className='flex items-center space-x-2'>
                      <span>{item.text}</span>
                      {item.trending && (
                        <span className='text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded'>
                          Trending
                        </span>
                      )}
                      {item.popular && (
                        <span className='text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded'>
                          Popular
                        </span>
                      )}
                    </div>
                  </div>
                  {item.confidence && (
                    <div className='text-xs text-muted-foreground'>
                      {Math.round(item.confidence * 100)}%
                    </div>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Brands */}
        {groupedResults.brand && (
          <CommandGroup heading='Brands'>
            {groupedResults.brand.map(item => {
              const Icon = getItemIcon(item);
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item)}
                  className='flex items-center space-x-3'
                >
                  <Icon className='h-4 w-4' />
                  <div className='flex-1'>
                    <span>{item.text}</span>
                    {item.description && (
                      <div className='text-xs text-muted-foreground'>
                        {item.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {/* Notes & Families */}
        {(groupedResults.note || groupedResults.family) && (
          <CommandGroup heading='Notes & Families'>
            {[
              ...(groupedResults.note || []),
              ...(groupedResults.family || []),
            ].map(item => {
              const Icon = getItemIcon(item);
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item)}
                  className='flex items-center space-x-3'
                >
                  <Icon className='h-4 w-4' />
                  <div className='flex-1'>
                    <span>{item.text}</span>
                    <div className='text-xs text-muted-foreground'>
                      {item.description}
                    </div>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}
      </CommandList>
    </>
  );

  // Dialog mode
  if (mode === 'dialog') {
    const defaultTrigger = (
      <Button
        variant='outline'
        className={`relative w-full justify-start text-sm text-muted-foreground ${className}`}
        onClick={() => setOpen(true)}
      >
        <Search className='mr-2 h-4 w-4' />
        <span>{placeholder}</span>
        {enableShortcuts && (
          <div className='ml-auto flex items-center space-x-1'>
            <kbd className='pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100'>
              <span className='text-xs'>⌘</span>K
            </kbd>
          </div>
        )}
      </Button>
    );

    return (
      <>
        {trigger ? (
          <div onClick={() => setOpen(true)}>{trigger}</div>
        ) : (
          defaultTrigger
        )}

        <CommandDialog open={open} onOpenChange={setOpen}>
          {renderCommandContent()}
        </CommandDialog>
      </>
    );
  }

  // Inline mode
  return (
    <Command className={`rounded-lg border shadow-md ${className}`}>
      {renderCommandContent()}
    </Command>
  );
}

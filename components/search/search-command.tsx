/**
 * Search Command Palette using shadcn/ui Command
 *
 * Provides a modern, keyboard-accessible search interface with:
 * - Fast fuzzy search powered by Fuse.js
 * - Keyboard navigation
 * - Grouped results by type
 * - Search shortcuts and commands
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Search,
  Command,
  Sparkles,
  Star,
  Zap,
  Package,
  Palette,
  Heart,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface SearchCommandItem {
  id: string;
  text: string;
  type: 'fragrance' | 'brand' | 'note' | 'family' | 'command';
  confidence: number;
  description?: string;
  trending?: boolean;
  popular?: boolean;
  metadata?: Record<string, any>;
}

interface SearchCommandProps {
  trigger?: React.ReactNode;
  onSelect?: (item: SearchCommandItem) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchCommand({
  trigger,
  onSelect,
  onSearch,
  placeholder = 'Search fragrances, brands, or notes...',
  className = '',
}: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchCommandItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcut to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Debounced search function
  useEffect(() => {
    if (!query.trim()) {
      setItems(getDefaultItems());
      return;
    }

    const timer = setTimeout(async () => {
      await performSearch(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search using enhanced suggestions endpoint
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setItems(getDefaultItems());
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search/suggestions/enhanced?q=${encodeURIComponent(searchQuery)}&limit=12`
      );

      if (response.ok) {
        const data = await response.json();
        const searchItems: SearchCommandItem[] = data.suggestions.map(
          (suggestion: any, index: number) => ({
            id: `${suggestion.type}-${suggestion.text}-${index}`,
            text: suggestion.text,
            type: suggestion.type,
            confidence: suggestion.confidence,
            trending: suggestion.trending,
            popular: suggestion.confidence > 0.8,
            description: getItemDescription(suggestion.type, suggestion.text),
          })
        );

        // Add search command if we have a meaningful query
        if (searchQuery.length > 2) {
          searchItems.unshift({
            id: `search-${searchQuery}`,
            text: `Search for "${searchQuery}"`,
            type: 'command',
            confidence: 1,
            description: 'Perform a full search',
          });
        }

        setItems(searchItems);
      }
    } catch (error) {
      console.error('Search command error:', error);
      setItems(getDefaultItems());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle item selection
  const handleSelect = useCallback(
    (item: SearchCommandItem) => {
      if (item.type === 'command') {
        // Handle search command
        const searchQuery = item.text.match(/Search for "(.+)"/)?.[1] || query;
        onSearch?.(searchQuery);
        setOpen(false);
        setQuery('');
      } else {
        // Handle regular item selection
        onSelect?.(item);
        setOpen(false);
        setQuery('');
      }
    },
    [onSelect, onSearch, query]
  );

  // Get default items when no search query
  const getDefaultItems = (): SearchCommandItem[] => [
    // Quick actions
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
      description: 'Browse affordable sample and travel sizes',
    },

    // Popular searches
    {
      id: 'dior-search',
      text: 'Dior',
      type: 'brand',
      confidence: 0.9,
      popular: true,
      description: 'Luxury French fashion house fragrances',
    },
    {
      id: 'fresh-search',
      text: 'Fresh',
      type: 'family',
      confidence: 0.8,
      description: 'Clean, crisp, and energizing scents',
    },
    {
      id: 'woody-search',
      text: 'Woody',
      type: 'family',
      confidence: 0.8,
      description: 'Warm, sophisticated, and grounding fragrances',
    },
  ];

  // Get item description based on type
  const getItemDescription = (type: string, text: string): string => {
    switch (type) {
      case 'fragrance':
        return 'Fragrance';
      case 'brand':
        return 'Brand';
      case 'note':
        return 'Fragrance note';
      case 'family':
        return 'Scent family';
      default:
        return '';
    }
  };

  // Get icon for item type
  const getItemIcon = (item: SearchCommandItem) => {
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
        return item.text.includes('Browse') ? Filter : Search;
      default:
        return Search;
    }
  };

  // Group items by type
  const groupedItems = items.reduce(
    (groups, item) => {
      const group = item.type === 'command' ? 'actions' : item.type;
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    },
    {} as Record<string, SearchCommandItem[]>
  );

  // Default trigger button
  const defaultTrigger = (
    <Button
      variant='outline'
      className={`relative w-full justify-start text-sm text-muted-foreground ${className}`}
      onClick={() => setOpen(true)}
    >
      <Search className='mr-2 h-4 w-4' />
      <span>{placeholder}</span>
      <div className='ml-auto flex items-center space-x-1'>
        <kbd className='pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      </div>
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
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? 'Searching...' : 'No results found.'}
          </CommandEmpty>

          {groupedItems.actions && (
            <>
              <CommandGroup heading='Actions'>
                {groupedItems.actions.map(item => {
                  const Icon = getItemIcon(item);
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleSelect(item)}
                      className='flex items-center space-x-2'
                    >
                      <Icon className='h-4 w-4' />
                      <div className='flex-1'>
                        <div className='font-medium'>{item.text}</div>
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
              <CommandSeparator />
            </>
          )}

          {groupedItems.fragrance && (
            <CommandGroup heading='Fragrances'>
              {groupedItems.fragrance.map(item => {
                const Icon = getItemIcon(item);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className='flex items-center space-x-2'
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
                    <div className='text-xs text-muted-foreground'>
                      {Math.round(item.confidence * 100)}%
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {groupedItems.brand && (
            <CommandGroup heading='Brands'>
              {groupedItems.brand.map(item => {
                const Icon = getItemIcon(item);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className='flex items-center space-x-2'
                  >
                    <Icon className='h-4 w-4' />
                    <span>{item.text}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {(groupedItems.note || groupedItems.family) && (
            <CommandGroup heading='Notes & Families'>
              {[
                ...(groupedItems.note || []),
                ...(groupedItems.family || []),
              ].map(item => {
                const Icon = getItemIcon(item);
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className='flex items-center space-x-2'
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
      </CommandDialog>
    </>
  );
}

/**
 * Enhanced Search Input with Fuse.js Integration
 *
 * Improved search component with:
 * - Faster, more accurate suggestions
 * - Result highlighting
 * - Better UX with confidence indicators
 * - Accessibility improvements
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Zap, Star } from 'lucide-react';

interface EnhancedSuggestion {
  text: string;
  type: 'fragrance' | 'brand' | 'note' | 'family';
  confidence: number;
  trending?: boolean;
  result_count?: number;
}

interface EnhancedSearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: EnhancedSuggestion) => void;
  className?: string;
  defaultValue?: string;
  enableHighlighting?: boolean;
  showConfidence?: boolean;
  useEnhancedEndpoint?: boolean;
}

export function EnhancedSearchInput({
  placeholder = 'Search fragrances by name, brand, or notes...',
  onSearch,
  onSuggestionSelect,
  className = '',
  defaultValue = '',
  enableHighlighting = true,
  showConfidence = false,
  useEnhancedEndpoint = true,
}: EnhancedSearchInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounced search function
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim()) {
      debounceRef.current = setTimeout(() => {
        setIsLoading(true);
        onSearch(query.trim());
        setIsLoading(false);
      }, 300); // 300ms debounce for search
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onSearch]);

  // Enhanced suggestions fetch
  useEffect(() => {
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current);
    }

    if (query.trim().length >= 2) {
      suggestionsDebounceRef.current = setTimeout(async () => {
        setIsSuggestionsLoading(true);
        try {
          // Use enhanced endpoint if available, fallback to original
          const endpoint = useEnhancedEndpoint
            ? `/api/search/suggestions/enhanced?q=${encodeURIComponent(query.trim())}`
            : `/api/search/suggestions?q=${encodeURIComponent(query.trim())}`;

          const response = await fetch(endpoint);
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.suggestions || []);
            setShowSuggestions(true);
            setSelectedIndex(-1); // Reset selection
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        }
        setIsSuggestionsLoading(false);
      }, 150); // 150ms debounce for suggestions
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
    };
  }, [query, useEnhancedEndpoint]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: EnhancedSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    } else {
      onSearch(suggestion.text);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Enhanced keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        setShowSuggestions(false);
        if (query.trim()) {
          onSearch(query.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
    }
  };

  // Handle focus
  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!enableHighlighting || !query) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className='bg-yellow-200 text-yellow-900 font-medium'>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Get confidence indicator
  const getConfidenceIndicator = (confidence: number) => {
    if (confidence >= 0.8)
      return { icon: Star, color: 'text-green-500', label: 'Excellent match' };
    if (confidence >= 0.6)
      return { icon: Zap, color: 'text-blue-500', label: 'Good match' };
    return { icon: Search, color: 'text-gray-400', label: 'Match' };
  };

  // Get type badge styling
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'fragrance':
        return 'bg-purple-100 text-purple-800';
      case 'brand':
        return 'bg-blue-100 text-blue-800';
      case 'note':
        return 'bg-green-100 text-green-800';
      case 'family':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          {isLoading ? (
            <Loader2 className='h-4 w-4 text-gray-400 animate-spin' />
          ) : (
            <Search className='h-4 w-4 text-gray-400' />
          )}
        </div>

        <input
          ref={inputRef}
          type='text'
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className='block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors'
          autoComplete='off'
          aria-label='Search fragrances'
          aria-expanded={showSuggestions}
          aria-autocomplete='list'
          role='combobox'
        />

        {query && (
          <button
            onClick={handleClear}
            className='absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors'
            type='button'
            aria-label='Clear search'
          >
            <X className='h-4 w-4 text-gray-400 hover:text-gray-600' />
          </button>
        )}
      </div>

      {/* Enhanced Suggestions Dropdown */}
      {showSuggestions && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto'>
          {isSuggestionsLoading ? (
            <div className='px-3 py-3 text-sm text-gray-500 flex items-center'>
              <Loader2 className='h-3 w-3 mr-2 animate-spin' />
              Finding suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <div role='listbox' aria-label='Search suggestions'>
              {suggestions.map((suggestion, index) => {
                const {
                  icon: ConfidenceIcon,
                  color,
                  label,
                } = getConfidenceIndicator(suggestion.confidence);
                const isSelected = index === selectedIndex;

                return (
                  <button
                    key={`${suggestion.type}-${suggestion.text}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between group transition-colors ${
                      isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    role='option'
                    aria-selected={isSelected}
                  >
                    <div className='flex items-center space-x-3 flex-1 min-w-0'>
                      {showConfidence && (
                        <ConfidenceIcon
                          className={`h-3 w-3 flex-shrink-0 ${color}`}
                          title={label}
                        />
                      )}

                      <span className='text-gray-900 truncate'>
                        {highlightMatch(suggestion.text, query)}
                      </span>

                      {suggestion.trending && (
                        <Zap
                          className='h-3 w-3 text-orange-500 flex-shrink-0'
                          title='Trending'
                        />
                      )}
                    </div>

                    <div className='flex items-center space-x-2 flex-shrink-0'>
                      {suggestion.result_count && (
                        <span className='text-xs text-gray-400'>
                          {suggestion.result_count}
                        </span>
                      )}

                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getTypeBadgeClass(suggestion.type)}`}
                      >
                        {suggestion.type}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className='px-3 py-3 text-sm text-gray-500'>
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { getSearchSuggestions } from '@/lib/actions/suggestion-actions';

interface Suggestion {
  text: string;
  type: 'fragrance' | 'brand';
}

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onSuggestionSelect?: (suggestion: Suggestion) => void;
  className?: string;
  defaultValue?: string;
}

export function SearchInput({
  placeholder = 'Search fragrances by name, brand, or notes...',
  onSearch,
  onSuggestionSelect,
  className = '',
  defaultValue = '',
}: SearchInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

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

  // Debounced suggestions fetch
  useEffect(() => {
    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current);
    }

    if (query.trim().length >= 2) {
      suggestionsDebounceRef.current = setTimeout(async () => {
        setIsSuggestionsLoading(true);
        try {
          const result = await getSearchSuggestions(query.trim(), 8);
          if (result.success && result.suggestions) {
            // Map Server Action response to component interface
            const mappedSuggestions = result.suggestions.map(suggestion => ({
              text: suggestion.text,
              type:
                suggestion.type === 'fragrance'
                  ? ('fragrance' as const)
                  : ('brand' as const),
            }));
            setSuggestions(mappedSuggestions);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
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
    }

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
    };
  }, [query]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
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
    inputRef.current?.focus();
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      if (query.trim()) {
        onSearch(query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
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
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
          className='block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
          autoComplete='off'
        />

        {query && (
          <button
            onClick={handleClear}
            className='absolute inset-y-0 right-0 pr-3 flex items-center'
            type='button'
          >
            <X className='h-4 w-4 text-gray-400 hover:text-gray-600' />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
          {isSuggestionsLoading ? (
            <div className='px-3 py-2 text-sm text-gray-500 flex items-center'>
              <Loader2 className='h-3 w-3 mr-2 animate-spin' />
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.text}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className='w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between'
              >
                <span className='text-gray-900'>{suggestion.text}</span>
                <span className='text-xs text-gray-500 capitalize'>
                  {suggestion.type}
                </span>
              </button>
            ))
          ) : (
            <div className='px-3 py-2 text-sm text-gray-500'>
              No suggestions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

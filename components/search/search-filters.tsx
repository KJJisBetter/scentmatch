'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterData {
  scent_families: FilterOption[];
  brands: FilterOption[];
  occasions: FilterOption[];
  seasons: FilterOption[];
  availability: FilterOption[];
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  className?: string;
}

export interface SearchFilters {
  scent_families: string[];
  sample_only: boolean;
  occasions: string[];
  seasons: string[];
  brands: string[];
}

export function SearchFilters({ onFiltersChange, className = "" }: SearchFiltersProps) {
  const [filterData, setFilterData] = useState<FilterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Current filter state
  const [filters, setFilters] = useState<SearchFilters>({
    scent_families: [],
    sample_only: false,
    occasions: [],
    seasons: [],
    brands: []
  });

  // Load filter options from API
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetch('/api/search/filters');
        if (response.ok) {
          const data = await response.json();
          setFilterData(data);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
      setIsLoading(false);
    };

    loadFilters();
  }, []);

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Toggle filter value
  const toggleFilter = (category: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => {
      if (category === 'sample_only') {
        return { ...prev, [category]: value as boolean };
      }
      
      const currentValues = prev[category] as string[];
      const newValues = currentValues.includes(value as string)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value as string];
      
      return { ...prev, [category]: newValues };
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      scent_families: [],
      sample_only: false,
      occasions: [],
      seasons: [],
      brands: []
    });
  };

  // Check if any filters are active
  const hasActiveFilters = filters.sample_only || 
    filters.scent_families.length > 0 ||
    filters.occasions.length > 0 ||
    filters.seasons.length > 0 ||
    filters.brands.length > 0;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Mobile toggle */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full p-3 border border-gray-300 rounded-lg bg-white"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters content */}
      <div className={`space-y-6 ${isExpanded || 'hidden md:block'}`}>
        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-900">Active Filters</span>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear All
            </button>
          </div>
        )}

        {/* Sample availability - Most important for MVP */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">Availability</h3>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.sample_only}
              onChange={(e) => toggleFilter('sample_only', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Samples Available</span>
            {filterData?.availability.find(a => a.value === 'sample_available') && (
              <span className="text-xs text-gray-500">
                ({filterData.availability.find(a => a.value === 'sample_available')?.count})
              </span>
            )}
          </label>
        </div>

        {/* Scent families */}
        {filterData?.scent_families && Array.isArray(filterData.scent_families) && filterData.scent_families.length > 0 && (
          <FilterSection
            title="Scent Family"
            options={filterData.scent_families.slice(0, 8)} // Top 8 for MVP
            selectedValues={filters.scent_families}
            onToggle={(value) => toggleFilter('scent_families', value)}
          />
        )}

        {/* Occasions */}
        {filterData?.occasions && Array.isArray(filterData.occasions) && filterData.occasions.length > 0 && (
          <FilterSection
            title="Occasion"
            options={filterData.occasions.slice(0, 6)} // Top 6 for MVP
            selectedValues={filters.occasions}
            onToggle={(value) => toggleFilter('occasions', value)}
          />
        )}

        {/* Seasons */}
        {filterData?.seasons && Array.isArray(filterData.seasons) && filterData.seasons.length > 0 && (
          <FilterSection
            title="Season"
            options={filterData.seasons}
            selectedValues={filters.seasons}
            onToggle={(value) => toggleFilter('seasons', value)}
          />
        )}

        {/* Top brands */}
        {filterData?.brands && Array.isArray(filterData.brands) && filterData.brands.length > 0 && (
          <FilterSection
            title="Brand"
            options={filterData.brands.slice(0, 6)} // Top 6 brands for MVP
            selectedValues={filters.brands}
            onToggle={(value) => toggleFilter('brands', value)}
          />
        )}
      </div>
    </div>
  );
}

// Reusable filter section component
function FilterSection({
  title,
  options,
  selectedValues,
  onToggle
}: {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 flex-1">
              {option.label}
            </span>
            <span className="text-xs text-gray-500">
              ({option.count})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
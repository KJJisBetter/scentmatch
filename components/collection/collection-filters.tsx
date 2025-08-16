'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollectionFiltersProps {
  filters: {
    status: string;
    family: string;
    occasion: string;
    season: string;
    search: string;
  };
  onFilterChange: (filters: Partial<CollectionFiltersProps['filters']>) => void;
  collection: any[];
  className?: string;
}

/**
 * CollectionFilters Component
 * 
 * Advanced filtering interface for collection organization
 * Implements research-backed patterns for filter discoverability:
 * - Visual filter chips with clear removal actions
 * - Smart filter suggestions based on collection content
 * - Filter combination logic with real-time counts
 * - Mobile-optimized filter interface
 */
export function CollectionFilters({
  filters,
  onFilterChange,
  collection,
  className
}: CollectionFiltersProps) {
  // Extract unique values from collection for filter options
  const availableOptions = {
    statuses: Array.from(new Set(collection.map(item => item.status))),
    families: Array.from(new Set(
      collection.map(item => item.fragrances?.scent_family).filter(Boolean)
    )),
    occasions: Array.from(new Set(
      collection.flatMap(item => item.occasions || [])
    )),
    seasons: Array.from(new Set(
      collection.flatMap(item => item.seasons || [])
    ))
  };

  // Count items for each filter option
  const getFilterCount = (filterType: string, value: string) => {
    return collection.filter(item => {
      switch (filterType) {
        case 'status':
          return item.status === value;
        case 'family':
          return item.fragrances?.scent_family === value;
        case 'occasion':
          return item.occasions?.includes(value);
        case 'season':
          return item.seasons?.includes(value);
        default:
          return false;
      }
    }).length;
  };

  // Check if any filters are active
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'search' && value !== 'all' && value !== ''
  ) || filters.search !== '';

  // Reset all filters
  const handleResetFilters = () => {
    onFilterChange({
      status: 'all',
      family: 'all',
      occasion: 'all',
      season: 'all',
      search: ''
    });
  };

  // Remove individual filter
  const handleRemoveFilter = (filterKey: string) => {
    onFilterChange({ [filterKey]: 'all' });
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Active Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset All
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.status !== 'all' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Status: {filters.status}</span>
                <button
                  onClick={() => handleRemoveFilter('status')}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove status filter: ${filters.status}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.family !== 'all' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Family: {filters.family}</span>
                <button
                  onClick={() => handleRemoveFilter('family')}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove family filter: ${filters.family}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.occasion !== 'all' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Occasion: {filters.occasion}</span>
                <button
                  onClick={() => handleRemoveFilter('occasion')}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove occasion filter: ${filters.occasion}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.season !== 'all' && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Season: {filters.season}</span>
                <button
                  onClick={() => handleRemoveFilter('season')}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`Remove season filter: ${filters.season}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {filters.search && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Search: "{filters.search}"</span>
                <button
                  onClick={() => onFilterChange({ search: '' })}
                  className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  aria-label={`Clear search: ${filters.search}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            aria-label="Filter by collection status"
          >
            <option value="all">All Status</option>
            {availableOptions.statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)} ({getFilterCount('status', status)})
              </option>
            ))}
          </select>
        </div>

        {/* Scent Family Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Scent Family</label>
          <select
            value={filters.family}
            onChange={(e) => onFilterChange({ family: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            aria-label="Filter by scent family"
          >
            <option value="all">All Families</option>
            {availableOptions.families.map(family => (
              <option key={family} value={family}>
                {family.charAt(0).toUpperCase() + family.slice(1)} ({getFilterCount('family', family)})
              </option>
            ))}
          </select>
        </div>

        {/* Occasion Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Occasion</label>
          <select
            value={filters.occasion}
            onChange={(e) => onFilterChange({ occasion: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            aria-label="Filter by occasion"
          >
            <option value="all">All Occasions</option>
            {availableOptions.occasions.map(occasion => (
              <option key={occasion} value={occasion}>
                {occasion.charAt(0).toUpperCase() + occasion.slice(1)} ({getFilterCount('occasion', occasion)})
              </option>
            ))}
          </select>
        </div>

        {/* Season Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Season</label>
          <select
            value={filters.season}
            onChange={(e) => onFilterChange({ season: e.target.value })}
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            aria-label="Filter by season"
          >
            <option value="all">All Seasons</option>
            {availableOptions.seasons.map(season => (
              <option key={season} value={season}>
                {season.charAt(0).toUpperCase() + season.slice(1)} ({getFilterCount('season', season)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Smart Filter Suggestions */}
      {!hasActiveFilters && collection.length > 10 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Quick Filters</h4>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange({ status: 'owned' })}
              className="text-xs"
            >
              My Collection ({getFilterCount('status', 'owned')})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange({ status: 'wishlist' })}
              className="text-xs"
            >
              Wishlist ({getFilterCount('status', 'wishlist')})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange({ occasion: 'evening' })}
              className="text-xs"
            >
              Evening ({getFilterCount('occasion', 'evening')})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterChange({ season: getCurrentSeason() })}
              className="text-xs"
            >
              Current Season ({getFilterCount('season', getCurrentSeason())})
            </Button>

            {/* Most popular family as quick filter */}
            {availableOptions.families.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onFilterChange({ family: getMostPopularFamily() })}
                className="text-xs"
              >
                {getMostPopularFamily()} ({getFilterCount('family', getMostPopularFamily())})
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filter Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          {getFilteredCount()} of {collection.length} fragrances match your filters
        </div>
      )}
    </div>
  );

  // Helper function to get current season
  function getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';  
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Helper function to get most popular family
  function getMostPopularFamily(): string {
    if (availableOptions.families.length === 0) return '';
    
    const familyCounts = availableOptions.families.map(family => ({
      family,
      count: getFilterCount('family', family)
    }));
    
    return familyCounts.sort((a, b) => b.count - a.count)[0]?.family || '';
  }

  // Helper function to count filtered results
  function getFilteredCount(): number {
    return collection.filter(item => {
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      if (filters.family !== 'all' && item.fragrances?.scent_family !== filters.family) return false;
      if (filters.occasion !== 'all' && !item.occasions?.includes(filters.occasion)) return false;
      if (filters.season !== 'all' && !item.seasons?.includes(filters.season)) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          item.fragrances?.name?.toLowerCase().includes(searchLower) ||
          item.fragrances?.fragrance_brands?.name?.toLowerCase().includes(searchLower) ||
          item.personal_notes?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      return true;
    }).length;
  }
}
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  ChevronUp, 
  Crown, 
  TrendingUp, 
  Droplets,
  Users,
  Award
} from 'lucide-react';
import { getDisplayBrandName, extractConcentration } from '@/lib/brand-utils';
import { BeginnerSearchGuidance } from './beginner-search-guidance';
import { VariantExplanation } from './variant-explanation';
import { ChoiceReductionDisplay } from './choice-reduction-display';

interface FragranceResult {
  id: string;
  name: string;
  brand_id: string;
  gender?: string;
  relevance_score: number;
  similarity_score?: number;
  sample_available?: boolean;
  sample_price_usd?: number;
  image_url?: string | null;
  metadata?: any;
  collection_status?: string[];
  in_collection?: boolean;
  in_wishlist?: boolean;
  popularity_score?: number;
}

interface HierarchyGroup {
  mainFragrance: FragranceResult;
  variants: FragranceResult[];
  popularity: number;
  beginner_friendly: boolean;
  social_proof?: string;
}

interface SearchResultHierarchyProps {
  fragrances: FragranceResult[];
  query: string;
  total: number;
  isLoading?: boolean;
  onFragranceSelect?: (fragrance: FragranceResult) => void;
}

export function SearchResultHierarchy({
  fragrances,
  query,
  total,
  isLoading = false,
  onFragranceSelect
}: SearchResultHierarchyProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showAllResults, setShowAllResults] = useState(false);

  // Group fragrances by main fragrance family
  const hierarchyGroups = organizeIntoHierarchy(fragrances, query);
  
  // Detect if this is a beginner search (single fragrance name query)
  const isBeginnerQuery = detectBeginnerQuery(query, hierarchyGroups);
  
  // Show choice reduction for overwhelming results
  const shouldShowChoiceReduction = total > 10 && !showAllResults;
  const displayGroups = shouldShowChoiceReduction 
    ? hierarchyGroups.slice(0, 3) 
    : hierarchyGroups;

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  if (isLoading) {
    return <HierarchyLoadingSkeleton />;
  }

  if (fragrances.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No fragrances found for "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Beginner Guidance */}
      {isBeginnerQuery && (
        <BeginnerSearchGuidance 
          query={query}
          topGroups={hierarchyGroups.slice(0, 3)}
          onFragranceSelect={onFragranceSelect}
        />
      )}

      {/* Choice Reduction Notice */}
      {shouldShowChoiceReduction && (
        <ChoiceReductionDisplay
          totalResults={total}
          showingCount={displayGroups.length}
          onShowAll={() => setShowAllResults(true)}
        />
      )}

      {/* Hierarchy Results */}
      <div className="space-y-4">
        {displayGroups.map((group, index) => (
          <HierarchyGroup
            key={group.mainFragrance.id}
            group={group}
            index={index}
            isExpanded={expandedGroups.has(group.mainFragrance.id)}
            onToggleExpansion={() => toggleGroupExpansion(group.mainFragrance.id)}
            onFragranceSelect={onFragranceSelect}
            showPriority={index < 3 && isBeginnerQuery}
          />
        ))}
      </div>

      {/* Show More Button */}
      {shouldShowChoiceReduction && !showAllResults && (
        <div className="text-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setShowAllResults(true)}
            className="text-sm"
          >
            Show {total - displayGroups.length} more results
          </Button>
        </div>
      )}

      {/* Educational Context */}
      {isBeginnerQuery && (
        <VariantExplanation 
          mainFragranceName={hierarchyGroups[0]?.mainFragrance.name}
        />
      )}
    </div>
  );
}

function HierarchyGroup({
  group,
  index,
  isExpanded,
  onToggleExpansion,
  onFragranceSelect,
  showPriority
}: {
  group: HierarchyGroup;
  index: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  onFragranceSelect?: (fragrance: FragranceResult) => void;
  showPriority: boolean;
}) {
  const { mainFragrance, variants } = group;
  const { name: cleanName, concentration, abbreviation } = extractConcentration(mainFragrance.name);
  const brandName = getDisplayBrandName(mainFragrance.brand_id, mainFragrance.name);

  // Priority indicators for beginners
  const getPriorityIndicator = () => {
    if (!showPriority) return null;
    
    switch (index) {
      case 0:
        return (
          <div className="flex items-center gap-1 text-amber-600 font-medium">
            <Crown className="h-4 w-4 fill-current" />
            <span className="text-sm">MOST POPULAR</span>
          </div>
        );
      case 1:
        return (
          <div className="flex items-center gap-1 text-purple-600 font-medium">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">STRONGER VERSION</span>
          </div>
        );
      case 2:
        return (
          <div className="flex items-center gap-1 text-blue-600 font-medium">
            <Droplets className="h-4 w-4" />
            <span className="text-sm">LIGHTER VERSION</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Social proof indicators
  const getSocialProof = () => {
    if (!group.social_proof) return null;
    
    return (
      <Badge variant="secondary" className="text-xs">
        <Users className="h-3 w-3 mr-1" />
        {group.social_proof}
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Main Fragrance Display */}
        <div 
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onFragranceSelect?.(mainFragrance)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Priority Indicator */}
              {getPriorityIndicator()}
              
              {/* Brand and Name */}
              <div className="mt-2">
                <p className="text-sm text-muted-foreground font-medium">
                  {brandName}
                </p>
                <h3 className="font-semibold text-lg text-foreground leading-tight">
                  {cleanName}
                </h3>
                
                {/* Concentration and Social Proof */}
                <div className="flex items-center gap-2 mt-2">
                  {concentration && (
                    <Badge variant="outline" className="text-xs">
                      {abbreviation}
                    </Badge>
                  )}
                  {getSocialProof()}
                  {group.beginner_friendly && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      Beginner Friendly
                    </Badge>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span>Popularity: {(group.popularity * 100).toFixed(0)}%</span>
                {mainFragrance.sample_available && (
                  <span className="text-green-600">Sample Available</span>
                )}
              </div>
            </div>

            {/* Variants Toggle */}
            {variants.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpansion();
                }}
                className="ml-4"
              >
                <span className="text-xs mr-1">
                  {variants.length} variant{variants.length !== 1 ? 's' : ''}
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Variants Section */}
        {variants.length > 0 && isExpanded && (
          <div className="border-t bg-muted/20">
            <div className="p-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Other Concentrations & Variants
              </h4>
              {variants.map((variant) => (
                <VariantCard 
                  key={variant.id}
                  fragrance={variant}
                  onClick={() => onFragranceSelect?.(variant)}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VariantCard({ 
  fragrance, 
  onClick 
}: { 
  fragrance: FragranceResult;
  onClick: () => void;
}) {
  const { name: cleanName, concentration, abbreviation } = extractConcentration(fragrance.name);
  
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div>
        <p className="font-medium text-sm">{cleanName}</p>
        {concentration && (
          <p className="text-xs text-muted-foreground">{concentration}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {abbreviation && (
          <Badge variant="outline" className="text-xs">
            {abbreviation}
          </Badge>
        )}
        {fragrance.sample_available && (
          <Badge className="bg-green-100 text-green-800 text-xs">
            Sample
          </Badge>
        )}
      </div>
    </div>
  );
}

function HierarchyLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-muted animate-pulse rounded" />
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper Functions

function organizeIntoHierarchy(fragrances: FragranceResult[], query: string): HierarchyGroup[] {
  // Group fragrances by base name (without concentration)
  const groups: Record<string, FragranceResult[]> = {};
  
  fragrances.forEach(fragrance => {
    const { name: baseName } = extractConcentration(fragrance.name);
    const brandName = getDisplayBrandName(fragrance.brand_id, fragrance.name);
    const groupKey = `${brandName}-${baseName}`.toLowerCase();
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(fragrance);
  });

  // Convert to hierarchy groups
  const hierarchyGroups: HierarchyGroup[] = Object.values(groups)
    .filter(group => group.length > 0)
    .map(group => {
      // Sort by popularity/relevance to determine main fragrance
      const sorted = group.sort((a, b) => {
        const aScore = (a.popularity_score || 0) + (a.relevance_score || 0);
        const bScore = (b.popularity_score || 0) + (b.relevance_score || 0);
        return bScore - aScore;
      });

      const mainFragrance = sorted[0];
      if (!mainFragrance) {
        throw new Error('Main fragrance should exist after filtering');
      }
      
      const variants = sorted.slice(1);
      
      return {
        mainFragrance,
        variants,
        popularity: mainFragrance.popularity_score || mainFragrance.relevance_score || 0.5,
        beginner_friendly: assessBeginnerFriendliness(mainFragrance),
        social_proof: generateSocialProof(mainFragrance, query)
      };
    });

  // Sort groups by relevance and popularity
  return hierarchyGroups.sort((a, b) => {
    // Prioritize exact matches for beginner queries
    const aIsExactMatch = a.mainFragrance ? isExactMatch(a.mainFragrance.name, query) : false;
    const bIsExactMatch = b.mainFragrance ? isExactMatch(b.mainFragrance.name, query) : false;
    
    if (aIsExactMatch && !bIsExactMatch) return -1;
    if (bIsExactMatch && !aIsExactMatch) return 1;
    
    // Then sort by popularity
    return b.popularity - a.popularity;
  });
}

function detectBeginnerQuery(query: string, groups: HierarchyGroup[]): boolean {
  if (!query || query.length < 3) return false;
  
  // Check if query is a single fragrance name (not descriptive search)
  const words = query.toLowerCase().trim().split(/\s+/);
  
  // Single word searches are likely fragrance names
  if (words.length === 1) return true;
  
  // Check if top result is an exact match (indicates specific fragrance search)
  if (groups.length > 0 && groups[0] && groups[0].mainFragrance) {
    return isExactMatch(groups[0].mainFragrance.name, query);
  }
  
  return false;
}

function isExactMatch(fragranceName: string, query: string): boolean {
  const { name: cleanName } = extractConcentration(fragranceName);
  return cleanName.toLowerCase().includes(query.toLowerCase().trim());
}

function assessBeginnerFriendliness(fragrance: FragranceResult): boolean {
  // Factors that make a fragrance beginner-friendly
  const factors = {
    hasPopularity: (fragrance.popularity_score || 0) > 0.7,
    hasSample: fragrance.sample_available || false,
    isMainstream: isMainstreamBrand(fragrance.brand_id),
    isEasyWear: true // Could be enhanced with scent family analysis
  };
  
  // Must have at least 2 factors to be beginner-friendly
  const score = Object.values(factors).filter(Boolean).length;
  return score >= 2;
}

function isMainstreamBrand(brandId: string): boolean {
  const mainstream = [
    'dior', 'chanel', 'giorgio armani', 'tom ford', 'yves saint laurent',
    'creed', 'versace', 'dolce gabbana', 'calvin klein', 'hugo boss'
  ];
  
  return mainstream.some(brand => 
    brandId.toLowerCase().includes(brand) || 
    getDisplayBrandName(brandId).toLowerCase().includes(brand)
  );
}

function generateSocialProof(fragrance: FragranceResult, query: string): string | undefined {
  const { name: cleanName } = extractConcentration(fragrance.name);
  const popularity = fragrance.popularity_score || fragrance.relevance_score || 0;
  
  // Popular beginner fragrances get social proof
  if (popularity > 0.8) {
    if (cleanName.toLowerCase().includes('sauvage')) {
      return 'Popular with college students';
    }
    if (cleanName.toLowerCase().includes('bleu')) {
      return 'Office-friendly choice';
    }
    if (cleanName.toLowerCase().includes('creed') || cleanName.toLowerCase().includes('aventus')) {
      return 'Luxury favorite';
    }
    if (cleanName.toLowerCase().includes('one million')) {
      return 'Night out essential';
    }
  }
  
  return undefined;
}
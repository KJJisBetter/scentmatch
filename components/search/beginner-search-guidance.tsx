'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lightbulb, 
  Crown, 
  TrendingUp, 
  Droplets,
  Users,
  Star,
  ArrowRight
} from 'lucide-react';
import { getDisplayBrandName, extractConcentration } from '@/lib/brand-utils';

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

interface BeginnerSearchGuidanceProps {
  query: string;
  topGroups: HierarchyGroup[];
  onFragranceSelect?: (fragrance: FragranceResult) => void;
}

export function BeginnerSearchGuidance({
  query,
  topGroups,
  onFragranceSelect
}: BeginnerSearchGuidanceProps) {
  if (topGroups.length === 0) return null;

  const topFragrance = topGroups[0]?.mainFragrance;
  if (!topFragrance) return null;
  
  const { name: cleanName } = extractConcentration(topFragrance.name);
  const brandName = getDisplayBrandName(topFragrance.brand_id, topFragrance.name);

  // Get beginner-specific guidance based on the search
  const guidance = getBeginnerGuidance(query, topGroups);

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2 mt-1">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              New to {cleanName}? Start here!
            </h3>
            
            <p className="text-blue-800 text-sm mb-4">
              {guidance.message}
            </p>

            {/* Quick Start Recommendations */}
            <div className="space-y-3">
              <h4 className="font-medium text-blue-900 text-sm">
                Most beginners choose:
              </h4>
              
              {topGroups.slice(0, 3).map((group, index) => (
                <BeginnerRecommendationCard
                  key={group.mainFragrance.id}
                  group={group}
                  index={index}
                  onSelect={() => onFragranceSelect?.(group.mainFragrance)}
                />
              ))}
            </div>

            {/* Pro Tip */}
            {guidance.tip && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Pro tip:</strong> {guidance.tip}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BeginnerRecommendationCard({
  group,
  index,
  onSelect
}: {
  group: HierarchyGroup;
  index: number;
  onSelect: () => void;
}) {
  const { mainFragrance, social_proof } = group;
  const { name: cleanName, concentration, abbreviation } = extractConcentration(mainFragrance.name);
  const brandName = getDisplayBrandName(mainFragrance.brand_id, mainFragrance.name);

  // Get recommendation reasons
  const recommendation = getRecommendationReason(index, mainFragrance, social_proof);

  return (
    <div 
      className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-200 cursor-pointer transition-colors group"
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        {/* Priority Icon */}
        <div className="flex-shrink-0">
          {recommendation.icon}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-blue-900">
              {recommendation.label}
            </span>
            <Badge variant="outline" className="text-xs">
              {abbreviation || 'Standard'}
            </Badge>
          </div>
          
          <p className="text-xs text-blue-700 mt-1">
            {brandName} {cleanName}
          </p>
          
          {/* Social proof or characteristics */}
          <div className="flex items-center gap-2 mt-1">
            {social_proof && (
              <Badge variant="secondary" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                {social_proof}
              </Badge>
            )}
            {mainFragrance.sample_available && (
              <Badge className="bg-green-100 text-green-800 text-xs">
                Sample Available
              </Badge>
            )}
          </div>
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
    </div>
  );
}

// Helper Functions

function getBeginnerGuidance(query: string, topGroups: HierarchyGroup[]): {
  message: string;
  tip?: string;
} {
  const queryLower = query.toLowerCase();
  const topFragrance = topGroups[0]?.mainFragrance;
  if (!topFragrance) {
    return {
      message: 'Start with the most popular option to get a feel for this fragrance family.',
      tip: 'Always try a sample first before committing to a full bottle.'
    };
  }
  
  const { name: cleanName } = extractConcentration(topFragrance.name);
  
  // Fragrance-specific guidance
  if (queryLower.includes('sauvage')) {
    return {
      message: 'Sauvage is a modern classic! It\'s fresh, versatile, and perfect for beginners. The EDP version is most popular because it lasts longer.',
      tip: 'Start with a sample or small bottle. Sauvage projects strongly, so 2-3 sprays are enough.'
    };
  }
  
  if (queryLower.includes('bleu')) {
    return {
      message: 'Bleu de Chanel is sophisticated and office-friendly. It\'s a safe choice that works for most occasions.',
      tip: 'The Parfum concentration is the most refined, while EDP offers the best balance of performance and price.'
    };
  }
  
  if (queryLower.includes('aventus')) {
    return {
      message: 'Aventus is a luxury powerhouse known for its unique pineapple-birch combination. It\'s expensive but iconic.',
      tip: 'Consider trying a sample first due to the high price. Many find it addictive once they experience it.'
    };
  }
  
  if (queryLower.includes('one million')) {
    return {
      message: 'One Million is a sweet, attention-grabbing fragrance perfect for nights out and special occasions.',
      tip: 'This is best for cooler weather and evening wear. A little goes a long way with this one.'
    };
  }
  
  // Generic guidance for unknown fragrances
  return {
    message: `We found several versions of ${cleanName}. The most popular option is usually the best starting point for beginners.`,
    tip: 'When in doubt, choose the EDP (Eau de Parfum) concentration for better longevity, or start with a sample.'
  };
}

function getRecommendationReason(index: number, fragrance: FragranceResult, socialProof?: string): {
  label: string;
  icon: React.ReactNode;
  reason: string;
} {
  const { concentration } = extractConcentration(fragrance.name);
  
  switch (index) {
    case 0:
      return {
        label: 'Most Popular Choice',
        icon: <Crown className="h-4 w-4 text-amber-500" />,
        reason: 'This is what most people start with'
      };
    case 1:
      return {
        label: concentration?.includes('Elixir') || concentration?.includes('Intense') 
          ? 'Stronger Version' 
          : 'Alternative Option',
        icon: <TrendingUp className="h-4 w-4 text-purple-500" />,
        reason: 'More intense and longer-lasting'
      };
    case 2:
      return {
        label: concentration?.includes('EDT') || concentration?.includes('Cologne')
          ? 'Lighter Version'
          : 'Third Option',
        icon: <Droplets className="h-4 w-4 text-blue-500" />,
        reason: 'Fresher and more subtle'
      };
    default:
      return {
        label: 'Worth Considering',
        icon: <Star className="h-4 w-4 text-gray-500" />,
        reason: 'Another great option'
      };
  }
}
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, Sparkles } from 'lucide-react';
import { InteractionTracker } from './interaction-tracker';
import { cn } from '@/lib/utils';

interface SimilarFragrance {
  fragrance_id: string;
  similarity_score: number;
  name: string;
  brand: string;
  image_url?: string;
  sample_available?: boolean;
  sample_price_usd?: number;
  scent_family?: string;
}

interface SimilarFragrancesProps {
  fragranceId: string;
  similarFragrances: SimilarFragrance[];
  maxResults?: number;
  showScores?: boolean;
  className?: string;
}

/**
 * SimilarFragrances Component
 * 
 * Displays vector similarity-based fragrance recommendations
 * Implements research-backed recommendation UI patterns
 * Supports progressive disclosure and mobile-optimized interactions
 */
export function SimilarFragrances({
  fragranceId,
  similarFragrances,
  maxResults = 6,
  showScores = true,
  className,
}: SimilarFragrancesProps) {
  const router = useRouter();
  const [trackInteraction, setTrackInteraction] = useState<{
    type: string;
    context: string;
    metadata?: any;
  } | null>(null);

  const displayedFragrances = similarFragrances.slice(0, maxResults);

  const handleFragranceClick = (targetFragranceId: string, similarityScore: number) => {
    // Track the interaction
    setTrackInteraction({
      type: 'view',
      context: 'similar_recommendations',
      metadata: {
        source_fragrance_id: fragranceId,
        target_fragrance_id: targetFragranceId,
        similarity_score: similarityScore,
        position: displayedFragrances.findIndex(f => f.fragrance_id === targetFragranceId),
      },
    });

    // Navigate to the new fragrance page
    router.push(`/fragrance/${targetFragranceId}`);
  };

  if (displayedFragrances.length === 0) {
    return (
      <Card className={cn('text-center py-8', className)}>
        <CardContent>
          <div className="text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No similar fragrances found.</p>
            <p className="text-sm mt-1">Check back later as we expand our catalog.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {trackInteraction && (
        <InteractionTracker
          fragranceId={fragranceId}
          interactionType={trackInteraction.type as any}
          interactionContext={trackInteraction.context}
          metadata={trackInteraction.metadata}
        />
      )}
      
      <div className={cn('space-y-6', className)}>
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Similar Fragrances</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations based on scent profile
            </p>
          </div>
          
          {showScores && (
            <Badge variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Matched
            </Badge>
          )}
        </div>

        {/* Fragrance Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedFragrances.map((fragrance, index) => (
            <Card
              key={fragrance.fragrance_id}
              className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              onClick={() => handleFragranceClick(fragrance.fragrance_id, fragrance.similarity_score)}
            >
              <CardContent className="p-4">
                {/* Fragrance Image */}
                <div className="aspect-square relative mb-3 bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg overflow-hidden">
                  {fragrance.image_url ? (
                    <Image
                      src={fragrance.image_url}
                      alt={`${fragrance.name} by ${fragrance.brand}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🌸</div>
                        <p className="text-xs">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Similarity Score Badge */}
                  {showScores && (
                    <Badge
                      variant="default"
                      className="absolute top-2 right-2 bg-white/90 text-plum-700 shadow-sm"
                    >
                      {Math.round(fragrance.similarity_score * 100)}% match
                    </Badge>
                  )}

                  {/* Sample Available Indicator */}
                  {fragrance.sample_available && (
                    <Badge
                      variant="accent"
                      className="absolute bottom-2 left-2 text-xs"
                    >
                      Sample Available
                    </Badge>
                  )}
                </div>

                {/* Fragrance Information */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-plum-700 transition-colors">
                    {fragrance.name}
                  </h4>
                  
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {fragrance.brand}
                  </p>

                  {fragrance.scent_family && (
                    <Badge variant="outline" className="text-xs">
                      {fragrance.scent_family}
                    </Badge>
                  )}

                  {/* Sample Pricing */}
                  {fragrance.sample_available && fragrance.sample_price_usd && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">Sample</span>
                      <span className="text-sm font-medium text-foreground">
                        ${fragrance.sample_price_usd.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Quick Action Overlay (appears on hover) */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-white text-black hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFragranceClick(fragrance.fragrance_id, fragrance.similarity_score);
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More / View All */}
        {similarFragrances.length > maxResults && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              View All Similar Fragrances ({similarFragrances.length})
            </Button>
          </div>
        )}

        {/* AI Recommendation Disclaimer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Recommendations powered by AI analysis of scent profiles and user preferences
          </p>
        </div>
      </div>
    </>
  );
}

// Loading skeleton for Suspense boundary
export function SimilarFragrancesSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="aspect-square mb-3" />
              <Skeleton className="h-4 mb-2" />
              <Skeleton className="h-3 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
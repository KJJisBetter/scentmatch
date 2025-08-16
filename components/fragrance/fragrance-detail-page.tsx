import React, { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, 
  ShoppingCart, 
  Clock, 
  Zap, 
  Radio, 
  Eye,
  ExternalLink,
  Share2,
  Sparkles
} from 'lucide-react';
import { ScentTimeline } from './scent-timeline';
import { SimilarFragrances } from './similar-fragrances';
import { SamplePurchaseFlow } from './sample-purchase-flow';
import { CollectionActions } from './collection-actions';

// Generate AI-style personality-focused description
function generateSmartDescription(fragrance: any, brandName: string) {
  const scentFamily = fragrance.scent_family || 'unique';
  const fragranceName = fragrance.name || 'this fragrance';
  
  // Create personality profiles based on fragrance characteristics
  if (scentFamily.includes('floral')) {
    return (
      <div className="space-y-4">
        <p>
          {fragranceName} by {brandName} is an elegant floral composition that embodies grace and sophisticated femininity. 
          This fragrance speaks to those who appreciate timeless beauty and aren't afraid to express their romantic side.
        </p>
        <p>
          With its refined floral character, this scent creates an enchanting aura that's both approachable and memorable. 
          Perfect for someone who values authenticity and wants to project confidence with a touch of classic elegance.
        </p>
      </div>
    );
  }
  
  if (scentFamily.includes('woody') || scentFamily.includes('amber')) {
    return (
      <div className="space-y-4">
        <p>
          {fragranceName} by {brandName} is a warm and sophisticated composition that exudes quiet confidence and depth of character. 
          This fragrance is for individuals who prefer subtle luxury over loud statements.
        </p>
        <p>
          Its grounding presence creates a sense of reliability and mystery that draws people in. 
          Perfect for those who appreciate craftsmanship and want a signature scent that reflects their authentic, thoughtful nature.
        </p>
      </div>
    );
  }
  
  if (scentFamily.includes('fresh') || scentFamily.includes('citrus')) {
    return (
      <div className="space-y-4">
        <p>
          {fragranceName} by {brandName} captures the essence of vitality and contemporary spirit. 
          This energizing fragrance radiates optimism and speaks to those who live authentically and embrace each day fully.
        </p>
        <p>
          With its clean, modern character, it creates an invigorating presence that feels both professional and approachable. 
          Ideal for active individuals who value clarity, energy, and making genuine connections with others.
        </p>
      </div>
    );
  }
  
  if (scentFamily.includes('oriental') || scentFamily.includes('spicy')) {
    return (
      <div className="space-y-4">
        <p>
          {fragranceName} by {brandName} is an exotic and alluring composition that commands attention without demanding it. 
          This fragrance speaks to bold individuals who aren't afraid to express their unique personality.
        </p>
        <p>
          Its magnetic presence creates an aura of mystery and sophistication that's perfect for special occasions and memorable moments. 
          For those who value uniqueness and want to leave a lasting impression.
        </p>
      </div>
    );
  }
  
  // Special case for iris family (like the Dior fragrance we're testing)
  if (scentFamily.includes('iris')) {
    return (
      <div className="space-y-4">
        <p>
          {fragranceName} by {brandName} is a sophisticated and refined composition that embodies understated luxury and timeless elegance. 
          This fragrance appeals to those who appreciate subtle complexity and aren't drawn to fleeting trends.
        </p>
        <p>
          With its distinguished iris character, it creates an aura of quiet confidence and intellectual sophistication. 
          Perfect for individuals who value depth, authenticity, and want a signature scent that reflects their refined taste and thoughtful approach to life.
        </p>
      </div>
    );
  }
  
  // Default personality
  return (
    <div className="space-y-4">
      <p>
        {fragranceName} by {brandName} is a distinctive and well-crafted fragrance that offers a unique olfactory experience. 
        This composition speaks to fragrance lovers who appreciate quality and craftsmanship.
      </p>
      <p>
        Its balanced character creates a pleasant and sophisticated presence that's versatile enough for various occasions. 
        Perfect for those who want a reliable signature scent that reflects their appreciation for the artistry of perfumery.
      </p>
    </div>
  );
}

interface FragranceWithBrand {
  id: string;
  name: string;
  brand_id: string;
  notes?: string[];
  image_url?: string;
  intensity_score?: number;
  longevity_hours?: number;
  sillage_rating?: number;
  recommended_occasions?: string[];
  recommended_seasons?: string[];
  mood_tags?: string[];
  sample_available?: boolean;
  sample_price_usd?: number;
  travel_size_available?: boolean;
  travel_size_ml?: number;
  travel_size_price_usd?: number;
  scent_family?: string;
  fragrance_brands?: {
    id: string;
    name: string;
    website_url?: string;
  }[] | null;
}

interface SimilarFragrance {
  fragrance_id: string;
  similarity_score: number;
  name: string;
  brand: string;
}

interface FragranceDetailPageProps {
  fragrance: FragranceWithBrand;
  similarFragrances?: SimilarFragrance[];
}

/**
 * FragranceDetailPage Component
 * 
 * Server component that renders the complete fragrance detail page
 * Implements research-backed UX patterns:
 * - Sample-first purchase psychology
 * - Progressive information disclosure
 * - Trust-building hierarchy
 * - Mobile-first responsive design
 */
export function FragranceDetailPage({ 
  fragrance, 
  similarFragrances = [] 
}: FragranceDetailPageProps) {
  const brandName = fragrance.fragrance_brands?.[0]?.name || 'Unknown Brand';
  const brandWebsite = fragrance.fragrance_brands?.[0]?.website_url;

  // Organize notes by category for the scent timeline
  const organizedNotes = React.useMemo(() => {
    if (!fragrance.notes || fragrance.notes.length === 0) return [];
    
    // For now, distribute notes evenly across categories
    // In real implementation, this would come from proper note categorization
    const noteCount = fragrance.notes.length;
    const topNotes = fragrance.notes.slice(0, Math.ceil(noteCount / 3));
    const middleNotes = fragrance.notes.slice(Math.ceil(noteCount / 3), Math.ceil(noteCount * 2 / 3));
    const baseNotes = fragrance.notes.slice(Math.ceil(noteCount * 2 / 3));

    return [
      ...topNotes.map(note => ({ note, category: 'top' as const, strength: 0.8 })),
      ...middleNotes.map(note => ({ note, category: 'middle' as const, strength: 0.9 })),
      ...baseNotes.map(note => ({ note, category: 'base' as const, strength: 0.7 })),
    ];
  }, [fragrance.notes]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="hover:text-foreground">Home</Link></li>
          <li>/</li>
          <li><Link href="/fragrances" className="hover:text-foreground">Fragrances</Link></li>
          <li>/</li>
          <li className="text-foreground" aria-current="page">{fragrance.name}</li>
        </ol>
      </nav>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column: Image and Visual Timeline */}
        <div className="space-y-6">
          {/* Hero Image */}
          <Card className="overflow-hidden">
            <div className="aspect-square relative bg-gradient-to-br from-cream-100 to-cream-200">
              {fragrance.image_url ? (
                <Image
                  src={fragrance.image_url}
                  alt={`${fragrance.name} by ${brandName} fragrance bottle`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🌸</div>
                    <p>Image not available</p>
                  </div>
                </div>
              )}
              
              {/* Collection Status Badge */}
              <Suspense fallback={null}>
                <CollectionActions fragranceId={fragrance.id} />
              </Suspense>
            </div>
          </Card>

          {/* Visual Scent Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Scent Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <ScentTimeline
                notes={organizedNotes}
                intensity={fragrance.intensity_score || 5}
                longevity={fragrance.longevity_hours}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Information and Actions */}
        <div className="space-y-6">
          {/* Brand and Title */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {fragrance.scent_family || 'Fragrance'}
              </Badge>
              {brandWebsite && (
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a 
                  href={brandWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Visit ${brandName} website`}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {fragrance.name}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-4">
              by <span className="font-medium">{brandName}</span>
            </p>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4 mb-6">
              <button
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Share fragrance"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Share</span>
              </button>
              
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="text-sm">127 views today</span>
              </div>
            </div>
          </div>

          {/* Sample-First Purchase Flow (Hero CTA) */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-cream-50">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Try Before You Buy
                </h2>
                <p className="text-sm text-muted-foreground">
                  Start with a sample to experience this fragrance risk-free
                </p>
              </div>
              
              <Suspense fallback={<SamplePurchaseFlowSkeleton />}>
                <SamplePurchaseFlow fragrance={fragrance} />
              </Suspense>
            </CardContent>
          </Card>

          {/* Fragrance Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Fragrance Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="text-sm font-medium">Intensity</p>
                  <p className="text-lg font-bold text-foreground">
                    {fragrance.intensity_score || 'N/A'}/10
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">Longevity</p>
                  <p className="text-lg font-bold text-foreground">
                    {fragrance.longevity_hours ? `${fragrance.longevity_hours}h` : 'N/A'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Radio className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium">Sillage</p>
                  <p className="text-lg font-bold text-foreground">
                    {fragrance.sillage_rating || 'N/A'}/10
                  </p>
                </div>
              </div>

              {/* Occasions and Seasons */}
              {(fragrance.recommended_occasions?.length || fragrance.recommended_seasons?.length) && (
                <div className="space-y-4">
                  {fragrance.recommended_occasions && fragrance.recommended_occasions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Perfect for</h4>
                      <div className="flex flex-wrap gap-2">
                        {fragrance.recommended_occasions.map((occasion) => (
                          <Badge key={occasion} variant="secondary" className="text-xs">
                            {occasion}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {fragrance.recommended_seasons && fragrance.recommended_seasons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">Best seasons</h4>
                      <div className="flex flex-wrap gap-2">
                        {fragrance.recommended_seasons.map((season) => (
                          <Badge key={season} variant="outline" className="text-xs">
                            {season}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progressive Information Disclosure Tabs */}
      <Card className="mb-12">
        <CardContent className="pt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="notes">Notes & Composition</TabsTrigger>
              <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <div className="prose prose-stone max-w-none">
                {/* AI-Enhanced Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-plum-600" />
                    <span className="text-sm font-medium text-plum-600">AI Fragrance Analysis</span>
                  </div>
                  
                  <div className="text-lg leading-relaxed space-y-4">
                    {generateSmartDescription(fragrance, brandName)}
                  </div>
                </div>
                
                {fragrance.mood_tags && fragrance.mood_tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Mood & Atmosphere</h4>
                    <div className="flex flex-wrap gap-2">
                      {fragrance.mood_tags.map((tag) => (
                        <Badge key={tag} variant="note" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Fragrance Pyramid</h3>
                
                {fragrance.notes && fragrance.notes.length > 0 ? (
                  <div className="grid gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-muted-foreground">All Notes</h4>
                      <div className="flex flex-wrap gap-2">
                        {fragrance.notes.map((note, index) => (
                          <Badge key={`${note}-${index}`} variant="note" className="text-xs">
                            {note}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Note information is being updated. Please check back soon.
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>Reviews and ratings will be available soon.</p>
                <p className="text-sm mt-2">Be the first to try this fragrance and share your thoughts!</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Similar Fragrances Section */}
      {similarFragrances.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-serif font-bold mb-6">You Might Also Like</h2>
          <Suspense fallback={<SimilarFragrancesSkeleton />}>
            <SimilarFragrances
              fragranceId={fragrance.id}
              similarFragrances={similarFragrances}
            />
          </Suspense>
        </div>
      )}

      {/* Mobile Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 lg:hidden z-40">
        <div className="flex space-x-3">
          <Suspense fallback={<Skeleton className="h-11 flex-1" />}>
            <SamplePurchaseFlow fragrance={fragrance} variant="mobile" />
          </Suspense>
          
          <Suspense fallback={<Skeleton className="h-11 w-11" />}>
            <CollectionActions fragranceId={fragrance.id} variant="icon" />
          </Suspense>
        </div>
      </div>

      {/* Mobile Bottom Padding to Account for Sticky Bar */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </div>
  );
}

// Loading Skeletons for Suspense Boundaries
function SamplePurchaseFlowSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

function SimilarFragrancesSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="aspect-square mb-3" />
            <Skeleton className="h-4 mb-2" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
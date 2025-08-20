'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Grid,
  List,
  Circle,
  Calendar,
  Filter,
  Search,
  Download,
  Plus,
  Settings,
  Sparkles
} from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase-client';
import { ViewSwitcher } from './view-switcher';
import { CollectionFilters } from './collection-filters';
import { GridView } from './grid-view';
import { ListView } from './list-view';
import { WheelView } from './wheel-view';
import { CalendarView } from './calendar-view';
import { AIInsights } from './ai-insights';
import { CollectionManager } from './collection-manager';
import { InteractionTracker } from '../fragrance/interaction-tracker';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  experience_level?: string;
  favorite_accords?: string[];
  disliked_accords?: string[];
  privacy_settings?: any;
}

interface CollectionStats {
  total_fragrances: number;
  diversity_score: number;
  dominant_families: string[];
  average_rating?: number;
  by_status?: any;
  recent_additions?: any[];
}

interface CollectionDashboardProps {
  userId: string;
  userProfile?: UserProfile;
  initialStats?: CollectionStats;
  recentActivity?: any[];
}

type ViewMode = 'grid' | 'list' | 'wheel' | 'calendar';
type ProgressiveView = 'currently-wearing' | 'this-season' | 'entire-collection';

/**
 * CollectionDashboard Component
 * 
 * Main collection management interface implementing research-backed UX patterns:
 * - Progressive disclosure to avoid cognitive overload
 * - Multiple visualization modes for different user preferences
 * - AI-powered insights with explainable transparency
 * - Mobile-first responsive design with thumb-zone optimization
 * - Performance optimization for large collections
 */
export function CollectionDashboard({
  userId,
  userProfile,
  initialStats,
  recentActivity = []
}: CollectionDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Dashboard state management
  const [currentView, setCurrentView] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'grid'
  );
  const [progressiveView, setProgressiveView] = useState<ProgressiveView>('currently-wearing');
  const [collection, setCollection] = useState<any[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<any[]>([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>(
    initialStats || {
      total_fragrances: 0,
      diversity_score: 0,
      dominant_families: []
    }
  );
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    family: 'all',
    occasion: 'all',
    season: 'all',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [trackInteraction, setTrackInteraction] = useState<{
    type: string;
    context: string;
    metadata?: any;
  } | null>(null);

  // Load collection data
  useEffect(() => {
    const loadCollection = async () => {
      try {
        setIsLoading(true);
        const supabase = createClientSupabase();
        
        // Fetch user's complete collection with basic details
        const { data: collectionData, error } = await supabase
          .from('user_collections')
          .select(`
            id,
            fragrance_id,
            added_at,
            fragrances:fragrance_id (
              id,
              name,
              brand_id,
              sample_available,
              sample_price_usd,
              fragrance_brands:brand_id (
                name
              )
            )
          `)
          .eq('user_id', userId)
          .order('added_at', { ascending: false });

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading collection:', error);
          }
          return;
        }

        setCollection(collectionData || []);
        
        // Update stats if we have fresh data
        if (collectionData && collectionData.length > 0) {
          const stats = calculateCollectionStats(collectionData);
          setCollectionStats(stats);
        }

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error in loadCollection:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [userId]);

  // Apply filters and progressive view logic
  useEffect(() => {
    let filtered = [...collection];

    // Apply progressive view logic first
    if (progressiveView === 'currently-wearing') {
      // Show recently used or high-rating fragrances (max 5)
      filtered = filtered
        .filter(item => 
          item.usage_frequency === 'daily' || 
          item.usage_frequency === 'weekly' ||
          (item.rating && item.rating >= 4)
        )
        .slice(0, 5);
    } else if (progressiveView === 'this-season') {
      // Show current season fragrances (max 15)
      const currentSeason = getCurrentSeason();
      filtered = filtered
        .filter(item => 
          !item.seasons || 
          item.seasons.length === 0 || 
          item.seasons.includes(currentSeason)
        )
        .slice(0, 15);
    }
    // 'entire-collection' shows all items

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    if (filters.family !== 'all') {
      filtered = filtered.filter(item => 
        item.fragrances?.scent_family === filters.family
      );
    }
    
    if (filters.occasion !== 'all') {
      filtered = filtered.filter(item => 
        item.occasions?.includes(filters.occasion)
      );
    }
    
    if (filters.season !== 'all') {
      filtered = filtered.filter(item => 
        item.seasons?.includes(filters.season)
      );
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.fragrances?.name?.toLowerCase().includes(searchLower) ||
        item.fragrances?.fragrance_brands?.name?.toLowerCase().includes(searchLower) ||
        item.personal_notes?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCollection(filtered);
  }, [collection, filters, progressiveView]);

  // Handle view mode changes with URL sync
  const handleViewChange = (view: ViewMode) => {
    setCurrentView(view);
    
    // Track view change
    setTrackInteraction({
      type: 'view',
      context: 'collection_dashboard',
      metadata: { view_mode: view, collection_size: filteredCollection.length },
    });

    // Update URL without page reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('view', view);
    router.replace(`/dashboard/collection?${newSearchParams.toString()}`);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setSelectedItems([]); // Clear selection when filters change
    
    // Track filter usage
    setTrackInteraction({
      type: 'view', 
      context: 'collection_filters',
      metadata: { filters: { ...filters, ...newFilters } },
    });
  };

  // Handle progressive view changes
  const handleProgressiveViewChange = (view: ProgressiveView) => {
    setProgressiveView(view);
    setSelectedItems([]); // Clear selection on view change
    
    setTrackInteraction({
      type: 'view',
      context: 'progressive_disclosure',
      metadata: { progressive_view: view },
    });
  };

  // Handle item selection for bulk operations
  const handleItemSelect = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  // Handle collection updates
  const handleCollectionChange = (newCollection: any[]) => {
    setCollection(newCollection);
    
    // Recalculate stats
    const newStats = calculateCollectionStats(newCollection);
    setCollectionStats(newStats);
    
    // Clear selections
    setSelectedItems([]);
  };

  // Handle item clicks for navigation
  const handleItemClick = (item: any) => {
    // Track item interaction
    setTrackInteraction({
      type: 'view',
      context: 'collection_item_click',
      metadata: { 
        fragrance_id: item.fragrance_id,
        status: item.status,
        view_mode: currentView
      },
    });

    // Navigate to fragrance detail page
    router.push(`/fragrance/${item.fragrance_id}`);
  };

  if (isLoading) {
    return <CollectionDashboardSkeleton />;
  }

  return (
    <>
      {trackInteraction && (
        <InteractionTracker
          fragranceId=""
          interactionType={trackInteraction.type as any}
          interactionContext={trackInteraction.context}
          metadata={trackInteraction.metadata}
        />
      )}
      
      <div className="space-y-8">
        {/* Progressive Disclosure Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Collection View</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={progressiveView} onValueChange={(value) => handleProgressiveViewChange(value as ProgressiveView)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="currently-wearing" className="text-sm">
                  Currently Wearing
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {collection.filter(i => 
                      i.usage_frequency === 'daily' || 
                      i.usage_frequency === 'weekly' ||
                      (i.rating && i.rating >= 4)
                    ).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="this-season" className="text-sm">
                  This Season
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {collection.filter(i => {
                      const currentSeason = getCurrentSeason();
                      return !i.seasons || i.seasons.length === 0 || i.seasons.includes(currentSeason);
                    }).length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="entire-collection" className="text-sm">
                  Full Collection
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {collection.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Collection Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* View Mode Switcher */}
          <ViewSwitcher
            currentView={currentView}
            onViewChange={handleViewChange}
            viewOptions={['grid', 'list', 'wheel', 'calendar']}
          />

          {/* Filter and Search Controls */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search collection..."
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {Object.values(filters).some(f => f !== 'all' && f !== '') && (
                <Badge variant="accent" className="text-xs">
                  Active
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <CollectionFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                collection={collection}
              />
            </CardContent>
          </Card>
        )}

        {/* Bulk Operations Bar */}
        {selectedItems.length > 0 && (
          <Card className="bg-accent border-accent">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </span>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline">
                    Mark as Tried
                  </Button>
                  <Button size="sm" variant="outline">
                    Add Tags
                  </Button>
                  <Button size="sm" variant="destructive">
                    Remove
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Collection Content (3/4 width) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Collection Empty State */}
            {filteredCollection.length === 0 && !isLoading && (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground">
                    {collection.length === 0 ? (
                      <div>
                        <Circle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Start Your Collection</h3>
                        <p className="mb-4">
                          Begin your fragrance journey by adding your first scent.
                        </p>
                        <Button 
                          onClick={() => router.push('/fragrances')}
                          className="bg-gradient-to-r from-plum-600 to-plum-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Discover Fragrances
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Filter className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p>No fragrances match your current filters.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFilters({
                            status: 'all',
                            family: 'all', 
                            occasion: 'all',
                            season: 'all',
                            search: ''
                          })}
                          className="mt-3"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Collection Content */}
            {filteredCollection.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {progressiveView === 'currently-wearing' && 'Currently Wearing'}
                      {progressiveView === 'this-season' && `${getCurrentSeason()} Collection`}
                      {progressiveView === 'entire-collection' && 'Complete Collection'}
                      <Badge variant="outline" className="ml-3 text-xs">
                        {filteredCollection.length} item{filteredCollection.length > 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Render different view modes */}
                  {currentView === 'grid' && (
                    <GridView
                      collection={filteredCollection}
                      onItemClick={handleItemClick}
                      onItemSelect={handleItemSelect}
                      selectedItems={selectedItems}
                    />
                  )}
                  
                  {currentView === 'list' && (
                    <ListView
                      collection={filteredCollection}
                      onItemClick={handleItemClick}
                      onItemSelect={handleItemSelect}
                      selectedItems={selectedItems}
                    />
                  )}
                  
                  {currentView === 'wheel' && (
                    <WheelView
                      collection={filteredCollection}
                      onItemClick={handleItemClick}
                    />
                  )}
                  
                  {currentView === 'calendar' && (
                    <CalendarView
                      collection={filteredCollection}
                      onItemClick={handleItemClick}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar: AI Insights and Quick Actions (1/4 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Collection Insights */}
            <Suspense fallback={<AIInsightsSkeleton />}>
              <AIInsights
                userId={userId}
                collectionStats={collectionStats}
                privacyMode={userProfile?.privacy_settings?.ai_insights_disabled}
              />
            </Suspense>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push('/fragrances')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Fragrance
                </Button>
                
                <Button
                  variant="outline"
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => router.push('/recommendations')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Recommendations
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Collection
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {(activity.fragrances as any)?.name || 'Fragrance'}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Added {new Date(activity.added_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Collection Manager (Hidden - manages state) */}
        <CollectionManager
          userId={userId}
          onCollectionChange={handleCollectionChange}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
        />
      </div>
    </>
  );
}

// Helper functions
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

function calculateCollectionStats(collection: any[]): CollectionStats {
  const total = collection.length;
  const byStatus = collection.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  const families = Array.from(new Set(
    collection.map(item => item.fragrances?.scent_family).filter(Boolean)
  ));
  
  const diversityScore = total > 0 ? families.length / total : 0;
  
  const ratings = collection.map(item => item.rating).filter(Boolean);
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
    : undefined;

  return {
    total_fragrances: total,
    diversity_score: Math.min(diversityScore, 1), // Cap at 1.0
    dominant_families: families.slice(0, 5), // Top 5 families
    average_rating: averageRating,
    by_status: byStatus,
  };
}

// Loading skeleton for dashboard
function CollectionDashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AIInsightsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}
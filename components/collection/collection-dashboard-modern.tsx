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
  Sparkles,
  Table2,
} from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase';
import {
  CollectionDataTable,
  type CollectionItem,
} from './collection-data-table';
import { ViewSwitcher } from './view-switcher';
import { CollectionFilters } from './collection-filters';
import { GridView } from './grid-view';
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

interface CollectionDashboardModernProps {
  userId: string;
  userProfile?: UserProfile;
  initialStats?: CollectionStats;
  recentActivity?: any[];
}

type ViewMode = 'grid' | 'list' | 'table' | 'wheel' | 'calendar';
type ProgressiveView =
  | 'currently-wearing'
  | 'this-season'
  | 'entire-collection';

/**
 * Modern Collection Dashboard Component
 *
 * Enhanced version using @tanstack/react-table for improved data management:
 * - Modern data table with sorting, filtering, pagination
 * - Reduced custom code by leveraging proven libraries
 * - Better performance and accessibility
 * - Progressive disclosure with consistent patterns
 */
export function CollectionDashboardModern({
  userId,
  userProfile,
  initialStats,
  recentActivity = [],
}: CollectionDashboardModernProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dashboard state management
  const [currentView, setCurrentView] = useState<ViewMode>(
    (searchParams.get('view') as ViewMode) || 'table'
  );
  const [progressiveView, setProgressiveView] =
    useState<ProgressiveView>('currently-wearing');
  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [filteredCollection, setFilteredCollection] = useState<
    CollectionItem[]
  >([]);
  const [collectionStats, setCollectionStats] = useState<CollectionStats>(
    initialStats || {
      total_fragrances: 0,
      diversity_score: 0,
      dominant_families: [],
    }
  );

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<CollectionItem[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    family: 'all',
    occasion: 'all',
    season: 'all',
    search: '',
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

        // Fetch user's complete collection with all necessary data
        const { data: collectionData, error } = await (supabase as any)
          .from('user_collections')
          .select(
            `
            id,
            user_id,
            fragrance_id,
            collection_type as status,
            rating,
            notes,
            purchase_date,
            created_at as added_at,
            fragrances:fragrance_id (
              id,
              name,
              fragrance_family,
              image_url,
              sample_available,
              sample_price_usd,
              fragrance_brands!inner(name)
            )
          `
          )
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error loading collection:', error);
          }
          return;
        }

        // Transform data to match CollectionItem interface
        const transformedData: CollectionItem[] = (collectionData || []).map(
          (item: any) => ({
            ...item,
            fragrances: {
              ...item.fragrances,
              fragrance_brands: item.fragrances?.fragrance_brands,
            },
          })
        );

        setCollection(transformedData);

        // Update stats if we have fresh data
        if (transformedData.length > 0) {
          const stats = calculateCollectionStats(transformedData);
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
      filtered = filtered
        .filter(item => item.rating >= 4 || (item.rating && item.rating >= 4))
        .slice(0, 5);
    } else if (progressiveView === 'this-season') {
      const currentSeason = getCurrentSeason();
      filtered = filtered
        .filter(
          item => true // No seasonal filtering available
        )
        .slice(0, 15);
    }

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.family !== 'all') {
      filtered = filtered.filter(
        item => item.fragrances?.fragrance_family === filters.family
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.fragrances?.name?.toLowerCase().includes(searchLower) ||
          getBrandName(item.fragrances)?.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower)
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

  // Handle collection item click
  const handleItemClick = (item: CollectionItem) => {
    setTrackInteraction({
      type: 'view',
      context: 'collection_item_click',
      metadata: {
        fragrance_id: item.fragrance_id,
        status: item.status,
        view_mode: currentView,
      },
    });

    router.push(`/fragrance/${item.fragrance_id}`);
  };

  // Handle item editing
  const handleItemEdit = (item: CollectionItem) => {
    // TODO: Implement edit modal or navigate to edit page
    console.log('Edit item:', item);
  };

  // Handle item removal
  const handleItemRemove = (item: CollectionItem) => {
    // TODO: Implement removal with confirmation
    console.log('Remove item:', item);
  };

  // Handle selection changes from data table
  const handleSelectionChange = (newSelectedItems: CollectionItem[]) => {
    setSelectedItems(newSelectedItems);
  };

  // Handle collection updates
  const handleCollectionChange = (newCollection: any[]) => {
    // Transform to CollectionItem[] format
    const transformedCollection: CollectionItem[] = newCollection.map(item => ({
      ...item,
      fragrances: {
        ...item.fragrances,
        fragrance_brands: item.fragrances?.fragrance_brands,
      },
    }));

    setCollection(transformedCollection);

    // Recalculate stats
    const newStats = calculateCollectionStats(transformedCollection);
    setCollectionStats(newStats);

    // Clear selections
    setSelectedItems([]);
  };

  // Helper function to get brand name
  const getBrandName = (fragrance: any): string => {
    if (Array.isArray(fragrance?.fragrance_brands)) {
      return fragrance.fragrance_brands[0]?.name || 'Unknown Brand';
    }
    return fragrance?.fragrance_brands?.name || 'Unknown Brand';
  };

  if (isLoading) {
    return <CollectionDashboardSkeleton />;
  }

  return (
    <>
      {trackInteraction && (
        <InteractionTracker
          fragranceId=''
          interactionType={trackInteraction.type as any}
          interactionContext={trackInteraction.context}
          metadata={trackInteraction.metadata}
        />
      )}

      <div className='space-y-8'>
        {/* Progressive Disclosure Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Sparkles className='h-5 w-5 text-amber-500' />
              <span>Collection View</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              value={progressiveView}
              onValueChange={value =>
                handleProgressiveViewChange(value as ProgressiveView)
              }
            >
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='currently-wearing' className='text-sm'>
                  Currently Wearing
                  <Badge variant='secondary' className='ml-2 text-xs'>
                    {
                      collection.filter(
                        i => i.rating >= 4 || (i.rating && i.rating >= 4)
                      ).length
                    }
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='this-season' className='text-sm'>
                  This Season
                  <Badge variant='secondary' className='ml-2 text-xs'>
                    {
                      collection.filter(i => {
                        const currentSeason = getCurrentSeason();
                        return true; // No seasonal filtering available
                      }).length
                    }
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value='entire-collection' className='text-sm'>
                  Full Collection
                  <Badge variant='secondary' className='ml-2 text-xs'>
                    {collection.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Collection Controls */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          {/* View Mode Switcher - Updated with table option */}
          <ViewSwitcher
            currentView={currentView}
            onViewChange={handleViewChange}
            viewOptions={['grid', 'table', 'wheel', 'calendar']}
          />

          {/* Filter and Search Controls */}
          <div className='flex items-center space-x-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <input
                type='text'
                placeholder='Search collection...'
                value={filters.search}
                onChange={e => handleFilterChange({ search: e.target.value })}
                className='pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent'
              />
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className='flex items-center space-x-2'
            >
              <Filter className='h-4 w-4' />
              <span>Filters</span>
              {Object.values(filters).some(f => f !== 'all' && f !== '') && (
                <Badge variant='accent' className='text-xs'>
                  Active
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Advanced Filters (Collapsible) */}
        {showFilters && (
          <Card>
            <CardContent className='pt-6'>
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
          <Card className='bg-accent border-accent'>
            <CardContent className='py-4'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? 's' : ''} selected
                </span>

                <div className='flex items-center space-x-2'>
                  <Button size='sm' variant='outline'>
                    Mark as Tried
                  </Button>
                  <Button size='sm' variant='outline'>
                    Add Tags
                  </Button>
                  <Button size='sm' variant='destructive'>
                    Remove
                  </Button>
                  <Button
                    size='sm'
                    variant='ghost'
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
        <div className='grid lg:grid-cols-4 gap-8'>
          {/* Collection Content (3/4 width) */}
          <div className='lg:col-span-3 space-y-6'>
            {/* Collection Empty State */}
            {filteredCollection.length === 0 && !isLoading && (
              <Card className='text-center py-12'>
                <CardContent>
                  <div className='text-muted-foreground'>
                    {collection.length === 0 ? (
                      <div>
                        <Circle className='h-12 w-12 mx-auto mb-4 opacity-50' />
                        <h3 className='text-lg font-semibold mb-2'>
                          Start Your Collection
                        </h3>
                        <p className='mb-4'>
                          Begin your fragrance journey by adding your first
                          scent.
                        </p>
                        <Button
                          onClick={() => router.push('/fragrances')}
                          className='bg-gradient-to-r from-plum-600 to-plum-700'
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Discover Fragrances
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Filter className='h-8 w-8 mx-auto mb-3 opacity-50' />
                        <p>No fragrances match your current filters.</p>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            setFilters({
                              status: 'all',
                              family: 'all',
                              occasion: 'all',
                              season: 'all',
                              search: '',
                            })
                          }
                          className='mt-3'
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
                  <div className='flex items-center justify-between'>
                    <CardTitle>
                      {progressiveView === 'currently-wearing' &&
                        'Currently Wearing'}
                      {progressiveView === 'this-season' &&
                        `${getCurrentSeason()} Collection`}
                      {progressiveView === 'entire-collection' &&
                        'Complete Collection'}
                      <Badge variant='outline' className='ml-3 text-xs'>
                        {filteredCollection.length} item
                        {filteredCollection.length > 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>

                    <div className='flex items-center space-x-2'>
                      <Button variant='ghost' size='sm'>
                        <Download className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Settings className='h-4 w-4' />
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
                      onItemSelect={(itemId, selected) => {
                        const item = filteredCollection.find(
                          i => i.id === itemId
                        );
                        if (item) {
                          setSelectedItems(prev =>
                            selected
                              ? [...prev, item]
                              : prev.filter(i => i.id !== itemId)
                          );
                        }
                      }}
                      selectedItems={selectedItems.map(i => i.id)}
                    />
                  )}

                  {currentView === 'table' && (
                    <CollectionDataTable
                      data={filteredCollection}
                      onItemClick={handleItemClick}
                      onItemEdit={handleItemEdit}
                      onItemRemove={handleItemRemove}
                      onSelectionChange={handleSelectionChange}
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
          <div className='lg:col-span-1 space-y-6'>
            {/* AI Collection Insights */}
            <Suspense fallback={<AIInsightsSkeleton />}>
              <AIInsights
                userId={userId}
                collectionStats={collectionStats}
                privacyMode={
                  userProfile?.privacy_settings?.ai_insights_disabled
                }
              />
            </Suspense>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() => router.push('/fragrances')}
                >
                  <Plus className='h-4 w-4 mr-2' />
                  Add New Fragrance
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                  onClick={() => router.push('/recommendations')}
                >
                  <Sparkles className='h-4 w-4 mr-2' />
                  Get Recommendations
                </Button>

                <Button
                  variant='outline'
                  size='sm'
                  className='w-full justify-start'
                >
                  <Download className='h-4 w-4 mr-2' />
                  Export Collection
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-lg'>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {recentActivity.slice(0, 5).map(activity => (
                      <div
                        key={activity.id}
                        className='flex items-center space-x-3 text-sm'
                      >
                        <div className='w-2 h-2 rounded-full bg-green-500' />
                        <div className='flex-1'>
                          <p className='font-medium'>
                            {(activity.fragrances as any)?.name || 'Fragrance'}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            Added{' '}
                            {new Date(activity.added_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant='outline' className='text-xs'>
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
          selectedItems={selectedItems.map(i => i.id)}
          onSelectionChange={ids => {
            const items = filteredCollection.filter(item =>
              ids.includes(item.id)
            );
            setSelectedItems(items);
          }}
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

function calculateCollectionStats(
  collection: CollectionItem[]
): CollectionStats {
  const total = collection.length;
  const byStatus = collection.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const families = Array.from(
    new Set(
      collection
        .map(item => item.fragrances?.fragrance_family)
        .filter((family): family is string => Boolean(family))
    )
  );

  const diversityScore = total > 0 ? families.length / total : 0;

  const ratings = collection
    .map(item => item.rating)
    .filter(Boolean) as number[];
  const averageRating =
    ratings.length > 0
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
    <div className='space-y-8'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-20' />
        ))}
      </div>

      <Card>
        <CardContent className='pt-6'>
          <Skeleton className='h-10 mb-4' />
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='aspect-square' />
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
        <Skeleton className='h-6 w-32' />
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      </CardContent>
    </Card>
  );
}

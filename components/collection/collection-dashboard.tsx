'use client';

import React, { useState, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Grid, 
  List, 
  Calendar, 
  TrendingUp,
  BarChart3,
  Sparkles,
  BookOpen,
  Target
} from 'lucide-react';
import { CollectionGrid } from './collection-grid';
import { CollectionStats } from './collection-stats';
import { getCollectionStats } from '@/lib/actions/collection-analytics';

interface CollectionDashboardProps {
  user: {
    id: string;
    email: string | null | undefined;
    firstName: string;
  };
  initialCollection: any[];
  collectionStats: any;
  engagementData: any;
  searchParams: {
    source?: string;
    new_collection?: string;
    enhanced?: string;
    category?: string;
    search?: string;
  };
  hasCollectionError?: boolean;
}

type ViewMode = 'grid' | 'list';
type FilterCategory = 'all' | 'rated' | 'unrated' | 'recent' | 'favorites';
type SortOption = 'newest' | 'oldest' | 'rating_high' | 'rating_low' | 'name_az' | 'name_za';

/**
 * Collection Dashboard Component - Task 2.1 (Phase 1B)
 * 
 * Simplified collection dashboard focused on quiz-powered collection features.
 * Integrates with the new collection analytics and quiz-to-collection flow.
 */
export function CollectionDashboard({
  user,
  initialCollection,
  collectionStats: initialStats,
  engagementData,
  searchParams,
  hasCollectionError,
}: CollectionDashboardProps) {
  const [collection, setCollection] = useState(initialCollection);
  const [searchTerm, setSearchTerm] = useState(searchParams.search || '');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showInsights, setShowInsights] = useState(false);
  const [collectionStats, setCollectionStats] = useState(initialStats);
  const [insights, setInsights] = useState<any>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredCollection = useMemo(() => {
    let filtered = [...collection];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) => 
        item.fragrances?.name?.toLowerCase().includes(searchLower) ||
        item.fragrances?.fragrance_brands?.name?.toLowerCase().includes(searchLower) ||
        item.fragrances?.scent_family?.toLowerCase().includes(searchLower) ||
        item.notes?.toLowerCase().includes(searchLower)
      );
    }

    switch (filterCategory) {
      case 'rated':
        filtered = filtered.filter((item) => item.rating);
        break;
      case 'unrated':
        filtered = filtered.filter((item) => !item.rating);
        break;
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((item) => new Date(item.created_at) > weekAgo);
        break;
      case 'favorites':
        filtered = filtered.filter((item) => item.rating >= 4);
        break;
    }

    switch (sortOption) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'rating_high':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating_low':
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'name_az':
        filtered.sort((a, b) => (a.fragrances?.name || '').localeCompare(b.fragrances?.name || ''));
        break;
      case 'name_za':
        filtered.sort((a, b) => (b.fragrances?.name || '').localeCompare(a.fragrances?.name || ''));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return filtered;
  }, [collection, searchTerm, filterCategory, sortOption]);

  const filterCounts = useMemo(() => {
    const rated = collection.filter(item => item.rating).length;
    const recent = collection.filter(item => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(item.created_at) > weekAgo;
    }).length;
    const favorites = collection.filter(item => item.rating >= 4).length;

    return {
      all: collection.length,
      rated,
      unrated: collection.length - rated,
      recent,
      favorites,
    };
  }, [collection]);

  const loadInsights = async () => {
    // Insights functionality temporarily disabled
    console.log('Collection insights feature coming soon');
  };

  const refreshStats = async () => {
    startTransition(async () => {
      try {
        const result = await getCollectionStats();
        if (result.success) {
          setCollectionStats(result.data);
        }
      } catch (error) {
        console.error('Failed to refresh stats:', error);
      }
    });
  };

  const handleItemUpdate = (itemId: string, updates: any) => {
    setCollection(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleItemRemove = (itemId: string) => {
    setCollection(prev => prev.filter(item => item.id !== itemId));
    refreshStats();
  };

  return (
    <div className="space-y-8">
      {hasCollectionError && (
        <Alert variant="destructive">
          <AlertDescription>
            There was an issue loading your collection.
          </AlertDescription>
        </Alert>
      )}

      {searchParams.new_collection === 'true' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">🎉</div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  Welcome to Your Collection, {user.firstName}!
                </h3>
                <p className="text-green-700">
                  {searchParams.source === 'quiz_completion' 
                    ? 'Your quiz recommendations have been saved.'
                    : 'Your collection is ready to explore!'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CollectionStats stats={collectionStats} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search fragrances, brands, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    {([
                      ['all', 'All'],
                      ['rated', 'Rated'],
                      ['unrated', 'Unrated'],
                      ['recent', 'Recent'],
                      ['favorites', 'Favorites'],
                    ] as const).map(([value, label]) => (
                      <Button
                        key={value}
                        variant={filterCategory === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory(value)}
                        className="text-xs"
                      >
                        {label}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {filterCounts[value]}
                        </Badge>
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-2">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value as SortOption)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="rating_high">Highest Rated</option>
                      <option value="rating_low">Lowest Rated</option>
                      <option value="name_az">Name A-Z</option>
                      <option value="name_za">Name Z-A</option>
                    </select>

                    <div className="flex border border-gray-300 rounded-md">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-r-none"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-l-none"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {(searchTerm || filterCategory !== 'all') && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Showing {filteredCollection.length} of {collection.length} fragrances</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterCategory('all');
                      }}
                      className="text-xs h-6 px-2"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <CollectionGrid
            collection={filteredCollection}
            viewMode={viewMode}
            onItemUpdate={handleItemUpdate}
            onItemRemove={handleItemRemove}
            isUpdating={isPending}
          />

          {filteredCollection.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                {collection.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-6xl">🌸</div>
                    <h3 className="text-xl font-semibold">Start Your Collection</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Take our fragrance quiz to discover your perfect matches.
                    </p>
                    <Button asChild>
                      <Link href="/quiz">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Take the Quiz
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-4xl">🔍</div>
                    <h3 className="text-xl font-semibold">No Results Found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Target className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={loadInsights}
                disabled={isLoadingInsights}
                className="w-full justify-start"
                variant={showInsights ? 'default' : 'outline'}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                {isLoadingInsights ? 'Loading...' : 'View Collection Insights'}
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/quiz">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get More Recommendations
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/fragrance/browse">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse All Fragrances
                </Link>
              </Button>
            </CardContent>
          </Card>

          {showInsights && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">Collection insights coming soon! Advanced analytics will be available after account creation.</p>
            </div>
          )}

          {engagementData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Engagement Level</span>
                  <Badge variant={
                    engagementData.engagement_level === 'expert' ? 'default' :
                    engagementData.engagement_level === 'intermediate' ? 'secondary' :
                    'outline'
                  }>
                    {engagementData.engagement_level}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{engagementData.engagement_score_raw || 0}/1000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, ((engagementData.engagement_score_raw || 0) / 1000) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Calendar className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {collection.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center space-x-3 py-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Added {item.fragrances?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {collection.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
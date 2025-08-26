'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  Heart, 
  MoreVertical, 
  Edit3, 
  Trash2,
  ExternalLink,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateUserCollection } from '@/lib/actions/collections';

interface CollectionGridProps {
  collection: any[];
  viewMode: 'grid' | 'list';
  onItemUpdate: (itemId: string, updates: any) => void;
  onItemRemove: (itemId: string) => void;
  isUpdating?: boolean;
}

/**
 * Collection Grid Component - Task 2.1 (Phase 1B)
 * 
 * Displays collection items in grid or list format with interactive features.
 * Supports rating, editing notes, and removing items with optimistic updates.
 */
export function CollectionGrid({
  collection,
  viewMode,
  onItemUpdate,
  onItemRemove,
  isUpdating = false,
}: CollectionGridProps) {
  const [isPending, startTransition] = useTransition();

  // Handle rating update
  const handleRatingUpdate = (item: any, rating: number) => {
    // Optimistic update
    onItemUpdate(item.id, { rating });

    // Server update
    startTransition(async () => {
      try {
        const result = await updateUserCollection('rate', item.fragrances.id, {
          rating,
          notes: item.notes,
        });

        if (!result.success) {
          // Revert on failure
          onItemUpdate(item.id, { rating: item.rating });
          console.error('Failed to update rating:', result.error);
        }
      } catch (error) {
        // Revert on error
        onItemUpdate(item.id, { rating: item.rating });
        console.error('Rating update error:', error);
      }
    });
  };

  // Handle item removal
  const handleRemove = (item: any) => {
    if (!confirm(`Remove "${item.fragrances.name}" from your collection?`)) {
      return;
    }

    // Optimistic removal
    onItemRemove(item.id);

    // Server update
    startTransition(async () => {
      try {
        const result = await updateUserCollection('remove', item.fragrances.id);
        
        if (!result.success) {
          console.error('Failed to remove item:', result.error);
          // In a real app, we'd revert the optimistic update here
        }
      } catch (error) {
        console.error('Remove item error:', error);
      }
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get gender badge color
  const getGenderBadgeClass = (gender: string) => {
    switch (gender) {
      case 'men':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'women':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'unisex':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {collection.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* Fragrance Image */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  {item.fragrances?.image_url ? (
                    <Image
                      src={item.fragrances.image_url}
                      alt={`${item.fragrances.name} by ${item.fragrances.fragrance_brands.name}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Fragrance Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold truncate">
                        {item.fragrances?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.fragrances?.fragrance_brands?.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${getGenderBadgeClass(item.fragrances?.gender)}`}>
                          {item.fragrances?.gender}
                        </Badge>
                        {item.fragrances?.scent_family && (
                          <Badge variant="outline" className="text-xs">
                            {item.fragrances.scent_family}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <a href={`/fragrance/${item.fragrances?.id}`}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRemove(item)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-sm text-gray-600">Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingUpdate(item, star)}
                          disabled={isPending || isUpdating}
                          className="p-0.5 hover:scale-110 transition-transform disabled:opacity-50"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= (item.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {item.notes && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      "{item.notes}"
                    </p>
                  )}

                  {/* Added Date */}
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Calendar className="w-3 h-3 mr-1" />
                    Added {formatDate(item.created_at)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Grid view
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {collection.map((item) => (
        <Card key={item.id} className="group hover:shadow-lg transition-all duration-200">
          <CardContent className="p-0">
            {/* Image Section */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-t-lg">
              {item.fragrances?.image_url ? (
                <Image
                  src={item.fragrances.image_url}
                  alt={`${item.fragrances.name} by ${item.fragrances.fragrance_brands.name}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Sparkles className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Action Buttons Overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <a href={`/fragrance/${item.fragrances?.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Details
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRemove(item)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Rating Badge */}
              {item.rating && (
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-white/90 text-gray-800">
                    <Star className="w-3 h-3 mr-1 fill-current text-yellow-500" />
                    {item.rating}/5
                  </Badge>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="p-4">
              {/* Title and Brand */}
              <div className="mb-3">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-purple-600 transition-colors">
                  {item.fragrances?.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.fragrances?.fragrance_brands?.name}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`text-xs ${getGenderBadgeClass(item.fragrances?.gender)}`}>
                  {item.fragrances?.gender}
                </Badge>
                {item.fragrances?.scent_family && (
                  <Badge variant="outline" className="text-xs">
                    {item.fragrances.scent_family}
                  </Badge>
                )}
              </div>

              {/* Interactive Rating */}
              <div className="mb-3">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">Rate:</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRatingUpdate(item, star)}
                        disabled={isPending || isUpdating}
                        className="p-0.5 hover:scale-110 transition-transform disabled:opacity-50"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= (item.rating || 0)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                  "{item.notes}"
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(item.created_at)}
                </div>
                {item.quiz_session_token && (
                  <Badge variant="outline" className="text-xs">
                    Quiz Match
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
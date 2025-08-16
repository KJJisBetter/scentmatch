'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Eye,
  Heart,
  MoreVertical,
  Edit3,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListViewProps {
  collection: any[];
  onItemClick: (item: any) => void;
  onItemSelect?: (itemId: string, selected: boolean) => void;
  selectedItems?: string[];
  sortBy?: 'added_at' | 'rating' | 'name' | 'usage_frequency' | 'purchase_date';
  sortDirection?: 'asc' | 'desc';
  enableSelection?: boolean;
  showExtendedMetadata?: boolean;
  className?: string;
}

/**
 * ListView Component
 * 
 * Detailed list layout for collection management
 * Implements research-backed patterns for information-dense displays:
 * - Comprehensive metadata display in scannable format
 * - Inline editing capabilities for quick updates
 * - Multi-select with visual feedback
 * - Progressive disclosure of secondary information
 * - Mobile-optimized responsive layout
 */
export function ListView({
  collection,
  onItemClick,
  onItemSelect,
  selectedItems = [],
  sortBy = 'added_at',
  sortDirection = 'desc',
  enableSelection = true,
  showExtendedMetadata = true,
  className
}: ListViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Handle row click (expand/navigate)
  const handleRowClick = (item: any, event: React.MouseEvent) => {
    // Don't handle if clicking on interactive elements
    if ((event.target as HTMLElement).closest('input, button, .item-actions')) {
      return;
    }

    onItemClick(item);
  };

  // Toggle expanded details
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle inline editing
  const handleInlineEdit = (itemId: string) => {
    setEditingItem(itemId);
  };

  // Get status styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'owned': return 'bg-green-100 text-green-700 border-green-200';
      case 'wishlist': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'tried': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'selling': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (collection.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items to display in list view
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* List Header (for sorting) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
        {enableSelection && <div className="col-span-1">Select</div>}
        <div className="col-span-2">Fragrance</div>
        <div className="col-span-2">Brand</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Rating</div>
        <div className="col-span-2">Added</div>
        <div className="col-span-2">Usage</div>
        <div className="col-span-1">Actions</div>
      </div>

      {/* List Items */}
      <div className="space-y-2">
        {collection.map((item) => {
          const fragrance = item.fragrances;
          const brand = fragrance?.fragrance_brands?.[0]?.name || fragrance?.fragrance_brands?.name || 'Unknown Brand';
          const isSelected = selectedItems.includes(item.id);
          const isExpanded = expandedItems.has(item.id);

          return (
            <div
              key={item.id}
              className={cn(
                'border border-border rounded-lg transition-all duration-200',
                'hover:shadow-sm hover:border-primary/50',
                isSelected && 'border-primary bg-primary/5',
                isExpanded && 'shadow-md'
              )}
            >
              {/* Main Row */}
              <div
                className={cn(
                  'grid grid-cols-1 md:grid-cols-12 gap-4 p-4 cursor-pointer',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1'
                )}
                onClick={(e) => handleRowClick(item, e)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${fragrance?.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(item, e as any);
                  }
                }}
              >
                {/* Selection Checkbox */}
                {enableSelection && (
                  <div className="md:col-span-1 flex items-start">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onItemSelect?.(item.id, e.target.checked)}
                      className="w-5 h-5 rounded border-border focus:ring-2 focus:ring-ring"
                      aria-label={`Select ${fragrance?.name}`}
                    />
                  </div>
                )}

                {/* Fragrance Image and Name */}
                <div className="md:col-span-2 flex items-center space-x-3">
                  <div className="w-12 h-12 relative bg-gradient-to-br from-cream-100 to-cream-200 rounded-lg overflow-hidden flex-shrink-0">
                    {fragrance?.image_url ? (
                      <Image
                        src={fragrance.image_url}
                        alt={`${fragrance.name} bottle`}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs">
                        🌸
                      </div>
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-foreground truncate">
                      {fragrance?.name || 'Unknown Fragrance'}
                    </h3>
                    {fragrance?.scent_family && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {fragrance.scent_family}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Brand */}
                <div className="md:col-span-2 flex items-center">
                  <span className="text-sm text-muted-foreground truncate">
                    {brand}
                  </span>
                </div>

                {/* Status */}
                <div className="md:col-span-1 flex items-center">
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getStatusStyling(item.status))}
                  >
                    {item.status}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="md:col-span-1 flex items-center">
                  {item.rating ? (
                    <Rating value={item.rating} size="sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Unrated</span>
                  )}
                </div>

                {/* Added Date */}
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {new Date(item.added_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Usage Frequency */}
                <div className="md:col-span-2 flex items-center space-x-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {item.usage_frequency || 'Not set'}
                  </span>
                </div>

                {/* Actions */}
                <div className="md:col-span-1 flex items-center justify-end item-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(item.id);
                    }}
                    className="h-8 w-8 p-0"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for ${fragrance?.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Personal Notes */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Personal Notes</h4>
                      {editingItem === item.id ? (
                        <textarea
                          defaultValue={item.personal_notes || ''}
                          className="w-full p-2 text-sm border border-border rounded resize-none"
                          rows={3}
                          placeholder="Add your personal notes..."
                          onBlur={() => setEditingItem(null)}
                          autoFocus
                        />
                      ) : (
                        <div
                          className="text-sm p-2 border border-dashed border-border rounded cursor-pointer hover:bg-accent/50"
                          onClick={() => handleInlineEdit(item.id)}
                        >
                          {item.personal_notes || (
                            <span className="text-muted-foreground italic">
                              Click to add notes...
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Purchase Information */}
                    {(item.purchase_date || item.purchase_price) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Purchase Info</h4>
                        <div className="space-y-1 text-sm">
                          {item.purchase_date && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(item.purchase_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {item.purchase_price && (
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-3 w-3" />
                              <span>${item.purchase_price}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tags and Categories */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Tags</h4>
                      <div className="space-y-2">
                        {item.occasions && item.occasions.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground mb-1 block">Occasions:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.occasions.map((occasion: string) => (
                                <Badge key={occasion} variant="secondary" className="text-xs">
                                  {occasion}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.seasons && item.seasons.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground mb-1 block">Seasons:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.seasons.map((season: string) => (
                                <Badge key={season} variant="outline" className="text-xs">
                                  {season}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onItemClick(item)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInlineEdit(item.id)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>Last viewed 3 days ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* List Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-border">
        <div>
          {collection.length} item{collection.length !== 1 ? 's' : ''} in list
        </div>
        
        {selectedItems.length > 0 && (
          <div className="flex items-center space-x-2">
            <span>{selectedItems.length} selected</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedItems(new Set(selectedItems))}
            >
              Expand Selected
            </Button>
          </div>
        )}
      </div>
    </div>
  );

}
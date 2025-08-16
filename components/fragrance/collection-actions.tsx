'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Heart, Plus, Check, Settings } from 'lucide-react';
import { createClientSupabase } from '@/lib/supabase-client';
import { InteractionTracker } from './interaction-tracker';
import { cn } from '@/lib/utils';

interface CollectionActionsProps {
  fragranceId: string;
  variant?: 'default' | 'icon' | 'badge';
  className?: string;
}

interface CollectionStatus {
  in_collection: boolean;
  status?: 'owned' | 'wishlist' | 'tried' | 'selling';
  rating?: number;
  personal_notes?: string;
  added_at?: string;
}

/**
 * CollectionActions Component
 * 
 * Handles adding/removing fragrances from user collections
 * Supports multiple collection types and optimistic updates
 * Implements mobile-first interaction patterns
 */
export function CollectionActions({ 
  fragranceId, 
  variant = 'default',
  className 
}: CollectionActionsProps) {
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus>({
    in_collection: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackInteraction, setTrackInteraction] = useState<{
    type: string;
    context: string;
    metadata?: any;
  } | null>(null);

  // Fetch current collection status
  useEffect(() => {
    const fetchCollectionStatus = async () => {
      try {
        const supabase = createClientSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('user_collections')
          .select('status, rating, personal_notes, added_at')
          .eq('user_id', user.id)
          .eq('fragrance_id', fragranceId)
          .single();

        if (error && error.code !== 'PGRST116') { // Not found is OK
          console.error('Error fetching collection status:', error);
        }

        setCollectionStatus({
          in_collection: !!data,
          status: data?.status,
          rating: data?.rating,
          personal_notes: data?.personal_notes,
          added_at: data?.added_at,
        });
      } catch (error) {
        console.error('Error fetching collection status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionStatus();
  }, [fragranceId]);

  const handleToggleCollection = async (newStatus: 'owned' | 'wishlist' | 'tried') => {
    setIsUpdating(true);
    
    // Optimistic update
    const wasInCollection = collectionStatus.in_collection;
    setCollectionStatus(prev => ({
      ...prev,
      in_collection: true,
      status: newStatus,
    }));

    // Track interaction
    setTrackInteraction({
      type: wasInCollection ? 'remove_from_collection' : 'add_to_collection',
      context: 'detail_page',
      metadata: { status: newStatus, previous_status: collectionStatus.status },
    });

    try {
      const supabase = createClientSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (wasInCollection) {
        // Update existing entry
        const { error } = await supabase
          .from('user_collections')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('fragrance_id', fragranceId);

        if (error) throw error;
      } else {
        // Add new entry
        const { error } = await supabase
          .from('user_collections')
          .insert({
            user_id: user.id,
            fragrance_id: fragranceId,
            status: newStatus,
            added_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Failed to update collection:', error);
      
      // Revert optimistic update
      setCollectionStatus(prev => ({
        ...prev,
        in_collection: wasInCollection,
        status: collectionStatus.status,
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveFromCollection = async () => {
    setIsUpdating(true);
    
    // Optimistic update
    const originalStatus = { ...collectionStatus };
    setCollectionStatus({ in_collection: false });

    // Track interaction
    setTrackInteraction({
      type: 'remove_from_collection',
      context: 'detail_page',
      metadata: { previous_status: originalStatus.status },
    });

    try {
      const supabase = createClientSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('user_id', user.id)
        .eq('fragrance_id', fragranceId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to remove from collection:', error);
      
      // Revert optimistic update
      setCollectionStatus(originalStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  // Icon variant (for mobile sticky bar)
  if (variant === 'icon') {
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
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              variant={collectionStatus.in_collection ? "default" : "outline"}
              className="w-11 h-11 p-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : collectionStatus.in_collection ? (
                <Check className="h-4 w-4" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </Button>
          </SheetTrigger>
          
          <SheetContent side="bottom" className="h-fit">
            <SheetHeader>
              <SheetTitle>Manage Collection</SheetTitle>
            </SheetHeader>
            
            <div className="grid grid-cols-3 gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => handleToggleCollection('wishlist')}
                disabled={isUpdating}
                className="h-20 flex-col space-y-2"
              >
                <Heart className="h-5 w-5" />
                <span className="text-xs">Wishlist</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleToggleCollection('tried')}
                disabled={isUpdating}
                className="h-20 flex-col space-y-2"
              >
                <Check className="h-5 w-5" />
                <span className="text-xs">Tried</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleToggleCollection('owned')}
                disabled={isUpdating}
                className="h-20 flex-col space-y-2"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Owned</span>
              </Button>
            </div>

            {collectionStatus.in_collection && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveFromCollection}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Remove from Collection
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Badge variant (floating on image)
  if (variant === 'badge') {
    if (!collectionStatus.in_collection) return null;
    
    return (
      <Badge 
        variant="default" 
        className="absolute top-3 right-3 bg-green-600 hover:bg-green-700"
      >
        <Check className="h-3 w-3 mr-1" />
        {collectionStatus.status === 'owned' && 'Owned'}
        {collectionStatus.status === 'wishlist' && 'Wishlist'}
        {collectionStatus.status === 'tried' && 'Tried'}
      </Badge>
    );
  }

  // Default variant (full desktop experience)
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
      
      <div className={cn('space-y-3', className)}>
        {isLoading ? (
          <div className="flex space-x-2">
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          </div>
        ) : collectionStatus.in_collection ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-600">
                <Check className="h-3 w-3 mr-1" />
                In your collection
              </Badge>
              <Badge variant="outline" className="text-xs">
                {collectionStatus.status}
              </Badge>
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleCollection('wishlist')}
                disabled={isUpdating}
              >
                Move to Wishlist
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemoveFromCollection}
                disabled={isUpdating}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => handleToggleCollection('wishlist')}
              disabled={isUpdating}
            >
              <Heart className="h-4 w-4 mr-2" />
              Add to Wishlist
            </Button>
            
            <Button
              variant="outline"  
              onClick={() => handleToggleCollection('owned')}
              disabled={isUpdating}
            >
              <Plus className="h-4 w-4 mr-2" />
              I Own This
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
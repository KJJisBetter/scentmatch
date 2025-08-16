'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star } from 'lucide-react';

interface Fragrance {
  id: string;
  name: string;
  brand: string;
  scent_family?: string;
  sample_available?: boolean;
  sample_price_usd?: number;
  travel_size_available?: boolean;
  travel_size_price_usd?: number;
  image_url?: string;
  description?: string;
  notes?: string[];
  relevance_score?: number;
}

interface SearchResultsProps {
  fragrances: Fragrance[];
  isLoading?: boolean;
  query?: string;
  onAddToCollection?: (fragranceId: string) => void;
  onAddToWishlist?: (fragranceId: string) => void;
}

export function SearchResults({ 
  fragrances, 
  isLoading = false, 
  query = "",
  onAddToCollection,
  onAddToWishlist 
}: SearchResultsProps) {
  
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && fragrances.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <ShoppingCart className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {query ? `No fragrances found for "${query}"` : 'No fragrances found'}
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {query 
            ? "Try adjusting your search terms or browse our popular fragrances instead."
            : "Start searching to discover your perfect fragrance match."
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          {fragrances.length} fragrance{fragrances.length !== 1 ? 's' : ''} found
          {query && (
            <span className="ml-1">
              for <span className="font-medium">"{query}"</span>
            </span>
          )}
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fragrances.map((fragrance) => (
          <FragranceCard
            key={fragrance.id}
            fragrance={fragrance}
            onAddToCollection={onAddToCollection}
            onAddToWishlist={onAddToWishlist}
          />
        ))}
      </div>
    </div>
  );
}

// Individual fragrance card component
function FragranceCard({ 
  fragrance, 
  onAddToCollection, 
  onAddToWishlist 
}: { 
  fragrance: Fragrance;
  onAddToCollection?: (fragranceId: string) => void;
  onAddToWishlist?: (fragranceId: string) => void;
}) {
  const samplePrice = fragrance.sample_price_usd;
  const travelPrice = fragrance.travel_size_price_usd;
  
  // Determine primary CTA based on sample-first strategy
  const primaryAction = fragrance.sample_available && samplePrice
    ? { text: `Try Sample - $${samplePrice}`, price: samplePrice, type: 'sample' }
    : fragrance.travel_size_available && travelPrice
    ? { text: `Travel Size - $${travelPrice}`, price: travelPrice, type: 'travel' }
    : { text: 'View Details', price: null, type: 'view' };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <Link href={`/fragrance/${fragrance.id}`} className="block">
        <div className="aspect-square relative bg-gray-100 rounded-t-lg overflow-hidden">
          {fragrance.image_url ? (
            <Image
              src={fragrance.image_url}
              alt={`${fragrance.name} by ${fragrance.brand}`}
              fill
              className="object-cover hover:scale-105 transition-transform duration-200"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-2xl font-light mb-1">{fragrance.brand}</div>
                <div className="text-sm">{fragrance.name}</div>
              </div>
            </div>
          )}
          
          {/* Sample badge */}
          {fragrance.sample_available && (
            <div className="absolute top-2 left-2">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                Sample Available
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <Link href={`/fragrance/${fragrance.id}`} className="block">
            <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
              {fragrance.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mt-1">{fragrance.brand}</p>
          {fragrance.scent_family && (
            <p className="text-xs text-gray-500 mt-1">{fragrance.scent_family}</p>
          )}
        </div>

        {/* Notes preview */}
        {fragrance.notes && fragrance.notes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 line-clamp-2">
              {fragrance.notes.slice(0, 3).join(', ')}
              {fragrance.notes.length > 3 && '...'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Primary CTA - Sample First Strategy */}
          <Link href={`/fragrance/${fragrance.id}`} className="block">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
              {primaryAction.text}
            </button>
          </Link>

          {/* Secondary actions */}
          <div className="flex gap-2">
            {onAddToWishlist && (
              <button
                onClick={() => onAddToWishlist(fragrance.id)}
                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Heart className="h-3 w-3" />
                Wishlist
              </button>
            )}
            
            {onAddToCollection && (
              <button
                onClick={() => onAddToCollection(fragrance.id)}
                className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <ShoppingCart className="h-3 w-3" />
                Collect
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
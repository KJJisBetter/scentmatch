'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShoppingCart, Heart, Package } from 'lucide-react';

interface FragranceResult {
  fragrance_id: number;
  id?: number;
  name: string;
  brand: string;
  scent_family: string;
  relevance_score: number;
  description?: string;
  sample_price_usd?: number;
  sample_available?: boolean;
  popularity_score?: number;
}

interface EnhancedFragranceCardProps {
  fragrance: FragranceResult;
}

// Gender detection utility
function detectGender(name: string): 'male' | 'female' | 'unisex' {
  const nameAndBrand = name.toLowerCase();

  // Male indicators
  const maleKeywords = [
    'for men',
    'homme',
    'pour homme',
    "men's",
    'masculine',
    'man',
    'gentlemen',
    'monsieur',
    'male',
    'he',
  ];

  // Female indicators
  const femaleKeywords = [
    'for women',
    'femme',
    'pour femme',
    "women's",
    'feminine',
    'woman',
    'ladies',
    'madame',
    'female',
    'she',
    'her',
  ];

  const hasMatch = (keywords: string[]) =>
    keywords.some(keyword => nameAndBrand.includes(keyword));

  if (hasMatch(maleKeywords)) return 'male';
  if (hasMatch(femaleKeywords)) return 'female';
  return 'unisex';
}

// Smart name formatting utility
function formatFragranceName(
  name: string,
  brand: string
): { displayName: string; fullName: string } {
  // Remove brand name from the fragrance name if it appears at the start
  let cleanName = name;
  if (name.toLowerCase().startsWith(brand.toLowerCase())) {
    cleanName = name.substring(brand.length).trim();
  }

  // Remove common gender suffixes for display
  const genderSuffixes = [
    'for men',
    'for women',
    'pour homme',
    'pour femme',
    'homme',
    'femme',
    "men's",
    "women's",
  ];

  let displayName = cleanName;
  genderSuffixes.forEach(suffix => {
    const regex = new RegExp(`\\s+${suffix}$`, 'gi');
    displayName = displayName.replace(regex, '');
  });

  // Smart truncation at word boundaries
  const maxLength = 32;
  if (displayName.length > maxLength) {
    const words = displayName.split(' ');
    let truncated = '';

    for (const word of words) {
      if ((truncated + ' ' + word).length > maxLength - 3) {
        break;
      }
      truncated += (truncated ? ' ' : '') + word;
    }

    displayName = truncated + '...';
  }

  return { displayName: displayName.trim(), fullName: name };
}

export function EnhancedFragranceCard({
  fragrance,
}: EnhancedFragranceCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  // Get consistent fragrance ID
  const fragranceId = fragrance.fragrance_id || fragrance.id || 0;

  // Gender detection and formatting
  const gender = detectGender(fragrance.name);
  const { displayName, fullName } = formatFragranceName(
    fragrance.name,
    fragrance.brand
  );

  // Enhanced placeholder with better variety
  const defaultPlaceholder =
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80';
  const placeholderImages = [
    defaultPlaceholder,
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=400&fit=crop&q=80',
  ];
  const placeholderImage =
    placeholderImages[fragranceId % placeholderImages.length] ||
    defaultPlaceholder;

  // Enhanced mock data for professional display
  const mockRating = Math.max(
    3.8,
    Math.min(5.0, 4.2 + fragrance.relevance_score * 0.6)
  );
  const mockReviews = Math.floor(150 + ((fragranceId * 31) % 1200));
  const mockPrice = fragrance.sample_price_usd || 8 + (fragranceId % 12);

  // Calculate discount badge
  const hasDiscount = fragranceId % 4 === 0;
  const discountPercent = hasDiscount ? 15 : 0;

  const handleCardClick = () => {
    router.push(`/fragrance/${fragranceId}`);
  };

  const handleSampleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Sample clicked for:', fragranceId);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <Card
      className='group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer border-0 shadow-sm hover:shadow-xl'
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      role='button'
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
    >
      <CardContent className='p-0'>
        {/* Enhanced Image Section */}
        <div className='relative h-48 overflow-hidden bg-gradient-to-br from-amber-50 to-rose-50'>
          <Image
            src={placeholderImage}
            alt={`${fullName} by ${fragrance.brand} - Fragrance`}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
            onError={() => setImageError(true)}
            fill
            sizes='(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
            priority={fragrance.fragrance_id <= 6}
          />

          {/* Enhanced overlay with gradient */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

          {/* Action buttons overlay */}
          <div className='absolute top-3 right-3 flex flex-col gap-2'>
            <button
              onClick={handleLikeClick}
              className='p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md'
              aria-label={`${isLiked ? 'Remove from' : 'Add to'} favorites`}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isLiked
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-600 hover:text-red-400'
                }`}
              />
            </button>
          </div>

          {/* Enhanced badges */}
          <div className='absolute top-3 left-3 flex flex-col gap-1'>
            {/* Gender tag */}
            <Badge
              className={`gender-tag-base gender-tag-${gender} text-xs font-medium shadow-sm`}
            >
              {gender === 'male'
                ? 'Male'
                : gender === 'female'
                  ? 'Female'
                  : 'Unisex'}
            </Badge>

            {/* Sample available badge */}
            {fragrance.sample_available && (
              <Badge className='bg-emerald-600 text-white shadow-sm text-xs font-medium'>
                <Package className='h-3 w-3 mr-1' />
                Sample Ready
              </Badge>
            )}

            {/* Discount badge */}
            {hasDiscount && (
              <Badge className='bg-red-600 text-white shadow-sm text-xs font-medium'>
                {discountPercent}% OFF
              </Badge>
            )}

            {/* Popular badge */}
            {fragrance.popularity_score && fragrance.popularity_score > 8 && (
              <Badge className='bg-orange-600 text-white shadow-sm text-xs font-medium'>
                <Star className='h-3 w-3 mr-1' />
                Popular
              </Badge>
            )}
          </div>

          {/* Quick preview on hover */}
          {isHovering && (
            <div className='absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white'>
              <p className='text-sm opacity-90 line-clamp-2'>
                {fragrance.description ||
                  `A ${fragrance.scent_family.toLowerCase()} fragrance perfect for those who appreciate quality.`}
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Content Section */}
        <div className='p-4 space-y-3'>
          {/* Brand and Name */}
          <div>
            <p className='text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1'>
              {fragrance.brand}
            </p>
            <h3
              className='font-semibold text-foreground leading-snug text-lg'
              title={fullName}
            >
              {displayName}
            </h3>
          </div>

          {/* Enhanced Family and Rating */}
          <div className='flex items-center justify-between'>
            <Badge
              variant='secondary'
              className='text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200'
            >
              {fragrance.scent_family}
            </Badge>
            <div className='flex items-center space-x-1'>
              <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
              <span className='text-sm font-medium text-foreground'>
                {mockRating.toFixed(1)}
              </span>
              <span className='text-xs text-muted-foreground'>
                ({mockReviews.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Enhanced Price and Actions */}
          <div className='flex items-center justify-between pt-2 border-t border-border/50'>
            <div>
              {fragrance.sample_available ? (
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    {hasDiscount ? (
                      <>
                        <span className='text-sm font-bold text-emerald-600'>
                          $
                          {(
                            (mockPrice * (100 - discountPercent)) /
                            100
                          ).toFixed(2)}
                        </span>
                        <span className='text-xs text-muted-foreground line-through'>
                          ${mockPrice}
                        </span>
                      </>
                    ) : (
                      <span className='text-sm font-bold text-emerald-600'>
                        ${mockPrice}
                      </span>
                    )}
                    <span className='text-xs text-muted-foreground'>
                      sample
                    </span>
                  </div>
                </div>
              ) : (
                <span className='text-sm text-muted-foreground'>
                  View details
                </span>
              )}
            </div>

            <div className='flex gap-2'>
              {fragrance.sample_available && (
                <Button
                  size='sm'
                  onClick={handleSampleClick}
                  className='text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white'
                >
                  <ShoppingCart className='h-3 w-3 mr-1' />
                  Try Sample
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                className='text-xs px-3 py-1.5'
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Trust signals */}
          <div className='flex items-center justify-between text-xs text-muted-foreground pt-1'>
            <div className='flex items-center gap-3'>
              <span className='flex items-center gap-1'>
                <span>🚚</span>
                Free shipping
              </span>
              <span className='flex items-center gap-1'>
                <span>🛡️</span>
                Authentic
              </span>
            </div>
            {fragrance.popularity_score && (
              <span className='font-medium text-orange-600'>
                #{Math.floor((10 - fragrance.popularity_score) * 10)} seller
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

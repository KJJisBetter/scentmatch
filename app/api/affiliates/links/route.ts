import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * GET /api/affiliates/links
 *
 * Get affiliate purchase links for a specific fragrance
 * Supports samples, travel sizes, and full bottles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fragranceId = searchParams.get('fragrance_id');
    const linkType = searchParams.get('link_type'); // "sample", "travel", "full", or null for all

    if (!fragranceId) {
      return NextResponse.json(
        {
          error: 'Missing fragrance_id parameter',
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Get fragrance details for link generation
    const { data: fragrance, error: fragranceError } = await (supabase as any)
      .from('fragrances')
      .select(
        `
        id,
        name,
        brand_id,
        sample_available,
        sample_price_usd,
        fragrance_brands!inner(name)
      `
      )
      .eq('id', fragranceId)
      .single();

    if (fragranceError || !fragrance) {
      return NextResponse.json(
        {
          error: 'Fragrance not found',
        },
        { status: 404 }
      );
    }

    const brandName = (fragrance.fragrance_brands as any)?.name || 'Unknown';
    const fragranceName = fragrance.name;

    // Generate affiliate links based on fragrance and brand
    const links = generateAffiliateLinks(
      fragranceId,
      brandName,
      fragranceName,
      linkType
    );

    return NextResponse.json(
      {
        fragrance: {
          id: fragrance.id,
          name: fragranceName,
          brand: brandName,
        },
        links,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // Cache for 1 hour
        },
      }
    );
  } catch (error) {
    console.error('Affiliate links API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate affiliate links for different purchase types
 */
function generateAffiliateLinks(
  fragranceId: string,
  brandName: string,
  fragranceName: string,
  linkType?: string | null
) {
  const searchQuery = encodeURIComponent(`${brandName} ${fragranceName}`);
  const sampleQuery = encodeURIComponent(
    `${brandName} ${fragranceName} sample`
  );
  const travelQuery = encodeURIComponent(
    `${brandName} ${fragranceName} travel size`
  );

  const allLinks = {
    samples: [
      {
        retailer: 'The Perfumed Court',
        url: `https://theperfumedcourt.com/search?q=${sampleQuery}&ref=scentmatch`,
        price: 'Starting at $3',
        size: '1ml samples',
        priority: 1,
      },
      {
        retailer: 'Surrender to Chance',
        url: `https://surrendertochance.com/search?q=${sampleQuery}&ref=scentmatch`,
        price: 'Starting at $4',
        size: '1ml-5ml samples',
        priority: 2,
      },
      {
        retailer: 'DecantX',
        url: `https://decantx.com/search?q=${sampleQuery}&ref=scentmatch`,
        price: 'Starting at $5',
        size: '2ml-10ml decants',
        priority: 3,
      },
      {
        retailer: 'Luckyscent',
        url: `https://www.luckyscent.com/search?w=${sampleQuery}&ref=scentmatch`,
        price: 'Starting at $4',
        size: '0.7ml samples',
        priority: 4,
      },
    ],
    travel_sizes: [
      {
        retailer: 'Sephora',
        url: `https://www.sephora.com/search?keyword=${travelQuery}&ref=scentmatch`,
        price: 'Varies',
        size: '10ml-15ml',
        priority: 1,
      },
      {
        retailer: 'Ulta Beauty',
        url: `https://www.ulta.com/shop/search?Ntt=${travelQuery}&ref=scentmatch`,
        price: 'Varies',
        size: '10ml-30ml',
        priority: 2,
      },
      {
        retailer: 'Nordstrom',
        url: `https://www.nordstrom.com/sr?origin=keywordsearch&keyword=${travelQuery}&ref=scentmatch`,
        price: 'Varies',
        size: '15ml-30ml',
        priority: 3,
      },
    ],
    full_bottles: [
      {
        retailer: 'FragranceX',
        url: `https://www.fragrancex.com/search?search_text=${searchQuery}&ref=scentmatch`,
        price: 'Discounted prices',
        size: '50ml-100ml',
        priority: 1,
      },
      {
        retailer: 'FragranceNet',
        url: `https://www.fragrancenet.com/search?searchtext=${searchQuery}&ref=scentmatch`,
        price: 'Up to 70% off',
        size: '30ml-100ml',
        priority: 2,
      },
      {
        retailer: 'Jomashop',
        url: `https://www.jomashop.com/search/${searchQuery}?ref=scentmatch`,
        price: 'Authentic guaranteed',
        size: '50ml-100ml',
        priority: 3,
      },
      {
        retailer: 'Amazon',
        url: `https://www.amazon.com/s?k=${searchQuery}&tag=scentmatch-20`,
        price: 'Prime shipping',
        size: 'Various sizes',
        priority: 4,
      },
    ],
  };

  // Filter by link type if specified
  if (linkType) {
    switch (linkType) {
      case 'sample':
        return { samples: allLinks.samples };
      case 'travel':
        return { travel_sizes: allLinks.travel_sizes };
      case 'full':
        return { full_bottles: allLinks.full_bottles };
      default:
        return allLinks;
    }
  }

  return allLinks;
}

/**
 * Get popular sample retailers for general browsing
 */
function getPopularSampleRetailers() {
  return [
    {
      name: 'The Perfumed Court',
      url: 'https://theperfumedcourt.com/?ref=scentmatch',
      description: 'Largest selection of niche samples',
      specialties: ['Niche', 'Vintage', 'Hard to find'],
    },
    {
      name: 'Surrender to Chance',
      url: 'https://surrendertochance.com/?ref=scentmatch',
      description: 'High-quality decants and samples',
      specialties: ['Designer', 'Niche', 'Vintage'],
    },
    {
      name: 'Luckyscent',
      url: 'https://www.luckyscent.com/?ref=scentmatch',
      description: 'Curated niche fragrance samples',
      specialties: ['Niche', 'Artisanal', 'Exclusive'],
    },
  ];
}

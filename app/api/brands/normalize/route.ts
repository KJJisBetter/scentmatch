import { NextRequest, NextResponse } from 'next/server';
import { normalizeBrandName } from '@/lib/brand-utils';

/**
 * POST /api/brands/normalize
 * 
 * Normalize brand variations and return canonical brand information
 * Handles cases like "Emporio Armani" vs "Giorgio Armani" intelligently
 */
export async function POST(request: NextRequest) {
  try {
    const { brand_names } = await request.json();

    if (!brand_names || !Array.isArray(brand_names)) {
      return NextResponse.json({
        error: 'brand_names must be an array of strings'
      }, { status: 400 });
    }

    if (brand_names.length === 0) {
      return NextResponse.json({
        error: 'brand_names array cannot be empty'
      }, { status: 400 });
    }

    if (brand_names.length > 100) {
      return NextResponse.json({
        error: 'Too many brand names (max 100)'
      }, { status: 400 });
    }

    const normalized: Record<string, {
      canonical_name: string;
      parent_brand: string;
      sub_brand: string;
    }> = {};

    // Process each brand name
    brand_names.forEach((brandName: string) => {
      if (typeof brandName === 'string' && brandName.trim()) {
        const result = normalizeBrandName(brandName.trim());
        normalized[brandName] = result;
      }
    });

    return NextResponse.json({
      normalized
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('Brand normalization API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}


/**
 * GET /api/brands/normalize
 * 
 * Get brand normalization for a single brand (query parameter)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandName = searchParams.get('brand');

    if (!brandName) {
      return NextResponse.json({
        error: 'Missing brand parameter'
      }, { status: 400 });
    }

    const result = normalizeBrandName(brandName);

    return NextResponse.json({
      input: brandName,
      ...result
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' // Cache for 24 hours
      }
    });

  } catch (error) {
    console.error('Brand normalization GET API error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
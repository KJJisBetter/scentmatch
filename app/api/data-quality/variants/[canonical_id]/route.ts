/**
 * Fragrance Variants API
 * Endpoint to retrieve name variants for a canonical fragrance
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { canonical_id: string } }
) {
  try {
    const { canonical_id } = params
    const { searchParams } = new URL(request.url)
    const includeMalformed = searchParams.get('include_malformed') === 'true'

    // Validate canonical_id format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(canonical_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid canonical_id format. Must be a valid UUID.',
            details: { canonical_id }
          }
        },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabase()

    // Get canonical fragrance info
    const { data: canonicalFragrance, error: canonicalError } = await supabase
      .from('fragrances_canonical')
      .select('id, canonical_name, brand_id, fragrance_brands!inner(name)')
      .eq('id', canonical_id)
      .single()

    if (canonicalError || !canonicalFragrance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FRAGRANCE_NOT_FOUND',
            message: `Canonical fragrance with ID ${canonical_id} not found`,
            details: { canonical_id }
          }
        },
        { status: 404 }
      )
    }

    // Get variants for this canonical fragrance
    let variantsQuery = supabase
      .from('fragrance_variants')
      .select('id, variant_name, source, confidence, is_malformed, created_at')
      .eq('canonical_id', canonical_id)
      .order('confidence', { ascending: false })

    // Filter out malformed variants if not requested
    if (!includeMalformed) {
      variantsQuery = variantsQuery.eq('is_malformed', false)
    }

    const { data: variants, error: variantsError } = await variantsQuery

    if (variantsError) {
      throw variantsError
    }

    // Return results
    return NextResponse.json({
      success: true,
      data: {
        canonical_name: canonicalFragrance.canonical_name,
        brand: canonicalFragrance.fragrance_brands?.name || 'Unknown',
        variants: variants.map(variant => ({
          variant_name: variant.variant_name,
          source: variant.source,
          confidence: variant.confidence,
          is_malformed: variant.is_malformed,
          created_at: variant.created_at
        })),
        total_variants: variants.length,
        malformed_count: variants.filter(v => v.is_malformed).length
      }
    })

  } catch (error) {
    console.error('Variants API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error retrieving variants',
          details: process.env.NODE_ENV === 'development' ? error : {}
        }
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
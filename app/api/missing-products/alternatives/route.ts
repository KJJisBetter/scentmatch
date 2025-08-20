/**
 * Missing Product Alternatives API
 * Returns intelligent alternative suggestions for missing products
 * Addresses Linear issue SCE-50: "Coach For Men" → intelligent alternatives
 */

import { NextRequest, NextResponse } from 'next/server'
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector'

const detector = new MissingProductDetector()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '5')
    const similarityThreshold = parseFloat(searchParams.get('similarity_threshold') || '0.6')

    // Validate required parameters
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'query parameter is required',
            details: { provided: query }
          }
        },
        { status: 400 }
      )
    }

    // Validate limit parameter
    if (limit < 1 || limit > 20) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'limit must be between 1 and 20',
            details: { limit }
          }
        },
        { status: 400 }
      )
    }

    // Validate similarity threshold
    if (similarityThreshold < 0.1 || similarityThreshold > 1.0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'similarity_threshold must be between 0.1 and 1.0',
            details: { similarity_threshold: similarityThreshold }
          }
        },
        { status: 400 }
      )
    }

    // Find alternatives
    const startTime = Date.now()
    const alternatives = await detector.findAlternatives(query.trim())
    const processingTime = Date.now() - startTime

    // Filter by similarity threshold and limit
    const filteredAlternatives = alternatives
      .filter(alt => alt.similarity_score >= similarityThreshold)
      .slice(0, limit)

    // Analyze query for additional context
    const analysis = detector.analyzeSearchQuery(query)

    // Build response with notification option
    const response = {
      success: true,
      data: {
        alternatives: filteredAlternatives.map(alt => ({
          fragrance_id: alt.fragrance_id,
          name: alt.name,
          brand: alt.brand,
          similarity_score: alt.similarity_score,
          match_reason: alt.match_reason,
          image_url: alt.image_url || `/images/fragrances/${alt.fragrance_id}.jpg`
        })),
        query_analysis: {
          original_query: query,
          extracted_brand: analysis.extractedBrand,
          extracted_product: analysis.extractedProduct,
          category: analysis.category,
          gender: analysis.gender,
          notes: analysis.notes
        },
        request_notification: {
          available: true,
          endpoint: '/api/missing-products/notify',
          message: `We'll notify you if we add "${query}" to our catalog`
        },
        metadata: {
          total_found: filteredAlternatives.length,
          processing_time_ms: processingTime,
          similarity_threshold: similarityThreshold,
          timestamp: new Date().toISOString()
        }
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Missing product alternatives API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error finding alternatives',
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
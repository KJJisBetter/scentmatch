/**
 * Missing Product Logging API
 * Logs searches for products not in database for demand tracking
 * Addresses Linear issue SCE-50: "Coach For Men" not found destroys trust
 */

import { NextRequest, NextResponse } from 'next/server'
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector'

const detector = new MissingProductDetector()

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { search_query, user_context, extract_info = true } = body

    // Validate required parameters
    if (!search_query || typeof search_query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'search_query parameter is required and must be a string',
            details: { provided: typeof search_query }
          }
        },
        { status: 400 }
      )
    }

    // Trim and validate query
    const trimmedQuery = search_query.trim()
    if (trimmedQuery.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'search_query cannot be empty',
            details: { search_query: trimmedQuery }
          }
        },
        { status: 400 }
      )
    }

    if (trimmedQuery.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'search_query too long (maximum 200 characters)',
            details: { length: trimmedQuery.length }
          }
        },
        { status: 400 }
      )
    }

    // Extract context information
    const userId = user_context?.user_id
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')

    // Log the missing product request
    const requestId = await detector.logMissingProduct(
      trimmedQuery,
      userId,
      ipAddress,
      userAgent
    )

    // Analyze the search query if requested
    let extractedInfo: any = {}
    if (extract_info) {
      try {
        // Use the analyzer from detector (we'll need to expose this method)
        const analysis = await detector.analyzeSearchQuery(trimmedQuery)
        extractedInfo = {
          extracted_brand: analysis.extractedBrand,
          extracted_product: analysis.extractedProduct,
          category: analysis.category,
          gender: analysis.gender,
          notes: analysis.notes
        }
      } catch (error) {
        console.warn('Query analysis failed:', error)
      }
    }

    // Calculate priority score based on request count
    const requestCount = await detector.getMissingProductCount(trimmedQuery)
    const priorityScore = Math.min(10, Math.max(1, Math.floor(requestCount / 2) + 1))

    // Check if alternatives are available
    const alternatives = await detector.findAlternatives(trimmedQuery)
    const alternativesAvailable = alternatives.length > 0

    // Return successful response
    return NextResponse.json({
      success: true,
      data: {
        request_id: requestId,
        ...extractedInfo,
        priority_score: priorityScore,
        request_count: requestCount,
        alternatives_available: alternativesAvailable,
        message: alternativesAvailable ? 
          `Logged search for "${trimmedQuery}". Found ${alternatives.length} similar alternatives.` :
          `Logged search for "${trimmedQuery}". No similar products found.`
      }
    })

  } catch (error) {
    console.error('Missing product logging API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error logging missing product',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
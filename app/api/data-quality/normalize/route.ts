/**
 * Fragrance Name Normalization API
 * Endpoint to normalize fragrance names using industry-standard formatting
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { NextRequest, NextResponse } from 'next/server'
import { FragranceNormalizer } from '@/lib/data-quality/fragrance-normalizer'

// Initialize normalizer instance
const normalizer = new FragranceNormalizer()

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { name, brand, confidence_threshold = 0.8 } = body

    // Validate required parameters
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name parameter is required and must be a string',
            details: { provided: typeof name }
          }
        },
        { status: 400 }
      )
    }

    // Trim and validate name length
    const trimmedName = name.trim()
    if (trimmedName.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name cannot be empty',
            details: { name: trimmedName }
          }
        },
        { status: 400 }
      )
    }

    if (trimmedName.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Name too long (maximum 200 characters)',
            details: { length: trimmedName.length }
          }
        },
        { status: 400 }
      )
    }

    // Perform normalization
    const startTime = Date.now()
    const result = normalizer.normalizeFragranceName(trimmedName, brand)
    const processingTime = Date.now() - startTime

    // Check confidence threshold
    if (result.confidence < confidence_threshold) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NORMALIZATION_FAILED',
            message: `Unable to normalize with sufficient confidence. Got ${result.confidence.toFixed(3)}, required ${confidence_threshold}`,
            details: {
              confidence: result.confidence,
              threshold: confidence_threshold,
              changes: result.changes
            }
          }
        },
        { status: 422 }
      )
    }

    // Extract brand from canonical name if not provided
    let extractedBrand = brand
    if (!extractedBrand && result.canonicalName.includes(' ')) {
      const words = result.canonicalName.split(' ')
      // Assume first word(s) until fragrance line are brand
      if (words.length >= 2) {
        extractedBrand = words[0] // Simple extraction, could be enhanced
      }
    }

    // Return successful normalization
    return NextResponse.json({
      success: true,
      data: {
        canonical_name: result.canonicalName,
        original_name: trimmedName,
        brand: extractedBrand || 'Unknown',
        fragrance_line: result.fragranceLine,
        concentration: result.concentration,
        confidence: result.confidence,
        changes_applied: result.changes,
        needs_normalization: result.needsNormalization,
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    console.error('Normalization API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error during normalization',
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
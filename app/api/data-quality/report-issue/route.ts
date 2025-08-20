/**
 * Data Quality Issue Reporting API
 * Endpoint to report data quality issues for manual review
 * Spec: @.agent-os/specs/2025-08-20-fragrance-data-quality-system/
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { fragrance_id, issue_type, description, severity = 'medium' } = body

    // Validate required parameters
    if (!fragrance_id || typeof fragrance_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'fragrance_id parameter is required and must be a string',
            details: { provided: typeof fragrance_id }
          }
        },
        { status: 400 }
      )
    }

    if (!issue_type || typeof issue_type !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'issue_type parameter is required and must be a string',
            details: { provided: typeof issue_type }
          }
        },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'description parameter is required and must be a string',
            details: { provided: typeof description }
          }
        },
        { status: 400 }
      )
    }

    // Validate severity level
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid severity level. Must be one of: ${validSeverities.join(', ')}`,
            details: { severity, valid_options: validSeverities }
          }
        },
        { status: 400 }
      )
    }

    // Validate issue type
    const validIssueTypes = [
      'malformed_name',
      'duplicate',
      'missing_field',
      'incorrect_brand',
      'wrong_concentration',
      'missing_concentration',
      'incorrect_gender',
      'data_inconsistency',
      'other'
    ]

    if (!validIssueTypes.includes(issue_type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid issue_type. Must be one of: ${validIssueTypes.join(', ')}`,
            details: { issue_type, valid_options: validIssueTypes }
          }
        },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabase()

    // Verify fragrance exists (check both canonical and original tables)
    let fragranceExists = false
    
    // Check canonical table first
    const { data: canonicalCheck } = await supabase
      .from('fragrances_canonical')
      .select('id')
      .eq('id', fragrance_id)
      .single()

    if (canonicalCheck) {
      fragranceExists = true
    } else {
      // Check original fragrances table
      const { data: originalCheck } = await supabase
        .from('fragrances')
        .select('id')
        .eq('id', fragrance_id)
        .single()

      if (originalCheck) {
        fragranceExists = true
      }
    }

    if (!fragranceExists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FRAGRANCE_NOT_FOUND',
            message: `Fragrance with ID ${fragrance_id} not found in canonical or original tables`,
            details: { fragrance_id }
          }
        },
        { status: 404 }
      )
    }

    // Create quality issue record
    const { data: issueRecord, error: insertError } = await supabase
      .from('data_quality_issues')
      .insert({
        issue_type,
        severity,
        fragrance_id,
        description: description.trim(),
        details: {
          reported_via: 'api',
          user_agent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      })
      .select('id, status, created_at')
      .single()

    if (insertError) {
      throw insertError
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        issue_id: issueRecord.id,
        status: issueRecord.status,
        created_at: issueRecord.created_at,
        message: `Data quality issue reported successfully. Issue ID: ${issueRecord.id}`
      }
    })

  } catch (error) {
    console.error('Report issue API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error reporting issue',
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
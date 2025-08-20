/**
 * Data Quality Issues API
 * Returns active quality issues requiring attention
 * Part of proactive monitoring system for Linear issues SCE-49/50/51
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const status = searchParams.get('status') || 'open'
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '50')))

    // Validate parameters
    const validSeverities = ['low', 'medium', 'high', 'critical']
    const validStatuses = ['open', 'resolved', 'ignored']

    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`,
            details: { severity, valid_options: validSeverities }
          }
        },
        { status: 400 }
      )
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            details: { status, valid_options: validStatuses }
          }
        },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabase()

    // Build query
    let query = supabase
      .from('data_quality_issues')
      .select('id, issue_type, severity, fragrance_id, description, details, status, created_at, resolved_at')
      .eq('status', status)
      .order('severity', { ascending: false }) // Critical first
      .order('created_at', { ascending: false }) // Newest first
      .limit(limit)

    // Apply severity filter if provided
    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data: issues, error: issuesError } = await query

    if (issuesError) {
      throw issuesError
    }

    // Get summary statistics
    const { data: summary } = await supabase
      .from('data_quality_issues')
      .select('severity, status, count(*)')
      .group('severity, status')

    // Build summary object
    const summaryStats: any = {
      total_issues: 0,
      by_severity: { critical: 0, high: 0, medium: 0, low: 0 },
      by_status: { open: 0, resolved: 0, ignored: 0 }
    }

    summary?.forEach((item: any) => {
      summaryStats.total_issues += item.count
      summaryStats.by_severity[item.severity] = (summaryStats.by_severity[item.severity] || 0) + item.count
      summaryStats.by_status[item.status] = (summaryStats.by_status[item.status] || 0) + item.count
    })

    // Calculate priority levels for alerting
    const alertLevels = {
      immediate: summaryStats.by_severity.critical,
      urgent: summaryStats.by_severity.high,
      planned: summaryStats.by_severity.medium,
      backlog: summaryStats.by_severity.low
    }

    return NextResponse.json({
      success: true,
      data: {
        issues: issues?.map(issue => ({
          issue_id: issue.id,
          type: issue.issue_type,
          severity: issue.severity,
          fragrance_id: issue.fragrance_id,
          description: issue.description,
          details: issue.details,
          status: issue.status,
          created_at: issue.created_at,
          resolved_at: issue.resolved_at,
          age_hours: Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60))
        })) || [],
        summary: summaryStats,
        alert_levels: alertLevels,
        filter_applied: {
          severity: severity || 'all',
          status: status,
          limit: limit
        },
        recommendations: {
          immediate_attention_required: alertLevels.immediate > 0,
          quality_review_needed: alertLevels.urgent + alertLevels.immediate > 5,
          system_health: summaryStats.by_status.open < 10 ? 'good' : 
                        summaryStats.by_status.open < 25 ? 'fair' : 'needs_attention'
        }
      }
    })

  } catch (error) {
    console.error('Quality issues API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error retrieving quality issues',
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
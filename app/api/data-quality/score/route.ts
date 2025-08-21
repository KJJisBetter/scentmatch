/**
 * Data Quality Score API
 * Returns current overall data quality score and component metrics
 * Part of proactive monitoring system for Linear issues SCE-49/50/51
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabase();

    // Get the most recent quality score
    const { data: latestScore, error: scoreError } = await supabase
      .from('data_quality_scores')
      .select('*')
      .order('check_timestamp', { ascending: false })
      .limit(1)
      .single();

    if (scoreError || !latestScore) {
      // No quality checks run yet, trigger one
      const { data: newCheckId, error: checkError } = await supabase.rpc(
        'run_data_quality_checks'
      );

      if (checkError) {
        throw new Error(`Failed to run quality check: ${checkError.message}`);
      }

      // Get the new results
      const { data: newScore, error: newScoreError } = await supabase
        .from('data_quality_scores')
        .select('*')
        .eq('id', newCheckId)
        .single();

      if (newScoreError || !newScore) {
        throw new Error(
          `Failed to retrieve quality score: ${newScoreError?.message}`
        );
      }

      // latestScore = newScore
    }

    // Get quality trend (last 5 checks)
    const { data: trendData } = await supabase
      .from('data_quality_scores')
      .select('overall_score, check_timestamp')
      .order('check_timestamp', { ascending: false })
      .limit(5);

    // Calculate trend
    let trend = 'stable';
    if (trendData && trendData.length >= 2) {
      const latest = trendData[0].overall_score;
      const previous = trendData[1].overall_score;
      const difference = latest - previous;

      if (difference > 0.05) {
        trend = 'improving';
      } else if (difference < -0.05) {
        trend = 'degrading';
      }
    }

    // Get current issue count by severity
    const { data: issueCounts } = await supabase
      .from('data_quality_issues')
      .select('severity, count(*)')
      .eq('status', 'open')
      .group('severity');

    const issueBreakdown: Record<string, number> = {};
    issueCounts?.forEach((item: any) => {
      issueBreakdown[item.severity] = item.count;
    });

    // Build response
    return NextResponse.json({
      success: true,
      data: {
        overall_score: latestScore.overall_score,
        component_scores: {
          name_formatting: latestScore.name_formatting_score,
          completeness: latestScore.completeness_score,
          duplicates: latestScore.duplicate_score,
          variant_mapping: latestScore.variant_mapping_score,
        },
        metrics: {
          total_products: latestScore.total_products,
          malformed_names: latestScore.malformed_names,
          missing_fields: latestScore.missing_fields,
          duplicate_products: latestScore.duplicate_products,
          orphaned_variants: latestScore.orphaned_variants,
        },
        last_check: latestScore.check_timestamp,
        trend: trend,
        open_issues: {
          critical: issueBreakdown.critical || 0,
          high: issueBreakdown.high || 0,
          medium: issueBreakdown.medium || 0,
          low: issueBreakdown.low || 0,
          total: Object.values(issueBreakdown).reduce(
            (sum: number, count: number) => sum + count,
            0
          ),
        },
        alert_status: {
          quality_below_threshold: latestScore.overall_score < 0.8,
          critical_issues_present: (issueBreakdown.critical || 0) > 0,
          trend_concerning: trend === 'degrading',
        },
      },
    });
  } catch (error) {
    console.error('Quality score API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error retrieving quality score',
          details: process.env.NODE_ENV === 'development' ? error : {},
        },
      },
      { status: 500 }
    );
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
  });
}

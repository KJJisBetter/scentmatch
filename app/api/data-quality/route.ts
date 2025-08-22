/**
 * Unified Data Quality Management API
 * 
 * Consolidates 6 separate data-quality routes into one comprehensive endpoint:
 * - GET: Get quality scores and metrics
 * - POST: Run quality checks, report issues, normalize data
 * 
 * Replaces:
 * - /api/data-quality/score/route.ts
 * - /api/data-quality/run-checks/route.ts  
 * - /api/data-quality/issues/route.ts
 * - /api/data-quality/report-issue/route.ts
 * - /api/data-quality/normalize/route.ts
 * - /api/data-quality/variants/[canonical_id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'score';
    const canonicalId = searchParams.get('canonical_id');
    
    const supabase = createServiceSupabase();

    switch (action) {
      case 'score':
        return await getQualityScore(supabase);
      case 'issues':
        return await getQualityIssues(supabase, searchParams);
      case 'variants':
        if (!canonicalId) {
          return NextResponse.json({ error: 'canonical_id required for variants' }, { status: 400 });
        }
        return await getFragranceVariants(supabase, canonicalId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Data quality GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    const supabase = createServiceSupabase();

    switch (action) {
      case 'run_checks':
        return await runQualityChecks(supabase, params);
      case 'report_issue':
        return await reportQualityIssue(supabase, params);
      case 'normalize':
        return await normalizeData(supabase, params);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Data quality POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Consolidated helper functions
async function getQualityScore(supabase: any) {
  const { data: latestScore, error } = await supabase
    .from('data_quality_scores')
    .select('*')
    .order('check_timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quality score' }, { status: 500 });
  }

  return NextResponse.json({
    overall_score: latestScore.overall_score,
    component_scores: latestScore.component_scores,
    last_updated: latestScore.check_timestamp,
    trends: latestScore.trends || {},
  });
}

async function getQualityIssues(supabase: any, searchParams: URLSearchParams) {
  const severity = searchParams.get('severity') || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');

  let query = supabase
    .from('data_quality_issues')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (severity !== 'all') {
    query = query.eq('severity', severity);
  }

  const { data: issues, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch quality issues' }, { status: 500 });
  }

  return NextResponse.json({ issues });
}

async function getFragranceVariants(supabase: any, canonicalId: string) {
  const { data: variants, error } = await supabase
    .from('fragrance_variants')
    .select('*')
    .eq('canonical_id', canonicalId);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }

  return NextResponse.json({ variants });
}

async function runQualityChecks(supabase: any, params: any) {
  const { check_types, async: runAsync = true } = params;

  const { data: result, error } = await supabase
    .rpc('run_data_quality_checks', {
      check_types_filter: check_types,
      run_async: runAsync,
    });

  if (error) {
    return NextResponse.json({ error: 'Quality checks failed' }, { status: 500 });
  }

  return NextResponse.json({
    checks_initiated: true,
    async: runAsync,
    check_id: result?.check_id,
    estimated_completion: runAsync ? result?.estimated_completion : 'immediate',
  });
}

async function reportQualityIssue(supabase: any, params: any) {
  const { fragrance_id, issue_type, description, severity = 'medium', metadata } = params;

  const { data: result, error } = await supabase
    .from('data_quality_issues')
    .insert({
      fragrance_id,
      issue_type,
      description,
      severity,
      metadata,
      detected_at: new Date().toISOString(),
      source: 'manual_report',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to report issue' }, { status: 500 });
  }

  return NextResponse.json({
    issue_reported: true,
    issue_id: result.id,
    severity: result.severity,
  });
}

async function normalizeData(supabase: any, params: any) {
  const { data_type, target_ids, normalization_rules } = params;

  const { data: result, error } = await supabase
    .rpc('normalize_fragrance_data', {
      data_type_filter: data_type,
      target_id_list: target_ids,
      rules: normalization_rules,
    });

  if (error) {
    return NextResponse.json({ error: 'Normalization failed' }, { status: 500 });
  }

  return NextResponse.json({
    normalization_complete: true,
    items_processed: result?.items_processed || 0,
    changes_made: result?.changes_made || 0,
  });
}
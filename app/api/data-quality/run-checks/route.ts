/**
 * Data Quality Check Trigger API
 * Manually triggers comprehensive quality assessment
 * Part of proactive monitoring system for Linear issues SCE-49/50/51
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { check_types, async: runAsync = true } = body;

    const supabase = createServiceSupabase();

    // Validate check_types if provided
    const validCheckTypes = [
      'malformed_names',
      'duplicates',
      'missing_fields',
      'orphaned_variants',
      'quality_scores',
    ];

    if (check_types && Array.isArray(check_types)) {
      const invalidTypes = check_types.filter(
        (type: string) => !validCheckTypes.includes(type)
      );
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: `Invalid check types: ${invalidTypes.join(', ')}`,
              details: {
                invalid_types: invalidTypes,
                valid_options: validCheckTypes,
              },
            },
          },
          { status: 400 }
        );
      }
    }

    // Run quality checks
    const startTime = Date.now();

    if (runAsync) {
      // Asynchronous execution - return immediately with check ID
      try {
        const { data: checkId, error: checkError } = await (
          supabase as any
        ).rpc('run_data_quality_checks');

        if (checkError) {
          throw checkError;
        }

        const estimatedDuration = 30000; // 30 seconds estimate

        return NextResponse.json({
          success: true,
          data: {
            check_id: checkId,
            status: 'running',
            estimated_duration_ms: estimatedDuration,
            progress_endpoint: `/api/data-quality/checks/${checkId}/progress`,
            started_at: new Date().toISOString(),
            check_types: check_types || 'all',
          },
        });
      } catch (error) {
        throw new Error(`Failed to start async quality check: ${error}`);
      }
    } else {
      // Synchronous execution - wait for completion
      try {
        const { data: checkId, error: checkError } = await (
          supabase as any
        ).rpc('run_data_quality_checks');

        if (checkError) {
          throw checkError;
        }

        // Get the completed results
        const { data: results, error: resultsError } = await (supabase as any)
          .from('data_quality_scores')
          .select('*')
          .eq('id', checkId)
          .single();

        if (resultsError || !results) {
          throw new Error(
            `Failed to retrieve check results: ${resultsError?.message}`
          );
        }

        const processingTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          data: {
            check_id: checkId,
            status: 'completed',
            results: {
              overall_score: results.overall_score,
              component_scores: {
                name_formatting: results.name_formatting_score,
                completeness: results.completeness_score,
                duplicates: results.duplicate_score,
                variant_mapping: results.variant_mapping_score,
              },
              metrics: {
                total_products: results.total_products,
                malformed_names: results.malformed_names,
                missing_fields: results.missing_fields,
                duplicate_products: results.duplicate_products,
                orphaned_variants: results.orphaned_variants,
              },
              check_timestamp: results.check_timestamp,
            },
            processing_time_ms: processingTime,
            performance_met: processingTime < 60000, // 60 second target
          },
        });
      } catch (error) {
        throw new Error(`Synchronous quality check failed: ${error}`);
      }
    }
  } catch (error) {
    console.error('Quality check API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error running quality checks',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

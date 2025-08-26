/**
 * Analytics Tracking API Route
 * Handles server-side analytics event processing and storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for analytics storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  user_id?: string;
  session_id: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEvent = await request.json();

    // Validate required fields
    if (!body.event || !body.session_id || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Enrich event with server-side data
    const enrichedEvent = {
      ...body,
      properties: {
        ...body.properties,
        server_timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      },
    };

    // Store in Supabase analytics table
    const { error: dbError } = await supabase
      .from('analytics_events')
      .insert([
        {
          event_name: enrichedEvent.event,
          properties: enrichedEvent.properties,
          user_id: enrichedEvent.user_id,
          session_id: enrichedEvent.session_id,
          timestamp: enrichedEvent.timestamp,
          created_at: new Date().toISOString(),
        },
      ]);

    if (dbError) {
      console.error('Failed to store analytics event:', dbError);
      // Don't fail the request - analytics should be non-blocking
    }

    // Process specific event types for real-time metrics
    await processEventType(enrichedEvent);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processEventType(event: AnalyticsEvent) {
  try {
    switch (event.event) {
      case 'ab_test_assigned':
        await recordABTestAssignment(event);
        break;
      case 'ab_test_conversion':
        await recordABTestConversion(event);
        break;
      case 'bottom_nav_click':
        await recordBottomNavUsage(event);
        break;
      case 'quiz_started':
        await recordQuizFunnelEvent(event);
        break;
      case 'collection_save':
        await recordCollectionActivity(event);
        break;
      case 'performance_metric':
        await recordPerformanceMetric(event);
        break;
    }
  } catch (error) {
    console.error(`Failed to process event type ${event.event}:`, error);
  }
}

async function recordABTestAssignment(event: AnalyticsEvent) {
  const { test_key, variant, test_name } = event.properties;

  await supabase.from('ab_test_assignments').insert([
    {
      test_key,
      variant,
      test_name,
      user_id: event.user_id,
      session_id: event.session_id,
      assigned_at: event.timestamp,
    },
  ]);
}

async function recordABTestConversion(event: AnalyticsEvent) {
  const { test_key, variant, conversion_type, conversion_value } = event.properties;

  await supabase.from('ab_test_conversions').insert([
    {
      test_key,
      variant,
      conversion_type,
      conversion_value,
      user_id: event.user_id,
      session_id: event.session_id,
      converted_at: event.timestamp,
    },
  ]);
}

async function recordBottomNavUsage(event: AnalyticsEvent) {
  const { tab, is_mobile } = event.properties;

  await supabase.from('navigation_analytics').insert([
    {
      navigation_type: 'bottom_nav',
      tab_clicked: tab,
      is_mobile,
      user_id: event.user_id,
      session_id: event.session_id,
      clicked_at: event.timestamp,
    },
  ]);
}

async function recordQuizFunnelEvent(event: AnalyticsEvent) {
  const { source, is_mobile } = event.properties;

  await supabase.from('quiz_funnel_events').insert([
    {
      event_type: 'quiz_started',
      source,
      is_mobile,
      user_id: event.user_id,
      session_id: event.session_id,
      occurred_at: event.timestamp,
    },
  ]);
}

async function recordCollectionActivity(event: AnalyticsEvent) {
  const { fragrance_id, source, is_mobile } = event.properties;

  await supabase.from('collection_analytics').insert([
    {
      action: 'save',
      fragrance_id,
      source,
      is_mobile,
      user_id: event.user_id,
      session_id: event.session_id,
      performed_at: event.timestamp,
    },
  ]);
}

async function recordPerformanceMetric(event: AnalyticsEvent) {
  const { metric, value, viewport_width } = event.properties;

  await supabase.from('performance_metrics').insert([
    {
      metric_name: metric,
      metric_value: value,
      viewport_width,
      user_id: event.user_id,
      session_id: event.session_id,
      measured_at: event.timestamp,
    },
  ]);
}

// GET endpoint for analytics dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    const metric = searchParams.get('metric');

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric parameter required' },
        { status: 400 }
      );
    }

    const result = await getAnalyticsMetric(metric, timeframe);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analytics GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAnalyticsMetric(metric: string, timeframe: string) {
  const timeframeDays = parseInt(timeframe.replace('d', '')) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframeDays);

  switch (metric) {
    case 'bottom_nav_usage':
      return await getBottomNavUsageMetrics(startDate);
    case 'ab_test_results':
      return await getABTestResults(startDate);
    case 'performance_summary':
      return await getPerformanceSummary(startDate);
    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
}

async function getBottomNavUsageMetrics(startDate: Date) {
  const { data, error } = await supabase
    .from('navigation_analytics')
    .select('tab_clicked, is_mobile, clicked_at')
    .gte('clicked_at', startDate.toISOString())
    .order('clicked_at', { ascending: false });

  if (error) throw error;

  // Aggregate metrics
  const tabCounts = data.reduce((acc, row) => {
    acc[row.tab_clicked] = (acc[row.tab_clicked] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mobileUsage = data.filter(row => row.is_mobile).length;
  const totalUsage = data.length;

  return {
    tab_usage: tabCounts,
    mobile_percentage: totalUsage ? (mobileUsage / totalUsage) * 100 : 0,
    total_clicks: totalUsage,
  };
}

async function getABTestResults(startDate: Date) {
  const { data: assignments } = await supabase
    .from('ab_test_assignments')
    .select('test_key, variant, assigned_at')
    .gte('assigned_at', startDate.toISOString());

  const { data: conversions } = await supabase
    .from('ab_test_conversions')
    .select('test_key, variant, conversion_type, converted_at')
    .gte('converted_at', startDate.toISOString());

  // Calculate conversion rates by test and variant
  const results: Record<string, any> = {};

  assignments?.forEach(assignment => {
    if (!results[assignment.test_key]) {
      results[assignment.test_key] = {
        control: { assignments: 0, conversions: 0 },
        treatment: { assignments: 0, conversions: 0 },
      };
    }
    results[assignment.test_key][assignment.variant].assignments++;
  });

  conversions?.forEach(conversion => {
    if (results[conversion.test_key]) {
      results[conversion.test_key][conversion.variant].conversions++;
    }
  });

  // Calculate conversion rates
  Object.keys(results).forEach(testKey => {
    const test = results[testKey];
    test.control.conversion_rate = test.control.assignments 
      ? (test.control.conversions / test.control.assignments) * 100 
      : 0;
    test.treatment.conversion_rate = test.treatment.assignments 
      ? (test.treatment.conversions / test.treatment.assignments) * 100 
      : 0;
    test.improvement = test.control.conversion_rate 
      ? ((test.treatment.conversion_rate - test.control.conversion_rate) / test.control.conversion_rate) * 100 
      : 0;
  });

  return results;
}

async function getPerformanceSummary(startDate: Date) {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('metric_name, metric_value, viewport_width, measured_at')
    .gte('measured_at', startDate.toISOString());

  if (error) throw error;

  // Aggregate performance metrics
  const metrics = data.reduce((acc, row) => {
    if (!acc[row.metric_name]) {
      acc[row.metric_name] = {
        values: [],
        mobile_values: [],
        desktop_values: [],
      };
    }
    
    acc[row.metric_name].values.push(row.metric_value);
    
    if (row.viewport_width <= 768) {
      acc[row.metric_name].mobile_values.push(row.metric_value);
    } else {
      acc[row.metric_name].desktop_values.push(row.metric_value);
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and percentiles
  Object.keys(metrics).forEach(metricName => {
    const metric = metrics[metricName];
    
    metric.average = metric.values.reduce((a: number, b: number) => a + b, 0) / metric.values.length;
    metric.p95 = calculatePercentile(metric.values, 95);
    metric.mobile_average = metric.mobile_values.length 
      ? metric.mobile_values.reduce((a: number, b: number) => a + b, 0) / metric.mobile_values.length 
      : 0;
    metric.desktop_average = metric.desktop_values.length 
      ? metric.desktop_values.reduce((a: number, b: number) => a + b, 0) / metric.desktop_values.length 
      : 0;
  });

  return metrics;
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}
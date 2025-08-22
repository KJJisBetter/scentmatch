/**
 * Unified Missing Products Management API
 * 
 * Consolidates 3 missing-products routes into one comprehensive endpoint:
 * - GET: Get alternatives for missing products
 * - POST: Log missing products and notify about issues
 * 
 * Replaces:
 * - /api/missing-products/alternatives/route.ts
 * - /api/missing-products/notify/route.ts
 * - /api/missing-products/log/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { MissingProductDetector } from '@/lib/data-quality/missing-product-detector';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'alternatives';
    const query = searchParams.get('query');
    const brand = searchParams.get('brand');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    const detector = new MissingProductDetector();

    if (action === 'alternatives') {
      const alternatives = await detector.findAlternatives(query);
      return NextResponse.json({
        query,
        brand,
        alternatives: alternatives || [],
        found_alternatives: alternatives?.length || 0,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Missing products GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;
    
    const supabase = await createServerSupabase();

    switch (action) {
      case 'log':
        return await logMissingProduct(supabase, params);
      case 'notify':
        return await notifyMissingProduct(supabase, params);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Missing products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function logMissingProduct(supabase: any, params: any) {
  const { query, brand, user_email, context } = params;

  const { data: result, error } = await supabase
    .from('missing_product_logs')
    .insert({
      search_query: query,
      brand_name: brand,
      user_email,
      search_context: context,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to log missing product' }, { status: 500 });
  }

  return NextResponse.json({
    logged: true,
    log_id: result.id,
    query,
    brand,
  });
}

async function notifyMissingProduct(supabase: any, params: any) {
  const { email, fragrance_name, brand_name, notes } = params;

  const { data: result, error } = await supabase
    .from('missing_product_notifications')
    .insert({
      user_email: email,
      requested_fragrance: fragrance_name,
      requested_brand: brand_name,
      additional_notes: notes,
      requested_at: new Date().toISOString(),
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to submit notification request' }, { status: 500 });
  }

  return NextResponse.json({
    notification_submitted: true,
    request_id: result.id,
    estimated_response_time: '1-2 business days',
  });
}
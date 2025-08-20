/**
 * Missing Product Notification API
 * Allows users to request notifications when missing products become available
 * Addresses Linear issue SCE-50: Convert abandonment to engagement
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { search_query, email, notification_preferences } = body

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

    // Validate email if provided (for non-authenticated users)
    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'email must be a valid email address if provided',
            details: { email }
          }
        },
        { status: 400 }
      )
    }

    const supabase = createServiceSupabase()
    const trimmedQuery = search_query.trim()
    const normalizedQuery = trimmedQuery.toLowerCase()

    // Check if notification request already exists for this query/user
    let existingNotificationCheck
    if (email) {
      existingNotificationCheck = await supabase
        .from('missing_product_notifications')
        .select('id')
        .eq('normalized_query', normalizedQuery)
        .eq('email', email)
        .single()
    }

    if (existingNotificationCheck?.data) {
      return NextResponse.json({
        success: true,
        data: {
          notification_id: existingNotificationCheck.data.id,
          message: `You're already signed up for notifications about "${trimmedQuery}"`,
          estimated_users_waiting: await this.getEstimatedWaitingUsers(normalizedQuery)
        }
      })
    }

    // Create notification request
    const { data: notificationRecord, error: insertError } = await supabase
      .from('missing_product_notifications')
      .insert({
        search_query: trimmedQuery,
        normalized_query: normalizedQuery,
        email: email,
        user_id: null, // Will be set if user is authenticated
        notification_preferences: notification_preferences || {
          email_enabled: true,
          sms_enabled: false
        },
        ip_address: request.ip || request.headers.get('x-forwarded-for'),
        user_agent: request.headers.get('user-agent')
      })
      .select('id')
      .single()

    if (insertError) {
      throw insertError
    }

    // Update missing product summary with notification interest
    await supabase
      .from('missing_product_summary')
      .upsert({
        normalized_query: normalizedQuery,
        request_count: 1,
        unique_users: 1,
        notification_interest: 1
      }, {
        onConflict: 'normalized_query',
        ignoreDuplicates: false
      })

    // Get estimated users waiting
    const estimatedWaiting = await getEstimatedWaitingUsers(normalizedQuery)

    return NextResponse.json({
      success: true,
      data: {
        notification_id: notificationRecord.id,
        message: `You'll be notified when "${trimmedQuery}" becomes available`,
        estimated_users_waiting: estimatedWaiting,
        notification_preferences: notification_preferences || { email_enabled: true }
      }
    })

  } catch (error) {
    console.error('Missing product notification API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error setting up notification',
          details: process.env.NODE_ENV === 'development' ? error : {}
        }
      },
      { status: 500 }
    )
  }
}

// Helper function to estimate users waiting
async function getEstimatedWaitingUsers(normalizedQuery: string): Promise<number> {
  try {
    const supabase = createServiceSupabase()
    const { count } = await supabase
      .from('missing_product_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('normalized_query', normalizedQuery)
      .eq('status', 'active')

    return count || 0
  } catch (error) {
    return 0
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
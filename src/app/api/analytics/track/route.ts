// Analytics Tracking API - Event Collection Endpoint
// Handles batched analytics events from the client-side analytics system

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AnalyticsEvent } from '@/lib/analytics'

interface TrackingRequest {
  events: AnalyticsEvent[]
}

export async function POST(request: NextRequest) {
  try {
    const { events }: TrackingRequest = await request.json()

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      )
    }

    // Validate and sanitize events
    const validEvents = events
      .filter(event => event.event_type && event.session_id && event.timestamp)
      .map(event => ({
        event_type: event.event_type,
        user_id: event.user_id || null,
        session_id: event.session_id,
        timestamp: event.timestamp,
        properties: event.properties || {},
        user_agent: event.user_agent || null,
        device_info: event.device_info || null,
        learning_context: event.learning_context || null,
        created_at: new Date().toISOString()
      }))

    if (validEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events to process' },
        { status: 400 }
      )
    }

    // Batch insert events into database
    const { error: insertError } = await supabaseAdmin
      .from('analytics_events')
      .insert(validEvents)

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to store events' },
        { status: 500 }
      )
    }

    // Process real-time metrics updates
    await Promise.all([
      updateUserEngagementMetrics(validEvents),
      updateContentMetrics(validEvents),
      updatePlatformMetrics(validEvents)
    ])

    return NextResponse.json({
      success: true,
      processed: validEvents.length,
      message: 'Events tracked successfully'
    })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update user engagement metrics in real-time
async function updateUserEngagementMetrics(events: AnalyticsEvent[]): Promise<void> {
  const userEvents = events.filter(e => e.user_id)
  
  for (const userId of [...new Set(userEvents.map(e => e.user_id))]) {
    const userEventsForUser = userEvents.filter(e => e.user_id === userId)
    
    // Calculate metrics from events
    const contentInteractions = userEventsForUser.filter(e => 
      e.event_type === 'content_interaction'
    ).length
    
    const quizCompletions = userEventsForUser.filter(e => 
      e.event_type === 'quiz_attempt'
    ).length
    
    const aiLessonRequests = userEventsForUser.filter(e => 
      e.event_type === 'ai_lesson_request'
    ).length

    const sessionEvents = userEventsForUser.filter(e => 
      e.event_type === 'session_start'
    ).length

    // Upsert user engagement metrics
    await supabaseAdmin
      .from('user_engagement_metrics')
      .upsert({
        user_id: userId,
        session_count: sessionEvents,
        content_interactions: contentInteractions,
        quiz_completions: quizCompletions,
        ai_lesson_requests: aiLessonRequests,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
  }
}

// Update content analytics metrics
async function updateContentMetrics(events: AnalyticsEvent[]): Promise<void> {
  const contentEvents = events.filter(e => 
    e.event_type === 'content_interaction' && e.properties?.content_id
  )

  for (const contentId of [...new Set(contentEvents.map(e => e.properties.content_id))]) {
    const contentEventsForItem = contentEvents.filter(e => 
      e.properties.content_id === contentId
    )

    const viewCount = contentEventsForItem.filter(e => 
      e.properties.action === 'view'
    ).length

    const completions = contentEventsForItem.filter(e => 
      e.properties.action === 'complete'
    ).length

    const totalTimeSpent = contentEventsForItem
      .filter(e => e.properties.time_spent)
      .reduce((sum, e) => sum + (e.properties.time_spent || 0), 0)

    const averageTimeSpent = viewCount > 0 ? totalTimeSpent / viewCount : 0
    const completionRate = viewCount > 0 ? (completions / viewCount) * 100 : 0

    // Upsert content analytics
    await supabaseAdmin
      .from('content_analytics')
      .upsert({
        content_id: contentId,
        content_type: contentEventsForItem[0]?.properties.content_type || 'unknown',
        view_count: viewCount,
        completion_rate: completionRate,
        average_time_spent: averageTimeSpent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'content_id',
        ignoreDuplicates: false
      })
  }
}

// Update platform-wide metrics
async function updatePlatformMetrics(events: AnalyticsEvent[]): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  
  const uniqueUsers = [...new Set(events.map(e => e.user_id).filter(Boolean))]
  const uniqueSessions = [...new Set(events.map(e => e.session_id))]
  
  const sessionStartEvents = events.filter(e => e.event_type === 'session_start')
  const newUserSignups = events.filter(e => 
    e.event_type === 'onboarding_step' && 
    e.properties?.step === 'onboarding_complete'
  ).length

  // Update daily platform metrics
  await supabaseAdmin
    .from('platform_metrics')
    .upsert({
      date: today,
      daily_active_users: uniqueUsers.length,
      new_user_signups: newUserSignups,
      total_sessions: uniqueSessions.length,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'date',
      ignoreDuplicates: false
    })
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
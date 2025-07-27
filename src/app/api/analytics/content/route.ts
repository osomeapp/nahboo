// Content Analytics API
// Provides detailed analytics for content performance and user engagement

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('content_id')
    const timeRange = searchParams.get('range') || '30d'
    const contentType = searchParams.get('content_type')

    // Calculate date range
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    let query = supabaseAdmin
      .from('analytics_events')
      .select('*')
      .eq('event_type', 'content_interaction')
      .gte('timestamp', startDate.toISOString())

    if (contentId) {
      query = query.eq('properties->>content_id', contentId)
    }

    if (contentType) {
      query = query.eq('properties->>content_type', contentType)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching content analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch content analytics' },
        { status: 500 }
      )
    }

    // Group events by content_id
    const contentGroups: Record<string, any[]> = {}
    events.forEach(event => {
      const cId = event.properties?.content_id
      if (cId) {
        if (!contentGroups[cId]) contentGroups[cId] = []
        contentGroups[cId].push(event)
      }
    })

    // Calculate analytics for each content item
    const contentAnalytics = Object.entries(contentGroups).map(([cId, contentEvents]) => {
      const views = contentEvents.filter(e => e.properties?.action === 'view')
      const completions = contentEvents.filter(e => e.properties?.action === 'complete')
      const likes = contentEvents.filter(e => e.properties?.action === 'like')
      const shares = contentEvents.filter(e => e.properties?.action === 'share')

      // Calculate time spent
      const timeSpentEvents = contentEvents.filter(e => e.properties?.time_spent)
      const totalTimeSpent = timeSpentEvents.reduce((sum, e) => sum + (e.properties.time_spent || 0), 0)
      const averageTimeSpent = timeSpentEvents.length > 0 ? totalTimeSpent / timeSpentEvents.length : 0

      // Calculate completion rate
      const completionRate = views.length > 0 ? (completions.length / views.length) * 100 : 0

      // Calculate engagement rate
      const engagementActions = likes.length + shares.length + completions.length
      const engagementRate = views.length > 0 ? (engagementActions / views.length) * 100 : 0

      // Calculate bounce rate (users who view but don't engage)
      const uniqueViewers = [...new Set(views.map(e => e.user_id).filter(Boolean))]
      const engagedUsers = [...new Set([
        ...likes.map(e => e.user_id),
        ...shares.map(e => e.user_id),
        ...completions.map(e => e.user_id)
      ].filter(Boolean))]
      const bounceRate = uniqueViewers.length > 0 
        ? ((uniqueViewers.length - engagedUsers.length) / uniqueViewers.length) * 100 
        : 0

      // Calculate popular times (hours of day)
      const hourlyViews: Record<string, number> = {}
      views.forEach(view => {
        const hour = new Date(view.timestamp).getHours()
        hourlyViews[hour.toString()] = (hourlyViews[hour.toString()] || 0) + 1
      })

      // Get user ratings if available
      const ratings = contentEvents
        .filter(e => e.properties?.rating)
        .map(e => e.properties.rating)

      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null

      // Device type breakdown
      const deviceBreakdown = calculateDeviceBreakdown(views)

      // User engagement patterns
      const engagementPatterns = calculateEngagementPatterns(contentEvents)

      // Content performance insights
      const insights = generateContentInsights(
        views.length,
        completionRate,
        engagementRate,
        bounceRate,
        averageTimeSpent
      )

      return {
        content_id: cId,
        content_type: contentEvents[0]?.properties?.content_type || 'unknown',
        time_range: timeRange,
        metrics: {
          view_count: views.length,
          completion_count: completions.length,
          completion_rate: Math.round(completionRate * 100) / 100,
          engagement_rate: Math.round(engagementRate * 100) / 100,
          bounce_rate: Math.round(bounceRate * 100) / 100,
          average_time_spent: Math.round(averageTimeSpent),
          total_time_spent: totalTimeSpent,
          like_count: likes.length,
          share_count: shares.length,
          unique_viewers: uniqueViewers.length,
          return_viewers: calculateReturnViewers(contentEvents)
        },
        ratings: {
          average_rating: averageRating ? Math.round(averageRating * 100) / 100 : null,
          total_ratings: ratings.length,
          rating_distribution: calculateRatingDistribution(ratings)
        },
        popular_times: hourlyViews,
        device_breakdown: deviceBreakdown,
        engagement_patterns: engagementPatterns,
        insights: insights,
        last_interaction: contentEvents[0]?.timestamp
      }
    })

    // Sort by view count descending
    contentAnalytics.sort((a, b) => b.metrics.view_count - a.metrics.view_count)

    // If specific content requested, return single item
    if (contentId && contentAnalytics.length > 0) {
      return NextResponse.json(contentAnalytics[0])
    }

    // Return summary statistics if no specific content
    const summary = {
      total_content_items: contentAnalytics.length,
      total_views: contentAnalytics.reduce((sum, c) => sum + c.metrics.view_count, 0),
      average_completion_rate: contentAnalytics.length > 0 
        ? contentAnalytics.reduce((sum, c) => sum + c.metrics.completion_rate, 0) / contentAnalytics.length 
        : 0,
      average_engagement_rate: contentAnalytics.length > 0
        ? contentAnalytics.reduce((sum, c) => sum + c.metrics.engagement_rate, 0) / contentAnalytics.length
        : 0,
      top_performing_content: contentAnalytics.slice(0, 10),
      content_type_performance: calculateContentTypePerformance(contentAnalytics)
    }

    return NextResponse.json({
      summary,
      content_analytics: contentAnalytics
    })

  } catch (error) {
    console.error('Content analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDeviceBreakdown(views: any[]): Record<string, number> {
  const deviceCounts: Record<string, number> = {
    mobile: 0,
    tablet: 0,
    desktop: 0
  }

  views.forEach(view => {
    const deviceType = view.device_info?.device_type || 'unknown'
    if (deviceCounts.hasOwnProperty(deviceType)) {
      deviceCounts[deviceType]++
    }
  })

  return deviceCounts
}

function calculateEngagementPatterns(events: any[]): {
  daily_pattern: Record<string, number>
  user_journey: string[]
  drop_off_points: string[]
} {
  // Daily engagement pattern
  const dailyPattern: Record<string, number> = {}
  events.forEach(event => {
    const date = event.timestamp.split('T')[0]
    dailyPattern[date] = (dailyPattern[date] || 0) + 1
  })

  // User journey analysis
  const userJourneys: Record<string, string[]> = {}
  events.forEach(event => {
    const userId = event.user_id || event.session_id
    if (!userJourneys[userId]) userJourneys[userId] = []
    userJourneys[userId].push(event.properties?.action || 'unknown')
  })

  // Most common journey path
  const journeyPaths = Object.values(userJourneys).map(journey => journey.join(' -> '))
  const journeyFrequency: Record<string, number> = {}
  journeyPaths.forEach(path => {
    journeyFrequency[path] = (journeyFrequency[path] || 0) + 1
  })

  const topJourney = Object.entries(journeyFrequency)
    .sort(([,a], [,b]) => b - a)[0]?.[0]?.split(' -> ') || []

  // Identify drop-off points
  const actionSequence = events
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(e => e.properties?.action)
    .filter(Boolean)

  const dropOffPoints: string[] = []
  for (let i = 0; i < actionSequence.length - 1; i++) {
    const current = actionSequence[i]
    const next = actionSequence[i + 1]
    if (current === 'view' && next !== 'engage' && next !== 'complete') {
      dropOffPoints.push(`After ${current}`)
    }
  }

  return {
    daily_pattern: dailyPattern,
    user_journey: topJourney,
    drop_off_points: [...new Set(dropOffPoints)]
  }
}

function calculateReturnViewers(events: any[]): number {
  const userViews: Record<string, number> = {}
  
  events
    .filter(e => e.properties?.action === 'view' && e.user_id)
    .forEach(event => {
      userViews[event.user_id] = (userViews[event.user_id] || 0) + 1
    })

  return Object.values(userViews).filter(count => count > 1).length
}

function calculateRatingDistribution(ratings: number[]): Record<string, number> {
  const distribution: Record<string, number> = {
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
  }

  ratings.forEach(rating => {
    const roundedRating = Math.round(rating).toString()
    if (distribution.hasOwnProperty(roundedRating)) {
      distribution[roundedRating]++
    }
  })

  return distribution
}

function calculateContentTypePerformance(contentAnalytics: any[]): Record<string, {
  count: number
  averageViews: number
  averageCompletionRate: number
  averageEngagementRate: number
}> {
  const typePerformance: Record<string, any> = {}

  contentAnalytics.forEach(content => {
    const type = content.content_type
    if (!typePerformance[type]) {
      typePerformance[type] = {
        items: [],
        totalViews: 0,
        totalCompletionRate: 0,
        totalEngagementRate: 0
      }
    }

    typePerformance[type].items.push(content)
    typePerformance[type].totalViews += content.metrics.view_count
    typePerformance[type].totalCompletionRate += content.metrics.completion_rate
    typePerformance[type].totalEngagementRate += content.metrics.engagement_rate
  })

  // Calculate averages
  const result: Record<string, any> = {}
  Object.entries(typePerformance).forEach(([type, data]) => {
    const count = data.items.length
    result[type] = {
      count,
      averageViews: Math.round(data.totalViews / count),
      averageCompletionRate: Math.round((data.totalCompletionRate / count) * 100) / 100,
      averageEngagementRate: Math.round((data.totalEngagementRate / count) * 100) / 100
    }
  })

  return result
}

function generateContentInsights(
  viewCount: number,
  completionRate: number,
  engagementRate: number,
  bounceRate: number,
  averageTimeSpent: number
): string[] {
  const insights: string[] = []

  if (viewCount >= 1000) {
    insights.push("High-performing content with excellent reach")
  } else if (viewCount >= 100) {
    insights.push("Good content performance with solid viewership")
  } else if (viewCount < 10) {
    insights.push("Low visibility - consider promotion or content optimization")
  }

  if (completionRate >= 80) {
    insights.push("Excellent completion rate - highly engaging content")
  } else if (completionRate >= 60) {
    insights.push("Good completion rate with room for improvement")
  } else if (completionRate < 30) {
    insights.push("Low completion rate - content may be too long or complex")
  }

  if (bounceRate >= 70) {
    insights.push("High bounce rate - improve content hook or relevance")
  } else if (bounceRate <= 30) {
    insights.push("Low bounce rate - content successfully retains viewers")
  }

  if (averageTimeSpent >= 300) { // 5 minutes
    insights.push("High engagement time - content holds attention well")
  } else if (averageTimeSpent < 60) { // 1 minute
    insights.push("Low engagement time - consider more compelling content")
  }

  if (engagementRate >= 50) {
    insights.push("Highly interactive content with strong user engagement")
  } else if (engagementRate < 10) {
    insights.push("Low engagement - add interactive elements or calls-to-action")
  }

  return insights
}
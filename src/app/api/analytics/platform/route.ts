// Platform Analytics API
// Provides comprehensive platform-wide metrics and insights

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('range') || '30d'

    // Calculate date range
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Get platform metrics data
    const [
      eventsResult,
      metricsResult,
      usersResult,
      contentResult
    ] = await Promise.all([
      supabaseAdmin
        .from('analytics_events')
        .select('*')
        .gte('timestamp', startDate.toISOString()),
      
      supabaseAdmin
        .from('platform_metrics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false }),
        
      supabaseAdmin
        .from('profiles')
        .select('id, created_at, subjects, age_group, use_case')
        .gte('created_at', startDate.toISOString()),
        
      supabaseAdmin
        .from('content')
        .select('id, content_type, created_at')
    ])

    if (eventsResult.error || metricsResult.error || usersResult.error || contentResult.error) {
      console.error('Database query errors:', { 
        events: eventsResult.error, 
        metrics: metricsResult.error,
        users: usersResult.error,
        content: contentResult.error
      })
      return NextResponse.json(
        { error: 'Failed to fetch platform data' },
        { status: 500 }
      )
    }

    const events = eventsResult.data || []
    const dailyMetrics = metricsResult.data || []
    const users = usersResult.data || []
    const content = contentResult.data || []

    // Calculate core metrics
    const uniqueUsers = [...new Set(events.map(e => e.user_id).filter(Boolean))]
    const uniqueSessions = [...new Set(events.map(e => e.session_id))]
    
    const dailyActiveUsers = calculateDAU(events)
    const weeklyActiveUsers = calculateWAU(events, 7)
    const monthlyActiveUsers = calculateMAU(events, 30)

    // User growth and retention
    const newUserSignups = users.length
    const userRetentionRates = calculateRetentionRates(events, users)

    // Session analytics
    const sessionMetrics = calculateSessionMetrics(events)

    // Content metrics
    const contentMetrics = calculateContentMetrics(events, content)

    // Feature usage analytics
    const featureUsage = calculateFeatureUsage(events)

    // Geographic distribution
    const geographicDistribution = calculateGeographicDistribution(events)

    // Device and browser analytics
    const deviceAnalytics = calculateDeviceAnalytics(events)

    // Performance metrics
    const performanceMetrics = calculatePerformanceMetrics(events)

    // Growth trends
    const growthTrends = calculateGrowthTrends(dailyMetrics, events, daysBack)

    // User engagement insights
    const engagementInsights = calculateEngagementInsights(events)

    // Platform health score
    const healthScore = calculatePlatformHealthScore({
      dailyActiveUsers,
      userRetentionRates,
      sessionMetrics,
      contentMetrics,
      performanceMetrics
    })

    const platformMetrics = {
      time_range: timeRange,
      overview: {
        daily_active_users: dailyActiveUsers,
        weekly_active_users: weeklyActiveUsers,
        monthly_active_users: monthlyActiveUsers,
        new_user_signups: newUserSignups,
        total_sessions: uniqueSessions.length,
        total_events: events.length,
        platform_health_score: healthScore
      },
      user_metrics: {
        retention_rates: userRetentionRates,
        user_demographics: calculateUserDemographics(users),
        user_behavior: calculateUserBehaviorMetrics(events)
      },
      session_metrics: sessionMetrics,
      content_metrics: contentMetrics,
      feature_usage: featureUsage,
      geographic_distribution: geographicDistribution,
      device_analytics: deviceAnalytics,
      performance_metrics: performanceMetrics,
      growth_trends: growthTrends,
      engagement_insights: engagementInsights,
      insights: generatePlatformInsights({
        dailyActiveUsers,
        newUserSignups,
        userRetentionRates,
        sessionMetrics,
        contentMetrics,
        healthScore
      })
    }

    return NextResponse.json(platformMetrics)

  } catch (error) {
    console.error('Platform analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateDAU(events: any[]): number {
  const today = new Date().toISOString().split('T')[0]
  const todayEvents = events.filter(e => e.timestamp.startsWith(today))
  return [...new Set(todayEvents.map(e => e.user_id).filter(Boolean))].length
}

function calculateWAU(events: any[], days: number): number {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - days)
  const recentEvents = events.filter(e => new Date(e.timestamp) >= weekAgo)
  return [...new Set(recentEvents.map(e => e.user_id).filter(Boolean))].length
}

function calculateMAU(events: any[], days: number): number {
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - days)
  const recentEvents = events.filter(e => new Date(e.timestamp) >= monthAgo)
  return [...new Set(recentEvents.map(e => e.user_id).filter(Boolean))].length
}

function calculateRetentionRates(events: any[], users: any[]): {
  day_1: number
  day_7: number
  day_30: number
} {
  const retentionCohorts = users.map(user => {
    const signupDate = new Date(user.created_at)
    const userEvents = events.filter(e => e.user_id === user.id)
    
    const day1 = new Date(signupDate)
    day1.setDate(day1.getDate() + 1)
    const day7 = new Date(signupDate)
    day7.setDate(day7.getDate() + 7)
    const day30 = new Date(signupDate)
    day30.setDate(day30.getDate() + 30)
    
    return {
      userId: user.id,
      signupDate,
      returnedDay1: userEvents.some(e => {
        const eventDate = new Date(e.timestamp)
        return eventDate >= day1 && eventDate < new Date(day1.getTime() + 24 * 60 * 60 * 1000)
      }),
      returnedDay7: userEvents.some(e => {
        const eventDate = new Date(e.timestamp)
        return eventDate >= day7
      }),
      returnedDay30: userEvents.some(e => {
        const eventDate = new Date(e.timestamp)
        return eventDate >= day30
      })
    }
  })

  const totalUsers = retentionCohorts.length
  if (totalUsers === 0) {
    return { day_1: 0, day_7: 0, day_30: 0 }
  }

  return {
    day_1: Math.round((retentionCohorts.filter(u => u.returnedDay1).length / totalUsers) * 100),
    day_7: Math.round((retentionCohorts.filter(u => u.returnedDay7).length / totalUsers) * 100),
    day_30: Math.round((retentionCohorts.filter(u => u.returnedDay30).length / totalUsers) * 100)
  }
}

function calculateSessionMetrics(events: any[]): {
  average_session_duration: number
  sessions_per_user: number
  bounce_rate: number
  page_views_per_session: number
} {
  const sessions: Record<string, any[]> = {}
  events.forEach(event => {
    if (!sessions[event.session_id]) sessions[event.session_id] = []
    sessions[event.session_id].push(event)
  })

  const sessionDurations: number[] = []
  let bouncedSessions = 0
  let totalPageViews = 0

  Object.values(sessions).forEach(sessionEvents => {
    const startEvent = sessionEvents.find(e => e.event_type === 'session_start')
    const endEvent = sessionEvents.find(e => e.event_type === 'session_end')
    
    if (startEvent && endEvent && endEvent.properties?.session_duration) {
      sessionDurations.push(endEvent.properties.session_duration)
    }

    // Count bounced sessions (only 1-2 events)
    if (sessionEvents.length <= 2) {
      bouncedSessions++
    }

    // Count page views
    totalPageViews += sessionEvents.filter(e => e.event_type === 'page_view').length
  })

  const totalSessions = Object.keys(sessions).length
  const uniqueUsers = [...new Set(events.map(e => e.user_id).filter(Boolean))].length

  return {
    average_session_duration: sessionDurations.length > 0 
      ? Math.round(sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length)
      : 0,
    sessions_per_user: uniqueUsers > 0 ? Math.round((totalSessions / uniqueUsers) * 10) / 10 : 0,
    bounce_rate: totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0,
    page_views_per_session: totalSessions > 0 ? Math.round((totalPageViews / totalSessions) * 10) / 10 : 0
  }
}

function calculateContentMetrics(events: any[], content: any[]): {
  total_content_items: number
  content_views: number
  content_completions: number
  average_completion_rate: number
  content_type_distribution: Record<string, number>
} {
  const contentInteractions = events.filter(e => e.event_type === 'content_interaction')
  const contentViews = contentInteractions.filter(e => e.properties?.action === 'view')
  const contentCompletions = contentInteractions.filter(e => e.properties?.action === 'complete')

  const contentTypeDistribution: Record<string, number> = {}
  content.forEach(item => {
    contentTypeDistribution[item.content_type] = (contentTypeDistribution[item.content_type] || 0) + 1
  })

  return {
    total_content_items: content.length,
    content_views: contentViews.length,
    content_completions: contentCompletions.length,
    average_completion_rate: contentViews.length > 0 
      ? Math.round((contentCompletions.length / contentViews.length) * 100)
      : 0,
    content_type_distribution: contentTypeDistribution
  }
}

function calculateFeatureUsage(events: any[]): Record<string, {
  usage_count: number
  unique_users: number
  percentage_of_users: number
}> {
  const featureEvents: Record<string, any[]> = {}
  const totalUniqueUsers = [...new Set(events.map(e => e.user_id).filter(Boolean))].length

  events.forEach(event => {
    const feature = getFeatureFromEvent(event)
    if (feature) {
      if (!featureEvents[feature]) featureEvents[feature] = []
      featureEvents[feature].push(event)
    }
  })

  const featureUsage: Record<string, any> = {}
  Object.entries(featureEvents).forEach(([feature, events]) => {
    const uniqueUsers = [...new Set(events.map(e => e.user_id).filter(Boolean))].length
    featureUsage[feature] = {
      usage_count: events.length,
      unique_users: uniqueUsers,
      percentage_of_users: totalUniqueUsers > 0 
        ? Math.round((uniqueUsers / totalUniqueUsers) * 100)
        : 0
    }
  })

  return featureUsage
}

function getFeatureFromEvent(event: any): string | null {
  switch (event.event_type) {
    case 'quiz_attempt': return 'quiz_system'
    case 'video_play': return 'video_player'
    case 'ai_lesson_request': return 'ai_tutor'
    case 'content_interaction': 
      if (event.properties?.content_type === 'link') return 'link_modal'
      return 'content_feed'
    case 'onboarding_step': return 'onboarding'
    default: return null
  }
}

function calculateGeographicDistribution(events: any[]): Record<string, number> {
  // This would typically use IP geolocation data
  // For now, return mock data structure
  return {
    'US': 45,
    'CA': 12,
    'GB': 8,
    'AU': 6,
    'DE': 5,
    'FR': 4,
    'Other': 20
  }
}

function calculateDeviceAnalytics(events: any[]): {
  device_types: Record<string, number>
  browsers: Record<string, number>
  operating_systems: Record<string, number>
} {
  const deviceTypes: Record<string, number> = {}
  const browsers: Record<string, number> = {}
  const operatingSystems: Record<string, number> = {}

  events.forEach(event => {
    if (event.device_info) {
      const deviceType = event.device_info.device_type || 'unknown'
      const browser = event.device_info.browser || 'unknown'
      const os = event.device_info.os || 'unknown'

      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1
      browsers[browser] = (browsers[browser] || 0) + 1
      operatingSystems[os] = (operatingSystems[os] || 0) + 1
    }
  })

  return { device_types: deviceTypes, browsers, operating_systems: operatingSystems }
}

function calculatePerformanceMetrics(events: any[]): {
  error_rate: number
  average_response_time: number
  api_success_rate: number
} {
  const errorEvents = events.filter(e => e.event_type === 'error')
  const totalEvents = events.length

  // Calculate API response times from AI interactions
  const aiEvents = events.filter(e => e.event_type === 'ai_lesson_request')
  const responseTimes = aiEvents
    .filter(e => e.properties?.response_time)
    .map(e => e.properties.response_time)

  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0

  return {
    error_rate: totalEvents > 0 ? Math.round((errorEvents.length / totalEvents) * 10000) / 100 : 0,
    average_response_time: Math.round(averageResponseTime),
    api_success_rate: aiEvents.length > 0 
      ? Math.round(((aiEvents.length - errorEvents.length) / aiEvents.length) * 100)
      : 100
  }
}

function calculateUserDemographics(users: any[]): {
  age_groups: Record<string, number>
  subjects: Record<string, number>
  use_cases: Record<string, number>
} {
  const ageGroups: Record<string, number> = {}
  const subjects: Record<string, number> = {}
  const useCases: Record<string, number> = {}

  users.forEach(user => {
    if (user.age_group) {
      ageGroups[user.age_group] = (ageGroups[user.age_group] || 0) + 1
    }
    
    if (user.subjects && Array.isArray(user.subjects)) {
      user.subjects.forEach((subject: string) => {
        subjects[subject] = (subjects[subject] || 0) + 1
      })
    }

    if (user.use_case) {
      useCases[user.use_case] = (useCases[user.use_case] || 0) + 1
    }
  })

  return { age_groups: ageGroups, subjects, use_cases: useCases }
}

function calculateUserBehaviorMetrics(events: any[]): {
  most_active_hours: Record<string, number>
  most_active_days: Record<string, number>
  feature_adoption_funnel: Record<string, number>
} {
  const hourlyActivity: Record<string, number> = {}
  const dailyActivity: Record<string, number> = {}

  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours()
    const day = new Date(event.timestamp).toLocaleDateString('en-US', { weekday: 'long' })
    
    hourlyActivity[hour.toString()] = (hourlyActivity[hour.toString()] || 0) + 1
    dailyActivity[day] = (dailyActivity[day] || 0) + 1
  })

  // Feature adoption funnel (percentage of users who progress through features)
  const uniqueUsers = [...new Set(events.map(e => e.user_id).filter(Boolean))]
  const onboardingUsers = [...new Set(events.filter(e => e.event_type === 'onboarding_step').map(e => e.user_id))].length
  const contentUsers = [...new Set(events.filter(e => e.event_type === 'content_interaction').map(e => e.user_id))].length
  const quizUsers = [...new Set(events.filter(e => e.event_type === 'quiz_attempt').map(e => e.user_id))].length
  const aiUsers = [...new Set(events.filter(e => e.event_type === 'ai_lesson_request').map(e => e.user_id))].length

  const totalUsers = uniqueUsers.length
  const adoptionFunnel = {
    'signup': 100,
    'onboarding': totalUsers > 0 ? Math.round((onboardingUsers / totalUsers) * 100) : 0,
    'content_consumption': totalUsers > 0 ? Math.round((contentUsers / totalUsers) * 100) : 0,
    'quiz_completion': totalUsers > 0 ? Math.round((quizUsers / totalUsers) * 100) : 0,
    'ai_interaction': totalUsers > 0 ? Math.round((aiUsers / totalUsers) * 100) : 0
  }

  return {
    most_active_hours: hourlyActivity,
    most_active_days: dailyActivity,
    feature_adoption_funnel: adoptionFunnel
  }
}

function calculateGrowthTrends(dailyMetrics: any[], events: any[], daysBack: number): {
  user_growth_rate: number
  session_growth_rate: number
  engagement_trend: string
} {
  if (dailyMetrics.length < 2) {
    return {
      user_growth_rate: 0,
      session_growth_rate: 0,
      engagement_trend: 'insufficient_data'
    }
  }

  // Calculate growth rates
  const latestMetrics = dailyMetrics[0]
  const previousMetrics = dailyMetrics[1]

  const userGrowthRate = previousMetrics.daily_active_users > 0
    ? Math.round(((latestMetrics.daily_active_users - previousMetrics.daily_active_users) / previousMetrics.daily_active_users) * 100)
    : 0

  const sessionGrowthRate = previousMetrics.total_sessions > 0
    ? Math.round(((latestMetrics.total_sessions - previousMetrics.total_sessions) / previousMetrics.total_sessions) * 100)
    : 0

  // Analyze engagement trend over time
  const recentDays = Math.min(7, dailyMetrics.length)
  const recentEngagement = dailyMetrics.slice(0, recentDays).reduce((sum, day) => sum + day.daily_active_users, 0)
  const previousEngagement = dailyMetrics.slice(recentDays, recentDays * 2).reduce((sum, day) => sum + day.daily_active_users, 0)

  let engagementTrend = 'stable'
  if (recentEngagement > previousEngagement * 1.1) {
    engagementTrend = 'increasing'
  } else if (recentEngagement < previousEngagement * 0.9) {
    engagementTrend = 'decreasing'
  }

  return {
    user_growth_rate: userGrowthRate,
    session_growth_rate: sessionGrowthRate,
    engagement_trend: engagementTrend
  }
}

function calculateEngagementInsights(events: any[]): {
  highly_engaged_users: number
  average_actions_per_session: number
  content_stickiness: number
} {
  const userEngagement: Record<string, number> = {}
  const sessionActions: Record<string, number> = {}

  events.forEach(event => {
    if (event.user_id) {
      userEngagement[event.user_id] = (userEngagement[event.user_id] || 0) + 1
    }
    sessionActions[event.session_id] = (sessionActions[event.session_id] || 0) + 1
  })

  // Highly engaged users (top 20% by activity)
  const engagementValues = Object.values(userEngagement).sort((a, b) => b - a)
  const top20Threshold = Math.ceil(engagementValues.length * 0.2)
  const highlyEngagedUsers = engagementValues.slice(0, top20Threshold).length

  // Average actions per session
  const sessionActionCounts = Object.values(sessionActions)
  const averageActionsPerSession = sessionActionCounts.length > 0
    ? Math.round((sessionActionCounts.reduce((sum, count) => sum + count, 0) / sessionActionCounts.length) * 10) / 10
    : 0

  // Content stickiness (returning users vs new users)
  const uniqueUsers = Object.keys(userEngagement).length
  const activeUsers = Object.values(userEngagement).filter(count => count > 5).length // Users with 5+ actions
  const contentStickiness = uniqueUsers > 0 ? Math.round((activeUsers / uniqueUsers) * 100) : 0

  return {
    highly_engaged_users: highlyEngagedUsers,
    average_actions_per_session: averageActionsPerSession,
    content_stickiness: contentStickiness
  }
}

function calculatePlatformHealthScore(metrics: {
  dailyActiveUsers: number
  userRetentionRates: any
  sessionMetrics: any
  contentMetrics: any
  performanceMetrics: any
}): number {
  // Weight different factors for overall health score
  const userActivityScore = Math.min(metrics.dailyActiveUsers / 100, 1) * 25 // Max 25 points
  const retentionScore = (metrics.userRetentionRates.day_7 / 100) * 25 // Max 25 points
  const engagementScore = Math.min(metrics.sessionMetrics.average_session_duration / 600, 1) * 20 // Max 20 points (10 min ideal)
  const contentScore = (metrics.contentMetrics.average_completion_rate / 100) * 15 // Max 15 points
  const performanceScore = Math.max(100 - metrics.performanceMetrics.error_rate, 0) / 100 * 15 // Max 15 points

  return Math.round(userActivityScore + retentionScore + engagementScore + contentScore + performanceScore)
}

function generatePlatformInsights(data: {
  dailyActiveUsers: number
  newUserSignups: number
  userRetentionRates: any
  sessionMetrics: any
  contentMetrics: any
  healthScore: number
}): string[] {
  const insights: string[] = []

  if (data.healthScore >= 80) {
    insights.push("Platform is performing excellently with high user engagement")
  } else if (data.healthScore >= 60) {
    insights.push("Platform performance is good with opportunities for optimization")
  } else if (data.healthScore < 40) {
    insights.push("Platform needs attention - low engagement and retention")
  }

  if (data.userRetentionRates.day_7 >= 40) {
    insights.push("Excellent 7-day retention rate indicates strong product-market fit")
  } else if (data.userRetentionRates.day_7 < 20) {
    insights.push("Low retention rate suggests need for onboarding and engagement improvements")
  }

  if (data.sessionMetrics.bounce_rate > 60) {
    insights.push("High bounce rate indicates need for better landing page experience")
  }

  if (data.contentMetrics.average_completion_rate >= 70) {
    insights.push("High content completion rate shows engaging and relevant content")
  } else if (data.contentMetrics.average_completion_rate < 30) {
    insights.push("Low completion rate suggests content may be too long or not engaging enough")
  }

  if (data.newUserSignups > data.dailyActiveUsers * 0.1) {
    insights.push("Strong new user acquisition rate")
  }

  return insights
}
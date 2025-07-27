// User Engagement Analytics API
// Provides detailed user engagement metrics and insights

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { calculateEngagementScore, getEngagementLevel } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const timeRange = searchParams.get('range') || '30d'

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    // Calculate date range
    const daysBack = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Get user engagement metrics
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('user_engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (metricsError && metricsError.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching user metrics:', metricsError)
      return NextResponse.json(
        { error: 'Failed to fetch user metrics' },
        { status: 500 }
      )
    }

    // Get detailed analytics from events
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })

    if (eventsError) {
      console.error('Error fetching user events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch user events' },
        { status: 500 }
      )
    }

    // Calculate session metrics
    const sessions = [...new Set(events.map(e => e.session_id))]
    const sessionStartEvents = events.filter(e => e.event_type === 'session_start')
    const sessionEndEvents = events.filter(e => e.event_type === 'session_end')
    
    let totalSessionTime = 0
    sessionEndEvents.forEach(endEvent => {
      if (endEvent.properties?.session_duration) {
        totalSessionTime += endEvent.properties.session_duration
      }
    })

    // Calculate content interaction metrics
    const contentInteractions = events.filter(e => e.event_type === 'content_interaction')
    const videoInteractions = events.filter(e => e.event_type === 'video_play')
    const quizAttempts = events.filter(e => e.event_type === 'quiz_attempt')
    const aiInteractions = events.filter(e => e.event_type === 'ai_lesson_request')

    // Calculate learning streak
    const learningDays = [...new Set(events.map(e => e.timestamp.split('T')[0]))]
    const learningStreak = calculateLearningStreak(learningDays)

    // Calculate engagement score
    const engagementMetrics = {
      sessionCount: sessions.length,
      totalTimeSpent: totalSessionTime,
      contentInteractions: contentInteractions.length,
      quizCompletions: quizAttempts.filter(q => q.properties?.completion_rate === 100).length
    }

    const engagementScore = calculateEngagementScore(engagementMetrics)
    const engagementLevel = getEngagementLevel(engagementScore)

    // Get subject performance
    const subjectPerformance = calculateSubjectPerformance(quizAttempts)

    // Calculate learning velocity (content consumed per session)
    const learningVelocity = sessions.length > 0 
      ? Math.round(contentInteractions.length / sessions.length * 10) / 10 
      : 0

    // Get daily activity pattern
    const dailyActivity = calculateDailyActivity(events, daysBack)

    // Get content type preferences
    const contentTypePreferences = calculateContentTypePreferences(contentInteractions)

    const userEngagement = {
      user_id: userId,
      time_range: timeRange,
      session_count: sessions.length,
      total_time_spent: totalSessionTime,
      average_session_duration: sessions.length > 0 ? Math.round(totalSessionTime / sessions.length) : 0,
      content_interactions: contentInteractions.length,
      video_interactions: videoInteractions.length,
      quiz_completions: quizAttempts.length,
      ai_lesson_requests: aiInteractions.length,
      learning_streak: learningStreak,
      last_active: metrics?.last_active || events[0]?.timestamp,
      engagement_score: engagementScore,
      engagement_level: engagementLevel,
      learning_velocity: learningVelocity,
      subject_performance: subjectPerformance,
      daily_activity: dailyActivity,
      content_preferences: contentTypePreferences,
      insights: generateUserInsights(engagementScore, learningStreak, subjectPerformance, learningVelocity)
    }

    return NextResponse.json(userEngagement)

  } catch (error) {
    console.error('User engagement analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateLearningStreak(learningDays: string[]): number {
  if (learningDays.length === 0) return 0

  learningDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  
  let streak = 1
  const today = new Date().toISOString().split('T')[0]
  
  // Check if user was active today or yesterday
  if (learningDays[0] !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (learningDays[0] !== yesterday.toISOString().split('T')[0]) {
      return 0 // Streak broken
    }
  }

  // Count consecutive days
  for (let i = 1; i < learningDays.length; i++) {
    const currentDate = new Date(learningDays[i-1])
    const nextDate = new Date(learningDays[i])
    const dayDiff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 3600 * 24))
    
    if (dayDiff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function calculateSubjectPerformance(quizAttempts: any[]): Record<string, {
  attempts: number
  averageScore: number
  improvement: number
}> {
  const subjects: Record<string, any[]> = {}
  
  quizAttempts.forEach(attempt => {
    const subject = attempt.learning_context?.subject || 'unknown'
    if (!subjects[subject]) subjects[subject] = []
    subjects[subject].push(attempt)
  })

  const performance: Record<string, any> = {}
  
  Object.entries(subjects).forEach(([subject, attempts]) => {
    const scores = attempts.map(a => a.properties?.score_percentage || 0)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    
    // Calculate improvement (first half vs second half of attempts)
    let improvement = 0
    if (scores.length >= 4) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
      const secondHalf = scores.slice(Math.floor(scores.length / 2))
      const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
      improvement = secondAvg - firstAvg
    }

    performance[subject] = {
      attempts: attempts.length,
      averageScore: Math.round(averageScore),
      improvement: Math.round(improvement)
    }
  })

  return performance
}

function calculateDailyActivity(events: any[], daysBack: number): Record<string, number> {
  const dailyActivity: Record<string, number> = {}
  
  for (let i = 0; i < daysBack; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dailyActivity[dateStr] = 0
  }

  events.forEach(event => {
    const date = event.timestamp.split('T')[0]
    if (dailyActivity.hasOwnProperty(date)) {
      dailyActivity[date]++
    }
  })

  return dailyActivity
}

function calculateContentTypePreferences(interactions: any[]): Record<string, number> {
  const preferences: Record<string, number> = {}
  
  interactions.forEach(interaction => {
    const contentType = interaction.properties?.content_type || 'unknown'
    preferences[contentType] = (preferences[contentType] || 0) + 1
  })

  return preferences
}

function generateUserInsights(
  engagementScore: number, 
  learningStreak: number, 
  subjectPerformance: Record<string, any>,
  learningVelocity: number
): string[] {
  const insights: string[] = []

  if (engagementScore >= 80) {
    insights.push("Highly engaged learner with consistent activity")
  } else if (engagementScore >= 60) {
    insights.push("Good engagement level with room for improvement")
  } else if (engagementScore >= 40) {
    insights.push("Moderate engagement - consider more interactive content")
  } else {
    insights.push("Low engagement - needs motivation and support")
  }

  if (learningStreak >= 7) {
    insights.push(`Excellent ${learningStreak}-day learning streak!`)
  } else if (learningStreak >= 3) {
    insights.push(`Good ${learningStreak}-day learning streak`)
  } else if (learningStreak === 0) {
    insights.push("No current learning streak - encourage daily practice")
  }

  const subjects = Object.entries(subjectPerformance)
  if (subjects.length > 0) {
    const bestSubject = subjects.reduce((best, [subject, perf]) => 
      perf.averageScore > (best[1]?.averageScore || 0) ? [subject, perf] : best
    )
    insights.push(`Strongest performance in ${bestSubject[0]} (${bestSubject[1].averageScore}% average)`)
  }

  if (learningVelocity >= 5) {
    insights.push("High learning velocity - consuming content efficiently")
  } else if (learningVelocity < 2) {
    insights.push("Low learning velocity - consider bite-sized content")
  }

  return insights
}
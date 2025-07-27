// Learning Insights API
// Provides personalized learning insights and recommendations using AI analysis

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    // Get user profile and learning context
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Get user's learning analytics data
    const [userEventsResult, engagementResult, progressResult] = await Promise.all([
      supabaseAdmin
        .from('analytics_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false }),
      
      supabaseAdmin
        .from('user_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .single(),
        
      supabaseAdmin
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
    ])

    const events = userEventsResult.data || []
    const engagement = engagementResult.data
    const progress = progressResult.data || []

    // Analyze learning patterns
    const learningPatterns = analyzeLearningPatterns(events, profile)
    
    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(events, progress)
    
    // Generate AI-powered insights
    const aiInsights = await generateAIInsights(profile, events, engagement, performanceMetrics)
    
    // Create personalized recommendations
    const recommendations = generateRecommendations(learningPatterns, performanceMetrics, profile)
    
    // Calculate learning velocity and trends
    const learningVelocity = calculateLearningVelocity(events)
    
    // Identify strengths and improvement areas
    const strengthsAndWeaknesses = identifyStrengthsAndWeaknesses(performanceMetrics, events)
    
    // Generate engagement trend analysis
    const engagementTrends = analyzeEngagementTrends(events)

    const insights = {
      user_id: userId,
      generated_at: new Date().toISOString(),
      
      // Core insights
      strengths: strengthsAndWeaknesses.strengths,
      improvement_areas: strengthsAndWeaknesses.improvementAreas,
      recommended_content: recommendations.content,
      learning_velocity: learningVelocity.velocity,
      engagement_trends: engagementTrends,
      
      // Detailed analytics
      learning_patterns: learningPatterns,
      performance_metrics: performanceMetrics,
      ai_insights: aiInsights,
      
      // Actionable recommendations
      recommendations: {
        immediate_actions: recommendations.immediateActions,
        learning_path_adjustments: recommendations.pathAdjustments,
        study_schedule_suggestions: recommendations.scheduleOptimization,
        content_preferences: recommendations.contentTypes
      },
      
      // Predictive insights
      predictions: {
        next_milestone_eta: predictNextMilestone(learningVelocity, progress),
        optimal_study_times: learningPatterns.optimalTimes,
        success_probability: calculateSuccessProbability(performanceMetrics, engagement),
        recommended_difficulty: recommendOptimalDifficulty(performanceMetrics)
      }
    }

    return NextResponse.json(insights)

  } catch (error) {
    console.error('Learning insights error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function analyzeLearningPatterns(events: any[], profile: any): {
  studyHabits: any
  preferredContentTypes: Record<string, number>
  optimalTimes: string[]
  sessionLengthPreference: string
  learningStyle: string
} {
  // Analyze study habits from session data
  const sessions: Record<string, any[]> = {}
  events.forEach(event => {
    if (!sessions[event.session_id]) sessions[event.session_id] = []
    sessions[event.session_id].push(event)
  })

  const sessionLengths = Object.values(sessions).map(sessionEvents => {
    const startTime = Math.min(...sessionEvents.map(e => new Date(e.timestamp).getTime()))
    const endTime = Math.max(...sessionEvents.map(e => new Date(e.timestamp).getTime()))
    return (endTime - startTime) / 1000 / 60 // minutes
  })

  const avgSessionLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length || 0

  // Analyze preferred content types
  const contentTypeFreq: Record<string, number> = {}
  events.filter(e => e.event_type === 'content_interaction').forEach(event => {
    const type = event.properties?.content_type || 'unknown'
    contentTypeFreq[type] = (contentTypeFreq[type] || 0) + 1
  })

  // Find optimal learning times
  const hourlyActivity: Record<number, number> = {}
  events.forEach(event => {
    const hour = new Date(event.timestamp).getHours()
    hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
  })

  const topHours = Object.entries(hourlyActivity)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => {
      const h = parseInt(hour)
      const period = h >= 12 ? 'PM' : 'AM'
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
      return `${displayHour}:00 ${period}`
    })

  // Determine learning style based on interaction patterns
  const videoInteractions = events.filter(e => e.event_type === 'video_play').length
  const quizAttempts = events.filter(e => e.event_type === 'quiz_attempt').length
  const aiInteractions = events.filter(e => e.event_type === 'ai_lesson_request').length
  const textContent = events.filter(e => 
    e.event_type === 'content_interaction' && 
    e.properties?.content_type === 'text'
  ).length

  let learningStyle = 'balanced'
  if (videoInteractions > quizAttempts && videoInteractions > textContent) {
    learningStyle = 'visual'
  } else if (quizAttempts > videoInteractions && quizAttempts > textContent) {
    learningStyle = 'interactive'
  } else if (aiInteractions > videoInteractions && aiInteractions > quizAttempts) {
    learningStyle = 'conversational'
  } else if (textContent > videoInteractions && textContent > quizAttempts) {
    learningStyle = 'reading'
  }

  return {
    studyHabits: {
      averageSessionLength: Math.round(avgSessionLength),
      totalSessions: Object.keys(sessions).length,
      consistencyScore: calculateConsistencyScore(events)
    },
    preferredContentTypes: contentTypeFreq,
    optimalTimes: topHours,
    sessionLengthPreference: avgSessionLength > 30 ? 'long' : avgSessionLength > 15 ? 'medium' : 'short',
    learningStyle
  }
}

function calculatePerformanceMetrics(events: any[], progress: any[]): {
  overallScore: number
  subjectScores: Record<string, number>
  improvementRate: number
  consistencyScore: number
  challengeHandling: string
} {
  const quizAttempts = events.filter(e => e.event_type === 'quiz_attempt')
  
  if (quizAttempts.length === 0) {
    return {
      overallScore: 0,
      subjectScores: {},
      improvementRate: 0,
      consistencyScore: 0,
      challengeHandling: 'insufficient_data'
    }
  }

  // Calculate overall performance
  const scores = quizAttempts.map(q => q.properties?.score_percentage || 0)
  const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  // Subject-specific performance
  const subjectScores: Record<string, number[]> = {}
  quizAttempts.forEach(attempt => {
    const subject = attempt.learning_context?.subject || 'general'
    if (!subjectScores[subject]) subjectScores[subject] = []
    subjectScores[subject].push(attempt.properties?.score_percentage || 0)
  })

  const avgSubjectScores: Record<string, number> = {}
  Object.entries(subjectScores).forEach(([subject, scores]) => {
    avgSubjectScores[subject] = scores.reduce((sum, score) => sum + score, 0) / scores.length
  })

  // Calculate improvement rate
  let improvementRate = 0
  if (scores.length >= 5) {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
    improvementRate = secondAvg - firstAvg
  }

  // Consistency score (lower variance = higher consistency)
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - overallScore, 2), 0) / scores.length
  const consistencyScore = Math.max(0, 100 - Math.sqrt(variance))

  // Challenge handling assessment
  const difficultQuizzes = quizAttempts.filter(q => (q.properties?.score_percentage || 0) < 60)
  const challengeHandling = difficultQuizzes.length / quizAttempts.length > 0.5 ? 'struggles' : 
                           difficultQuizzes.length / quizAttempts.length > 0.3 ? 'moderate' : 'excellent'

  return {
    overallScore: Math.round(overallScore),
    subjectScores: Object.fromEntries(
      Object.entries(avgSubjectScores).map(([k, v]) => [k, Math.round(v)])
    ),
    improvementRate: Math.round(improvementRate),
    consistencyScore: Math.round(consistencyScore),
    challengeHandling
  }
}

async function generateAIInsights(
  profile: any, 
  events: any[], 
  engagement: any, 
  performance: any
): Promise<string[]> {
  if (!process.env.OPENAI_API_KEY) {
    return [
      "AI insights require OpenAI API configuration",
      "Contact support to enable personalized AI recommendations"
    ]
  }

  try {
    const prompt = `Analyze this learner's data and provide 3-5 personalized insights:

Profile: ${profile.age_group} learner studying ${profile.subjects?.join(', ') || 'various subjects'}
Use case: ${profile.use_case || 'general learning'}

Recent Activity:
- Quiz attempts: ${events.filter(e => e.event_type === 'quiz_attempt').length}
- Content interactions: ${events.filter(e => e.event_type === 'content_interaction').length}
- AI lesson requests: ${events.filter(e => e.event_type === 'ai_lesson_request').length}
- Average performance: ${performance.overallScore}%
- Improvement rate: ${performance.improvementRate}%

Engagement:
- Learning streak: ${engagement?.learning_streak || 0} days
- Total sessions: ${engagement?.session_count || 0}
- Engagement score: ${engagement?.engagement_score || 0}/100

Please provide specific, actionable insights focusing on:
1. Learning strengths to leverage
2. Areas needing attention
3. Optimal learning strategies
4. Motivation and engagement recommendations

Keep insights encouraging and specific to this learner's patterns.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    })

    const aiResponse = completion.choices[0]?.message?.content || ''
    return aiResponse.split('\n').filter(line => line.trim().length > 0).slice(0, 5)

  } catch (error) {
    console.error('OpenAI insights generation error:', error)
    return [
      "Personalized AI insights are temporarily unavailable",
      "Your learning analytics show consistent engagement patterns",
      "Consider varying your content types for optimal learning"
    ]
  }
}

function generateRecommendations(
  patterns: any, 
  performance: any, 
  profile: any
): {
  content: string[]
  immediateActions: string[]
  pathAdjustments: string[]
  scheduleOptimization: string[]
  contentTypes: string[]
} {
  const recommendations = {
    content: [] as string[],
    immediateActions: [] as string[],
    pathAdjustments: [] as string[],
    scheduleOptimization: [] as string[],
    contentTypes: [] as string[]
  }

  // Content recommendations based on performance
  if (performance.overallScore < 70) {
    recommendations.content.push("Review fundamental concepts with easier content")
    recommendations.content.push("Practice with more interactive quizzes")
  } else if (performance.overallScore > 85) {
    recommendations.content.push("Challenge yourself with advanced topics")
    recommendations.content.push("Explore related subjects to expand knowledge")
  }

  // Immediate actions
  if (patterns.studyHabits.consistencyScore < 50) {
    recommendations.immediateActions.push("Set a daily learning reminder")
    recommendations.immediateActions.push("Start with shorter 10-15 minute sessions")
  }

  if (performance.challengeHandling === 'struggles') {
    recommendations.immediateActions.push("Request AI tutor assistance for difficult topics")
    recommendations.immediateActions.push("Break complex topics into smaller chunks")
  }

  // Learning path adjustments
  if (performance.improvementRate < 0) {
    recommendations.pathAdjustments.push("Revisit core concepts before advancing")
    recommendations.pathAdjustments.push("Switch to visual learning materials")
  }

  // Schedule optimization
  if (patterns.optimalTimes.length > 0) {
    recommendations.scheduleOptimization.push(
      `Focus study sessions during your peak hours: ${patterns.optimalTimes.join(', ')}`
    )
  }

  if (patterns.sessionLengthPreference === 'short') {
    recommendations.scheduleOptimization.push("Use spaced repetition with multiple short sessions")
  }

  // Content type recommendations
  const topContentType = Object.entries(patterns.preferredContentTypes)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]

  if (topContentType) {
    recommendations.contentTypes.push(`Continue focusing on ${topContentType[0]} content`)
    // Suggest complementary content types
    if (topContentType[0] === 'video') {
      recommendations.contentTypes.push("Add interactive quizzes to reinforce video learning")
    } else if (topContentType[0] === 'text') {
      recommendations.contentTypes.push("Complement reading with visual diagrams and videos")
    }
  }

  return recommendations
}

function calculateLearningVelocity(events: any[]): {
  velocity: number
  trend: 'increasing' | 'decreasing' | 'stable'
  weeklyProgress: number[]
} {
  const contentInteractions = events.filter(e => e.event_type === 'content_interaction')
  const weeks = 4
  const weeklyProgress: number[] = []

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - i * 7)

    const weekInteractions = contentInteractions.filter(e => {
      const eventDate = new Date(e.timestamp)
      return eventDate >= weekStart && eventDate < weekEnd
    }).length

    weeklyProgress.unshift(weekInteractions)
  }

  const velocity = weeklyProgress.reduce((sum, week) => sum + week, 0) / weeks

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (weeklyProgress.length >= 2) {
    const recentAvg = (weeklyProgress[2] + weeklyProgress[3]) / 2
    const earlierAvg = (weeklyProgress[0] + weeklyProgress[1]) / 2
    
    if (recentAvg > earlierAvg * 1.2) {
      trend = 'increasing'
    } else if (recentAvg < earlierAvg * 0.8) {
      trend = 'decreasing'
    }
  }

  return {
    velocity: Math.round(velocity * 10) / 10,
    trend,
    weeklyProgress
  }
}

function identifyStrengthsAndWeaknesses(performance: any, events: any[]): {
  strengths: string[]
  improvementAreas: string[]
} {
  const strengths: string[] = []
  const improvementAreas: string[] = []

  // Performance-based analysis
  if (performance.overallScore >= 85) {
    strengths.push("Excellent quiz performance and knowledge retention")
  } else if (performance.overallScore >= 70) {
    strengths.push("Good understanding of core concepts")
  } else {
    improvementAreas.push("Focus on understanding fundamental concepts")
  }

  if (performance.consistencyScore >= 80) {
    strengths.push("Consistent performance across different topics")
  } else if (performance.consistencyScore < 60) {
    improvementAreas.push("Work on maintaining consistent study quality")
  }

  if (performance.improvementRate > 10) {
    strengths.push("Strong learning progression and adaptation")
  } else if (performance.improvementRate < -5) {
    improvementAreas.push("Review study methods to maintain progress")
  }

  // Subject-specific strengths
  Object.entries(performance.subjectScores).forEach(([subject, score]) => {
    const numScore = Number(score)
    if (numScore >= 85) {
      strengths.push(`Strong proficiency in ${subject}`)
    } else if (numScore < 60) {
      improvementAreas.push(`Additional practice needed in ${subject}`)
    }
  })

  // Engagement-based analysis
  const aiInteractions = events.filter(e => e.event_type === 'ai_lesson_request').length
  if (aiInteractions > 10) {
    strengths.push("Proactive in seeking help and additional explanations")
  }

  const contentVariety = [...new Set(
    events.filter(e => e.event_type === 'content_interaction')
      .map(e => e.properties?.content_type)
  )].length

  if (contentVariety >= 3) {
    strengths.push("Diverse learning approach using multiple content types")
  } else {
    improvementAreas.push("Try different content types for better understanding")
  }

  return { strengths, improvementAreas }
}

function analyzeEngagementTrends(events: any[]): Record<string, number> {
  const dailyEngagement: Record<string, number> = {}
  const last30Days = 30

  for (let i = 0; i < last30Days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayEvents = events.filter(e => e.timestamp.startsWith(dateStr))
    dailyEngagement[dateStr] = dayEvents.length
  }

  return dailyEngagement
}

function calculateConsistencyScore(events: any[]): number {
  const dailyActivity: Record<string, number> = {}
  const last14Days = 14

  for (let i = 0; i < last14Days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    dailyActivity[dateStr] = events.filter(e => e.timestamp.startsWith(dateStr)).length
  }

  const activeDays = Object.values(dailyActivity).filter(count => count > 0).length
  return Math.round((activeDays / last14Days) * 100)
}

function predictNextMilestone(velocity: any, progress: any[]): string {
  if (velocity.velocity === 0) return "Unable to predict - no recent activity"
  
  // Estimate based on current progress and velocity
  const averageContentPerMilestone = 20 // Assuming milestones every 20 content pieces
  const currentProgress = progress.length
  const nextMilestone = Math.ceil(currentProgress / averageContentPerMilestone) * averageContentPerMilestone
  const contentNeeded = nextMilestone - currentProgress
  const weeksToMilestone = Math.ceil(contentNeeded / velocity.velocity)

  if (weeksToMilestone <= 1) return "Within 1 week"
  if (weeksToMilestone <= 4) return `${weeksToMilestone} weeks`
  if (weeksToMilestone <= 12) return `${Math.round(weeksToMilestone / 4)} months`
  return "More than 3 months"
}

function calculateSuccessProbability(performance: any, engagement: any): number {
  let probability = 50 // Base probability

  // Adjust based on performance
  if (performance.overallScore >= 80) probability += 20
  else if (performance.overallScore >= 60) probability += 10
  else if (performance.overallScore < 40) probability -= 20

  // Adjust based on improvement rate
  if (performance.improvementRate > 5) probability += 15
  else if (performance.improvementRate < -5) probability -= 15

  // Adjust based on engagement
  if (engagement?.engagement_score >= 80) probability += 15
  else if (engagement?.engagement_score >= 60) probability += 5
  else if (engagement?.engagement_score < 40) probability -= 15

  // Adjust based on learning streak
  if (engagement?.learning_streak >= 7) probability += 10
  else if (engagement?.learning_streak === 0) probability -= 10

  return Math.max(0, Math.min(100, Math.round(probability)))
}

function recommendOptimalDifficulty(performance: any): 'beginner' | 'intermediate' | 'advanced' {
  if (performance.overallScore >= 85 && performance.consistencyScore >= 70) {
    return 'advanced'
  } else if (performance.overallScore >= 65 && performance.challengeHandling !== 'struggles') {
    return 'intermediate'
  } else {
    return 'beginner'
  }
}
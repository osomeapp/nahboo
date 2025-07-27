import { NextRequest, NextResponse } from 'next/server'
import { analyzeUserBehavior } from '@/lib/adaptive-learning-engine'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface AnalyzeRequest {
  userId: string
  userProfile: UserProfile
  interactions: any[]
  performanceData: any[]
  timeframe?: number // days to analyze
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json()

    if (!body.userId || !body.userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile' },
        { status: 400 }
      )
    }

    // Filter interactions by timeframe if specified
    let interactions = body.interactions || []
    let performanceData = body.performanceData || []

    if (body.timeframe) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - body.timeframe)
      const cutoffTime = cutoffDate.getTime()

      interactions = interactions.filter((interaction: any) => 
        new Date(interaction.created_at).getTime() > cutoffTime
      )
      
      performanceData = performanceData.filter((data: any) => 
        new Date(data.timestamp || data.created_at).getTime() > cutoffTime
      )
    }

    // Generate mock data if arrays are empty (for demo purposes)
    if (interactions.length === 0) {
      interactions = generateMockInteractions(body.userId, body.userProfile)
    }
    
    if (performanceData.length === 0) {
      performanceData = generateMockPerformanceData(body.userId, body.userProfile)
    }

    // Analyze learning behavior
    const learningBehavior = await analyzeUserBehavior(
      body.userId,
      interactions,
      performanceData
    )

    // Generate insights and recommendations
    const insights = generateLearningInsights(learningBehavior)
    const recommendations = generateAdaptationRecommendations(learningBehavior)

    return NextResponse.json({
      success: true,
      learningBehavior,
      insights,
      recommendations,
      metadata: {
        analyzedInteractions: interactions.length,
        analyzedPerformanceData: performanceData.length,
        timeframe: body.timeframe || 'all_time',
        confidenceLevel: learningBehavior.confidenceLevel,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Learning behavior analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze learning behavior' },
      { status: 500 }
    )
  }
}

// Generate mock interactions for demo purposes
function generateMockInteractions(userId: string, userProfile: UserProfile): any[] {
  const interactions = []
  const contentTypes = ['video', 'quiz', 'text', 'interactive']
  const interactionTypes = ['view', 'complete', 'pause', 'quiz_attempt', 'help_request']
  
  // Generate 20-50 mock interactions over the past 30 days
  const interactionCount = Math.floor(Math.random() * 30) + 20
  
  for (let i = 0; i < interactionCount; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    
    const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)]
    const interactionType = interactionTypes[Math.floor(Math.random() * interactionTypes.length)]
    
    interactions.push({
      id: `interaction_${i}`,
      user_id: userId,
      content_id: `content_${i % 10}`,
      content_type: contentType,
      interaction_type: interactionType,
      subject: userProfile.subject,
      progress_percentage: Math.random() * 100,
      time_spent: Math.floor(Math.random() * 1800) + 60, // 1-30 minutes
      interaction_data: {
        score: Math.random(),
        hasImages: contentType === 'video' || Math.random() > 0.7,
        hasAudio: contentType === 'video' || Math.random() > 0.8,
        textHeavy: contentType === 'text' || Math.random() > 0.6,
        helpRequested: interactionType === 'help_request',
        actionTaken: Math.random() > 0.3
      },
      created_at: date.toISOString()
    })
  }
  
  return interactions.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

// Generate mock performance data for demo purposes
function generateMockPerformanceData(userId: string, userProfile: UserProfile): any[] {
  const performanceData = []
  const subjects = [userProfile.subject, 'General Knowledge', 'Problem Solving']
  const concepts = ['Basic Concepts', 'Intermediate Topics', 'Advanced Applications', 'Practice Problems']
  
  // Generate 15-25 performance records
  const recordCount = Math.floor(Math.random() * 10) + 15
  
  for (let i = 0; i < recordCount; i++) {
    const daysAgo = Math.floor(Math.random() * 45)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    
    const subject = subjects[Math.floor(Math.random() * subjects.length)]
    const concept = concepts[Math.floor(Math.random() * concepts.length)]
    const difficulty = Math.floor(Math.random() * 5) + 3 // 3-7 difficulty
    
    // Performance tends to improve over time
    const timeWeight = (45 - daysAgo) / 45 // More recent = higher weight
    const baseScore = Math.random() * 0.6 + 0.2 // 0.2-0.8 base
    const improvedScore = Math.min(1, baseScore + (timeWeight * 0.3))
    
    performanceData.push({
      id: `performance_${i}`,
      user_id: userId,
      subject,
      concept,
      topic: concept,
      difficulty,
      score: improvedScore,
      success_rate: improvedScore,
      timestamp: date.toISOString(),
      created_at: date.toISOString()
    })
  }
  
  return performanceData.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

// Generate learning insights from behavior analysis
function generateLearningInsights(behavior: any): any {
  const insights = {
    learningStyle: {
      primary: getPrimaryLearningStyle(behavior),
      secondary: getSecondaryLearningStyle(behavior),
      confidence: Math.max(
        behavior.visualPreference,
        behavior.auditoryPreference,
        behavior.kinestheticPreference,
        behavior.readingPreference
      )
    },
    
    performance: {
      currentLevel: behavior.currentDifficultyLevel,
      optimalLevel: behavior.optimalDifficultyLevel,
      needsAdjustment: Math.abs(behavior.currentDifficultyLevel - behavior.optimalDifficultyLevel) > 1,
      learningVelocity: behavior.learningVelocity,
      retentionQuality: behavior.retentionRate
    },
    
    engagement: {
      completionRate: behavior.contentCompletionRate,
      sessionLength: behavior.averageSessionLength,
      helpSeeking: behavior.helpSeekingBehavior,
      feedbackResponse: behavior.feedbackResponsiveness,
      overall: (behavior.contentCompletionRate + behavior.feedbackResponsiveness + (1 - behavior.multitaskingTendency)) / 3
    },
    
    patterns: {
      preferredTimes: behavior.preferredTimeOfDay,
      optimalSessionLength: behavior.optimalSessionLength,
      preferredContentTypes: behavior.preferredContentTypes,
      topPerformingTopics: getTopPerformingTopics(behavior.topicAffinities),
      strugglingAreas: getStrugglingAreas(behavior.topicAffinities)
    },
    
    adaptationReadiness: {
      sensitivity: behavior.adaptationSensitivity,
      confidence: behavior.confidenceLevel,
      dataQuality: getDataQualityScore(behavior.dataPoints),
      recommendationStrength: behavior.confidenceLevel * getDataQualityScore(behavior.dataPoints)
    }
  }
  
  return insights
}

// Generate adaptation recommendations
function generateAdaptationRecommendations(behavior: any): any {
  const recommendations = {
    immediate: [] as any[],
    shortTerm: [] as any[],
    longTerm: [] as any[],
    contentStrategy: {},
    difficultyAdjustment: {},
    styleOptimization: {}
  }
  
  // Immediate recommendations
  if (behavior.currentDifficultyLevel !== behavior.optimalDifficultyLevel) {
    const direction = behavior.optimalDifficultyLevel > behavior.currentDifficultyLevel ? 'increase' : 'decrease'
    recommendations.immediate.push({
      type: 'difficulty_adjustment',
      action: `${direction} difficulty`,
      from: behavior.currentDifficultyLevel,
      to: behavior.optimalDifficultyLevel,
      reason: 'Performance data suggests optimal difficulty mismatch',
      priority: 'high'
    })
  }
  
  if (behavior.contentCompletionRate < 0.6) {
    recommendations.immediate.push({
      type: 'engagement_boost',
      action: 'reduce session complexity',
      reason: 'Low completion rate indicates content may be overwhelming',
      priority: 'high'
    })
  }
  
  // Short-term recommendations
  const primaryStyle = getPrimaryLearningStyle(behavior)
  recommendations.shortTerm.push({
    type: 'content_optimization',
    action: `emphasize ${primaryStyle} learning elements`,
    reason: `User shows strong preference for ${primaryStyle} learning style`,
    priority: 'medium'
  })
  
  if (behavior.averageSessionLength > behavior.optimalSessionLength * 1.5) {
    recommendations.shortTerm.push({
      type: 'pacing_adjustment',
      action: 'suggest shorter, more frequent sessions',
      reason: 'Current sessions may be too long for optimal retention',
      priority: 'medium'
    })
  }
  
  // Long-term recommendations
  recommendations.longTerm.push({
    type: 'personalization_enhancement',
    action: 'develop specialized learning path',
    reason: 'Sufficient data available for deep personalization',
    priority: 'low'
  })
  
  // Content strategy
  recommendations.contentStrategy = {
    priorityTypes: behavior.preferredContentTypes.slice(0, 2),
    avoidTypes: getUnpreferredContentTypes(behavior),
    optimalSequencing: generateOptimalSequencing(behavior),
    breakFrequency: Math.max(1, Math.floor(behavior.optimalSessionLength / 15))
  }
  
  // Difficulty adjustment strategy
  recommendations.difficultyAdjustment = {
    currentLevel: behavior.currentDifficultyLevel,
    targetLevel: behavior.optimalDifficultyLevel,
    adjustmentRate: behavior.adaptationSensitivity,
    monitoringRequired: behavior.confidenceLevel < 0.7
  }
  
  // Style optimization
  recommendations.styleOptimization = {
    visualEnhancements: behavior.visualPreference > 0.6,
    audioSupport: behavior.auditoryPreference > 0.6,
    interactiveElements: behavior.kinestheticPreference > 0.6,
    textSimplification: behavior.readingPreference < 0.4,
    multimediaBalance: generateMultimediaBalance(behavior)
  }
  
  return recommendations
}

// Helper functions for insights and recommendations
function getPrimaryLearningStyle(behavior: any): string {
  const styles = {
    visual: behavior.visualPreference,
    auditory: behavior.auditoryPreference,
    kinesthetic: behavior.kinestheticPreference,
    reading: behavior.readingPreference
  }
  
  return Object.entries(styles).reduce((max, [style, score]) => 
    score > styles[max] ? style : max, 'visual'
  )
}

function getSecondaryLearningStyle(behavior: any): string {
  const styles = {
    visual: behavior.visualPreference,
    auditory: behavior.auditoryPreference,
    kinesthetic: behavior.kinestheticPreference,
    reading: behavior.readingPreference
  }
  
  const primary = getPrimaryLearningStyle(behavior)
  delete styles[primary]
  
  return Object.entries(styles).reduce((max, [style, score]) => 
    score > styles[max] ? style : max, Object.keys(styles)[0]
  )
}

function getTopPerformingTopics(topicAffinities: Record<string, number>): string[] {
  return Object.entries(topicAffinities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic)
}

function getStrugglingAreas(topicAffinities: Record<string, number>): string[] {
  return Object.entries(topicAffinities)
    .filter(([_, score]) => score < 0.4)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([topic]) => topic)
}

function getDataQualityScore(dataPoints: number): number {
  if (dataPoints < 5) return 0.3
  if (dataPoints < 20) return 0.6
  if (dataPoints < 50) return 0.8
  return 1.0
}

function getUnpreferredContentTypes(behavior: any): string[] {
  const allTypes = ['video', 'quiz', 'text', 'interactive']
  return allTypes.filter(type => !behavior.preferredContentTypes.includes(type))
}

function generateOptimalSequencing(behavior: any): string {
  const primary = getPrimaryLearningStyle(behavior)
  
  if (primary === 'kinesthetic') {
    return 'interactive_first'
  } else if (primary === 'visual') {
    return 'video_then_interactive'
  } else if (primary === 'auditory') {
    return 'audio_then_practice'
  } else {
    return 'text_then_application'
  }
}

function generateMultimediaBalance(behavior: any): Record<string, number> {
  const total = behavior.visualPreference + behavior.auditoryPreference + 
                behavior.kinestheticPreference + behavior.readingPreference
  
  return {
    visual: behavior.visualPreference / total,
    audio: behavior.auditoryPreference / total,
    interactive: behavior.kinestheticPreference / total,
    text: behavior.readingPreference / total
  }
}
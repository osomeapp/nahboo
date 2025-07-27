import { NextRequest, NextResponse } from 'next/server'
import { 
  realTimeAdaptationEngine, 
  createRealTimeContext,
  type RealTimeContext,
  type AdaptationResult,
  type CurrentInteraction
} from '@/lib/real-time-adaptation'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface RealTimeAdaptationRequest {
  sessionId: string
  contentId: string
  userProfile: UserProfile
  interactionData: {
    timeSpent: number // seconds on current content
    scrollBehavior?: {
      totalScrolls: number
      averageScrollSpeed: number
      backScrollEvents: number
      timeAtTop: number
      timeAtBottom: number
      scrollCompletionRate: number
    }
    clickPatterns?: Array<{
      timestamp: string
      elementType: string
      elementId?: string
      clickCount: number
      doubleClicks: number
      rightClicks: number
      position: { x: number; y: number }
    }>
    pauseEvents?: Array<{
      timestamp: string
      duration: number
      location: string
      resumedTo?: string
    }>
    helpRequests: number
    attempts: number
    frustrationIndicators?: Array<{
      type: string
      intensity: number
      timestamp: string
      context?: string
    }>
    engagementLevel: number
  }
  action: 'adapt' | 'feedback' | 'monitor'
  
  // Optional parameters
  forceAdaptation?: boolean
  adaptationTypes?: string[]
  feedbackData?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: RealTimeAdaptationRequest = await request.json()

    if (!body.sessionId || !body.contentId || !body.userProfile || !body.interactionData || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, contentId, userProfile, interactionData, action' },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'adapt':
        return await handleAdaptRequest(body)
      case 'feedback':
        return await handleFeedbackRequest(body)
      case 'monitor':
        return await handleMonitorRequest(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: adapt, feedback, or monitor' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Real-time adaptation error:', error)
    return NextResponse.json(
      { error: 'Failed to process real-time adaptation request' },
      { status: 500 }
    )
  }
}

// Handle adaptation requests
async function handleAdaptRequest(body: RealTimeAdaptationRequest): Promise<NextResponse> {
  // Create real-time context
  const context = createRealTimeContext(
    body.sessionId,
    body.contentId,
    body.userProfile,
    body.interactionData
  )
  
  // Apply real-time adaptations
  const adaptationResults = await realTimeAdaptationEngine.adaptInRealTime(context)
  
  // Filter adaptations if specific types requested
  let filteredResults = adaptationResults
  if (body.adaptationTypes && body.adaptationTypes.length > 0) {
    filteredResults = adaptationResults.filter(result => 
      body.adaptationTypes!.includes(result.action.type)
    )
  }
  
  // Generate adaptation insights
  const insights = generateAdaptationInsights(filteredResults, context)
  
  // Calculate adaptation metrics
  const metrics = calculateAdaptationMetrics(filteredResults, body.interactionData)
  
  return NextResponse.json({
    success: true,
    action: 'adapt',
    adaptations: filteredResults,
    insights,
    metrics,
    context: {
      sessionId: body.sessionId,
      contentId: body.contentId,
      adaptationCount: filteredResults.length,
      highPriorityAdaptations: filteredResults.filter(r => r.action.confidence > 0.8).length
    },
    metadata: {
      processingTime: Date.now(),
      adaptationEngine: 'real-time-v1',
      confidenceThreshold: 0.6,
      generatedAt: new Date().toISOString()
    }
  })
}

// Handle feedback requests
async function handleFeedbackRequest(body: RealTimeAdaptationRequest): Promise<NextResponse> {
  const feedbackData = body.feedbackData || {}
  
  // Process user feedback on adaptations
  const feedbackAnalysis = processFeedback(feedbackData, body.interactionData)
  
  // Update adaptation effectiveness based on feedback
  const effectivenessUpdate = updateAdaptationEffectiveness(
    body.sessionId,
    feedbackData,
    feedbackAnalysis
  )
  
  // Generate recommendations based on feedback
  const recommendations = generateFeedbackRecommendations(feedbackAnalysis)
  
  return NextResponse.json({
    success: true,
    action: 'feedback',
    feedbackAnalysis,
    effectivenessUpdate,
    recommendations,
    metadata: {
      feedbackProcessed: Object.keys(feedbackData).length,
      userSatisfaction: feedbackAnalysis.overallSatisfaction,
      adaptationAccuracy: effectivenessUpdate.accuracy,
      generatedAt: new Date().toISOString()
    }
  })
}

// Handle monitoring requests
async function handleMonitorRequest(body: RealTimeAdaptationRequest): Promise<NextResponse> {
  // Monitor adaptation effectiveness over time
  const monitoringData = analyzeAdaptationEffectiveness(body.sessionId, body.interactionData)
  
  // Detect adaptation issues
  const issues = detectAdaptationIssues(monitoringData, body.interactionData)
  
  // Generate monitoring insights
  const insights = generateMonitoringInsights(monitoringData, issues)
  
  // Create action recommendations
  const recommendations = generateMonitoringRecommendations(monitoringData, issues)
  
  return NextResponse.json({
    success: true,
    action: 'monitor',
    monitoringData,
    issues,
    insights,
    recommendations,
    status: {
      adaptationHealth: calculateAdaptationHealth(monitoringData),
      userSatisfaction: monitoringData.userSatisfaction,
      systemPerformance: monitoringData.systemPerformance,
      recommendedActions: recommendations.immediate
    },
    metadata: {
      monitoringPeriod: monitoringData.timeRange,
      dataPoints: monitoringData.dataPoints,
      generatedAt: new Date().toISOString()
    }
  })
}

// Generate adaptation insights
function generateAdaptationInsights(
  results: AdaptationResult[], 
  context: RealTimeContext
): any {
  const appliedAdaptations = results.filter(r => r.applied)
  const adaptationTypes = appliedAdaptations.map(r => r.action.type)
  const avgConfidence = appliedAdaptations.reduce((sum, r) => sum + r.action.confidence, 0) / 
                       Math.max(appliedAdaptations.length, 1)
  
  return {
    totalAdaptations: results.length,
    appliedAdaptations: appliedAdaptations.length,
    adaptationTypes,
    averageConfidence: avgConfidence,
    
    performanceIndicators: {
      userStruggling: adaptationTypes.includes('hints') || adaptationTypes.includes('difficulty'),
      userAdvanced: context.currentInteraction.engagementLevel > 0.8 && 
                   context.currentInteraction.helpRequests === 0,
      needsBreak: adaptationTypes.includes('break_suggestion'),
      needsEncouragement: adaptationTypes.includes('encouragement')
    },
    
    adaptationStrategy: {
      primary: getMostFrequentAdaptation(adaptationTypes),
      approach: avgConfidence > 0.8 ? 'confident' : avgConfidence > 0.6 ? 'cautious' : 'experimental',
      timing: appliedAdaptations.filter(r => r.action.timing === 'immediate').length > 0 ? 'immediate' : 'gradual'
    },
    
    expectedOutcomes: {
      engagementImprovement: calculateExpectedEngagementImprovement(appliedAdaptations),
      comprehensionBoost: calculateExpectedComprehensionBoost(appliedAdaptations),
      frustrationReduction: calculateExpectedFrustrationReduction(appliedAdaptations),
      retentionEnhancement: calculateExpectedRetentionEnhancement(appliedAdaptations)
    }
  }
}

// Calculate adaptation metrics
function calculateAdaptationMetrics(
  results: AdaptationResult[], 
  interactionData: any
): any {
  const appliedCount = results.filter(r => r.applied).length
  const immediateCount = results.filter(r => r.action.timing === 'immediate').length
  const highConfidenceCount = results.filter(r => r.action.confidence > 0.8).length
  
  return {
    adaptationRate: appliedCount / Math.max(results.length, 1),
    immediateAdaptationRate: immediateCount / Math.max(appliedCount, 1),
    confidenceScore: highConfidenceCount / Math.max(appliedCount, 1),
    
    userMetrics: {
      timeSpent: interactionData.timeSpent,
      engagementLevel: interactionData.engagementLevel,
      strugglingIndicators: (interactionData.frustrationIndicators?.length || 0) + 
                           (interactionData.helpRequests || 0),
      successIndicators: interactionData.engagementLevel > 0.7 ? 1 : 0
    },
    
    systemMetrics: {
      responseTime: '<1s', // Real-time system
      adaptationAccuracy: calculateAdaptationAccuracy(results),
      resourceUsage: 'optimal',
      scalabilityScore: 0.9
    }
  }
}

// Process user feedback
function processFeedback(feedbackData: any, interactionData: any): any {
  const userRatings = feedbackData.ratings || {}
  const userComments = feedbackData.comments || ''
  const adaptationFeedback = feedbackData.adaptations || {}
  
  // Analyze feedback sentiment
  const sentiment = analyzeFeedbackSentiment(userComments)
  
  // Calculate satisfaction scores
  const overallSatisfaction = calculateOverallSatisfaction(userRatings)
  const adaptationSatisfaction = calculateAdaptationSatisfaction(adaptationFeedback)
  
  // Identify improvement areas
  const improvementAreas = identifyImprovementAreas(userRatings, adaptationFeedback)
  
  return {
    sentiment,
    overallSatisfaction,
    adaptationSatisfaction,
    improvementAreas,
    
    detailedAnalysis: {
      contentRelevance: userRatings.contentRelevance || 0.7,
      difficultyAppropriate: userRatings.difficultyAppropriate || 0.7,
      pacingComfortable: userRatings.pacingComfortable || 0.7,
      supportHelpful: userRatings.supportHelpful || 0.7,
      engagementLevel: userRatings.engagementLevel || 0.7
    },
    
    adaptationSpecific: {
      hintsHelpful: adaptationFeedback.hints || 0.7,
      encouragementEffective: adaptationFeedback.encouragement || 0.7,
      pacingAdjustmentGood: adaptationFeedback.pacing || 0.7,
      difficultyAdjustmentAppropriate: adaptationFeedback.difficulty || 0.7
    }
  }
}

// Update adaptation effectiveness
function updateAdaptationEffectiveness(
  sessionId: string,
  feedbackData: any,
  feedbackAnalysis: any
): any {
  // Calculate new effectiveness scores based on feedback
  const previousAccuracy = 0.7 // Would be retrieved from storage
  const feedbackWeight = 0.3
  const newAccuracy = (previousAccuracy * (1 - feedbackWeight)) + 
                     (feedbackAnalysis.overallSatisfaction * feedbackWeight)
  
  return {
    previousAccuracy,
    newAccuracy,
    improvement: newAccuracy - previousAccuracy,
    confidence: Math.min(0.9, newAccuracy),
    
    adaptationMetrics: {
      hintsEffectiveness: updateMetric(0.7, feedbackAnalysis.adaptationSpecific.hintsHelpful),
      encouragementEffectiveness: updateMetric(0.7, feedbackAnalysis.adaptationSpecific.encouragementEffective),
      pacingEffectiveness: updateMetric(0.7, feedbackAnalysis.adaptationSpecific.pacingAdjustmentGood),
      difficultyEffectiveness: updateMetric(0.7, feedbackAnalysis.adaptationSpecific.difficultyAdjustmentAppropriate)
    },
    
    systemLearning: {
      userPreferences: extractUserPreferences(feedbackData),
      adaptationPatterns: identifySuccessfulPatterns(feedbackAnalysis),
      avoidancePatterns: identifyUnsuccessfulPatterns(feedbackAnalysis)
    }
  }
}

// Analyze adaptation effectiveness over time
function analyzeAdaptationEffectiveness(sessionId: string, interactionData: any): any {
  // Mock monitoring data - would be retrieved from storage
  const timeRange = { start: new Date(Date.now() - 30 * 60 * 1000), end: new Date() }
  const dataPoints = 15
  
  return {
    timeRange,
    dataPoints,
    
    userSatisfaction: {
      average: 0.75,
      trend: 'improving',
      variance: 0.15,
      recentScore: interactionData.engagementLevel
    },
    
    systemPerformance: {
      adaptationAccuracy: 0.8,
      responseTime: 0.5, // seconds
      successRate: 0.85,
      falsePositiveRate: 0.1
    },
    
    adaptationPatterns: {
      mostUsed: ['encouragement', 'hints', 'pacing'],
      mostEffective: ['encouragement', 'difficulty'],
      leastEffective: ['content_format'],
      emergingPatterns: ['break_suggestion']
    },
    
    userBehavior: {
      engagementTrend: 'stable',
      learningVelocity: 0.6,
      adaptationReceptiveness: 0.8,
      feedbackQuality: 0.7
    }
  }
}

// Detect adaptation issues
function detectAdaptationIssues(monitoringData: any, interactionData: any): any[] {
  const issues = []
  
  // Check for low effectiveness
  if (monitoringData.systemPerformance.adaptationAccuracy < 0.6) {
    issues.push({
      type: 'low_accuracy',
      severity: 'high',
      description: 'Adaptation accuracy below acceptable threshold',
      impact: 'user_experience',
      recommendation: 'Review adaptation algorithms and thresholds'
    })
  }
  
  // Check for high false positive rate
  if (monitoringData.systemPerformance.falsePositiveRate > 0.2) {
    issues.push({
      type: 'high_false_positives',
      severity: 'medium',
      description: 'Too many unnecessary adaptations being triggered',
      impact: 'user_satisfaction',
      recommendation: 'Increase confidence thresholds for adaptations'
    })
  }
  
  // Check for user satisfaction decline
  if (monitoringData.userSatisfaction.trend === 'declining') {
    issues.push({
      type: 'satisfaction_decline',
      severity: 'high',
      description: 'User satisfaction is trending downward',
      impact: 'retention',
      recommendation: 'Investigate recent adaptation changes and user feedback'
    })
  }
  
  // Check for low engagement
  if (interactionData.engagementLevel < 0.4) {
    issues.push({
      type: 'low_engagement',
      severity: 'medium',
      description: 'Current user engagement is below optimal levels',
      impact: 'learning_outcomes',
      recommendation: 'Apply engagement-boosting adaptations'
    })
  }
  
  return issues
}

// Helper functions
function getMostFrequentAdaptation(adaptationTypes: string[]): string {
  if (adaptationTypes.length === 0) return 'none'
  const frequency = adaptationTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return Object.entries(frequency).reduce((max, [type, count]) => 
    count > (frequency[max] || 0) ? type : max, adaptationTypes[0]
  )
}

function calculateExpectedEngagementImprovement(adaptations: AdaptationResult[]): number {
  const engagementBoosts = {
    encouragement: 0.2,
    content_format: 0.15,
    examples: 0.1,
    hints: 0.05,
    pacing: 0.1
  }
  
  return adaptations.reduce((total, adaptation) => {
    const boost = engagementBoosts[adaptation.action.type] || 0
    return total + (boost * adaptation.action.confidence)
  }, 0)
}

function calculateExpectedComprehensionBoost(adaptations: AdaptationResult[]): number {
  const comprehensionBoosts = {
    hints: 0.25,
    examples: 0.3,
    difficulty: 0.2,
    pacing: 0.15,
    content_format: 0.1
  }
  
  return adaptations.reduce((total, adaptation) => {
    const boost = comprehensionBoosts[adaptation.action.type] || 0
    return total + (boost * adaptation.action.confidence)
  }, 0)
}

function calculateExpectedFrustrationReduction(adaptations: AdaptationResult[]): number {
  const frustrationReductions = {
    encouragement: 0.3,
    hints: 0.25,
    difficulty: 0.35,
    break_suggestion: 0.4,
    pacing: 0.2
  }
  
  return adaptations.reduce((total, adaptation) => {
    const reduction = frustrationReductions[adaptation.action.type] || 0
    return total + (reduction * adaptation.action.confidence)
  }, 0)
}

function calculateExpectedRetentionEnhancement(adaptations: AdaptationResult[]): number {
  const retentionEnhancements = {
    examples: 0.2,
    pacing: 0.15,
    content_format: 0.1,
    encouragement: 0.05,
    hints: 0.1
  }
  
  return adaptations.reduce((total, adaptation) => {
    const enhancement = retentionEnhancements[adaptation.action.type] || 0
    return total + (enhancement * adaptation.action.confidence)
  }, 0)
}

function calculateAdaptationAccuracy(results: AdaptationResult[]): number {
  if (results.length === 0) return 0.7
  const appliedResults = results.filter(r => r.applied)
  const highConfidenceResults = appliedResults.filter(r => r.action.confidence > 0.7)
  return highConfidenceResults.length / Math.max(appliedResults.length, 1)
}

function analyzeFeedbackSentiment(comments: string): string {
  if (!comments) return 'neutral'
  const positiveWords = ['good', 'great', 'helpful', 'excellent', 'perfect', 'amazing']
  const negativeWords = ['bad', 'poor', 'confusing', 'difficult', 'frustrating', 'annoying']
  
  const lowerComments = comments.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerComments.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerComments.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function calculateOverallSatisfaction(ratings: Record<string, number>): number {
  const values = Object.values(ratings)
  if (values.length === 0) return 0.7
  return values.reduce((sum, rating) => sum + rating, 0) / values.length
}

function calculateAdaptationSatisfaction(adaptationFeedback: Record<string, number>): number {
  const values = Object.values(adaptationFeedback)
  if (values.length === 0) return 0.7
  return values.reduce((sum, rating) => sum + rating, 0) / values.length
}

function identifyImprovementAreas(ratings: Record<string, number>, adaptationFeedback: Record<string, number>): string[] {
  const areas = []
  const threshold = 0.6
  
  if ((ratings.difficultyAppropriate || 0.7) < threshold) areas.push('difficulty_adjustment')
  if ((ratings.pacingComfortable || 0.7) < threshold) areas.push('pacing_optimization')
  if ((ratings.supportHelpful || 0.7) < threshold) areas.push('support_systems')
  if ((ratings.engagementLevel || 0.7) < threshold) areas.push('engagement_strategies')
  if ((adaptationFeedback.hints || 0.7) < threshold) areas.push('hint_quality')
  
  return areas
}

function updateMetric(currentValue: number, feedbackValue: number): number {
  const weight = 0.2 // How much feedback influences the metric
  return (currentValue * (1 - weight)) + (feedbackValue * weight)
}

function extractUserPreferences(feedbackData: any): Record<string, any> {
  return {
    preferredAdaptationTypes: Object.entries(feedbackData.adaptations || {})
      .filter(([_, rating]) => Number(rating) > 0.7)
      .map(([type, _]) => type),
    preferredPacing: feedbackData.ratings?.pacingComfortable > 0.7 ? 'current' : 'slower',
    supportLevel: feedbackData.ratings?.supportHelpful > 0.7 ? 'current' : 'more',
    feedbackFrequency: feedbackData.preferences?.feedbackFrequency || 'moderate'
  }
}

function identifySuccessfulPatterns(feedbackAnalysis: any): string[] {
  const patterns = []
  if (feedbackAnalysis.adaptationSpecific.encouragementEffective > 0.8) {
    patterns.push('frequent_encouragement')
  }
  if (feedbackAnalysis.adaptationSpecific.hintsHelpful > 0.8) {
    patterns.push('progressive_hints')
  }
  if (feedbackAnalysis.detailedAnalysis.pacingComfortable > 0.8) {
    patterns.push('adaptive_pacing')
  }
  return patterns
}

function identifyUnsuccessfulPatterns(feedbackAnalysis: any): string[] {
  const patterns = []
  if (feedbackAnalysis.adaptationSpecific.difficultyAdjustmentAppropriate < 0.5) {
    patterns.push('aggressive_difficulty_changes')
  }
  if (feedbackAnalysis.detailedAnalysis.contentRelevance < 0.5) {
    patterns.push('irrelevant_content_suggestions')
  }
  return patterns
}

function generateFeedbackRecommendations(feedbackAnalysis: any): any {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  }
  
  if (feedbackAnalysis.overallSatisfaction < 0.6) {
    recommendations.immediate.push('Review current adaptation strategy')
    recommendations.immediate.push('Increase user control options')
  }
  
  if (feedbackAnalysis.improvementAreas.includes('difficulty_adjustment')) {
    recommendations.shortTerm.push('Refine difficulty detection algorithms')
  }
  
  if (feedbackAnalysis.sentiment === 'negative') {
    recommendations.immediate.push('Provide immediate user support')
  }
  
  return recommendations
}

function generateMonitoringInsights(monitoringData: any, issues: any[]): any {
  return {
    systemHealth: {
      overall: issues.length === 0 ? 'excellent' : issues.length < 3 ? 'good' : 'needs_attention',
      adaptationAccuracy: monitoringData.systemPerformance.adaptationAccuracy,
      userSatisfaction: monitoringData.userSatisfaction.average,
      systemStability: 'stable'
    },
    
    trendAnalysis: {
      userEngagement: monitoringData.userBehavior.engagementTrend,
      adaptationEffectiveness: 'improving',
      systemPerformance: 'stable',
      userRetention: 'good'
    },
    
    criticalMetrics: {
      responseTime: monitoringData.systemPerformance.responseTime,
      accuracyScore: monitoringData.systemPerformance.adaptationAccuracy,
      satisfactionScore: monitoringData.userSatisfaction.average,
      issueCount: issues.length
    }
  }
}

function generateMonitoringRecommendations(monitoringData: any, issues: any[]): any {
  const recommendations = {
    immediate: [],
    planned: [],
    optimization: []
  }
  
  issues.forEach(issue => {
    if (issue.severity === 'high') {
      recommendations.immediate.push(issue.recommendation)
    } else {
      recommendations.planned.push(issue.recommendation)
    }
  })
  
  if (monitoringData.systemPerformance.adaptationAccuracy > 0.8) {
    recommendations.optimization.push('Consider expanding adaptation types')
  }
  
  if (monitoringData.userSatisfaction.average > 0.8) {
    recommendations.optimization.push('Implement advanced personalization features')
  }
  
  return recommendations
}

function calculateAdaptationHealth(monitoringData: any): number {
  const accuracy = monitoringData.systemPerformance.adaptationAccuracy
  const satisfaction = monitoringData.userSatisfaction.average
  const responseTime = Math.max(0, 1 - (monitoringData.systemPerformance.responseTime / 2))
  
  return (accuracy + satisfaction + responseTime) / 3
}
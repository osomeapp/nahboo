import { NextRequest, NextResponse } from 'next/server'
import { 
  difficultyEngine, 
  adjustContentDifficulty, 
  generateMockPerformanceData,
  type PerformancePoint,
  type DifficultyRecommendation 
} from '@/lib/difficulty-engine'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface DifficultyRequest {
  userId: string
  userProfile: UserProfile
  contentId?: string
  recentPerformance?: PerformancePoint[]
  currentContext?: any
  action: 'analyze' | 'apply' | 'monitor'
  
  // Optional parameters for different actions
  forceAdjustment?: boolean
  targetDifficulty?: number
  monitoringData?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: DifficultyRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'analyze':
        return await handleAnalyzeRequest(body)
      case 'apply':
        return await handleApplyRequest(body)
      case 'monitor':
        return await handleMonitorRequest(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: analyze, apply, or monitor' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Difficulty adjustment error:', error)
    return NextResponse.json(
      { error: 'Failed to process difficulty adjustment request' },
      { status: 500 }
    )
  }
}

// Handle analysis requests
async function handleAnalyzeRequest(body: DifficultyRequest): Promise<NextResponse> {
  // Generate mock data if not provided
  let recentPerformance = body.recentPerformance || generateMockPerformanceData(body.userId, 15)
  let currentContext = body.currentContext || generateMockContext(body.userProfile)
  
  // Get difficulty profile for user
  const difficultyProfile = await difficultyEngine.getUserDifficultyProfile(body.userId)
  
  // Analyze difficulty needs
  const recommendation = await difficultyEngine.analyzeDifficultyNeeds(
    body.userId,
    recentPerformance,
    currentContext
  )
  
  // Generate insights about the recommendation
  const insights = generateDifficultyInsights(recommendation, difficultyProfile)
  
  // Calculate performance predictions
  const predictions = generatePerformancePredictions(recommendation, difficultyProfile)
  
  return NextResponse.json({
    success: true,
    action: 'analyze',
    difficultyProfile,
    recommendation,
    insights,
    predictions,
    metadata: {
      performanceDataPoints: recentPerformance.length,
      analysisConfidence: recommendation.confidence,
      recommendationUrgency: recommendation.urgency,
      generatedAt: new Date().toISOString()
    }
  })
}

// Handle application requests
async function handleApplyRequest(body: DifficultyRequest): Promise<NextResponse> {
  if (!body.contentId) {
    return NextResponse.json(
      { error: 'contentId is required for apply action' },
      { status: 400 }
    )
  }
  
  let recentPerformance = body.recentPerformance || generateMockPerformanceData(body.userId, 10)
  let currentContext = body.currentContext || generateMockContext(body.userProfile)
  
  // Get adjustment recommendation and apply it
  const result = await adjustContentDifficulty(
    body.userId,
    body.contentId,
    recentPerformance,
    currentContext
  )
  
  // If force adjustment is requested, apply even if urgency is low
  if (body.forceAdjustment && !result.adaptedContent) {
    result.adaptedContent = await difficultyEngine.applyDifficultyAdjustment(
      body.userId,
      body.contentId,
      result.recommendation
    )
  }
  
  // Generate monitoring plan
  const monitoringPlan = generateMonitoringPlan(result.recommendation)
  
  return NextResponse.json({
    success: true,
    action: 'apply',
    recommendation: result.recommendation,
    adaptedContent: result.adaptedContent,
    applied: !!result.adaptedContent,
    monitoringPlan,
    metadata: {
      adjustmentMagnitude: result.recommendation.adjustmentMagnitude,
      riskLevel: result.recommendation.riskLevel,
      expectedImprovement: result.recommendation.expectedImprovement,
      appliedAt: new Date().toISOString()
    }
  })
}

// Handle monitoring requests
async function handleMonitorRequest(body: DifficultyRequest): Promise<NextResponse> {
  const difficultyProfile = await difficultyEngine.getUserDifficultyProfile(body.userId)
  
  // Analyze recent adjustment performance
  const adjustmentHistory = difficultyProfile.adjustmentHistory.slice(-5) // Last 5 adjustments
  const recentPerformance = body.recentPerformance || generateMockPerformanceData(body.userId, 10)
  
  // Calculate adjustment effectiveness
  const effectiveness = calculateAdjustmentEffectiveness(adjustmentHistory, recentPerformance)
  
  // Check if rollback is needed
  const rollbackAnalysis = analyzeRollbackNeed(
    difficultyProfile,
    recentPerformance,
    body.monitoringData
  )
  
  // Generate monitoring insights
  const monitoringInsights = generateMonitoringInsights(
    effectiveness,
    rollbackAnalysis,
    difficultyProfile
  )
  
  return NextResponse.json({
    success: true,
    action: 'monitor',
    effectiveness,
    rollbackAnalysis,
    monitoringInsights,
    recommendations: generateMonitoringRecommendations(effectiveness, rollbackAnalysis),
    metadata: {
      adjustmentsAnalyzed: adjustmentHistory.length,
      performanceDataPoints: recentPerformance.length,
      monitoringPeriod: difficultyProfile.adjustmentHistory.length > 0 ? 
        Math.round((new Date().getTime() - difficultyProfile.lastAdjustment.getTime()) / 60000) : 0,
      generatedAt: new Date().toISOString()
    }
  })
}

// Generate mock context for testing
function generateMockContext(userProfile: UserProfile): any {
  const now = new Date()
  const hour = now.getHours()
  
  return {
    currentSession: {
      startTime: new Date(now.getTime() - 25 * 60 * 1000).toISOString(), // Started 25 min ago
      duration: 25,
      contentViewed: 8,
      quizzesAttempted: 3,
      helpRequested: 1,
      breaksElapsed: 1,
      focusLevel: hour >= 9 && hour <= 11 ? 0.8 : 0.6,
      errorCount: Math.floor(Math.random() * 5)
    },
    
    recentPerformance: {
      last7Days: 0.65 + Math.random() * 0.3, // 65-95%
      last30Days: 0.6 + Math.random() * 0.3,
      trendDirection: ['improving', 'stable', 'declining'][Math.floor(Math.random() * 3)],
      strugglingTopics: ['advanced_concepts'],
      masteredTopics: ['basic_concepts']
    },
    
    environmentalFactors: {
      timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
      networkQuality: ['fast', 'medium', 'slow'][Math.floor(Math.random() * 3)],
      estimatedDistractions: Math.random() * 0.6
    },
    
    learningGoals: {
      shortTerm: ['improve_performance'],
      mediumTerm: ['master_current_level'],
      longTerm: ['advance_to_next_level'],
      priority: 'balanced'
    }
  }
}

// Generate insights about difficulty recommendations
function generateDifficultyInsights(
  recommendation: DifficultyRecommendation, 
  profile: any
): any {
  const insights = {
    performanceAnalysis: {
      currentLevel: profile.currentLevel,
      recommendedLevel: recommendation.recommendedLevel,
      adjustmentDirection: recommendation.recommendedLevel > profile.currentLevel ? 'increase' : 
                          recommendation.recommendedLevel < profile.currentLevel ? 'decrease' : 'maintain',
      adjustmentReason: recommendation.reasoning,
      confidence: recommendation.confidence
    },
    
    riskAssessment: {
      riskLevel: recommendation.riskLevel,
      potentialIssues: generatePotentialIssues(recommendation),
      mitigationStrategies: generateMitigationStrategies(recommendation),
      monitoringRequirements: recommendation.successCriteria
    },
    
    expectedOutcomes: {
      performanceImprovement: recommendation.expectedImprovement,
      engagementBoost: Math.min(0.3, recommendation.expectedImprovement * 0.8),
      learningVelocityChange: recommendation.adjustmentMagnitude * 0.1,
      retentionImpact: recommendation.expectedImprovement * 0.6
    },
    
    implementationGuidance: {
      bestTimeToApply: getBestApplicationTime(recommendation, profile),
      gradualVsImmediate: recommendation.adjustmentMagnitude > 1 ? 'gradual' : 'immediate',
      supportingActions: generateSupportingActions(recommendation),
      successIndicators: recommendation.successCriteria
    }
  }
  
  return insights
}

// Generate performance predictions
function generatePerformancePredictions(
  recommendation: DifficultyRecommendation,
  profile: any
): any {
  const currentPerformance = recommendation.currentPerformance
  const targetPerformance = recommendation.targetPerformance
  
  return {
    shortTerm: {
      timeframe: '5-10 minutes',
      expectedSuccessRate: Math.max(0.4, Math.min(0.9, targetPerformance)),
      expectedEngagement: Math.min(1, 0.7 + recommendation.expectedImprovement),
      expectedFrustration: Math.max(0, 0.3 - recommendation.expectedImprovement),
      confidence: recommendation.confidence * 0.8
    },
    
    mediumTerm: {
      timeframe: '1-3 learning sessions',
      expectedSuccessRate: Math.max(0.5, Math.min(0.85, targetPerformance + 0.1)),
      expectedSkillGrowth: recommendation.expectedImprovement * 1.5,
      expectedRetention: Math.min(0.9, 0.7 + recommendation.expectedImprovement),
      confidence: recommendation.confidence * 0.6
    },
    
    longTerm: {
      timeframe: '1-2 weeks',
      expectedLevelProgression: recommendation.adjustmentMagnitude > 0 ? 1.5 : 0.5,
      expectedMastery: Math.min(0.8, 0.5 + recommendation.expectedImprovement * 2),
      expectedMotivation: Math.min(1, 0.8 + recommendation.expectedImprovement),
      confidence: recommendation.confidence * 0.4
    }
  }
}

// Generate monitoring plan
function generateMonitoringPlan(recommendation: DifficultyRecommendation): any {
  return {
    monitoringPeriod: recommendation.monitoringPeriod,
    checkpoints: [
      {
        timepoint: '2 minutes',
        metrics: ['initial_reaction', 'engagement_level'],
        triggers: ['high_frustration', 'immediate_disengagement']
      },
      {
        timepoint: '5 minutes', 
        metrics: ['success_rate', 'attempt_patterns'],
        triggers: ['below_threshold_performance']
      },
      {
        timepoint: `${recommendation.monitoringPeriod} minutes`,
        metrics: ['overall_performance', 'satisfaction'],
        triggers: ['rollback_threshold_met']
      }
    ],
    
    automaticTriggers: {
      rollbackThreshold: recommendation.rollbackThreshold,
      escalationThreshold: 0.2, // 20% performance drop escalates to human review
      successThreshold: recommendation.targetPerformance,
      engagementThreshold: 0.6
    },
    
    dataCollection: [
      'success_rates',
      'time_to_completion',
      'help_requests',
      'user_feedback',
      'behavioral_indicators'
    ]
  }
}

// Calculate adjustment effectiveness
function calculateAdjustmentEffectiveness(adjustmentHistory: any[], recentPerformance: any[]): any {
  if (adjustmentHistory.length === 0) {
    return {
      overallEffectiveness: 0.7,
      successfulAdjustments: 0,
      totalAdjustments: 0,
      averageImprovement: 0,
      confidence: 0.3
    }
  }
  
  const successfulAdjustments = adjustmentHistory.filter(adj => adj.successfullyApplied).length
  const averageImprovement = adjustmentHistory.reduce((sum, adj) => 
    sum + (adj.successfullyApplied ? 0.1 : -0.05), 0) / adjustmentHistory.length
  
  return {
    overallEffectiveness: successfulAdjustments / adjustmentHistory.length,
    successfulAdjustments,
    totalAdjustments: adjustmentHistory.length,
    averageImprovement,
    confidence: Math.min(0.9, adjustmentHistory.length * 0.1),
    recentTrend: analyzeRecentTrend(adjustmentHistory.slice(-3))
  }
}

// Analyze if rollback is needed
function analyzeRollbackNeed(profile: any, recentPerformance: any[], monitoringData: any): any {
  const lastAdjustment = profile.adjustmentHistory[profile.adjustmentHistory.length - 1]
  if (!lastAdjustment) {
    return { rollbackNeeded: false, confidence: 0.9 }
  }
  
  // Calculate performance drop since adjustment
  const preAdjustmentPerformance = 0.7 // Assumed baseline
  const currentPerformance = recentPerformance.length > 0 ? 
    recentPerformance.filter(p => p.success).length / recentPerformance.length : preAdjustmentPerformance
  
  const performanceDrop = preAdjustmentPerformance - currentPerformance
  const rollbackThreshold = 0.3 // 30% drop
  
  const rollbackNeeded = performanceDrop > rollbackThreshold
  
  return {
    rollbackNeeded,
    performanceDrop,
    rollbackThreshold,
    confidence: rollbackNeeded ? 0.8 : 0.6,
    recommendation: rollbackNeeded ? 'immediate_rollback' : 'continue_monitoring',
    reasoning: rollbackNeeded ? 
      `Performance dropped by ${Math.round(performanceDrop * 100)}%, exceeding threshold` :
      'Performance within acceptable range'
  }
}

// Helper functions
function generatePotentialIssues(recommendation: DifficultyRecommendation): string[] {
  const issues = []
  
  if (recommendation.riskLevel === 'high') {
    issues.push('Large adjustment may cause disorientation')
    issues.push('User may become frustrated or disengaged')
  }
  
  if (recommendation.confidence < 0.6) {
    issues.push('Low confidence in recommendation accuracy')
  }
  
  if (recommendation.adjustmentMagnitude > 1) {
    issues.push('Multi-level jump may disrupt learning flow')
  }
  
  return issues
}

function generateMitigationStrategies(recommendation: DifficultyRecommendation): string[] {
  const strategies = []
  
  if (recommendation.riskLevel === 'high') {
    strategies.push('Implement gradual difficulty progression')
    strategies.push('Provide additional support and guidance')
    strategies.push('Monitor closely for early warning signs')
  }
  
  if (recommendation.adjustmentMagnitude > 1) {
    strategies.push('Break adjustment into smaller steps')
    strategies.push('Provide bridging content')
  }
  
  strategies.push('Maintain easy rollback option')
  strategies.push('Collect continuous feedback')
  
  return strategies
}

function getBestApplicationTime(recommendation: DifficultyRecommendation, profile: any): string {
  if (recommendation.urgency === 'high') return 'immediately'
  if (recommendation.urgency === 'medium') return 'within_current_session'
  return 'next_session_start'
}

function generateSupportingActions(recommendation: DifficultyRecommendation): string[] {
  const actions = []
  
  if (recommendation.recommendedLevel > 5) {
    actions.push('Provide additional examples and explanations')
    actions.push('Enable hint system')
  }
  
  if (recommendation.recommendedLevel < 5) {
    actions.push('Add encouraging feedback')
    actions.push('Include more practice opportunities')
  }
  
  actions.push('Monitor engagement closely')
  actions.push('Be ready to adjust further if needed')
  
  return actions
}

function analyzeRecentTrend(recentAdjustments: any[]): string {
  if (recentAdjustments.length < 2) return 'insufficient_data'
  
  const successCount = recentAdjustments.filter(adj => adj.successfullyApplied).length
  const successRate = successCount / recentAdjustments.length
  
  if (successRate > 0.7) return 'improving'
  if (successRate < 0.4) return 'declining'
  return 'stable'
}

function generateMonitoringInsights(effectiveness: any, rollbackAnalysis: any, profile: any): any {
  return {
    systemPerformance: {
      adjustmentAccuracy: effectiveness.overallEffectiveness,
      predictionQuality: effectiveness.confidence,
      userSatisfaction: Math.max(0.4, 1 - rollbackAnalysis.performanceDrop),
      systemReliability: Math.min(0.9, effectiveness.totalAdjustments * 0.05 + 0.5)
    },
    
    userProgress: {
      learningVelocity: profile.improvementRate || 0.05,
      skillDevelopment: effectiveness.averageImprovement,
      engagementLevel: Math.max(0.3, 0.8 - rollbackAnalysis.performanceDrop),
      difficultyComfort: 1 - Math.abs(profile.currentLevel - profile.optimalLevel) / 10
    },
    
    systemOptimization: {
      recommendedTuning: effectiveness.overallEffectiveness < 0.6 ? 'increase_conservatism' : 'maintain',
      dataQuality: Math.min(1, profile.adjustmentHistory.length * 0.1),
      modelConfidence: effectiveness.confidence,
      improvementOpportunities: generateImprovementOpportunities(effectiveness, rollbackAnalysis)
    }
  }
}

function generateMonitoringRecommendations(effectiveness: any, rollbackAnalysis: any): string[] {
  const recommendations = []
  
  if (rollbackAnalysis.rollbackNeeded) {
    recommendations.push('Execute immediate rollback to previous difficulty level')
    recommendations.push('Investigate causes of performance degradation')
  }
  
  if (effectiveness.overallEffectiveness < 0.5) {
    recommendations.push('Review and refine difficulty adjustment algorithms')
    recommendations.push('Increase monitoring frequency for future adjustments')
  }
  
  if (effectiveness.confidence < 0.6) {
    recommendations.push('Collect more performance data before next adjustment')
    recommendations.push('Consider more conservative adjustment approach')
  }
  
  recommendations.push('Continue monitoring user engagement and satisfaction')
  
  return recommendations
}

function generateImprovementOpportunities(effectiveness: any, rollbackAnalysis: any): string[] {
  const opportunities = []
  
  if (effectiveness.averageImprovement < 0.05) {
    opportunities.push('Enhance performance prediction models')
  }
  
  if (rollbackAnalysis.performanceDrop > 0.1) {
    opportunities.push('Improve risk assessment algorithms')
  }
  
  opportunities.push('Integrate more contextual factors into decision making')
  opportunities.push('Develop more granular difficulty adjustment options')
  
  return opportunities
}
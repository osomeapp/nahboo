import { NextRequest, NextResponse } from 'next/server'
import { 
  learningStyleEngine, 
  getStyleDescription, 
  getStyleIcon, 
  getStyleColor,
  type LearningStyleProfile,
  type ContentStyleAnalysis 
} from '@/lib/learning-style-engine'
import type { UserProfile, ContentItem } from '@/types'
import type { PerformancePoint } from '@/lib/difficulty-engine'

export const maxDuration = 30

interface LearningStyleRequest {
  userId: string
  userProfile: UserProfile
  action: 'detect' | 'analyze_content' | 'get_profile' | 'update_effectiveness'
  
  // For detection
  interactionData?: any[]
  performanceData?: PerformancePoint[]
  
  // For content analysis
  contentId?: string
  content?: ContentItem
  
  // For effectiveness updates
  adaptationType?: string
  effectiveness?: number
  userFeedback?: any
}

export async function POST(request: NextRequest) {
  try {
    const body: LearningStyleRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    switch (body.action) {
      case 'detect':
        return await handleDetectionRequest(body)
      case 'analyze_content':
        return await handleContentAnalysisRequest(body)
      case 'get_profile':
        return await handleGetProfileRequest(body)
      case 'update_effectiveness':
        return await handleEffectivenessUpdateRequest(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: detect, analyze_content, get_profile, or update_effectiveness' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Learning style detection error:', error)
    return NextResponse.json(
      { error: 'Failed to process learning style request' },
      { status: 500 }
    )
  }
}

// Handle learning style detection
async function handleDetectionRequest(body: LearningStyleRequest): Promise<NextResponse> {
  if (!body.interactionData && !body.performanceData) {
    return NextResponse.json(
      { error: 'Either interactionData or performanceData is required for detection' },
      { status: 400 }
    )
  }
  
  const interactionData = body.interactionData || generateMockInteractionData(body.userId)
  const performanceData = body.performanceData || generateMockPerformanceData(body.userId)
  
  // Detect learning style
  const styleProfile = await learningStyleEngine.detectLearningStyle(
    body.userId,
    body.userProfile,
    interactionData,
    performanceData
  )
  
  // Generate insights about the detected style
  const insights = generateStyleInsights(styleProfile)
  
  // Generate learning recommendations
  const recommendations = generateLearningRecommendations(styleProfile, body.userProfile)
  
  // Calculate confidence metrics
  const confidenceMetrics = calculateConfidenceMetrics(styleProfile, interactionData.length)
  
  return NextResponse.json({
    success: true,
    action: 'detect',
    styleProfile,
    insights,
    recommendations,
    confidenceMetrics,
    styleDescription: {
      primary: {
        style: styleProfile.primaryStyle,
        description: getStyleDescription(styleProfile.primaryStyle),
        icon: getStyleIcon(styleProfile.primaryStyle),
        color: getStyleColor(styleProfile.primaryStyle)
      },
      secondary: styleProfile.secondaryStyle ? {
        style: styleProfile.secondaryStyle,
        description: getStyleDescription(styleProfile.secondaryStyle),
        icon: getStyleIcon(styleProfile.secondaryStyle),
        color: getStyleColor(styleProfile.secondaryStyle)
      } : null
    },
    metadata: {
      dataPointsAnalyzed: interactionData.length + performanceData.length,
      detectionConfidence: styleProfile.detectionConfidence,
      profileCompleteness: calculateProfileCompleteness(styleProfile),
      generatedAt: new Date().toISOString()
    }
  })
}

// Handle content style analysis
async function handleContentAnalysisRequest(body: LearningStyleRequest): Promise<NextResponse> {
  if (!body.contentId || !body.content) {
    return NextResponse.json(
      { error: 'contentId and content are required for content analysis' },
      { status: 400 }
    )
  }
  
  // Get user's learning style profile
  let styleProfile = await learningStyleEngine.getLearningStyleProfile(body.userId)
  
  // If no profile exists, create a basic one
  if (!styleProfile) {
    const mockInteractionData = generateMockInteractionData(body.userId)
    const mockPerformanceData = generateMockPerformanceData(body.userId)
    
    styleProfile = await learningStyleEngine.detectLearningStyle(
      body.userId,
      body.userProfile,
      mockInteractionData,
      mockPerformanceData
    )
  }
  
  // Analyze content style match
  const contentAnalysis = await learningStyleEngine.analyzeContentStyleMatch(
    body.contentId,
    body.content,
    styleProfile
  )
  
  // Generate adaptation priority
  const adaptationPriority = calculateAdaptationPriority(contentAnalysis, styleProfile)
  
  // Estimate learning effectiveness
  const effectivenessEstimate = estimateLearningEffectiveness(contentAnalysis, styleProfile)
  
  return NextResponse.json({
    success: true,
    action: 'analyze_content',
    contentAnalysis,
    adaptationPriority,
    effectivenessEstimate,
    implementationPlan: generateImplementationPlan(contentAnalysis),
    metadata: {
      contentId: body.contentId,
      styleMatch: contentAnalysis.styleMatch,
      adaptationCount: contentAnalysis.adaptationRecommendations.length,
      userPrimaryStyle: styleProfile.primaryStyle,
      generatedAt: new Date().toISOString()
    }
  })
}

// Handle getting existing profile
async function handleGetProfileRequest(body: LearningStyleRequest): Promise<NextResponse> {
  const styleProfile = await learningStyleEngine.getLearningStyleProfile(body.userId)
  
  if (!styleProfile) {
    return NextResponse.json({
      success: true,
      action: 'get_profile',
      profileExists: false,
      message: 'No learning style profile found. Run detection first.',
      metadata: {
        userId: body.userId,
        generatedAt: new Date().toISOString()
      }
    })
  }
  
  // Generate current insights
  const currentInsights = generateStyleInsights(styleProfile)
  const progressMetrics = calculateLearningProgress(styleProfile)
  
  return NextResponse.json({
    success: true,
    action: 'get_profile',
    profileExists: true,
    styleProfile,
    currentInsights,
    progressMetrics,
    styleDescription: {
      primary: {
        style: styleProfile.primaryStyle,
        description: getStyleDescription(styleProfile.primaryStyle),
        icon: getStyleIcon(styleProfile.primaryStyle),
        color: getStyleColor(styleProfile.primaryStyle)
      },
      secondary: styleProfile.secondaryStyle ? {
        style: styleProfile.secondaryStyle,
        description: getStyleDescription(styleProfile.secondaryStyle),
        icon: getStyleIcon(styleProfile.secondaryStyle),
        color: getStyleColor(styleProfile.secondaryStyle)
      } : null
    },
    metadata: {
      lastUpdated: styleProfile.lastUpdated,
      dataPoints: styleProfile.dataPoints,
      detectionConfidence: styleProfile.detectionConfidence,
      generatedAt: new Date().toISOString()
    }
  })
}

// Handle effectiveness updates
async function handleEffectivenessUpdateRequest(body: LearningStyleRequest): Promise<NextResponse> {
  if (!body.adaptationType || body.effectiveness === undefined) {
    return NextResponse.json(
      { error: 'adaptationType and effectiveness are required for effectiveness updates' },
      { status: 400 }
    )
  }
  
  // Update effectiveness
  learningStyleEngine.updateAdaptationEffectiveness(
    body.userId,
    body.adaptationType,
    body.effectiveness,
    body.userFeedback
  )
  
  // Get updated profile
  const updatedProfile = await learningStyleEngine.getLearningStyleProfile(body.userId)
  
  if (!updatedProfile) {
    return NextResponse.json(
      { error: 'Failed to retrieve updated profile' },
      { status: 500 }
    )
  }
  
  // Generate updated insights
  const updatedInsights = generateEffectivenessInsights(updatedProfile, body.adaptationType, body.effectiveness)
  
  return NextResponse.json({
    success: true,
    action: 'update_effectiveness',
    updatedProfile,
    updatedInsights,
    effectivenessMetrics: {
      adaptationType: body.adaptationType,
      newEffectiveness: body.effectiveness,
      overallSuccess: updatedProfile.effectiveness.adaptationSuccessRate,
      userSatisfaction: updatedProfile.effectiveness.userSatisfaction
    },
    metadata: {
      userId: body.userId,
      adaptationType: body.adaptationType,
      updatedAt: new Date().toISOString()
    }
  })
}

// Generate mock interaction data for testing
function generateMockInteractionData(userId: string): any[] {
  const interactions = []
  const interactionTypes = [
    'video_play', 'video_pause', 'quiz_attempt', 'text_selection', 'image_view',
    'audio_play', 'interactive_element', 'scroll', 'click', 'pause'
  ]
  
  // Generate 25-40 mock interactions
  const interactionCount = Math.floor(Math.random() * 15) + 25
  
  for (let i = 0; i < interactionCount; i++) {
    const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)]
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
    
    interactions.push({
      id: `interaction_${i}`,
      userId,
      type,
      timestamp: timestamp.toISOString(),
      content_type: ['video', 'quiz', 'text', 'interactive'][Math.floor(Math.random() * 4)],
      timeSpent: Math.floor(Math.random() * 600) + 30, // 30 seconds to 10 minutes
      success: Math.random() > 0.3, // 70% success rate
      engagementLevel: Math.random(),
      scrollBehavior: {
        totalScrolls: Math.floor(Math.random() * 50),
        averageScrollSpeed: Math.random() * 2,
        backScrollEvents: Math.floor(Math.random() * 10),
        scrollCompletionRate: Math.random()
      },
      clickPatterns: generateMockClickPatterns(),
      pauseEvents: generateMockPauseEvents()
    })
  }
  
  return interactions
}

function generateMockPerformanceData(userId: string): PerformancePoint[] {
  const performanceData = []
  const count = Math.floor(Math.random() * 10) + 15 // 15-25 performance points
  
  for (let i = 0; i < count; i++) {
    const timestamp = new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Last 14 days
    
    performanceData.push({
      timestamp,
      contentId: `content_${i % 8}`,
      difficultyLevel: Math.floor(Math.random() * 7) + 2, // 2-8
      success: Math.random() > 0.25, // 75% success rate
      attempts: Math.floor(Math.random() * 4) + 1, // 1-4 attempts
      timeSpent: Math.floor(Math.random() * 400) + 60, // 1-7 minutes
      score: Math.random(),
      contextFactors: {
        timeOfDay: timestamp.getHours() < 12 ? 'morning' : 
                   timestamp.getHours() < 17 ? 'afternoon' : 'evening',
        sessionDuration: Math.floor(Math.random() * 120) + 10, // 10-130 minutes
        deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
        distractionLevel: Math.random() * 0.6
      }
    })
  }
  
  return performanceData
}

function generateMockClickPatterns(): any[] {
  const clickCount = Math.floor(Math.random() * 20) + 5
  const patterns = []
  
  for (let i = 0; i < clickCount; i++) {
    patterns.push({
      timestamp: new Date().toISOString(),
      elementType: ['button', 'img', 'video', 'text', 'input'][Math.floor(Math.random() * 5)],
      clickCount: Math.floor(Math.random() * 3) + 1,
      doubleClicks: Math.random() > 0.8 ? 1 : 0,
      rightClicks: Math.random() > 0.9 ? 1 : 0,
      position: {
        x: Math.floor(Math.random() * 1200),
        y: Math.floor(Math.random() * 800)
      }
    })
  }
  
  return patterns
}

function generateMockPauseEvents(): any[] {
  const pauseCount = Math.floor(Math.random() * 8) + 2
  const events = []
  
  for (let i = 0; i < pauseCount; i++) {
    events.push({
      timestamp: new Date().toISOString(),
      duration: Math.floor(Math.random() * 120) + 5, // 5-125 seconds
      location: `section_${i % 4}`,
      resumedTo: `section_${(i + 1) % 4}`
    })
  }
  
  return events
}

// Generate insights about detected learning style
function generateStyleInsights(profile: LearningStyleProfile): any {
  const scores = {
    visual: profile.visualScore,
    auditory: profile.auditoryScore,
    kinesthetic: profile.kinestheticScore,
    reading: profile.readingScore
  }
  
  const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1])
  const dominantStyle = sortedScores[0]
  const secondaryStyle = sortedScores[1]
  
  return {
    primaryInsight: {
      style: dominantStyle[0],
      strength: dominantStyle[1],
      description: `You have a ${dominantStyle[1] > 0.7 ? 'strong' : 'moderate'} preference for ${dominantStyle[0]} learning`,
      recommendation: getStyleSpecificRecommendation(dominantStyle[0])
    },
    
    secondaryInsight: secondaryStyle[1] > 0.4 ? {
      style: secondaryStyle[0],
      strength: secondaryStyle[1],
      description: `You also benefit from ${secondaryStyle[0]} learning approaches`,
      recommendation: getStyleSpecificRecommendation(secondaryStyle[0])
    } : null,
    
    balanceAnalysis: {
      isMultimodal: profile.primaryStyle === 'multimodal' || 
                   Object.values(scores).filter(score => score > 0.4).length >= 3,
      dominanceLevel: dominantStyle[1] - secondaryStyle[1],
      flexibility: 1 - (dominantStyle[1] - 0.25), // How flexible the learner is
      adaptability: Math.min(...Object.values(scores)) // Minimum score indicates adaptability
    },
    
    learningOptimization: {
      contentFormatPreferences: getContentFormatPreferences(scores),
      environmentalNeeds: getEnvironmentalNeeds(profile.preferences),
      pacingRecommendations: getPacingRecommendations(profile.preferences),
      interactionStyle: getInteractionStyleRecommendations(profile.preferences)
    },
    
    growthOpportunities: {
      styleToStrengthen: sortedScores[sortedScores.length - 1][0],
      currentWeakness: sortedScores[sortedScores.length - 1][1],
      growthPotential: 1 - sortedScores[sortedScores.length - 1][1],
      recommendedActivities: getGrowthActivities(sortedScores[sortedScores.length - 1][0])
    }
  }
}

// Generate learning recommendations based on style
function generateLearningRecommendations(profile: LearningStyleProfile, userProfile: UserProfile): any {
  const recommendations = {
    immediate: [],
    contentStrategy: {},
    studyTechniques: [],
    environmentalOptimization: {},
    progressTracking: {}
  }
  
  // Immediate recommendations based on primary style
  const primaryStyle = profile.primaryStyle
  
  if (primaryStyle === 'visual' || profile.visualScore > 0.6) {
    recommendations.immediate.push({
      type: 'content_format',
      action: 'Prioritize visual content',
      description: 'Focus on videos, diagrams, and image-rich materials',
      impact: 'high',
      ease: 'easy'
    })
  }
  
  if (primaryStyle === 'auditory' || profile.auditoryScore > 0.6) {
    recommendations.immediate.push({
      type: 'content_format',
      action: 'Include audio elements',
      description: 'Use audio explanations, discussions, and verbal instructions',
      impact: 'high',
      ease: 'easy'
    })
  }
  
  if (primaryStyle === 'kinesthetic' || profile.kinestheticScore > 0.6) {
    recommendations.immediate.push({
      type: 'interaction_style',
      action: 'Increase hands-on activities',
      description: 'Include interactive exercises, practice problems, and experiments',
      impact: 'high',
      ease: 'moderate'
    })
  }
  
  if (primaryStyle === 'reading' || profile.readingScore > 0.6) {
    recommendations.immediate.push({
      type: 'content_format',
      action: 'Provide comprehensive text materials',
      description: 'Include detailed written explanations and note-taking opportunities',
      impact: 'high',
      ease: 'easy'
    })
  }
  
  // Content strategy
  recommendations.contentStrategy = {
    primaryFormat: getOptimalContentFormat(profile),
    supportingFormats: getSupportingContentFormats(profile),
    sequencing: getOptimalContentSequencing(profile),
    repetitionStrategy: getRepetitionStrategy(profile.preferences)
  }
  
  // Study techniques
  recommendations.studyTechniques = getPersonalizedStudyTechniques(profile, userProfile)
  
  // Environmental optimization
  recommendations.environmentalOptimization = {
    quietness: profile.preferences.prefersQuietEnvironment > 0.6 ? 'required' : 'optional',
    structure: profile.preferences.prefersStructuredContent > 0.6 ? 'high' : 'moderate',
    pacing: profile.preferences.prefersSelfPaced > 0.6 ? 'self_directed' : 'guided',
    breaks: calculateOptimalBreakPattern(profile.preferences)
  }
  
  // Progress tracking
  recommendations.progressTracking = {
    metrics: getRelevantMetrics(profile),
    frequency: getOptimalTrackingFrequency(profile.preferences),
    feedbackStyle: getOptimalFeedbackStyle(profile)
  }
  
  return recommendations
}

// Helper functions for recommendations
function getStyleSpecificRecommendation(style: string): string {
  const recommendations = {
    visual: 'Use mind maps, diagrams, and color-coding to organize information',
    auditory: 'Read aloud, use mnemonics, and engage in discussions',
    kinesthetic: 'Take breaks to move, use hands-on activities, and practice frequently',
    reading: 'Take detailed notes, create written summaries, and use text-based resources'
  }
  return recommendations[style] || 'Experiment with different learning approaches'
}

function getContentFormatPreferences(scores: Record<string, number>): string[] {
  const preferences = []
  if (scores.visual > 0.5) preferences.push('videos', 'infographics', 'diagrams')
  if (scores.auditory > 0.5) preferences.push('audio_explanations', 'podcasts', 'discussions')
  if (scores.kinesthetic > 0.5) preferences.push('interactive_exercises', 'simulations', 'practice_problems')
  if (scores.reading > 0.5) preferences.push('articles', 'books', 'written_summaries')
  return preferences
}

function getEnvironmentalNeeds(preferences: any): Record<string, string> {
  return {
    noise_level: preferences.prefersQuietEnvironment > 0.6 ? 'quiet' : 'moderate',
    structure: preferences.prefersStructuredContent > 0.6 ? 'organized' : 'flexible',
    exploration: preferences.prefersExploratoryLearning > 0.6 ? 'self_discovery' : 'guided'
  }
}

function getPacingRecommendations(preferences: any): Record<string, any> {
  return {
    speed: preferences.prefersDetails > 0.6 ? 'slow_thorough' : 'moderate',
    breaks: preferences.prefersRepetition > 0.6 ? 'frequent_short' : 'occasional_longer',
    feedback: preferences.prefersImmediateFeedback > 0.6 ? 'immediate' : 'delayed'
  }
}

function getInteractionStyleRecommendations(preferences: any): Record<string, string> {
  return {
    autonomy: preferences.prefersSelfPaced > 0.6 ? 'independent' : 'guided',
    collaboration: preferences.prefersCollaborative > 0.6 ? 'group_preferred' : 'individual_preferred',
    variety: preferences.prefersVariety > 0.6 ? 'diverse_activities' : 'consistent_approach'
  }
}

function getGrowthActivities(weakStyle: string): string[] {
  const activities = {
    visual: ['Practice creating mind maps', 'Use color-coding systems', 'Draw diagrams while learning'],
    auditory: ['Read content aloud', 'Join study groups', 'Use audio recordings'],
    kinesthetic: ['Take notes by hand', 'Use fidget tools while studying', 'Practice with physical objects'],
    reading: ['Create written summaries', 'Keep a learning journal', 'Practice speed reading']
  }
  return activities[weakStyle] || ['Try different learning approaches']
}

function calculateConfidenceMetrics(profile: LearningStyleProfile, dataPoints: number): any {
  return {
    detectionConfidence: profile.detectionConfidence,
    dataQuality: Math.min(1, dataPoints / 30), // High quality after 30+ interactions
    profileStability: profile.dataPoints > 50 ? 0.9 : profile.dataPoints / 50,
    adaptationReadiness: profile.detectionConfidence > 0.7 && profile.dataPoints > 15,
    recommendationStrength: profile.detectionConfidence * Math.min(1, dataPoints / 20)
  }
}

function calculateProfileCompleteness(profile: LearningStyleProfile): number {
  let completeness = 0
  
  // Style detection completeness
  completeness += profile.detectionConfidence * 0.4
  
  // Data richness
  completeness += Math.min(1, profile.dataPoints / 50) * 0.3
  
  // Method diversity
  completeness += Math.min(1, profile.detectionMethods.length / 4) * 0.2
  
  // Effectiveness data
  const effectivenessSum = profile.effectiveness.visualEffectiveness + 
                          profile.effectiveness.auditoryEffectiveness +
                          profile.effectiveness.kinestheticEffectiveness + 
                          profile.effectiveness.readingEffectiveness
  completeness += Math.min(1, effectivenessSum / 2) * 0.1
  
  return Math.min(1, completeness)
}

function calculateAdaptationPriority(analysis: ContentStyleAnalysis, profile: LearningStyleProfile): any {
  return {
    urgency: analysis.styleMatch < 0.4 ? 'high' : analysis.styleMatch < 0.7 ? 'medium' : 'low',
    recommendations: analysis.adaptationRecommendations.map(rec => ({
      ...rec,
      priority: rec.confidence > 0.8 ? 'high' : rec.confidence > 0.6 ? 'medium' : 'low',
      effort_vs_impact: rec.expectedImprovement / (rec.implementation.effort === 'minimal' ? 1 : 
                                                   rec.implementation.effort === 'moderate' ? 2 : 3)
    })).sort((a, b) => b.effort_vs_impact - a.effort_vs_impact)
  }
}

function estimateLearningEffectiveness(analysis: ContentStyleAnalysis, profile: LearningStyleProfile): any {
  const baseEffectiveness = analysis.styleMatch
  const adaptationPotential = analysis.adaptationRecommendations.reduce((sum, rec) => 
    sum + rec.expectedImprovement, 0)
  
  return {
    current: baseEffectiveness,
    potential: Math.min(1, baseEffectiveness + adaptationPotential),
    improvement: adaptationPotential,
    confidence: profile.detectionConfidence,
    timeToImprovement: analysis.adaptationRecommendations.length * 2 // Rough estimate in days
  }
}

function generateImplementationPlan(analysis: ContentStyleAnalysis): any {
  const plan = {
    phases: [],
    timeline: 'immediate',
    resources: [],
    success_metrics: []
  }
  
  const sortedRecs = analysis.adaptationRecommendations.sort((a, b) => 
    b.expectedImprovement - a.expectedImprovement)
  
  sortedRecs.forEach((rec, index) => {
    plan.phases.push({
      phase: index + 1,
      adaptation: rec.adaptationType,
      description: rec.implementation.changes[0]?.description || 'Apply adaptation',
      effort: rec.implementation.effort,
      timeline: rec.implementation.effort === 'minimal' ? 'immediate' : 
               rec.implementation.effort === 'moderate' ? '1-2 days' : '3-5 days'
    })
  })
  
  return plan
}

function generateEffectivenessInsights(profile: LearningStyleProfile, adaptationType: string, effectiveness: number): any {
  return {
    adaptationPerformance: {
      type: adaptationType,
      effectiveness,
      trend: effectiveness > 0.6 ? 'positive' : effectiveness < 0.4 ? 'negative' : 'neutral',
      recommendation: effectiveness > 0.6 ? 'continue_using' : 'modify_approach'
    },
    
    overallProgress: {
      successRate: profile.effectiveness.adaptationSuccessRate,
      userSatisfaction: profile.effectiveness.userSatisfaction,
      improvement: profile.effectiveness.learningImprovment,
      trend: profile.effectiveness.adaptationSuccessRate > 0.7 ? 'improving' : 'stable'
    },
    
    styleEvolution: {
      primaryStyle: profile.primaryStyle,
      confidence: profile.detectionConfidence,
      stability: profile.dataPoints > 50 ? 'stable' : 'developing',
      nextRecommendation: generateNextAdaptationRecommendation(profile, effectiveness)
    }
  }
}

function generateNextAdaptationRecommendation(profile: LearningStyleProfile, lastEffectiveness: number): string {
  if (lastEffectiveness > 0.8) {
    return 'Continue with current approach and gradually increase complexity'
  } else if (lastEffectiveness > 0.6) {
    return 'Fine-tune current adaptations for better alignment'
  } else if (lastEffectiveness > 0.4) {
    return 'Try alternative adaptation approaches for your learning style'
  } else {
    return 'Re-evaluate learning style detection and consider different strategies'
  }
}

function calculateLearningProgress(profile: LearningStyleProfile): any {
  return {
    styleConfidence: profile.detectionConfidence,
    adaptationExperience: profile.adaptationHistory.length,
    effectivenessGrowth: profile.effectiveness.learningImprovment,
    dataRichness: Math.min(1, profile.dataPoints / 100),
    overallMaturity: (profile.detectionConfidence + 
                     Math.min(1, profile.dataPoints / 50) +
                     profile.effectiveness.adaptationSuccessRate) / 3
  }
}

function getOptimalContentFormat(profile: LearningStyleProfile): string {
  const scores = {
    visual: profile.visualScore,
    auditory: profile.auditoryScore,
    kinesthetic: profile.kinestheticScore,
    reading: profile.readingScore
  }
  
  const maxScore = Math.max(...Object.values(scores))
  const format = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0]
  
  return format || 'multimodal'
}

function getSupportingContentFormats(profile: LearningStyleProfile): string[] {
  const scores = {
    visual: profile.visualScore,
    auditory: profile.auditoryScore,
    kinesthetic: profile.kinestheticScore,
    reading: profile.readingScore
  }
  
  return Object.entries(scores)
    .filter(([_, score]) => score > 0.4)
    .sort((a, b) => b[1] - a[1])
    .slice(1, 3) // Get 2nd and 3rd highest
    .map(([style, _]) => style)
}

function getOptimalContentSequencing(profile: LearningStyleProfile): string {
  if (profile.preferences.prefersStructuredContent > 0.7) return 'linear_progression'
  if (profile.preferences.prefersExploratoryLearning > 0.7) return 'branching_exploration'
  return 'adaptive_mixed'
}

function getRepetitionStrategy(preferences: any): string {
  if (preferences.prefersRepetition > 0.7) return 'spaced_repetition'
  if (preferences.prefersVariety > 0.7) return 'varied_practice'
  return 'balanced_approach'
}

function getPersonalizedStudyTechniques(profile: LearningStyleProfile, userProfile: UserProfile): string[] {
  const techniques = []
  
  if (profile.visualScore > 0.6) {
    techniques.push('Create visual mind maps', 'Use color-coded notes', 'Draw concept diagrams')
  }
  
  if (profile.auditoryScore > 0.6) {
    techniques.push('Record and replay lessons', 'Study with background music', 'Use verbal mnemonics')
  }
  
  if (profile.kinestheticScore > 0.6) {
    techniques.push('Take frequent movement breaks', 'Use hands-on practice', 'Study while walking')
  }
  
  if (profile.readingScore > 0.6) {
    techniques.push('Take detailed written notes', 'Create text summaries', 'Use flashcards')
  }
  
  return techniques
}

function calculateOptimalBreakPattern(preferences: any): Record<string, any> {
  const intensity = preferences.prefersDetails > 0.6 ? 'high' : 'moderate'
  const frequency = preferences.prefersRepetition > 0.6 ? 'frequent' : 'moderate'
  
  return {
    intensity,
    frequency,
    duration: intensity === 'high' ? '10-15 minutes' : '5-10 minutes',
    interval: frequency === 'frequent' ? '25-30 minutes' : '45-60 minutes'
  }
}

function getRelevantMetrics(profile: LearningStyleProfile): string[] {
  const metrics = ['completion_rate', 'engagement_level']
  
  if (profile.primaryStyle === 'kinesthetic') metrics.push('interaction_frequency')
  if (profile.primaryStyle === 'visual') metrics.push('visual_content_preference')
  if (profile.primaryStyle === 'auditory') metrics.push('audio_engagement')
  if (profile.primaryStyle === 'reading') metrics.push('reading_comprehension')
  
  return metrics
}

function getOptimalTrackingFrequency(preferences: any): string {
  if (preferences.prefersImmediateFeedback > 0.7) return 'real_time'
  if (preferences.prefersSelfPaced > 0.7) return 'weekly'
  return 'daily'
}

function getOptimalFeedbackStyle(profile: LearningStyleProfile): string {
  if (profile.visualScore > 0.6) return 'visual_progress_charts'
  if (profile.auditoryScore > 0.6) return 'audio_summaries'
  if (profile.kinestheticScore > 0.6) return 'interactive_feedback'
  return 'text_based_reports'
}
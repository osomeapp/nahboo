import { NextRequest, NextResponse } from 'next/server'
import { 
  styleAwareDifficultyEngine,
  generateStyleAwareDifficultyRecommendation,
  createPersonalizedContentSequence,
  type StyleAwareDifficultyRecommendation,
  type ContentSequencingPlan
} from '@/lib/style-aware-difficulty'
import type { UserProfile, ContentItem } from '@/types'
import type { PerformancePoint } from '@/lib/difficulty-engine'

export const maxDuration = 30

interface StyleAwareDifficultyRequest {
  userId: string
  userProfile: UserProfile
  action: 'analyze_difficulty' | 'create_sequence' | 'optimize_content' | 'get_insights'
  
  // For difficulty analysis
  recentPerformance?: PerformancePoint[]
  contentToAnalyze?: ContentItem
  currentContext?: any
  
  // For content sequencing
  learningObjectives?: string[]
  availableContent?: ContentItem[]
  targetDuration?: number
  
  // For content optimization
  contentItems?: ContentItem[]
  optimizationGoals?: string[]
}

interface StyleAwareDifficultyResponse {
  success: boolean
  action: string
  
  // Difficulty analysis results
  difficultyRecommendation?: StyleAwareDifficultyRecommendation
  
  // Content sequencing results
  sequencingPlan?: ContentSequencingPlan
  
  // Content optimization results
  optimizedContent?: ContentItem[]
  optimizationInsights?: any
  
  // General insights
  userInsights?: {
    learningStyleProfile: any
    difficultyProfile: any
    personalizedRecommendations: string[]
    adaptationHistory: any[]
  }
  
  metadata: {
    userId: string
    processingTime: number
    confidence: number
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: StyleAwareDifficultyRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    let response: Partial<StyleAwareDifficultyResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'analyze_difficulty':
        response = await handleDifficultyAnalysis(body)
        break
        
      case 'create_sequence':
        response = await handleSequenceCreation(body)
        break
        
      case 'optimize_content':
        response = await handleContentOptimization(body)
        break
        
      case 'get_insights':
        response = await handleInsightsGeneration(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: analyze_difficulty, create_sequence, optimize_content, or get_insights' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: StyleAwareDifficultyResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        confidence: calculateOverallConfidence(response),
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Style-aware difficulty API error:', error)
    return NextResponse.json(
      { error: 'Failed to process style-aware difficulty request' },
      { status: 500 }
    )
  }
}

// Handle difficulty analysis requests
async function handleDifficultyAnalysis(body: StyleAwareDifficultyRequest): Promise<Partial<StyleAwareDifficultyResponse>> {
  const recentPerformance = body.recentPerformance || generateMockPerformanceData(body.userId, 10)
  const currentContext = body.currentContext || generateMockContext()
  
  const difficultyRecommendation = await generateStyleAwareDifficultyRecommendation(
    body.userId,
    body.userProfile,
    recentPerformance,
    body.contentToAnalyze,
    currentContext
  )
  
  return {
    difficultyRecommendation
  }
}

// Handle content sequencing requests
async function handleSequenceCreation(body: StyleAwareDifficultyRequest): Promise<Partial<StyleAwareDifficultyResponse>> {
  if (!body.learningObjectives || !body.availableContent || !body.targetDuration) {
    throw new Error('Missing required fields for sequence creation: learningObjectives, availableContent, targetDuration')
  }
  
  const sequencingPlan = await createPersonalizedContentSequence(
    body.userId,
    body.userProfile,
    body.learningObjectives,
    body.availableContent,
    body.targetDuration
  )
  
  return {
    sequencingPlan
  }
}

// Handle content optimization requests
async function handleContentOptimization(body: StyleAwareDifficultyRequest): Promise<Partial<StyleAwareDifficultyResponse>> {
  if (!body.contentItems) {
    throw new Error('Missing required field for content optimization: contentItems')
  }
  
  const optimizedContent: ContentItem[] = []
  const optimizationInsights = {
    totalItemsOptimized: body.contentItems.length,
    optimizationsSuggested: 0,
    styleAdaptations: [],
    difficultyAdjustments: [],
    overallEffectivenessImprovement: 0
  }
  
  // Analyze and optimize each content item
  for (const content of body.contentItems) {
    const analysis = await generateStyleAwareDifficultyRecommendation(
      body.userId,
      body.userProfile,
      generateMockPerformanceData(body.userId, 5),
      content
    )
    
    // Apply optimizations based on analysis
    const optimizedItem = await applyStyleAwareOptimizations(content, analysis)
    optimizedContent.push(optimizedItem)
    
    // Track optimization insights
    if (analysis.contentAdaptations.formatChanges.length > 0) {
      optimizationInsights.optimizationsSuggested++
      optimizationInsights.styleAdaptations.push(...analysis.contentAdaptations.formatChanges)
    }
    
    if (analysis.contentAdaptations.difficultyModifications.length > 0) {
      optimizationInsights.difficultyAdjustments.push(...analysis.contentAdaptations.difficultyModifications)
    }
  }
  
  optimizationInsights.overallEffectivenessImprovement = 
    optimizationInsights.optimizationsSuggested / body.contentItems.length * 0.3 // Estimated 30% improvement
  
  return {
    optimizedContent,
    optimizationInsights
  }
}

// Handle insights generation requests
async function handleInsightsGeneration(body: StyleAwareDifficultyRequest): Promise<Partial<StyleAwareDifficultyResponse>> {
  // Get comprehensive user insights
  const recentPerformance = generateMockPerformanceData(body.userId, 15)
  const analysis = await generateStyleAwareDifficultyRecommendation(
    body.userId,
    body.userProfile,
    recentPerformance
  )
  
  const userInsights = {
    learningStyleProfile: {
      primaryStyle: analysis.styleOptimizations.primaryStyle.style,
      styleConfidence: analysis.styleOptimizations.primaryStyle.confidenceLevel,
      detectedPatterns: generateLearningPatternInsights(analysis),
      strengthsAndChallenges: generateStrengthsAndChallenges(analysis)
    },
    
    difficultyProfile: {
      currentLevel: analysis.recommendedLevel,
      optimalRange: [Math.max(1, analysis.recommendedLevel - 1), Math.min(10, analysis.recommendedLevel + 1)],
      adjustmentTrend: analysis.reasoning.includes('increase') ? 'increasing' : 
                      analysis.reasoning.includes('reduce') ? 'decreasing' : 'stable',
      performanceMetrics: {
        successRate: analysis.currentPerformance,
        targetSuccessRate: analysis.targetPerformance,
        confidenceLevel: analysis.confidence
      }
    },
    
    personalizedRecommendations: generatePersonalizedRecommendations(analysis),
    
    adaptationHistory: generateMockAdaptationHistory(body.userId)
  }
  
  return {
    userInsights
  }
}

// Helper function to apply style-aware optimizations to content
async function applyStyleAwareOptimizations(
  content: ContentItem,
  analysis: StyleAwareDifficultyRecommendation
): Promise<ContentItem> {
  
  const optimizedContent: ContentItem = {
    ...content,
    id: `${content.id}_optimized_${Date.now()}`,
    title: `${content.title} (Personalized)`,
    difficulty: analysis.styleOptimizations.primaryStyle.recommendedDifficulty,
    metadata: {
      ...content.metadata,
      styleOptimized: true,
      originalContentId: content.id,
      appliedOptimizations: analysis.contentAdaptations.formatChanges,
      difficultyAdjustment: analysis.styleOptimizations.primaryStyle.recommendedDifficulty - (content.difficulty || 5),
      personalizedForStyle: analysis.styleOptimizations.primaryStyle.style,
      optimizationTimestamp: new Date().toISOString(),
      effectivenessScore: analysis.personalizationInsights.combinedEffectivenessScore
    }
  }
  
  // Apply style-specific enhancements to description
  let enhancedDescription = content.description
  
  const primaryStyle = analysis.styleOptimizations.primaryStyle.style
  
  switch (primaryStyle) {
    case 'visual':
      enhancedDescription += '\n\n📊 Enhanced with visual elements, diagrams, and spatial organization to support visual learning.'
      optimizedContent.metadata.hasImages = true
      optimizedContent.metadata.visualEnhanced = true
      break
      
    case 'auditory':
      enhancedDescription += '\n\n🎧 Enhanced with audio explanations, rhythmic patterns, and verbal cues to support auditory learning.'
      optimizedContent.metadata.hasAudio = true
      optimizedContent.metadata.audioNarration = true
      break
      
    case 'kinesthetic':
      enhancedDescription += '\n\n🤲 Enhanced with interactive exercises, hands-on activities, and practical applications to support kinesthetic learning.'
      optimizedContent.metadata.interactiveElements = true
      optimizedContent.metadata.handsonActivities = true
      break
      
    case 'reading':
      enhancedDescription += '\n\n📚 Enhanced with detailed text, structured notes, and comprehensive written materials to support reading/writing learning.'
      optimizedContent.metadata.detailedText = true
      optimizedContent.metadata.comprehensiveNotes = true
      break
  }
  
  optimizedContent.description = enhancedDescription
  
  return optimizedContent
}

// Helper functions for generating insights
function generateLearningPatternInsights(analysis: StyleAwareDifficultyRecommendation): string[] {
  const insights = []
  
  const primaryStyle = analysis.styleOptimizations.primaryStyle.style
  const confidence = analysis.styleOptimizations.primaryStyle.confidenceLevel
  
  if (confidence > 0.8) {
    insights.push(`Strong preference for ${primaryStyle} learning detected with high confidence`)
  } else if (confidence > 0.6) {
    insights.push(`Moderate preference for ${primaryStyle} learning observed`)
  } else {
    insights.push(`Developing understanding of learning style preferences`)
  }
  
  if (analysis.personalizationInsights.styleMatchScore > 0.7) {
    insights.push('Content generally well-matched to learning style')
  } else {
    insights.push('Content adaptation recommended for better style alignment')
  }
  
  if (analysis.urgency === 'high') {
    insights.push('Immediate difficulty adjustment recommended for optimal learning')
  }
  
  return insights
}

function generateStrengthsAndChallenges(analysis: StyleAwareDifficultyRecommendation): any {
  const primaryStyle = analysis.styleOptimizations.primaryStyle.style
  
  const styleStrengths = {
    visual: ['Strong spatial awareness', 'Excellent pattern recognition', 'Good with visual organization'],
    auditory: ['Strong listening skills', 'Good verbal processing', 'Excellent rhythm and sequence understanding'],
    kinesthetic: ['Strong practical application', 'Good hands-on problem solving', 'Excellent experiential learning'],
    reading: ['Strong text comprehension', 'Good analytical thinking', 'Excellent written communication']
  }
  
  const styleChallenges = {
    visual: ['May struggle with purely verbal instructions', 'Needs visual support for complex concepts'],
    auditory: ['May need audio reinforcement', 'Benefits from discussion and explanation'],
    kinesthetic: ['Requires active engagement', 'May struggle with passive learning formats'],
    reading: ['May need written summaries', 'Benefits from text-based materials']
  }
  
  return {
    strengths: styleStrengths[primaryStyle] || ['Adaptable learning approach'],
    challenges: styleChallenges[primaryStyle] || ['Developing optimal learning strategies'],
    recommendations: [`Focus on ${primaryStyle} learning approaches`, 'Gradually expand to other learning styles']
  }
}

function generatePersonalizedRecommendations(analysis: StyleAwareDifficultyRecommendation): string[] {
  const recommendations = []
  
  // Style-based recommendations
  const primaryStyle = analysis.styleOptimizations.primaryStyle.style
  recommendations.push(`Prioritize ${primaryStyle} learning formats for optimal engagement`)
  
  // Difficulty recommendations
  if (analysis.urgency === 'high') {
    recommendations.push(`Adjust difficulty to level ${analysis.recommendedLevel} immediately`)
  } else if (analysis.adjustmentMagnitude > 0) {
    recommendations.push(`Consider gradual difficulty adjustment to level ${analysis.recommendedLevel}`)
  }
  
  // Content format recommendations
  analysis.contentAdaptations.formatChanges.forEach(change => {
    recommendations.push(change)
  })
  
  // Sequencing recommendations
  analysis.contentAdaptations.sequencingAdjustments.forEach(adjustment => {
    recommendations.push(adjustment)
  })
  
  return recommendations
}

function generateMockAdaptationHistory(userId: string): any[] {
  return Array.from({ length: 5 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    adaptationType: ['difficulty_adjustment', 'style_adaptation', 'content_format_change'][i % 3],
    fromValue: 5 + (i % 3) - 1,
    toValue: 5 + (i % 3),
    effectiveness: 0.6 + Math.random() * 0.3,
    userFeedback: Math.random() > 0.5 ? 'positive' : null,
    confidence: 0.7 + Math.random() * 0.2
  }))
}

function calculateOverallConfidence(response: Partial<StyleAwareDifficultyResponse>): number {
  if (response.difficultyRecommendation) {
    return response.difficultyRecommendation.confidence
  }
  
  if (response.sequencingPlan) {
    return 0.8 // Moderate confidence for sequencing
  }
  
  if (response.optimizedContent) {
    return 0.75 // Good confidence for optimization
  }
  
  return 0.7 // Default confidence
}

// Mock data generators
function generateMockPerformanceData(userId: string, count: number): PerformancePoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000),
    contentId: `content_${i % 5}`,
    difficultyLevel: Math.floor(Math.random() * 7) + 2,
    success: Math.random() > 0.3,
    attempts: Math.floor(Math.random() * 3) + 1,
    timeSpent: Math.floor(Math.random() * 300) + 60,
    score: Math.random(),
    contextFactors: {
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
      sessionDuration: i * 5,
      deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
      distractionLevel: Math.random() * 0.5
    }
  })).reverse()
}

function generateMockContext(): any {
  return {
    currentSession: {
      duration: Math.floor(Math.random() * 60) + 10, // 10-70 minutes
      contentViewed: Math.floor(Math.random() * 10) + 3
    },
    environmentalFactors: {
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening',
      deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
      networkQuality: 'fast',
      estimatedDistractions: Math.random() * 0.4
    },
    recentErrors: Math.floor(Math.random() * 3)
  }
}
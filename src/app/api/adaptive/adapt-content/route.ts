import { NextRequest, NextResponse } from 'next/server'
import type { ContentItem, UserProfile } from '@/types'
import type { 
  LearningContext, 
  UserInteraction, 
  AdaptiveResponse,
  PerformanceMetrics 
} from '@/types/adaptive'

// Simplified adaptive functions for this API route
async function adaptContentForUser(
  content: ContentItem, 
  behavior: LearningBehavior, 
  context: LearningContext
): Promise<ContentAdaptation> {
  return {
    adaptationType: 'difficulty',
    parameters: { adjustment: 0.1 },
    reasoning: 'Content adapted based on user behavior',
    confidence: 0.8,
    expectedImpact: 0.15,
    reversibilityScore: 0.9,
    riskFactors: [],
    monitoringPoints: ['user_engagement', 'completion_rate'],
    difficultyAdjustment: 0.1,
    pacingModification: 0
  }
}

async function checkForRealTimeAdaptation(
  userId: string,
  content: ContentItem,
  interactions: UserInteraction[]
): Promise<AdaptationResponse> {
  return {
    shouldAdapt: true,
    adaptationType: 'realtime',
    adaptation: {
      adaptationType: 'encouragement',
      parameters: { type: 'positive_reinforcement' },
      reasoning: 'User needs encouragement based on interaction patterns',
      confidence: 0.7,
      expectedImpact: 0.1,
      reversibilityScore: 1.0,
      riskFactors: [],
      monitoringPoints: ['engagement_level']
    },
    reasoning: 'Real-time adaptation triggered'
  }
}

export const maxDuration = 30

interface LearningBehavior {
  learningStylePreferences: {
    visual: number
    auditory: number
    kinesthetic: number
    reading: number
  }
  performanceMetrics: PerformanceMetrics
  engagementPatterns: {
    averageSessionDuration: number
    preferredTimeOfDay: string
    attentionSpan: number
    interactionFrequency: number
  }
  difficultyProgression: {
    currentLevel: number
    recentChanges: number[]
    optimalChallengeLevel: number
  }
}

interface AdaptContentRequest {
  content: ContentItem
  userProfile: UserProfile
  learningBehavior?: LearningBehavior
  currentContext?: LearningContext
  recentInteractions?: UserInteraction[]
  adaptationType?: 'proactive' | 'reactive' | 'realtime'
}

interface AdaptationResponse {
  shouldAdapt: boolean
  adaptationType?: string
  adaptation?: ContentAdaptation
  reasoning?: string
  confidence?: number
  expectedImpact?: number
}

interface ContentAdaptation {
  adaptationType: string
  parameters: Record<string, unknown>
  reasoning: string
  confidence: number
  expectedImpact: number
  reversibilityScore: number
  riskFactors: string[]
  monitoringPoints: string[]
  formatChanges?: string[]
  difficultyAdjustment?: number
  pacingModification?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: AdaptContentRequest = await request.json()

    if (!body.content || !body.userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: content, userProfile' },
        { status: 400 }
      )
    }

    const adaptationType = body.adaptationType || 'proactive'
    let adaptationResponse

    if (adaptationType === 'realtime' && body.recentInteractions) {
      // Real-time adaptation based on recent interactions
      adaptationResponse = await checkForRealTimeAdaptation(
        body.userProfile.id,
        body.content,
        body.recentInteractions
      )
    } else {
      // Proactive or reactive adaptation
      const learningBehavior = body.learningBehavior || generateDefaultBehavior(body.userProfile)
      const context = body.currentContext || generateDefaultContext(body.userProfile)
      
      const adaptation = await adaptContentForUser(body.content, learningBehavior, context)
      
      adaptationResponse = {
        shouldAdapt: true,
        adaptationType: adaptation.adaptationType,
        adaptation,
        reasoning: adaptation.reasoning
      }
    }

    // Generate the adapted content based on the adaptation recommendations
    const adaptedContent = await generateAdaptedContent(body.content, adaptationResponse)
    
    // Generate adaptation insights and metrics
    const insights = generateAdaptationInsights(adaptationResponse, body.content)
    
    return NextResponse.json({
      success: true,
      originalContent: body.content,
      adaptedContent,
      adaptation: adaptationResponse,
      insights,
      metadata: {
        adaptationType,
        adaptationConfidence: adaptationResponse.adaptation?.confidence || 0.7,
        expectedImprovement: adaptationResponse.adaptation?.expectedImpact || 0.15,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Content adaptation error:', error)
    return NextResponse.json(
      { error: 'Failed to adapt content' },
      { status: 500 }
    )
  }
}

// Generate adapted content based on adaptation recommendations
async function generateAdaptedContent(
  originalContent: ContentItem,
  adaptationResponse: AdaptationResponse
): Promise<ContentItem> {
  if (!adaptationResponse.shouldAdapt) {
    return originalContent
  }

  const adaptation = adaptationResponse.adaptation
  const adaptedContent: ContentItem = {
    ...originalContent,
    id: `${originalContent.id}_adapted_${Date.now()}`,
    metadata: {
      ...originalContent.metadata,
      adaptationInfo: {
        originalId: originalContent.id,
        adaptationType: adaptation?.adaptationType,
        adaptedAt: new Date().toISOString(),
        reasoning: adaptation?.reasoning
      }
    }
  }

  // Apply specific adaptations based on type
  switch (adaptation?.adaptationType) {
    case 'difficulty':
      if (adaptation.difficultyAdjustment !== undefined) {
        const newDifficultyLevel = mapDifficultyLevel(Math.round(5 + adaptation.difficultyAdjustment))
        adaptedContent.metadata = {
          ...adaptedContent.metadata,
          difficultyLevel: newDifficultyLevel
        }
        adaptedContent.title = `${adaptedContent.title} (${newDifficultyLevel})`
        adaptedContent.description = adaptDifficultyDescription(
          adaptedContent.description, 
          5, // original difficulty 
          Math.round(5 + adaptation.difficultyAdjustment)
        )
      }
      break

    case 'style':
      const styleChanges = adaptation.formatChanges || []
      adaptedContent.metadata = {
        ...adaptedContent.metadata,
        styleAdaptations: styleChanges,
        enhancedVisuals: styleChanges.includes('enhanced_visuals'),
        audioNarration: styleChanges.includes('audio_narration'),
        interactiveElements: styleChanges.includes('interactive_elements')
      }
      adaptedContent.description = adaptStyleDescription(
        adaptedContent.description,
        styleChanges
      )
      break

    case 'pacing':
      const pacingAdjustment = adaptation.pacingModification || 0
      adaptedContent.metadata = {
        ...adaptedContent.metadata,
        pacingAdjustment,
        estimatedDuration: adjustDuration(
          (adaptedContent.metadata?.estimatedDuration as number) || 15,
          pacingAdjustment
        ),
        breakSuggestions: generateBreakSuggestions(pacingAdjustment)
      }
      if (pacingAdjustment < -0.2) {
        adaptedContent.title = `${adaptedContent.title} (Take Your Time)`
      } else if (pacingAdjustment > 0.2) {
        adaptedContent.title = `${adaptedContent.title} (Quick Review)`
      }
      break

    case 'sequence':
      adaptedContent.metadata = {
        ...adaptedContent.metadata,
        sequenceOptimized: true,
        recommendedNext: [],
        prerequisites: []
      }
      break

    case 'format':
      const formatAdaptedContent = await adaptContentFormat(adaptedContent, adaptation)
      return formatAdaptedContent
  }

  return adaptedContent
}

// Generate default learning behavior for users without analysis
function generateDefaultBehavior(userProfile: UserProfile): LearningBehavior {
  const level = userProfile.level || 'beginner'
  const ageGroup = userProfile.age_group || 'adult'
  
  return {
    
    learningStylePreferences: {
      visual: ageGroup === 'child' ? 0.8 : 0.6,
      auditory: ageGroup === 'child' ? 0.6 : 0.5,
      kinesthetic: ageGroup === 'child' ? 0.9 : 0.7,
      reading: ageGroup === 'adult' ? 0.7 : 0.4
    },
    performanceMetrics: {
      recent_scores: [0.7],
      average_completion_time: ageGroup === 'child' ? 15 : 25,
      success_rate: level === 'beginner' ? 0.6 : 0.75,
      engagement_score: 0.7,
      difficulty_progression: [level === 'beginner' ? 3 : level === 'intermediate' ? 5 : 7],
      knowledge_gaps: []
    },
    engagementPatterns: {
      averageSessionDuration: ageGroup === 'child' ? 15 : 25,
      preferredTimeOfDay: 'morning',
      attentionSpan: ageGroup === 'child' ? 15 : 25,
      interactionFrequency: 2
    },
    difficultyProgression: {
      currentLevel: level === 'beginner' ? 3 : level === 'intermediate' ? 5 : 7,
      recentChanges: [0],
      optimalChallengeLevel: level === 'beginner' ? 4 : level === 'intermediate' ? 6 : 8
    }
  }
}

// Generate default learning context
function generateDefaultContext(userProfile: UserProfile): LearningContext {
  const now = new Date()
  const hour = now.getHours()
  
  return {
    current_content: undefined,
    learning_objectives: ['understand_basics'],
    session_duration: 0,
    previous_performance: {
      recent_scores: [0.7],
      average_completion_time: 25,
      success_rate: 0.7,
      engagement_score: 0.7,
      difficulty_progression: [5],
      knowledge_gaps: []
    },
    learning_style_preferences: {
      visual: 0.6,
      auditory: 0.5,
      kinesthetic: 0.7,
      reading: 0.7,
      preferred_pace: 'medium',
      preferred_feedback_frequency: 'periodic'
    },
    environmental_factors: {
      time_of_day: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
      day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      session_length: 0,
      distraction_level: 0.3,
      device_performance: {
        cpu_usage: 0.3,
        memory_usage: 0.4,
        network_speed: 100,
        battery_level: 80
      }
    }
  }
}

// Helper functions for content adaptation
function mapDifficultyLevel(difficultyNumber: number): string {
  if (difficultyNumber <= 3) return 'beginner'
  if (difficultyNumber <= 6) return 'intermediate'
  if (difficultyNumber <= 8) return 'advanced'
  return 'expert'
}

function adaptDifficultyDescription(
  description: string, 
  originalDifficulty: number, 
  adaptedDifficulty: number
): string {
  const change = adaptedDifficulty - originalDifficulty
  
  if (change > 1) {
    return `${description}\n\n📈 Enhanced with advanced concepts and challenging examples to match your skill level.`
  } else if (change < -1) {
    return `${description}\n\n📖 Simplified with additional explanations and step-by-step guidance for better understanding.`
  }
  
  return description
}

function adaptStyleDescription(description: string, styleModifications: string[]): string {
  let adaptedDescription = description
  
  if (styleModifications.includes('enhanced_visuals')) {
    adaptedDescription += '\n\n🎨 Enhanced with visual diagrams and illustrations.'
  }
  
  if (styleModifications.includes('audio_narration')) {
    adaptedDescription += '\n\n🔊 Includes audio narration and explanations.'
  }
  
  if (styleModifications.includes('interactive_elements')) {
    adaptedDescription += '\n\n🎮 Features interactive exercises and hands-on activities.'
  }
  
  if (styleModifications.includes('more_diagrams')) {
    adaptedDescription += '\n\n📊 Includes additional charts and visual aids.'
  }
  
  return adaptedDescription
}

function adjustDuration(originalDuration: number, pacingAdjustment: number): number {
  const adjustmentFactor = 1 - pacingAdjustment // Negative adjustment = longer duration
  return Math.round(originalDuration * adjustmentFactor)
}

function generateBreakSuggestions(pacingAdjustment: number): string[] {
  if (pacingAdjustment < -0.3) {
    return [
      'Take a 2-minute break every 10 minutes',
      'Review previous concepts before continuing',
      'Practice each step before moving forward'
    ]
  } else if (pacingAdjustment > 0.3) {
    return [
      'Quick 30-second breaks between sections',
      'Focus on key concepts for efficient learning',
      'Use active recall techniques'
    ]
  }
  
  return [
    'Take a 1-minute break every 15 minutes',
    'Pause to reflect on what you\'ve learned',
    'Apply concepts as you learn them'
  ]
}

async function adaptContentFormat(content: ContentItem, adaptation: ContentAdaptation): Promise<ContentItem> {
  const adaptedContent = { ...content }
  
  // Example format adaptations
  if (adaptation.formatChanges?.includes('add_captions') && content.content_type === 'video') {
    adaptedContent.metadata = {
      ...adaptedContent.metadata,
      hasCaptions: true,
      captionLanguages: ['en']
    }
  }
  
  if (adaptation.formatChanges?.includes('simplify_language')) {
    adaptedContent.description = simplifyLanguage(adaptedContent.description)
  }
  
  if (adaptation.formatChanges?.includes('add_examples')) {
    adaptedContent.description += '\n\n💡 Includes practical examples and real-world applications.'
  }
  
  return adaptedContent
}

function simplifyLanguage(text: string): string {
  // Simple language simplification (in real implementation, this could use NLP)
  return text
    .replace(/utilize/g, 'use')
    .replace(/demonstrate/g, 'show')
    .replace(/comprehend/g, 'understand')
    .replace(/facilitate/g, 'help')
    .replace(/subsequently/g, 'then')
    .replace(/furthermore/g, 'also')
}

// Generate insights about the adaptation
interface AdaptationInsights {
  adaptationApplied: boolean
  originalContentId: string
  adaptationType: string
  confidenceScore: number
  expectedBenefits: string[]
  riskFactors: string[]
  monitoringPoints: string[]
  reversibilityScore: number
  estimatedImpact: number
}

function generateAdaptationInsights(adaptationResponse: AdaptationResponse, originalContent: ContentItem): AdaptationInsights {
  if (!adaptationResponse.shouldAdapt || !adaptationResponse.adaptation) {
    return {
      adaptationApplied: false,
      originalContentId: originalContent.id,
      adaptationType: 'none',
      confidenceScore: 0,
      expectedBenefits: [],
      riskFactors: [],
      monitoringPoints: [],
      reversibilityScore: 1,
      estimatedImpact: 0
    }
  }

  const adaptation = adaptationResponse.adaptation
  
  return {
    adaptationApplied: true,
    originalContentId: originalContent.id,
    adaptationType: adaptation.adaptationType,
    confidenceScore: adaptation.confidence,
    expectedBenefits: generateExpectedBenefits(adaptation),
    riskFactors: generateRiskFactors(adaptation),
    monitoringPoints: generateMonitoringPoints(adaptation),
    reversibilityScore: calculateReversibilityScore(adaptation),
    estimatedImpact: adaptation.expectedImpact
  }
}

function generateExpectedBenefits(adaptation: ContentAdaptation): string[] {
  const benefits = []
  
  switch (adaptation.adaptationType) {
    case 'difficulty':
      benefits.push('Better skill-challenge balance')
      benefits.push('Reduced frustration or boredom')
      benefits.push('Improved learning flow')
      break
    case 'style':
      benefits.push('Enhanced learning style alignment')
      benefits.push('Increased engagement')
      benefits.push('Better content accessibility')
      break
    case 'pacing':
      benefits.push('Optimal learning speed')
      benefits.push('Reduced cognitive overload')
      benefits.push('Improved information retention')
      break
    case 'sequence':
      benefits.push('Logical learning progression')
      benefits.push('Better concept building')
      benefits.push('Reduced confusion')
      break
  }
  
  return benefits
}

function generateRiskFactors(adaptation: ContentAdaptation): string[] {
  const risks = []
  
  if (adaptation.confidence < 0.6) {
    risks.push('Low confidence in adaptation accuracy')
  }
  
  if (adaptation.adaptationType === 'difficulty' && Math.abs(adaptation.difficultyAdjustment || 0) > 2) {
    risks.push('Large difficulty jump may be disorienting')
  }
  
  if (adaptation.adaptationType === 'pacing' && Math.abs(adaptation.pacingModification || 0) > 0.5) {
    risks.push('Significant pacing change may disrupt learning rhythm')
  }
  
  return risks
}

function generateMonitoringPoints(adaptation: ContentAdaptation): string[] {
  return [
    'User engagement levels during adapted content',
    'Completion rates compared to original content',
    'User feedback on adaptation effectiveness',
    'Performance metrics on subsequent content'
  ]
}

function calculateReversibilityScore(adaptation: ContentAdaptation): number {
  // Score from 0-1 indicating how easily the adaptation can be reversed
  switch (adaptation.adaptationType) {
    case 'style':
      return 1.0 // Style changes are easily reversible
    case 'pacing':
      return 0.9 // Pacing can be adjusted back easily
    case 'difficulty':
      return 0.7 // Difficulty changes may impact progression
    case 'sequence':
      return 0.5 // Sequence changes may affect learning path
    case 'format':
      return 0.8 // Format changes are mostly reversible
    default:
      return 0.6
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { 
  adaptivePathGenerator,
  type AdaptiveRecommendation,
  type LearningPreferences,
  type PathConstraints,
  type AdaptationRecord
} from '@/lib/adaptive-path-generator'
import type { UserProfile, ContentItem } from '@/types'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'

export const maxDuration = 30

interface AdaptivePathRequest {
  userId: string
  userProfile: UserProfile
  action: 'generate_path' | 'get_recommendations' | 'update_preferences' | 'track_adaptation' | 'get_alternatives'
  
  // For path generation
  learningGoals?: LearningObjective[]
  availableContent?: ContentItem[]
  constraints?: Partial<PathConstraints>
  
  // For preference updates
  preferences?: Partial<LearningPreferences>
  
  // For adaptation tracking
  adaptationData?: {
    pathId: string
    adaptationType: string
    trigger: string
    effectiveness: number
    userFeedback?: string
    context: Record<string, any>
  }
  
  // For alternatives
  currentPathId?: string
  alternativeType?: 'accelerated' | 'comprehensive' | 'style_optimized' | 'time_constrained'
}

interface AdaptivePathResponse {
  success: boolean
  action: string
  
  // Path generation results
  adaptiveRecommendation?: AdaptiveRecommendation
  
  // Recommendation results
  recommendations?: any[]
  adaptationTriggers?: any[]
  
  // Preference update results
  updatedPreferences?: LearningPreferences
  
  // Adaptation tracking results
  adaptationRecord?: AdaptationRecord
  adaptationHistory?: AdaptationRecord[]
  
  // Alternative path results
  alternativePaths?: any[]
  
  metadata: {
    userId: string
    processingTime: number
    confidence: number
    generatedAt: string
    pathOptimizations: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: AdaptivePathRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    let response: Partial<AdaptivePathResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'generate_path':
        response = await handlePathGeneration(body)
        break
        
      case 'get_recommendations':
        response = await handleGetRecommendations(body)
        break
        
      case 'update_preferences':
        response = await handleUpdatePreferences(body)
        break
        
      case 'track_adaptation':
        response = await handleTrackAdaptation(body)
        break
        
      case 'get_alternatives':
        response = await handleGetAlternatives(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: generate_path, get_recommendations, update_preferences, track_adaptation, or get_alternatives' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: AdaptivePathResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        confidence: calculateResponseConfidence(response),
        generatedAt: new Date().toISOString(),
        pathOptimizations: countOptimizations(response)
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Adaptive path API error:', error)
    return NextResponse.json(
      { error: 'Failed to process adaptive path request' },
      { status: 500 }
    )
  }
}

// Handle adaptive path generation
async function handlePathGeneration(body: AdaptivePathRequest): Promise<Partial<AdaptivePathResponse>> {
  if (!body.learningGoals || body.learningGoals.length === 0) {
    // Generate default learning goals based on user profile
    body.learningGoals = generateDefaultLearningGoals(body.userProfile)
  }

  if (!body.availableContent || body.availableContent.length === 0) {
    // Generate mock content for demonstration
    body.availableContent = generateMockContent(body.userProfile.subject, 20)
  }

  const adaptiveRecommendation = await adaptivePathGenerator.generateAdaptivePath(
    body.userId,
    body.userProfile,
    body.learningGoals,
    body.availableContent,
    body.constraints
  )

  return {
    adaptiveRecommendation
  }
}

// Handle getting recommendations for current user
async function handleGetRecommendations(body: AdaptivePathRequest): Promise<Partial<AdaptivePathResponse>> {
  // Generate personalized recommendations based on current state
  const recommendations = await generatePersonalizedRecommendations(body.userId, body.userProfile)
  const adaptationTriggers = await getActiveAdaptationTriggers(body.userId)

  return {
    recommendations,
    adaptationTriggers
  }
}

// Handle preference updates
async function handleUpdatePreferences(body: AdaptivePathRequest): Promise<Partial<AdaptivePathResponse>> {
  if (!body.preferences) {
    throw new Error('Missing preferences for update')
  }

  // In a real implementation, this would update stored preferences
  const updatedPreferences = await updateUserPreferences(body.userId, body.preferences)

  return {
    updatedPreferences
  }
}

// Handle adaptation tracking
async function handleTrackAdaptation(body: AdaptivePathRequest): Promise<Partial<AdaptivePathResponse>> {
  if (!body.adaptationData) {
    throw new Error('Missing adaptation data for tracking')
  }

  const adaptationRecord: AdaptationRecord = {
    timestamp: new Date(),
    userId: body.userId,
    pathId: body.adaptationData.pathId,
    adaptationType: body.adaptationData.adaptationType,
    trigger: body.adaptationData.trigger,
    previousState: body.adaptationData.context.previousState || {},
    newState: body.adaptationData.context.newState || {},
    effectiveness: body.adaptationData.effectiveness,
    userFeedback: body.adaptationData.userFeedback || null,
    duration: body.adaptationData.context.duration || 0,
    context: body.adaptationData.context
  }

  // Store the adaptation record (in a real implementation)
  const adaptationHistory = await storeAdaptationRecord(body.userId, adaptationRecord)

  return {
    adaptationRecord,
    adaptationHistory
  }
}

// Handle getting alternative paths
async function handleGetAlternatives(body: AdaptivePathRequest): Promise<Partial<AdaptivePathResponse>> {
  if (!body.currentPathId) {
    throw new Error('Missing current path ID for alternatives')
  }

  const alternativePaths = await generateAlternativePaths(
    body.userId,
    body.currentPathId,
    body.alternativeType
  )

  return {
    alternativePaths
  }
}

// Helper functions for generating mock data and handling requests

function generateDefaultLearningGoals(userProfile: UserProfile): LearningObjective[] {
  const subject = userProfile.subject || 'General'
  const level = userProfile.level || 'beginner'
  
  const baseObjectives: LearningObjective[] = [
    {
      id: `${subject.toLowerCase()}_foundations`,
      title: `${subject} Foundations`,
      description: `Build strong foundation in ${subject} fundamentals`,
      subject,
      difficulty: level === 'beginner' ? 3 : level === 'intermediate' ? 5 : 7,
      estimatedTime: 40,
      prerequisites: [],
      skills: [`${subject.toLowerCase()}_basics`, 'critical_thinking'],
      conceptTags: ['foundation', 'basics'],
      masteryThreshold: 0.75
    },
    {
      id: `${subject.toLowerCase()}_application`,
      title: `${subject} Application`,
      description: `Apply ${subject} concepts to real-world scenarios`,
      subject,
      difficulty: level === 'beginner' ? 5 : level === 'intermediate' ? 7 : 8,
      estimatedTime: 60,
      prerequisites: [`${subject.toLowerCase()}_foundations`],
      skills: [`${subject.toLowerCase()}_application`, 'problem_solving'],
      conceptTags: ['application', 'real_world'],
      masteryThreshold: 0.8
    },
    {
      id: `${subject.toLowerCase()}_mastery`,
      title: `${subject} Mastery`,
      description: `Achieve mastery in advanced ${subject} concepts`,
      subject,
      difficulty: level === 'beginner' ? 7 : level === 'intermediate' ? 8 : 9,
      estimatedTime: 80,
      prerequisites: [`${subject.toLowerCase()}_application`],
      skills: [`${subject.toLowerCase()}_mastery`, 'synthesis', 'evaluation'],
      conceptTags: ['mastery', 'advanced'],
      masteryThreshold: 0.85
    }
  ]

  // Return different number of objectives based on user level
  return level === 'beginner' ? baseObjectives.slice(0, 2) : baseObjectives
}

function generateMockContent(subject: string, count: number): ContentItem[] {
  const contentTypes: ContentItem['content_type'][] = ['video', 'quiz', 'text', 'interactive', 'ai_lesson']
  const content: ContentItem[] = []
  
  for (let i = 1; i <= count; i++) {
    const contentType = contentTypes[i % contentTypes.length]
    const difficulty = Math.ceil(i / 3) + Math.floor(Math.random() * 2)
    
    content.push({
      id: `adaptive_content_${i}`,
      content_type: contentType,
      title: `${subject} ${contentType === 'ai_lesson' ? 'AI Lesson' : contentType.charAt(0).toUpperCase() + contentType.slice(1)} ${i}`,
      description: `Adaptive ${subject} content focusing on ${getRandomConcept(subject)} concepts`,
      subject,
      difficulty: Math.min(10, difficulty),
      estimated_time: 15 + (i * 2),
      created_at: new Date().toISOString(),
      metadata: {
        difficulty_level: difficulty,
        concepts: [`${subject.toLowerCase()}_concept_${Math.ceil(i/3)}`, 'adaptive_learning'],
        learningStyle: ['visual', 'auditory', 'kinesthetic', 'reading'][Math.floor(Math.random() * 4)],
        adaptationLevel: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
        engagementScore: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        hasInteractiveElements: contentType === 'interactive' || Math.random() > 0.7,
        personalizable: true
      }
    })
  }
  
  return content
}

function getRandomConcept(subject: string): string {
  const conceptMap: Record<string, string[]> = {
    'Mathematics': ['algebra', 'geometry', 'calculus', 'statistics', 'logic'],
    'Science': ['physics', 'chemistry', 'biology', 'astronomy', 'geology'],
    'Programming': ['algorithms', 'data structures', 'object oriented', 'functional', 'databases'],
    'Language': ['grammar', 'vocabulary', 'pronunciation', 'conversation', 'writing'],
    'History': ['ancient', 'medieval', 'modern', 'cultural', 'political'],
    'Art': ['painting', 'sculpture', 'design', 'color theory', 'composition']
  }
  
  const concepts = conceptMap[subject] || ['fundamental', 'intermediate', 'advanced', 'practical', 'theoretical']
  return concepts[Math.floor(Math.random() * concepts.length)]
}

async function generatePersonalizedRecommendations(userId: string, userProfile: UserProfile): Promise<any[]> {
  // Mock personalized recommendations
  return [
    {
      id: 'adaptive_rec_1',
      type: 'content_recommendation',
      title: 'Optimize Learning Style',
      description: `Your ${userProfile.learning_style_profile?.primary_style || 'visual'} learning style suggests focusing on interactive content`,
      priority: 'medium',
      estimatedImpact: 0.7,
      timeRequired: 0,
      action: 'Switch to more visual content formats',
      reasoning: 'Learning style analysis indicates higher engagement with visual materials'
    },
    {
      id: 'adaptive_rec_2',
      type: 'pacing_recommendation',
      title: 'Adjust Learning Pace',
      description: 'Based on recent performance, consider slowing down for better retention',
      priority: 'high',
      estimatedImpact: 0.8,
      timeRequired: 5,
      action: 'Reduce content density by 20%',
      reasoning: 'Performance data shows better mastery with slower-paced content'
    },
    {
      id: 'adaptive_rec_3',
      type: 'difficulty_recommendation',
      title: 'Gradual Difficulty Increase',
      description: 'Your progress suggests readiness for slightly more challenging content',
      priority: 'low',
      estimatedImpact: 0.6,
      timeRequired: 0,
      action: 'Increase difficulty by 0.5 levels',
      reasoning: 'Consistent performance above 80% indicates room for challenge'
    }
  ]
}

async function getActiveAdaptationTriggers(userId: string): Promise<any[]> {
  // Mock active adaptation triggers
  return [
    {
      triggerId: 'engagement_monitor',
      status: 'active',
      nextCheck: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      threshold: 0.7,
      currentValue: 0.75,
      description: 'Monitoring engagement levels for potential adaptation'
    },
    {
      triggerId: 'difficulty_adjustment',
      status: 'pending',
      nextCheck: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      threshold: 0.6,
      currentValue: 0.65,
      description: 'Ready to adjust difficulty if performance drops'
    }
  ]
}

async function updateUserPreferences(userId: string, preferences: Partial<LearningPreferences>): Promise<LearningPreferences> {
  // Mock preference update - in real implementation would update database
  return {
    preferredContentTypes: preferences.preferredContentTypes || ['video', 'interactive'],
    learningPace: preferences.learningPace || 'moderate',
    sessionLength: preferences.sessionLength || 45,
    difficultyProgression: preferences.difficultyProgression || 'gradual',
    adaptationSensitivity: preferences.adaptationSensitivity || 'medium',
    feedbackFrequency: preferences.feedbackFrequency || 'moderate',
    reviewPreference: preferences.reviewPreference || 'adaptive',
    motivationStyle: preferences.motivationStyle || 'progress'
  }
}

async function storeAdaptationRecord(userId: string, record: AdaptationRecord): Promise<AdaptationRecord[]> {
  // Mock storage - in real implementation would store in database
  return [record] // Return simplified history
}

async function generateAlternativePaths(
  userId: string,
  currentPathId: string,
  alternativeType?: string
): Promise<any[]> {
  // Mock alternative paths
  const alternatives = [
    {
      pathId: `${currentPathId}_accelerated`,
      title: 'Accelerated Learning Path',
      description: 'Complete the same objectives 30% faster with higher difficulty',
      estimatedTime: 120,
      difficulty: 7,
      adaptationPoints: 5,
      suitabilityScore: 0.8,
      advantages: ['Faster completion', 'Higher challenge', 'More intensive'],
      considerations: ['Requires more focus', 'Less practice time', 'Higher difficulty']
    },
    {
      pathId: `${currentPathId}_comprehensive`,
      title: 'Comprehensive Learning Path',
      description: 'In-depth exploration with additional practice and reinforcement',
      estimatedTime: 200,
      difficulty: 5,
      adaptationPoints: 8,
      suitabilityScore: 0.9,
      advantages: ['Thorough understanding', 'More practice', 'Better retention'],
      considerations: ['Longer timeline', 'More time investment', 'Slower progress']
    },
    {
      pathId: `${currentPathId}_balanced`,
      title: 'Balanced Learning Path',
      description: 'Optimal balance of speed and depth based on your learning profile',
      estimatedTime: 160,
      difficulty: 6,
      adaptationPoints: 6,
      suitabilityScore: 0.85,
      advantages: ['Well-balanced approach', 'Moderate pace', 'Good retention'],
      considerations: ['Standard timeline', 'Moderate challenge level']
    }
  ]

  // Filter by alternative type if specified
  if (alternativeType) {
    return alternatives.filter(alt => alt.pathId.includes(alternativeType))
  }

  return alternatives
}

function calculateResponseConfidence(response: Partial<AdaptivePathResponse>): number {
  let confidence = 0.7 // Base confidence
  
  if (response.adaptiveRecommendation) {
    confidence = Math.max(confidence, response.adaptiveRecommendation.confidenceScore)
  }
  
  if (response.recommendations && response.recommendations.length > 0) {
    const avgImpact = response.recommendations.reduce((sum, rec) => sum + rec.estimatedImpact, 0) / response.recommendations.length
    confidence += avgImpact * 0.1
  }
  
  return Math.min(0.95, Math.max(0.5, confidence))
}

function countOptimizations(response: Partial<AdaptivePathResponse>): number {
  let optimizations = 0
  
  if (response.adaptiveRecommendation) {
    optimizations += response.adaptiveRecommendation.realTimeOptimizations.length
    optimizations += response.adaptiveRecommendation.adaptationTriggers.length
  }
  
  if (response.recommendations) {
    optimizations += response.recommendations.length
  }
  
  return optimizations
}
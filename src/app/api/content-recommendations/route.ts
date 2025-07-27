import { NextRequest, NextResponse } from 'next/server'
import { 
  contentRecommendationEngine,
  type RecommendationRequest,
  type ContentRecommendation,
  type RecommendationBatch,
  type ContentInteraction,
  type RecommendationAnalytics
} from '@/lib/content-recommendation-engine'
import type { UserProfile, ContentItem } from '@/types'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'
import type { ObjectiveProgress } from '@/lib/objective-tracking-engine'
import type { UserMasteryProfile } from '@/lib/mastery-progression-engine'

export const maxDuration = 30

interface ContentRecommendationAPIRequest {
  userId: string
  userProfile: UserProfile
  action: 'generate_recommendations' | 'record_interaction' | 'get_analytics' | 'optimize_weights' | 'get_similarity'
  
  // For generate_recommendations
  currentObjectives?: LearningObjective[]
  currentProgress?: ObjectiveProgress[]
  availableContent?: ContentItem[]
  contextualHints?: any[]
  sessionContext?: any
  constraints?: any
  count?: number
  diversityFactor?: number
  masteryProfile?: UserMasteryProfile
  targetSkills?: string[]
  progressionPriority?: 'mastery' | 'exploration' | 'review' | 'challenge'
  
  // For record_interaction
  contentId?: string
  interaction?: ContentInteraction
  
  // For get_analytics
  timeframe?: 'daily' | 'weekly' | 'monthly'
  
  // For optimize_weights
  performanceData?: any
  
  // For get_similarity
  contentId1?: string
  contentId2?: string
}

interface ContentRecommendationAPIResponse {
  success: boolean
  action: string
  
  // Generate recommendations results
  recommendations?: RecommendationBatch
  
  // Analytics results
  analytics?: RecommendationAnalytics
  
  // Similarity results
  similarity?: number
  
  // Optimization results
  optimizationComplete?: boolean
  
  metadata: {
    userId: string
    processingTime: number
    recommendationCount: number
    algorithmUsed: string
    confidenceScore: number
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: ContentRecommendationAPIRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    let response: Partial<ContentRecommendationAPIResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'generate_recommendations':
        response = await handleGenerateRecommendations(body)
        break
        
      case 'record_interaction':
        response = await handleRecordInteraction(body)
        break
        
      case 'get_analytics':
        response = await handleGetAnalytics(body)
        break
        
      case 'optimize_weights':
        response = await handleOptimizeWeights(body)
        break
        
      case 'get_similarity':
        response = await handleGetSimilarity(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: generate_recommendations, record_interaction, get_analytics, optimize_weights, or get_similarity' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: ContentRecommendationAPIResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        recommendationCount: response.recommendations?.recommendations.length || 0,
        algorithmUsed: response.recommendations?.algorithm || 'none',
        confidenceScore: calculateAverageConfidence(response.recommendations),
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Content recommendation API error:', error)
    return NextResponse.json(
      { error: 'Failed to process content recommendation request' },
      { status: 500 }
    )
  }
}

// Handle recommendation generation
async function handleGenerateRecommendations(body: ContentRecommendationAPIRequest): Promise<Partial<ContentRecommendationAPIResponse>> {
  if (!body.availableContent) {
    // Generate mock content if none provided
    body.availableContent = generateMockContentLibrary(body.userProfile)
  }

  const recommendationRequest: RecommendationRequest = {
    userId: body.userId,
    userProfile: body.userProfile,
    currentObjectives: body.currentObjectives || [],
    currentProgress: body.currentProgress || [],
    contextualHints: body.contextualHints || [],
    sessionContext: body.sessionContext,
    constraints: body.constraints,
    count: body.count || 10,
    diversityFactor: body.diversityFactor || 0.7,
    masteryProfile: body.masteryProfile,
    targetSkills: body.targetSkills,
    progressionPriority: body.progressionPriority
  }

  const recommendations = await contentRecommendationEngine.generateRecommendations(
    recommendationRequest,
    body.availableContent
  )

  return {
    recommendations
  }
}

// Handle interaction recording
async function handleRecordInteraction(body: ContentRecommendationAPIRequest): Promise<Partial<ContentRecommendationAPIResponse>> {
  if (!body.contentId || !body.interaction) {
    throw new Error('Missing contentId or interaction data for recording')
  }

  await contentRecommendationEngine.recordInteraction(
    body.userId,
    body.contentId,
    body.interaction
  )

  return {
    success: true
  }
}

// Handle analytics retrieval
async function handleGetAnalytics(body: ContentRecommendationAPIRequest): Promise<Partial<ContentRecommendationAPIResponse>> {
  const timeframe = body.timeframe || 'weekly'
  
  const analytics = await contentRecommendationEngine.getRecommendationAnalytics(
    body.userId,
    timeframe
  )

  return {
    analytics
  }
}

// Handle algorithm weight optimization
async function handleOptimizeWeights(body: ContentRecommendationAPIRequest): Promise<Partial<ContentRecommendationAPIResponse>> {
  if (!body.performanceData) {
    throw new Error('Missing performance data for optimization')
  }

  await contentRecommendationEngine.optimizeAlgorithmWeights(body.performanceData)

  return {
    optimizationComplete: true
  }
}

// Handle similarity calculation
async function handleGetSimilarity(body: ContentRecommendationAPIRequest): Promise<Partial<ContentRecommendationAPIResponse>> {
  if (!body.contentId1 || !body.contentId2) {
    throw new Error('Missing content IDs for similarity calculation')
  }

  const similarity = await contentRecommendationEngine.getContentSimilarity(
    body.contentId1,
    body.contentId2
  )

  return {
    similarity
  }
}

// Generate mock content library for testing
function generateMockContentLibrary(userProfile: UserProfile): ContentItem[] {
  const subject = userProfile.subject || 'General'
  const level = userProfile.level || 'intermediate'
  
  const difficultyBase = level === 'beginner' ? 3 : level === 'intermediate' ? 6 : 8

  const contentLibrary: ContentItem[] = [
    // Video content
    {
      id: `${subject.toLowerCase()}_video_1`,
      type: 'video',
      title: `${subject} Fundamentals: Core Concepts`,
      description: `Essential ${subject} concepts explained through engaging visual demonstrations`,
      subject,
      difficulty: difficultyBase - 1,
      estimatedTime: 15,
      metadata: {
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_duration: 900,
        video_type: 'educational',
        hasSubtitles: true,
        qualityLevels: ['720p', '1080p']
      },
      tags: [`${subject.toLowerCase()}`, 'fundamentals', 'video', 'beginner-friendly'],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: `${subject.toLowerCase()}_video_2`,
      type: 'video',
      title: `Advanced ${subject} Techniques`,
      description: `Advanced techniques and real-world applications in ${subject}`,
      subject,
      difficulty: difficultyBase + 2,
      estimatedTime: 25,
      metadata: {
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_duration: 1500,
        video_type: 'advanced',
        hasSubtitles: true,
        qualityLevels: ['720p', '1080p', '4K']
      },
      tags: [`${subject.toLowerCase()}`, 'advanced', 'techniques', 'expert'],
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20')
    },

    // Interactive quiz content
    {
      id: `${subject.toLowerCase()}_quiz_1`,
      type: 'quiz',
      title: `${subject} Knowledge Check`,
      description: `Test your understanding of ${subject} concepts`,
      subject,
      difficulty: difficultyBase,
      estimatedTime: 10,
      metadata: {
        quiz_questions: [
          {
            id: 'q1',
            question: `What is the most important principle in ${subject}?`,
            type: 'multiple_choice',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 0,
            explanation: `The correct answer demonstrates key ${subject} understanding`,
            points: 10,
            timeLimit: 60
          },
          {
            id: 'q2',
            question: `Explain a practical application of ${subject}`,
            type: 'short_answer',
            correctAnswer: 'Any practical application',
            explanation: `${subject} has many real-world applications`,
            points: 15,
            timeLimit: 120
          }
        ],
        total_points: 25,
        passing_score: 0.7,
        attempts_allowed: 3
      },
      tags: [`${subject.toLowerCase()}`, 'quiz', 'assessment', 'knowledge-check'],
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18')
    },

    // AI-generated lesson content
    {
      id: `${subject.toLowerCase()}_ai_lesson_1`,
      type: 'ai_lesson',
      title: `Personalized ${subject} Learning Path`,
      description: `AI-powered lesson tailored to your learning style and pace`,
      subject,
      difficulty: difficultyBase,
      estimatedTime: 20,
      metadata: {
        ai_generated: true,
        tutor_personality: 'friendly_teacher',
        adaptation_level: 'medium',
        personalization_factors: ['learning_style', 'difficulty_preference', 'pacing'],
        content_sections: [
          {
            title: 'Introduction',
            type: 'explanation',
            estimatedTime: 5
          },
          {
            title: 'Interactive Examples',
            type: 'practice',
            estimatedTime: 10
          },
          {
            title: 'Application Exercise',
            type: 'application',
            estimatedTime: 5
          }
        ]
      },
      tags: [`${subject.toLowerCase()}`, 'ai-generated', 'personalized', 'adaptive'],
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22')
    },

    // External link content
    {
      id: `${subject.toLowerCase()}_link_1`,
      type: 'link',
      title: `${subject} Reference Guide`,
      description: `Comprehensive reference materials and documentation`,
      subject,
      difficulty: difficultyBase + 1,
      estimatedTime: 30,
      metadata: {
        link_url: `https://example.com/${subject.toLowerCase()}-guide`,
        link_preview: {
          title: `Complete ${subject} Reference`,
          description: `Authoritative guide covering all aspects of ${subject}`,
          image: 'https://example.com/preview.jpg',
          domain: 'example.com',
          favicon: 'https://example.com/favicon.ico'
        },
        link_type: 'documentation',
        external_rating: 4.8,
        last_updated: '2024-01-25'
      },
      tags: [`${subject.toLowerCase()}`, 'reference', 'documentation', 'external'],
      createdAt: new Date('2024-01-25'),
      updatedAt: new Date('2024-01-25')
    },

    // Interactive exercise content
    {
      id: `${subject.toLowerCase()}_interactive_1`,
      type: 'interactive',
      title: `${subject} Hands-On Workshop`,
      description: `Interactive exercises and simulations for practical ${subject} skills`,
      subject,
      difficulty: difficultyBase + 1,
      estimatedTime: 35,
      metadata: {
        interaction_type: 'simulation',
        requires_tools: false,
        collaborative: false,
        progress_trackable: true,
        exercises: [
          {
            title: 'Basic Exercise',
            type: 'guided_practice',
            estimatedTime: 15
          },
          {
            title: 'Advanced Challenge',
            type: 'free_exploration',
            estimatedTime: 20
          }
        ]
      },
      tags: [`${subject.toLowerCase()}`, 'interactive', 'hands-on', 'simulation'],
      createdAt: new Date('2024-01-28'),
      updatedAt: new Date('2024-01-28')
    },

    // Cross-subject integration content
    {
      id: `interdisciplinary_${subject.toLowerCase()}_1`,
      type: 'video',
      title: `${subject} in Real-World Context`,
      description: `How ${subject} connects with other fields and real-world applications`,
      subject: 'Interdisciplinary',
      difficulty: difficultyBase,
      estimatedTime: 18,
      metadata: {
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_duration: 1080,
        video_type: 'interdisciplinary',
        related_subjects: [subject, 'Applied Sciences', 'Technology'],
        hasSubtitles: true
      },
      tags: ['interdisciplinary', subject.toLowerCase(), 'real-world', 'applications'],
      createdAt: new Date('2024-01-30'),
      updatedAt: new Date('2024-01-30')
    },

    // Quick review content
    {
      id: `${subject.toLowerCase()}_review_1`,
      type: 'text',
      title: `${subject} Quick Review`,
      description: `Brief summary of key ${subject} concepts for quick reinforcement`,
      subject,
      difficulty: difficultyBase - 2,
      estimatedTime: 5,
      metadata: {
        content_format: 'summary',
        reading_level: level === 'beginner' ? 'elementary' : level === 'intermediate' ? 'middle' : 'advanced',
        key_points: 5,
        includes_diagrams: true,
        word_count: 300
      },
      tags: [`${subject.toLowerCase()}`, 'review', 'summary', 'quick-read'],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01')
    },

    // Challenge content for advanced learners
    {
      id: `${subject.toLowerCase()}_challenge_1`,
      type: 'quiz',
      title: `${subject} Master Challenge`,
      description: `Advanced problem-solving challenge for ${subject} experts`,
      subject,
      difficulty: Math.min(10, difficultyBase + 3),
      estimatedTime: 45,
      metadata: {
        quiz_questions: [
          {
            id: 'challenge_q1',
            question: `Solve this advanced ${subject} problem`,
            type: 'essay',
            correctAnswer: 'Complex solution required',
            explanation: `This requires deep understanding of ${subject} principles`,
            points: 50,
            timeLimit: 1800
          }
        ],
        total_points: 50,
        passing_score: 0.8,
        attempts_allowed: 1,
        difficulty_rating: 'expert'
      },
      tags: [`${subject.toLowerCase()}`, 'challenge', 'expert', 'problem-solving'],
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-05')
    }
  ]

  return contentLibrary
}

// Calculate average confidence score from recommendations
function calculateAverageConfidence(batch?: RecommendationBatch): number {
  if (!batch || batch.recommendations.length === 0) return 0.5
  
  const totalConfidence = batch.recommendations.reduce(
    (sum, rec) => sum + rec.confidence, 0
  )
  
  return totalConfidence / batch.recommendations.length
}
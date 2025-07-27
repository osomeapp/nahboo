import { NextRequest, NextResponse } from 'next/server'
import { multiModelAI, generateAIContent, generateSmartQuiz, generatePersonalizedFeedback } from '@/lib/multi-model-ai'
import { modelFallbackRouter } from '@/lib/model-fallback-router'
import type { AIRequest, UseCase } from '@/lib/multi-model-ai'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface APIRequest {
  useCase: UseCase
  userProfile: UserProfile
  context: string
  requestType?: 'content' | 'quiz' | 'feedback' | 'explanation' | 'planning'
  priority?: 'high' | 'medium' | 'low'
  maxTokens?: number
  temperature?: number
  fallbackRequired?: boolean
}

export async function POST(request: NextRequest) {
  let body: APIRequest | null = null
  
  try {
    // Check if at least OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'AI service not configured',
          details: 'OpenAI API key is required for AI functionality'
        },
        { status: 503 }
      )
    }

    body = await request.json()

    // Validate required fields
    if (!body || !body.userProfile || !body.context || !body.useCase) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['userProfile', 'context', 'useCase'],
          received: Object.keys(body)
        },
        { status: 400 }
      )
    }

    // Validate use case
    const validUseCases: UseCase[] = [
      'mathematics', 'science', 'programming', 'creative_writing', 'essay_analysis',
      'language_learning', 'history', 'philosophy', 'business', 'general_tutoring',
      'quiz_generation', 'personalized_feedback', 'content_explanation', 'study_planning'
    ]
    
    if (!validUseCases.includes(body.useCase)) {
      return NextResponse.json(
        { 
          error: 'Invalid use case',
          validUseCases
        },
        { status: 400 }
      )
    }

    // Validate user profile structure
    if (!body.userProfile.name || !body.userProfile.subject) {
      return NextResponse.json(
        { 
          error: 'Invalid user profile',
          details: 'UserProfile must contain name and subject fields'
        },
        { status: 400 }
      )
    }

    // Build AI request
    const aiRequest: AIRequest = {
      useCase: body.useCase,
      userProfile: body.userProfile,
      context: body.context,
      requestType: body.requestType || 'content',
      priority: body.priority || 'medium',
      maxTokens: body.maxTokens,
      temperature: body.temperature,
      fallbackRequired: body.fallbackRequired !== false // Default to true
    }

    // Get routing decision from fallback router
    const routingDecision = await modelFallbackRouter.routeRequest(
      body.useCase,
      body.userProfile,
      body.context
    )

    // Track the routing decision
    console.log('Router decision:', {
      selectedModel: routingDecision.selectedModel,
      reason: routingDecision.reason,
      confidence: routingDecision.confidence
    })

    // Generate content using multi-model AI with router guidance
    const startTime = Date.now()
    const response = await multiModelAI.generateContent(aiRequest)
    const responseTime = Date.now() - startTime

    // Record the result in the router for performance tracking
    await modelFallbackRouter.recordRequestResult(
      response.model,
      body.useCase,
      responseTime,
      true, // Assume success if we get here
      undefined,
      body.userProfile
    )

    // Get analytics for monitoring
    const analytics = multiModelAI.getAnalytics()

    return NextResponse.json({
      success: true,
      response,
      routing: {
        selectedModel: routingDecision.selectedModel,
        routingReason: routingDecision.reason,
        routingConfidence: routingDecision.confidence,
        fallbackModels: routingDecision.fallbackModels,
        actualModelUsed: response.model
      },
      analytics: {
        selectedModel: response.model,
        provider: response.provider,
        responseTime: response.responseTime,
        tokensUsed: response.tokensUsed,
        confidence: response.confidence,
        fallbackUsed: response.fallbackUsed
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        modelPerformance: analytics.averagePerformance,
        cacheSize: analytics.cacheSize,
        routingTime: routingDecision.routingTime
      }
    })

  } catch (error) {
    console.error('Multi-model AI API error:', error)
    
    // Record the failed request in the router if we have the necessary info
    if (body?.useCase && body?.userProfile) {
      try {
        const routingDecision = await modelFallbackRouter.routeRequest(
          body.useCase,
          body.userProfile,
          body.context
        )
        
        // Record the failure
        await modelFallbackRouter.recordRequestResult(
          routingDecision.selectedModel,
          body.useCase,
          Date.now() - (Date.now() - 5000), // Approximate response time
          false, // Failed request
          error instanceof Error ? error.message : 'Unknown error',
          body.userProfile
        )
      } catch (routingError) {
        console.error('Failed to record error in router:', routingError)
      }
    }
    
    // Return different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { 
            error: 'AI service configuration error',
            details: 'Invalid or missing API keys'
          },
          { status: 503 }
        )
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { 
            error: 'AI service timeout',
            details: 'Request took too long to process'
          },
          { status: 408 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate AI content',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for analytics and health check
export async function GET() {
  try {
    const analytics = multiModelAI.getAnalytics()
    
    return NextResponse.json({
      status: 'healthy',
      providers: {
        openai: !!process.env.OPENAI_API_KEY,
        claude: !!process.env.ANTHROPIC_API_KEY
      },
      analytics,
      availableUseCases: [
        'mathematics', 'science', 'programming', 'creative_writing', 'essay_analysis',
        'language_learning', 'history', 'philosophy', 'business', 'general_tutoring',
        'quiz_generation', 'personalized_feedback', 'content_explanation', 'study_planning'
      ]
    })
  } catch (error) {
    console.error('Multi-model AI health check error:', error)
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Service unavailable'
      },
      { status: 503 }
    )
  }
}
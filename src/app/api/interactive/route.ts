import { NextRequest, NextResponse } from 'next/server'
import { interactiveContentEngine, type InteractiveContent } from '@/lib/interactive-content-engine'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface InteractiveContentRequest {
  action: 'generate' | 'interact' | 'assess' | 'hint'
  
  // Common fields
  userId: string
  userProfile: UserProfile
  
  // For generate action
  learningContext?: {
    currentTopic: string
    difficulty: number
    timeAvailable: number
    preferredInteractionType?: string
    learningObjectives: string[]
  }
  
  // For interact action
  contentId?: string
  interaction?: {
    type: string
    data: any
    timestamp: number
    sessionTime: number
  }
  
  // For assess action
  submission?: any
  
  // For hint action
  currentState?: any
}

interface InteractiveContentResponse {
  success: boolean
  action: string
  
  // Response data
  content?: InteractiveContent
  result?: any
  assessment?: any
  hint?: any
  
  metadata: {
    userId: string
    processingTime: number
    contentType?: string
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: InteractiveContentRequest = await request.json()

    if (!body.action || !body.userId || !body.userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId, userProfile' },
        { status: 400 }
      )
    }

    let response: Partial<InteractiveContentResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'generate':
        response = await handleGenerate(body)
        break
        
      case 'interact':
        response = await handleInteract(body)
        break
        
      case 'assess':
        response = await handleAssess(body)
        break
        
      case 'hint':
        response = await handleHint(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: generate, interact, assess, or hint' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: InteractiveContentResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        contentType: response.content?.type,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Interactive content API error:', error)
    return NextResponse.json(
      { error: 'Failed to process interactive content request' },
      { status: 500 }
    )
  }
}

// Handle content generation
async function handleGenerate(body: InteractiveContentRequest): Promise<Partial<InteractiveContentResponse>> {
  if (!body.learningContext) {
    throw new Error('Missing learning context for content generation')
  }

  const content = await interactiveContentEngine.generateInteractiveContent(
    body.userProfile,
    body.learningContext
  )

  return { content }
}

// Handle user interaction
async function handleInteract(body: InteractiveContentRequest): Promise<Partial<InteractiveContentResponse>> {
  if (!body.contentId || !body.interaction) {
    throw new Error('Missing contentId or interaction data')
  }

  const result = await interactiveContentEngine.processInteraction(
    body.contentId,
    body.userId,
    body.interaction
  )

  return { result }
}

// Handle completion assessment
async function handleAssess(body: InteractiveContentRequest): Promise<Partial<InteractiveContentResponse>> {
  if (!body.contentId || !body.submission) {
    throw new Error('Missing contentId or submission data')
  }

  const assessment = await interactiveContentEngine.assessCompletion(
    body.contentId,
    body.userId,
    body.submission
  )

  return { assessment }
}

// Handle hint request
async function handleHint(body: InteractiveContentRequest): Promise<Partial<InteractiveContentResponse>> {
  if (!body.contentId || !body.currentState) {
    throw new Error('Missing contentId or current state')
  }

  const hint = await interactiveContentEngine.getAdaptiveHint(
    body.contentId,
    body.userId,
    body.currentState
  )

  return { hint }
}

export async function GET() {
  return NextResponse.json({
    message: 'Interactive Content API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Interactive content operations',
        actions: ['generate', 'interact', 'assess', 'hint']
      }
    },
    supportedContentTypes: [
      'coding_exercise',
      'simulation', 
      'diagram_labeling',
      'drag_drop',
      'virtual_lab',
      'interactive_story'
    ]
  })
}
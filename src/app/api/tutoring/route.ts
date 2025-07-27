import { NextRequest, NextResponse } from 'next/server'
import { 
  intelligentTutoringSystem,
  type ConversationMessage,
  type TutorPersonality,
  type ConversationContext
} from '@/lib/intelligent-tutoring-system'

export const maxDuration = 30

interface TutoringRequest {
  action: 'start_conversation' | 'continue_conversation' | 'end_conversation' | 'get_context' | 'get_personalities' | 'get_strategies'
  
  // For start_conversation
  studentProfile?: {
    name: string
    level: string
    learningStyle: string
    interests: string[]
    strugglingAreas: string[]
    strengths: string[]
  }
  subject?: string
  learningObjectives?: string[]
  tutorPersonalityId?: string
  
  // For continue_conversation
  sessionId?: string
  studentMessage?: string
}

interface TutoringResponse {
  success: boolean
  action: string
  
  // Response data
  sessionId?: string
  message?: ConversationMessage
  conversationHistory?: ConversationMessage[]
  context?: ConversationContext
  personalities?: TutorPersonality[]
  strategies?: any[]
  sessionSummary?: {
    summary: string
    achievements: string[]
    recommendations: string[]
    sessionMetrics: any
  }
  
  metadata: {
    processingTime: number
    timestamp: string
    messageCount?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: TutoringRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<TutoringResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'start_conversation':
        response = await handleStartConversation(body)
        break
        
      case 'continue_conversation':
        response = await handleContinueConversation(body)
        break
        
      case 'end_conversation':
        response = await handleEndConversation(body)
        break
        
      case 'get_context':
        response = await handleGetContext(body)
        break
        
      case 'get_personalities':
        response = await handleGetPersonalities()
        break
        
      case 'get_strategies':
        response = await handleGetStrategies()
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: TutoringResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        messageCount: Array.isArray(response.conversationHistory) ? response.conversationHistory.length : undefined
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Tutoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to process tutoring request' },
      { status: 500 }
    )
  }
}

// Start a new tutoring conversation
async function handleStartConversation(body: TutoringRequest): Promise<Partial<TutoringResponse>> {
  if (!body.studentProfile || !body.subject || !body.learningObjectives) {
    throw new Error('Missing required fields: studentProfile, subject, learningObjectives')
  }
  
  const sessionId = await intelligentTutoringSystem.startConversation(
    body.studentProfile,
    body.subject,
    body.learningObjectives,
    body.tutorPersonalityId
  )
  
  // Get the conversation history (which includes the opening message)
  const conversationHistory = intelligentTutoringSystem.getConversationHistory(sessionId)
  
  return { 
    sessionId, 
    conversationHistory,
    message: conversationHistory[conversationHistory.length - 1] // Latest message (opening)
  }
}

// Continue an existing conversation
async function handleContinueConversation(body: TutoringRequest): Promise<Partial<TutoringResponse>> {
  if (!body.sessionId || !body.studentMessage) {
    throw new Error('Missing required fields: sessionId, studentMessage')
  }
  
  const tutorResponse = await intelligentTutoringSystem.continueConversation(
    body.sessionId,
    body.studentMessage
  )
  
  const conversationHistory = intelligentTutoringSystem.getConversationHistory(body.sessionId)
  
  return { 
    message: tutorResponse,
    conversationHistory
  }
}

// End a conversation and get summary
async function handleEndConversation(body: TutoringRequest): Promise<Partial<TutoringResponse>> {
  if (!body.sessionId) {
    throw new Error('Missing required field: sessionId')
  }
  
  const sessionSummary = await intelligentTutoringSystem.endConversation(body.sessionId)
  
  return { sessionSummary }
}

// Get conversation context
async function handleGetContext(body: TutoringRequest): Promise<Partial<TutoringResponse>> {
  if (!body.sessionId) {
    throw new Error('Missing required field: sessionId')
  }
  
  const context = intelligentTutoringSystem.getConversationContext(body.sessionId)
  
  if (!context) {
    throw new Error('Conversation session not found')
  }
  
  return { context }
}

// Get available tutor personalities
async function handleGetPersonalities(): Promise<Partial<TutoringResponse>> {
  const personalities = intelligentTutoringSystem.getTutorPersonalities()
  
  return { personalities }
}

// Get available tutoring strategies
async function handleGetStrategies(): Promise<Partial<TutoringResponse>> {
  const strategies = intelligentTutoringSystem.getTutoringStrategies()
  
  return { strategies }
}

export async function GET() {
  return NextResponse.json({
    message: 'Intelligent Tutoring System API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'AI-powered tutoring conversations',
        actions: [
          'start_conversation',
          'continue_conversation', 
          'end_conversation',
          'get_context',
          'get_personalities',
          'get_strategies'
        ]
      }
    },
    capabilities: [
      'Natural Language Conversations',
      'Adaptive Teaching Strategies',
      'Personalized Tutoring',
      'Real-time Assessment',
      'Multiple Tutor Personalities',
      'Subject-Specific Expertise',
      'Learning Style Adaptation',
      'Progress Tracking',
      'Socratic Method',
      'Scaffolding Support'
    ],
    tutorPersonalities: [
      'socratic_mentor',
      'enthusiastic_coach',
      'patient_teacher',
      'tech_expert',
      'creative_mentor'
    ],
    tutoringStrategies: [
      'scaffolding',
      'socratic_method',
      'analogical_reasoning',
      'worked_examples'
    ],
    messageTypes: [
      'question',
      'explanation', 
      'assessment',
      'encouragement',
      'clarification',
      'example',
      'analogy',
      'summary',
      'guidance',
      'feedback'
    ],
    assessmentFeatures: [
      'Understanding Level Detection',
      'Misconception Identification',
      'Confidence Scoring',
      'Difficulty Adjustment',
      'Practice Recommendations',
      'Topic Readiness Assessment'
    ]
  })
}
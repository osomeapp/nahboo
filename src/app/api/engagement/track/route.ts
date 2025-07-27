import { NextRequest, NextResponse } from 'next/server'
import { useCaseEngagementEngine, type EngagementContext } from '@/lib/use-case-engagement'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface EngagementTrackingRequest {
  action: 'track_interaction' | 'generate_actions' | 'get_metrics' | 'get_report' | 'update_context'
  
  // Common fields
  userId: string
  userProfile: UserProfile
  context: EngagementContext
  
  // For track_interaction
  interaction?: {
    contentId: string
    interactionType: string
    duration: number
    completionStatus: 'started' | 'in_progress' | 'completed' | 'abandoned'
    satisfactionRating?: number
    challengeLevel?: number
    metadata?: Record<string, any>
  }
  
  // For get_report
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  
  // For update_context
  contextUpdates?: Partial<EngagementContext>
}

interface EngagementTrackingResponse {
  success: boolean
  action: string
  
  // Response data
  metrics?: any
  actions?: any[]
  report?: any
  recommendations?: string[]
  
  metadata: {
    userId: string
    useCase: UserProfile['use_case']
    processingTime: number
    trackingActive: boolean
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: EngagementTrackingRequest = await request.json()

    if (!body.action || !body.userId || !body.userProfile) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId, userProfile' },
        { status: 400 }
      )
    }

    let response: Partial<EngagementTrackingResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'track_interaction':
        response = await handleTrackInteraction(body)
        break
        
      case 'generate_actions':
        response = await handleGenerateActions(body)
        break
        
      case 'get_metrics':
        response = await handleGetMetrics(body)
        break
        
      case 'get_report':
        response = await handleGetReport(body)
        break
        
      case 'update_context':
        response = await handleUpdateContext(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: track_interaction, generate_actions, get_metrics, get_report, or update_context' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: EngagementTrackingResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        useCase: body.userProfile.use_case,
        processingTime,
        trackingActive: true,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Engagement tracking API error:', error)
    return NextResponse.json(
      { error: 'Failed to process engagement tracking request' },
      { status: 500 }
    )
  }
}

// Handle interaction tracking
async function handleTrackInteraction(body: EngagementTrackingRequest): Promise<Partial<EngagementTrackingResponse>> {
  if (!body.interaction) {
    throw new Error('Missing interaction data for tracking')
  }

  const metrics = await useCaseEngagementEngine.trackEngagement(
    body.userId,
    body.userProfile,
    body.interaction,
    body.context
  )

  // Generate recommendations based on metrics
  const recommendations = generateEngagementRecommendations(metrics, body.userProfile.use_case)

  return { 
    metrics,
    recommendations
  }
}

// Handle engagement action generation
async function handleGenerateActions(body: EngagementTrackingRequest): Promise<Partial<EngagementTrackingResponse>> {
  // Get current metrics (would typically come from database)
  const mockMetrics = {
    sessionDuration: Math.random() * 1800000, // 0-30 minutes
    contentCompletionRate: Math.random() * 0.4 + 0.6, // 60-100%
    interactionFrequency: Math.random() * 0.5 + 0.5, // 50-100%
    retentionRate: Math.random() * 0.3 + 0.7, // 70-100%
    satisfactionScore: Math.random() * 0.4 + 0.6, // 60-100%
    progressVelocity: Math.random() * 0.5 + 0.25, // 25-75%
    challengePreference: Math.random() * 0.6 + 0.2, // 20-80%
    collaborationEngagement: Math.random() * 0.8, // 0-80%
    lastActivity: new Date()
  }

  const actions = await useCaseEngagementEngine.generateEngagementActions(
    body.userId,
    body.userProfile,
    mockMetrics,
    body.context
  )

  return { 
    actions,
    metrics: mockMetrics
  }
}

// Handle metrics retrieval
async function handleGetMetrics(body: EngagementTrackingRequest): Promise<Partial<EngagementTrackingResponse>> {
  // In a real implementation, this would retrieve stored metrics
  const mockMetrics = generateMockMetrics(body.userProfile.use_case)
  const recommendations = generateEngagementRecommendations(mockMetrics, body.userProfile.use_case)

  return { 
    metrics: mockMetrics,
    recommendations
  }
}

// Handle progress report generation
async function handleGetReport(body: EngagementTrackingRequest): Promise<Partial<EngagementTrackingResponse>> {
  const timeframe = body.timeframe || 'weekly'
  
  const report = await useCaseEngagementEngine.generateProgressReport(
    body.userId,
    body.userProfile,
    body.context,
    timeframe
  )

  const recommendations = generateReportRecommendations(report, body.userProfile)

  return { 
    report,
    recommendations
  }
}

// Handle context updates
async function handleUpdateContext(body: EngagementTrackingRequest): Promise<Partial<EngagementTrackingResponse>> {
  if (!body.contextUpdates) {
    throw new Error('Missing context updates')
  }

  // Update context (in real implementation, would update database)
  const updatedContext = { ...body.context, ...body.contextUpdates }
  
  // Generate new progress tracking configuration
  const progressConfig = useCaseEngagementEngine.createProgressTrackingConfig(
    body.userProfile,
    updatedContext
  )

  return { 
    metrics: { contextUpdated: true, progressConfig }
  }
}

// Helper functions

function generateMockMetrics(useCase: UserProfile['use_case']) {
  const baseMetrics = {
    sessionDuration: Math.random() * 1800000, // 0-30 minutes
    contentCompletionRate: Math.random() * 0.4 + 0.6, // 60-100%
    interactionFrequency: Math.random() * 0.5 + 0.5, // 50-100%
    retentionRate: Math.random() * 0.3 + 0.7, // 70-100%
    satisfactionScore: Math.random() * 0.4 + 0.6, // 60-100%
    progressVelocity: Math.random() * 0.5 + 0.25, // 25-75%
    challengePreference: Math.random() * 0.6 + 0.2, // 20-80%
    collaborationEngagement: Math.random() * 0.8, // 0-80%
    lastActivity: new Date()
  }

  // Adjust metrics based on use case
  switch (useCase) {
    case 'corporate_training':
      return {
        ...baseMetrics,
        sessionDuration: baseMetrics.sessionDuration * 1.2, // Longer sessions
        contentCompletionRate: Math.max(0.8, baseMetrics.contentCompletionRate), // Higher completion
        collaborationEngagement: Math.max(0.4, baseMetrics.collaborationEngagement) // More collaboration
      }

    case 'k12_education':
      return {
        ...baseMetrics,
        sessionDuration: baseMetrics.sessionDuration * 0.8, // Shorter sessions
        interactionFrequency: Math.max(0.7, baseMetrics.interactionFrequency), // More frequent interactions
        challengePreference: Math.min(0.6, baseMetrics.challengePreference) // Lower challenge preference
      }

    case 'higher_education':
      return {
        ...baseMetrics,
        sessionDuration: baseMetrics.sessionDuration * 1.5, // Longest sessions
        progressVelocity: Math.max(0.4, baseMetrics.progressVelocity), // Steady progress
        collaborationEngagement: Math.max(0.5, baseMetrics.collaborationEngagement) // High collaboration
      }

    case 'personal':
    case 'hobbyist':
      return {
        ...baseMetrics,
        satisfactionScore: Math.max(0.7, baseMetrics.satisfactionScore), // High satisfaction
        challengePreference: baseMetrics.challengePreference * 0.8 // Lower challenge
      }

    default:
      return baseMetrics
  }
}

function generateEngagementRecommendations(metrics: any, useCase: UserProfile['use_case']): string[] {
  const recommendations: string[] = []

  // Universal recommendations
  if (metrics.sessionDuration < 600000) { // Less than 10 minutes
    recommendations.push('Consider longer learning sessions for better retention')
  }

  if (metrics.contentCompletionRate < 0.7) {
    recommendations.push('Try adjusting content difficulty to improve completion rates')
  }

  if (metrics.satisfactionScore < 0.6) {
    recommendations.push('Explore different learning formats to find what works best')
  }

  // Use case-specific recommendations
  switch (useCase) {
    case 'corporate_training':
      if (metrics.collaborationEngagement < 0.3) {
        recommendations.push('Engage with team learning activities for better outcomes')
      }
      if (metrics.progressVelocity < 0.3) {
        recommendations.push('Set specific deadlines to maintain training momentum')
      }
      break

    case 'k12_education':
      if (metrics.interactionFrequency < 0.6) {
        recommendations.push('More frequent study sessions can improve understanding')
      }
      if (metrics.challengePreference > 0.8) {
        recommendations.push('Balance challenging content with achievable goals')
      }
      break

    case 'higher_education':
      if (metrics.collaborationEngagement < 0.4) {
        recommendations.push('Join study groups for collaborative learning benefits')
      }
      if (metrics.sessionDuration < 1200000) { // Less than 20 minutes
        recommendations.push('Extended study sessions support deeper learning')
      }
      break

    case 'personal':
    case 'hobbyist':
      if (metrics.satisfactionScore < 0.7) {
        recommendations.push('Focus on topics that genuinely interest you')
      }
      if (metrics.progressVelocity < 0.2) {
        recommendations.push('Set personal learning goals to maintain motivation')
      }
      break
  }

  return recommendations.slice(0, 3) // Limit to 3 recommendations
}

function generateReportRecommendations(report: any, userProfile: UserProfile): string[] {
  const recommendations: string[] = []

  if (!report) return recommendations

  // Analyze engagement metrics
  const engagement = report.metrics?.engagement
  if (engagement) {
    if (engagement.completionRate < 0.7) {
      recommendations.push('Focus on completing started content before moving to new topics')
    }
    
    if (engagement.satisfactionScore < 0.6) {
      recommendations.push('Consider exploring different learning styles or content formats')
    }
    
    if (engagement.progressVelocity < 0.3) {
      recommendations.push('Set more specific learning goals and deadlines')
    }
  }

  // Use case-specific analysis
  switch (userProfile.use_case) {
    case 'corporate_training':
      if (report.corporate?.trainingCompliance?.completed < 90) {
        recommendations.push('Prioritize compliance training to meet organizational requirements')
      }
      break

    case 'k12_education':
      if (report.academic?.curriculumProgress?.completed < 75) {
        recommendations.push('Focus on core curriculum topics to stay on track')
      }
      break

    case 'higher_education':
      if (report.academic?.courseProgress?.completed < 60) {
        recommendations.push('Create a study schedule to catch up with course requirements')
      }
      break
  }

  return recommendations.slice(0, 4) // Limit to 4 recommendations
}
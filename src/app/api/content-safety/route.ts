import { NextRequest, NextResponse } from 'next/server'
import { 
  contentSafetyEngine,
  type SafetyClassification,
  type SafetyReport,
  type ParentalControls,
  type SafetyMetrics
} from '@/lib/content-safety-engine'
import type { UserProfile, ContentItem } from '@/types'

export const maxDuration = 30

interface ContentSafetyAPIRequest {
  action: 'analyze_content' | 'submit_report' | 'configure_parental_controls' | 'get_metrics' | 'check_appropriateness'
  
  // For analyze_content
  content?: ContentItem
  userProfile?: UserProfile
  parentalControls?: ParentalControls
  
  // For submit_report
  contentId?: string
  reporterId?: string
  reportData?: Partial<SafetyReport>
  
  // For configure_parental_controls
  userId?: string
  parentEmail?: string
  controls?: Partial<ParentalControls>
  
  // For get_metrics
  timeframe?: 'daily' | 'weekly' | 'monthly'
}

interface ContentSafetyAPIResponse {
  success: boolean
  action: string
  
  // Analysis results
  classification?: SafetyClassification
  appropriate?: boolean
  reason?: string
  alternatives?: string[]
  
  // Report results
  report?: SafetyReport
  
  // Parental controls results
  parentalControls?: ParentalControls
  
  // Metrics results
  metrics?: SafetyMetrics
  
  metadata: {
    userId?: string
    contentId?: string
    processingTime: number
    confidenceScore?: number
    safetyLevel?: string
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: ContentSafetyAPIRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<ContentSafetyAPIResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'analyze_content':
        response = await handleAnalyzeContent(body)
        break
        
      case 'submit_report':
        response = await handleSubmitReport(body)
        break
        
      case 'configure_parental_controls':
        response = await handleConfigureParentalControls(body)
        break
        
      case 'get_metrics':
        response = await handleGetMetrics(body)
        break
        
      case 'check_appropriateness':
        response = await handleCheckAppropriateness(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: analyze_content, submit_report, configure_parental_controls, get_metrics, or check_appropriateness' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: ContentSafetyAPIResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userProfile?.id || body.userId,
        contentId: body.content?.id || body.contentId,
        processingTime,
        confidenceScore: response.classification?.confidenceScore,
        safetyLevel: response.classification?.safetyLevel,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Content safety API error:', error)
    return NextResponse.json(
      { error: 'Failed to process content safety request' },
      { status: 500 }
    )
  }
}

// Handle content safety analysis
async function handleAnalyzeContent(body: ContentSafetyAPIRequest): Promise<Partial<ContentSafetyAPIResponse>> {
  if (!body.content || !body.userProfile) {
    throw new Error('Missing content or userProfile for analysis')
  }

  const classification = await contentSafetyEngine.analyzeContentSafety(
    body.content,
    body.userProfile,
    { parentalControls: body.parentalControls }
  )

  return {
    classification
  }
}

// Handle safety report submission
async function handleSubmitReport(body: ContentSafetyAPIRequest): Promise<Partial<ContentSafetyAPIResponse>> {
  if (!body.contentId || !body.reporterId || !body.reportData) {
    throw new Error('Missing contentId, reporterId, or reportData for report submission')
  }

  const report = await contentSafetyEngine.submitSafetyReport(
    body.contentId,
    body.reporterId,
    body.reportData
  )

  return {
    report
  }
}

// Handle parental controls configuration
async function handleConfigureParentalControls(body: ContentSafetyAPIRequest): Promise<Partial<ContentSafetyAPIResponse>> {
  if (!body.userId || !body.parentEmail || !body.controls) {
    throw new Error('Missing userId, parentEmail, or controls for parental controls configuration')
  }

  const parentalControls = await contentSafetyEngine.configureParentalControls(
    body.userId,
    body.parentEmail,
    body.controls
  )

  return {
    parentalControls
  }
}

// Handle safety metrics retrieval
async function handleGetMetrics(body: ContentSafetyAPIRequest): Promise<Partial<ContentSafetyAPIResponse>> {
  if (!body.userId) {
    throw new Error('Missing userId for metrics retrieval')
  }

  const metrics = await contentSafetyEngine.getSafetyMetrics(
    body.userId,
    body.timeframe || 'weekly'
  )

  return {
    metrics
  }
}

// Handle content appropriateness check
async function handleCheckAppropriateness(body: ContentSafetyAPIRequest): Promise<Partial<ContentSafetyAPIResponse>> {
  if (!body.content || !body.userProfile) {
    throw new Error('Missing content or userProfile for appropriateness check')
  }

  const result = await contentSafetyEngine.isContentAppropriate(
    body.content,
    body.userProfile
  )

  return {
    appropriate: result.appropriate,
    reason: result.reason,
    alternatives: result.alternatives
  }
}
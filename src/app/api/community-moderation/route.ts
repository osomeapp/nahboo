import { NextRequest, NextResponse } from 'next/server'
import { 
  communityModerationEngine,
  type CommunityReport,
  type CommunityVote,
  type ModeratorAction,
  type ModerationQueue,
  type CommunityModerationMetrics,
  type ReportEvidence
} from '@/lib/community-moderation-engine'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface CommunityModerationAPIRequest {
  action: 'submit_report' | 'submit_vote' | 'moderator_review' | 'get_queue' | 'get_reports' | 'get_metrics' | 'resolve_report'
  
  // Common fields
  userId: string
  userProfile?: UserProfile
  
  // For submit_report
  contentId?: string
  reportData?: {
    reportType: CommunityReport['reportType']
    description: string
    evidence?: Partial<ReportEvidence>[]
    tags?: string[]
  }
  
  // For submit_vote
  reportId?: string
  voteData?: {
    voteType: CommunityVote['voteType']
    confidence: number
    reasoning?: string
  }
  
  // For moderator_review
  reviewData?: {
    decision: ModeratorAction['decision']
    reasoning: string
    reviewTime: number
    evidenceReviewed: string[]
  }
  
  // For get_queue
  queueType?: ModerationQueue['queueType']
  
  // For get_reports
  filters?: {
    status?: CommunityReport['status'][]
    reportType?: CommunityReport['reportType'][]
    severity?: CommunityReport['severity'][]
    category?: CommunityReport['category'][]
    timeRange?: 'last_day' | 'last_week' | 'last_month' | 'all_time'
    myReportsOnly?: boolean
  }
  
  // For get_metrics
  timeframe?: CommunityModerationMetrics['timeframe']
  
  // For resolve_report
  resolutionData?: {
    resolutionType: 'content_removed' | 'content_modified' | 'user_warned' | 'user_suspended' | 'no_violation' | 'policy_clarification'
    reasoning: string
    actions: string[]
    appealable?: boolean
  }
}

interface CommunityModerationAPIResponse {
  success: boolean
  action: string
  
  // Submit results
  report?: CommunityReport
  vote?: CommunityVote
  action_result?: ModeratorAction
  
  // Get results
  queue?: ModerationQueue
  reports?: CommunityReport[]
  myReports?: CommunityReport[]
  metrics?: CommunityModerationMetrics
  
  metadata: {
    userId: string
    processingTime: number
    itemCount: number
    moderationActive: boolean
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: CommunityModerationAPIRequest = await request.json()

    if (!body.action || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId' },
        { status: 400 }
      )
    }

    let response: Partial<CommunityModerationAPIResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'submit_report':
        response = await handleSubmitReport(body)
        break
        
      case 'submit_vote':
        response = await handleSubmitVote(body)
        break
        
      case 'moderator_review':
        response = await handleModeratorReview(body)
        break
        
      case 'get_queue':
        response = await handleGetQueue(body)
        break
        
      case 'get_reports':
        response = await handleGetReports(body)
        break
        
      case 'get_metrics':
        response = await handleGetMetrics(body)
        break
        
      case 'resolve_report':
        response = await handleResolveReport(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: submit_report, submit_vote, moderator_review, get_queue, get_reports, get_metrics, or resolve_report' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: CommunityModerationAPIResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        itemCount: getItemCount(response),
        moderationActive: true,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Community moderation API error:', error)
    return NextResponse.json(
      { error: 'Failed to process community moderation request' },
      { status: 500 }
    )
  }
}

// Handle report submission
async function handleSubmitReport(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  if (!body.contentId || !body.reportData || !body.userProfile) {
    throw new Error('Missing contentId, reportData, or userProfile for report submission')
  }

  const report = await communityModerationEngine.submitReport(
    body.contentId,
    body.userId,
    {
      id: body.userProfile.id,
      name: body.userProfile.name,
      age_group: body.userProfile.age_group
    },
    {
      reportType: body.reportData.reportType,
      description: body.reportData.description,
      evidence: body.reportData.evidence || [],
      tags: body.reportData.tags || []
    }
  )

  return { report }
}

// Handle vote submission
async function handleSubmitVote(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  if (!body.reportId || !body.voteData || !body.userProfile) {
    throw new Error('Missing reportId, voteData, or userProfile for vote submission')
  }

  const vote = await communityModerationEngine.submitCommunityVote(
    body.reportId,
    body.userId,
    {
      id: body.userProfile.id,
      age_group: body.userProfile.age_group
    },
    body.voteData
  )

  return { vote }
}

// Handle moderator review
async function handleModeratorReview(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  if (!body.reportId || !body.reviewData) {
    throw new Error('Missing reportId or reviewData for moderator review')
  }

  const action = await communityModerationEngine.moderatorReview(
    body.reportId,
    body.userId,
    body.reviewData
  )

  return { action_result: action }
}

// Handle queue retrieval
async function handleGetQueue(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  if (!body.queueType) {
    throw new Error('Missing queueType for queue retrieval')
  }

  // Convert filters if provided
  const filters = body.filters ? convertFiltersToQueueFilters(body.filters) : undefined

  const queue = communityModerationEngine.getModerationQueue(
    body.queueType,
    filters
  )

  return { queue: queue || undefined }
}

// Handle reports retrieval
async function handleGetReports(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  // In a real implementation, this would query reports from database
  // For now, we'll return mock reports based on filters
  const allReports = await getUserReports(body.userId, body.filters)
  
  let filteredReports = allReports
  let myReports = allReports.filter(report => report.reporterId === body.userId)

  // Apply filters
  if (body.filters) {
    filteredReports = applyReportFilters(allReports, body.filters)
    if (body.filters.myReportsOnly) {
      filteredReports = myReports
    }
  }

  return {
    reports: filteredReports,
    myReports
  }
}

// Handle metrics retrieval
async function handleGetMetrics(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  const timeframe = body.timeframe || 'weekly'
  const metrics = communityModerationEngine.getModerationMetrics(timeframe)
  
  return { metrics }
}

// Handle report resolution
async function handleResolveReport(body: CommunityModerationAPIRequest): Promise<Partial<CommunityModerationAPIResponse>> {
  if (!body.reportId || !body.resolutionData) {
    throw new Error('Missing reportId or resolutionData for report resolution')
  }

  const resolution = await communityModerationEngine.resolveReport(
    body.reportId,
    body.userId,
    body.resolutionData
  )

  return { success: true }
}

// Helper functions

function getItemCount(response: Partial<CommunityModerationAPIResponse>): number {
  if (response.reports) return response.reports.length
  if (response.queue) return response.queue.reports.length
  if (response.myReports) return response.myReports.length
  return 1
}

function convertFiltersToQueueFilters(filters: any): any[] {
  // Convert API filters to queue filters format
  const queueFilters: any[] = []
  
  if (filters.reportType && filters.reportType.length > 0) {
    queueFilters.push({
      filterId: 'report_type_filter',
      filterType: 'report_type',
      value: filters.reportType[0], // Simplified - take first type
      isActive: true
    })
  }
  
  if (filters.severity && filters.severity.length > 0) {
    queueFilters.push({
      filterId: 'severity_filter',
      filterType: 'severity',
      value: filters.severity[0], // Simplified - take first severity
      isActive: true
    })
  }

  return queueFilters
}

async function getUserReports(userId: string, filters?: any): Promise<CommunityReport[]> {
  // Mock implementation - in reality, this would query reports from database
  const mockReports: CommunityReport[] = [
    {
      reportId: `report_${Date.now()}_1`,
      contentId: 'content_123',
      reporterId: userId,
      reporterProfile: {
        id: userId,
        name: 'User Name',
        age_group: 'adult'
      },
      reportType: 'inappropriate_content',
      category: 'safety',
      description: 'This content contains inappropriate language that may not be suitable for younger users.',
      severity: 'medium',
      evidence: [{
        evidenceId: 'evidence_1',
        evidenceType: 'text_quote',
        content: 'Sample inappropriate text excerpt',
        metadata: { timestamp: new Date() },
        verificationStatus: 'unverified',
        submittedBy: userId
      }],
      tags: ['inappropriate', 'language'],
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'pending',
      priority: 6,
      communityVotes: [
        {
          voteId: 'vote_1',
          voterId: 'voter_1',
          voterProfile: { id: 'voter_1', age_group: 'adult' },
          voteType: 'support',
          confidence: 0.8,
          reasoning: 'I agree this content is inappropriate',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          weight: 1.2
        }
      ],
      moderatorActions: [],
      metadata: {
        sessionId: 'session_123',
        referralSource: 'community_report'
      }
    },
    {
      reportId: `report_${Date.now()}_2`,
      contentId: 'content_456',
      reporterId: 'other_user',
      reporterProfile: {
        id: 'other_user',
        name: 'Other User',
        age_group: 'teen'
      },
      reportType: 'misinformation',
      category: 'quality',
      description: 'This content contains factual inaccuracies that could mislead learners.',
      severity: 'high',
      evidence: [{
        evidenceId: 'evidence_2',
        evidenceType: 'url',
        content: 'https://factcheck.example.com/false-claim',
        metadata: { timestamp: new Date() },
        verificationStatus: 'verified',
        submittedBy: 'other_user'
      }],
      tags: ['misinformation', 'factual-error'],
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      status: 'reviewing',
      priority: 8,
      communityVotes: [
        {
          voteId: 'vote_2',
          voterId: userId,
          voterProfile: { id: userId, age_group: 'adult' },
          voteType: 'support',
          confidence: 0.9,
          reasoning: 'Verified the misinformation claim',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          weight: 1.2
        },
        {
          voteId: 'vote_3',
          voterId: 'voter_3',
          voterProfile: { id: 'voter_3', age_group: 'adult' },
          voteType: 'support',
          confidence: 0.85,
          timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
          weight: 1.0
        }
      ],
      moderatorActions: [{
        actionId: 'action_1',
        moderatorId: 'moderator_1',
        moderatorType: 'volunteer',
        actionType: 'review',
        decision: 'remove',
        reasoning: 'Content contains verified misinformation',
        evidenceReviewed: ['evidence_2'],
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        reviewTime: 15,
        appealed: false
      }],
      metadata: {
        sessionId: 'session_456',
        referralSource: 'ai_detection'
      }
    }
  ]

  return mockReports
}

function applyReportFilters(reports: CommunityReport[], filters: any): CommunityReport[] {
  return reports.filter(report => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(report.status)) {
      return false
    }
    
    if (filters.reportType && filters.reportType.length > 0 && !filters.reportType.includes(report.reportType)) {
      return false
    }
    
    if (filters.severity && filters.severity.length > 0 && !filters.severity.includes(report.severity)) {
      return false
    }
    
    if (filters.category && filters.category.length > 0 && !filters.category.includes(report.category)) {
      return false
    }
    
    // Time range filter
    if (filters.timeRange && filters.timeRange !== 'all_time') {
      const timeRangeMs = getTimeRangeMs(filters.timeRange)
      const cutoffTime = new Date(Date.now() - timeRangeMs)
      if (report.timestamp < cutoffTime) return false
    }
    
    return true
  })
}

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case 'last_day': return 24 * 60 * 60 * 1000
    case 'last_week': return 7 * 24 * 60 * 60 * 1000
    case 'last_month': return 30 * 24 * 60 * 60 * 1000
    default: return 7 * 24 * 60 * 60 * 1000
  }
}
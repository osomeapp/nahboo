// Community Moderation Engine
// Advanced system for community-driven content moderation and safety reporting
import type { UserProfile, ContentItem } from '@/types'
import type { SafetyReport, SafetyClassification } from './content-safety-engine'
import { contentSafetyEngine } from './content-safety-engine'
import { multiModelAI } from './multi-model-ai'

export interface CommunityReport {
  reportId: string
  contentId: string
  reporterId: string
  reporterProfile: Pick<UserProfile, 'id' | 'name' | 'age_group'>
  reportType: 'inappropriate_content' | 'misinformation' | 'harassment' | 'spam' | 'privacy_violation' | 'copyright' | 'other'
  category: 'safety' | 'quality' | 'policy' | 'legal'
  description: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  evidence: ReportEvidence[]
  tags: string[]
  timestamp: Date
  status: 'pending' | 'reviewing' | 'escalated' | 'resolved' | 'dismissed' | 'appealed'
  priority: number // 1-10, higher = more urgent
  communityVotes: CommunityVote[]
  moderatorActions: ModeratorAction[]
  resolution?: ReportResolution
  metadata: {
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    referralSource?: string
  }
}

export interface ReportEvidence {
  evidenceId: string
  evidenceType: 'screenshot' | 'text_quote' | 'video_timestamp' | 'url' | 'file_attachment' | 'user_interaction_log'
  content: string
  metadata: {
    timestamp?: Date
    fileSize?: number
    mimeType?: string
    checksum?: string
    ocrText?: string
  }
  verificationStatus: 'unverified' | 'verified' | 'disputed' | 'invalid'
  submittedBy: string
}

export interface CommunityVote {
  voteId: string
  voterId: string
  voterProfile: Pick<UserProfile, 'id' | 'age_group'>
  voteType: 'support' | 'dispute' | 'neutral'
  confidence: number // 0-1
  reasoning?: string
  timestamp: Date
  weight: number // Calculated based on voter reputation
}

export interface ModeratorAction {
  actionId: string
  moderatorId: string
  moderatorType: 'community' | 'volunteer' | 'staff' | 'ai_assisted'
  actionType: 'review' | 'investigate' | 'escalate' | 'resolve' | 'appeal_review' | 'policy_update'
  decision: 'approve' | 'remove' | 'modify' | 'warn_user' | 'suspend_user' | 'ban_user' | 'no_action'
  reasoning: string
  evidenceReviewed: string[]
  timestamp: Date
  reviewTime: number // minutes spent reviewing
  appealed: boolean
}

export interface ReportResolution {
  resolutionId: string
  resolvedBy: string
  resolutionType: 'content_removed' | 'content_modified' | 'user_warned' | 'user_suspended' | 'no_violation' | 'policy_clarification'
  reasoning: string
  actions: string[]
  timestamp: Date
  appealable: boolean
  appealDeadline?: Date
  communityFeedback?: {
    satisfactionScore: number
    improvementSuggestions: string[]
  }
}

export interface ModerationQueue {
  queueId: string
  queueType: 'priority' | 'community' | 'ai_flagged' | 'escalated' | 'appeals'
  reports: CommunityReport[]
  filters: QueueFilter[]
  sortBy: 'timestamp' | 'priority' | 'severity' | 'community_votes'
  assignedModerators: string[]
  lastUpdated: Date
}

export interface QueueFilter {
  filterId: string
  filterType: 'content_type' | 'report_type' | 'severity' | 'age_group' | 'tag' | 'time_range'
  value: any
  isActive: boolean
}

export interface ModeratorProfile {
  moderatorId: string
  userProfile: UserProfile
  moderatorLevel: 'trainee' | 'junior' | 'senior' | 'lead' | 'admin'
  specializations: string[]
  reputation: number
  statisticsThisMonth: {
    reportsReviewed: number
    averageReviewTime: number
    accuracyScore: number
    communityRating: number
    escalationRate: number
  }
  certifications: ModeratorCertification[]
  permissions: ModeratorPermission[]
  status: 'active' | 'inactive' | 'on_leave' | 'under_review'
}

export interface ModeratorCertification {
  certificationId: string
  name: string
  issuer: string
  issuedDate: Date
  expiryDate?: Date
  verificationCode: string
}

export interface ModeratorPermission {
  permissionId: string
  name: string
  description: string
  scope: 'content' | 'users' | 'reports' | 'system'
  level: 'read' | 'write' | 'admin'
}

export interface CommunityModerationMetrics {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  totalReports: number
  resolvedReports: number
  averageResolutionTime: number // hours
  communityParticipation: {
    activeReporters: number
    averageVotesPerReport: number
    consensusRate: number
  }
  moderatorPerformance: {
    activeModerators: number
    averageReviewTime: number
    accuracyScore: number
    escalationRate: number
  }
  contentHealth: {
    violationRate: number
    falsePositiveRate: number
    repeatOffenderRate: number
    improvementTrend: number
  }
  systemEfficiency: {
    automationRate: number
    humanReviewRequired: number
    appealRate: number
    overturnaRate: number
  }
}

export class CommunityModerationEngine {
  private reports: Map<string, CommunityReport> = new Map()
  private moderationQueues: Map<string, ModerationQueue> = new Map()
  private moderatorProfiles: Map<string, ModeratorProfile> = new Map()
  private reportHistory: CommunityReport[] = []
  private votingWeights: Map<string, number> = new Map()

  constructor() {
    this.initializeDefaultQueues()
    this.initializeVotingWeights()
  }

  /**
   * Submit a community report
   */
  async submitReport(
    contentId: string,
    reporterId: string,
    reporterProfile: Pick<UserProfile, 'id' | 'name' | 'age_group'>,
    reportData: {
      reportType: CommunityReport['reportType']
      description: string
      evidence?: Partial<ReportEvidence>[]
      tags?: string[]
    }
  ): Promise<CommunityReport> {
    
    const reportId = `report_${Date.now()}_${reporterId}`
    
    // Analyze report severity using AI
    const severity = await this.analyzeReportSeverity(reportData, contentId)
    
    // Create evidence entries
    const evidence: ReportEvidence[] = (reportData.evidence || []).map((ev, index) => ({
      evidenceId: `evidence_${reportId}_${index}`,
      evidenceType: ev.evidenceType || 'text_quote',
      content: ev.content || '',
      metadata: ev.metadata || {},
      verificationStatus: 'unverified',
      submittedBy: reporterId
    }))

    const report: CommunityReport = {
      reportId,
      contentId,
      reporterId,
      reporterProfile,
      reportType: reportData.reportType,
      category: this.categorizeReport(reportData.reportType),
      description: reportData.description,
      severity,
      evidence,
      tags: reportData.tags || [],
      timestamp: new Date(),
      status: 'pending',
      priority: this.calculateReportPriority(severity, reportData.reportType, reporterProfile),
      communityVotes: [],
      moderatorActions: [],
      metadata: {
        sessionId: `session_${Date.now()}`,
        referralSource: 'community_report'
      }
    }

    // Store report
    this.reports.set(reportId, report)
    this.reportHistory.push(report)

    // Add to appropriate moderation queue
    await this.addToModerationQueue(report)

    // Notify relevant moderators
    await this.notifyModerators(report)

    // Check for pattern detection
    await this.analyzeReportPatterns(report)

    return report
  }

  /**
   * Submit community vote on a report
   */
  async submitCommunityVote(
    reportId: string,
    voterId: string,
    voterProfile: Pick<UserProfile, 'id' | 'age_group'>,
    voteData: {
      voteType: CommunityVote['voteType']
      confidence: number
      reasoning?: string
    }
  ): Promise<CommunityVote> {
    
    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error(`Report ${reportId} not found`)
    }

    // Check if user already voted
    const existingVote = report.communityVotes.find(vote => vote.voterId === voterId)
    if (existingVote) {
      throw new Error('User has already voted on this report')
    }

    // Calculate vote weight based on user reputation and profile
    const weight = this.calculateVoteWeight(voterId, voterProfile)

    const vote: CommunityVote = {
      voteId: `vote_${Date.now()}_${voterId}`,
      voterId,
      voterProfile,
      voteType: voteData.voteType,
      confidence: voteData.confidence,
      reasoning: voteData.reasoning,
      timestamp: new Date(),
      weight
    }

    // Add vote to report
    report.communityVotes.push(vote)

    // Update report priority based on community consensus
    this.updateReportPriority(report)

    // Check if consensus threshold is reached
    await this.checkConsensusThreshold(report)

    return vote
  }

  /**
   * Moderator review of a report
   */
  async moderatorReview(
    reportId: string,
    moderatorId: string,
    reviewData: {
      decision: ModeratorAction['decision']
      reasoning: string
      reviewTime: number
      evidenceReviewed: string[]
    }
  ): Promise<ModeratorAction> {
    
    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error(`Report ${reportId} not found`)
    }

    const moderator = this.moderatorProfiles.get(moderatorId)
    if (!moderator) {
      throw new Error(`Moderator ${moderatorId} not found`)
    }

    const action: ModeratorAction = {
      actionId: `action_${Date.now()}_${moderatorId}`,
      moderatorId,
      moderatorType: this.getModeratorType(moderator),
      actionType: 'review',
      decision: reviewData.decision,
      reasoning: reviewData.reasoning,
      evidenceReviewed: reviewData.evidenceReviewed,
      timestamp: new Date(),
      reviewTime: reviewData.reviewTime,
      appealed: false
    }

    // Add action to report
    report.moderatorActions.push(action)

    // Update report status
    report.status = 'reviewing'

    // Execute moderation decision
    if (reviewData.decision !== 'no_action') {
      await this.executeModerationDecision(report, action)
    }

    // Update moderator statistics
    this.updateModeratorStatistics(moderatorId, action)

    return action
  }

  /**
   * Resolve a report
   */
  async resolveReport(
    reportId: string,
    resolverId: string,
    resolutionData: {
      resolutionType: ReportResolution['resolutionType']
      reasoning: string
      actions: string[]
      appealable?: boolean
    }
  ): Promise<ReportResolution> {
    
    const report = this.reports.get(reportId)
    if (!report) {
      throw new Error(`Report ${reportId} not found`)
    }

    const resolution: ReportResolution = {
      resolutionId: `resolution_${Date.now()}_${resolverId}`,
      resolvedBy: resolverId,
      resolutionType: resolutionData.resolutionType,
      reasoning: resolutionData.reasoning,
      actions: resolutionData.actions,
      timestamp: new Date(),
      appealable: resolutionData.appealable !== false,
      appealDeadline: resolutionData.appealable !== false ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined // 7 days
    }

    // Update report
    report.resolution = resolution
    report.status = 'resolved'

    // Notify involved parties
    await this.notifyResolution(report, resolution)

    // Update community moderation metrics
    this.updateModerationMetrics(report, resolution)

    return resolution
  }

  /**
   * Get moderation queue
   */
  getModerationQueue(
    queueType: ModerationQueue['queueType'],
    filters?: QueueFilter[],
    sortBy?: ModerationQueue['sortBy']
  ): ModerationQueue | null {
    
    const queue = this.moderationQueues.get(queueType)
    if (!queue) return null

    let filteredReports = queue.reports

    // Apply filters
    if (filters) {
      filteredReports = this.applyQueueFilters(filteredReports, filters)
    }

    // Apply sorting
    if (sortBy) {
      filteredReports = this.sortReports(filteredReports, sortBy)
    }

    return {
      ...queue,
      reports: filteredReports,
      filters: filters || queue.filters,
      sortBy: sortBy || queue.sortBy
    }
  }

  /**
   * Get community moderation metrics
   */
  getModerationMetrics(timeframe: CommunityModerationMetrics['timeframe'] = 'weekly'): CommunityModerationMetrics {
    const timeframeMs = this.getTimeframeMs(timeframe)
    const cutoffDate = new Date(Date.now() - timeframeMs)
    
    const recentReports = this.reportHistory.filter(report => report.timestamp >= cutoffDate)
    const resolvedReports = recentReports.filter(report => report.status === 'resolved')

    // Calculate metrics
    const totalReports = recentReports.length
    const averageResolutionTime = this.calculateAverageResolutionTime(resolvedReports)
    
    const communityVotes = recentReports.flatMap(report => report.communityVotes)
    const activeReporters = new Set(recentReports.map(report => report.reporterId)).size
    const averageVotesPerReport = totalReports > 0 ? communityVotes.length / totalReports : 0
    
    const moderatorActions = recentReports.flatMap(report => report.moderatorActions)
    const activeModerators = new Set(moderatorActions.map(action => action.moderatorId)).size
    const averageReviewTime = this.calculateAverageReviewTime(moderatorActions)

    return {
      timeframe,
      totalReports,
      resolvedReports: resolvedReports.length,
      averageResolutionTime,
      communityParticipation: {
        activeReporters,
        averageVotesPerReport,
        consensusRate: this.calculateConsensusRate(recentReports)
      },
      moderatorPerformance: {
        activeModerators,
        averageReviewTime,
        accuracyScore: this.calculateAccuracyScore(moderatorActions),
        escalationRate: this.calculateEscalationRate(recentReports)
      },
      contentHealth: {
        violationRate: this.calculateViolationRate(recentReports),
        falsePositiveRate: this.calculateFalsePositiveRate(resolvedReports),
        repeatOffenderRate: this.calculateRepeatOffenderRate(recentReports),
        improvementTrend: this.calculateImprovementTrend(timeframe)
      },
      systemEfficiency: {
        automationRate: this.calculateAutomationRate(recentReports),
        humanReviewRequired: this.calculateHumanReviewRate(recentReports),
        appealRate: this.calculateAppealRate(resolvedReports),
        overturnaRate: this.calculateOverturnRate(resolvedReports)
      }
    }
  }

  // Private helper methods

  private async analyzeReportSeverity(
    reportData: any,
    contentId: string
  ): Promise<CommunityReport['severity']> {
    try {
      const prompt = `
      Analyze this community report for severity assessment:
      
      Report Type: ${reportData.reportType}
      Description: ${reportData.description}
      Content ID: ${contentId}
      
      Determine severity level based on:
      1. Potential harm to users (especially children)
      2. Policy violation severity
      3. Community impact
      4. Legal implications
      5. Urgency of response needed
      
      Return JSON with:
      - severity: "low" | "medium" | "high" | "urgent"
      - reasoning: string explaining the assessment
      - recommendedAction: suggested immediate action
      `

      const response = await multiModelAI.generateContent(prompt, 'safety_analysis', {
        response_format: 'json',
        max_tokens: 300
      })

      const analysis = JSON.parse(response.content)
      return analysis.severity || 'medium'

    } catch (error) {
      console.error('Failed to analyze report severity:', error)
      return 'medium' // Default to medium severity
    }
  }

  private categorizeReport(reportType: CommunityReport['reportType']): CommunityReport['category'] {
    const categoryMap: Record<CommunityReport['reportType'], CommunityReport['category']> = {
      'inappropriate_content': 'safety',
      'harassment': 'safety',
      'misinformation': 'quality',
      'spam': 'policy',
      'privacy_violation': 'legal',
      'copyright': 'legal',
      'other': 'policy'
    }
    return categoryMap[reportType]
  }

  private calculateReportPriority(
    severity: CommunityReport['severity'],
    reportType: CommunityReport['reportType'],
    reporterProfile: Pick<UserProfile, 'age_group'>
  ): number {
    let priority = 5 // Base priority

    // Severity impact
    const severityWeights = { 'low': 1, 'medium': 3, 'high': 6, 'urgent': 10 }
    priority += severityWeights[severity]

    // Report type impact
    const typeWeights = {
      'harassment': 4,
      'inappropriate_content': 3,
      'privacy_violation': 3,
      'misinformation': 2,
      'spam': 1,
      'copyright': 1,
      'other': 1
    }
    priority += typeWeights[reportType]

    // Age group impact (higher priority for younger users)
    if (reporterProfile.age_group === 'child') priority += 3
    else if (reporterProfile.age_group === 'teen') priority += 2

    return Math.min(priority, 10) // Cap at 10
  }

  private calculateVoteWeight(
    voterId: string,
    voterProfile: Pick<UserProfile, 'age_group'>
  ): number {
    let weight = 1.0 // Base weight

    // Get stored weight or calculate new one
    const storedWeight = this.votingWeights.get(voterId)
    if (storedWeight) {
      weight = storedWeight
    } else {
      // Age group influence on vote weight
      if (voterProfile.age_group === 'adult') weight = 1.2
      else if (voterProfile.age_group === 'teen') weight = 0.8
      else weight = 0.6 // child

      this.votingWeights.set(voterId, weight)
    }

    return weight
  }

  private initializeDefaultQueues(): void {
    const defaultQueues: Partial<ModerationQueue>[] = [
      {
        queueId: 'priority',
        queueType: 'priority',
        reports: [],
        filters: [],
        sortBy: 'priority',
        assignedModerators: []
      },
      {
        queueId: 'community',
        queueType: 'community',
        reports: [],
        filters: [],
        sortBy: 'community_votes',
        assignedModerators: []
      },
      {
        queueId: 'ai_flagged',
        queueType: 'ai_flagged',
        reports: [],
        filters: [],
        sortBy: 'timestamp',
        assignedModerators: []
      }
    ]

    defaultQueues.forEach(queue => {
      this.moderationQueues.set(queue.queueType!, {
        ...queue,
        lastUpdated: new Date()
      } as ModerationQueue)
    })
  }

  private initializeVotingWeights(): void {
    // Initialize with default weights - in production, this would load from database
  }

  private async addToModerationQueue(report: CommunityReport): Promise<void> {
    // Determine appropriate queue based on report characteristics
    let queueType: ModerationQueue['queueType'] = 'community'
    
    if (report.priority >= 8) queueType = 'priority'
    else if (report.severity === 'urgent') queueType = 'priority'
    
    const queue = this.moderationQueues.get(queueType)
    if (queue) {
      queue.reports.push(report)
      queue.lastUpdated = new Date()
    }
  }

  private async notifyModerators(report: CommunityReport): Promise<void> {
    // In production, this would send notifications to relevant moderators
    console.log(`Notifying moderators about report ${report.reportId}`)
  }

  private async analyzeReportPatterns(report: CommunityReport): Promise<void> {
    // Pattern analysis for detecting coordinated reporting, spam, etc.
    console.log(`Analyzing patterns for report ${report.reportId}`)
  }

  // Additional helper methods with placeholder implementations
  private updateReportPriority(report: CommunityReport): void {
    // Recalculate priority based on community votes
    const supportVotes = report.communityVotes.filter(vote => vote.voteType === 'support')
    const totalWeight = supportVotes.reduce((sum, vote) => sum + vote.weight, 0)
    
    if (totalWeight > 5) {
      report.priority = Math.min(report.priority + 2, 10)
    }
  }

  private async checkConsensusThreshold(report: CommunityReport): Promise<void> {
    const votes = report.communityVotes
    if (votes.length >= 5) {
      const supportWeight = votes.filter(v => v.voteType === 'support').reduce((sum, v) => sum + v.weight, 0)
      const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0)
      
      if (supportWeight / totalWeight > 0.7) {
        // Strong consensus - escalate for faster review
        report.priority = Math.min(report.priority + 1, 10)
      }
    }
  }

  private getModeratorType(moderator: ModeratorProfile): ModeratorAction['moderatorType'] {
    if (moderator.moderatorLevel === 'admin') return 'staff'
    if (moderator.moderatorLevel === 'lead' || moderator.moderatorLevel === 'senior') return 'volunteer'
    return 'community'
  }

  private async executeModerationDecision(report: CommunityReport, action: ModeratorAction): Promise<void> {
    // Execute the moderation decision
    console.log(`Executing moderation decision: ${action.decision} for report ${report.reportId}`)
  }

  private updateModeratorStatistics(moderatorId: string, action: ModeratorAction): void {
    // Update moderator performance statistics
    console.log(`Updating statistics for moderator ${moderatorId}`)
  }

  private async notifyResolution(report: CommunityReport, resolution: ReportResolution): Promise<void> {
    // Notify involved parties about resolution
    console.log(`Notifying resolution for report ${report.reportId}`)
  }

  private updateModerationMetrics(report: CommunityReport, resolution: ReportResolution): void {
    // Update system-wide moderation metrics
    console.log(`Updating moderation metrics for report ${report.reportId}`)
  }

  // Queue management methods
  private applyQueueFilters(reports: CommunityReport[], filters: QueueFilter[]): CommunityReport[] {
    return reports.filter(report => {
      return filters.every(filter => {
        if (!filter.isActive) return true
        
        switch (filter.filterType) {
          case 'report_type':
            return report.reportType === filter.value
          case 'severity':
            return report.severity === filter.value
          case 'age_group':
            return report.reporterProfile.age_group === filter.value
          default:
            return true
        }
      })
    })
  }

  private sortReports(reports: CommunityReport[], sortBy: ModerationQueue['sortBy']): CommunityReport[] {
    return [...reports].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.priority - a.priority
        case 'severity':
          const severityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 }
          return severityOrder[b.severity] - severityOrder[a.severity]
        case 'community_votes':
          return b.communityVotes.length - a.communityVotes.length
        case 'timestamp':
        default:
          return b.timestamp.getTime() - a.timestamp.getTime()
      }
    })
  }

  // Metrics calculation methods (placeholder implementations)
  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case 'daily': return 24 * 60 * 60 * 1000
      case 'weekly': return 7 * 24 * 60 * 60 * 1000
      case 'monthly': return 30 * 24 * 60 * 60 * 1000
      case 'quarterly': return 90 * 24 * 60 * 60 * 1000
      default: return 7 * 24 * 60 * 60 * 1000
    }
  }

  private calculateAverageResolutionTime(reports: CommunityReport[]): number {
    const resolved = reports.filter(r => r.resolution)
    if (resolved.length === 0) return 0
    
    const totalTime = resolved.reduce((sum, report) => {
      const resolutionTime = report.resolution!.timestamp.getTime() - report.timestamp.getTime()
      return sum + (resolutionTime / (1000 * 60 * 60)) // Convert to hours
    }, 0)
    
    return totalTime / resolved.length
  }

  private calculateConsensusRate(reports: CommunityReport[]): number {
    if (reports.length === 0) return 0
    
    const reportsWithVotes = reports.filter(r => r.communityVotes.length >= 3)
    if (reportsWithVotes.length === 0) return 0
    
    const consensusReports = reportsWithVotes.filter(report => {
      const votes = report.communityVotes
      const supportVotes = votes.filter(v => v.voteType === 'support').length
      return supportVotes / votes.length >= 0.7
    })
    
    return consensusReports.length / reportsWithVotes.length
  }

  private calculateAverageReviewTime(actions: ModeratorAction[]): number {
    if (actions.length === 0) return 0
    return actions.reduce((sum, action) => sum + action.reviewTime, 0) / actions.length
  }

  private calculateAccuracyScore(actions: ModeratorAction[]): number {
    // Placeholder - would calculate based on appeal outcomes
    return 0.85
  }

  private calculateEscalationRate(reports: CommunityReport[]): number {
    const escalated = reports.filter(r => r.status === 'escalated').length
    return reports.length > 0 ? escalated / reports.length : 0
  }

  private calculateViolationRate(reports: CommunityReport[]): number {
    const violations = reports.filter(r => r.resolution?.resolutionType !== 'no_violation').length
    return reports.length > 0 ? violations / reports.length : 0
  }

  private calculateFalsePositiveRate(reports: CommunityReport[]): number {
    const falsePositives = reports.filter(r => r.resolution?.resolutionType === 'no_violation').length
    return reports.length > 0 ? falsePositives / reports.length : 0
  }

  private calculateRepeatOffenderRate(reports: CommunityReport[]): number {
    // Placeholder implementation
    return 0.15
  }

  private calculateImprovementTrend(timeframe: string): number {
    // Placeholder implementation
    return 0.05
  }

  private calculateAutomationRate(reports: CommunityReport[]): number {
    // Placeholder implementation
    return 0.3
  }

  private calculateHumanReviewRate(reports: CommunityReport[]): number {
    return 1 - this.calculateAutomationRate(reports)
  }

  private calculateAppealRate(reports: CommunityReport[]): number {
    // Placeholder implementation
    return 0.1
  }

  private calculateOverturnRate(reports: CommunityReport[]): number {
    // Placeholder implementation
    return 0.05
  }
}

// Export singleton instance
export const communityModerationEngine = new CommunityModerationEngine()
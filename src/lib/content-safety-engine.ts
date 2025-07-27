// Comprehensive Content Safety and Moderation Engine
// Advanced AI-powered system for child safety, content filtering, and educational appropriateness

import type { UserProfile, ContentItem } from '@/types'
import { multiModelAI } from './multi-model-ai'

export interface SafetyClassification {
  safetyLevel: 'safe' | 'caution' | 'restricted' | 'blocked'
  ageRating: 'all' | '6+' | '9+' | '12+' | '15+' | '18+'
  confidenceScore: number // 0-1
  contentCategories: ContentCategory[]
  riskFactors: RiskFactor[]
  educationalValue: number // 0-1 educational appropriateness
  parentalGuidance: boolean
  blockedReason?: string
}

export interface ContentCategory {
  category: 'educational' | 'entertainment' | 'informational' | 'interactive' | 'assessment'
  subcategory: string
  appropriateness: number // 0-1 how appropriate for stated age group
  confidence: number
}

export interface RiskFactor {
  riskType: 'language' | 'violence' | 'adult_content' | 'misinformation' | 'privacy' | 'psychological' | 'social' | 'technical'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation?: string
  ageImpact: Record<string, number> // Impact by age group
}

export interface SafetyPolicy {
  policyId: string
  name: string
  description: string
  ageGroups: string[]
  rules: SafetyRule[]
  exceptions: string[]
  parentalOverride: boolean
  strictness: 'lenient' | 'moderate' | 'strict' | 'very_strict'
}

export interface SafetyRule {
  ruleId: string
  type: 'content_filter' | 'interaction_limit' | 'time_restriction' | 'supervisor_required' | 'reporting_mandatory'
  condition: string
  action: 'allow' | 'warn' | 'restrict' | 'block' | 'report'
  parameters: Record<string, any>
  priority: number
}

export interface ModerationAction {
  actionId: string
  timestamp: Date
  contentId: string
  userId: string
  moderationType: 'automated' | 'human' | 'hybrid'
  action: 'approved' | 'flagged' | 'blocked' | 'modified' | 'escalated'
  reason: string
  confidence: number
  reviewer?: string
  appealable: boolean
}

export interface SafetyReport {
  reportId: string
  contentId: string
  reporterId: string
  reportType: 'inappropriate_content' | 'safety_concern' | 'privacy_violation' | 'misinformation' | 'harassment' | 'other'
  description: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed'
  evidence: ReportEvidence[]
  timestamp: Date
  resolution?: ModerationAction
}

export interface ReportEvidence {
  evidenceType: 'screenshot' | 'text_quote' | 'timestamp' | 'interaction_log' | 'user_statement'
  content: string
  metadata: Record<string, any>
}

export interface ParentalControls {
  userId: string
  parentEmail: string
  restrictions: ContentRestriction[]
  timeControls: TimeControl[]
  reportingPreferences: ReportingPreference[]
  emergencyContacts: string[]
  supervisionLevel: 'none' | 'minimal' | 'moderate' | 'strict' | 'supervised'
}

export interface ContentRestriction {
  restrictionType: 'subject' | 'difficulty' | 'content_type' | 'interaction' | 'time_duration'
  value: any
  isBlocked: boolean
  requiresApproval: boolean
}

export interface TimeControl {
  dayOfWeek: string
  allowedHours: { start: string; end: string }[]
  maxDailyTime: number // minutes
  breakRequirements: { interval: number; duration: number }
}

export interface ReportingPreference {
  eventType: string
  notificationMethod: 'email' | 'sms' | 'app' | 'none'
  frequency: 'immediate' | 'daily' | 'weekly'
  includeDetails: boolean
}

export interface SafetyMetrics {
  userId: string
  timeframe: 'daily' | 'weekly' | 'monthly'
  contentReviewed: number
  safetyViolations: number
  appropriateContentRate: number
  parentalInterventions: number
  reportingActivity: SafetyReportingActivity
  riskLevelTrends: Record<string, number>
}

export interface SafetyReportingActivity {
  reportsSubmitted: number
  reportsResolved: number
  averageResolutionTime: number // hours
  escalationRate: number
}

export class ContentSafetyEngine {
  private safetyPolicies: Map<string, SafetyPolicy> = new Map()
  private moderationHistory: Map<string, ModerationAction[]> = new Map()
  private parentalControls: Map<string, ParentalControls> = new Map()
  private safetyReports: Map<string, SafetyReport> = new Map()

  constructor() {
    this.initializeDefaultPolicies()
  }

  /**
   * Analyze content for safety and appropriateness
   */
  async analyzeContentSafety(
    content: ContentItem,
    userProfile: UserProfile,
    context?: { parentalControls?: ParentalControls }
  ): Promise<SafetyClassification> {
    
    // Multi-layer safety analysis
    const aiAnalysis = await this.performAISafetyAnalysis(content, userProfile)
    const ruleBasedAnalysis = this.performRuleBasedAnalysis(content, userProfile)
    const parentalAnalysis = context?.parentalControls ? 
      this.applyParentalControls(content, context.parentalControls) : null

    // Combine analyses with weighted scoring
    const combinedClassification = this.combineAnalyses(
      aiAnalysis,
      ruleBasedAnalysis,
      parentalAnalysis
    )

    // Log moderation action
    await this.logModerationAction(content, userProfile, combinedClassification)

    return combinedClassification
  }

  /**
   * Submit safety report
   */
  async submitSafetyReport(
    contentId: string,
    reporterId: string,
    reportData: Partial<SafetyReport>
  ): Promise<SafetyReport> {
    
    const report: SafetyReport = {
      reportId: `report_${Date.now()}_${reporterId}`,
      contentId,
      reporterId,
      reportType: reportData.reportType || 'other',
      description: reportData.description || '',
      severity: reportData.severity || 'medium',
      status: 'pending',
      evidence: reportData.evidence || [],
      timestamp: new Date()
    }

    this.safetyReports.set(report.reportId, report)

    // Auto-escalate urgent reports
    if (report.severity === 'urgent') {
      await this.escalateReport(report.reportId)
    }

    // Trigger automated analysis
    await this.processReportAutomatically(report)

    return report
  }

  /**
   * Configure parental controls
   */
  async configureParentalControls(
    userId: string,
    parentEmail: string,
    controls: Partial<ParentalControls>
  ): Promise<ParentalControls> {
    
    const parentalControls: ParentalControls = {
      userId,
      parentEmail,
      restrictions: controls.restrictions || [],
      timeControls: controls.timeControls || [],
      reportingPreferences: controls.reportingPreferences || [],
      emergencyContacts: controls.emergencyContacts || [],
      supervisionLevel: controls.supervisionLevel || 'moderate'
    }

    this.parentalControls.set(userId, parentalControls)
    return parentalControls
  }

  /**
   * Get safety metrics for user/parent dashboard
   */
  async getSafetyMetrics(
    userId: string,
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<SafetyMetrics> {
    
    const timeframeMs = this.getTimeframeMs(timeframe)
    const cutoffDate = new Date(Date.now() - timeframeMs)

    // Analyze moderation history
    const userModerations = this.moderationHistory.get(userId) || []
    const recentModerations = userModerations.filter(
      action => action.timestamp >= cutoffDate
    )

    // Calculate metrics
    const contentReviewed = recentModerations.length
    const safetyViolations = recentModerations.filter(
      action => action.action === 'blocked' || action.action === 'flagged'
    ).length

    const appropriateContentRate = contentReviewed > 0 ? 
      (contentReviewed - safetyViolations) / contentReviewed : 1

    // Get reporting activity
    const userReports = Array.from(this.safetyReports.values()).filter(
      report => report.reporterId === userId && report.timestamp >= cutoffDate
    )

    const reportingActivity: SafetyReportingActivity = {
      reportsSubmitted: userReports.length,
      reportsResolved: userReports.filter(r => r.status === 'resolved').length,
      averageResolutionTime: this.calculateAverageResolutionTime(userReports),
      escalationRate: userReports.filter(r => r.severity === 'urgent').length / Math.max(1, userReports.length)
    }

    return {
      userId,
      timeframe,
      contentReviewed,
      safetyViolations,
      appropriateContentRate,
      parentalInterventions: 0, // Would be calculated from parental control logs
      reportingActivity,
      riskLevelTrends: this.calculateRiskTrends(recentModerations)
    }
  }

  /**
   * Check if content is appropriate for user
   */
  async isContentAppropriate(
    content: ContentItem,
    userProfile: UserProfile
  ): Promise<{ appropriate: boolean; reason?: string; alternatives?: string[] }> {
    
    const classification = await this.analyzeContentSafety(content, userProfile)
    
    const userAge = this.calculateAge(userProfile.age_group)
    const contentMinAge = this.parseAgeRating(classification.ageRating)

    if (userAge < contentMinAge) {
      return {
        appropriate: false,
        reason: `Content is rated ${classification.ageRating}, but user is in ${userProfile.age_group} age group`,
        alternatives: await this.findAlternativeContent(content, userProfile)
      }
    }

    if (classification.safetyLevel === 'blocked' || classification.safetyLevel === 'restricted') {
      return {
        appropriate: false,
        reason: classification.blockedReason || 'Content does not meet safety standards',
        alternatives: await this.findAlternativeContent(content, userProfile)
      }
    }

    const parentalControls = this.parentalControls.get(userProfile.id)
    if (parentalControls) {
      const parentalCheck = this.checkParentalRestrictions(content, parentalControls)
      if (!parentalCheck.allowed) {
        return {
          appropriate: false,
          reason: parentalCheck.reason,
          alternatives: await this.findAlternativeContent(content, userProfile)
        }
      }
    }

    return { appropriate: true }
  }

  // Private helper methods

  private async performAISafetyAnalysis(
    content: ContentItem,
    userProfile: UserProfile
  ): Promise<SafetyClassification> {
    
    const prompt = `
    Analyze this educational content for safety and age-appropriateness:
    
    Content: ${JSON.stringify({
      title: content.title,
      description: content.description,
      type: content.type,
      subject: content.subject,
      tags: content.tags
    })}
    
    User: ${userProfile.age_group} learner studying ${userProfile.subject}
    
    Evaluate for:
    1. Educational value and appropriateness
    2. Age-appropriate language and concepts
    3. Safety concerns (violence, inappropriate content, etc.)
    4. Privacy and security considerations
    5. Psychological appropriateness for age group
    
    Return JSON with:
    - safetyLevel: "safe" | "caution" | "restricted" | "blocked"
    - ageRating: "all" | "6+" | "9+" | "12+" | "15+" | "18+"
    - confidenceScore: 0-1
    - riskFactors: array of {riskType, severity, description}
    - educationalValue: 0-1
    - parentalGuidance: boolean
    - blockedReason: string if blocked
    `

    try {
      const response = await multiModelAI.generateContent(prompt, 'education', {
        response_format: 'json',
        max_tokens: 800
      })

      const analysis = JSON.parse(response.content)
      
      return {
        safetyLevel: analysis.safetyLevel || 'caution',
        ageRating: analysis.ageRating || '12+',
        confidenceScore: analysis.confidenceScore || 0.8,
        contentCategories: [{
          category: 'educational',
          subcategory: content.subject || 'general',
          appropriateness: analysis.educationalValue || 0.8,
          confidence: analysis.confidenceScore || 0.8
        }],
        riskFactors: analysis.riskFactors || [],
        educationalValue: analysis.educationalValue || 0.8,
        parentalGuidance: analysis.parentalGuidance || false,
        blockedReason: analysis.blockedReason
      }

    } catch (error) {
      console.error('AI safety analysis failed:', error)
      // Fallback to conservative classification
      return {
        safetyLevel: 'caution',
        ageRating: '12+',
        confidenceScore: 0.5,
        contentCategories: [],
        riskFactors: [{
          riskType: 'technical',
          severity: 'low',
          description: 'Unable to complete automated analysis',
          ageImpact: {}
        }],
        educationalValue: 0.6,
        parentalGuidance: true
      }
    }
  }

  private performRuleBasedAnalysis(
    content: ContentItem,
    userProfile: UserProfile
  ): SafetyClassification {
    
    const userAge = this.calculateAge(userProfile.age_group)
    const riskFactors: RiskFactor[] = []
    let safetyLevel: SafetyClassification['safetyLevel'] = 'safe'
    let ageRating: SafetyClassification['ageRating'] = 'all'

    // Check content type appropriateness
    if (content.type === 'link' && userAge < 13) {
      riskFactors.push({
        riskType: 'privacy',
        severity: 'medium',
        description: 'External links may pose privacy risks for young users',
        ageImpact: { 'child': 0.8, 'teen': 0.3, 'adult': 0.1 }
      })
      safetyLevel = 'caution'
      ageRating = '13+'
    }

    // Check subject matter
    const sensitiveSubjects = ['health', 'psychology', 'social studies']
    if (sensitiveSubjects.includes(content.subject?.toLowerCase() || '')) {
      if (userAge < 12) {
        riskFactors.push({
          riskType: 'psychological',
          severity: 'medium',
          description: 'Content may contain concepts requiring mature understanding',
          ageImpact: { 'child': 0.7, 'teen': 0.2, 'adult': 0.0 }
        })
        safetyLevel = 'caution'
        ageRating = '12+'
      }
    }

    // Check difficulty vs age appropriateness
    if (content.difficulty && content.difficulty > userAge + 2) {
      riskFactors.push({
        riskType: 'psychological',
        severity: 'low',
        description: 'Content difficulty may cause frustration or anxiety',
        ageImpact: { 'child': 0.6, 'teen': 0.3, 'adult': 0.1 }
      })
    }

    return {
      safetyLevel,
      ageRating,
      confidenceScore: 0.9,
      contentCategories: [{
        category: 'educational',
        subcategory: content.subject || 'general',
        appropriateness: safetyLevel === 'safe' ? 0.9 : 0.6,
        confidence: 0.9
      }],
      riskFactors,
      educationalValue: 0.8,
      parentalGuidance: safetyLevel !== 'safe'
    }
  }

  private applyParentalControls(
    content: ContentItem,
    controls: ParentalControls
  ): SafetyClassification {
    
    const riskFactors: RiskFactor[] = []
    let safetyLevel: SafetyClassification['safetyLevel'] = 'safe'

    // Check content restrictions
    for (const restriction of controls.restrictions) {
      if (this.violatesRestriction(content, restriction)) {
        riskFactors.push({
          riskType: 'social',
          severity: 'high',
          description: `Violates parental restriction: ${restriction.restrictionType}`,
          ageImpact: { 'child': 1.0, 'teen': 0.8, 'adult': 0.0 }
        })
        safetyLevel = restriction.isBlocked ? 'blocked' : 'restricted'
      }
    }

    return {
      safetyLevel,
      ageRating: 'all',
      confidenceScore: 1.0,
      contentCategories: [],
      riskFactors,
      educationalValue: 0.8,
      parentalGuidance: true,
      blockedReason: safetyLevel === 'blocked' ? 'Blocked by parental controls' : undefined
    }
  }

  private combineAnalyses(
    aiAnalysis: SafetyClassification,
    ruleBasedAnalysis: SafetyClassification,
    parentalAnalysis: SafetyClassification | null
  ): SafetyClassification {
    
    // Use most restrictive classification
    const analyses = [aiAnalysis, ruleBasedAnalysis, parentalAnalysis].filter(Boolean) as SafetyClassification[]
    
    const safetyLevels = ['safe', 'caution', 'restricted', 'blocked']
    const mostRestrictive = analyses.reduce((most, current) => {
      const mostIndex = safetyLevels.indexOf(most.safetyLevel)
      const currentIndex = safetyLevels.indexOf(current.safetyLevel)
      return currentIndex > mostIndex ? current : most
    })

    // Combine risk factors
    const allRiskFactors = analyses.flatMap(analysis => analysis.riskFactors)
    
    // Use minimum educational value
    const minEducationalValue = Math.min(...analyses.map(a => a.educationalValue))

    return {
      ...mostRestrictive,
      riskFactors: allRiskFactors,
      educationalValue: minEducationalValue,
      confidenceScore: analyses.reduce((sum, a) => sum + a.confidenceScore, 0) / analyses.length
    }
  }

  private initializeDefaultPolicies(): void {
    // Child safety policy
    const childPolicy: SafetyPolicy = {
      policyId: 'child_safety',
      name: 'Child Safety Policy',
      description: 'Comprehensive safety policy for users under 13',
      ageGroups: ['child'],
      rules: [
        {
          ruleId: 'no_external_links',
          type: 'content_filter',
          condition: 'content.type === "link"',
          action: 'restrict',
          parameters: { requiresApproval: true },
          priority: 1
        },
        {
          ruleId: 'educational_only',
          type: 'content_filter',
          condition: 'content.educationalValue < 0.7',
          action: 'block',
          parameters: {},
          priority: 2
        }
      ],
      exceptions: [],
      parentalOverride: true,
      strictness: 'strict'
    }

    this.safetyPolicies.set(childPolicy.policyId, childPolicy)
  }

  // Additional helper methods with placeholder implementations
  private async logModerationAction(content: ContentItem, user: UserProfile, classification: SafetyClassification): Promise<void> {
    const action: ModerationAction = {
      actionId: `mod_${Date.now()}`,
      timestamp: new Date(),
      contentId: content.id,
      userId: user.id,
      moderationType: 'automated',
      action: classification.safetyLevel === 'blocked' ? 'blocked' : 'approved',
      reason: classification.blockedReason || 'Automated safety analysis',
      confidence: classification.confidenceScore,
      appealable: true
    }

    const userActions = this.moderationHistory.get(user.id) || []
    userActions.push(action)
    this.moderationHistory.set(user.id, userActions)
  }

  private calculateAge(ageGroup: string): number {
    const ageMap: Record<string, number> = {
      'child': 8,
      'teen': 15,
      'adult': 25
    }
    return ageMap[ageGroup] || 18
  }

  private parseAgeRating(rating: string): number {
    const match = rating.match(/(\d+)\+/)
    return match ? parseInt(match[1]) : 0
  }

  private async findAlternativeContent(content: ContentItem, user: UserProfile): Promise<string[]> {
    return [`Alternative ${content.subject} content for ${user.age_group}`, `Beginner-friendly ${content.subject} material`]
  }

  private checkParentalRestrictions(content: ContentItem, controls: ParentalControls): { allowed: boolean; reason?: string } {
    for (const restriction of controls.restrictions) {
      if (this.violatesRestriction(content, restriction)) {
        return {
          allowed: !restriction.isBlocked,
          reason: `Restricted by parental controls: ${restriction.restrictionType}`
        }
      }
    }
    return { allowed: true }
  }

  private violatesRestriction(content: ContentItem, restriction: ContentRestriction): boolean {
    switch (restriction.restrictionType) {
      case 'subject':
        return content.subject === restriction.value
      case 'content_type':
        return content.type === restriction.value
      case 'difficulty':
        return (content.difficulty || 0) > restriction.value
      default:
        return false
    }
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case 'daily': return 24 * 60 * 60 * 1000
      case 'weekly': return 7 * 24 * 60 * 60 * 1000
      case 'monthly': return 30 * 24 * 60 * 60 * 1000
      default: return 7 * 24 * 60 * 60 * 1000
    }
  }

  private calculateAverageResolutionTime(reports: SafetyReport[]): number {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.resolution)
    if (resolvedReports.length === 0) return 0

    const totalTime = resolvedReports.reduce((sum, report) => {
      const resolutionTime = report.resolution!.timestamp.getTime() - report.timestamp.getTime()
      return sum + (resolutionTime / (1000 * 60 * 60)) // Convert to hours
    }, 0)

    return totalTime / resolvedReports.length
  }

  private calculateRiskTrends(moderations: ModerationAction[]): Record<string, number> {
    const trends: Record<string, number> = {}
    // Implementation would analyze moderation patterns over time
    return trends
  }

  private async escalateReport(reportId: string): Promise<void> {
    // Implementation would notify human moderators
    console.log(`Escalating urgent report: ${reportId}`)
  }

  private async processReportAutomatically(report: SafetyReport): Promise<void> {
    // Implementation would run automated analysis on reported content
    console.log(`Processing report automatically: ${report.reportId}`)
  }
}

// Export singleton instance
export const contentSafetyEngine = new ContentSafetyEngine()
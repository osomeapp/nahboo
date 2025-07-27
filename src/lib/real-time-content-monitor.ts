// Real-Time Content Monitoring System
// Continuous monitoring for inappropriate content and safety violations
import type { UserProfile, ContentItem } from '@/types'
import type { 
  SafetyClassification, 
  SafetyReport, 
  ModerationAction,
  RiskFactor 
} from './content-safety-engine'
import { contentSafetyEngine } from './content-safety-engine'
import { multiModelAI } from './multi-model-ai'

export interface MonitoringRule {
  ruleId: string
  name: string
  description: string
  ruleType: 'content_scanning' | 'behavior_analysis' | 'pattern_detection' | 'keyword_filtering' | 'image_analysis'
  severity: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  conditions: MonitoringCondition[]
  actions: MonitoringAction[]
  frequency: number // milliseconds between checks
  priority: number
}

export interface MonitoringCondition {
  conditionId: string
  field: string
  operator: 'contains' | 'matches' | 'exceeds' | 'below' | 'equals' | 'pattern' | 'sentiment'
  value: any
  caseSensitive: boolean
  weight: number
}

export interface MonitoringAction {
  actionId: string
  actionType: 'flag' | 'block' | 'quarantine' | 'notify' | 'escalate' | 'log' | 'remove'
  parameters: Record<string, any>
  delay: number // milliseconds before executing
  requiresConfirmation: boolean
}

export interface MonitoringAlert {
  alertId: string
  contentId: string
  userId?: string
  alertType: 'inappropriate_content' | 'safety_violation' | 'suspicious_behavior' | 'policy_breach' | 'urgent_review'
  severity: 'low' | 'medium' | 'high' | 'critical'
  triggeredBy: string[] // rule IDs that triggered this alert
  detectedIssues: DetectedIssue[]
  timestamp: Date
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  assignedTo?: string
  resolution?: AlertResolution
  contextData: Record<string, any>
}

export interface DetectedIssue {
  issueType: 'inappropriate_language' | 'violent_content' | 'adult_content' | 'misinformation' | 'privacy_violation' | 'cyberbullying' | 'spam' | 'malware' | 'phishing'
  confidence: number
  description: string
  evidence: IssueEvidence[]
  riskLevel: RiskFactor['severity']
  ageImpact: Record<string, number>
}

export interface IssueEvidence {
  evidenceType: 'text_extract' | 'image_analysis' | 'pattern_match' | 'behavioral_indicator' | 'external_source'
  content: string
  confidence: number
  metadata: Record<string, any>
}

export interface AlertResolution {
  resolutionId: string
  resolvedAt: Date
  resolvedBy: string
  resolutionType: 'approved' | 'content_removed' | 'content_modified' | 'user_warned' | 'user_suspended' | 'false_positive'
  notes: string
  followUpRequired: boolean
}

export interface MonitoringMetrics {
  timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly'
  contentScanned: number
  alertsGenerated: number
  appropriateContentRate: number
  falsePositiveRate: number
  responseTime: number // average resolution time in minutes
  severityBreakdown: Record<string, number>
  topIssueTypes: Array<{ type: string; count: number }>
  userImpactMetrics: {
    usersProtected: number
    contentBlocked: number
    parentNotifications: number
  }
}

export interface ContentStreamMonitor {
  isActive: boolean
  scanInterval: number
  batchSize: number
  queueSize: number
  processedCount: number
  alertCount: number
  lastScanTime: Date | null
}

export class RealTimeContentMonitor {
  private monitoringRules: Map<string, MonitoringRule> = new Map()
  private activeAlerts: Map<string, MonitoringAlert> = new Map()
  private contentQueue: ContentItem[] = []
  private isMonitoring: boolean = false
  private scanInterval: NodeJS.Timeout | null = null
  private streamMonitor: ContentStreamMonitor
  private alertHistory: MonitoringAlert[] = []

  constructor() {
    this.streamMonitor = {
      isActive: false,
      scanInterval: 30000, // 30 seconds default
      batchSize: 10,
      queueSize: 100,
      processedCount: 0,
      alertCount: 0,
      lastScanTime: null
    }
    this.initializeDefaultRules()
  }

  /**
   * Start real-time content monitoring
   */
  async startMonitoring(scanIntervalMs: number = 30000): Promise<void> {
    if (this.isMonitoring) {
      console.warn('Content monitoring is already active')
      return
    }

    this.isMonitoring = true
    this.streamMonitor.isActive = true
    this.streamMonitor.scanInterval = scanIntervalMs

    // Start periodic scanning
    this.scanInterval = setInterval(async () => {
      await this.processBatch()
    }, scanIntervalMs)

    console.log(`Real-time content monitoring started (interval: ${scanIntervalMs}ms)`)
  }

  /**
   * Stop content monitoring
   */
  stopMonitoring(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }

    this.isMonitoring = false
    this.streamMonitor.isActive = false
    console.log('Real-time content monitoring stopped')
  }

  /**
   * Add content to monitoring queue
   */
  queueContent(content: ContentItem | ContentItem[]): void {
    const items = Array.isArray(content) ? content : [content]
    
    // Add to queue with size limit
    items.forEach(item => {
      if (this.contentQueue.length >= this.streamMonitor.queueSize) {
        // Remove oldest item to make space
        this.contentQueue.shift()
      }
      this.contentQueue.push(item)
    })
  }

  /**
   * Process a batch of content for safety violations
   */
  private async processBatch(): Promise<void> {
    if (this.contentQueue.length === 0) return

    const batch = this.contentQueue.splice(0, this.streamMonitor.batchSize)
    this.streamMonitor.lastScanTime = new Date()

    try {
      // Process each content item
      const analysisPromises = batch.map(content => this.analyzeContent(content))
      const analyses = await Promise.all(analysisPromises)

      // Check for violations and generate alerts
      analyses.forEach((analysis, index) => {
        const content = batch[index]
        this.checkForViolations(content, analysis)
      })

      this.streamMonitor.processedCount += batch.length

    } catch (error) {
      console.error('Failed to process content batch:', error)
    }
  }

  /**
   * Analyze content for safety and appropriateness
   */
  private async analyzeContent(content: ContentItem): Promise<SafetyClassification & { additionalAnalysis: any }> {
    try {
      // Get basic safety classification
      const mockUserProfile: UserProfile = {
        id: 'monitor',
        name: 'System Monitor',
        subject: content.subject || 'General',
        level: 'intermediate',
        age_group: 'adult',
        use_case: 'personal'
      }

      const safetyClassification = await contentSafetyEngine.analyzeContentSafety(content, mockUserProfile)

      // Perform additional analysis
      const additionalAnalysis = await this.performDeepAnalysis(content)

      return {
        ...safetyClassification,
        additionalAnalysis
      }

    } catch (error) {
      console.error('Failed to analyze content for monitoring:', error)
      // Return conservative classification
      return {
        safetyLevel: 'caution',
        ageRating: '18+',
        confidenceScore: 0.3,
        contentCategories: [],
        riskFactors: [{
          riskType: 'technical',
          severity: 'medium',
          description: 'Analysis failed - requires manual review',
          ageImpact: { 'child': 0.8, 'teen': 0.5, 'adult': 0.2 }
        }],
        educationalValue: 0.5,
        parentalGuidance: true,
        additionalAnalysis: {}
      }
    }
  }

  /**
   * Perform deep analysis using AI models
   */
  private async performDeepAnalysis(content: ContentItem): Promise<any> {
    const analysisPrompt = `
    Perform comprehensive safety analysis on this educational content for real-time monitoring:
    
    Content: ${JSON.stringify({
      title: content.title,
      description: content.description,
      type: content.type,
      subject: content.subject,
      metadata: content.metadata
    })}
    
    Analyze for:
    1. Inappropriate language or concepts
    2. Violence or disturbing content
    3. Adult or sexual content
    4. Misinformation or harmful advice
    5. Privacy violations or personal data exposure
    6. Cyberbullying or harassment indicators
    7. Spam or commercial exploitation
    8. Malware or phishing attempts
    
    Return JSON with:
    - detectedIssues: array of specific issues found
    - confidenceScores: confidence in each detection (0-1)
    - riskFactors: detailed risk assessment
    - recommendedActions: suggested monitoring actions
    - urgencyLevel: immediate/moderate/low intervention needed
    `

    try {
      const response = await multiModelAI.generateContent(analysisPrompt, 'safety_analysis', {
        response_format: 'json',
        max_tokens: 1000
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.error('Deep analysis failed:', error)
      return { detectedIssues: [], confidenceScores: {}, riskFactors: [] }
    }
  }

  /**
   * Check content analysis against monitoring rules
   */
  private checkForViolations(content: ContentItem, analysis: any): void {
    const triggeredRules: string[] = []
    const detectedIssues: DetectedIssue[] = []

    // Check each active monitoring rule
    for (const rule of this.monitoringRules.values()) {
      if (!rule.isActive) continue

      const violation = this.evaluateRule(rule, content, analysis)
      if (violation) {
        triggeredRules.push(rule.ruleId)
        detectedIssues.push(...violation.issues)
      }
    }

    // Generate alert if violations found
    if (triggeredRules.length > 0) {
      this.generateAlert(content, triggeredRules, detectedIssues, analysis)
    }
  }

  /**
   * Evaluate a monitoring rule against content
   */
  private evaluateRule(rule: MonitoringRule, content: ContentItem, analysis: any): { issues: DetectedIssue[] } | null {
    const issues: DetectedIssue[] = []
    let ruleTriggered = false

    for (const condition of rule.conditions) {
      const conditionMet = this.evaluateCondition(condition, content, analysis)
      if (conditionMet.isTrue) {
        ruleTriggered = true
        if (conditionMet.issue) {
          issues.push(conditionMet.issue)
        }
      }
    }

    return ruleTriggered ? { issues } : null
  }

  /**
   * Evaluate a single monitoring condition
   */
  private evaluateCondition(condition: MonitoringCondition, content: ContentItem, analysis: any): { isTrue: boolean; issue?: DetectedIssue } {
    let value: any
    
    // Extract value based on field
    switch (condition.field) {
      case 'content.title':
        value = content.title
        break
      case 'content.description':
        value = content.description
        break
      case 'content.type':
        value = content.type
        break
      case 'analysis.safetyLevel':
        value = analysis.safetyLevel
        break
      case 'analysis.confidenceScore':
        value = analysis.confidenceScore
        break
      case 'analysis.riskFactors':
        value = analysis.riskFactors
        break
      default:
        // Try to extract from metadata or additional analysis
        value = this.extractNestedValue(content, condition.field) || 
                this.extractNestedValue(analysis, condition.field)
    }

    // Evaluate condition
    const result = this.applyOperator(condition.operator, value, condition.value, condition.caseSensitive)
    
    if (result) {
      // Create issue if condition is met
      const issue: DetectedIssue = {
        issueType: this.mapConditionToIssueType(condition),
        confidence: condition.weight,
        description: `Rule condition triggered: ${condition.field} ${condition.operator} ${condition.value}`,
        evidence: [{
          evidenceType: 'pattern_match',
          content: String(value),
          confidence: condition.weight,
          metadata: { condition: condition.conditionId }
        }],
        riskLevel: 'medium',
        ageImpact: { 'child': 0.8, 'teen': 0.6, 'adult': 0.3 }
      }

      return { isTrue: true, issue }
    }

    return { isTrue: false }
  }

  /**
   * Generate monitoring alert
   */
  private generateAlert(content: ContentItem, triggeredRules: string[], issues: DetectedIssue[], analysis: any): void {
    const alertId = `alert_${Date.now()}_${content.id}`
    
    // Determine severity based on issues
    const severity = this.calculateAlertSeverity(issues, triggeredRules)
    
    const alert: MonitoringAlert = {
      alertId,
      contentId: content.id,
      alertType: this.determineAlertType(issues),
      severity,
      triggeredBy: triggeredRules,
      detectedIssues: issues,
      timestamp: new Date(),
      status: 'active',
      contextData: {
        contentTitle: content.title,
        contentType: content.type,
        safetyLevel: analysis.safetyLevel,
        analysisConfidence: analysis.confidenceScore
      }
    }

    this.activeAlerts.set(alertId, alert)
    this.alertHistory.push(alert)
    this.streamMonitor.alertCount++

    // Execute monitoring actions
    this.executeMonitoringActions(alert, triggeredRules)

    console.log(`🚨 Monitoring Alert Generated: ${alertId} (${severity})`)
  }

  /**
   * Execute actions for triggered monitoring rules
   */
  private async executeMonitoringActions(alert: MonitoringAlert, triggeredRuleIds: string[]): Promise<void> {
    for (const ruleId of triggeredRuleIds) {
      const rule = this.monitoringRules.get(ruleId)
      if (!rule) continue

      for (const action of rule.actions) {
        try {
          await this.executeAction(action, alert)
        } catch (error) {
          console.error(`Failed to execute monitoring action ${action.actionId}:`, error)
        }
      }
    }
  }

  /**
   * Execute a specific monitoring action
   */
  private async executeAction(action: MonitoringAction, alert: MonitoringAlert): Promise<void> {
    // Add delay if specified
    if (action.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, action.delay))
    }

    switch (action.actionType) {
      case 'flag':
        await this.flagContent(alert.contentId, alert)
        break
      
      case 'block':
        await this.blockContent(alert.contentId, alert)
        break
      
      case 'quarantine':
        await this.quarantineContent(alert.contentId, alert)
        break
      
      case 'notify':
        await this.sendNotification(alert, action.parameters)
        break
      
      case 'escalate':
        await this.escalateAlert(alert)
        break
      
      case 'log':
        this.logSecurityEvent(alert, action.parameters)
        break
      
      case 'remove':
        await this.removeContent(alert.contentId, alert)
        break
      
      default:
        console.warn(`Unknown monitoring action type: ${action.actionType}`)
    }
  }

  /**
   * Get monitoring metrics
   */
  getMonitoringMetrics(timeframe: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'): MonitoringMetrics {
    const timeframeMs = this.getTimeframeMs(timeframe)
    const cutoffTime = new Date(Date.now() - timeframeMs)
    
    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp >= cutoffTime)
    
    const severityBreakdown = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const issueTypeCounts = recentAlerts.flatMap(alert => alert.detectedIssues)
      .reduce((acc, issue) => {
        acc[issue.issueType] = (acc[issue.issueType] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topIssueTypes = Object.entries(issueTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    return {
      timeframe,
      contentScanned: this.streamMonitor.processedCount,
      alertsGenerated: recentAlerts.length,
      appropriateContentRate: this.streamMonitor.processedCount > 0 ? 
        (this.streamMonitor.processedCount - recentAlerts.length) / this.streamMonitor.processedCount : 1,
      falsePositiveRate: recentAlerts.filter(a => a.status === 'false_positive').length / Math.max(1, recentAlerts.length),
      responseTime: this.calculateAverageResponseTime(recentAlerts),
      severityBreakdown,
      topIssueTypes,
      userImpactMetrics: {
        usersProtected: new Set(recentAlerts.map(a => a.userId).filter(Boolean)).size,
        contentBlocked: recentAlerts.filter(a => a.detectedIssues.some(i => i.riskLevel === 'high')).length,
        parentNotifications: recentAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length
      }
    }
  }

  // Private helper methods
  private initializeDefaultRules(): void {
    // Inappropriate language detection
    const inappropriateLanguageRule: MonitoringRule = {
      ruleId: 'inappropriate_language',
      name: 'Inappropriate Language Detection',
      description: 'Detects profanity, hate speech, and inappropriate language',
      ruleType: 'keyword_filtering',
      severity: 'high',
      isActive: true,
      conditions: [
        {
          conditionId: 'profanity_check',
          field: 'content.description',
          operator: 'pattern',
          value: '\\b(profanity|inappropriate|offensive)\\b',
          caseSensitive: false,
          weight: 0.8
        }
      ],
      actions: [
        { actionId: 'flag_content', actionType: 'flag', parameters: {}, delay: 0, requiresConfirmation: false },
        { actionId: 'notify_moderator', actionType: 'notify', parameters: { type: 'moderator' }, delay: 1000, requiresConfirmation: false }
      ],
      frequency: 10000,
      priority: 1
    }

    this.monitoringRules.set(inappropriateLanguageRule.ruleId, inappropriateLanguageRule)
  }

  private extractNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private applyOperator(operator: string, value: any, target: any, caseSensitive: boolean): boolean {
    if (!caseSensitive && typeof value === 'string' && typeof target === 'string') {
      value = value.toLowerCase()
      target = target.toLowerCase()
    }

    switch (operator) {
      case 'contains':
        return String(value).includes(String(target))
      case 'matches':
        return value === target
      case 'exceeds':
        return Number(value) > Number(target)
      case 'below':
        return Number(value) < Number(target)
      case 'equals':
        return value === target
      case 'pattern':
        const regex = new RegExp(target, caseSensitive ? 'g' : 'gi')
        return regex.test(String(value))
      default:
        return false
    }
  }

  private mapConditionToIssueType(condition: MonitoringCondition): DetectedIssue['issueType'] {
    // Map condition types to issue types
    if (condition.field.includes('language') || condition.value.includes('profanity')) {
      return 'inappropriate_language'
    }
    return 'inappropriate_content'
  }

  private calculateAlertSeverity(issues: DetectedIssue[], triggeredRules: string[]): MonitoringAlert['severity'] {
    const maxSeverity = issues.reduce((max, issue) => {
      const severityLevels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 }
      const currentLevel = severityLevels[issue.riskLevel] || 1
      const maxLevel = severityLevels[max] || 1
      return currentLevel > maxLevel ? issue.riskLevel : max
    }, 'low' as MonitoringAlert['severity'])

    return maxSeverity
  }

  private determineAlertType(issues: DetectedIssue[]): MonitoringAlert['alertType'] {
    if (issues.some(i => i.issueType === 'inappropriate_language' || i.issueType === 'inappropriate_content')) {
      return 'inappropriate_content'
    }
    return 'safety_violation'
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case 'hourly': return 60 * 60 * 1000
      case 'daily': return 24 * 60 * 60 * 1000
      case 'weekly': return 7 * 24 * 60 * 60 * 1000
      case 'monthly': return 30 * 24 * 60 * 60 * 1000
      default: return 24 * 60 * 60 * 1000
    }
  }

  private calculateAverageResponseTime(alerts: MonitoringAlert[]): number {
    const resolvedAlerts = alerts.filter(a => a.resolution)
    if (resolvedAlerts.length === 0) return 0

    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const resolutionTime = alert.resolution!.resolvedAt.getTime() - alert.timestamp.getTime()
      return sum + (resolutionTime / (1000 * 60)) // Convert to minutes
    }, 0)

    return totalTime / resolvedAlerts.length
  }

  // Action implementation methods (placeholders)
  private async flagContent(contentId: string, alert: MonitoringAlert): Promise<void> {
    console.log(`🏴 Flagged content ${contentId} due to alert ${alert.alertId}`)
  }

  private async blockContent(contentId: string, alert: MonitoringAlert): Promise<void> {
    console.log(`🚫 Blocked content ${contentId} due to alert ${alert.alertId}`)
  }

  private async quarantineContent(contentId: string, alert: MonitoringAlert): Promise<void> {
    console.log(`🔒 Quarantined content ${contentId} due to alert ${alert.alertId}`)
  }

  private async sendNotification(alert: MonitoringAlert, parameters: any): Promise<void> {
    console.log(`📧 Sent notification for alert ${alert.alertId}`, parameters)
  }

  private async escalateAlert(alert: MonitoringAlert): Promise<void> {
    alert.severity = 'critical'
    console.log(`⬆️ Escalated alert ${alert.alertId} to critical`)
  }

  private logSecurityEvent(alert: MonitoringAlert, parameters: any): void {
    console.log(`📝 Logged security event for alert ${alert.alertId}`, parameters)
  }

  private async removeContent(contentId: string, alert: MonitoringAlert): Promise<void> {
    console.log(`🗑️ Removed content ${contentId} due to alert ${alert.alertId}`)
  }
}

// Export singleton instance
export const realTimeContentMonitor = new RealTimeContentMonitor()
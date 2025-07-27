import { NextRequest, NextResponse } from 'next/server'
import { 
  realTimeContentMonitor,
  type MonitoringAlert,
  type MonitoringMetrics,
  type MonitoringRule,
  type ContentStreamMonitor
} from '@/lib/real-time-content-monitor'
import type { UserProfile, ContentItem } from '@/types'

export const maxDuration = 30

interface MonitoringAPIRequest {
  action: 'initialize' | 'start' | 'stop' | 'queue_content' | 'get_alerts' | 'get_metrics' | 'resolve_alert' | 'configure' | 'get_dashboard'
  
  // Common fields
  userId: string
  userProfile?: UserProfile
  
  // For initialize/configure
  configuration?: {
    scanInterval: number
    batchSize: number
    alertThreshold: number
    autoModeration: boolean
    notificationSettings: {
      emailAlerts: boolean
      pushNotifications: boolean
      parentNotifications: boolean
    }
  }
  
  // For start monitoring
  scanInterval?: number
  
  // For queue_content
  content?: ContentItem | ContentItem[]
  
  // For get_alerts
  filters?: {
    severity: MonitoringAlert['severity'][]
    alertTypes: MonitoringAlert['alertType'][]
    status: MonitoringAlert['status'][]
    timeRange: 'last_hour' | 'last_day' | 'last_week' | 'last_month'
    showResolved: boolean
  }
  forceRefresh?: boolean
  
  // For get_metrics
  timeframe?: MonitoringMetrics['timeframe']
  
  // For resolve_alert
  alertId?: string
  resolutionType?: 'approved' | 'content_removed' | 'content_modified' | 'user_warned' | 'user_suspended' | 'false_positive'
  notes?: string
}

interface MonitoringAPIResponse {
  success: boolean
  action: string
  
  // Initialize/start results
  streamStatus?: ContentStreamMonitor
  activeRules?: MonitoringRule[]
  
  // Alert results
  alerts?: MonitoringAlert[]
  recentIssues?: any[]
  
  // Metrics results
  metrics?: MonitoringMetrics
  
  // Dashboard results
  dashboard?: {
    overview: {
      totalContentScanned: number
      activeAlerts: number
      criticalAlerts: number
      safetyScore: number
    }
    recentActivity: MonitoringAlert[]
    topIssues: Array<{ type: string; count: number }>
    performanceMetrics: {
      responseTime: number
      falsePositiveRate: number
      contentBlockedRate: number
    }
  }
  
  metadata: {
    userId: string
    processingTime: number
    monitoringActive: boolean
    alertCount: number
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: MonitoringAPIRequest = await request.json()

    if (!body.action || !body.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: action, userId' },
        { status: 400 }
      )
    }

    let response: Partial<MonitoringAPIResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'initialize':
        response = await handleInitialize(body)
        break
        
      case 'start':
        response = await handleStart(body)
        break
        
      case 'stop':
        response = await handleStop(body)
        break
        
      case 'queue_content':
        response = await handleQueueContent(body)
        break
        
      case 'get_alerts':
        response = await handleGetAlerts(body)
        break
        
      case 'get_metrics':
        response = await handleGetMetrics(body)
        break
        
      case 'resolve_alert':
        response = await handleResolveAlert(body)
        break
        
      case 'configure':
        response = await handleConfigure(body)
        break
        
      case 'get_dashboard':
        response = await handleGetDashboard(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: initialize, start, stop, queue_content, get_alerts, get_metrics, resolve_alert, configure, or get_dashboard' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: MonitoringAPIResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        monitoringActive: true, // Monitoring service is available
        alertCount: response.alerts?.length || 0,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Monitoring API error:', error)
    return NextResponse.json(
      { error: 'Failed to process monitoring request' },
      { status: 500 }
    )
  }
}

// Handle monitoring initialization
async function handleInitialize(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  if (!body.configuration) {
    throw new Error('Missing configuration for monitoring initialization')
  }

  // Initialize monitoring system (in a real implementation, this would set up user-specific monitoring)
  const activeRules = await getActiveMonitoringRules(body.userId, body.userProfile)
  const streamStatus = getStreamStatus()

  return {
    streamStatus,
    activeRules
  }
}

// Handle start monitoring
async function handleStart(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  const scanInterval = body.scanInterval || 30000
  
  await realTimeContentMonitor.startMonitoring(scanInterval)
  
  return {
    streamStatus: getStreamStatus()
  }
}

// Handle stop monitoring  
async function handleStop(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  realTimeContentMonitor.stopMonitoring()
  
  return {
    streamStatus: getStreamStatus()
  }
}

// Handle content queuing
async function handleQueueContent(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  if (!body.content) {
    throw new Error('Missing content for queuing')
  }

  realTimeContentMonitor.queueContent(body.content)
  
  return {
    streamStatus: getStreamStatus()
  }
}

// Handle get alerts
async function handleGetAlerts(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  // In a real implementation, this would query a database for user's alerts
  // For now, we'll return mock alerts based on the monitoring system
  const allAlerts = await getUserAlerts(body.userId)
  
  let filteredAlerts = allAlerts
  
  if (body.filters) {
    filteredAlerts = allAlerts.filter(alert => {
      if (body.filters!.severity && !body.filters!.severity.includes(alert.severity)) return false
      if (body.filters!.alertTypes && !body.filters!.alertTypes.includes(alert.alertType)) return false
      if (body.filters!.status && !body.filters!.status.includes(alert.status)) return false
      if (!body.filters!.showResolved && alert.status === 'resolved') return false
      
      // Time range filter
      const timeRangeMs = getTimeRangeMs(body.filters!.timeRange)
      const cutoffTime = new Date(Date.now() - timeRangeMs)
      if (alert.timestamp < cutoffTime) return false
      
      return true
    })
  }

  const recentIssues = filteredAlerts.flatMap(alert => alert.detectedIssues).slice(0, 10)

  return {
    alerts: filteredAlerts,
    recentIssues
  }
}

// Handle get metrics
async function handleGetMetrics(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  const timeframe = body.timeframe || 'daily'
  const metrics = realTimeContentMonitor.getMonitoringMetrics(timeframe)
  
  return {
    metrics
  }
}

// Handle resolve alert
async function handleResolveAlert(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  if (!body.alertId || !body.resolutionType) {
    throw new Error('Missing alertId or resolutionType for alert resolution')
  }

  // In a real implementation, this would update the alert in the database
  await resolveUserAlert(body.userId, body.alertId, body.resolutionType, body.notes || '')
  
  return {
    success: true
  }
}

// Handle configuration update
async function handleConfigure(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  if (!body.configuration) {
    throw new Error('Missing configuration for monitoring setup')
  }

  // In a real implementation, this would save user configuration to database
  await saveUserMonitoringConfig(body.userId, body.configuration)
  
  return {
    streamStatus: getStreamStatus()
  }
}

// Handle dashboard data
async function handleGetDashboard(body: MonitoringAPIRequest): Promise<Partial<MonitoringAPIResponse>> {
  const metrics = realTimeContentMonitor.getMonitoringMetrics('daily')
  const alerts = await getUserAlerts(body.userId)
  const recentActivity = alerts.slice(0, 10)
  
  const topIssues = alerts
    .flatMap(alert => alert.detectedIssues)
    .reduce((acc, issue) => {
      acc[issue.issueType] = (acc[issue.issueType] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  const topIssuesArray = Object.entries(topIssues)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }))

  const dashboard = {
    overview: {
      totalContentScanned: metrics.contentScanned,
      activeAlerts: alerts.filter(a => a.status === 'active').length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      safetyScore: Math.round(metrics.appropriateContentRate * 100)
    },
    recentActivity,
    topIssues: topIssuesArray,
    performanceMetrics: {
      responseTime: metrics.responseTime,
      falsePositiveRate: metrics.falsePositiveRate,
      contentBlockedRate: alerts.filter(a => a.detectedIssues.some(i => i.riskLevel === 'high')).length / Math.max(1, metrics.contentScanned)
    }
  }
  
  return { dashboard }
}

// Helper functions (these would typically interact with a database)

async function getActiveMonitoringRules(userId: string, userProfile?: UserProfile): Promise<MonitoringRule[]> {
  // Mock implementation - in reality, this would query user-specific rules from database
  const baseRules: MonitoringRule[] = [
    {
      ruleId: 'inappropriate_language',
      name: 'Inappropriate Language Detection',
      description: 'Detects profanity and inappropriate language',
      ruleType: 'keyword_filtering',
      severity: 'high',
      isActive: true,
      conditions: [],
      actions: [],
      frequency: 10000,
      priority: 1
    },
    {
      ruleId: 'adult_content',
      name: 'Adult Content Detection',
      description: 'Detects mature or adult content',
      ruleType: 'content_scanning',
      severity: 'critical',
      isActive: userProfile?.age_group === 'child' || userProfile?.age_group === 'teen',
      conditions: [],
      actions: [],
      frequency: 10000,
      priority: 2
    }
  ]

  return baseRules.filter(rule => rule.isActive)
}

function getStreamStatus(): ContentStreamMonitor {
  // Mock implementation - in reality, this would come from the monitoring system
  return {
    isActive: true,
    scanInterval: 30000,
    batchSize: 10,
    queueSize: 100,
    processedCount: Math.floor(Math.random() * 1000) + 100,
    alertCount: Math.floor(Math.random() * 50) + 5,
    lastScanTime: new Date()
  }
}

async function getUserAlerts(userId: string): Promise<MonitoringAlert[]> {
  // Mock implementation - in reality, this would query user alerts from database
  const mockAlerts: MonitoringAlert[] = [
    {
      alertId: `alert_${Date.now()}_1`,
      contentId: 'content_123',
      userId,
      alertType: 'inappropriate_content',
      severity: 'medium',
      triggeredBy: ['inappropriate_language'],
      detectedIssues: [{
        issueType: 'inappropriate_language',
        confidence: 0.8,
        description: 'Detected potentially inappropriate language',
        evidence: [{
          evidenceType: 'text_extract',
          content: 'Sample inappropriate text',
          confidence: 0.8,
          metadata: {}
        }],
        riskLevel: 'medium',
        ageImpact: { 'child': 0.9, 'teen': 0.6, 'adult': 0.3 }
      }],
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      status: 'active',
      contextData: {
        contentTitle: 'Sample Content',
        contentType: 'text'
      }
    },
    {
      alertId: `alert_${Date.now()}_2`,
      contentId: 'content_456',
      userId,
      alertType: 'safety_violation',
      severity: 'high',
      triggeredBy: ['adult_content'],
      detectedIssues: [{
        issueType: 'adult_content',
        confidence: 0.95,
        description: 'Content contains adult themes',
        evidence: [{
          evidenceType: 'pattern_match',
          content: 'Adult content pattern detected',
          confidence: 0.95,
          metadata: {}
        }],
        riskLevel: 'high',
        ageImpact: { 'child': 1.0, 'teen': 0.8, 'adult': 0.2 }
      }],
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      status: 'investigating',
      contextData: {
        contentTitle: 'Sample Video Content',
        contentType: 'video'
      }
    }
  ]

  return mockAlerts
}

async function resolveUserAlert(userId: string, alertId: string, resolutionType: string, notes: string): Promise<void> {
  // Mock implementation - in reality, this would update the alert in the database
  console.log(`Resolved alert ${alertId} for user ${userId} with resolution: ${resolutionType}`)
}

async function saveUserMonitoringConfig(userId: string, config: any): Promise<void> {
  // Mock implementation - in reality, this would save configuration to database
  console.log(`Saved monitoring config for user ${userId}:`, config)
}

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case 'last_hour': return 60 * 60 * 1000
    case 'last_day': return 24 * 60 * 60 * 1000
    case 'last_week': return 7 * 24 * 60 * 60 * 1000
    case 'last_month': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}
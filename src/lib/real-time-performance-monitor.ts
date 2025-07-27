// Real-Time Model Performance Monitor
// Continuous monitoring system for AI model performance metrics
'use client'

interface PerformanceMetric {
  timestamp: number
  modelId: string
  useCase: string
  userId: string
  responseTime: number
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  cost: number
  qualityScore?: number
  userSatisfaction?: number
  errorType?: string
  success: boolean
  metadata?: Record<string, any>
}

interface PerformanceAlert {
  id: string
  type: 'latency' | 'error_rate' | 'cost' | 'quality' | 'availability'
  severity: 'low' | 'medium' | 'high' | 'critical'
  modelId: string
  useCase?: string
  message: string
  threshold: number
  currentValue: number
  timestamp: number
  acknowledged: boolean
}

interface MonitoringThresholds {
  responseTime: {
    warning: number    // milliseconds
    critical: number   // milliseconds
  }
  errorRate: {
    warning: number    // percentage (0-1)
    critical: number   // percentage (0-1)
  }
  costPerRequest: {
    warning: number    // dollars
    critical: number   // dollars
  }
  qualityScore: {
    warning: number    // score (0-1)
    critical: number   // score (0-1)
  }
  availability: {
    warning: number    // percentage (0-1)
    critical: number   // percentage (0-1)
  }
}

interface MonitoringConfig {
  enabled: boolean
  samplingRate: number        // 0-1, what percentage of requests to monitor
  alertingEnabled: boolean
  realTimeUpdates: boolean
  retentionDays: number
  thresholds: MonitoringThresholds
  aggregationWindowMs: number // how often to calculate metrics
}

interface AggregatedMetrics {
  modelId: string
  useCase: string
  timeWindow: number
  requestCount: number
  avgResponseTime: number
  errorRate: number
  avgCost: number
  avgQualityScore: number
  avgSatisfaction: number
  availability: number
  totalTokens: number
  uniqueUsers: number
}

interface MonitoringState {
  isMonitoring: boolean
  metrics: PerformanceMetric[]
  aggregated: AggregatedMetrics[]
  alerts: PerformanceAlert[]
  lastUpdate: number
  config: MonitoringConfig
}

class RealTimePerformanceMonitor {
  private state: MonitoringState
  private subscribers: Set<(state: MonitoringState) => void> = new Set()
  private aggregationTimer: NodeJS.Timeout | null = null
  private alertCheckTimer: NodeJS.Timeout | null = null

  constructor() {
    this.state = {
      isMonitoring: false,
      metrics: [],
      aggregated: [],
      alerts: [],
      lastUpdate: Date.now(),
      config: {
        enabled: true,
        samplingRate: 0.1, // Monitor 10% of requests by default
        alertingEnabled: true,
        realTimeUpdates: true,
        retentionDays: 7,
        thresholds: {
          responseTime: { warning: 2000, critical: 5000 },
          errorRate: { warning: 0.05, critical: 0.1 },
          costPerRequest: { warning: 0.01, critical: 0.05 },
          qualityScore: { warning: 0.7, critical: 0.5 },
          availability: { warning: 0.95, critical: 0.9 }
        },
        aggregationWindowMs: 30000 // 30 seconds
      }
    }
  }

  // Start monitoring
  start(): void {
    if (this.state.isMonitoring) return

    this.state.isMonitoring = true
    this.startAggregationTimer()
    this.startAlertChecking()
    this.notifySubscribers()
  }

  // Stop monitoring
  stop(): void {
    if (!this.state.isMonitoring) return

    this.state.isMonitoring = false
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer)
      this.aggregationTimer = null
    }
    if (this.alertCheckTimer) {
      clearInterval(this.alertCheckTimer)
      this.alertCheckTimer = null
    }
    this.notifySubscribers()
  }

  // Record a performance metric
  recordMetric(metric: PerformanceMetric): void {
    if (!this.state.config.enabled) return

    // Apply sampling rate
    if (Math.random() > this.state.config.samplingRate) return

    // Add to metrics buffer
    this.state.metrics.push(metric)
    
    // Clean up old metrics based on retention policy
    const cutoffTime = Date.now() - (this.state.config.retentionDays * 24 * 60 * 60 * 1000)
    this.state.metrics = this.state.metrics.filter(m => m.timestamp > cutoffTime)

    this.state.lastUpdate = Date.now()
    
    if (this.state.config.realTimeUpdates) {
      this.notifySubscribers()
    }
  }

  // Get current monitoring state
  getState(): MonitoringState {
    return { ...this.state }
  }

  // Subscribe to state changes
  subscribe(callback: (state: MonitoringState) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  // Update configuration
  updateConfig(updates: Partial<MonitoringConfig>): void {
    this.state.config = { ...this.state.config, ...updates }
    this.notifySubscribers()
  }

  // Get aggregated metrics for specific model/use case
  getAggregatedMetrics(modelId?: string, useCase?: string, timeWindowMs?: number): AggregatedMetrics[] {
    const windowMs = timeWindowMs || this.state.config.aggregationWindowMs
    const cutoffTime = Date.now() - windowMs

    let filteredMetrics = this.state.metrics.filter(m => m.timestamp > cutoffTime)
    
    if (modelId) {
      filteredMetrics = filteredMetrics.filter(m => m.modelId === modelId)
    }
    
    if (useCase) {
      filteredMetrics = filteredMetrics.filter(m => m.useCase === useCase)
    }

    return this.aggregateMetrics(filteredMetrics, windowMs)
  }

  // Acknowledge an alert
  acknowledgeAlert(alertId: string): void {
    const alert = this.state.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      this.notifySubscribers()
    }
  }

  // Clear acknowledged alerts
  clearAcknowledgedAlerts(): void {
    this.state.alerts = this.state.alerts.filter(a => !a.acknowledged)
    this.notifySubscribers()
  }

  // Get performance summary
  getPerformanceSummary(timeWindowMs: number = 3600000): {
    totalRequests: number
    avgResponseTime: number
    errorRate: number
    totalCost: number
    topModels: Array<{ modelId: string; requests: number }>
    activeAlerts: number
  } {
    const cutoffTime = Date.now() - timeWindowMs
    const recentMetrics = this.state.metrics.filter(m => m.timestamp > cutoffTime)

    const totalRequests = recentMetrics.length
    const successfulMetrics = recentMetrics.filter(m => m.success)
    const avgResponseTime = successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length || 0
    const errorRate = (recentMetrics.length - successfulMetrics.length) / recentMetrics.length || 0
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.cost, 0)

    // Count requests per model
    const modelCounts = new Map<string, number>()
    recentMetrics.forEach(m => {
      modelCounts.set(m.modelId, (modelCounts.get(m.modelId) || 0) + 1)
    })

    const topModels = Array.from(modelCounts.entries())
      .map(([modelId, requests]) => ({ modelId, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)

    const activeAlerts = this.state.alerts.filter(a => !a.acknowledged).length

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      totalCost,
      topModels,
      activeAlerts
    }
  }

  // Export monitoring data
  exportData(timeWindowMs?: number): {
    config: MonitoringConfig
    metrics: PerformanceMetric[]
    aggregated: AggregatedMetrics[]
    alerts: PerformanceAlert[]
    summary: ReturnType<typeof this.getPerformanceSummary>
    exportedAt: string
  } {
    const windowMs = timeWindowMs || (24 * 60 * 60 * 1000) // Default to 24 hours
    const cutoffTime = Date.now() - windowMs
    const filteredMetrics = this.state.metrics.filter(m => m.timestamp > cutoffTime)

    return {
      config: this.state.config,
      metrics: filteredMetrics,
      aggregated: this.getAggregatedMetrics(undefined, undefined, windowMs),
      alerts: this.state.alerts,
      summary: this.getPerformanceSummary(windowMs),
      exportedAt: new Date().toISOString()
    }
  }

  // Private methods

  private startAggregationTimer(): void {
    this.aggregationTimer = setInterval(() => {
      this.updateAggregatedMetrics()
    }, this.state.config.aggregationWindowMs)
  }

  private startAlertChecking(): void {
    this.alertCheckTimer = setInterval(() => {
      this.checkForAlerts()
    }, 10000) // Check every 10 seconds
  }

  private updateAggregatedMetrics(): void {
    const windowMs = this.state.config.aggregationWindowMs
    const cutoffTime = Date.now() - windowMs
    const recentMetrics = this.state.metrics.filter(m => m.timestamp > cutoffTime)

    this.state.aggregated = this.aggregateMetrics(recentMetrics, windowMs)
    this.notifySubscribers()
  }

  private aggregateMetrics(metrics: PerformanceMetric[], timeWindow: number): AggregatedMetrics[] {
    const groups = new Map<string, PerformanceMetric[]>()

    // Group by model and use case
    metrics.forEach(metric => {
      const key = `${metric.modelId}:${metric.useCase}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(metric)
    })

    // Calculate aggregated metrics for each group
    return Array.from(groups.entries()).map(([key, groupMetrics]) => {
      const [modelId, useCase] = key.split(':')
      const successfulMetrics = groupMetrics.filter(m => m.success)
      const uniqueUsers = new Set(groupMetrics.map(m => m.userId)).size

      return {
        modelId,
        useCase,
        timeWindow,
        requestCount: groupMetrics.length,
        avgResponseTime: successfulMetrics.reduce((sum, m) => sum + m.responseTime, 0) / successfulMetrics.length || 0,
        errorRate: (groupMetrics.length - successfulMetrics.length) / groupMetrics.length || 0,
        avgCost: groupMetrics.reduce((sum, m) => sum + m.cost, 0) / groupMetrics.length || 0,
        avgQualityScore: groupMetrics.filter(m => m.qualityScore !== undefined)
          .reduce((sum, m) => sum + (m.qualityScore || 0), 0) / groupMetrics.filter(m => m.qualityScore !== undefined).length || 0,
        avgSatisfaction: groupMetrics.filter(m => m.userSatisfaction !== undefined)
          .reduce((sum, m) => sum + (m.userSatisfaction || 0), 0) / groupMetrics.filter(m => m.userSatisfaction !== undefined).length || 0,
        availability: successfulMetrics.length / groupMetrics.length || 0,
        totalTokens: groupMetrics.reduce((sum, m) => sum + m.tokenUsage.total, 0),
        uniqueUsers
      }
    })
  }

  private checkForAlerts(): void {
    const thresholds = this.state.config.thresholds
    const recentMetrics = this.state.aggregated

    recentMetrics.forEach(metrics => {
      // Check response time
      if (metrics.avgResponseTime > thresholds.responseTime.critical) {
        this.createAlert('latency', 'critical', metrics.modelId, metrics.useCase,
          `Response time ${metrics.avgResponseTime.toFixed(0)}ms exceeds critical threshold`,
          thresholds.responseTime.critical, metrics.avgResponseTime)
      } else if (metrics.avgResponseTime > thresholds.responseTime.warning) {
        this.createAlert('latency', 'medium', metrics.modelId, metrics.useCase,
          `Response time ${metrics.avgResponseTime.toFixed(0)}ms exceeds warning threshold`,
          thresholds.responseTime.warning, metrics.avgResponseTime)
      }

      // Check error rate
      if (metrics.errorRate > thresholds.errorRate.critical) {
        this.createAlert('error_rate', 'critical', metrics.modelId, metrics.useCase,
          `Error rate ${(metrics.errorRate * 100).toFixed(1)}% exceeds critical threshold`,
          thresholds.errorRate.critical, metrics.errorRate)
      } else if (metrics.errorRate > thresholds.errorRate.warning) {
        this.createAlert('error_rate', 'medium', metrics.modelId, metrics.useCase,
          `Error rate ${(metrics.errorRate * 100).toFixed(1)}% exceeds warning threshold`,
          thresholds.errorRate.warning, metrics.errorRate)
      }

      // Check cost
      if (metrics.avgCost > thresholds.costPerRequest.critical) {
        this.createAlert('cost', 'critical', metrics.modelId, metrics.useCase,
          `Average cost $${metrics.avgCost.toFixed(4)} exceeds critical threshold`,
          thresholds.costPerRequest.critical, metrics.avgCost)
      } else if (metrics.avgCost > thresholds.costPerRequest.warning) {
        this.createAlert('cost', 'medium', metrics.modelId, metrics.useCase,
          `Average cost $${metrics.avgCost.toFixed(4)} exceeds warning threshold`,
          thresholds.costPerRequest.warning, metrics.avgCost)
      }

      // Check quality score
      if (metrics.avgQualityScore < thresholds.qualityScore.critical && metrics.avgQualityScore > 0) {
        this.createAlert('quality', 'critical', metrics.modelId, metrics.useCase,
          `Quality score ${(metrics.avgQualityScore * 100).toFixed(1)}% below critical threshold`,
          thresholds.qualityScore.critical, metrics.avgQualityScore)
      } else if (metrics.avgQualityScore < thresholds.qualityScore.warning && metrics.avgQualityScore > 0) {
        this.createAlert('quality', 'medium', metrics.modelId, metrics.useCase,
          `Quality score ${(metrics.avgQualityScore * 100).toFixed(1)}% below warning threshold`,
          thresholds.qualityScore.warning, metrics.avgQualityScore)
      }

      // Check availability
      if (metrics.availability < thresholds.availability.critical) {
        this.createAlert('availability', 'critical', metrics.modelId, metrics.useCase,
          `Availability ${(metrics.availability * 100).toFixed(1)}% below critical threshold`,
          thresholds.availability.critical, metrics.availability)
      } else if (metrics.availability < thresholds.availability.warning) {
        this.createAlert('availability', 'medium', metrics.modelId, metrics.useCase,
          `Availability ${(metrics.availability * 100).toFixed(1)}% below warning threshold`,
          thresholds.availability.warning, metrics.availability)
      }
    })
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    modelId: string,
    useCase: string,
    message: string,
    threshold: number,
    currentValue: number
  ): void {
    // Check if similar alert already exists and is unacknowledged
    const existingAlert = this.state.alerts.find(a => 
      a.type === type && 
      a.modelId === modelId && 
      a.useCase === useCase && 
      !a.acknowledged &&
      Date.now() - a.timestamp < 300000 // Within last 5 minutes
    )

    if (existingAlert) {
      // Update existing alert
      existingAlert.currentValue = currentValue
      existingAlert.timestamp = Date.now()
    } else {
      // Create new alert
      const alert: PerformanceAlert = {
        id: `${type}-${modelId}-${useCase}-${Date.now()}`,
        type,
        severity,
        modelId,
        useCase,
        message,
        threshold,
        currentValue,
        timestamp: Date.now(),
        acknowledged: false
      }
      this.state.alerts.push(alert)
    }

    this.notifySubscribers()
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state)
      } catch (error) {
        console.error('Error in monitoring subscriber:', error)
      }
    })
  }
}

// Export singleton instance
export const realTimePerformanceMonitor = new RealTimePerformanceMonitor()

// Export types
export type {
  PerformanceMetric,
  PerformanceAlert,
  MonitoringThresholds,
  MonitoringConfig,
  AggregatedMetrics,
  MonitoringState
}
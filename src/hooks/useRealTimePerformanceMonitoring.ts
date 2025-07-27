'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  realTimePerformanceMonitor,
  type PerformanceMetric,
  type PerformanceAlert,
  type MonitoringConfig,
  type MonitoringState,
  type AggregatedMetrics
} from '@/lib/real-time-performance-monitor'

// Hook for general monitoring state
export function useRealTimeMonitoring() {
  const [state, setState] = useState<MonitoringState>(realTimePerformanceMonitor.getState())

  useEffect(() => {
    const unsubscribe = realTimePerformanceMonitor.subscribe(setState)
    return unsubscribe
  }, [])

  const startMonitoring = useCallback(() => {
    realTimePerformanceMonitor.start()
  }, [])

  const stopMonitoring = useCallback(() => {
    realTimePerformanceMonitor.stop()
  }, [])

  const updateConfig = useCallback((updates: Partial<MonitoringConfig>) => {
    realTimePerformanceMonitor.updateConfig(updates)
  }, [])

  const recordMetric = useCallback((metric: PerformanceMetric) => {
    realTimePerformanceMonitor.recordMetric(metric)
  }, [])

  const acknowledgeAlert = useCallback((alertId: string) => {
    realTimePerformanceMonitor.acknowledgeAlert(alertId)
  }, [])

  const clearAcknowledgedAlerts = useCallback(() => {
    realTimePerformanceMonitor.clearAcknowledgedAlerts()
  }, [])

  const exportData = useCallback((timeWindowMs?: number) => {
    return realTimePerformanceMonitor.exportData(timeWindowMs)
  }, [])

  const getPerformanceSummary = useCallback((timeWindowMs?: number) => {
    return realTimePerformanceMonitor.getPerformanceSummary(timeWindowMs)
  }, [])

  return {
    // State
    isMonitoring: state.isMonitoring,
    metrics: state.metrics,
    aggregated: state.aggregated,
    alerts: state.alerts,
    config: state.config,
    lastUpdate: state.lastUpdate,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    updateConfig,
    recordMetric,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
    exportData,
    getPerformanceSummary
  }
}

// Hook for performance alerts management
export function usePerformanceAlerts() {
  const { alerts, acknowledgeAlert, clearAcknowledgedAlerts } = useRealTimeMonitoring()

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.severity === 'critical')
  const highAlerts = unacknowledgedAlerts.filter(alert => alert.severity === 'high')
  const mediumAlerts = unacknowledgedAlerts.filter(alert => alert.severity === 'medium')
  const lowAlerts = unacknowledgedAlerts.filter(alert => alert.severity === 'low')

  const acknowledgeAllCritical = useCallback(() => {
    criticalAlerts.forEach(alert => acknowledgeAlert(alert.id))
  }, [criticalAlerts, acknowledgeAlert])

  const acknowledgeAllOfType = useCallback((type: PerformanceAlert['type']) => {
    unacknowledgedAlerts
      .filter(alert => alert.type === type)
      .forEach(alert => acknowledgeAlert(alert.id))
  }, [unacknowledgedAlerts, acknowledgeAlert])

  return {
    // Alert categories
    allAlerts: alerts,
    unacknowledgedAlerts,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
    
    // Alert counts
    totalAlerts: alerts.length,
    unacknowledgedCount: unacknowledgedAlerts.length,
    criticalCount: criticalAlerts.length,
    
    // Actions
    acknowledgeAlert,
    acknowledgeAllCritical,
    acknowledgeAllOfType,
    clearAcknowledgedAlerts
  }
}

// Hook for model-specific monitoring
export function useModelMonitoring(modelId: string, useCase?: string) {
  const { aggregated, recordMetric } = useRealTimeMonitoring()

  const modelMetrics = aggregated.filter(metric => {
    const matchesModel = metric.modelId === modelId
    const matchesUseCase = useCase ? metric.useCase === useCase : true
    return matchesModel && matchesUseCase
  })

  const recordModelMetric = useCallback((
    userId: string,
    responseTime: number,
    tokenUsage: { prompt: number; completion: number; total: number },
    cost: number,
    options?: {
      qualityScore?: number
      userSatisfaction?: number
      errorType?: string
      success?: boolean
      metadata?: Record<string, any>
    }
  ) => {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      modelId,
      useCase: useCase || 'general',
      userId,
      responseTime,
      tokenUsage,
      cost,
      success: options?.success ?? true,
      ...options
    }
    recordMetric(metric)
  }, [modelId, useCase, recordMetric])

  const getModelSummary = useCallback(() => {
    if (modelMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        avgCost: 0,
        avgQuality: 0,
        availability: 0
      }
    }

    const latest = modelMetrics[0] // Most recent aggregated data
    return {
      totalRequests: latest.requestCount,
      avgResponseTime: latest.avgResponseTime,
      errorRate: latest.errorRate,
      avgCost: latest.avgCost,
      avgQuality: latest.avgQualityScore,
      availability: latest.availability
    }
  }, [modelMetrics])

  return {
    // Model-specific data
    modelMetrics,
    summary: getModelSummary(),
    
    // Actions
    recordModelMetric
  }
}

// Hook for automatic AI request tracking
export function useAIRequestTracking(modelId: string, useCase: string, userId: string) {
  const { recordModelMetric } = useModelMonitoring(modelId, useCase)

  const trackRequest = useCallback(async <T>(
    requestPromise: Promise<T>,
    tokenEstimate?: { prompt: number; completion: number },
    costEstimate?: number
  ): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await requestPromise
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Record successful request
      recordModelMetric(
        userId,
        responseTime,
        { 
          prompt: tokenEstimate?.prompt || 0, 
          completion: tokenEstimate?.completion || 0, 
          total: ((tokenEstimate as any)?.total) || (tokenEstimate?.prompt || 0) + (tokenEstimate?.completion || 0) 
        },
        costEstimate || 0,
        {
          success: true,
          metadata: {
            completedAt: endTime,
            duration: responseTime
          }
        }
      )

      return result
    } catch (error) {
      const endTime = Date.now()
      const responseTime = endTime - startTime

      // Record failed request
      recordModelMetric(
        userId,
        responseTime,
        { 
          prompt: tokenEstimate?.prompt || 0, 
          completion: tokenEstimate?.completion || 0, 
          total: ((tokenEstimate as any)?.total) || (tokenEstimate?.prompt || 0) + (tokenEstimate?.completion || 0) 
        },
        0, // No cost for failed requests
        {
          success: false,
          errorType: error instanceof Error ? error.name : 'unknown',
          metadata: {
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            failedAt: endTime,
            duration: responseTime
          }
        }
      )

      throw error
    }
  }, [recordModelMetric, userId])

  const trackFeedback = useCallback((
    qualityScore: number,
    userSatisfaction: number,
    metadata?: Record<string, any>
  ) => {
    recordModelMetric(
      userId,
      0, // No response time for feedback
      { prompt: 0, completion: 0, total: 0 },
      0, // No cost for feedback
      {
        qualityScore,
        userSatisfaction,
        success: true,
        metadata: {
          type: 'feedback',
          ...metadata
        }
      }
    )
  }, [recordModelMetric, userId])

  return {
    trackRequest,
    trackFeedback
  }
}

// Hook for monitoring dashboard data
export function useMonitoringDashboard(refreshInterval: number = 30000) {
  const { aggregated, alerts, isMonitoring, getPerformanceSummary } = useRealTimeMonitoring()
  const [summary, setSummary] = useState(() => getPerformanceSummary())

  // Refresh summary periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getPerformanceSummary())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [getPerformanceSummary, refreshInterval])

  // Update summary when aggregated data changes
  useEffect(() => {
    setSummary(getPerformanceSummary())
  }, [aggregated, getPerformanceSummary])

  const activeAlerts = alerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')

  // Model performance rankings
  const modelRankings = summary.topModels.map(model => {
    const modelAggregated = aggregated.filter(m => m.modelId === model.modelId)
    const avgResponseTime = modelAggregated.reduce((sum, m) => sum + m.avgResponseTime, 0) / modelAggregated.length || 0
    const avgErrorRate = modelAggregated.reduce((sum, m) => sum + m.errorRate, 0) / modelAggregated.length || 0
    const avgAvailability = modelAggregated.reduce((sum, m) => sum + m.availability, 0) / modelAggregated.length || 0

    return {
      modelId: model.modelId,
      requests: model.requests,
      avgResponseTime,
      avgErrorRate,
      avgAvailability,
      score: avgAvailability * (1 - avgErrorRate) * Math.max(0, 1 - avgResponseTime / 5000) // Composite score
    }
  }).sort((a, b) => b.score - a.score)

  return {
    // Dashboard data
    isMonitoring,
    summary,
    modelRankings,
    aggregated,
    
    // Alert information
    activeAlerts,
    criticalAlerts,
    alertCount: activeAlerts.length,
    criticalAlertCount: criticalAlerts.length,
    
    // Health indicators
    overallHealth: {
      responseTime: summary.avgResponseTime < 2000 ? 'good' : summary.avgResponseTime < 5000 ? 'warning' : 'critical',
      errorRate: summary.errorRate < 0.05 ? 'good' : summary.errorRate < 0.1 ? 'warning' : 'critical',
      cost: summary.totalCost < 1 ? 'good' : summary.totalCost < 5 ? 'warning' : 'critical'
    }
  }
}
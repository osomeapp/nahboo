// React hooks for real-time content monitoring
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  MonitoringAlert,
  MonitoringMetrics,
  MonitoringRule,
  DetectedIssue,
  ContentStreamMonitor
} from '@/lib/real-time-content-monitor'

export interface MonitoringState {
  isActive: boolean
  alerts: MonitoringAlert[]
  metrics: MonitoringMetrics | null
  streamStatus: ContentStreamMonitor | null
  activeRules: MonitoringRule[]
  recentIssues: DetectedIssue[]
  isInitializing: boolean
  isProcessing: boolean
  error: string | null
}

export interface MonitoringFilters {
  severity: MonitoringAlert['severity'][]
  alertTypes: MonitoringAlert['alertType'][]
  status: MonitoringAlert['status'][]
  timeRange: 'last_hour' | 'last_day' | 'last_week' | 'last_month'
  showResolved: boolean
}

export interface MonitoringConfiguration {
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

// Main real-time monitoring hook
export function useRealTimeMonitoring(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<MonitoringState>({
    isActive: false,
    alerts: [],
    metrics: null,
    streamStatus: null,
    activeRules: [],
    recentIssues: [],
    isInitializing: false,
    isProcessing: false,
    error: null
  })

  const [filters, setFilters] = useState<MonitoringFilters>({
    severity: ['medium', 'high', 'critical'],
    alertTypes: ['inappropriate_content', 'safety_violation'],
    status: ['active', 'investigating'],
    timeRange: 'last_day',
    showResolved: false
  })

  const [config, setConfig] = useState<MonitoringConfiguration>({
    scanInterval: 30000,
    batchSize: 10,
    alertThreshold: 5,
    autoModeration: userProfile.age_group === 'child',
    notificationSettings: {
      emailAlerts: true,
      pushNotifications: false,
      parentNotifications: userProfile.age_group === 'child'
    }
  })

  const alertPollingRef = useRef<NodeJS.Timeout | null>(null)
  const contentQueueRef = useRef<ContentItem[]>([])

  // Initialize monitoring
  const initializeMonitoring = useCallback(async () => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }))

    try {
      const response = await fetch('/api/monitoring/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          configuration: config
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize monitoring: ${response.status}`)
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        isActive: true,
        streamStatus: data.streamStatus,
        activeRules: data.activeRules,
        isInitializing: false
      }))

      // Start polling for alerts
      startAlertPolling()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isInitializing: false }))
    }
  }, [userId, userProfile, config])

  // Start monitoring
  const startMonitoring = useCallback(async () => {
    if (state.isActive) return

    try {
      const response = await fetch('/api/monitoring/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          scanInterval: config.scanInterval
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start monitoring: ${response.status}`)
      }

      setState(prev => ({ ...prev, isActive: true }))
      startAlertPolling()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage }))
    }
  }, [userId, config.scanInterval, state.isActive])

  // Stop monitoring
  const stopMonitoring = useCallback(async () => {
    try {
      const response = await fetch('/api/monitoring/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error(`Failed to stop monitoring: ${response.status}`)
      }

      setState(prev => ({ ...prev, isActive: false }))
      stopAlertPolling()

    } catch (error) {
      console.error('Failed to stop monitoring:', error)
    }
  }, [userId])

  // Queue content for monitoring
  const queueContent = useCallback(async (content: ContentItem | ContentItem[]) => {
    const items = Array.isArray(content) ? content : [content]
    
    // Add to local queue
    contentQueueRef.current.push(...items)
    
    // Send to monitoring service
    try {
      const response = await fetch('/api/monitoring/queue-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          content: items
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to queue content: ${response.status}`)
      }

    } catch (error) {
      console.error('Failed to queue content for monitoring:', error)
    }
  }, [userId])

  // Get monitoring alerts
  const getAlerts = useCallback(async (forceRefresh = false) => {
    try {
      const response = await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          filters,
          forceRefresh
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get alerts: ${response.status}`)
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        alerts: data.alerts,
        recentIssues: data.recentIssues || []
      }))

      return data.alerts

    } catch (error) {
      console.error('Failed to get monitoring alerts:', error)
      return []
    }
  }, [userId, filters])

  // Get monitoring metrics
  const getMetrics = useCallback(async (timeframe: MonitoringMetrics['timeframe'] = 'daily') => {
    try {
      const response = await fetch('/api/monitoring/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          timeframe
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.status}`)
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        metrics: data.metrics
      }))

      return data.metrics

    } catch (error) {
      console.error('Failed to get monitoring metrics:', error)
      return null
    }
  }, [userId])

  // Resolve alert
  const resolveAlert = useCallback(async (
    alertId: string,
    resolutionType: 'approved' | 'content_removed' | 'content_modified' | 'user_warned' | 'user_suspended' | 'false_positive',
    notes: string = ''
  ) => {
    try {
      const response = await fetch('/api/monitoring/resolve-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          alertId,
          resolutionType,
          notes
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to resolve alert: ${response.status}`)
      }

      // Update local alert state
      setState(prev => ({
        ...prev,
        alerts: prev.alerts.map(alert => 
          alert.alertId === alertId 
            ? { ...alert, status: 'resolved', resolution: { resolvedAt: new Date(), resolvedBy: userId, resolutionType, notes, resolutionId: `res_${Date.now()}`, followUpRequired: false } }
            : alert
        )
      }))

      return true

    } catch (error) {
      console.error('Failed to resolve alert:', error)
      return false
    }
  }, [userId])

  // Update monitoring configuration
  const updateConfiguration = useCallback(async (newConfig: Partial<MonitoringConfiguration>) => {
    const updatedConfig = { ...config, ...newConfig }
    
    try {
      const response = await fetch('/api/monitoring/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          configuration: updatedConfig
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update configuration: ${response.status}`)
      }

      setConfig(updatedConfig)

      // Restart monitoring with new config if active
      if (state.isActive) {
        await stopMonitoring()
        await startMonitoring()
      }

    } catch (error) {
      console.error('Failed to update monitoring configuration:', error)
    }
  }, [config, userId, state.isActive, stopMonitoring, startMonitoring])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MonitoringFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Start alert polling
  const startAlertPolling = useCallback(() => {
    if (alertPollingRef.current) return

    alertPollingRef.current = setInterval(() => {
      getAlerts().catch(console.error)
      getMetrics().catch(console.error)
    }, 15000) // Poll every 15 seconds
  }, [getAlerts, getMetrics])

  // Stop alert polling
  const stopAlertPolling = useCallback(() => {
    if (alertPollingRef.current) {
      clearInterval(alertPollingRef.current)
      alertPollingRef.current = null
    }
  }, [])

  // Auto-initialize on mount for child users
  useEffect(() => {
    if (userProfile.age_group === 'child' && !state.isActive && !state.isInitializing) {
      initializeMonitoring().catch(console.error)
    }
  }, [userProfile.age_group, state.isActive, state.isInitializing, initializeMonitoring])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlertPolling()
    }
  }, [stopAlertPolling])

  // Filter alerts based on current filters
  const filteredAlerts = state.alerts.filter(alert => {
    if (!filters.severity.includes(alert.severity)) return false
    if (!filters.alertTypes.includes(alert.alertType)) return false
    if (!filters.status.includes(alert.status)) return false
    if (!filters.showResolved && alert.status === 'resolved') return false
    
    // Time range filter
    const timeRangeMs = getTimeRangeMs(filters.timeRange)
    const cutoffTime = new Date(Date.now() - timeRangeMs)
    if (alert.timestamp < cutoffTime) return false
    
    return true
  })

  // Calculate monitoring statistics
  const statistics = {
    totalAlerts: state.alerts.length,
    activeAlerts: state.alerts.filter(a => a.status === 'active').length,
    criticalAlerts: state.alerts.filter(a => a.severity === 'critical').length,
    resolvedAlerts: state.alerts.filter(a => a.status === 'resolved').length,
    contentScanned: state.streamStatus?.processedCount || 0,
    alertRate: state.streamStatus?.processedCount ? state.alerts.length / state.streamStatus.processedCount : 0,
    lastScanTime: state.streamStatus?.lastScanTime,
    averageResolutionTime: calculateAverageResolutionTime(state.alerts)
  }

  return {
    // State
    ...state,
    filteredAlerts,
    filters,
    config,
    statistics,
    
    // Actions
    initializeMonitoring,
    startMonitoring,
    stopMonitoring,
    queueContent,
    getAlerts,
    getMetrics,
    resolveAlert,
    updateConfiguration,
    updateFilters,
    
    // Computed values
    hasActiveAlerts: filteredAlerts.filter(a => a.status === 'active').length > 0,
    hasCriticalAlerts: filteredAlerts.filter(a => a.severity === 'critical').length > 0,
    isMonitoringRecommended: userProfile.age_group === 'child' || userProfile.age_group === 'teen',
    canModerate: userProfile.age_group === 'adult',
    
    // Helper functions
    getAlertById: useCallback((alertId: string) => {
      return state.alerts.find(alert => alert.alertId === alertId) || null
    }, [state.alerts]),
    
    getAlertsByContent: useCallback((contentId: string) => {
      return state.alerts.filter(alert => alert.contentId === contentId)
    }, [state.alerts]),
    
    getAlertsBySeverity: useCallback((severity: MonitoringAlert['severity']) => {
      return state.alerts.filter(alert => alert.severity === severity)
    }, [state.alerts]),
    
    getCriticalAlerts: useCallback(() => {
      return state.alerts.filter(alert => alert.severity === 'critical' && alert.status === 'active')
    }, [state.alerts])
  }
}

// Hook for monitoring dashboard
export function useMonitoringDashboard(userId: string) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/monitoring/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        throw new Error(`Failed to load dashboard: ${response.status}`)
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to load monitoring dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  return {
    dashboardData,
    isLoading,
    loadDashboard
  }
}

// Helper functions
function getTimeRangeMs(timeRange: MonitoringFilters['timeRange']): number {
  switch (timeRange) {
    case 'last_hour': return 60 * 60 * 1000
    case 'last_day': return 24 * 60 * 60 * 1000
    case 'last_week': return 7 * 24 * 60 * 60 * 1000
    case 'last_month': return 30 * 24 * 60 * 60 * 1000
    default: return 24 * 60 * 60 * 1000
  }
}

function calculateAverageResolutionTime(alerts: MonitoringAlert[]): number {
  const resolvedAlerts = alerts.filter(a => a.resolution)
  if (resolvedAlerts.length === 0) return 0

  const totalTime = resolvedAlerts.reduce((sum, alert) => {
    const resolutionTime = alert.resolution!.resolvedAt.getTime() - alert.timestamp.getTime()
    return sum + (resolutionTime / (1000 * 60)) // Convert to minutes
  }, 0)

  return totalTime / resolvedAlerts.length
}
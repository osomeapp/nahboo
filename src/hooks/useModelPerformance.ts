'use client'

import { useState, useCallback, useEffect } from 'react'
import type { 
  ModelPerformanceMetrics,
  ModelOptimizationRecommendation,
  ModelComparisonResult
} from '@/lib/model-performance-analytics'

interface PerformanceTrackingData {
  modelId: string
  useCase: string
  userId: string
  requestId: string
  startTime: number
  endTime: number
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
  metadata?: Record<string, any>
}

interface DashboardData {
  overallHealth: number
  modelPerformance: Record<string, any>
  useCasePerformance: Record<string, any>
  recommendations: ModelOptimizationRecommendation[]
  alerts: string[]
  isLoading: boolean
  lastUpdated: Date
}

interface PerformanceState {
  dashboard: DashboardData
  metrics: Record<string, ModelPerformanceMetrics>
  comparisons: ModelComparisonResult[]
  isTracking: boolean
  error: string | null
}

export function useModelPerformance() {
  const [state, setState] = useState<PerformanceState>({
    dashboard: {
      overallHealth: 0,
      modelPerformance: {},
      useCasePerformance: {},
      recommendations: [],
      alerts: [],
      isLoading: true,
      lastUpdated: new Date()
    },
    metrics: {},
    comparisons: [],
    isTracking: false,
    error: null
  })

  // Load dashboard data
  const loadDashboard = useCallback(async (timeWindow: number = 24 * 60 * 60 * 1000) => {
    try {
      setState(prev => ({
        ...prev,
        dashboard: { ...prev.dashboard, isLoading: true },
        error: null
      }))

      const response = await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_dashboard',
          timeWindow
        })
      })

      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        dashboard: {
          ...data.dashboard,
          isLoading: false,
          lastUpdated: new Date()
        }
      }))

    } catch (error) {
      console.error('Failed to load dashboard:', error)
      setState(prev => ({
        ...prev,
        dashboard: { 
          ...prev.dashboard, 
          isLoading: false,
          alerts: [...prev.dashboard.alerts, 'Failed to load dashboard data']
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [])

  // Track AI request performance
  const trackRequest = useCallback(async (trackingData: PerformanceTrackingData) => {
    try {
      setState(prev => ({ ...prev, isTracking: true, error: null }))

      const response = await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_request',
          trackingData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to track request')
      }

      setState(prev => ({ ...prev, isTracking: false }))

    } catch (error) {
      console.error('Failed to track request:', error)
      setState(prev => ({
        ...prev,
        isTracking: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [])

  // Get metrics for specific model
  const getModelMetrics = useCallback(async (modelId: string) => {
    try {
      const response = await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_model_metrics',
          modelId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get model metrics')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [modelId]: data.metrics
        }
      }))

      return data.metrics

    } catch (error) {
      console.error('Failed to get model metrics:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      return null
    }
  }, [])

  // Compare two models
  const compareModels = useCallback(async (modelA: string, modelB: string, useCase: string) => {
    try {
      const response = await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare_models',
          modelA,
          modelB,
          useCase
        })
      })

      if (!response.ok) {
        throw new Error('Failed to compare models')
      }

      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        comparisons: [...prev.comparisons.filter(c => 
          !(c.modelA === modelA && c.modelB === modelB && c.useCase === useCase)
        ), data.comparisonResult]
      }))

      return data.comparisonResult

    } catch (error) {
      console.error('Failed to compare models:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      return null
    }
  }, [])

  // Optimize model routing
  const optimizeRouting = useCallback(async () => {
    try {
      const response = await fetch('/api/performance/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_routing'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to optimize routing')
      }

      const data = await response.json()
      
      // Refresh dashboard after optimization
      loadDashboard()
      
      return data.optimizationResult

    } catch (error) {
      console.error('Failed to optimize routing:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      return null
    }
  }, [loadDashboard])

  // Export performance data
  const exportData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      dashboard: state.dashboard,
      metrics: state.metrics,
      comparisons: state.comparisons
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `model_performance_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state.dashboard, state.metrics, state.comparisons])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    dashboard: state.dashboard,
    metrics: state.metrics,
    comparisons: state.comparisons,
    isTracking: state.isTracking,
    error: state.error,
    
    // Actions
    loadDashboard,
    trackRequest,
    getModelMetrics,
    compareModels,
    optimizeRouting,
    exportData,
    clearError
  }
}

// Hook for automatic request tracking
export function usePerformanceTracking(modelId: string, useCase: string, userId: string) {
  const { trackRequest } = useModelPerformance()

  const trackAIRequest = useCallback(async (
    requestId: string,
    startTime: number,
    endTime: number,
    tokenUsage: { prompt: number; completion: number; total: number },
    cost: number,
    options?: {
      qualityScore?: number
      userSatisfaction?: number
      errorType?: string
      metadata?: Record<string, any>
    }
  ) => {
    await trackRequest({
      modelId,
      useCase,
      userId,
      requestId,
      startTime,
      endTime,
      responseTime: endTime - startTime,
      tokenUsage,
      cost,
      ...options
    })
  }, [trackRequest, modelId, useCase, userId])

  return { trackAIRequest }
}

// Hook for performance monitoring with auto-refresh
export function usePerformanceMonitoring(
  refreshInterval: number = 30000, // 30 seconds
  timeWindow: number = 24 * 60 * 60 * 1000 // 24 hours
) {
  const { loadDashboard, dashboard } = useModelPerformance()

  useEffect(() => {
    // Initial load
    loadDashboard(timeWindow)

    // Set up auto-refresh
    const interval = setInterval(() => {
      loadDashboard(timeWindow)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [loadDashboard, refreshInterval, timeWindow])

  return { dashboard }
}
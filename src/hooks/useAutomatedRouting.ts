'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  automatedModelRouter,
  type ModelHealth,
  type CircuitBreaker,
  type RoutingStrategy,
  type RequestContext,
  type RoutingDecision
} from '@/lib/automated-model-routing'

interface RoutingState {
  systemStatus: {
    modelHealth: Record<string, ModelHealth>
    circuitBreakers: Record<string, CircuitBreaker>
    routingStrategies: string[]
    overallHealth: number
  } | null
  currentRouting: RoutingDecision | null
  isLoading: boolean
  error: string | null
  requestHistory: Array<{
    requestId: string
    modelUsed: string
    attempts: number
    totalTime: number
    success: boolean
    timestamp: Date
  }>
}

// Main hook for automated model routing
export function useAutomatedRouting() {
  const [state, setState] = useState<RoutingState>({
    systemStatus: null,
    currentRouting: null,
    isLoading: false,
    error: null,
    requestHistory: []
  })

  const statusUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  // Load system status
  const loadSystemStatus = useCallback(() => {
    try {
      const status = automatedModelRouter.getSystemStatus()
      setState(prev => ({ ...prev, systemStatus: status, error: null }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load system status'
      }))
    }
  }, [])

  // Make routing decision
  const makeRoutingDecision = useCallback(async (
    context: RequestContext,
    strategyName: string = 'default'
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const decision = await automatedModelRouter.makeRoutingDecision(context, strategyName)
      
      setState(prev => ({
        ...prev,
        currentRouting: decision,
        isLoading: false
      }))
      
      return decision
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to make routing decision'
      }))
      return null
    }
  }, [])

  // Execute request with automatic fallback
  const executeWithFallback = useCallback(async <T>(
    requestFn: (modelId: string) => Promise<T>,
    context: RequestContext,
    strategyName: string = 'default'
  ): Promise<{ result: T, modelUsed: string, attempts: number, totalTime: number } | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const result = await automatedModelRouter.executeWithFallback(requestFn, context, strategyName)
      
      // Record in history
      setState(prev => ({
        ...prev,
        requestHistory: [
          {
            requestId: context.requestId,
            modelUsed: result.modelUsed,
            attempts: result.attempts,
            totalTime: result.totalTime,
            success: true,
            timestamp: new Date()
          },
          ...prev.requestHistory.slice(0, 49) // Keep last 50 requests
        ],
        isLoading: false
      }))
      
      return result
    } catch (error) {
      // Record failed request
      setState(prev => ({
        ...prev,
        requestHistory: [
          {
            requestId: context.requestId,
            modelUsed: 'unknown',
            attempts: 0,
            totalTime: 0,
            success: false,
            timestamp: new Date()
          },
          ...prev.requestHistory.slice(0, 49)
        ],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Request execution failed'
      }))
      return null
    }
  }, [])

  // Add custom routing strategy
  const addRoutingStrategy = useCallback((name: string, strategy: RoutingStrategy) => {
    try {
      automatedModelRouter.addRoutingStrategy(name, strategy)
      loadSystemStatus() // Refresh to show new strategy
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add routing strategy'
      }))
    }
  }, [loadSystemStatus])

  // Get model performance metrics
  const getModelMetrics = useCallback((modelId: string) => {
    if (!state.systemStatus) return null

    const health = state.systemStatus.modelHealth[modelId]
    const breaker = state.systemStatus.circuitBreakers[modelId]
    
    if (!health || !breaker) return null

    const recentRequests = state.requestHistory
      .filter(r => r.modelUsed === modelId)
      .slice(0, 10)

    const avgResponseTime = recentRequests.length > 0
      ? recentRequests.reduce((sum, r) => sum + r.totalTime, 0) / recentRequests.length
      : health.averageResponseTime

    const recentSuccessRate = recentRequests.length > 0
      ? (recentRequests.filter(r => r.success).length / recentRequests.length) * 100
      : health.successRate

    return {
      modelId,
      health,
      circuitBreaker: breaker,
      metrics: {
        avgResponseTime,
        recentSuccessRate,
        requestCount: recentRequests.length,
        performanceScore: health.performanceScore,
        isAvailable: health.isAvailable && breaker.state !== 'open'
      }
    }
  }, [state.systemStatus, state.requestHistory])

  // Get routing recommendations
  const getRoutingRecommendations = useCallback(() => {
    if (!state.systemStatus) return []

    const recommendations = []
    const { modelHealth, circuitBreakers, overallHealth } = state.systemStatus

    // Check for degraded models
    Object.entries(modelHealth).forEach(([modelId, health]) => {
      if (health.performanceScore < 50) {
        recommendations.push({
          type: 'degraded_model',
          severity: health.performanceScore < 25 ? 'high' : 'medium',
          message: `Model ${modelId} is performing poorly (score: ${health.performanceScore.toFixed(1)})`,
          modelId,
          action: 'Consider switching to fallback model'
        })
      }

      if (health.consecutiveFailures > 3) {
        recommendations.push({
          type: 'frequent_failures',
          severity: 'high',
          message: `Model ${modelId} has ${health.consecutiveFailures} consecutive failures`,
          modelId,
          action: 'Check model availability and health'
        })
      }
    })

    // Check for open circuit breakers
    Object.entries(circuitBreakers).forEach(([modelId, breaker]) => {
      if (breaker.state === 'open') {
        recommendations.push({
          type: 'circuit_breaker_open',
          severity: 'high',
          message: `Circuit breaker for ${modelId} is open`,
          modelId,
          action: `Will retry at ${breaker.nextRetryTime?.toLocaleTimeString()}`
        })
      }
    })

    // Overall system health check
    if (overallHealth < 70) {
      recommendations.push({
        type: 'system_health',
        severity: overallHealth < 50 ? 'high' : 'medium',
        message: `Overall system health is ${overallHealth.toFixed(1)}%`,
        action: 'Consider reviewing all model configurations'
      })
    }

    // Check request success rate
    const recentRequests = state.requestHistory.slice(0, 20)
    if (recentRequests.length > 5) {
      const successRate = (recentRequests.filter(r => r.success).length / recentRequests.length) * 100
      if (successRate < 80) {
        recommendations.push({
          type: 'low_success_rate',
          severity: successRate < 60 ? 'high' : 'medium',
          message: `Recent request success rate is ${successRate.toFixed(1)}%`,
          action: 'Review routing strategies and model configurations'
        })
      }
    }

    return recommendations.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }, [state.systemStatus, state.requestHistory])

  // Get traffic distribution
  const getTrafficDistribution = useCallback(() => {
    const distribution: Record<string, { requests: number, successRate: number, avgTime: number }> = {}

    state.requestHistory.forEach(request => {
      if (!distribution[request.modelUsed]) {
        distribution[request.modelUsed] = { requests: 0, successRate: 0, avgTime: 0 }
      }
      distribution[request.modelUsed].requests++
    })

    Object.keys(distribution).forEach(modelId => {
      const modelRequests = state.requestHistory.filter(r => r.modelUsed === modelId)
      const successCount = modelRequests.filter(r => r.success).length
      const totalTime = modelRequests.reduce((sum, r) => sum + r.totalTime, 0)

      distribution[modelId].successRate = (successCount / modelRequests.length) * 100
      distribution[modelId].avgTime = totalTime / modelRequests.length
    })

    return distribution
  }, [state.requestHistory])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear request history
  const clearHistory = useCallback(() => {
    setState(prev => ({ ...prev, requestHistory: [] }))
  }, [])

  // Start periodic status updates
  useEffect(() => {
    loadSystemStatus()
    
    statusUpdateInterval.current = setInterval(() => {
      loadSystemStatus()
    }, 5000) // Update every 5 seconds

    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current)
      }
    }
  }, [loadSystemStatus])

  return {
    // State
    systemStatus: state.systemStatus,
    currentRouting: state.currentRouting,
    requestHistory: state.requestHistory,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    makeRoutingDecision,
    executeWithFallback,
    addRoutingStrategy,
    loadSystemStatus,
    clearError,
    clearHistory,
    
    // Analytics
    getModelMetrics,
    getRoutingRecommendations,
    getTrafficDistribution
  }
}

// Hook for simplified model routing in components
export function useSmartModelRouter() {
  const { executeWithFallback, makeRoutingDecision } = useAutomatedRouting()

  // Execute AI request with smart routing
  const executeAIRequest = useCallback(async <T>(
    requestFn: (modelId: string) => Promise<T>,
    options: {
      useCase: string
      priority?: 'low' | 'medium' | 'high' | 'critical'
      timeout?: number
      retryLimit?: number
      requiresHighQuality?: boolean
      costSensitive?: boolean
      strategy?: string
    }
  ): Promise<T | null> => {
    const context: RequestContext = {
      useCase: options.useCase,
      priority: options.priority || 'medium',
      timeout: options.timeout || 30000,
      retryLimit: options.retryLimit || 3,
      requiresHighQuality: options.requiresHighQuality || false,
      costSensitive: options.costSensitive || false,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const result = await executeWithFallback(requestFn, context, options.strategy)
    return result?.result || null
  }, [executeWithFallback])

  // Get best model for use case
  const getBestModelForUseCase = useCallback(async (
    useCase: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    const context: RequestContext = {
      useCase,
      priority,
      timeout: 30000,
      retryLimit: 3,
      requiresHighQuality: priority === 'high' || priority === 'critical',
      costSensitive: priority === 'low',
      requestId: `decision_${Date.now()}`
    }

    const decision = await makeRoutingDecision(context)
    return decision?.selectedModel || null
  }, [makeRoutingDecision])

  return {
    executeAIRequest,
    getBestModelForUseCase
  }
}

// Hook for monitoring routing health
export function useRoutingHealthMonitor() {
  const { systemStatus, getModelMetrics, getRoutingRecommendations } = useAutomatedRouting()
  
  // Get critical alerts
  const getCriticalAlerts = useCallback(() => {
    const recommendations = getRoutingRecommendations()
    return recommendations.filter(r => r.severity === 'high')
  }, [getRoutingRecommendations])

  // Get system health summary
  const getHealthSummary = useCallback(() => {
    if (!systemStatus) return null

    const totalModels = Object.keys(systemStatus.modelHealth).length
    const healthyModels = Object.values(systemStatus.modelHealth)
      .filter(h => h.isAvailable && h.performanceScore > 70).length
    const openBreakers = Object.values(systemStatus.circuitBreakers)
      .filter(b => b.state === 'open').length

    return {
      overallHealth: systemStatus.overallHealth,
      totalModels,
      healthyModels,
      degradedModels: totalModels - healthyModels,
      openCircuitBreakers: openBreakers,
      status: systemStatus.overallHealth > 80 ? 'healthy' : 
              systemStatus.overallHealth > 60 ? 'degraded' : 'critical'
    }
  }, [systemStatus])

  return {
    systemStatus,
    getCriticalAlerts,
    getHealthSummary,
    getModelMetrics,
    getRoutingRecommendations
  }
}
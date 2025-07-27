'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  modelFallbackRouter,
  type RoutingDecision,
  type FailoverEvent,
  type RouterHealth,
  type AIModel,
  type ModelRoute,
  type PerformanceMetrics
} from '@/lib/model-fallback-router'
import type { UserProfile } from '@/types'

interface RouterState {
  health: RouterHealth | null
  models: AIModel[]
  routes: ModelRoute[]
  recentFailovers: FailoverEvent[]
  isLoading: boolean
  error: string | null
}

// Main hook for model routing functionality
export function useModelFallbackRouter() {
  const [state, setState] = useState<RouterState>({
    health: null,
    models: [],
    routes: [],
    recentFailovers: [],
    isLoading: false,
    error: null
  })

  // Load router data
  const loadRouterData = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const health = modelFallbackRouter.getRouterHealth()
      const models = modelFallbackRouter.getModels()
      const routes = modelFallbackRouter.getRoutes()
      const recentFailovers = modelFallbackRouter.getFailoverEvents(50)
      
      setState(prev => ({
        ...prev,
        health,
        models,
        routes,
        recentFailovers,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load router data'
      }))
    }
  }, [])

  // Route a request
  const routeRequest = useCallback(async (
    useCase: string,
    userProfile?: UserProfile,
    content?: string
  ): Promise<RoutingDecision | null> => {
    try {
      setState(prev => ({ ...prev, error: null }))
      return await modelFallbackRouter.routeRequest(useCase, userProfile, content)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to route request'
      }))
      return null
    }
  }, [])

  // Record request result
  const recordRequestResult = useCallback(async (
    modelId: string,
    useCase: string,
    responseTime: number,
    success: boolean,
    errorType?: string,
    userProfile?: UserProfile
  ) => {
    try {
      await modelFallbackRouter.recordRequestResult(
        modelId,
        useCase,
        responseTime,
        success,
        errorType,
        userProfile
      )
      
      // Refresh data after recording
      loadRouterData()
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to record request result'
      }))
    }
  }, [loadRouterData])

  // Get model performance
  const getModelPerformance = useCallback((modelId: string): PerformanceMetrics | null => {
    return modelFallbackRouter.getModelPerformance(modelId)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Load data on mount and set up periodic refresh
  useEffect(() => {
    loadRouterData()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadRouterData, 30000)
    
    return () => clearInterval(interval)
  }, [loadRouterData])

  return {
    // State
    health: state.health,
    models: state.models,
    routes: state.routes,
    recentFailovers: state.recentFailovers,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    routeRequest,
    recordRequestResult,
    getModelPerformance,
    loadRouterData,
    clearError
  }
}

// Hook for routing health monitoring
export function useRouterHealthMonitoring() {
  const { health, models, recentFailovers, loadRouterData } = useModelFallbackRouter()
  
  // Get health status summary
  const getHealthSummary = useCallback(() => {
    if (!health) return null
    
    const criticalIssues = []
    const warnings = []
    
    if (health.overallStatus === 'critical') {
      criticalIssues.push('Router is in critical state')
    }
    
    if (health.successRate < 0.9) {
      criticalIssues.push(`Low success rate: ${(health.successRate * 100).toFixed(1)}%`)
    }
    
    if (health.avgResponseTime > 5000) {
      warnings.push(`High response time: ${health.avgResponseTime.toFixed(0)}ms`)
    }
    
    if (health.unhealthyModels > 0) {
      warnings.push(`${health.unhealthyModels} unhealthy models`)
    }
    
    return {
      status: health.overallStatus,
      criticalIssues,
      warnings,
      healthyModels: health.healthyModels,
      totalModels: health.activeModels,
      successRate: health.successRate,
      avgResponseTime: health.avgResponseTime
    }
  }, [health])

  // Get model health breakdown
  const getModelHealthBreakdown = useCallback(() => {
    const breakdown = models.reduce((acc, model) => {
      acc[model.status] = (acc[model.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      healthy: breakdown.healthy || 0,
      degraded: breakdown.degraded || 0,
      unhealthy: breakdown.unhealthy || 0,
      disabled: breakdown.disabled || 0
    }
  }, [models])

  // Get recent failover summary
  const getFailoverSummary = useCallback(() => {
    const last24Hours = recentFailovers.filter(
      event => Date.now() - event.timestamp.getTime() < 24 * 60 * 60 * 1000
    )
    
    const reasonCounts = last24Hours.reduce((acc, event) => {
      acc[event.reason] = (acc[event.reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: last24Hours.length,
      reasons: reasonCounts,
      affectedModels: [...new Set(last24Hours.map(e => e.originalModel))].length
    }
  }, [recentFailovers])

  return {
    health,
    healthSummary: getHealthSummary(),
    modelHealthBreakdown: getModelHealthBreakdown(),
    failoverSummary: getFailoverSummary(),
    recentFailovers,
    refreshHealth: loadRouterData
  }
}

// Hook for smart AI request routing
export function useSmartRouting() {
  const { routeRequest, recordRequestResult } = useModelFallbackRouter()
  const [routingHistory, setRoutingHistory] = useState<Array<{
    timestamp: Date
    useCase: string
    selectedModel: string
    reason: string
    confidence: number
    responseTime?: number
    success?: boolean
  }>>([])

  // Make smart AI request with automatic routing and fallback
  const makeSmartRequest = useCallback(async (
    useCase: string,
    prompt: string,
    userProfile?: UserProfile,
    options?: {
      timeout?: number
      retryCount?: number
    }
  ): Promise<{
    response: string
    routingDecision: RoutingDecision
    responseTime: number
    success: boolean
  } | null> => {
    const startTime = Date.now()
    const timeout = options?.timeout || 30000
    const retryCount = options?.retryCount || 2
    
    try {
      // Get routing decision
      const routingDecision = await routeRequest(useCase, userProfile, prompt)
      if (!routingDecision) {
        throw new Error('Failed to get routing decision')
      }

      // Record routing decision
      setRoutingHistory(prev => [...prev, {
        timestamp: new Date(),
        useCase,
        selectedModel: routingDecision.selectedModel,
        reason: routingDecision.reason,
        confidence: routingDecision.confidence
      }].slice(-100)) // Keep last 100 entries

      let lastError: Error | null = null
      
      // Try primary model with fallbacks
      const modelsToTry = [routingDecision.selectedModel, ...routingDecision.fallbackModels]
      
      for (let i = 0; i < Math.min(modelsToTry.length, retryCount + 1); i++) {
        const modelId = modelsToTry[i]
        
        try {
          // Make the actual API request (this would be implemented based on the specific AI provider)
          const response = await makeModelRequest(modelId, prompt, timeout)
          const responseTime = Date.now() - startTime
          
          // Record successful result
          await recordRequestResult(
            modelId,
            useCase,
            responseTime,
            true,
            undefined,
            userProfile
          )
          
          // Update routing history
          setRoutingHistory(prev => {
            const updated = [...prev]
            const lastEntry = updated[updated.length - 1]
            if (lastEntry) {
              lastEntry.responseTime = responseTime
              lastEntry.success = true
            }
            return updated
          })
          
          return {
            response,
            routingDecision,
            responseTime,
            success: true
          }
          
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error')
          const responseTime = Date.now() - startTime
          
          // Record failed result
          await recordRequestResult(
            modelId,
            useCase,
            responseTime,
            false,
            lastError.message,
            userProfile
          )
          
          // If not the last attempt, continue to next model
          if (i < Math.min(modelsToTry.length, retryCount + 1) - 1) {
            console.warn(`Model ${modelId} failed, trying fallback:`, lastError.message)
            continue
          }
        }
      }
      
      throw lastError || new Error('All models failed')
      
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Update routing history with failure
      setRoutingHistory(prev => {
        const updated = [...prev]
        const lastEntry = updated[updated.length - 1]
        if (lastEntry) {
          lastEntry.responseTime = responseTime
          lastEntry.success = false
        }
        return updated
      })
      
      console.error('Smart routing failed:', error)
      return null
    }
  }, [routeRequest, recordRequestResult])

  // Get routing statistics
  const getRoutingStats = useCallback(() => {
    const total = routingHistory.length
    if (total === 0) return null
    
    const successful = routingHistory.filter(h => h.success).length
    const avgResponseTime = routingHistory
      .filter(h => h.responseTime)
      .reduce((sum, h) => sum + (h.responseTime || 0), 0) / 
      routingHistory.filter(h => h.responseTime).length
    
    const modelUsage = routingHistory.reduce((acc, h) => {
      acc[h.selectedModel] = (acc[h.selectedModel] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const useCaseDistribution = routingHistory.reduce((acc, h) => {
      acc[h.useCase] = (acc[h.useCase] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalRequests: total,
      successRate: successful / total,
      avgResponseTime: avgResponseTime || 0,
      modelUsage,
      useCaseDistribution,
      avgConfidence: routingHistory.reduce((sum, h) => sum + h.confidence, 0) / total
    }
  }, [routingHistory])

  return {
    makeSmartRequest,
    routingHistory: routingHistory.slice(-20), // Show last 20
    routingStats: getRoutingStats()
  }
}

// Helper function to make actual model request (would be implemented based on provider)
async function makeModelRequest(modelId: string, prompt: string, timeout: number): Promise<string> {
  // This is a mock implementation
  // In reality, this would route to the appropriate AI provider API
  
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timeout'))
    }, timeout)
    
    // Simulate API call
    setTimeout(() => {
      clearTimeout(timer)
      
      // Simulate occasional failures
      if (Math.random() < 0.05) {
        reject(new Error('Simulated API error'))
        return
      }
      
      resolve(`Mock response from ${modelId}: ${prompt.slice(0, 50)}...`)
    }, Math.random() * 2000 + 500) // 500-2500ms response time
  })
}
'use client'

import { multiModelAI } from './multi-model-ai'

// Model health and performance tracking
interface ModelHealth {
  modelId: string
  isAvailable: boolean
  averageResponseTime: number
  errorRate: number
  successRate: number
  lastHealthCheck: Date
  consecutiveFailures: number
  lastSuccessfulRequest: Date | null
  performanceScore: number // 0-100
  rateLimitStatus: 'normal' | 'approaching' | 'exceeded'
  estimatedRecoveryTime?: Date
}

// Circuit breaker states
type CircuitBreakerState = 'closed' | 'open' | 'half-open'

interface CircuitBreaker {
  modelId: string
  state: CircuitBreakerState
  failureCount: number
  lastFailureTime: Date | null
  nextRetryTime: Date | null
  successThreshold: number
  failureThreshold: number
  timeout: number
}

// Routing configuration
interface RoutingStrategy {
  strategy: 'primary_fallback' | 'load_balanced' | 'cost_optimized' | 'performance_optimized'
  primaryModel: string
  fallbackModels: string[]
  weights?: Record<string, number> // For load balancing
  costPriority?: number // 0-100, higher = prefer cheaper models
  performancePriority?: number // 0-100, higher = prefer faster models
  qualityPriority?: number // 0-100, higher = prefer higher quality models
}

// Request context for routing decisions
interface RequestContext {
  useCase: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  timeout: number
  retryLimit: number
  requiresHighQuality: boolean
  costSensitive: boolean
  userId?: string
  sessionId?: string
  requestId: string
}

// Routing decision result
interface RoutingDecision {
  selectedModel: string
  reason: string
  confidence: number
  alternativeModels: string[]
  estimatedCost: number
  estimatedResponseTime: number
  routingStrategy: string
  metadata: {
    circuitBreakerStates: Record<string, CircuitBreakerState>
    modelHealthScores: Record<string, number>
    decisionTime: Date
    fallbackChain: string[]
  }
}

// Automated model routing and fallback system
class AutomatedModelRouter {
  private modelHealth: Map<string, ModelHealth> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private requestHistory: Map<string, any[]> = new Map()
  private routingStrategies: Map<string, RoutingStrategy> = new Map()
  
  // Health check intervals
  private healthCheckInterval: NodeJS.Timeout | null = null
  private readonly HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minute
  private readonly FAILURE_THRESHOLD = 5
  private readonly SUCCESS_THRESHOLD = 3

  constructor() {
    this.initializeModels()
    this.setupDefaultRoutingStrategies()
    this.startHealthChecking()
  }

  // Initialize model health tracking
  private initializeModels() {
    const models = ['openai-gpt-4o-mini', 'claude-3-haiku', 'claude-3-sonnet']
    
    models.forEach(modelId => {
      this.modelHealth.set(modelId, {
        modelId,
        isAvailable: true,
        averageResponseTime: 1000,
        errorRate: 0,
        successRate: 100,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
        lastSuccessfulRequest: null,
        performanceScore: 100,
        rateLimitStatus: 'normal'
      })

      this.circuitBreakers.set(modelId, {
        modelId,
        state: 'closed',
        failureCount: 0,
        lastFailureTime: null,
        nextRetryTime: null,
        successThreshold: this.SUCCESS_THRESHOLD,
        failureThreshold: this.FAILURE_THRESHOLD,
        timeout: this.CIRCUIT_BREAKER_TIMEOUT
      })
    })
  }

  // Setup default routing strategies
  private setupDefaultRoutingStrategies() {
    // Primary-fallback strategy
    this.routingStrategies.set('default', {
      strategy: 'primary_fallback',
      primaryModel: 'openai-gpt-4o-mini',
      fallbackModels: ['claude-3-haiku', 'claude-3-sonnet']
    })

    // Performance-optimized strategy
    this.routingStrategies.set('performance', {
      strategy: 'performance_optimized',
      primaryModel: 'claude-3-haiku',
      fallbackModels: ['openai-gpt-4o-mini', 'claude-3-sonnet'],
      performancePriority: 80,
      qualityPriority: 60,
      costPriority: 40
    })

    // Cost-optimized strategy
    this.routingStrategies.set('cost_optimized', {
      strategy: 'cost_optimized',
      primaryModel: 'claude-3-haiku',
      fallbackModels: ['openai-gpt-4o-mini', 'claude-3-sonnet'],
      costPriority: 90,
      performancePriority: 40,
      qualityPriority: 50
    })

    // Load balanced strategy
    this.routingStrategies.set('load_balanced', {
      strategy: 'load_balanced',
      primaryModel: 'openai-gpt-4o-mini',
      fallbackModels: ['claude-3-haiku', 'claude-3-sonnet'],
      weights: {
        'openai-gpt-4o-mini': 0.5,
        'claude-3-haiku': 0.3,
        'claude-3-sonnet': 0.2
      }
    })
  }

  // Start automated health checking
  private startHealthChecking() {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, this.HEALTH_CHECK_INTERVAL)
  }

  // Perform health checks on all models
  private async performHealthChecks() {
    const healthCheckPromises = Array.from(this.modelHealth.keys()).map(async modelId => {
      try {
        const startTime = Date.now()
        
        // Simple health check request
        const response = await this.makeHealthCheckRequest(modelId)
        const responseTime = Date.now() - startTime
        
        if (response.success) {
          this.updateModelHealth(modelId, {
            isAvailable: true,
            averageResponseTime: responseTime,
            lastSuccessfulRequest: new Date(),
            consecutiveFailures: 0
          })
          
          // Reset circuit breaker on successful health check
          this.updateCircuitBreaker(modelId, 'success')
        } else {
          this.handleModelFailure(modelId, response.error)
        }
      } catch (error) {
        this.handleModelFailure(modelId, error as Error)
      }
    })

    await Promise.allSettled(healthCheckPromises)
  }

  // Make a simple health check request
  private async makeHealthCheckRequest(modelId: string): Promise<{ success: boolean, error?: Error }> {
    try {
      // Simple test request to check model availability
      const testPrompt = "Respond with 'OK' if you're working properly."
      const response = await multiModelAI.generateContent({
        useCase: 'general_tutoring',
        userProfile: { subject: 'test', level: 'beginner', age_group: 'adult', use_case: 'personal' } as any,
        context: testPrompt,
        requestType: 'content',
        priority: 'low',
        maxTokens: 10,
        temperature: 0
      })

      return { success: response.content && response.content.toLowerCase().includes('ok') }
    } catch (error) {
      return { success: false, error: error as Error }
    }
  }

  // Update model health metrics
  private updateModelHealth(modelId: string, updates: Partial<ModelHealth>) {
    const current = this.modelHealth.get(modelId)
    if (!current) return

    const updated = { ...current, ...updates, lastHealthCheck: new Date() }
    
    // Calculate performance score
    updated.performanceScore = this.calculatePerformanceScore(updated)
    
    this.modelHealth.set(modelId, updated)
  }

  // Calculate model performance score
  private calculatePerformanceScore(health: ModelHealth): number {
    const availabilityScore = health.isAvailable ? 40 : 0
    const successRateScore = health.successRate * 0.4
    const responseTimeScore = Math.max(0, 20 - (health.averageResponseTime / 100))
    const failureScore = Math.max(0, 10 - health.consecutiveFailures)
    
    return Math.min(100, availabilityScore + successRateScore + responseTimeScore + failureScore)
  }

  // Handle model failure
  private handleModelFailure(modelId: string, error: Error) {
    const health = this.modelHealth.get(modelId)
    if (!health) return

    const updatedHealth = {
      ...health,
      consecutiveFailures: health.consecutiveFailures + 1,
      errorRate: Math.min(100, health.errorRate + 1),
      successRate: Math.max(0, health.successRate - 1),
      lastHealthCheck: new Date()
    }

    // Mark as unavailable after threshold failures
    if (updatedHealth.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      updatedHealth.isAvailable = false
    }

    this.modelHealth.set(modelId, updatedHealth)
    this.updateCircuitBreaker(modelId, 'failure', error)
  }

  // Update circuit breaker state
  private updateCircuitBreaker(modelId: string, event: 'success' | 'failure', error?: Error) {
    const breaker = this.circuitBreakers.get(modelId)
    if (!breaker) return

    const now = new Date()

    if (event === 'success') {
      if (breaker.state === 'half-open') {
        // Reset to closed after successful request in half-open state
        breaker.state = 'closed'
        breaker.failureCount = 0
        breaker.nextRetryTime = null
      } else if (breaker.state === 'closed') {
        // Reduce failure count on success
        breaker.failureCount = Math.max(0, breaker.failureCount - 1)
      }
    } else if (event === 'failure') {
      breaker.failureCount++
      breaker.lastFailureTime = now

      if (breaker.failureCount >= breaker.failureThreshold && breaker.state === 'closed') {
        // Open circuit breaker
        breaker.state = 'open'
        breaker.nextRetryTime = new Date(now.getTime() + breaker.timeout)
      } else if (breaker.state === 'half-open') {
        // Go back to open state
        breaker.state = 'open'
        breaker.nextRetryTime = new Date(now.getTime() + breaker.timeout)
      }
    }

    // Check if we should transition from open to half-open
    if (breaker.state === 'open' && breaker.nextRetryTime && now >= breaker.nextRetryTime) {
      breaker.state = 'half-open'
      breaker.nextRetryTime = null
    }

    this.circuitBreakers.set(modelId, breaker)
  }

  // Main routing decision method
  async makeRoutingDecision(context: RequestContext, strategyName: string = 'default'): Promise<RoutingDecision> {
    const strategy = this.routingStrategies.get(strategyName) || this.routingStrategies.get('default')!
    const startTime = Date.now()

    // Get available models (circuit breaker check)
    const availableModels = this.getAvailableModels()
    
    // Apply routing strategy
    let selectedModel: string
    let reason: string
    let confidence: number

    switch (strategy.strategy) {
      case 'primary_fallback':
        ({ selectedModel, reason, confidence } = this.applyPrimaryFallbackStrategy(strategy, availableModels, context))
        break
      case 'load_balanced':
        ({ selectedModel, reason, confidence } = this.applyLoadBalancedStrategy(strategy, availableModels, context))
        break
      case 'performance_optimized':
        ({ selectedModel, reason, confidence } = this.applyPerformanceOptimizedStrategy(strategy, availableModels, context))
        break
      case 'cost_optimized':
        ({ selectedModel, reason, confidence } = this.applyCostOptimizedStrategy(strategy, availableModels, context))
        break
      default:
        ({ selectedModel, reason, confidence } = this.applyPrimaryFallbackStrategy(strategy, availableModels, context))
    }

    // Get alternative models for fallback
    const alternativeModels = availableModels.filter(m => m !== selectedModel)

    // Estimate cost and response time
    const estimatedCost = this.estimateRequestCost(selectedModel)
    const estimatedResponseTime = this.estimateResponseTime(selectedModel)

    // Create fallback chain
    const fallbackChain = this.createFallbackChain(selectedModel, alternativeModels, context)

    return {
      selectedModel,
      reason,
      confidence,
      alternativeModels,
      estimatedCost,
      estimatedResponseTime,
      routingStrategy: strategy.strategy,
      metadata: {
        circuitBreakerStates: Object.fromEntries(
          Array.from(this.circuitBreakers.entries()).map(([id, breaker]) => [id, breaker.state])
        ),
        modelHealthScores: Object.fromEntries(
          Array.from(this.modelHealth.entries()).map(([id, health]) => [id, health.performanceScore])
        ),
        decisionTime: new Date(),
        fallbackChain
      }
    }
  }

  // Get models that are available (circuit breaker allows)
  private getAvailableModels(): string[] {
    return Array.from(this.circuitBreakers.entries())
      .filter(([_, breaker]) => breaker.state !== 'open')
      .map(([modelId, _]) => modelId)
      .filter(modelId => {
        const health = this.modelHealth.get(modelId)
        return health?.isAvailable !== false
      })
  }

  // Apply primary-fallback routing strategy
  private applyPrimaryFallbackStrategy(
    strategy: RoutingStrategy,
    availableModels: string[],
    context: RequestContext
  ): { selectedModel: string, reason: string, confidence: number } {
    // Try primary model first
    if (availableModels.includes(strategy.primaryModel)) {
      return {
        selectedModel: strategy.primaryModel,
        reason: 'Primary model available and healthy',
        confidence: 0.9
      }
    }

    // Try fallback models in order
    for (const fallbackModel of strategy.fallbackModels) {
      if (availableModels.includes(fallbackModel)) {
        return {
          selectedModel: fallbackModel,
          reason: `Primary model unavailable, using fallback: ${fallbackModel}`,
          confidence: 0.7
        }
      }
    }

    // Last resort: use any available model
    if (availableModels.length > 0) {
      return {
        selectedModel: availableModels[0],
        reason: 'All configured models unavailable, using any available model',
        confidence: 0.5
      }
    }

    // No models available - this should trigger emergency fallback
    throw new Error('No models available for routing')
  }

  // Apply load-balanced routing strategy
  private applyLoadBalancedStrategy(
    strategy: RoutingStrategy,
    availableModels: string[],
    context: RequestContext
  ): { selectedModel: string, reason: string, confidence: number } {
    if (!strategy.weights) {
      return this.applyPrimaryFallbackStrategy(strategy, availableModels, context)
    }

    // Filter weights to only available models
    const availableWeights = Object.entries(strategy.weights)
      .filter(([modelId, _]) => availableModels.includes(modelId))

    if (availableWeights.length === 0) {
      throw new Error('No weighted models available')
    }

    // Normalize weights
    const totalWeight = availableWeights.reduce((sum, [_, weight]) => sum + weight, 0)
    const normalizedWeights = availableWeights.map(([modelId, weight]) => [modelId, weight / totalWeight])

    // Select model based on weights (simplified random selection)
    const random = Math.random()
    let cumulative = 0

    for (const [modelId, weight] of normalizedWeights) {
      cumulative += weight as number
      if (random <= cumulative) {
        return {
          selectedModel: String(modelId),
          reason: `Load-balanced selection (weight: ${((weight as number) * 100).toFixed(1)}%)`,
          confidence: 0.8
        }
      }
    }

    // Fallback to first available model
    return {
      selectedModel: String(availableWeights[0][0]),
      reason: 'Load balancing fallback to first available model',
      confidence: 0.6
    }
  }

  // Apply performance-optimized routing strategy
  private applyPerformanceOptimizedStrategy(
    strategy: RoutingStrategy,
    availableModels: string[],
    context: RequestContext
  ): { selectedModel: string, reason: string, confidence: number } {
    // Score models based on performance metrics
    const modelScores = availableModels.map(modelId => {
      const health = this.modelHealth.get(modelId)!
      
      const performanceScore = health.performanceScore
      const responseTimeScore = Math.max(0, 100 - health.averageResponseTime / 50) // Lower response time = higher score
      const reliabilityScore = health.successRate
      
      const totalScore = (
        performanceScore * 0.4 +
        responseTimeScore * 0.4 +
        reliabilityScore * 0.2
      )

      return { modelId, score: totalScore }
    })

    // Sort by score and select best
    modelScores.sort((a, b) => b.score - a.score)
    const bestModel = modelScores[0]

    return {
      selectedModel: bestModel.modelId,
      reason: `Performance-optimized selection (score: ${bestModel.score.toFixed(1)})`,
      confidence: Math.min(0.95, bestModel.score / 100)
    }
  }

  // Apply cost-optimized routing strategy
  private applyCostOptimizedStrategy(
    strategy: RoutingStrategy,
    availableModels: string[],
    context: RequestContext
  ): { selectedModel: string, reason: string, confidence: number } {
    // Define cost rankings (lower number = cheaper)
    const costRankings: Record<string, number> = {
      'claude-3-haiku': 1,
      'openai-gpt-4o-mini': 2,
      'claude-3-sonnet': 3
    }

    // Sort available models by cost
    const sortedByCost = availableModels
      .map(modelId => ({ modelId, cost: costRankings[modelId] || 999 }))
      .sort((a, b) => a.cost - b.cost)

    if (sortedByCost.length === 0) {
      throw new Error('No models available for cost optimization')
    }

    const cheapestModel = sortedByCost[0]

    return {
      selectedModel: cheapestModel.modelId,
      reason: `Cost-optimized selection (cost rank: ${cheapestModel.cost})`,
      confidence: 0.8
    }
  }

  // Create fallback chain for request execution
  private createFallbackChain(selectedModel: string, alternativeModels: string[], context: RequestContext): string[] {
    const chain = [selectedModel]
    
    // Add alternatives based on context priority
    if (context.priority === 'critical') {
      // For critical requests, include all available alternatives
      chain.push(...alternativeModels)
    } else if (context.priority === 'high') {
      // For high priority, include top 2 alternatives
      chain.push(...alternativeModels.slice(0, 2))
    } else {
      // For medium/low priority, include 1 alternative
      chain.push(...alternativeModels.slice(0, 1))
    }

    return chain
  }

  // Estimate request cost
  private estimateRequestCost(modelId: string): number {
    // Simplified cost estimation (per 1K tokens)
    const costPerK: Record<string, number> = {
      'claude-3-haiku': 0.0003,
      'openai-gpt-4o-mini': 0.0005,
      'claude-3-sonnet': 0.003
    }

    return costPerK[modelId] || 0.001
  }

  // Estimate response time
  private estimateResponseTime(modelId: string): number {
    const health = this.modelHealth.get(modelId)
    return health?.averageResponseTime || 2000
  }

  // Execute request with automatic fallback
  async executeWithFallback(
    requestFn: (modelId: string) => Promise<any>,
    context: RequestContext,
    strategyName: string = 'default'
  ): Promise<{ result: any, modelUsed: string, attempts: number, totalTime: number }> {
    const startTime = Date.now()
    const decision = await this.makeRoutingDecision(context, strategyName)
    let attempts = 0

    for (const modelId of decision.metadata.fallbackChain) {
      attempts++
      
      try {
        const result = await requestFn(modelId)
        const totalTime = Date.now() - startTime
        
        // Record successful request
        this.recordRequest(modelId, true, Date.now() - startTime)
        
        return { result, modelUsed: modelId, attempts, totalTime }
      } catch (error) {
        // Record failed request
        this.recordRequest(modelId, false, Date.now() - startTime, error as Error)
        
        // Update circuit breaker
        this.updateCircuitBreaker(modelId, 'failure', error as Error)
        
        // If this was the last model in the chain, throw the error
        if (modelId === decision.metadata.fallbackChain[decision.metadata.fallbackChain.length - 1]) {
          throw error
        }
        
        // Continue to next model in fallback chain
        continue
      }
    }

    throw new Error('All models in fallback chain failed')
  }

  // Record request for metrics
  private recordRequest(modelId: string, success: boolean, responseTime: number, error?: Error) {
    const history = this.requestHistory.get(modelId) || []
    history.push({
      timestamp: new Date(),
      success,
      responseTime,
      error: error?.message
    })

    // Keep only last 100 requests
    if (history.length > 100) {
      history.shift()
    }

    this.requestHistory.set(modelId, history)

    // Update health metrics
    const health = this.modelHealth.get(modelId)
    if (health) {
      const recentRequests = history.slice(-10) // Last 10 requests
      const successRate = (recentRequests.filter(r => r.success).length / recentRequests.length) * 100
      const avgResponseTime = recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length

      this.updateModelHealth(modelId, {
        successRate,
        averageResponseTime: avgResponseTime,
        lastSuccessfulRequest: success ? new Date() : health.lastSuccessfulRequest,
        consecutiveFailures: success ? 0 : health.consecutiveFailures + 1
      })
    }
  }

  // Get current system status
  getSystemStatus(): {
    modelHealth: Record<string, ModelHealth>
    circuitBreakers: Record<string, CircuitBreaker>
    routingStrategies: string[]
    overallHealth: number
  } {
    const healthEntries = Array.from(this.modelHealth.entries())
    const breakerEntries = Array.from(this.circuitBreakers.entries())
    
    const overallHealth = healthEntries.reduce((sum, [_, health]) => 
      sum + health.performanceScore, 0
    ) / healthEntries.length

    return {
      modelHealth: Object.fromEntries(healthEntries),
      circuitBreakers: Object.fromEntries(breakerEntries),
      routingStrategies: Array.from(this.routingStrategies.keys()),
      overallHealth
    }
  }

  // Add custom routing strategy
  addRoutingStrategy(name: string, strategy: RoutingStrategy) {
    this.routingStrategies.set(name, strategy)
  }

  // Clean up resources
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
  }
}

// Global instance
export const automatedModelRouter = new AutomatedModelRouter()

// Export types
export type {
  ModelHealth,
  CircuitBreaker,
  CircuitBreakerState,
  RoutingStrategy,
  RequestContext,
  RoutingDecision
}
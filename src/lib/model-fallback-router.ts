// Model Fallback and Routing System
// Intelligent AI model routing with automatic failover and performance monitoring
'use client'

import type { UserProfile } from '@/types'

export interface ModelRoute {
  routeId: string
  name: string
  description: string
  
  // Primary model configuration
  primaryModel: AIModel
  fallbackModels: AIModel[]
  
  // Routing rules
  routingRules: RoutingRule[]
  
  // Health monitoring
  healthCheck: HealthCheckConfig
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics
  
  // Circuit breaker configuration
  circuitBreaker: CircuitBreakerConfig
  
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface AIModel {
  modelId: string
  name: string
  provider: 'openai' | 'anthropic' | 'local'
  endpoint?: string
  
  // Model capabilities
  capabilities: ModelCapability[]
  
  // Performance characteristics
  avgResponseTime: number // milliseconds
  successRate: number // 0-1
  costPerRequest: number // USD
  
  // Usage limits
  rateLimits: RateLimit
  
  // Current status
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled'
  lastHealthCheck: Date
}

export interface ModelCapability {
  capability: string
  score: number // 0-1, effectiveness for this capability
  confidence: number // 0-1, confidence in this score
}

export interface RoutingRule {
  ruleId: string
  name: string
  conditions: RoutingCondition[]
  action: RoutingAction
  priority: number // Higher number = higher priority
  isActive: boolean
}

export interface RoutingCondition {
  field: string // e.g., 'useCase', 'userProfile.subject', 'responseTime'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface RoutingAction {
  type: 'route_to_model' | 'fallback_to_model' | 'load_balance' | 'circuit_break'
  targetModel?: string
  targetModels?: string[] // For load balancing
  weight?: number // For weighted load balancing
}

export interface HealthCheckConfig {
  intervalMs: number
  timeoutMs: number
  healthyThreshold: number // Number of consecutive successful checks
  unhealthyThreshold: number // Number of consecutive failed checks
  testPrompt: string
  expectedResponsePattern?: RegExp
}

export interface PerformanceMetrics {
  requestCount: number
  successCount: number
  failureCount: number
  totalResponseTime: number
  
  // Recent performance (last 100 requests)
  recentRequests: RequestMetric[]
  
  // Time-based metrics
  hourlyMetrics: Map<string, HourlyMetric> // hour -> metrics
  
  lastUpdated: Date
}

export interface RequestMetric {
  timestamp: Date
  responseTime: number
  success: boolean
  errorType?: string
  useCase?: string
  modelUsed: string
}

export interface HourlyMetric {
  hour: string // ISO hour string
  requestCount: number
  successRate: number
  avgResponseTime: number
  errorTypes: Map<string, number>
}

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures to open circuit
  timeoutMs: number // How long to keep circuit open
  halfOpenRetryCount: number // Requests to allow in half-open state
  
  // Current state
  state: 'closed' | 'open' | 'half_open'
  failureCount: number
  lastFailureTime?: Date
  nextRetryTime?: Date
}

export interface RateLimit {
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  
  // Current usage
  currentMinute: number
  currentHour: number
  currentDay: number
  
  // Reset times
  minuteReset: Date
  hourReset: Date
  dayReset: Date
}

export interface RoutingDecision {
  selectedModel: string
  reason: string
  confidence: number
  fallbackModels: string[]
  routingTime: number
  metadata: Record<string, any>
}

export interface FailoverEvent {
  eventId: string
  timestamp: Date
  originalModel: string
  fallbackModel: string
  reason: string
  useCase: string
  userProfile?: UserProfile
  responseTime: number
  success: boolean
}

export interface RouterHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical'
  activeModels: number
  healthyModels: number
  degradedModels: number
  unhealthyModels: number
  totalRequests: number
  successRate: number
  avgResponseTime: number
  lastUpdate: Date
}

class ModelFallbackRouter {
  private routes: Map<string, ModelRoute> = new Map()
  private models: Map<string, AIModel> = new Map()
  private failoverEvents: FailoverEvent[] = []
  private performanceHistory: Map<string, PerformanceMetrics> = new Map()
  
  // Initialize with default models and routes
  constructor() {
    this.initializeDefaultModels()
    this.initializeDefaultRoutes()
    this.startHealthChecks()
  }
  
  // Route a request to the best available model
  async routeRequest(
    useCase: string,
    userProfile?: UserProfile,
    content?: string
  ): Promise<RoutingDecision> {
    const startTime = Date.now()
    
    // Find applicable routing rules
    const applicableRules = this.findApplicableRules(useCase, userProfile, content)
    
    // Select primary model based on rules
    let selectedModel = this.selectPrimaryModel(applicableRules, useCase)
    
    // Check if selected model is healthy
    const model = this.models.get(selectedModel)
    if (!model || !this.isModelHealthy(model)) {
      selectedModel = this.selectFallbackModel(selectedModel, useCase, userProfile)
    }
    
    // Check circuit breaker
    if (this.isCircuitOpen(selectedModel)) {
      selectedModel = this.selectFallbackModel(selectedModel, useCase, userProfile)
    }
    
    // Check rate limits
    if (this.isRateLimited(selectedModel)) {
      selectedModel = this.selectFallbackModel(selectedModel, useCase, userProfile)
    }
    
    const routingTime = Date.now() - startTime
    
    return {
      selectedModel,
      reason: this.getRoutingReason(selectedModel, applicableRules),
      confidence: this.calculateRoutingConfidence(selectedModel, useCase),
      fallbackModels: this.getFallbackModels(selectedModel),
      routingTime,
      metadata: {
        useCase,
        applicableRules: applicableRules.length,
        healthStatus: model?.status || 'unknown'
      }
    }
  }
  
  // Record request result for performance tracking
  async recordRequestResult(
    modelId: string,
    useCase: string,
    responseTime: number,
    success: boolean,
    errorType?: string,
    userProfile?: UserProfile
  ): Promise<void> {
    const model = this.models.get(modelId)
    if (!model) return
    
    // Update model performance metrics
    if (!this.performanceHistory.has(modelId)) {
      this.performanceHistory.set(modelId, {
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        recentRequests: [],
        hourlyMetrics: new Map(),
        lastUpdated: new Date()
      })
    }
    
    const metrics = this.performanceHistory.get(modelId)!
    
    // Update overall metrics
    metrics.requestCount++
    metrics.totalResponseTime += responseTime
    metrics.lastUpdated = new Date()
    
    if (success) {
      metrics.successCount++
    } else {
      metrics.failureCount++
      this.handleFailure(modelId, errorType)
    }
    
    // Update recent requests (keep last 100)
    metrics.recentRequests.push({
      timestamp: new Date(),
      responseTime,
      success,
      errorType,
      useCase,
      modelUsed: modelId
    })
    
    if (metrics.recentRequests.length > 100) {
      metrics.recentRequests.shift()
    }
    
    // Update hourly metrics
    const currentHour = new Date().toISOString().slice(0, 13) // YYYY-MM-DDTHH
    if (!metrics.hourlyMetrics.has(currentHour)) {
      metrics.hourlyMetrics.set(currentHour, {
        hour: currentHour,
        requestCount: 0,
        successRate: 0,
        avgResponseTime: 0,
        errorTypes: new Map()
      })
    }
    
    const hourlyMetric = metrics.hourlyMetrics.get(currentHour)!
    hourlyMetric.requestCount++
    hourlyMetric.avgResponseTime = (
      (hourlyMetric.avgResponseTime * (hourlyMetric.requestCount - 1) + responseTime) / 
      hourlyMetric.requestCount
    )
    hourlyMetric.successRate = metrics.recentRequests.filter(r => r.success).length / metrics.recentRequests.length
    
    if (errorType) {
      const errorCount = hourlyMetric.errorTypes.get(errorType) || 0
      hourlyMetric.errorTypes.set(errorType, errorCount + 1)
    }
    
    // Update model status
    model.avgResponseTime = metrics.totalResponseTime / metrics.requestCount
    model.successRate = metrics.successCount / metrics.requestCount
    
    // Clean up old hourly metrics (keep last 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 13)
    for (const [hour] of metrics.hourlyMetrics) {
      if (hour < cutoffTime) {
        metrics.hourlyMetrics.delete(hour)
      }
    }
  }
  
  // Handle model failure
  private handleFailure(modelId: string, errorType?: string): void {
    const route = Array.from(this.routes.values()).find(r => 
      r.primaryModel.modelId === modelId || 
      r.fallbackModels.some(m => m.modelId === modelId)
    )
    
    if (!route) return
    
    // Update circuit breaker
    route.circuitBreaker.failureCount++
    route.circuitBreaker.lastFailureTime = new Date()
    
    // Open circuit if threshold reached
    if (route.circuitBreaker.failureCount >= route.circuitBreaker.failureThreshold) {
      route.circuitBreaker.state = 'open'
      route.circuitBreaker.nextRetryTime = new Date(
        Date.now() + route.circuitBreaker.timeoutMs
      )
    }
    
    // Update model status based on recent performance
    const metrics = this.performanceHistory.get(modelId)
    if (metrics) {
      const recentSuccessRate = metrics.recentRequests.slice(-10).filter(r => r.success).length / 10
      const model = this.models.get(modelId)!
      
      if (recentSuccessRate < 0.5) {
        model.status = 'unhealthy'
      } else if (recentSuccessRate < 0.8) {
        model.status = 'degraded'
      }
    }
  }
  
  // Find applicable routing rules
  private findApplicableRules(
    useCase: string,
    userProfile?: UserProfile,
    content?: string
  ): RoutingRule[] {
    const applicableRules: RoutingRule[] = []
    
    for (const route of this.routes.values()) {
      for (const rule of route.routingRules) {
        if (!rule.isActive) continue
        
        const matches = rule.conditions.every(condition => 
          this.evaluateCondition(condition, { useCase, userProfile, content })
        )
        
        if (matches) {
          applicableRules.push(rule)
        }
      }
    }
    
    // Sort by priority (higher first)
    return applicableRules.sort((a, b) => b.priority - a.priority)
  }
  
  // Evaluate routing condition
  private evaluateCondition(
    condition: RoutingCondition,
    context: { useCase: string; userProfile?: UserProfile; content?: string }
  ): boolean {
    let value: any
    
    // Extract value from context
    if (condition.field === 'useCase') {
      value = context.useCase
    } else if (condition.field.startsWith('userProfile.')) {
      const field = condition.field.replace('userProfile.', '')
      value = context.userProfile?.[field as keyof UserProfile]
    } else if (condition.field === 'content') {
      value = context.content
    } else {
      return false
    }
    
    // Evaluate condition
    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value)
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value)
      case 'greater_than':
        return typeof value === 'number' && value > condition.value
      case 'less_than':
        return typeof value === 'number' && value < condition.value
      default:
        return false
    }
  }
  
  // Select primary model based on rules
  private selectPrimaryModel(rules: RoutingRule[], useCase: string): string {
    // Use highest priority rule
    for (const rule of rules) {
      if (rule.action.type === 'route_to_model' && rule.action.targetModel) {
        return rule.action.targetModel
      }
      
      if (rule.action.type === 'load_balance' && rule.action.targetModels) {
        return this.selectFromLoadBalance(rule.action.targetModels, rule.action.weight)
      }
    }
    
    // Default model selection based on use case
    return this.getDefaultModelForUseCase(useCase)
  }
  
  // Select fallback model
  private selectFallbackModel(
    failedModel: string,
    useCase: string,
    userProfile?: UserProfile
  ): string {
    // Find route for failed model
    const route = Array.from(this.routes.values()).find(r => 
      r.primaryModel.modelId === failedModel
    )
    
    if (route) {
      // Try fallback models in order
      for (const fallbackModel of route.fallbackModels) {
        if (this.isModelHealthy(fallbackModel) && !this.isCircuitOpen(fallbackModel.modelId)) {
          // Record failover event
          this.recordFailoverEvent(failedModel, fallbackModel.modelId, 'primary_unhealthy', useCase, userProfile)
          return fallbackModel.modelId
        }
      }
    }
    
    // Find any healthy model
    for (const model of this.models.values()) {
      if (model.modelId !== failedModel && this.isModelHealthy(model) && !this.isCircuitOpen(model.modelId)) {
        this.recordFailoverEvent(failedModel, model.modelId, 'emergency_fallback', useCase, userProfile)
        return model.modelId
      }
    }
    
    // Last resort - return failed model (will likely fail)
    this.recordFailoverEvent(failedModel, failedModel, 'no_fallback_available', useCase, userProfile)
    return failedModel
  }
  
  // Check if model is healthy
  private isModelHealthy(model: AIModel): boolean {
    return model.status === 'healthy' || model.status === 'degraded'
  }
  
  // Check if circuit is open
  private isCircuitOpen(modelId: string): boolean {
    const route = Array.from(this.routes.values()).find(r => 
      r.primaryModel.modelId === modelId || 
      r.fallbackModels.some(m => m.modelId === modelId)
    )
    
    if (!route) return false
    
    const cb = route.circuitBreaker
    
    if (cb.state === 'open') {
      // Check if we should move to half-open
      if (cb.nextRetryTime && Date.now() >= cb.nextRetryTime.getTime()) {
        cb.state = 'half_open'
        cb.failureCount = 0
        return false
      }
      return true
    }
    
    return false
  }
  
  // Check if model is rate limited
  private isRateLimited(modelId: string): boolean {
    const model = this.models.get(modelId)
    if (!model) return true
    
    const now = new Date()
    const rl = model.rateLimits
    
    // Reset counters if needed
    if (now >= rl.minuteReset) {
      rl.currentMinute = 0
      rl.minuteReset = new Date(now.getTime() + 60 * 1000)
    }
    
    if (now >= rl.hourReset) {
      rl.currentHour = 0
      rl.hourReset = new Date(now.getTime() + 60 * 60 * 1000)
    }
    
    if (now >= rl.dayReset) {
      rl.currentDay = 0
      rl.dayReset = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
    
    // Check limits
    return (
      rl.currentMinute >= rl.requestsPerMinute ||
      rl.currentHour >= rl.requestsPerHour ||
      rl.currentDay >= rl.requestsPerDay
    )
  }
  
  // Record failover event
  private recordFailoverEvent(
    originalModel: string,
    fallbackModel: string,
    reason: string,
    useCase: string,
    userProfile?: UserProfile
  ): void {
    const event: FailoverEvent = {
      eventId: `failover_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      originalModel,
      fallbackModel,
      reason,
      useCase,
      userProfile,
      responseTime: 0,
      success: false
    }
    
    this.failoverEvents.push(event)
    
    // Keep only last 1000 events
    if (this.failoverEvents.length > 1000) {
      this.failoverEvents.shift()
    }
  }
  
  // Get routing reason
  private getRoutingReason(modelId: string, rules: RoutingRule[]): string {
    if (rules.length > 0) {
      return `Routed by rule: ${rules[0].name}`
    }
    
    return 'Default routing based on use case'
  }
  
  // Calculate routing confidence
  private calculateRoutingConfidence(modelId: string, useCase: string): number {
    const model = this.models.get(modelId)
    if (!model) return 0
    
    // Base confidence on model health and success rate
    let confidence = model.successRate * 0.6
    
    // Add capability score
    const capability = model.capabilities.find(c => c.capability === useCase)
    if (capability) {
      confidence += capability.score * capability.confidence * 0.4
    }
    
    // Reduce confidence if model is degraded
    if (model.status === 'degraded') {
      confidence *= 0.8
    } else if (model.status === 'unhealthy') {
      confidence *= 0.3
    }
    
    return Math.min(confidence, 1)
  }
  
  // Get fallback models
  private getFallbackModels(modelId: string): string[] {
    const route = Array.from(this.routes.values()).find(r => 
      r.primaryModel.modelId === modelId
    )
    
    if (route) {
      return route.fallbackModels
        .filter(m => this.isModelHealthy(m))
        .map(m => m.modelId)
    }
    
    return []
  }
  
  // Select from load balance group
  private selectFromLoadBalance(models: string[], weight?: number): string {
    // Weighted random selection
    const healthyModels = models.filter(modelId => {
      const model = this.models.get(modelId)
      return model && this.isModelHealthy(model) && !this.isCircuitOpen(modelId)
    })
    
    if (healthyModels.length === 0) return models[0]
    
    // Simple round-robin for now
    const index = Math.floor(Math.random() * healthyModels.length)
    return healthyModels[index]
  }
  
  // Get default model for use case
  private getDefaultModelForUseCase(useCase: string): string {
    // Default routing logic
    const mathSciences = ['mathematics', 'science', 'programming', 'engineering']
    const creative = ['creative_writing', 'art', 'music', 'storytelling']
    
    if (mathSciences.includes(useCase)) {
      return 'claude-3-sonnet'
    } else if (creative.includes(useCase)) {
      return 'gpt-4o-mini'
    }
    
    return 'gpt-4o-mini' // Default
  }
  
  // Get router health status
  getRouterHealth(): RouterHealth {
    const models = Array.from(this.models.values())
    const healthy = models.filter(m => m.status === 'healthy').length
    const degraded = models.filter(m => m.status === 'degraded').length
    const unhealthy = models.filter(m => m.status === 'unhealthy').length
    
    const totalRequests = Array.from(this.performanceHistory.values())
      .reduce((sum, metrics) => sum + metrics.requestCount, 0)
    
    const totalSuccess = Array.from(this.performanceHistory.values())
      .reduce((sum, metrics) => sum + metrics.successCount, 0)
    
    const totalResponseTime = Array.from(this.performanceHistory.values())
      .reduce((sum, metrics) => sum + metrics.totalResponseTime, 0)
    
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy'
    
    if (unhealthy > models.length * 0.5) {
      overallStatus = 'critical'
    } else if (degraded + unhealthy > models.length * 0.3) {
      overallStatus = 'degraded'
    }
    
    return {
      overallStatus,
      activeModels: models.filter(m => m.status !== 'disabled').length,
      healthyModels: healthy,
      degradedModels: degraded,
      unhealthyModels: unhealthy,
      totalRequests,
      successRate: totalRequests > 0 ? totalSuccess / totalRequests : 0,
      avgResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
      lastUpdate: new Date()
    }
  }
  
  // Initialize default models
  private initializeDefaultModels(): void {
    const now = new Date()
    
    // OpenAI GPT-4o Mini
    this.models.set('gpt-4o-mini', {
      modelId: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      capabilities: [
        { capability: 'creative_writing', score: 0.95, confidence: 0.9 },
        { capability: 'general', score: 0.9, confidence: 0.9 },
        { capability: 'language_learning', score: 0.85, confidence: 0.8 },
        { capability: 'essay_analysis', score: 0.88, confidence: 0.85 }
      ],
      avgResponseTime: 1200,
      successRate: 0.98,
      costPerRequest: 0.0015,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 3000,
        requestsPerDay: 50000,
        currentMinute: 0,
        currentHour: 0,
        currentDay: 0,
        minuteReset: new Date(now.getTime() + 60 * 1000),
        hourReset: new Date(now.getTime() + 60 * 60 * 1000),
        dayReset: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'healthy',
      lastHealthCheck: now
    })
    
    // Claude 3 Sonnet
    this.models.set('claude-3-sonnet', {
      modelId: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      capabilities: [
        { capability: 'mathematics', score: 0.95, confidence: 0.9 },
        { capability: 'science', score: 0.92, confidence: 0.9 },
        { capability: 'programming', score: 0.93, confidence: 0.9 },
        { capability: 'analysis', score: 0.94, confidence: 0.9 }
      ],
      avgResponseTime: 1800,
      successRate: 0.97,
      costPerRequest: 0.003,
      rateLimits: {
        requestsPerMinute: 50,
        requestsPerHour: 2000,
        requestsPerDay: 30000,
        currentMinute: 0,
        currentHour: 0,
        currentDay: 0,
        minuteReset: new Date(now.getTime() + 60 * 1000),
        hourReset: new Date(now.getTime() + 60 * 60 * 1000),
        dayReset: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'healthy',
      lastHealthCheck: now
    })
    
    // Claude 3 Haiku (Fast fallback)
    this.models.set('claude-3-haiku', {
      modelId: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      capabilities: [
        { capability: 'general', score: 0.8, confidence: 0.85 },
        { capability: 'quick_responses', score: 0.9, confidence: 0.9 }
      ],
      avgResponseTime: 800,
      successRate: 0.99,
      costPerRequest: 0.0008,
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 5000,
        requestsPerDay: 100000,
        currentMinute: 0,
        currentHour: 0,
        currentDay: 0,
        minuteReset: new Date(now.getTime() + 60 * 1000),
        hourReset: new Date(now.getTime() + 60 * 60 * 1000),
        dayReset: new Date(now.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'healthy',
      lastHealthCheck: now
    })
  }
  
  // Initialize default routes
  private initializeDefaultRoutes(): void {
    const gptModel = this.models.get('gpt-4o-mini')!
    const claudeSonnet = this.models.get('claude-3-sonnet')!
    const claudeHaiku = this.models.get('claude-3-haiku')!
    
    // Creative writing route
    this.routes.set('creative-route', {
      routeId: 'creative-route',
      name: 'Creative Writing Route',
      description: 'Optimized for creative writing and storytelling',
      primaryModel: gptModel,
      fallbackModels: [claudeSonnet, claudeHaiku],
      routingRules: [
        {
          ruleId: 'creative-rule',
          name: 'Route creative content to GPT',
          conditions: [
            { field: 'useCase', operator: 'in', value: ['creative_writing', 'storytelling', 'art'] }
          ],
          action: { type: 'route_to_model', targetModel: 'gpt-4o-mini' },
          priority: 100,
          isActive: true
        }
      ],
      healthCheck: {
        intervalMs: 60000,
        timeoutMs: 5000,
        healthyThreshold: 3,
        unhealthyThreshold: 2,
        testPrompt: 'Write a short creative sentence about learning.'
      },
      performanceMetrics: {
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        recentRequests: [],
        hourlyMetrics: new Map(),
        lastUpdated: new Date()
      },
      circuitBreaker: {
        failureThreshold: 5,
        timeoutMs: 30000,
        halfOpenRetryCount: 3,
        state: 'closed',
        failureCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    })
    
    // STEM route
    this.routes.set('stem-route', {
      routeId: 'stem-route',
      name: 'STEM Route',
      description: 'Optimized for mathematics, science, and programming',
      primaryModel: claudeSonnet,
      fallbackModels: [gptModel, claudeHaiku],
      routingRules: [
        {
          ruleId: 'stem-rule',
          name: 'Route STEM content to Claude Sonnet',
          conditions: [
            { field: 'useCase', operator: 'in', value: ['mathematics', 'science', 'programming', 'engineering'] }
          ],
          action: { type: 'route_to_model', targetModel: 'claude-3-sonnet' },
          priority: 100,
          isActive: true
        }
      ],
      healthCheck: {
        intervalMs: 60000,
        timeoutMs: 5000,
        healthyThreshold: 3,
        unhealthyThreshold: 2,
        testPrompt: 'Solve: What is 2 + 2?'
      },
      performanceMetrics: {
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        totalResponseTime: 0,
        recentRequests: [],
        hourlyMetrics: new Map(),
        lastUpdated: new Date()
      },
      circuitBreaker: {
        failureThreshold: 5,
        timeoutMs: 30000,
        halfOpenRetryCount: 3,
        state: 'closed',
        failureCount: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    })
  }
  
  // Start health checks
  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks()
    }, 30000) // Check every 30 seconds
  }
  
  // Perform health checks
  private async performHealthChecks(): Promise<void> {
    for (const route of this.routes.values()) {
      if (!route.isActive) continue
      
      const model = route.primaryModel
      const config = route.healthCheck
      
      try {
        // Simulate health check (in real implementation, make actual API call)
        const isHealthy = Math.random() > 0.05 // 95% healthy
        
        if (isHealthy) {
          if (model.status === 'unhealthy' || model.status === 'degraded') {
            model.status = 'healthy'
          }
          
          // Reset circuit breaker if model is healthy
          if (route.circuitBreaker.state === 'half_open') {
            route.circuitBreaker.state = 'closed'
            route.circuitBreaker.failureCount = 0
          }
        } else {
          model.status = 'unhealthy'
          this.handleFailure(model.modelId, 'health_check_failed')
        }
        
        model.lastHealthCheck = new Date()
        
      } catch (error) {
        model.status = 'unhealthy'
        this.handleFailure(model.modelId, 'health_check_error')
      }
    }
  }
  
  // Get failover events
  getFailoverEvents(limit: number = 100): FailoverEvent[] {
    return this.failoverEvents
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
  
  // Get model performance
  getModelPerformance(modelId: string): PerformanceMetrics | null {
    return this.performanceHistory.get(modelId) || null
  }
  
  // Get all models
  getModels(): AIModel[] {
    return Array.from(this.models.values())
  }
  
  // Get all routes
  getRoutes(): ModelRoute[] {
    return Array.from(this.routes.values())
  }
}

// Export singleton instance
export const modelFallbackRouter = new ModelFallbackRouter()

// Types are already exported above as interfaces, no need to re-export
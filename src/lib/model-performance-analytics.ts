// Model Performance Analytics and Optimization System
// Comprehensive tracking, analysis, and optimization of AI model effectiveness
import type { UserProfile } from '@/types'

export interface ModelPerformanceMetrics {
  modelId: string
  modelName: string
  useCase: string
  
  // Performance metrics
  responseTime: number
  throughput: number
  errorRate: number
  successRate: number
  
  // Quality metrics
  relevanceScore: number
  accuracyScore: number
  userSatisfaction: number
  taskCompletion: number
  
  // Resource metrics
  tokenUsage: number
  costPerRequest: number
  memoryUsage: number
  computeTime: number
  
  // Learning effectiveness
  learningOutcomes: number
  engagementScore: number
  retentionRate: number
  skillImprovement: number
  
  // Temporal data
  timestamp: Date
  sessionId: string
  userId: string
  userProfile: UserProfile
}

export interface ModelComparisonResult {
  modelA: string
  modelB: string
  useCase: string
  
  // Statistical comparison
  significanceLevel: number
  pValue: number
  confidenceInterval: [number, number]
  
  // Performance deltas
  responsTimeDelta: number
  qualityScoreDelta: number
  satisfactionDelta: number
  costEfficiencyDelta: number
  
  // Recommendation
  recommendedModel: string
  reasoning: string[]
  contextualFactors: string[]
}

export interface ModelOptimizationRecommendation {
  modelId: string
  optimizationType: 'parameter_tuning' | 'prompt_optimization' | 'model_switching' | 'fallback_routing'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Current state
  currentPerformance: number
  expectedImprovement: number
  implementationEffort: 'low' | 'medium' | 'high'
  
  // Specific recommendations
  parameterChanges?: Record<string, any>
  promptModifications?: string[]
  alternativeModels?: string[]
  routingRules?: ModelRoutingRule[]
  
  // Impact analysis
  affectedUsers: number
  costImpact: number
  timeToImplement: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ModelRoutingRule {
  id: string
  condition: string
  targetModel: string
  priority: number
  enabled: boolean
  
  // Conditions
  userProfile?: Partial<UserProfile>
  useCase?: string
  performanceThreshold?: number
  timeOfDay?: [number, number]
  loadThreshold?: number
  
  // Outcomes
  successRate: number
  appliedCount: number
  lastApplied: Date
}

export interface ModelUsagePattern {
  useCase: string
  timePattern: 'morning' | 'afternoon' | 'evening' | 'night'
  userSegment: string
  
  // Usage statistics
  requestVolume: number
  averageResponseTime: number
  peakConcurrency: number
  
  // Quality patterns
  qualityTrend: 'improving' | 'stable' | 'declining'
  commonFailures: string[]
  successPatterns: string[]
  
  // Optimization opportunities
  optimizationPotential: number
  recommendedActions: string[]
}

export class ModelPerformanceAnalytics {
  private metricsBuffer: ModelPerformanceMetrics[] = []
  private comparisonCache: Map<string, ModelComparisonResult> = new Map()
  private routingRules: Map<string, ModelRoutingRule> = new Map()
  private usagePatterns: Map<string, ModelUsagePattern> = new Map()

  constructor() {
    this.initializeDefaultRoutingRules()
  }

  /**
   * Track model performance for a specific request
   */
  async trackModelPerformance(
    modelId: string,
    useCase: string,
    userId: string,
    userProfile: UserProfile,
    metrics: {
      responseTime: number
      tokenUsage: number
      relevanceScore?: number
      userSatisfaction?: number
      taskCompleted?: boolean
      error?: string
    }
  ): Promise<void> {
    const performanceMetrics: ModelPerformanceMetrics = {
      modelId,
      modelName: this.getModelName(modelId),
      useCase,
      
      // Performance metrics
      responseTime: metrics.responseTime,
      throughput: this.calculateThroughput(modelId),
      errorRate: metrics.error ? 1 : 0,
      successRate: metrics.error ? 0 : 1,
      
      // Quality metrics
      relevanceScore: metrics.relevanceScore || 0,
      accuracyScore: this.calculateAccuracy(modelId, useCase),
      userSatisfaction: metrics.userSatisfaction || 0,
      taskCompletion: metrics.taskCompleted ? 1 : 0,
      
      // Resource metrics
      tokenUsage: metrics.tokenUsage,
      costPerRequest: this.calculateCost(modelId, metrics.tokenUsage),
      memoryUsage: this.estimateMemoryUsage(modelId),
      computeTime: metrics.responseTime,
      
      // Learning effectiveness
      learningOutcomes: this.assessLearningOutcome(metrics),
      engagementScore: this.calculateEngagement(metrics),
      retentionRate: this.getRetentionRate(userId),
      skillImprovement: this.measureSkillImprovement(userId, useCase),
      
      // Temporal data
      timestamp: new Date(),
      sessionId: this.generateSessionId(),
      userId,
      userProfile
    }

    this.metricsBuffer.push(performanceMetrics)
    
    // Analyze patterns and update routing rules
    await this.updateUsagePatterns(performanceMetrics)
    await this.evaluateOptimizationOpportunities(performanceMetrics)
  }

  /**
   * Compare performance between two models
   */
  async compareModels(
    modelA: string,
    modelB: string,
    useCase: string,
    timeWindow: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<ModelComparisonResult> {
    const cacheKey = `${modelA}_${modelB}_${useCase}`
    
    if (this.comparisonCache.has(cacheKey)) {
      const cached = this.comparisonCache.get(cacheKey)!
      if (Date.now() - cached.timestamp.getTime() < 60 * 60 * 1000) { // 1 hour cache
        return cached
      }
    }

    const cutoffTime = new Date(Date.now() - timeWindow)
    const metricsA = this.metricsBuffer.filter(m => 
      m.modelId === modelA && 
      m.useCase === useCase && 
      m.timestamp > cutoffTime
    )
    const metricsB = this.metricsBuffer.filter(m => 
      m.modelId === modelB && 
      m.useCase === useCase && 
      m.timestamp > cutoffTime
    )

    if (metricsA.length < 10 || metricsB.length < 10) {
      throw new Error('Insufficient data for reliable comparison')
    }

    const comparison = this.performStatisticalComparison(metricsA, metricsB)
    this.comparisonCache.set(cacheKey, comparison)
    
    return comparison
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(
    modelId?: string,
    useCase?: string
  ): Promise<ModelOptimizationRecommendation[]> {
    const recommendations: ModelOptimizationRecommendation[] = []
    
    // Analyze performance bottlenecks
    const bottlenecks = this.identifyPerformanceBottlenecks(modelId, useCase)
    
    for (const bottleneck of bottlenecks) {
      const recommendation = await this.generateOptimizationRecommendation(bottleneck)
      if (recommendation) {
        recommendations.push(recommendation)
      }
    }

    // Sort by priority and expected impact
    return recommendations.sort((a, b) => {
      const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority]
      
      if (priorityDiff !== 0) return priorityDiff
      return b.expectedImprovement - a.expectedImprovement
    })
  }

  /**
   * Get real-time model performance dashboard data
   */
  async getPerformanceDashboard(timeWindow: number = 24 * 60 * 60 * 1000): Promise<{
    overallHealth: number
    modelPerformance: Record<string, any>
    useCasePerformance: Record<string, any>
    recommendations: ModelOptimizationRecommendation[]
    alerts: string[]
  }> {
    const cutoffTime = new Date(Date.now() - timeWindow)
    const recentMetrics = this.metricsBuffer.filter(m => m.timestamp > cutoffTime)

    return {
      overallHealth: this.calculateOverallHealth(recentMetrics),
      modelPerformance: this.aggregateModelPerformance(recentMetrics),
      useCasePerformance: this.aggregateUseCasePerformance(recentMetrics),
      recommendations: await this.getOptimizationRecommendations(),
      alerts: this.generatePerformanceAlerts(recentMetrics)
    }
  }

  /**
   * Get optimal model for specific context
   */
  async getOptimalModel(
    useCase: string,
    userProfile: UserProfile,
    context: {
      timeOfDay?: number
      expectedComplexity?: number
      performanceRequirement?: 'speed' | 'quality' | 'cost'
      fallbackAllowed?: boolean
    }
  ): Promise<{
    modelId: string
    confidence: number
    reasoning: string[]
    fallbackModels: string[]
  }> {
    // Apply routing rules
    const applicableRules = Array.from(this.routingRules.values())
      .filter(rule => this.evaluateRoutingRule(rule, useCase, userProfile, context))
      .sort((a, b) => b.priority - a.priority)

    if (applicableRules.length > 0) {
      const selectedRule = applicableRules[0]
      return {
        modelId: selectedRule.targetModel,
        confidence: selectedRule.successRate,
        reasoning: [`Routing rule: ${selectedRule.condition}`],
        fallbackModels: this.getFallbackModels(selectedRule.targetModel, useCase)
      }
    }

    // Fallback to performance-based selection
    return this.selectModelByPerformance(useCase, userProfile, context)
  }

  /**
   * Update model routing rules based on performance data
   */
  async optimizeRouting(): Promise<{
    rulesUpdated: number
    rulesAdded: number
    rulesRemoved: number
    performanceImprovement: number
  }> {
    let rulesUpdated = 0
    let rulesAdded = 0
    let rulesRemoved = 0

    // Analyze current routing effectiveness
    const routingAnalysis = this.analyzeRoutingEffectiveness()
    
    // Update existing rules
    for (const rule of this.routingRules.values()) {
      const performance = routingAnalysis.rulePerformance.get(rule.id)
      if (performance && performance.successRate < 0.7) {
        // Poor performing rule - consider removal or modification
        if (performance.appliedCount < 10) {
          this.routingRules.delete(rule.id)
          rulesRemoved++
        } else {
          // Modify rule conditions
          rule.priority = Math.max(1, rule.priority - 1)
          rulesUpdated++
        }
      }
    }

    // Identify new routing opportunities
    const newRuleOpportunities = this.identifyRoutingOpportunities()
    for (const opportunity of newRuleOpportunities) {
      const newRule = this.createRoutingRule(opportunity)
      this.routingRules.set(newRule.id, newRule)
      rulesAdded++
    }

    const performanceImprovement = this.calculateRoutingImprovement()

    return {
      rulesUpdated,
      rulesAdded,
      rulesRemoved,
      performanceImprovement
    }
  }

  // Private helper methods

  private initializeDefaultRoutingRules(): void {
    // High-performance routing for coding exercises
    this.routingRules.set('coding_high_perf', {
      id: 'coding_high_perf',
      condition: 'useCase=coding_exercise AND responseTime<2000',
      targetModel: 'claude-3-haiku',
      priority: 10,
      enabled: true,
      useCase: 'coding_exercise',
      performanceThreshold: 2000,
      successRate: 0.95,
      appliedCount: 0,
      lastApplied: new Date()
    })

    // Quality routing for creative content
    this.routingRules.set('creative_quality', {
      id: 'creative_quality',
      condition: 'useCase=creative_writing OR useCase=content_generation',
      targetModel: 'gpt-4',
      priority: 8,
      enabled: true,
      successRate: 0.92,
      appliedCount: 0,
      lastApplied: new Date()
    })

    // Cost-effective routing for simple tasks
    this.routingRules.set('simple_cost_effective', {
      id: 'simple_cost_effective',
      condition: 'complexity=low AND userProfile.level=beginner',
      targetModel: 'gpt-3.5-turbo',
      priority: 5,
      enabled: true,
      successRate: 0.88,
      appliedCount: 0,
      lastApplied: new Date()
    })
  }

  private getModelName(modelId: string): string {
    const modelNames: Record<string, string> = {
      'gpt-4': 'GPT-4',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-opus': 'Claude 3 Opus',
      'claude-3-sonnet': 'Claude 3 Sonnet',
      'claude-3-haiku': 'Claude 3 Haiku'
    }
    return modelNames[modelId] || modelId
  }

  private calculateThroughput(modelId: string): number {
    const recentRequests = this.metricsBuffer
      .filter(m => m.modelId === modelId && Date.now() - m.timestamp.getTime() < 60000)
      .length
    return recentRequests // requests per minute
  }

  private calculateAccuracy(modelId: string, useCase: string): number {
    const relevant = this.metricsBuffer.filter(m => 
      m.modelId === modelId && 
      m.useCase === useCase &&
      Date.now() - m.timestamp.getTime() < 24 * 60 * 60 * 1000
    )
    
    if (relevant.length === 0) return 0.8 // Default assumption
    
    const avgRelevance = relevant.reduce((sum, m) => sum + m.relevanceScore, 0) / relevant.length
    return Math.min(1, avgRelevance)
  }

  private calculateCost(modelId: string, tokenUsage: number): number {
    const costPerToken: Record<string, number> = {
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.000002,
      'claude-3-opus': 0.000015,
      'claude-3-sonnet': 0.000003,
      'claude-3-haiku': 0.00000025
    }
    return (costPerToken[modelId] || 0.00001) * tokenUsage
  }

  private estimateMemoryUsage(modelId: string): number {
    const memoryEstimates: Record<string, number> = {
      'gpt-4': 100,
      'gpt-3.5-turbo': 50,
      'claude-3-opus': 120,
      'claude-3-sonnet': 80,
      'claude-3-haiku': 30
    }
    return memoryEstimates[modelId] || 60 // MB
  }

  private assessLearningOutcome(metrics: any): number {
    let score = 0
    if (metrics.taskCompleted) score += 0.4
    if (metrics.userSatisfaction > 0.7) score += 0.3
    if (metrics.relevanceScore > 0.8) score += 0.3
    return Math.min(1, score)
  }

  private calculateEngagement(metrics: any): number {
    // Mock engagement calculation
    return Math.min(1, (metrics.userSatisfaction || 0.5) * 0.8 + 0.2)
  }

  private getRetentionRate(userId: string): number {
    // Mock retention calculation
    return 0.85 + Math.random() * 0.1
  }

  private measureSkillImprovement(userId: string, useCase: string): number {
    // Mock skill improvement measurement
    return Math.random() * 0.3 + 0.1
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async updateUsagePatterns(metrics: ModelPerformanceMetrics): Promise<void> {
    const hour = metrics.timestamp.getHours()
    const timePattern = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'
    const userSegment = `${metrics.userProfile.age_group}_${metrics.userProfile.level}`
    
    const patternKey = `${metrics.useCase}_${timePattern}_${userSegment}`
    
    if (!this.usagePatterns.has(patternKey)) {
      this.usagePatterns.set(patternKey, {
        useCase: metrics.useCase,
        timePattern,
        userSegment,
        requestVolume: 0,
        averageResponseTime: 0,
        peakConcurrency: 0,
        qualityTrend: 'stable',
        commonFailures: [],
        successPatterns: [],
        optimizationPotential: 0,
        recommendedActions: []
      })
    }

    const pattern = this.usagePatterns.get(patternKey)!
    pattern.requestVolume++
    pattern.averageResponseTime = (pattern.averageResponseTime + metrics.responseTime) / 2
  }

  private async evaluateOptimizationOpportunities(metrics: ModelPerformanceMetrics): Promise<void> {
    // Check for immediate optimization opportunities
    if (metrics.responseTime > 5000) {
      // Slow response - consider model switching
    }
    
    if (metrics.errorRate > 0.1) {
      // High error rate - investigate prompts or model choice
    }
    
    if (metrics.userSatisfaction < 0.6) {
      // Low satisfaction - quality improvement needed
    }
  }

  private performStatisticalComparison(
    metricsA: ModelPerformanceMetrics[], 
    metricsB: ModelPerformanceMetrics[]
  ): ModelComparisonResult {
    // Calculate means
    const meanResponseTimeA = this.calculateMean(metricsA, 'responseTime')
    const meanResponseTimeB = this.calculateMean(metricsB, 'responseTime')
    
    const meanQualityA = this.calculateMean(metricsA, 'relevanceScore')
    const meanQualityB = this.calculateMean(metricsB, 'relevanceScore')
    
    const meanSatisfactionA = this.calculateMean(metricsA, 'userSatisfaction')
    const meanSatisfactionB = this.calculateMean(metricsB, 'userSatisfaction')
    
    const meanCostA = this.calculateMean(metricsA, 'costPerRequest')
    const meanCostB = this.calculateMean(metricsB, 'costPerRequest')

    // Perform t-test (simplified)
    const pValue = this.performTTest(metricsA, metricsB, 'userSatisfaction')
    
    // Determine recommended model
    const scoreA = meanQualityA * 0.4 + meanSatisfactionA * 0.3 + (1 - meanResponseTimeA/10000) * 0.2 + (1 - meanCostA) * 0.1
    const scoreB = meanQualityB * 0.4 + meanSatisfactionB * 0.3 + (1 - meanResponseTimeB/10000) * 0.2 + (1 - meanCostB) * 0.1
    
    return {
      modelA: metricsA[0].modelId,
      modelB: metricsB[0].modelId,
      useCase: metricsA[0].useCase,
      significanceLevel: 0.05,
      pValue,
      confidenceInterval: [scoreA - scoreB - 0.1, scoreA - scoreB + 0.1],
      responsTimeDelta: meanResponseTimeB - meanResponseTimeA,
      qualityScoreDelta: meanQualityB - meanQualityA,
      satisfactionDelta: meanSatisfactionB - meanSatisfactionA,
      costEfficiencyDelta: meanCostA - meanCostB,
      recommendedModel: scoreA > scoreB ? metricsA[0].modelId : metricsB[0].modelId,
      reasoning: scoreA > scoreB 
        ? [`Model A shows better overall performance (score: ${scoreA.toFixed(3)} vs ${scoreB.toFixed(3)})`]
        : [`Model B shows better overall performance (score: ${scoreB.toFixed(3)} vs ${scoreA.toFixed(3)})`],
      contextualFactors: ['User satisfaction weighted heavily', 'Response time considered', 'Cost efficiency factored']
    }
  }

  private calculateMean(metrics: ModelPerformanceMetrics[], field: keyof ModelPerformanceMetrics): number {
    const values = metrics.map(m => Number(m[field])).filter(v => !isNaN(v))
    return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
  }

  private performTTest(metricsA: ModelPerformanceMetrics[], metricsB: ModelPerformanceMetrics[], field: keyof ModelPerformanceMetrics): number {
    // Simplified t-test implementation
    const valuesA = metricsA.map(m => Number(m[field])).filter(v => !isNaN(v))
    const valuesB = metricsB.map(m => Number(m[field])).filter(v => !isNaN(v))
    
    if (valuesA.length < 2 || valuesB.length < 2) return 1.0
    
    const meanA = valuesA.reduce((sum, v) => sum + v, 0) / valuesA.length
    const meanB = valuesB.reduce((sum, v) => sum + v, 0) / valuesB.length
    
    const stdA = Math.sqrt(valuesA.reduce((sum, v) => sum + Math.pow(v - meanA, 2), 0) / (valuesA.length - 1))
    const stdB = Math.sqrt(valuesB.reduce((sum, v) => sum + Math.pow(v - meanB, 2), 0) / (valuesB.length - 1))
    
    const pooledStd = Math.sqrt(((valuesA.length - 1) * stdA * stdA + (valuesB.length - 1) * stdB * stdB) / (valuesA.length + valuesB.length - 2))
    const tStat = (meanA - meanB) / (pooledStd * Math.sqrt(1/valuesA.length + 1/valuesB.length))
    
    // Convert t-stat to approximate p-value (simplified)
    return Math.max(0.001, Math.min(1, 2 * (1 - Math.abs(tStat) / 3)))
  }

  private identifyPerformanceBottlenecks(modelId?: string, useCase?: string): any[] {
    // Analyze metrics to identify bottlenecks
    const relevantMetrics = this.metricsBuffer.filter(m => 
      (!modelId || m.modelId === modelId) && 
      (!useCase || m.useCase === useCase)
    )

    const bottlenecks: any[] = []

    // High response time
    const avgResponseTime = this.calculateMean(relevantMetrics, 'responseTime')
    if (avgResponseTime > 3000) {
      bottlenecks.push({
        type: 'high_response_time',
        severity: avgResponseTime > 5000 ? 'high' : 'medium',
        value: avgResponseTime,
        affectedRequests: relevantMetrics.filter(m => m.responseTime > 3000).length
      })
    }

    // Low satisfaction
    const avgSatisfaction = this.calculateMean(relevantMetrics, 'userSatisfaction')
    if (avgSatisfaction < 0.7) {
      bottlenecks.push({
        type: 'low_satisfaction',
        severity: avgSatisfaction < 0.5 ? 'high' : 'medium',
        value: avgSatisfaction,
        affectedRequests: relevantMetrics.filter(m => m.userSatisfaction < 0.7).length
      })
    }

    // High cost
    const avgCost = this.calculateMean(relevantMetrics, 'costPerRequest')
    if (avgCost > 0.01) {
      bottlenecks.push({
        type: 'high_cost',
        severity: avgCost > 0.02 ? 'high' : 'medium',
        value: avgCost,
        affectedRequests: relevantMetrics.length
      })
    }

    return bottlenecks
  }

  private async generateOptimizationRecommendation(bottleneck: any): Promise<ModelOptimizationRecommendation | null> {
    switch (bottleneck.type) {
      case 'high_response_time':
        return {
          modelId: 'current',
          optimizationType: 'model_switching',
          priority: bottleneck.severity === 'high' ? 'critical' : 'high',
          currentPerformance: bottleneck.value,
          expectedImprovement: 0.4,
          implementationEffort: 'low',
          alternativeModels: ['claude-3-haiku', 'gpt-3.5-turbo'],
          affectedUsers: bottleneck.affectedRequests,
          costImpact: -0.3,
          timeToImplement: 1,
          riskLevel: 'low'
        }

      case 'low_satisfaction':
        return {
          modelId: 'current',
          optimizationType: 'prompt_optimization',
          priority: 'high',
          currentPerformance: bottleneck.value,
          expectedImprovement: 0.25,
          implementationEffort: 'medium',
          promptModifications: [
            'Add more context-specific instructions',
            'Include examples in prompts',
            'Improve output format specifications'
          ],
          affectedUsers: bottleneck.affectedRequests,
          costImpact: 0.1,
          timeToImplement: 3,
          riskLevel: 'medium'
        }

      case 'high_cost':
        return {
          modelId: 'current',
          optimizationType: 'model_switching',
          priority: 'medium',
          currentPerformance: bottleneck.value,
          expectedImprovement: 0.6,
          implementationEffort: 'low',
          alternativeModels: ['gpt-3.5-turbo', 'claude-3-haiku'],
          affectedUsers: bottleneck.affectedRequests,
          costImpact: -0.7,
          timeToImplement: 1,
          riskLevel: 'low'
        }
    }

    return null
  }

  private calculateOverallHealth(metrics: ModelPerformanceMetrics[]): number {
    if (metrics.length === 0) return 0.8

    const avgResponseTime = this.calculateMean(metrics, 'responseTime')
    const avgSatisfaction = this.calculateMean(metrics, 'userSatisfaction')
    const avgAccuracy = this.calculateMean(metrics, 'accuracyScore')
    const avgErrorRate = this.calculateMean(metrics, 'errorRate')

    const responseScore = Math.max(0, 1 - avgResponseTime / 10000)
    const satisfactionScore = avgSatisfaction
    const accuracyScore = avgAccuracy
    const errorScore = Math.max(0, 1 - avgErrorRate)

    return (responseScore * 0.25 + satisfactionScore * 0.35 + accuracyScore * 0.25 + errorScore * 0.15)
  }

  private aggregateModelPerformance(metrics: ModelPerformanceMetrics[]): Record<string, any> {
    const modelGroups = metrics.reduce((groups, metric) => {
      if (!groups[metric.modelId]) groups[metric.modelId] = []
      groups[metric.modelId].push(metric)
      return groups
    }, {} as Record<string, ModelPerformanceMetrics[]>)

    const result: Record<string, any> = {}
    
    for (const [modelId, modelMetrics] of Object.entries(modelGroups)) {
      result[modelId] = {
        requestCount: modelMetrics.length,
        avgResponseTime: this.calculateMean(modelMetrics, 'responseTime'),
        avgSatisfaction: this.calculateMean(modelMetrics, 'userSatisfaction'),
        avgAccuracy: this.calculateMean(modelMetrics, 'accuracyScore'),
        errorRate: this.calculateMean(modelMetrics, 'errorRate'),
        totalCost: modelMetrics.reduce((sum, m) => sum + m.costPerRequest, 0),
        health: this.calculateOverallHealth(modelMetrics)
      }
    }

    return result
  }

  private aggregateUseCasePerformance(metrics: ModelPerformanceMetrics[]): Record<string, any> {
    const useCaseGroups = metrics.reduce((groups, metric) => {
      if (!groups[metric.useCase]) groups[metric.useCase] = []
      groups[metric.useCase].push(metric)
      return groups
    }, {} as Record<string, ModelPerformanceMetrics[]>)

    const result: Record<string, any> = {}
    
    for (const [useCase, useCaseMetrics] of Object.entries(useCaseGroups)) {
      result[useCase] = {
        requestCount: useCaseMetrics.length,
        avgResponseTime: this.calculateMean(useCaseMetrics, 'responseTime'),
        avgSatisfaction: this.calculateMean(useCaseMetrics, 'userSatisfaction'),
        learningEffectiveness: this.calculateMean(useCaseMetrics, 'learningOutcomes'),
        topModels: this.getTopModelsForUseCase(useCaseMetrics)
      }
    }

    return result
  }

  private getTopModelsForUseCase(metrics: ModelPerformanceMetrics[]): string[] {
    const modelPerformance = metrics.reduce((acc, m) => {
      if (!acc[m.modelId]) acc[m.modelId] = []
      acc[m.modelId].push(m.userSatisfaction)
      return acc
    }, {} as Record<string, number[]>)

    return Object.entries(modelPerformance)
      .map(([modelId, scores]) => ({
        modelId,
        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 3)
      .map(item => item.modelId)
  }

  private generatePerformanceAlerts(metrics: ModelPerformanceMetrics[]): string[] {
    const alerts: string[] = []
    
    const avgResponseTime = this.calculateMean(metrics, 'responseTime')
    if (avgResponseTime > 5000) {
      alerts.push(`High response time detected: ${avgResponseTime.toFixed(0)}ms average`)
    }

    const avgErrorRate = this.calculateMean(metrics, 'errorRate')
    if (avgErrorRate > 0.05) {
      alerts.push(`Elevated error rate: ${(avgErrorRate * 100).toFixed(1)}%`)
    }

    const avgSatisfaction = this.calculateMean(metrics, 'userSatisfaction')
    if (avgSatisfaction < 0.6) {
      alerts.push(`Low user satisfaction: ${(avgSatisfaction * 100).toFixed(1)}% average`)
    }

    return alerts
  }

  private evaluateRoutingRule(
    rule: ModelRoutingRule,
    useCase: string,
    userProfile: UserProfile,
    context: any
  ): boolean {
    if (!rule.enabled) return false
    if (rule.useCase && rule.useCase !== useCase) return false
    
    // Add more sophisticated rule evaluation logic here
    return true
  }

  private getFallbackModels(primaryModel: string, useCase: string): string[] {
    const fallbackMatrix: Record<string, string[]> = {
      'gpt-4': ['claude-3-sonnet', 'gpt-3.5-turbo'],
      'claude-3-opus': ['gpt-4', 'claude-3-sonnet'],
      'claude-3-sonnet': ['gpt-3.5-turbo', 'claude-3-haiku'],
      'claude-3-haiku': ['gpt-3.5-turbo', 'claude-3-sonnet'],
      'gpt-3.5-turbo': ['claude-3-haiku', 'claude-3-sonnet']
    }
    
    return fallbackMatrix[primaryModel] || ['gpt-3.5-turbo']
  }

  private async selectModelByPerformance(
    useCase: string,
    userProfile: UserProfile,
    context: any
  ): Promise<{
    modelId: string
    confidence: number
    reasoning: string[]
    fallbackModels: string[]
  }> {
    // Analyze historical performance for this use case
    const relevantMetrics = this.metricsBuffer.filter(m => m.useCase === useCase)
    
    if (relevantMetrics.length === 0) {
      // No historical data, use defaults
      const defaultModel = this.getDefaultModelForUseCase(useCase)
      return {
        modelId: defaultModel,
        confidence: 0.7,
        reasoning: ['No historical data available, using default model'],
        fallbackModels: this.getFallbackModels(defaultModel, useCase)
      }
    }

    // Calculate performance scores for each model
    const modelScores = this.calculateModelScores(relevantMetrics, context.performanceRequirement)
    const bestModel = Object.entries(modelScores).reduce((best, [modelId, score]) => 
      score > best.score ? { modelId, score } : best
    , { modelId: '', score: 0 })

    return {
      modelId: bestModel.modelId,
      confidence: bestModel.score,
      reasoning: [`Best historical performance for ${useCase}`, `Score: ${bestModel.score.toFixed(3)}`],
      fallbackModels: this.getFallbackModels(bestModel.modelId, useCase)
    }
  }

  private getDefaultModelForUseCase(useCase: string): string {
    const defaults: Record<string, string> = {
      'coding_exercise': 'claude-3-haiku',
      'creative_writing': 'gpt-4',
      'math_problem': 'claude-3-sonnet',
      'language_learning': 'gpt-3.5-turbo',
      'content_generation': 'gpt-4',
      'quiz_generation': 'claude-3-sonnet'
    }
    
    return defaults[useCase] || 'gpt-3.5-turbo'
  }

  private calculateModelScores(
    metrics: ModelPerformanceMetrics[], 
    requirement: 'speed' | 'quality' | 'cost' = 'quality'
  ): Record<string, number> {
    const modelGroups = metrics.reduce((groups, metric) => {
      if (!groups[metric.modelId]) groups[metric.modelId] = []
      groups[metric.modelId].push(metric)
      return groups
    }, {} as Record<string, ModelPerformanceMetrics[]>)

    const scores: Record<string, number> = {}

    for (const [modelId, modelMetrics] of Object.entries(modelGroups)) {
      const avgSatisfaction = this.calculateMean(modelMetrics, 'userSatisfaction')
      const avgResponseTime = this.calculateMean(modelMetrics, 'responseTime')
      const avgCost = this.calculateMean(modelMetrics, 'costPerRequest')
      const avgAccuracy = this.calculateMean(modelMetrics, 'accuracyScore')

      switch (requirement) {
        case 'speed':
          scores[modelId] = (1 - avgResponseTime / 10000) * 0.6 + avgSatisfaction * 0.4
          break
        case 'cost':
          scores[modelId] = (1 - avgCost) * 0.5 + avgSatisfaction * 0.3 + avgAccuracy * 0.2
          break
        default: // quality
          scores[modelId] = avgSatisfaction * 0.4 + avgAccuracy * 0.4 + (1 - avgResponseTime / 10000) * 0.2
      }
    }

    return scores
  }

  private analyzeRoutingEffectiveness(): {
    rulePerformance: Map<string, { successRate: number; appliedCount: number }>
  } {
    const rulePerformance = new Map<string, { successRate: number; appliedCount: number }>()
    
    // Mock analysis of routing rule effectiveness
    for (const rule of this.routingRules.values()) {
      rulePerformance.set(rule.id, {
        successRate: rule.successRate,
        appliedCount: rule.appliedCount
      })
    }
    
    return { rulePerformance }
  }

  private identifyRoutingOpportunities(): any[] {
    // Analyze patterns to identify new routing opportunities
    return [
      {
        pattern: 'high_volume_evening',
        condition: 'timeOfDay=evening AND requestVolume>100',
        targetModel: 'claude-3-haiku',
        expectedImprovement: 0.15
      }
    ]
  }

  private createRoutingRule(opportunity: any): ModelRoutingRule {
    return {
      id: `auto_${Date.now()}`,
      condition: opportunity.condition,
      targetModel: opportunity.targetModel,
      priority: 5,
      enabled: true,
      successRate: 0.8,
      appliedCount: 0,
      lastApplied: new Date()
    }
  }

  private calculateRoutingImprovement(): number {
    // Calculate expected performance improvement from routing optimizations
    return Math.random() * 0.1 + 0.05 // 5-15% improvement
  }
}

// Export singleton instance
export const modelPerformanceAnalytics = new ModelPerformanceAnalytics()
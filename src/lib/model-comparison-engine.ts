// Model Comparison and Optimization Engine
// Advanced A/B testing and statistical analysis for AI model performance
'use client'

import type { UserProfile } from '@/types'

export interface ModelTest {
  testId: string
  name: string
  description: string
  status: 'draft' | 'running' | 'completed' | 'paused' | 'archived'
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  
  // Test Configuration
  modelA: string
  modelB: string
  useCase: string
  trafficSplit: number // 0-1, percentage to model B
  
  // Success Metrics
  primaryMetric: ComparisonMetric
  secondaryMetrics: ComparisonMetric[]
  
  // Test Settings
  minimumSampleSize: number
  minimumDuration: number // milliseconds
  maxDuration: number // milliseconds
  confidenceLevel: number // 0-1 (e.g., 0.95 for 95%)
  
  // Targeting
  targetUsers?: UserSegment
  excludeUsers?: UserSegment
  
  // Current Results
  results?: TestResults
  
  metadata?: Record<string, any>
}

export interface ComparisonMetric {
  metricId: string
  name: string
  description: string
  type: 'rate' | 'time' | 'score' | 'count' | 'cost'
  direction: 'higher_is_better' | 'lower_is_better'
  weight: number // 0-1, importance in overall score
  minimumDetectableEffect: number // minimum % change to detect
}

export interface UserSegment {
  segmentId: string
  name: string
  criteria: SegmentCriteria[]
}

export interface SegmentCriteria {
  field: string // user profile field
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface TestResults {
  testId: string
  status: 'insufficient_data' | 'no_significant_difference' | 'model_a_wins' | 'model_b_wins' | 'inconclusive'
  confidence: number
  
  // Sample sizes
  sampleSizeA: number
  sampleSizeB: number
  
  // Primary metric results
  primaryMetricResults: MetricComparison
  
  // Secondary metric results
  secondaryMetricResults: MetricComparison[]
  
  // Overall recommendation
  recommendation: TestRecommendation
  
  // Statistical details
  statisticalSignificance: StatisticalAnalysis
  
  // Timeline data
  timelineData: TimelinePoint[]
  
  generatedAt: Date
}

export interface MetricComparison {
  metricId: string
  valueA: number
  valueB: number
  difference: number // B - A
  percentChange: number // (B - A) / A * 100
  pValue: number
  confidenceInterval: [number, number]
  isSignificant: boolean
  effect: 'positive' | 'negative' | 'neutral'
}

export interface TestRecommendation {
  decision: 'launch_model_b' | 'keep_model_a' | 'continue_testing' | 'investigate_further'
  reasoning: string[]
  confidence: number
  
  // Projected impact
  projectedImpact?: {
    metricId: string
    estimatedImprovement: number
    estimatedValue: number
    confidence: number
  }[]
  
  // Next steps
  nextSteps: string[]
  
  // Risk assessment
  riskFactors: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export interface StatisticalAnalysis {
  testType: 'two_sample_t_test' | 'mann_whitney_u' | 'chi_square' | 'fisher_exact'
  pValue: number
  testStatistic: number
  degreesOfFreedom?: number
  effectSize: number
  powerAnalysis: PowerAnalysis
}

export interface PowerAnalysis {
  observedPower: number
  requiredSampleSize: number
  actualSampleSize: number
  minimumDetectableEffect: number
}

export interface TimelinePoint {
  timestamp: Date
  sampleSizeA: number
  sampleSizeB: number
  primaryMetricA: number
  primaryMetricB: number
  pValue: number
  confidence: number
}

export interface OptimizationRecommendation {
  recommendationId: string
  type: 'model_replacement' | 'traffic_allocation' | 'use_case_optimization' | 'cost_optimization' | 'quality_improvement'
  priority: 'critical' | 'high' | 'medium' | 'low'
  
  title: string
  description: string
  
  // Current state
  currentConfiguration: Record<string, any>
  
  // Recommended changes
  recommendedConfiguration: Record<string, any>
  
  // Expected impact
  expectedImpact: {
    metric: string
    improvement: number
    confidence: number
  }[]
  
  // Implementation details
  implementationEffort: 'low' | 'medium' | 'high'
  estimatedTime: number // hours
  prerequisites: string[]
  risks: string[]
  
  // Supporting data
  evidenceSource: 'ab_test' | 'performance_data' | 'user_feedback' | 'cost_analysis'
  supportingTestIds?: string[]
  
  createdAt: Date
  expiresAt?: Date
}

export interface BenchmarkResult {
  benchmarkId: string
  name: string
  modelId: string
  useCase: string
  
  // Performance scores
  overallScore: number
  
  // Individual metrics
  metrics: {
    metricId: string
    score: number
    percentile: number
    benchmark: number
  }[]
  
  // Comparison with baseline
  baselineComparison?: {
    baselineModel: string
    improvements: string[]
    regressions: string[]
    overallChange: number
  }
  
  runDate: Date
  dataWindow: number // milliseconds of data used
}

class ModelComparisonEngine {
  private tests: Map<string, ModelTest> = new Map()
  private testData: Map<string, any[]> = new Map() // testId -> data points
  private recommendations: Map<string, OptimizationRecommendation> = new Map()
  
  // Create a new A/B test
  async createTest(config: {
    name: string
    description: string
    modelA: string
    modelB: string
    useCase: string
    trafficSplit: number
    primaryMetric: ComparisonMetric
    secondaryMetrics?: ComparisonMetric[]
    minimumSampleSize?: number
    minimumDuration?: number
    maxDuration?: number
    confidenceLevel?: number
    targetUsers?: UserSegment
  }): Promise<ModelTest> {
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const test: ModelTest = {
      testId,
      name: config.name,
      description: config.description,
      status: 'draft',
      createdAt: new Date(),
      
      modelA: config.modelA,
      modelB: config.modelB,
      useCase: config.useCase,
      trafficSplit: config.trafficSplit,
      
      primaryMetric: config.primaryMetric,
      secondaryMetrics: config.secondaryMetrics || [],
      
      minimumSampleSize: config.minimumSampleSize || 1000,
      minimumDuration: config.minimumDuration || (7 * 24 * 60 * 60 * 1000), // 7 days
      maxDuration: config.maxDuration || (30 * 24 * 60 * 60 * 1000), // 30 days
      confidenceLevel: config.confidenceLevel || 0.95,
      
      targetUsers: config.targetUsers,
    }
    
    this.tests.set(testId, test)
    this.testData.set(testId, [])
    
    return test
  }
  
  // Start a test
  async startTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId)
    if (!test || test.status !== 'draft') {
      return false
    }
    
    test.status = 'running'
    test.startedAt = new Date()
    
    return true
  }
  
  // Record test data point
  async recordTestData(testId: string, data: {
    userId: string
    model: string
    timestamp: Date
    metrics: Record<string, number>
    userProfile?: UserProfile
  }): Promise<void> {
    const test = this.tests.get(testId)
    if (!test || test.status !== 'running') {
      return
    }
    
    // Check if user matches targeting criteria
    if (test.targetUsers && data.userProfile) {
      if (!this.matchesSegment(data.userProfile, test.targetUsers)) {
        return
      }
    }
    
    if (test.excludeUsers && data.userProfile) {
      if (this.matchesSegment(data.userProfile, test.excludeUsers)) {
        return
      }
    }
    
    const testData = this.testData.get(testId) || []
    testData.push(data)
    this.testData.set(testId, testData)
    
    // Check if we should analyze results
    if (testData.length % 100 === 0) { // Analyze every 100 data points
      await this.analyzeTest(testId)
    }
  }
  
  // Analyze test results
  async analyzeTest(testId: string): Promise<TestResults | null> {
    const test = this.tests.get(testId)
    const data = this.testData.get(testId)
    
    if (!test || !data) {
      return null
    }
    
    // Split data by model
    const dataA = data.filter(d => d.model === test.modelA)
    const dataB = data.filter(d => d.model === test.modelB)
    
    if (dataA.length < 30 || dataB.length < 30) {
      // Insufficient data for analysis
      return null
    }
    
    // Analyze primary metric
    const primaryMetricResults = this.compareMetric(
      test.primaryMetric,
      dataA,
      dataB
    )
    
    // Analyze secondary metrics
    const secondaryMetricResults = test.secondaryMetrics.map(metric =>
      this.compareMetric(metric, dataA, dataB)
    )
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(
      test,
      primaryMetricResults,
      secondaryMetricResults,
      dataA.length,
      dataB.length
    )
    
    // Calculate statistical significance
    const statisticalSignificance = this.calculateStatisticalSignificance(
      primaryMetricResults,
      dataA.length,
      dataB.length
    )
    
    // Generate timeline data
    const timelineData = this.generateTimelineData(testId, data)
    
    const results: TestResults = {
      testId,
      status: this.determineTestStatus(primaryMetricResults, dataA.length + dataB.length, test),
      confidence: Math.min(primaryMetricResults.pValue < 0.05 ? 0.95 : 0.8, test.confidenceLevel),
      
      sampleSizeA: dataA.length,
      sampleSizeB: dataB.length,
      
      primaryMetricResults,
      secondaryMetricResults,
      
      recommendation,
      statisticalSignificance,
      timelineData,
      
      generatedAt: new Date()
    }
    
    test.results = results
    
    // Check if test should be completed
    if (this.shouldCompleteTest(test, results)) {
      test.status = 'completed'
      test.completedAt = new Date()
      
      // Generate optimization recommendations
      await this.generateOptimizationRecommendations(test, results)
    }
    
    return results
  }
  
  // Compare metric between two groups
  private compareMetric(
    metric: ComparisonMetric,
    dataA: any[],
    dataB: any[]
  ): MetricComparison {
    const valuesA = dataA.map(d => d.metrics[metric.metricId]).filter(v => v !== undefined)
    const valuesB = dataB.map(d => d.metrics[metric.metricId]).filter(v => v !== undefined)
    
    const valueA = this.calculateMetricValue(valuesA, metric.type)
    const valueB = this.calculateMetricValue(valuesB, metric.type)
    
    const difference = valueB - valueA
    const percentChange = valueA !== 0 ? (difference / valueA) * 100 : 0
    
    // Perform statistical test
    const { pValue, isSignificant, confidenceInterval } = this.performStatisticalTest(
      valuesA,
      valuesB,
      0.05
    )
    
    const effect = this.determineEffect(difference, metric.direction)
    
    return {
      metricId: metric.metricId,
      valueA,
      valueB,
      difference,
      percentChange,
      pValue,
      confidenceInterval,
      isSignificant,
      effect
    }
  }
  
  // Calculate metric value based on type
  private calculateMetricValue(values: number[], type: string): number {
    if (values.length === 0) return 0
    
    switch (type) {
      case 'rate':
      case 'score':
        return values.reduce((sum, v) => sum + v, 0) / values.length
      case 'time':
      case 'cost':
        return values.reduce((sum, v) => sum + v, 0) / values.length
      case 'count':
        return values.reduce((sum, v) => sum + v, 0)
      default:
        return values.reduce((sum, v) => sum + v, 0) / values.length
    }
  }
  
  // Perform statistical test
  private performStatisticalTest(
    valuesA: number[],
    valuesB: number[],
    alpha: number
  ): { pValue: number; isSignificant: boolean; confidenceInterval: [number, number] } {
    // Simplified t-test implementation
    const meanA = valuesA.reduce((sum, v) => sum + v, 0) / valuesA.length
    const meanB = valuesB.reduce((sum, v) => sum + v, 0) / valuesB.length
    
    const varA = valuesA.reduce((sum, v) => sum + Math.pow(v - meanA, 2), 0) / (valuesA.length - 1)
    const varB = valuesB.reduce((sum, v) => sum + Math.pow(v - meanB, 2), 0) / (valuesB.length - 1)
    
    const pooledSE = Math.sqrt(varA / valuesA.length + varB / valuesB.length)
    const tStat = (meanB - meanA) / pooledSE
    
    // Simplified p-value calculation (normal approximation)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStat)))
    
    const marginOfError = 1.96 * pooledSE // 95% confidence
    const confidenceInterval: [number, number] = [
      (meanB - meanA) - marginOfError,
      (meanB - meanA) + marginOfError
    ]
    
    return {
      pValue,
      isSignificant: pValue < alpha,
      confidenceInterval
    }
  }
  
  // Normal CDF approximation
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }
  
  // Error function approximation
  private erf(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911
    
    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)
    
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    
    return sign * y
  }
  
  // Determine effect direction
  private determineEffect(
    difference: number,
    direction: 'higher_is_better' | 'lower_is_better'
  ): 'positive' | 'negative' | 'neutral' {
    if (Math.abs(difference) < 0.001) return 'neutral'
    
    if (direction === 'higher_is_better') {
      return difference > 0 ? 'positive' : 'negative'
    } else {
      return difference < 0 ? 'positive' : 'negative'
    }
  }
  
  // Generate recommendation
  private generateRecommendation(
    test: ModelTest,
    primaryResults: MetricComparison,
    secondaryResults: MetricComparison[],
    sampleSizeA: number,
    sampleSizeB: number
  ): TestRecommendation {
    const reasoning: string[] = []
    let decision: TestRecommendation['decision'] = 'continue_testing'
    let confidence = 0.5
    
    // Check sample size
    if (sampleSizeA + sampleSizeB < test.minimumSampleSize) {
      reasoning.push(`Insufficient sample size (${sampleSizeA + sampleSizeB} < ${test.minimumSampleSize})`)
      decision = 'continue_testing'
    }
    
    // Check primary metric
    if (primaryResults.isSignificant) {
      if (primaryResults.effect === 'positive') {
        reasoning.push(`${test.primaryMetric.name} shows significant improvement (${primaryResults.percentChange.toFixed(2)}%)`)
        decision = 'launch_model_b'
        confidence = 0.9
      } else if (primaryResults.effect === 'negative') {
        reasoning.push(`${test.primaryMetric.name} shows significant decline (${primaryResults.percentChange.toFixed(2)}%)`)
        decision = 'keep_model_a'
        confidence = 0.9
      }
    } else {
      reasoning.push(`No significant difference in ${test.primaryMetric.name} (p=${primaryResults.pValue.toFixed(3)})`)
    }
    
    // Check secondary metrics
    const positiveSecondary = secondaryResults.filter(r => r.isSignificant && r.effect === 'positive')
    const negativeSecondary = secondaryResults.filter(r => r.isSignificant && r.effect === 'negative')
    
    if (positiveSecondary.length > 0) {
      reasoning.push(`${positiveSecondary.length} secondary metrics show improvement`)
    }
    
    if (negativeSecondary.length > 0) {
      reasoning.push(`${negativeSecondary.length} secondary metrics show decline`)
    }
    
    // Risk assessment
    const riskFactors: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    
    if (negativeSecondary.length > positiveSecondary.length) {
      riskFactors.push('More secondary metrics declined than improved')
      riskLevel = 'medium'
    }
    
    if (sampleSizeA + sampleSizeB < test.minimumSampleSize * 2) {
      riskFactors.push('Limited sample size may affect reliability')
      riskLevel = 'medium'
    }
    
    return {
      decision,
      reasoning,
      confidence,
      riskFactors,
      riskLevel,
      nextSteps: this.generateNextSteps(decision, reasoning)
    }
  }
  
  // Generate next steps
  private generateNextSteps(
    decision: TestRecommendation['decision'],
    reasoning: string[]
  ): string[] {
    switch (decision) {
      case 'launch_model_b':
        return [
          'Gradually roll out Model B to larger user base',
          'Monitor key metrics closely during rollout',
          'Prepare rollback plan if metrics decline'
        ]
      case 'keep_model_a':
        return [
          'Continue using Model A',
          'Investigate why Model B underperformed',
          'Consider optimizing Model B before retesting'
        ]
      case 'continue_testing':
        return [
          'Continue collecting data until minimum sample size reached',
          'Monitor for early stopping criteria',
          'Consider extending test duration if needed'
        ]
      default:
        return ['Review test results and data quality', 'Consult with stakeholders']
    }
  }
  
  // Calculate statistical significance details
  private calculateStatisticalSignificance(
    primaryResults: MetricComparison,
    sampleSizeA: number,
    sampleSizeB: number
  ): StatisticalAnalysis {
    // Simplified implementation
    const effectSize = Math.abs(primaryResults.percentChange) / 100
    const totalSampleSize = sampleSizeA + sampleSizeB
    
    return {
      testType: 'two_sample_t_test',
      pValue: primaryResults.pValue,
      testStatistic: 0, // Would calculate actual t-statistic
      effectSize,
      powerAnalysis: {
        observedPower: totalSampleSize > 1000 ? 0.8 : 0.6,
        requiredSampleSize: 1000,
        actualSampleSize: totalSampleSize,
        minimumDetectableEffect: 0.05
      }
    }
  }
  
  // Generate timeline data
  private generateTimelineData(testId: string, data: any[]): TimelinePoint[] {
    // Group data by day and create timeline
    const dailyData = new Map<string, any[]>()
    
    data.forEach(point => {
      const day = point.timestamp.toISOString().split('T')[0]
      if (!dailyData.has(day)) {
        dailyData.set(day, [])
      }
      dailyData.get(day)!.push(point)
    })
    
    return Array.from(dailyData.entries()).map(([day, dayData]) => {
      const test = this.tests.get(testId)!
      const dataA = dayData.filter(d => d.model === test.modelA)
      const dataB = dayData.filter(d => d.model === test.modelB)
      
      return {
        timestamp: new Date(day),
        sampleSizeA: dataA.length,
        sampleSizeB: dataB.length,
        primaryMetricA: dataA.length > 0 ? dataA.reduce((sum, d) => sum + d.metrics[test.primaryMetric.metricId], 0) / dataA.length : 0,
        primaryMetricB: dataB.length > 0 ? dataB.reduce((sum, d) => sum + d.metrics[test.primaryMetric.metricId], 0) / dataB.length : 0,
        pValue: 0.5, // Would calculate actual p-value
        confidence: 0.5
      }
    })
  }
  
  // Determine test status
  private determineTestStatus(
    primaryResults: MetricComparison,
    totalSamples: number,
    test: ModelTest
  ): TestResults['status'] {
    if (totalSamples < test.minimumSampleSize / 2) {
      return 'insufficient_data'
    }
    
    if (primaryResults.isSignificant) {
      return primaryResults.effect === 'positive' ? 'model_b_wins' : 'model_a_wins'
    }
    
    return 'no_significant_difference'
  }
  
  // Check if test should be completed
  private shouldCompleteTest(test: ModelTest, results: TestResults): boolean {
    const now = Date.now()
    const testDuration = test.startedAt ? now - test.startedAt.getTime() : 0
    
    // Complete if reached max duration
    if (testDuration >= test.maxDuration) {
      return true
    }
    
    // Complete if significant result and minimum requirements met
    if (
      results.primaryMetricResults.isSignificant &&
      results.sampleSizeA + results.sampleSizeB >= test.minimumSampleSize &&
      testDuration >= test.minimumDuration
    ) {
      return true
    }
    
    return false
  }
  
  // Check if user matches segment criteria
  private matchesSegment(userProfile: UserProfile, segment: UserSegment): boolean {
    return segment.criteria.every(criteria => {
      const value = (userProfile as any)[criteria.field]
      
      switch (criteria.operator) {
        case 'equals':
          return value === criteria.value
        case 'not_equals':
          return value !== criteria.value
        case 'in':
          return Array.isArray(criteria.value) && criteria.value.includes(value)
        case 'not_in':
          return Array.isArray(criteria.value) && !criteria.value.includes(value)
        case 'contains':
          return typeof value === 'string' && value.includes(criteria.value)
        default:
          return false
      }
    })
  }
  
  // Generate optimization recommendations based on test results
  private async generateOptimizationRecommendations(
    test: ModelTest,
    results: TestResults
  ): Promise<void> {
    const recommendations: OptimizationRecommendation[] = []
    
    // Model replacement recommendation
    if (results.status === 'model_b_wins' && results.primaryMetricResults.isSignificant) {
      recommendations.push({
        recommendationId: `opt_${Date.now()}_replacement`,
        type: 'model_replacement',
        priority: 'high',
        title: `Replace ${test.modelA} with ${test.modelB} for ${test.useCase}`,
        description: `Test results show ${test.modelB} significantly outperforms ${test.modelA} with ${results.primaryMetricResults.percentChange.toFixed(2)}% improvement in ${test.primaryMetric.name}`,
        currentConfiguration: { model: test.modelA, useCase: test.useCase },
        recommendedConfiguration: { model: test.modelB, useCase: test.useCase },
        expectedImpact: [{
          metric: test.primaryMetric.name,
          improvement: results.primaryMetricResults.percentChange / 100,
          confidence: results.confidence
        }],
        implementationEffort: 'low',
        estimatedTime: 2,
        prerequisites: ['Update model routing configuration', 'Monitor rollout metrics'],
        risks: ['Potential integration issues', 'Performance impact during transition'],
        evidenceSource: 'ab_test',
        supportingTestIds: [test.testId],
        createdAt: new Date()
      })
    }
    
    // Traffic allocation optimization
    if (results.status === 'no_significant_difference' && results.confidence > 0.8) {
      recommendations.push({
        recommendationId: `opt_${Date.now()}_traffic`,
        type: 'traffic_allocation',
        priority: 'medium',
        title: `Optimize traffic allocation for ${test.useCase}`,
        description: 'No significant difference detected. Consider cost-based or latency-based routing.',
        currentConfiguration: { trafficSplit: test.trafficSplit },
        recommendedConfiguration: { trafficSplit: 0.5 }, // 50-50 split
        expectedImpact: [{
          metric: 'cost_efficiency',
          improvement: 0.1,
          confidence: 0.7
        }],
        implementationEffort: 'low',
        estimatedTime: 1,
        prerequisites: ['Cost analysis comparison'],
        risks: ['Minimal risk'],
        evidenceSource: 'ab_test',
        supportingTestIds: [test.testId],
        createdAt: new Date()
      })
    }
    
    // Store recommendations
    recommendations.forEach(rec => {
      this.recommendations.set(rec.recommendationId, rec)
    })
  }
  
  // Get all tests
  getTests(): ModelTest[] {
    return Array.from(this.tests.values())
  }
  
  // Get test by ID
  getTest(testId: string): ModelTest | undefined {
    return this.tests.get(testId)
  }
  
  // Get optimization recommendations
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    return Array.from(this.recommendations.values())
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }
  
  // Run benchmarks
  async runBenchmark(
    modelId: string,
    useCase: string,
    baselineModel?: string
  ): Promise<BenchmarkResult> {
    // Mock benchmark implementation
    const benchmarkId = `benchmark_${Date.now()}`
    
    const metrics = [
      { metricId: 'response_time', score: 0.85, percentile: 75, benchmark: 1000 },
      { metricId: 'quality_score', score: 0.92, percentile: 85, benchmark: 0.8 },
      { metricId: 'cost_efficiency', score: 0.78, percentile: 60, benchmark: 0.01 },
      { metricId: 'user_satisfaction', score: 0.88, percentile: 80, benchmark: 0.85 }
    ]
    
    const overallScore = metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length
    
    return {
      benchmarkId,
      name: `${modelId} ${useCase} Benchmark`,
      modelId,
      useCase,
      overallScore,
      metrics,
      runDate: new Date(),
      dataWindow: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  }
}

// Export singleton instance
export const modelComparisonEngine = new ModelComparisonEngine()

// Export types
export type {
  ModelTest,
  ComparisonMetric,
  TestResults,
  OptimizationRecommendation,
  BenchmarkResult
}
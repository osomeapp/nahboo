// A/B Testing Framework for AI Model Comparison
// Advanced experimentation platform with statistical analysis and optimization
'use client'

import type { UserProfile } from '@/types'
import { modelComparisonEngine } from '@/lib/model-comparison-engine'

export interface ABTest {
  testId: string
  name: string
  description: string
  status: 'draft' | 'running' | 'completed' | 'paused' | 'archived'
  
  // Test Configuration
  testType: 'simple_ab' | 'multivariate' | 'multi_armed_bandit' | 'sequential'
  variants: TestVariant[]
  
  // Traffic Configuration
  trafficAllocation: TrafficAllocation
  targetAudience: AudienceSegment
  exclusionCriteria?: ExclusionCriteria[]
  
  // Success Metrics
  primaryGoal: TestGoal
  secondaryGoals: TestGoal[]
  
  // Test Timeline
  plannedDuration: number // milliseconds
  minimumSampleSize: number
  maxSampleSize?: number
  startDate?: Date
  endDate?: Date
  
  // Statistical Configuration
  statisticalConfig: StatisticalConfiguration
  
  // Results
  results?: ABTestResults
  
  // Metadata
  createdBy: string
  tags: string[]
  category: string
  createdAt: Date
  updatedAt: Date
}

export interface TestVariant {
  variantId: string
  name: string
  description: string
  
  // Model Configuration
  modelId: string
  modelConfig?: Record<string, any>
  
  // Traffic Weight
  trafficWeight: number // 0-1, sum of all weights should be 1
  
  // Performance Data
  exposures: number
  conversions: number
  metrics: VariantMetrics
  
  // Status
  isControl: boolean
  isActive: boolean
}

export interface TrafficAllocation {
  strategy: 'equal' | 'weighted' | 'adaptive' | 'bandit'
  rolloutPercentage: number // 0-100, percentage of total traffic
  rampUpDuration?: number // milliseconds
  
  // For adaptive strategies
  optimizationMetric?: string
  explorationRate?: number // 0-1, for bandit algorithms
}

export interface AudienceSegment {
  segmentId: string
  name: string
  criteria: SegmentCriteria[]
  estimatedSize?: number
}

export interface SegmentCriteria {
  field: string // e.g., 'userProfile.subject', 'userProfile.level'
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains' | 'exists'
  value: any
  weight?: number // For fuzzy matching
}

export interface ExclusionCriteria {
  reason: string
  criteria: SegmentCriteria[]
}

export interface TestGoal {
  goalId: string
  name: string
  description: string
  metricType: 'conversion' | 'value' | 'engagement' | 'retention' | 'custom'
  
  // Goal Configuration
  eventName?: string // For conversion goals
  valueField?: string // For value goals
  aggregation?: 'sum' | 'average' | 'count' | 'unique'
  
  // Success Criteria
  direction: 'increase' | 'decrease'
  minimumDetectableEffect: number // percentage
  expectedBaseline?: number
  
  // Statistical Settings
  confidenceLevel: number // 0-1, typically 0.95
  statisticalPower: number // 0-1, typically 0.8
  
  // Priority
  weight: number // For multi-goal optimization
}

export interface StatisticalConfiguration {
  method: 'frequentist' | 'bayesian' | 'bootstrap'
  multipleTestingCorrection: 'bonferroni' | 'benjamini_hochberg' | 'none'
  earlyStoppingRule?: EarlyStoppingRule
  adaptiveDesign?: AdaptiveDesign
}

export interface EarlyStoppingRule {
  enabled: boolean
  checkFrequency: number // hours
  efficacyBoundary: number // alpha boundary for early success
  futilityBoundary: number // beta boundary for early failure
  minimumSampleSize: number
}

export interface AdaptiveDesign {
  enabled: boolean
  reallocationFrequency: number // hours
  strategy: 'thompson_sampling' | 'upper_confidence_bound' | 'epsilon_greedy'
  parameters?: Record<string, number>
}

export interface VariantMetrics {
  // Core Metrics
  responseTime: MetricData
  qualityScore: MetricData
  userSatisfaction: MetricData
  errorRate: MetricData
  cost: MetricData
  
  // Custom Metrics
  customMetrics: Map<string, MetricData>
}

export interface MetricData {
  values: number[]
  count: number
  sum: number
  mean: number
  variance: number
  standardDeviation: number
  
  // Percentiles
  p50: number
  p90: number
  p95: number
  p99: number
  
  // Time series
  timeSeriesData: TimeSeriesPoint[]
  
  lastUpdated: Date
}

export interface TimeSeriesPoint {
  timestamp: Date
  value: number
  count: number
}

export interface ABTestResults {
  testId: string
  status: 'inconclusive' | 'significant' | 'no_difference' | 'insufficient_data'
  
  // Overall Results
  winningVariant?: string
  confidence: number
  pValue: number
  effectSize: number
  
  // Variant Comparisons
  variantComparisons: VariantComparison[]
  
  // Goal Results
  goalResults: GoalResult[]
  
  // Statistical Analysis
  statisticalAnalysis: StatisticalAnalysis
  
  // Recommendations
  recommendations: TestRecommendation[]
  
  // Meta Information
  analysisDate: Date
  sampleSize: number
  testDuration: number
}

export interface VariantComparison {
  variantA: string
  variantB: string
  metric: string
  
  // Statistical Results
  meanA: number
  meanB: number
  difference: number
  percentageChange: number
  confidenceInterval: [number, number]
  pValue: number
  isSignificant: boolean
  
  // Effect Size
  cohensD: number
  hedgesG: number
  
  // Practical Significance
  isPracticallySignificant: boolean
  practicalSignificanceThreshold: number
}

export interface GoalResult {
  goalId: string
  status: 'met' | 'not_met' | 'inconclusive'
  actualEffect: number
  expectedEffect: number
  confidence: number
  
  // Winner Analysis
  bestVariant: string
  improvement: number
  
  // Statistical Details
  testStatistic: number
  degreesOfFreedom?: number
  criticalValue: number
}

export interface StatisticalAnalysis {
  method: string
  assumptions: AssumptionCheck[]
  powerAnalysis: PowerAnalysis
  sensitivityAnalysis?: SensitivityAnalysis
  
  // Quality Metrics
  dataQuality: DataQualityMetrics
  biasAssessment: BiasAssessment
}

export interface AssumptionCheck {
  assumption: string
  test: string
  result: 'passed' | 'failed' | 'warning'
  pValue?: number
  details: string
}

export interface PowerAnalysis {
  observedPower: number
  minimumDetectableEffect: number
  requiredSampleSize: number
  actualSampleSize: number
  
  // Power curves
  powerCurve: PowerCurvePoint[]
}

export interface PowerCurvePoint {
  effectSize: number
  power: number
  sampleSize: number
}

export interface SensitivityAnalysis {
  priorSensitivity?: PriorSensitivity[]
  outlierImpact: OutlierImpact
  missingDataImpact: MissingDataImpact
}

export interface PriorSensitivity {
  priorType: string
  priorParameters: Record<string, number>
  posteriorMean: number
  posteriorVariance: number
}

export interface OutlierImpact {
  outliersDetected: number
  impactOnMean: number
  impactOnVariance: number
  robustEstimates: Record<string, number>
}

export interface MissingDataImpact {
  missingDataPercentage: number
  imputationMethod: string
  impactOnResults: number
}

export interface DataQualityMetrics {
  completeness: number // 0-1
  consistency: number // 0-1
  timeliness: number // 0-1
  validity: number // 0-1
  
  issues: DataQualityIssue[]
}

export interface DataQualityIssue {
  type: 'missing_data' | 'outlier' | 'inconsistent' | 'delayed' | 'invalid'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affectedRecords: number
  recommendation: string
}

export interface BiasAssessment {
  selectionBias: BiasCheck
  survivorshipBias: BiasCheck
  confirmationBias: BiasCheck
  noveltyEffect: BiasCheck
  seasonalityBias: BiasCheck
}

export interface BiasCheck {
  detected: boolean
  severity: 'low' | 'medium' | 'high'
  evidence: string[]
  mitigation: string[]
}

export interface TestRecommendation {
  type: 'launch' | 'continue' | 'stop' | 'modify' | 'investigate'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  reasoning: string[]
  
  // Actions
  suggestedActions: RecommendedAction[]
  
  // Impact Estimates
  estimatedImpact: ImpactEstimate
  
  // Risk Assessment
  risks: RiskFactor[]
  
  confidence: number
}

export interface RecommendedAction {
  action: string
  description: string
  effort: 'low' | 'medium' | 'high'
  timeline: string
  prerequisites: string[]
}

export interface ImpactEstimate {
  metric: string
  currentValue: number
  projectedValue: number
  improvement: number
  confidence: number
  
  // Financial Impact
  revenueImpact?: number
  costImpact?: number
  netBenefit?: number
}

export interface RiskFactor {
  risk: string
  probability: number // 0-1
  impact: 'low' | 'medium' | 'high'
  mitigation: string
}

// Experiment tracking for users
export interface UserExperiment {
  userId: string
  testId: string
  variantId: string
  assignmentTime: Date
  
  // Exposure tracking
  exposures: ExposureEvent[]
  
  // Conversion tracking
  conversions: ConversionEvent[]
  
  // Custom events
  customEvents: CustomEvent[]
  
  // User context at assignment
  userContext: UserContext
}

export interface ExposureEvent {
  eventId: string
  timestamp: Date
  context: Record<string, any>
  sessionId?: string
}

export interface ConversionEvent {
  eventId: string
  goalId: string
  timestamp: Date
  value?: number
  properties: Record<string, any>
}

export interface CustomEvent {
  eventId: string
  eventType: string
  timestamp: Date
  properties: Record<string, any>
}

export interface UserContext {
  userProfile: UserProfile
  sessionInfo: SessionInfo
  deviceInfo: DeviceInfo
  locationInfo?: LocationInfo
}

export interface SessionInfo {
  sessionId: string
  startTime: Date
  referrer?: string
  userAgent: string
  initialLandingPage: string
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet'
  operatingSystem: string
  browser: string
  screenResolution?: string
  timezone: string
}

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
  timezone?: string
}

class ABTestingFramework {
  private tests: Map<string, ABTest> = new Map()
  private userExperiments: Map<string, UserExperiment[]> = new Map()
  private variantAssignments: Map<string, Map<string, string>> = new Map() // userId -> testId -> variantId
  
  // Create a new A/B test
  async createTest(config: {
    name: string
    description: string
    testType: ABTest['testType']
    variants: Omit<TestVariant, 'exposures' | 'conversions' | 'metrics'>[]
    trafficAllocation: TrafficAllocation
    targetAudience: AudienceSegment
    primaryGoal: TestGoal
    secondaryGoals?: TestGoal[]
    plannedDuration: number
    minimumSampleSize: number
    statisticalConfig?: Partial<StatisticalConfiguration>
    createdBy: string
    tags?: string[]
    category?: string
  }): Promise<ABTest> {
    const testId = `ab_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Validate traffic weights
    const totalWeight = config.variants.reduce((sum, v) => sum + v.trafficWeight, 0)
    if (Math.abs(totalWeight - 1) > 0.001) {
      throw new Error('Traffic weights must sum to 1.0')
    }
    
    // Ensure exactly one control variant
    const controlVariants = config.variants.filter(v => v.isControl)
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one variant must be marked as control')
    }
    
    const test: ABTest = {
      testId,
      name: config.name,
      description: config.description,
      status: 'draft',
      testType: config.testType,
      
      variants: config.variants.map(v => ({
        ...v,
        exposures: 0,
        conversions: 0,
        metrics: this.initializeVariantMetrics()
      })),
      
      trafficAllocation: config.trafficAllocation,
      targetAudience: config.targetAudience,
      primaryGoal: config.primaryGoal,
      secondaryGoals: config.secondaryGoals || [],
      
      plannedDuration: config.plannedDuration,
      minimumSampleSize: config.minimumSampleSize,
      
      statisticalConfig: {
        method: 'frequentist',
        multipleTestingCorrection: 'benjamini_hochberg',
        ...config.statisticalConfig
      },
      
      createdBy: config.createdBy,
      tags: config.tags || [],
      category: config.category || 'general',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    this.tests.set(testId, test)
    return test
  }
  
  // Start an A/B test
  async startTest(testId: string): Promise<boolean> {
    const test = this.tests.get(testId)
    if (!test || test.status !== 'draft') {
      return false
    }
    
    test.status = 'running'
    test.startDate = new Date()
    test.endDate = new Date(Date.now() + test.plannedDuration)
    test.updatedAt = new Date()
    
    return true
  }
  
  // Assign user to experiment variant
  async assignUserToVariant(
    testId: string, 
    userId: string, 
    userProfile: UserProfile,
    sessionInfo: SessionInfo,
    deviceInfo: DeviceInfo
  ): Promise<string | null> {
    const test = this.tests.get(testId)
    if (!test || test.status !== 'running') {
      return null
    }
    
    // Check if user is already assigned
    const userTestAssignments = this.variantAssignments.get(userId) || new Map()
    if (userTestAssignments.has(testId)) {
      return userTestAssignments.get(testId)!
    }
    
    // Check if user matches target audience
    if (!this.matchesAudience(userProfile, test.targetAudience)) {
      return null
    }
    
    // Check exclusion criteria
    if (test.exclusionCriteria && this.matchesExclusion(userProfile, test.exclusionCriteria)) {
      return null
    }
    
    // Check traffic allocation
    if (Math.random() > test.trafficAllocation.rolloutPercentage / 100) {
      return null
    }
    
    // Assign variant based on strategy
    const variantId = this.selectVariant(test, userId, userProfile)
    
    // Record assignment
    userTestAssignments.set(testId, variantId)
    this.variantAssignments.set(userId, userTestAssignments)
    
    // Create user experiment record
    const userExperiment: UserExperiment = {
      userId,
      testId,
      variantId,
      assignmentTime: new Date(),
      exposures: [],
      conversions: [],
      customEvents: [],
      userContext: {
        userProfile,
        sessionInfo,
        deviceInfo
      }
    }
    
    const userExperiments = this.userExperiments.get(userId) || []
    userExperiments.push(userExperiment)
    this.userExperiments.set(userId, userExperiments)
    
    // Update variant exposure count
    const variant = test.variants.find(v => v.variantId === variantId)
    if (variant) {
      variant.exposures++
    }
    
    return variantId
  }
  
  // Track exposure event
  async trackExposure(
    testId: string,
    userId: string,
    context?: Record<string, any>
  ): Promise<void> {
    const userExperiments = this.userExperiments.get(userId) || []
    const experiment = userExperiments.find(e => e.testId === testId)
    
    if (!experiment) {
      return
    }
    
    const exposureEvent: ExposureEvent = {
      eventId: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      context: context || {}
    }
    
    experiment.exposures.push(exposureEvent)
  }
  
  // Track conversion event
  async trackConversion(
    testId: string,
    userId: string,
    goalId: string,
    value?: number,
    properties?: Record<string, any>
  ): Promise<void> {
    const userExperiments = this.userExperiments.get(userId) || []
    const experiment = userExperiments.find(e => e.testId === testId)
    
    if (!experiment) {
      return
    }
    
    const conversionEvent: ConversionEvent = {
      eventId: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      goalId,
      timestamp: new Date(),
      value,
      properties: properties || {}
    }
    
    experiment.conversions.push(conversionEvent)
    
    // Update variant conversion count
    const test = this.tests.get(testId)
    if (test) {
      const variant = test.variants.find(v => v.variantId === experiment.variantId)
      if (variant) {
        variant.conversions++
      }
    }
  }
  
  // Track custom metric
  async trackMetric(
    testId: string,
    userId: string,
    metricName: string,
    value: number,
    properties?: Record<string, any>
  ): Promise<void> {
    const test = this.tests.get(testId)
    if (!test) return
    
    const userExperiments = this.userExperiments.get(userId) || []
    const experiment = userExperiments.find(e => e.testId === testId)
    if (!experiment) return
    
    // Find variant and update metrics
    const variant = test.variants.find(v => v.variantId === experiment.variantId)
    if (!variant) return
    
    // Update variant metrics
    this.updateVariantMetric(variant, metricName, value)
    
    // Track as custom event
    const customEvent: CustomEvent = {
      eventId: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'metric',
      timestamp: new Date(),
      properties: {
        metricName,
        value,
        ...properties
      }
    }
    
    experiment.customEvents.push(customEvent)
  }
  
  // Analyze test results
  async analyzeTest(testId: string): Promise<ABTestResults | null> {
    const test = this.tests.get(testId)
    if (!test) return null
    
    // Check if we have enough data
    const totalExposures = test.variants.reduce((sum, v) => sum + v.exposures, 0)
    if (totalExposures < test.minimumSampleSize) {
      return {
        testId,
        status: 'insufficient_data',
        confidence: 0,
        pValue: 1,
        effectSize: 0,
        variantComparisons: [],
        goalResults: [],
        statisticalAnalysis: this.createBasicStatisticalAnalysis(),
        recommendations: [],
        analysisDate: new Date(),
        sampleSize: totalExposures,
        testDuration: test.startDate ? Date.now() - test.startDate.getTime() : 0
      }
    }
    
    // Perform statistical analysis
    const variantComparisons = this.performVariantComparisons(test)
    const goalResults = this.analyzeGoals(test, variantComparisons)
    const statisticalAnalysis = this.performStatisticalAnalysis(test, variantComparisons)
    
    // Determine overall result
    const primaryGoalResult = goalResults.find(r => r.goalId === test.primaryGoal.goalId)
    const winningVariant = this.determineWinner(test, variantComparisons, goalResults)
    
    const results: ABTestResults = {
      testId,
      status: this.determineTestStatus(test, variantComparisons, goalResults),
      winningVariant,
      confidence: primaryGoalResult?.confidence || 0,
      pValue: Math.min(...variantComparisons.map(c => c.pValue)),
      effectSize: Math.max(...variantComparisons.map(c => Math.abs(c.cohensD))),
      variantComparisons,
      goalResults,
      statisticalAnalysis,
      recommendations: this.generateRecommendations(test, variantComparisons, goalResults),
      analysisDate: new Date(),
      sampleSize: totalExposures,
      testDuration: test.startDate ? Date.now() - test.startDate.getTime() : 0
    }
    
    test.results = results
    test.updatedAt = new Date()
    
    return results
  }
  
  // Helper methods
  private initializeVariantMetrics(): VariantMetrics {
    const createEmptyMetric = (): MetricData => ({
      values: [],
      count: 0,
      sum: 0,
      mean: 0,
      variance: 0,
      standardDeviation: 0,
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      timeSeriesData: [],
      lastUpdated: new Date()
    })
    
    return {
      responseTime: createEmptyMetric(),
      qualityScore: createEmptyMetric(),
      userSatisfaction: createEmptyMetric(),
      errorRate: createEmptyMetric(),
      cost: createEmptyMetric(),
      customMetrics: new Map()
    }
  }
  
  private matchesAudience(userProfile: UserProfile, audience: AudienceSegment): boolean {
    return audience.criteria.every(criterion => 
      this.evaluateCriteria(userProfile, criterion)
    )
  }
  
  private matchesExclusion(userProfile: UserProfile, exclusions: ExclusionCriteria[]): boolean {
    return exclusions.some(exclusion => 
      exclusion.criteria.every(criterion => 
        this.evaluateCriteria(userProfile, criterion)
      )
    )
  }
  
  private evaluateCriteria(userProfile: UserProfile, criterion: SegmentCriteria): boolean {
    const value = this.getNestedValue(userProfile, criterion.field)
    
    switch (criterion.operator) {
      case 'equals':
        return value === criterion.value
      case 'not_equals':
        return value !== criterion.value
      case 'in':
        return Array.isArray(criterion.value) && criterion.value.includes(value)
      case 'not_in':
        return Array.isArray(criterion.value) && !criterion.value.includes(value)
      case 'contains':
        return typeof value === 'string' && value.includes(criterion.value)
      case 'greater_than':
        return typeof value === 'number' && value > criterion.value
      case 'less_than':
        return typeof value === 'number' && value < criterion.value
      case 'exists':
        return value !== undefined && value !== null
      default:
        return false
    }
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
  
  private selectVariant(test: ABTest, userId: string, userProfile: UserProfile): string {
    switch (test.trafficAllocation.strategy) {
      case 'equal':
        return this.selectEqualWeightVariant(test, userId)
      case 'weighted':
        return this.selectWeightedVariant(test, userId)
      case 'adaptive':
        return this.selectAdaptiveVariant(test, userId)
      case 'bandit':
        return this.selectBanditVariant(test, userId)
      default:
        return this.selectEqualWeightVariant(test, userId)
    }
  }
  
  private selectEqualWeightVariant(test: ABTest, userId: string): string {
    // Use consistent hashing for deterministic assignment
    const hash = this.hashUserId(userId + test.testId)
    const activeVariants = test.variants.filter(v => v.isActive)
    const index = hash % activeVariants.length
    return activeVariants[index].variantId
  }
  
  private selectWeightedVariant(test: ABTest, userId: string): string {
    const hash = this.hashUserId(userId + test.testId)
    const random = (hash % 10000) / 10000 // 0-1
    
    let cumulativeWeight = 0
    for (const variant of test.variants.filter(v => v.isActive)) {
      cumulativeWeight += variant.trafficWeight
      if (random < cumulativeWeight) {
        return variant.variantId
      }
    }
    
    // Fallback to first active variant
    return test.variants.find(v => v.isActive)?.variantId || test.variants[0].variantId
  }
  
  private selectAdaptiveVariant(test: ABTest, userId: string): string {
    // Thompson Sampling for adaptive selection
    const activeVariants = test.variants.filter(v => v.isActive)
    
    // Calculate success probabilities using Beta distribution
    const probabilities = activeVariants.map(variant => {
      const successes = variant.conversions
      const failures = variant.exposures - variant.conversions
      
      // Beta(1,1) prior, updated with observations
      const alpha = 1 + successes
      const beta = 1 + failures
      
      // Sample from Beta distribution (simplified)
      return this.sampleBeta(alpha, beta)
    })
    
    // Select variant with highest sampled probability
    const maxIndex = probabilities.indexOf(Math.max(...probabilities))
    return activeVariants[maxIndex].variantId
  }
  
  private selectBanditVariant(test: ABTest, userId: string): string {
    // Upper Confidence Bound (UCB1) algorithm
    const activeVariants = test.variants.filter(v => v.isActive)
    const totalExposures = activeVariants.reduce((sum, v) => sum + v.exposures, 0)
    
    if (totalExposures === 0) {
      // No data yet, select randomly
      return this.selectEqualWeightVariant(test, userId)
    }
    
    const ucbValues = activeVariants.map(variant => {
      if (variant.exposures === 0) {
        return Infinity // Explore unexplored variants first
      }
      
      const conversionRate = variant.conversions / variant.exposures
      const exploration = Math.sqrt((2 * Math.log(totalExposures)) / variant.exposures)
      
      return conversionRate + exploration
    })
    
    const maxIndex = ucbValues.indexOf(Math.max(...ucbValues))
    return activeVariants[maxIndex].variantId
  }
  
  private hashUserId(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
  
  private sampleBeta(alpha: number, beta: number): number {
    // Simplified Beta distribution sampling
    const x = Math.random()
    return Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1)
  }
  
  private updateVariantMetric(variant: TestVariant, metricName: string, value: number): void {
    let metric: MetricData
    
    if (metricName in variant.metrics) {
      metric = variant.metrics[metricName as keyof VariantMetrics] as MetricData
    } else {
      metric = {
        values: [],
        count: 0,
        sum: 0,
        mean: 0,
        variance: 0,
        standardDeviation: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        timeSeriesData: [],
        lastUpdated: new Date()
      }
      variant.metrics.customMetrics.set(metricName, metric)
    }
    
    // Update values
    metric.values.push(value)
    metric.count++
    metric.sum += value
    metric.mean = metric.sum / metric.count
    
    // Update variance and standard deviation
    const squaredDiffs = metric.values.map(v => Math.pow(v - metric.mean, 2))
    metric.variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / metric.count
    metric.standardDeviation = Math.sqrt(metric.variance)
    
    // Update percentiles
    const sorted = [...metric.values].sort((a, b) => a - b)
    metric.p50 = this.percentile(sorted, 50)
    metric.p90 = this.percentile(sorted, 90)
    metric.p95 = this.percentile(sorted, 95)
    metric.p99 = this.percentile(sorted, 99)
    
    // Add time series point
    metric.timeSeriesData.push({
      timestamp: new Date(),
      value,
      count: metric.count
    })
    
    // Keep only last 1000 time series points
    if (metric.timeSeriesData.length > 1000) {
      metric.timeSeriesData.shift()
    }
    
    metric.lastUpdated = new Date()
  }
  
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0
    
    const index = (percentile / 100) * (sortedArray.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) {
      return sortedArray[lower]
    }
    
    const weight = index - lower
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
  }
  
  private performVariantComparisons(test: ABTest): VariantComparison[] {
    const comparisons: VariantComparison[] = []
    const controlVariant = test.variants.find(v => v.isControl)
    
    if (!controlVariant) return comparisons
    
    // Compare each treatment variant against control
    for (const variant of test.variants.filter(v => !v.isControl)) {
      // Compare conversion rates
      const comparison = this.compareConversionRates(controlVariant, variant)
      comparisons.push(comparison)
    }
    
    return comparisons
  }
  
  private compareConversionRates(variantA: TestVariant, variantB: TestVariant): VariantComparison {
    const rateA = variantA.exposures > 0 ? variantA.conversions / variantA.exposures : 0
    const rateB = variantB.exposures > 0 ? variantB.conversions / variantB.exposures : 0
    
    const difference = rateB - rateA
    const percentageChange = rateA > 0 ? (difference / rateA) * 100 : 0
    
    // Perform z-test for proportions
    const { pValue, confidenceInterval, zScore } = this.zTestProportions(
      variantA.conversions, variantA.exposures,
      variantB.conversions, variantB.exposures
    )
    
    // Calculate effect sizes
    const cohensD = this.calculateCohensD(rateA, rateB, variantA.exposures, variantB.exposures)
    const hedgesG = cohensD * (1 - (3 / (4 * (variantA.exposures + variantB.exposures) - 9)))
    
    return {
      variantA: variantA.variantId,
      variantB: variantB.variantId,
      metric: 'conversion_rate',
      meanA: rateA,
      meanB: rateB,
      difference,
      percentageChange,
      confidenceInterval,
      pValue,
      isSignificant: pValue < 0.05,
      cohensD,
      hedgesG,
      isPracticallySignificant: Math.abs(percentageChange) > 5, // 5% threshold
      practicalSignificanceThreshold: 5
    }
  }
  
  private zTestProportions(
    x1: number, n1: number,
    x2: number, n2: number
  ): { pValue: number; confidenceInterval: [number, number]; zScore: number } {
    const p1 = x1 / n1
    const p2 = x2 / n2
    const pPool = (x1 + x2) / (n1 + n2)
    
    const se = Math.sqrt(pPool * (1 - pPool) * (1/n1 + 1/n2))
    const zScore = (p2 - p1) / se
    
    // Two-tailed p-value
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)))
    
    // 95% confidence interval for difference
    const seDiff = Math.sqrt((p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2))
    const margin = 1.96 * seDiff
    const confidenceInterval: [number, number] = [
      (p2 - p1) - margin,
      (p2 - p1) + margin
    ]
    
    return { pValue, confidenceInterval, zScore }
  }
  
  private calculateCohensD(mean1: number, mean2: number, n1: number, n2: number): number {
    // For proportions, use the pooled standard deviation
    const p1 = mean1
    const p2 = mean2
    const pooledSD = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / 2)
    
    return pooledSD > 0 ? (p2 - p1) / pooledSD : 0
  }
  
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)))
  }
  
  private erf(x: number): number {
    // Approximation of error function
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
  
  private analyzeGoals(test: ABTest, comparisons: VariantComparison[]): GoalResult[] {
    const results: GoalResult[] = []
    
    // Analyze primary goal
    const primaryResult = this.analyzeGoal(test.primaryGoal, comparisons)
    results.push(primaryResult)
    
    // Analyze secondary goals
    for (const goal of test.secondaryGoals) {
      const result = this.analyzeGoal(goal, comparisons)
      results.push(result)
    }
    
    return results
  }
  
  private analyzeGoal(goal: TestGoal, comparisons: VariantComparison[]): GoalResult {
    // Find relevant comparison for this goal
    const comparison = comparisons.find(c => c.metric === goal.name || c.metric === 'conversion_rate')
    
    if (!comparison) {
      return {
        goalId: goal.goalId,
        status: 'inconclusive',
        actualEffect: 0,
        expectedEffect: goal.minimumDetectableEffect,
        confidence: 0,
        bestVariant: '',
        improvement: 0,
        testStatistic: 0,
        criticalValue: 1.96 // 95% confidence
      }
    }
    
    const actualEffect = Math.abs(comparison.percentageChange)
    const isSignificant = comparison.isSignificant
    const meetsMinimumEffect = actualEffect >= goal.minimumDetectableEffect
    
    let status: GoalResult['status'] = 'inconclusive'
    if (isSignificant && meetsMinimumEffect) {
      status = 'met'
    } else if (isSignificant && !meetsMinimumEffect) {
      status = 'not_met'
    }
    
    return {
      goalId: goal.goalId,
      status,
      actualEffect,
      expectedEffect: goal.minimumDetectableEffect,
      confidence: 1 - comparison.pValue,
      bestVariant: comparison.meanB > comparison.meanA ? comparison.variantB : comparison.variantA,
      improvement: comparison.percentageChange,
      testStatistic: 0, // Would be calculated based on test type
      criticalValue: 1.96
    }
  }
  
  private performStatisticalAnalysis(test: ABTest, comparisons: VariantComparison[]): StatisticalAnalysis {
    return {
      method: test.statisticalConfig.method,
      assumptions: this.checkAssumptions(test),
      powerAnalysis: this.performPowerAnalysis(test, comparisons),
      dataQuality: this.assessDataQuality(test),
      biasAssessment: this.assessBias(test)
    }
  }
  
  private checkAssumptions(test: ABTest): AssumptionCheck[] {
    const checks: AssumptionCheck[] = []
    
    // Check sample size adequacy
    const totalSample = test.variants.reduce((sum, v) => sum + v.exposures, 0)
    checks.push({
      assumption: 'Adequate Sample Size',
      test: 'Minimum Sample Size Check',
      result: totalSample >= test.minimumSampleSize ? 'passed' : 'failed',
      details: `Total sample: ${totalSample}, Required: ${test.minimumSampleSize}`
    })
    
    // Check independence
    checks.push({
      assumption: 'Independence',
      test: 'User Assignment Check',
      result: 'passed', // Assume proper randomization
      details: 'Users randomly assigned to variants'
    })
    
    return checks
  }
  
  private performPowerAnalysis(test: ABTest, comparisons: VariantComparison[]): PowerAnalysis {
    const totalSample = test.variants.reduce((sum, v) => sum + v.exposures, 0)
    const primaryComparison = comparisons[0]
    
    return {
      observedPower: this.calculateObservedPower(primaryComparison, totalSample),
      minimumDetectableEffect: test.primaryGoal.minimumDetectableEffect,
      requiredSampleSize: this.calculateRequiredSampleSize(test.primaryGoal),
      actualSampleSize: totalSample,
      powerCurve: [] // Would generate power curve points
    }
  }
  
  private calculateObservedPower(comparison: VariantComparison, sampleSize: number): number {
    // Simplified power calculation
    const effectSize = Math.abs(comparison.cohensD)
    const alpha = 0.05
    
    // Power approximation based on effect size and sample size
    const ncp = effectSize * Math.sqrt(sampleSize / 2) // Non-centrality parameter
    
    // Simplified power calculation (would use more sophisticated method in practice)
    return Math.min(0.99, Math.max(0.05, 1 - this.normalCDF(1.96 - ncp)))
  }
  
  private calculateRequiredSampleSize(goal: TestGoal): number {
    // Simplified sample size calculation for proportions
    const alpha = 1 - goal.confidenceLevel
    const beta = 1 - goal.statisticalPower
    const effect = goal.minimumDetectableEffect / 100
    const baseline = goal.expectedBaseline || 0.1
    
    const za = 1.96 // z-score for alpha = 0.05
    const zb = 0.84 // z-score for beta = 0.2 (power = 0.8)
    
    const p1 = baseline
    const p2 = baseline + effect
    const pBar = (p1 + p2) / 2
    
    const numerator = Math.pow(za * Math.sqrt(2 * pBar * (1 - pBar)) + zb * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2)
    const denominator = Math.pow(p2 - p1, 2)
    
    return Math.ceil(numerator / denominator)
  }
  
  private assessDataQuality(test: ABTest): DataQualityMetrics {
    const totalExposures = test.variants.reduce((sum, v) => sum + v.exposures, 0)
    const totalConversions = test.variants.reduce((sum, v) => sum + v.conversions, 0)
    
    return {
      completeness: totalExposures > 0 ? 1.0 : 0.0, // Simplified
      consistency: 1.0, // Assume consistent data collection
      timeliness: 1.0, // Assume real-time data
      validity: totalConversions <= totalExposures ? 1.0 : 0.8,
      issues: []
    }
  }
  
  private assessBias(test: ABTest): BiasAssessment {
    return {
      selectionBias: { detected: false, severity: 'low', evidence: [], mitigation: [] },
      survivorshipBias: { detected: false, severity: 'low', evidence: [], mitigation: [] },
      confirmationBias: { detected: false, severity: 'low', evidence: [], mitigation: [] },
      noveltyEffect: { detected: false, severity: 'low', evidence: [], mitigation: [] },
      seasonalityBias: { detected: false, severity: 'low', evidence: [], mitigation: [] }
    }
  }
  
  private determineTestStatus(
    test: ABTest,
    comparisons: VariantComparison[],
    goalResults: GoalResult[]
  ): ABTestResults['status'] {
    const primaryGoalResult = goalResults.find(r => r.goalId === test.primaryGoal.goalId)
    const primaryComparison = comparisons[0]
    
    if (!primaryGoalResult || !primaryComparison) {
      return 'insufficient_data'
    }
    
    if (primaryComparison.isSignificant) {
      return 'significant'
    }
    
    return 'inconclusive'
  }
  
  private determineWinner(
    test: ABTest,
    comparisons: VariantComparison[],
    goalResults: GoalResult[]
  ): string | undefined {
    const primaryGoalResult = goalResults.find(r => r.goalId === test.primaryGoal.goalId)
    
    if (primaryGoalResult && primaryGoalResult.status === 'met') {
      return primaryGoalResult.bestVariant
    }
    
    return undefined
  }
  
  private generateRecommendations(
    test: ABTest,
    comparisons: VariantComparison[],
    goalResults: GoalResult[]
  ): TestRecommendation[] {
    const recommendations: TestRecommendation[] = []
    
    const primaryGoalResult = goalResults.find(r => r.goalId === test.primaryGoal.goalId)
    const primaryComparison = comparisons[0]
    
    if (primaryGoalResult && primaryComparison) {
      if (primaryGoalResult.status === 'met' && primaryComparison.isSignificant) {
        recommendations.push({
          type: 'launch',
          priority: 'high',
          title: 'Launch Winning Variant',
          description: `Variant ${primaryGoalResult.bestVariant} shows significant improvement`,
          reasoning: [
            `${primaryGoalResult.improvement.toFixed(2)}% improvement in primary goal`,
            `Statistical significance achieved (p=${primaryComparison.pValue.toFixed(4)})`,
            `Effect size: ${primaryComparison.cohensD.toFixed(3)}`
          ],
          suggestedActions: [
            {
              action: 'Full rollout to 100% of users',
              description: 'Gradually ramp up traffic to winning variant',
              effort: 'low',
              timeline: '1-2 weeks',
              prerequisites: ['Monitoring setup', 'Rollback plan']
            }
          ],
          estimatedImpact: {
            metric: test.primaryGoal.name,
            currentValue: primaryComparison.meanA,
            projectedValue: primaryComparison.meanB,
            improvement: primaryGoalResult.improvement,
            confidence: primaryGoalResult.confidence
          },
          risks: [
            {
              risk: 'Novelty effect wearing off',
              probability: 0.3,
              impact: 'medium',
              mitigation: 'Monitor performance for 30 days post-launch'
            }
          ],
          confidence: primaryGoalResult.confidence
        })
      } else {
        recommendations.push({
          type: 'continue',
          priority: 'medium',
          title: 'Continue Test for More Data',
          description: 'Results are not yet conclusive',
          reasoning: [
            'Statistical significance not achieved',
            `Current effect size: ${primaryComparison.cohensD.toFixed(3)}`,
            'More data needed for reliable conclusion'
          ],
          suggestedActions: [
            {
              action: 'Extend test duration',
              description: 'Continue collecting data until statistical significance',
              effort: 'low',
              timeline: '2-4 weeks',
              prerequisites: ['Monitor data quality']
            }
          ],
          estimatedImpact: {
            metric: test.primaryGoal.name,
            currentValue: primaryComparison.meanA,
            projectedValue: primaryComparison.meanB,
            improvement: primaryGoalResult.improvement,
            confidence: primaryGoalResult.confidence
          },
          risks: [],
          confidence: 0.7
        })
      }
    }
    
    return recommendations
  }
  
  private createBasicStatisticalAnalysis(): StatisticalAnalysis {
    return {
      method: 'frequentist',
      assumptions: [],
      powerAnalysis: {
        observedPower: 0,
        minimumDetectableEffect: 0,
        requiredSampleSize: 0,
        actualSampleSize: 0,
        powerCurve: []
      },
      dataQuality: {
        completeness: 0,
        consistency: 0,
        timeliness: 0,
        validity: 0,
        issues: []
      },
      biasAssessment: {
        selectionBias: { detected: false, severity: 'low', evidence: [], mitigation: [] },
        survivorshipBias: { detected: false, severity: 'low', evidence: [], mitigation: [] },
        confirmationBias: { detected: false, severity: 'low', evidence: [], mitigation: [] },
        noveltyEffect: { detected: false, severity: 'low', evidence: [], mitigation: [] },
        seasonalityBias: { detected: false, severity: 'low', evidence: [], mitigation: [] }
      }
    }
  }
  
  // Get all tests
  getTests(): ABTest[] {
    return Array.from(this.tests.values())
  }
  
  // Get test by ID
  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId)
  }
  
  // Get user assignments
  getUserAssignments(userId: string): Map<string, string> {
    return this.variantAssignments.get(userId) || new Map()
  }
  
  // Get user experiments
  getUserExperiments(userId: string): UserExperiment[] {
    return this.userExperiments.get(userId) || []
  }
}

// Export singleton instance
export const abTestingFramework = new ABTestingFramework()
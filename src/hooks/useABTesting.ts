'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  abTestingFramework,
  type ABTest,
  type ABTestResults,
  type TestVariant,
  type UserExperiment,
  type TestGoal,
  type AudienceSegment,
  type TrafficAllocation,
  type StatisticalConfiguration
} from '@/lib/ab-testing-framework'
import type { UserProfile } from '@/types'

interface ABTestingState {
  tests: ABTest[]
  activeTests: ABTest[]
  completedTests: ABTest[]
  userExperiments: UserExperiment[]
  isLoading: boolean
  error: string | null
}

// Main hook for A/B testing functionality
export function useABTesting() {
  const [state, setState] = useState<ABTestingState>({
    tests: [],
    activeTests: [],
    completedTests: [],
    userExperiments: [],
    isLoading: false,
    error: null
  })

  // Load all A/B test data
  const loadTestData = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const tests = abTestingFramework.getTests()
      const activeTests = tests.filter(t => t.status === 'running')
      const completedTests = tests.filter(t => t.status === 'completed')
      
      setState(prev => ({
        ...prev,
        tests,
        activeTests,
        completedTests,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load test data'
      }))
    }
  }, [])

  // Create a new A/B test
  const createTest = useCallback(async (config: {
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
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const test = await abTestingFramework.createTest(config)
      
      setState(prev => ({
        ...prev,
        tests: [...prev.tests, test],
        isLoading: false
      }))
      
      return test
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create test'
      }))
      return null
    }
  }, [])

  // Start an A/B test
  const startTest = useCallback(async (testId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const success = await abTestingFramework.startTest(testId)
      
      if (success) {
        loadTestData() // Refresh data
      } else {
        throw new Error('Failed to start test')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start test'
      }))
    }
  }, [loadTestData])

  // Analyze test results
  const analyzeTest = useCallback(async (testId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const results = await abTestingFramework.analyzeTest(testId)
      
      if (results) {
        loadTestData() // Refresh to show updated results
      }
      
      setState(prev => ({ ...prev, isLoading: false }))
      return results
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to analyze test'
      }))
      return null
    }
  }, [loadTestData])

  // Get user experiments
  const getUserExperiments = useCallback((userId: string) => {
    return abTestingFramework.getUserExperiments(userId)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Load data on mount
  useEffect(() => {
    loadTestData()
  }, [loadTestData])

  return {
    // State
    tests: state.tests,
    activeTests: state.activeTests,
    completedTests: state.completedTests,
    userExperiments: state.userExperiments,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    createTest,
    startTest,
    analyzeTest,
    getUserExperiments,
    loadTestData,
    clearError
  }
}

// Hook for experiment assignment and tracking
export function useExperimentAssignment() {
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Assign user to experiment
  const assignToExperiment = useCallback(async (
    testId: string,
    userId: string,
    userProfile: UserProfile,
    sessionInfo: {
      sessionId: string
      startTime: Date
      referrer?: string
      userAgent: string
      initialLandingPage: string
    },
    deviceInfo: {
      deviceType: 'desktop' | 'mobile' | 'tablet'
      operatingSystem: string
      browser: string
      screenResolution?: string
      timezone: string
    }
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const variantId = await abTestingFramework.assignUserToVariant(
        testId,
        userId,
        userProfile,
        sessionInfo,
        deviceInfo
      )
      
      if (variantId) {
        setAssignments(prev => new Map(prev.set(testId, variantId)))
      }
      
      setIsLoading(false)
      return variantId
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to assign experiment')
      setIsLoading(false)
      return null
    }
  }, [])

  // Track exposure event
  const trackExposure = useCallback(async (
    testId: string,
    userId: string,
    context?: Record<string, any>
  ) => {
    try {
      await abTestingFramework.trackExposure(testId, userId, context)
    } catch (error) {
      console.error('Failed to track exposure:', error)
    }
  }, [])

  // Track conversion event
  const trackConversion = useCallback(async (
    testId: string,
    userId: string,
    goalId: string,
    value?: number,
    properties?: Record<string, any>
  ) => {
    try {
      await abTestingFramework.trackConversion(testId, userId, goalId, value, properties)
    } catch (error) {
      console.error('Failed to track conversion:', error)
    }
  }, [])

  // Track custom metric
  const trackMetric = useCallback(async (
    testId: string,
    userId: string,
    metricName: string,
    value: number,
    properties?: Record<string, any>
  ) => {
    try {
      await abTestingFramework.trackMetric(testId, userId, metricName, value, properties)
    } catch (error) {
      console.error('Failed to track metric:', error)
    }
  }, [])

  // Get user's variant assignment
  const getUserVariant = useCallback((testId: string): string | null => {
    return assignments.get(testId) || null
  }, [assignments])

  // Load existing assignments
  const loadAssignments = useCallback((userId: string) => {
    const userAssignments = abTestingFramework.getUserAssignments(userId)
    setAssignments(userAssignments)
  }, [])

  return {
    // State
    assignments,
    isLoading,
    error,
    
    // Actions
    assignToExperiment,
    trackExposure,
    trackConversion,
    trackMetric,
    getUserVariant,
    loadAssignments,
    clearError: () => setError(null)
  }
}

// Hook for test analytics and insights
export function useTestAnalytics() {
  const { tests, activeTests, completedTests } = useABTesting()
  
  // Get test performance overview
  const getTestOverview = useCallback(() => {
    const totalTests = tests.length
    const runningTests = activeTests.length
    const completedTestsCount = completedTests.length
    
    const successfulTests = completedTests.filter(test => 
      test.results?.status === 'significant'
    ).length
    
    const inconclusiveTests = completedTests.filter(test => 
      test.results?.status === 'inconclusive'
    ).length
    
    const successRate = completedTestsCount > 0 ? successfulTests / completedTestsCount : 0
    
    return {
      totalTests,
      runningTests,
      completedTestsCount,
      successfulTests,
      inconclusiveTests,
      successRate
    }
  }, [tests, activeTests, completedTests])

  // Get test performance metrics
  const getTestMetrics = useCallback((testId: string) => {
    const test = tests.find(t => t.testId === testId)
    if (!test) return null
    
    const totalExposures = test.variants.reduce((sum, v) => sum + v.exposures, 0)
    const totalConversions = test.variants.reduce((sum, v) => sum + v.conversions, 0)
    const overallConversionRate = totalExposures > 0 ? totalConversions / totalExposures : 0
    
    const variantMetrics = test.variants.map(variant => ({
      variantId: variant.variantId,
      name: variant.name,
      exposures: variant.exposures,
      conversions: variant.conversions,
      conversionRate: variant.exposures > 0 ? variant.conversions / variant.exposures : 0,
      trafficShare: totalExposures > 0 ? variant.exposures / totalExposures : 0
    }))
    
    return {
      testId,
      totalExposures,
      totalConversions,
      overallConversionRate,
      variantMetrics,
      status: test.status,
      duration: test.startDate ? Date.now() - test.startDate.getTime() : 0,
      results: test.results
    }
  }, [tests])

  // Get statistical significance trends
  const getSignificanceTrends = useCallback((testId: string) => {
    const test = tests.find(t => t.testId === testId)
    if (!test?.results) return null
    
    return {
      currentPValue: test.results.pValue,
      currentConfidence: test.results.confidence,
      effectSize: test.results.effectSize,
      isSignificant: test.results.status === 'significant',
      sampleSize: test.results.sampleSize,
      requiredSampleSize: test.results.statisticalAnalysis.powerAnalysis.requiredSampleSize,
      progress: test.results.sampleSize / test.results.statisticalAnalysis.powerAnalysis.requiredSampleSize
    }
  }, [tests])

  // Get test recommendations summary
  const getRecommendationsSummary = useCallback(() => {
    const allRecommendations = tests
      .filter(test => test.results?.recommendations)
      .flatMap(test => test.results!.recommendations)
    
    const byType = allRecommendations.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const byPriority = allRecommendations.reduce((acc, rec) => {
      acc[rec.priority] = (acc[rec.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: allRecommendations.length,
      byType,
      byPriority,
      highPriorityCount: byPriority.high || 0
    }
  }, [tests])

  // Calculate ROI and business impact
  const calculateBusinessImpact = useCallback((testId: string) => {
    const test = tests.find(t => t.testId === testId)
    if (!test?.results?.recommendations) return null
    
    const winningRecommendation = test.results.recommendations.find(r => r.type === 'launch')
    if (!winningRecommendation?.estimatedImpact) return null
    
    const impact = winningRecommendation.estimatedImpact
    const improvement = impact.improvement
    const confidence = impact.confidence
    
    // Calculate annualized impact (simplified)
    const testDuration = test.results.testDuration
    const annualMultiplier = (365 * 24 * 60 * 60 * 1000) / testDuration // Convert to yearly
    
    return {
      relativeImprovement: improvement,
      confidence,
      estimatedAnnualImpact: improvement * annualMultiplier,
      revenueImpact: impact.revenueImpact,
      costImpact: impact.costImpact,
      netBenefit: impact.netBenefit
    }
  }, [tests])

  return {
    getTestOverview,
    getTestMetrics,
    getSignificanceTrends,
    getRecommendationsSummary,
    calculateBusinessImpact
  }
}

// Hook for creating quick A/B tests with smart defaults
export function useQuickABTest() {
  const { createTest, startTest } = useABTesting()
  
  // Create a simple A/B test with smart defaults
  const createQuickTest = useCallback(async (config: {
    name: string
    description: string
    controlModelId: string
    treatmentModelId: string
    useCase: string
    targetAudience?: Partial<AudienceSegment>
    duration?: number // days
    minimumSampleSize?: number
  }) => {
    const defaultAudience: AudienceSegment = {
      segmentId: 'all_users',
      name: 'All Users',
      criteria: [
        {
          field: 'userProfile',
          operator: 'exists',
          value: true
        }
      ],
      ...config.targetAudience
    }
    
    const primaryGoal: TestGoal = {
      goalId: 'conversion_rate',
      name: 'Conversion Rate',
      description: 'Primary conversion metric for the test',
      metricType: 'conversion',
      direction: 'increase',
      minimumDetectableEffect: 5, // 5% minimum improvement
      confidenceLevel: 0.95,
      statisticalPower: 0.8,
      weight: 1.0
    }
    
    const variants: Omit<TestVariant, 'exposures' | 'conversions' | 'metrics'>[] = [
      {
        variantId: 'control',
        name: 'Control',
        description: 'Current model configuration',
        modelId: config.controlModelId,
        trafficWeight: 0.5,
        isControl: true,
        isActive: true
      },
      {
        variantId: 'treatment',
        name: 'Treatment',
        description: 'New model configuration',
        modelId: config.treatmentModelId,
        trafficWeight: 0.5,
        isControl: false,
        isActive: true
      }
    ]
    
    const trafficAllocation: TrafficAllocation = {
      strategy: 'equal',
      rolloutPercentage: 100,
      rampUpDuration: 0
    }
    
    const testConfig = {
      name: config.name,
      description: config.description,
      testType: 'simple_ab' as const,
      variants,
      trafficAllocation,
      targetAudience: defaultAudience,
      primaryGoal,
      plannedDuration: (config.duration || 14) * 24 * 60 * 60 * 1000, // Convert days to ms
      minimumSampleSize: config.minimumSampleSize || 1000,
      createdBy: 'system',
      category: config.useCase,
      tags: ['quick_test', config.useCase]
    }
    
    return await createTest(testConfig)
  }, [createTest])
  
  // Create and immediately start a test
  const createAndStartTest = useCallback(async (config: Parameters<typeof createQuickTest>[0]) => {
    const test = await createQuickTest(config)
    if (test) {
      await startTest(test.testId)
      return test
    }
    return null
  }, [createQuickTest, startTest])
  
  return {
    createQuickTest,
    createAndStartTest
  }
}

// Hook for multi-armed bandit optimization
export function useMultiArmedBandit() {
  const { tests } = useABTesting()
  
  // Get bandit test performance
  const getBanditPerformance = useCallback((testId: string) => {
    const test = tests.find(t => t.testId === testId && t.testType === 'multi_armed_bandit')
    if (!test) return null
    
    const variants = test.variants.map(variant => {
      const conversionRate = variant.exposures > 0 ? variant.conversions / variant.exposures : 0
      const confidence = variant.exposures > 30 ? 
        Math.min(0.95, variant.exposures / 1000) : // Confidence grows with sample size
        variant.exposures / 100
      
      return {
        variantId: variant.variantId,
        name: variant.name,
        conversionRate,
        exposures: variant.exposures,
        conversions: variant.conversions,
        confidence,
        isWinning: false // Will be determined below
      }
    })
    
    // Determine current winner
    const bestVariant = variants.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    )
    
    bestVariant.isWinning = true
    
    return {
      testId,
      variants,
      currentWinner: bestVariant,
      explorationRate: test.trafficAllocation.explorationRate || 0.1,
      totalReward: variants.reduce((sum, v) => sum + v.conversions, 0)
    }
  }, [tests])
  
  // Get bandit recommendations
  const getBanditRecommendations = useCallback((testId: string) => {
    const performance = getBanditPerformance(testId)
    if (!performance) return []
    
    const recommendations = []
    
    // Check if exploration should be reduced
    const totalExposures = performance.variants.reduce((sum, v) => sum + v.exposures, 0)
    if (totalExposures > 5000 && performance.currentWinner.confidence > 0.8) {
      recommendations.push({
        type: 'reduce_exploration',
        message: 'Consider reducing exploration rate as winner is becoming clear',
        confidence: performance.currentWinner.confidence
      })
    }
    
    // Check for clear winner
    if (performance.currentWinner.confidence > 0.9 && totalExposures > 10000) {
      recommendations.push({
        type: 'declare_winner',
        message: `Variant ${performance.currentWinner.name} is clearly winning`,
        confidence: performance.currentWinner.confidence
      })
    }
    
    return recommendations
  }, [getBanditPerformance])
  
  return {
    getBanditPerformance,
    getBanditRecommendations
  }
}
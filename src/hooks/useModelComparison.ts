'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  modelComparisonEngine,
  type ModelTest,
  type TestResults,
  type OptimizationRecommendation,
  type BenchmarkResult,
  type ComparisonMetric,
  type UserSegment
} from '@/lib/model-comparison-engine'
import type { UserProfile } from '@/types'

interface ComparisonState {
  tests: ModelTest[]
  activeTests: ModelTest[]
  completedTests: ModelTest[]
  recommendations: OptimizationRecommendation[]
  isLoading: boolean
  error: string | null
}

// Main hook for model comparison functionality
export function useModelComparison() {
  const [state, setState] = useState<ComparisonState>({
    tests: [],
    activeTests: [],
    completedTests: [],
    recommendations: [],
    isLoading: false,
    error: null
  })

  // Load all data
  const loadData = useCallback(() => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const tests = modelComparisonEngine.getTests()
      const activeTests = tests.filter(t => t.status === 'running')
      const completedTests = tests.filter(t => t.status === 'completed')
      const recommendations = modelComparisonEngine.getOptimizationRecommendations()
      
      setState(prev => ({
        ...prev,
        tests,
        activeTests,
        completedTests,
        recommendations,
        isLoading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }, [])

  // Create new A/B test
  const createTest = useCallback(async (config: {
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
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const test = await modelComparisonEngine.createTest(config)
      
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

  // Start a test
  const startTest = useCallback(async (testId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const success = await modelComparisonEngine.startTest(testId)
      
      if (success) {
        loadData() // Refresh data
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
  }, [loadData])

  // Record test data
  const recordTestData = useCallback(async (
    testId: string,
    data: {
      userId: string
      model: string
      timestamp: Date
      metrics: Record<string, number>
      userProfile?: UserProfile
    }
  ) => {
    try {
      await modelComparisonEngine.recordTestData(testId, data)
    } catch (error) {
      console.error('Failed to record test data:', error)
    }
  }, [])

  // Analyze test
  const analyzeTest = useCallback(async (testId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const results = await modelComparisonEngine.analyzeTest(testId)
      
      if (results) {
        loadData() // Refresh data to show updated results
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
  }, [loadData])

  // Get test results
  const getTestResults = useCallback((testId: string): TestResults | null => {
    const test = state.tests.find(t => t.testId === testId)
    return test?.results || null
  }, [state.tests])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    // State
    tests: state.tests,
    activeTests: state.activeTests,
    completedTests: state.completedTests,
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    createTest,
    startTest,
    recordTestData,
    analyzeTest,
    getTestResults,
    loadData,
    clearError
  }
}

// Hook for A/B testing specific functionality
export function useABTesting() {
  const { 
    tests, 
    activeTests, 
    createTest, 
    startTest, 
    recordTestData, 
    analyzeTest 
  } = useModelComparison()

  // Create quick A/B test with common defaults
  const createQuickABTest = useCallback(async (
    name: string,
    modelA: string,
    modelB: string,
    useCase: string,
    primaryMetricName: string = 'response_time'
  ) => {
    const primaryMetric: ComparisonMetric = {
      metricId: primaryMetricName,
      name: primaryMetricName.replace('_', ' ').toUpperCase(),
      description: `Primary metric for ${primaryMetricName}`,
      type: primaryMetricName.includes('time') ? 'time' : 'score',
      direction: primaryMetricName.includes('time') ? 'lower_is_better' : 'higher_is_better',
      weight: 1.0,
      minimumDetectableEffect: 0.05
    }

    return await createTest({
      name,
      description: `A/B test comparing ${modelA} vs ${modelB} for ${useCase}`,
      modelA,
      modelB,
      useCase,
      trafficSplit: 0.5, // 50-50 split
      primaryMetric,
      minimumSampleSize: 1000,
      minimumDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
      maxDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
      confidenceLevel: 0.95
    })
  }, [createTest])

  // Auto-record test data for AI requests
  const trackAIRequest = useCallback(async (
    testId: string,
    userId: string,
    model: string,
    metrics: {
      responseTime?: number
      qualityScore?: number
      userSatisfaction?: number
      cost?: number
      errorRate?: number
    },
    userProfile?: UserProfile
  ) => {
    const timestamp = new Date()
    
    await recordTestData(testId, {
      userId,
      model,
      timestamp,
      metrics: {
        response_time: metrics.responseTime || 0,
        quality_score: metrics.qualityScore || 0,
        user_satisfaction: metrics.userSatisfaction || 0,
        cost: metrics.cost || 0,
        error_rate: metrics.errorRate || 0
      },
      userProfile
    })
  }, [recordTestData])

  // Get test summary
  const getTestSummary = useCallback(() => {
    const running = activeTests.length
    const total = tests.length
    const recentlyCompleted = tests.filter(t => 
      t.status === 'completed' && 
      t.completedAt && 
      Date.now() - t.completedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length

    return {
      running,
      total,
      recentlyCompleted,
      completionRate: total > 0 ? recentlyCompleted / total : 0
    }
  }, [tests, activeTests])

  return {
    // A/B testing specific data
    activeTests,
    testSummary: getTestSummary(),
    
    // A/B testing actions
    createQuickABTest,
    startTest,
    trackAIRequest,
    analyzeTest
  }
}

// Hook for optimization recommendations
export function useOptimizationRecommendations() {
  const { recommendations, loadData } = useModelComparison()

  // Filter recommendations by type
  const getRecommendationsByType = useCallback((type: OptimizationRecommendation['type']) => {
    return recommendations.filter(rec => rec.type === type)
  }, [recommendations])

  // Filter recommendations by priority
  const getRecommendationsByPriority = useCallback((priority: OptimizationRecommendation['priority']) => {
    return recommendations.filter(rec => rec.priority === priority)
  }, [recommendations])

  // Get actionable recommendations (high impact, low effort)
  const getActionableRecommendations = useCallback(() => {
    return recommendations.filter(rec => 
      rec.priority === 'high' && 
      rec.implementationEffort === 'low'
    )
  }, [recommendations])

  // Calculate potential impact
  const calculateTotalImpact = useCallback(() => {
    const totalImpact = recommendations.reduce((sum, rec) => {
      const avgImprovement = rec.expectedImpact.reduce((impSum, impact) => 
        impSum + impact.improvement, 0
      ) / rec.expectedImpact.length
      return sum + avgImprovement
    }, 0)

    return totalImpact
  }, [recommendations])

  return {
    // Recommendation data
    allRecommendations: recommendations,
    actionableRecommendations: getActionableRecommendations(),
    totalPotentialImpact: calculateTotalImpact(),
    
    // Filtering functions
    getRecommendationsByType,
    getRecommendationsByPriority,
    
    // Actions
    refreshRecommendations: loadData
  }
}

// Hook for benchmarking
export function useBenchmarking() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Run benchmark
  const runBenchmark = useCallback(async (
    modelId: string,
    useCase: string,
    baselineModel?: string
  ) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await modelComparisonEngine.runBenchmark(modelId, useCase, baselineModel)
      
      setBenchmarks(prev => [...prev, result])
      setIsLoading(false)
      
      return result
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to run benchmark')
      setIsLoading(false)
      return null
    }
  }, [])

  // Get benchmarks for model
  const getBenchmarksForModel = useCallback((modelId: string) => {
    return benchmarks.filter(b => b.modelId === modelId)
  }, [benchmarks])

  // Compare models
  const compareModels = useCallback((modelA: string, modelB: string, useCase: string) => {
    const benchmarkA = benchmarks.find(b => b.modelId === modelA && b.useCase === useCase)
    const benchmarkB = benchmarks.find(b => b.modelId === modelB && b.useCase === useCase)
    
    if (!benchmarkA || !benchmarkB) {
      return null
    }
    
    return {
      modelA,
      modelB,
      useCase,
      scoreA: benchmarkA.overallScore,
      scoreB: benchmarkB.overallScore,
      winner: benchmarkA.overallScore > benchmarkB.overallScore ? modelA : modelB,
      difference: Math.abs(benchmarkA.overallScore - benchmarkB.overallScore),
      metricComparisons: benchmarkA.metrics.map(metricA => {
        const metricB = benchmarkB.metrics.find(m => m.metricId === metricA.metricId)
        return {
          metricId: metricA.metricId,
          scoreA: metricA.score,
          scoreB: metricB?.score || 0,
          improvement: metricB ? ((metricB.score - metricA.score) / metricA.score) * 100 : 0
        }
      })
    }
  }, [benchmarks])

  return {
    // Benchmark data
    benchmarks,
    isLoading,
    error,
    
    // Actions
    runBenchmark,
    getBenchmarksForModel,
    compareModels
  }
}
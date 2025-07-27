import { NextRequest, NextResponse } from 'next/server'
import { 
  modelComparisonEngine,
  type ModelTest,
  type ComparisonMetric,
  type UserSegment
} from '@/lib/model-comparison-engine'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface ComparisonRequest {
  action: 'create_test' | 'start_test' | 'record_data' | 'analyze_test' | 'get_tests' | 'get_recommendations' | 'run_benchmark'
  
  // For create_test
  testConfig?: {
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
  }
  
  // For start_test, analyze_test
  testId?: string
  
  // For record_data
  testData?: {
    testId: string
    userId: string
    model: string
    timestamp: string
    metrics: Record<string, number>
    userProfile?: UserProfile
  }
  
  // For run_benchmark
  benchmarkConfig?: {
    modelId: string
    useCase: string
    baselineModel?: string
  }
}

interface ComparisonResponse {
  success: boolean
  action: string
  
  // Response data
  test?: ModelTest
  tests?: ModelTest[]
  results?: any
  recommendations?: any[]
  benchmark?: any
  
  metadata: {
    processingTime: number
    timestamp: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: ComparisonRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<ComparisonResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'create_test':
        response = await handleCreateTest(body)
        break
        
      case 'start_test':
        response = await handleStartTest(body)
        break
        
      case 'record_data':
        response = await handleRecordData(body)
        break
        
      case 'analyze_test':
        response = await handleAnalyzeTest(body)
        break
        
      case 'get_tests':
        response = await handleGetTests()
        break
        
      case 'get_recommendations':
        response = await handleGetRecommendations()
        break
        
      case 'run_benchmark':
        response = await handleRunBenchmark(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: ComparisonResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        processingTime,
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Model comparison API error:', error)
    return NextResponse.json(
      { error: 'Failed to process comparison request' },
      { status: 500 }
    )
  }
}

// Handle test creation
async function handleCreateTest(body: ComparisonRequest): Promise<Partial<ComparisonResponse>> {
  if (!body.testConfig) {
    throw new Error('Missing test configuration')
  }

  const test = await modelComparisonEngine.createTest(body.testConfig)
  
  return { test }
}

// Handle test start
async function handleStartTest(body: ComparisonRequest): Promise<Partial<ComparisonResponse>> {
  if (!body.testId) {
    throw new Error('Missing testId')
  }

  const success = await modelComparisonEngine.startTest(body.testId)
  
  if (!success) {
    throw new Error('Failed to start test')
  }
  
  const test = modelComparisonEngine.getTest(body.testId)
  
  return { test }
}

// Handle data recording
async function handleRecordData(body: ComparisonRequest): Promise<Partial<ComparisonResponse>> {
  if (!body.testData) {
    throw new Error('Missing test data')
  }

  await modelComparisonEngine.recordTestData(
    body.testData.testId,
    {
      userId: body.testData.userId,
      model: body.testData.model,
      timestamp: new Date(body.testData.timestamp),
      metrics: body.testData.metrics,
      userProfile: body.testData.userProfile
    }
  )
  
  return { success: true }
}

// Handle test analysis
async function handleAnalyzeTest(body: ComparisonRequest): Promise<Partial<ComparisonResponse>> {
  if (!body.testId) {
    throw new Error('Missing testId')
  }

  const results = await modelComparisonEngine.analyzeTest(body.testId)
  
  return { results }
}

// Handle get tests
async function handleGetTests(): Promise<Partial<ComparisonResponse>> {
  const tests = modelComparisonEngine.getTests()
  
  return { tests }
}

// Handle get recommendations
async function handleGetRecommendations(): Promise<Partial<ComparisonResponse>> {
  const recommendations = modelComparisonEngine.getOptimizationRecommendations()
  
  return { recommendations }
}

// Handle benchmark run
async function handleRunBenchmark(body: ComparisonRequest): Promise<Partial<ComparisonResponse>> {
  if (!body.benchmarkConfig) {
    throw new Error('Missing benchmark configuration')
  }

  const benchmark = await modelComparisonEngine.runBenchmark(
    body.benchmarkConfig.modelId,
    body.benchmarkConfig.useCase,
    body.benchmarkConfig.baselineModel
  )
  
  return { benchmark }
}

export async function GET() {
  return NextResponse.json({
    message: 'Model Comparison API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Model comparison and A/B testing operations',
        actions: [
          'create_test', 
          'start_test', 
          'record_data', 
          'analyze_test', 
          'get_tests', 
          'get_recommendations', 
          'run_benchmark'
        ]
      }
    },
    capabilities: [
      'A/B Testing',
      'Statistical Analysis',
      'Optimization Recommendations',
      'Performance Benchmarking',
      'Real-time Test Monitoring'
    ]
  })
}
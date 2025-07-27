import { NextRequest, NextResponse } from 'next/server'
import { 
  abTestingFramework,
  type ABTest,
  type TestVariant,
  type TestGoal,
  type AudienceSegment,
  type TrafficAllocation,
  type StatisticalConfiguration
} from '@/lib/ab-testing-framework'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface ABTestingRequest {
  action: 'create_test' | 'start_test' | 'assign_user' | 'track_exposure' | 'track_conversion' | 'track_metric' | 'analyze_test' | 'get_tests' | 'get_user_experiments'
  
  // For create_test
  testConfig?: {
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
  }
  
  // For start_test, analyze_test
  testId?: string
  
  // For assign_user
  assignmentConfig?: {
    testId: string
    userId: string
    userProfile: UserProfile
    sessionInfo: {
      sessionId: string
      startTime: string
      referrer?: string
      userAgent: string
      initialLandingPage: string
    }
    deviceInfo: {
      deviceType: 'desktop' | 'mobile' | 'tablet'
      operatingSystem: string
      browser: string
      screenResolution?: string
      timezone: string
    }
  }
  
  // For track_exposure
  exposureData?: {
    testId: string
    userId: string
    context?: Record<string, any>
  }
  
  // For track_conversion
  conversionData?: {
    testId: string
    userId: string
    goalId: string
    value?: number
    properties?: Record<string, any>
  }
  
  // For track_metric
  metricData?: {
    testId: string
    userId: string
    metricName: string
    value: number
    properties?: Record<string, any>
  }
  
  // For get_user_experiments
  userId?: string
}

interface ABTestingResponse {
  success: boolean
  action: string
  
  // Response data
  test?: ABTest
  tests?: ABTest[]
  variantId?: string
  results?: any
  userExperiments?: any[]
  
  metadata: {
    processingTime: number
    timestamp: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: ABTestingRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<ABTestingResponse> = {
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
        
      case 'assign_user':
        response = await handleAssignUser(body)
        break
        
      case 'track_exposure':
        response = await handleTrackExposure(body)
        break
        
      case 'track_conversion':
        response = await handleTrackConversion(body)
        break
        
      case 'track_metric':
        response = await handleTrackMetric(body)
        break
        
      case 'analyze_test':
        response = await handleAnalyzeTest(body)
        break
        
      case 'get_tests':
        response = await handleGetTests()
        break
        
      case 'get_user_experiments':
        response = await handleGetUserExperiments(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: ABTestingResponse = {
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
    console.error('A/B Testing API error:', error)
    return NextResponse.json(
      { error: 'Failed to process A/B testing request' },
      { status: 500 }
    )
  }
}

// Handle test creation
async function handleCreateTest(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.testConfig) {
    throw new Error('Missing test configuration')
  }

  const test = await abTestingFramework.createTest(body.testConfig)
  
  return { test }
}

// Handle test start
async function handleStartTest(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.testId) {
    throw new Error('Missing testId')
  }

  const success = await abTestingFramework.startTest(body.testId)
  
  if (!success) {
    throw new Error('Failed to start test')
  }
  
  const test = abTestingFramework.getTest(body.testId)
  
  return { test }
}

// Handle user assignment
async function handleAssignUser(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.assignmentConfig) {
    throw new Error('Missing assignment configuration')
  }

  const { testId, userId, userProfile, sessionInfo, deviceInfo } = body.assignmentConfig
  
  // Convert string date back to Date object
  const sessionInfoWithDate = {
    ...sessionInfo,
    startTime: new Date(sessionInfo.startTime)
  }
  
  const variantId = await abTestingFramework.assignUserToVariant(
    testId,
    userId,
    userProfile,
    sessionInfoWithDate,
    deviceInfo
  )
  
  return { variantId: variantId || undefined }
}

// Handle exposure tracking
async function handleTrackExposure(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.exposureData) {
    throw new Error('Missing exposure data')
  }

  const { testId, userId, context } = body.exposureData
  
  await abTestingFramework.trackExposure(testId, userId, context)
  
  return { success: true }
}

// Handle conversion tracking
async function handleTrackConversion(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.conversionData) {
    throw new Error('Missing conversion data')
  }

  const { testId, userId, goalId, value, properties } = body.conversionData
  
  await abTestingFramework.trackConversion(testId, userId, goalId, value, properties)
  
  return { success: true }
}

// Handle metric tracking
async function handleTrackMetric(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.metricData) {
    throw new Error('Missing metric data')
  }

  const { testId, userId, metricName, value, properties } = body.metricData
  
  await abTestingFramework.trackMetric(testId, userId, metricName, value, properties)
  
  return { success: true }
}

// Handle test analysis
async function handleAnalyzeTest(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.testId) {
    throw new Error('Missing testId')
  }

  const results = await abTestingFramework.analyzeTest(body.testId)
  
  return { results }
}

// Handle get tests
async function handleGetTests(): Promise<Partial<ABTestingResponse>> {
  const tests = abTestingFramework.getTests()
  
  return { tests }
}

// Handle get user experiments
async function handleGetUserExperiments(body: ABTestingRequest): Promise<Partial<ABTestingResponse>> {
  if (!body.userId) {
    throw new Error('Missing userId')
  }

  const userExperiments = abTestingFramework.getUserExperiments(body.userId)
  
  return { userExperiments }
}

export async function GET() {
  return NextResponse.json({
    message: 'A/B Testing Framework API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'A/B testing operations and analytics',
        actions: [
          'create_test',
          'start_test', 
          'assign_user',
          'track_exposure',
          'track_conversion',
          'track_metric',
          'analyze_test',
          'get_tests',
          'get_user_experiments'
        ]
      }
    },
    capabilities: [
      'A/B Test Creation & Management',
      'User Assignment & Segmentation',
      'Multi-Armed Bandit Testing',
      'Statistical Analysis',
      'Event Tracking',
      'Real-time Analytics',
      'Recommendation Engine'
    ],
    testTypes: [
      'simple_ab',
      'multivariate',
      'multi_armed_bandit',
      'sequential'
    ],
    statisticalMethods: [
      'frequentist',
      'bayesian',
      'bootstrap'
    ]
  })
}
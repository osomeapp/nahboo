import { NextRequest, NextResponse } from 'next/server'
import { modelPerformanceAnalytics, type ModelPerformanceMetrics } from '@/lib/model-performance-analytics'

export const maxDuration = 30

interface PerformanceAnalyticsRequest {
  action: 'get_dashboard' | 'track_request' | 'get_model_metrics' | 'optimize_routing' | 'compare_models'
  
  // For get_dashboard
  timeWindow?: number // milliseconds
  
  // For track_request
  trackingData?: {
    modelId: string
    useCase: string
    userId: string
    requestId: string
    startTime: number
    endTime: number
    responseTime: number
    tokenUsage: {
      prompt: number
      completion: number
      total: number
    }
    cost: number
    qualityScore?: number
    userSatisfaction?: number
    errorType?: string
    metadata?: Record<string, any>
  }
  
  // For get_model_metrics
  modelId?: string
  
  // For compare_models
  modelA?: string
  modelB?: string
  useCase?: string
}

interface PerformanceAnalyticsResponse {
  success: boolean
  action: string
  
  // Response data
  dashboard?: any
  metrics?: ModelPerformanceMetrics
  optimizationResult?: any
  comparisonResult?: any
  
  metadata: {
    processingTime: number
    timestamp: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: PerformanceAnalyticsRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<PerformanceAnalyticsResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'get_dashboard':
        response = await handleGetDashboard(body)
        break
        
      case 'track_request':
        response = await handleTrackRequest(body)
        break
        
      case 'get_model_metrics':
        response = await handleGetModelMetrics(body)
        break
        
      case 'optimize_routing':
        response = await handleOptimizeRouting(body)
        break
        
      case 'compare_models':
        response = await handleCompareModels(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: get_dashboard, track_request, get_model_metrics, optimize_routing, or compare_models' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: PerformanceAnalyticsResponse = {
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
    console.error('Performance analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to process performance analytics request' },
      { status: 500 }
    )
  }
}

// Get performance dashboard data
async function handleGetDashboard(body: PerformanceAnalyticsRequest): Promise<Partial<PerformanceAnalyticsResponse>> {
  const timeWindow = body.timeWindow || (24 * 60 * 60 * 1000) // Default to 24 hours
  
  const dashboard = await modelPerformanceAnalytics.getPerformanceDashboard(timeWindow)
  
  return { dashboard }
}

// Track a new request
async function handleTrackRequest(body: PerformanceAnalyticsRequest): Promise<Partial<PerformanceAnalyticsResponse>> {
  if (!body.trackingData) {
    throw new Error('Missing tracking data for request tracking')
  }

  await modelPerformanceAnalytics.trackRequest(body.trackingData)
  
  return { success: true }
}

// Get metrics for specific model
async function handleGetModelMetrics(body: PerformanceAnalyticsRequest): Promise<Partial<PerformanceAnalyticsResponse>> {
  if (!body.modelId) {
    throw new Error('Missing modelId for model metrics')
  }

  const metrics = await modelPerformanceAnalytics.getModelMetrics(body.modelId)
  
  return { metrics }
}

// Optimize model routing
async function handleOptimizeRouting(body: PerformanceAnalyticsRequest): Promise<Partial<PerformanceAnalyticsResponse>> {
  const optimizationResult = await modelPerformanceAnalytics.optimizeRouting()
  
  return { optimizationResult }
}

// Compare two models
async function handleCompareModels(body: PerformanceAnalyticsRequest): Promise<Partial<PerformanceAnalyticsResponse>> {
  if (!body.modelA || !body.modelB || !body.useCase) {
    throw new Error('Missing modelA, modelB, or useCase for model comparison')
  }

  const comparisonResult = await modelPerformanceAnalytics.compareModels(
    body.modelA,
    body.modelB,
    body.useCase
  )
  
  return { comparisonResult }
}

export async function GET() {
  return NextResponse.json({
    message: 'Model Performance Analytics API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Model performance analytics operations',
        actions: ['get_dashboard', 'track_request', 'get_model_metrics', 'optimize_routing', 'compare_models']
      }
    },
    supportedModels: [
      'gpt-4o-mini',
      'claude-3-haiku',
      'claude-3-sonnet'
    ]
  })
}
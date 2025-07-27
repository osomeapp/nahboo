import { NextRequest, NextResponse } from 'next/server'
import { 
  automatedModelRouter,
  type RequestContext,
  type RoutingStrategy
} from '@/lib/automated-model-routing'

export const maxDuration = 30

interface RoutingRequest {
  action: 'get_status' | 'make_decision' | 'execute_request' | 'add_strategy' | 'get_metrics' | 'health_check'
  
  // For make_decision and execute_request
  context?: RequestContext
  strategyName?: string
  
  // For execute_request
  requestPayload?: {
    prompt: string
    maxTokens?: number
    temperature?: number
    useCase: string
  }
  
  // For add_strategy
  strategy?: {
    name: string
    config: RoutingStrategy
  }
  
  // For get_metrics
  modelId?: string
  timeRange?: number // hours
}

interface RoutingResponse {
  success: boolean
  action: string
  
  // Response data
  systemStatus?: any
  decision?: any
  result?: any
  metrics?: any
  healthCheck?: any
  
  metadata: {
    processingTime: number
    timestamp: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: RoutingRequest = await request.json()

    if (!body.action) {
      return NextResponse.json(
        { error: 'Missing required field: action' },
        { status: 400 }
      )
    }

    let response: Partial<RoutingResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'get_status':
        response = await handleGetStatus()
        break
        
      case 'make_decision':
        response = await handleMakeDecision(body)
        break
        
      case 'execute_request':
        response = await handleExecuteRequest(body)
        break
        
      case 'add_strategy':
        response = await handleAddStrategy(body)
        break
        
      case 'get_metrics':
        response = await handleGetMetrics(body)
        break
        
      case 'health_check':
        response = await handleHealthCheck()
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: RoutingResponse = {
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
    console.error('Model routing API error:', error)
    return NextResponse.json(
      { error: 'Failed to process routing request' },
      { status: 500 }
    )
  }
}

// Get system status
async function handleGetStatus(): Promise<Partial<RoutingResponse>> {
  const systemStatus = automatedModelRouter.getSystemStatus()
  return { systemStatus }
}

// Make routing decision
async function handleMakeDecision(body: RoutingRequest): Promise<Partial<RoutingResponse>> {
  if (!body.context) {
    throw new Error('Missing context for routing decision')
  }

  const decision = await automatedModelRouter.makeRoutingDecision(
    body.context,
    body.strategyName
  )
  
  return { decision }
}

// Execute request with fallback
async function handleExecuteRequest(body: RoutingRequest): Promise<Partial<RoutingResponse>> {
  if (!body.context || !body.requestPayload) {
    throw new Error('Missing context or request payload')
  }

  // Create a mock request function for demonstration
  // In a real implementation, this would call the actual AI service
  const requestFn = async (modelId: string) => {
    // Simulate AI request
    const response = await fetch('/api/ai/multi-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body.requestPayload,
        forceModel: modelId
      })
    })

    if (!response.ok) {
      throw new Error(`Model ${modelId} request failed: ${response.statusText}`)
    }

    return response.json()
  }

  const result = await automatedModelRouter.executeWithFallback(
    requestFn,
    body.context,
    body.strategyName
  )
  
  return { result }
}

// Add routing strategy
async function handleAddStrategy(body: RoutingRequest): Promise<Partial<RoutingResponse>> {
  if (!body.strategy) {
    throw new Error('Missing strategy configuration')
  }

  automatedModelRouter.addRoutingStrategy(body.strategy.name, body.strategy.config)
  
  return { success: true }
}

// Get model metrics
async function handleGetMetrics(body: RoutingRequest): Promise<Partial<RoutingResponse>> {
  const systemStatus = automatedModelRouter.getSystemStatus()
  
  if (body.modelId) {
    // Get metrics for specific model
    const modelHealth = systemStatus.modelHealth[body.modelId]
    const circuitBreaker = systemStatus.circuitBreakers[body.modelId]
    
    if (!modelHealth || !circuitBreaker) {
      throw new Error(`Model ${body.modelId} not found`)
    }
    
    return {
      metrics: {
        modelId: body.modelId,
        health: modelHealth,
        circuitBreaker,
        performance: {
          responseTime: modelHealth.averageResponseTime,
          successRate: modelHealth.successRate,
          errorRate: modelHealth.errorRate,
          performanceScore: modelHealth.performanceScore
        }
      }
    }
  } else {
    // Get metrics for all models
    const allMetrics = Object.keys(systemStatus.modelHealth).map(modelId => {
      const health = systemStatus.modelHealth[modelId]
      const breaker = systemStatus.circuitBreakers[modelId]
      
      return {
        modelId,
        health,
        circuitBreaker: breaker,
        performance: {
          responseTime: health.averageResponseTime,
          successRate: health.successRate,
          errorRate: health.errorRate,
          performanceScore: health.performanceScore
        }
      }
    })
    
    return { metrics: allMetrics }
  }
}

// Health check
async function handleHealthCheck(): Promise<Partial<RoutingResponse>> {
  const systemStatus = automatedModelRouter.getSystemStatus()
  
  const healthCheck = {
    overallHealth: systemStatus.overallHealth,
    totalModels: Object.keys(systemStatus.modelHealth).length,
    availableModels: Object.values(systemStatus.modelHealth)
      .filter(h => h.isAvailable).length,
    openCircuitBreakers: Object.values(systemStatus.circuitBreakers)
      .filter(b => b.state === 'open').length,
    averagePerformanceScore: Object.values(systemStatus.modelHealth)
      .reduce((sum, h) => sum + h.performanceScore, 0) / 
      Object.keys(systemStatus.modelHealth).length,
    timestamp: new Date().toISOString()
  }
  
  return { healthCheck }
}

export async function GET() {
  return NextResponse.json({
    message: 'Automated Model Routing API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Model routing, fallback, and health management',
        actions: [
          'get_status',
          'make_decision',
          'execute_request',
          'add_strategy',
          'get_metrics',
          'health_check'
        ]
      }
    },
    capabilities: [
      'Intelligent Model Selection',
      'Automatic Fallback Handling',
      'Circuit Breaker Protection',
      'Health Monitoring',
      'Performance Tracking',
      'Custom Routing Strategies',
      'Load Balancing',
      'Cost Optimization'
    ],
    routingStrategies: [
      'primary_fallback',
      'load_balanced', 
      'performance_optimized',
      'cost_optimized'
    ],
    circuitBreakerStates: [
      'closed',
      'open',
      'half-open'
    ]
  })
}
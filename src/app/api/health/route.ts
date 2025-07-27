// Health Check API Route
// Provides system status for monitoring and deployment verification

import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/supabase'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  services: {
    database: {
      status: 'healthy' | 'unhealthy'
      responseTime?: number
    }
    openai: {
      status: 'healthy' | 'unhealthy' | 'not_configured'
    }
    auth: {
      status: 'healthy' | 'unhealthy'
    }
  }
  metrics?: {
    uptime: number
    memoryUsage: NodeJS.MemoryUsage
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Initialize health status
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'unhealthy' },
        openai: { status: 'not_configured' },
        auth: { status: 'unhealthy' }
      }
    }

    // Check database connection
    const dbStartTime = Date.now()
    try {
      const isDatabaseHealthy = await checkDatabaseHealth()
      const dbResponseTime = Date.now() - dbStartTime
      
      health.services.database = {
        status: isDatabaseHealthy ? 'healthy' : 'unhealthy',
        responseTime: dbResponseTime
      }
    } catch (error) {
      console.error('Database health check failed:', error)
      health.services.database.status = 'unhealthy'
    }

    // Check OpenAI API configuration
    if (process.env.OPENAI_API_KEY) {
      health.services.openai.status = 'healthy'
    } else {
      health.services.openai.status = 'not_configured'
      if (health.status === 'healthy') {
        health.status = 'degraded'
      }
    }

    // Check authentication service (Supabase)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      health.services.auth.status = 'healthy'
    } else {
      health.services.auth.status = 'unhealthy'
      health.status = 'unhealthy'
    }

    // Overall health assessment
    const unhealthyServices = Object.values(health.services).filter(
      service => service.status === 'unhealthy'
    ).length

    if (unhealthyServices > 0) {
      health.status = unhealthyServices === Object.keys(health.services).length ? 'unhealthy' : 'degraded'
    }

    // Add system metrics in development or if explicitly requested
    const includeMetrics = 
      process.env.NODE_ENV === 'development' || 
      request.nextUrl.searchParams.get('metrics') === 'true'

    if (includeMetrics) {
      health.metrics = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    }

    // Set appropriate HTTP status code
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503

    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': 'true'
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      environment: process.env.NODE_ENV || 'development'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Health-Check': 'true'
      }
    })
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
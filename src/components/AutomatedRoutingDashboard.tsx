'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  useAutomatedRouting,
  useRoutingHealthMonitor
} from '@/hooks/useAutomatedRouting'
import type { RequestContext, RoutingStrategy } from '@/lib/automated-model-routing'

interface AutomatedRoutingDashboardProps {
  className?: string
}

export default function AutomatedRoutingDashboard({
  className = ''
}: AutomatedRoutingDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'routing' | 'monitoring'>('overview')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  
  const {
    systemStatus,
    requestHistory,
    isLoading,
    error,
    makeRoutingDecision,
    getModelMetrics,
    getTrafficDistribution,
    clearError
  } = useAutomatedRouting()

  const {
    getCriticalAlerts,
    getHealthSummary
  } = useRoutingHealthMonitor()

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Data refreshes automatically via the hook
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const healthSummary = getHealthSummary()
  const criticalAlerts = getCriticalAlerts()
  const trafficDistribution = getTrafficDistribution()

  const tabVariants = {
    inactive: { opacity: 0.6, y: 10 },
    active: { opacity: 1, y: 0 }
  }

  return (
    <div className={`automated-routing-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Automated Model Routing
            </h2>
            <p className="text-gray-600">
              Intelligent routing, fallback handling, and performance monitoring
            </p>
          </div>
          
          {/* Overall Health Indicator */}
          {healthSummary && (
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">System Health</div>
                <div className={`text-2xl font-bold ${
                  healthSummary.status === 'healthy' ? 'text-green-600' :
                  healthSummary.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {healthSummary.overallHealth.toFixed(1)}%
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full ${
                healthSummary.status === 'healthy' ? 'bg-green-500' :
                healthSummary.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="error-banner bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h4 className="text-red-800 font-medium">Routing Error</h4>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="critical-alerts bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6"
        >
          <h4 className="text-orange-800 font-medium mb-2 flex items-center">
            🚨 Critical Alerts ({criticalAlerts.length})
          </h4>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="text-sm text-orange-700">
                <span className="font-medium">{alert.type}:</span> {alert.message}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="dashboard-tabs mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'models', label: 'Model Health', icon: '🤖' },
              { id: 'routing', label: 'Routing Strategies', icon: '🎯' },
              { id: 'monitoring', label: 'Live Monitoring', icon: '📡' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        variants={tabVariants}
        initial="inactive"
        animate="active"
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <OverviewTab 
            systemStatus={systemStatus}
            healthSummary={healthSummary}
            trafficDistribution={trafficDistribution}
            requestHistory={requestHistory}
          />
        )}
        
        {activeTab === 'models' && (
          <ModelsTab
            systemStatus={systemStatus}
            getModelMetrics={getModelMetrics}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        )}
        
        {activeTab === 'routing' && (
          <RoutingTab
            systemStatus={systemStatus}
            makeRoutingDecision={makeRoutingDecision}
            isLoading={isLoading}
          />
        )}
        
        {activeTab === 'monitoring' && (
          <MonitoringTab
            systemStatus={systemStatus}
            requestHistory={requestHistory}
            criticalAlerts={criticalAlerts}
          />
        )}
      </motion.div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ 
  systemStatus, 
  healthSummary, 
  trafficDistribution, 
  requestHistory 
}: {
  systemStatus: any
  healthSummary: any
  trafficDistribution: any
  requestHistory: any[]
}) {
  const recentRequests = requestHistory.slice(0, 10)
  const successRate = recentRequests.length > 0 
    ? (recentRequests.filter(r => r.success).length / recentRequests.length) * 100 
    : 100

  return (
    <div className="overview-tab space-y-6">
      {/* System Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="summary-card bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-blue-600 text-xl">🤖</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">
                {systemStatus ? Object.keys(systemStatus.modelHealth).length : 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="summary-card bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Healthy Models</p>
              <p className="text-2xl font-bold text-gray-900">
                {healthSummary?.healthyModels || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="summary-card bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-yellow-600 text-xl">⚡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {successRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="summary-card bg-white rounded-lg shadow-sm border p-6"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-purple-600 text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {requestHistory.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Traffic Distribution */}
      <div className="traffic-distribution bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Traffic Distribution</h3>
        <div className="space-y-4">
          {Object.entries(trafficDistribution).map(([modelId, stats]: [string, any]) => (
            <div key={modelId} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                <span className="font-medium text-gray-900">{modelId}</span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>{stats.requests} requests</span>
                <span>{stats.successRate.toFixed(1)}% success</span>
                <span>{stats.avgTime.toFixed(0)}ms avg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div className="recent-requests bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Requests</h3>
        <div className="space-y-3">
          {recentRequests.map((request, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  request.success ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium text-gray-900">{request.modelUsed}</span>
                {request.attempts > 1 && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    {request.attempts} attempts
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{request.totalTime}ms</span>
                <span>{new Date(request.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Models Tab Component
function ModelsTab({ 
  systemStatus, 
  getModelMetrics, 
  selectedModel, 
  setSelectedModel 
}: {
  systemStatus: any
  getModelMetrics: (modelId: string) => any
  selectedModel: string | null
  setSelectedModel: (modelId: string | null) => void
}) {
  if (!systemStatus) {
    return <div>Loading model data...</div>
  }

  const models = Object.keys(systemStatus.modelHealth)

  return (
    <div className="models-tab space-y-6">
      {/* Model Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((modelId) => {
          const health = systemStatus.modelHealth[modelId]
          const breaker = systemStatus.circuitBreakers[modelId]
          const metrics = getModelMetrics(modelId)

          return (
            <motion.div
              key={modelId}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedModel(modelId)}
              className={`model-card bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all ${
                selectedModel === modelId ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Model Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{modelId}</h3>
                <div className={`w-3 h-3 rounded-full ${
                  health.isAvailable && breaker.state === 'closed' ? 'bg-green-500' :
                  breaker.state === 'half-open' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
              </div>

              {/* Performance Score */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Performance Score</span>
                  <span className="font-medium">{health.performanceScore.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${health.performanceScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Success Rate</span>
                  <span className="font-medium">{health.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Response</span>
                  <span className="font-medium">{health.averageResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Circuit Breaker</span>
                  <span className={`font-medium ${
                    breaker.state === 'closed' ? 'text-green-600' :
                    breaker.state === 'half-open' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {breaker.state}
                  </span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Selected Model Details */}
      {selectedModel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="model-details bg-white rounded-lg shadow-sm border p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {selectedModel} - Detailed Metrics
          </h3>
          
          {(() => {
            const health = systemStatus.modelHealth[selectedModel]
            const breaker = systemStatus.circuitBreakers[selectedModel]
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Health Metrics */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Health Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Availability</span>
                      <span className={`font-medium ${health.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                        {health.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Consecutive Failures</span>
                      <span className="font-medium">{health.consecutiveFailures}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Error Rate</span>
                      <span className="font-medium">{health.errorRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Success</span>
                      <span className="font-medium">
                        {health.lastSuccessfulRequest ? 
                          new Date(health.lastSuccessfulRequest).toLocaleTimeString() : 
                          'Never'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Circuit Breaker */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Circuit Breaker</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">State</span>
                      <span className={`font-medium ${
                        breaker.state === 'closed' ? 'text-green-600' :
                        breaker.state === 'half-open' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {breaker.state}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Failure Count</span>
                      <span className="font-medium">{breaker.failureCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Failure Threshold</span>
                      <span className="font-medium">{breaker.failureThreshold}</span>
                    </div>
                    {breaker.nextRetryTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Next Retry</span>
                        <span className="font-medium">
                          {new Date(breaker.nextRetryTime).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}
    </div>
  )
}

// Routing Tab Component
function RoutingTab({ 
  systemStatus, 
  makeRoutingDecision, 
  isLoading 
}: {
  systemStatus: any
  makeRoutingDecision: (context: RequestContext, strategy?: string) => Promise<any>
  isLoading: boolean
}) {
  const [testContext, setTestContext] = useState<Partial<RequestContext>>({
    useCase: 'content_generation',
    priority: 'medium',
    timeout: 30000,
    retryLimit: 3,
    requiresHighQuality: false,
    costSensitive: false
  })
  
  const [selectedStrategy, setSelectedStrategy] = useState('default')
  const [routingResult, setRoutingResult] = useState<any>(null)

  const handleTestRouting = async () => {
    const context: RequestContext = {
      ...testContext,
      requestId: `test_${Date.now()}`
    } as RequestContext

    const result = await makeRoutingDecision(context, selectedStrategy)
    setRoutingResult(result)
  }

  return (
    <div className="routing-tab space-y-6">
      {/* Available Strategies */}
      <div className="strategies bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Routing Strategies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemStatus?.routingStrategies?.map((strategy: string) => (
            <div key={strategy} className="strategy-card border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{strategy}</h4>
              <p className="text-sm text-gray-600">
                {strategy === 'default' && 'Primary model with fallback chain'}
                {strategy === 'performance' && 'Optimized for speed and reliability'}
                {strategy === 'cost_optimized' && 'Prioritizes cost efficiency'}
                {strategy === 'load_balanced' && 'Distributes traffic evenly'}
              </p>
            </div>
          )) || (
            <div className="col-span-2 text-gray-500">No routing strategies available</div>
          )}
        </div>
      </div>

      {/* Test Routing Decision */}
      <div className="test-routing bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Routing Decision</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Use Case
              </label>
              <select
                value={testContext.useCase}
                onChange={(e) => setTestContext({ ...testContext, useCase: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="content_generation">Content Generation</option>
                <option value="mathematics">Mathematics</option>
                <option value="programming">Programming</option>
                <option value="creative_writing">Creative Writing</option>
                <option value="analysis">Analysis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={testContext.priority}
                onChange={(e) => setTestContext({ ...testContext, priority: e.target.value as any })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategy
              </label>
              <select
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="default">Default</option>
                <option value="performance">Performance</option>
                <option value="cost_optimized">Cost Optimized</option>
                <option value="load_balanced">Load Balanced</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="highQuality"
                checked={testContext.requiresHighQuality}
                onChange={(e) => setTestContext({ 
                  ...testContext, 
                  requiresHighQuality: e.target.checked 
                })}
                className="mr-2"
              />
              <label htmlFor="highQuality" className="text-sm font-medium text-gray-700">
                Requires High Quality
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="costSensitive"
                checked={testContext.costSensitive}
                onChange={(e) => setTestContext({ 
                  ...testContext, 
                  costSensitive: e.target.checked 
                })}
                className="mr-2"
              />
              <label htmlFor="costSensitive" className="text-sm font-medium text-gray-700">
                Cost Sensitive
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timeout (ms)
              </label>
              <input
                type="number"
                value={testContext.timeout}
                onChange={(e) => setTestContext({ 
                  ...testContext, 
                  timeout: Number(e.target.value) 
                })}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleTestRouting}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Routing Decision'}
        </button>

        {/* Routing Result */}
        {routingResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="routing-result mt-6 bg-gray-50 rounded-lg p-4"
          >
            <h4 className="font-medium text-gray-900 mb-3">Routing Decision</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Selected Model:</span>
                <span className="font-medium">{routingResult.selectedModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reason:</span>
                <span className="font-medium">{routingResult.reason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Confidence:</span>
                <span className="font-medium">{(routingResult.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Cost:</span>
                <span className="font-medium">${routingResult.estimatedCost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Est. Response Time:</span>
                <span className="font-medium">{routingResult.estimatedResponseTime}ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Monitoring Tab Component
function MonitoringTab({ 
  systemStatus, 
  requestHistory, 
  criticalAlerts 
}: {
  systemStatus: any
  requestHistory: any[]
  criticalAlerts: any[]
}) {
  const recentRequests = requestHistory.slice(0, 20)

  return (
    <div className="monitoring-tab space-y-6">
      {/* Live System Status */}
      <div className="system-status bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Live System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systemStatus && Object.entries(systemStatus.modelHealth).map(([modelId, health]: [string, any]) => {
            const breaker = systemStatus.circuitBreakers[modelId]
            
            return (
              <div key={modelId} className="model-status border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{modelId}</h4>
                  <div className={`w-2 h-2 rounded-full ${
                    health.isAvailable && breaker.state === 'closed' ? 'bg-green-500' :
                    breaker.state === 'half-open' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Score: {health.performanceScore.toFixed(1)}</div>
                  <div>Success: {health.successRate.toFixed(1)}%</div>
                  <div>Breaker: {breaker.state}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Request Stream */}
      <div className="request-stream bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Live Request Stream</h3>
        <div className="max-h-64 overflow-y-auto space-y-2">
          {recentRequests.map((request, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="request-item flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
            >
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-3 ${
                  request.success ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">{request.modelUsed}</span>
                {request.attempts > 1 && (
                  <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                    {request.attempts}x
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {request.totalTime}ms • {new Date(request.timestamp).toLocaleTimeString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Alerts */}
      <div className="all-alerts bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
        {criticalAlerts.length > 0 ? (
          <div className="space-y-3">
            {criticalAlerts.map((alert, index) => (
              <div key={index} className={`alert-item border-l-4 pl-4 py-2 ${
                alert.severity === 'high' ? 'border-red-500 bg-red-50' :
                alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.type}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    {alert.action && (
                      <p className="text-xs text-gray-500 mt-1">{alert.action}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            🟢 No critical alerts - all systems operating normally
          </div>
        )}
      </div>
    </div>
  )
}
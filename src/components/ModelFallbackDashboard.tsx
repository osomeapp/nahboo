// Model Fallback Router Dashboard
// Monitoring and management interface for AI model routing and failover
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, AlertTriangle, CheckCircle, Clock, Globe, 
  TrendingUp, TrendingDown, Zap, Shield, Wifi, WifiOff,
  ArrowRight, RotateCcw, Settings, Eye, RefreshCw,
  BarChart3, PieChart, Target, Layers, Server
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { 
  useModelFallbackRouter,
  useRouterHealthMonitoring,
  useSmartRouting
} from '@/hooks/useModelFallbackRouter'
import type { AIModel, FailoverEvent, RouterHealth } from '@/lib/model-fallback-router'

interface ModelFallbackDashboardProps {
  userProfile?: UserProfile
  className?: string
}

export default function ModelFallbackDashboard({
  userProfile,
  className = ''
}: ModelFallbackDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'models' | 'routing' | 'monitoring'>('overview')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  
  const {
    health,
    models,
    routes,
    recentFailovers,
    isLoading,
    error,
    clearError
  } = useModelFallbackRouter()

  const {
    healthSummary,
    modelHealthBreakdown,
    failoverSummary,
    refreshHealth
  } = useRouterHealthMonitoring()

  const {
    routingHistory,
    routingStats
  } = useSmartRouting()

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Model Router & Fallback</h2>
              <p className="text-blue-100">Intelligent AI model routing with automatic failover</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Health Status */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                health?.overallStatus === 'healthy' ? 'text-green-200' :
                health?.overallStatus === 'degraded' ? 'text-yellow-200' : 'text-red-200'
              }`}>
                {health?.overallStatus || 'Unknown'}
              </div>
              <div className="text-xs text-blue-200">System Status</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{health?.healthyModels || 0}</div>
              <div className="text-xs text-blue-200">Healthy Models</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">{recentFailovers.length}</div>
              <div className="text-xs text-blue-200">Recent Failovers</div>
            </div>
            
            <button
              onClick={refreshHealth}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center space-x-1 bg-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'models'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Models ({models.length})
          </button>
          <button
            onClick={() => setActiveTab('routing')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'routing'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Routing ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'monitoring'
                ? 'bg-white text-blue-600'
                : 'text-white hover:bg-white/20'
            }`}
          >
            Monitoring
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-l-4 border-red-500 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab
            health={health}
            healthSummary={healthSummary}
            modelHealthBreakdown={modelHealthBreakdown}
            failoverSummary={failoverSummary}
            routingStats={routingStats}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'models' && (
          <ModelsTab
            models={models}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'routing' && (
          <RoutingTab
            routes={routes}
            routingHistory={routingHistory}
            routingStats={routingStats}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'monitoring' && (
          <MonitoringTab
            recentFailovers={recentFailovers}
            health={health}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
interface OverviewTabProps {
  health: RouterHealth | null
  healthSummary: any
  modelHealthBreakdown: any
  failoverSummary: any
  routingStats: any
  isLoading: boolean
}

function OverviewTab({ 
  health, 
  healthSummary, 
  modelHealthBreakdown, 
  failoverSummary, 
  routingStats,
  isLoading 
}: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          title="System Status"
          value={health?.overallStatus || 'Unknown'}
          icon={Activity}
          status={health?.overallStatus}
        />
        <HealthCard
          title="Success Rate"
          value={`${((health?.successRate || 0) * 100).toFixed(1)}%`}
          icon={CheckCircle}
          status={health?.successRate && health.successRate > 0.95 ? 'healthy' : 'degraded'}
        />
        <HealthCard
          title="Avg Response"
          value={`${health?.avgResponseTime?.toFixed(0) || 0}ms`}
          icon={Clock}
          status={health?.avgResponseTime && health.avgResponseTime < 2000 ? 'healthy' : 'degraded'}
        />
        <HealthCard
          title="Active Models"
          value={`${health?.healthyModels || 0}/${health?.activeModels || 0}`}
          icon={Server}
          status={health?.healthyModels === health?.activeModels ? 'healthy' : 'degraded'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Health Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-blue-500" />
            Model Health Distribution
          </h3>
          <div className="space-y-3">
            <HealthBar
              label="Healthy"
              count={modelHealthBreakdown?.healthy || 0}
              total={health?.activeModels || 1}
              color="green"
            />
            <HealthBar
              label="Degraded"
              count={modelHealthBreakdown?.degraded || 0}
              total={health?.activeModels || 1}
              color="yellow"
            />
            <HealthBar
              label="Unhealthy"
              count={modelHealthBreakdown?.unhealthy || 0}
              total={health?.activeModels || 1}
              color="red"
            />
          </div>
        </div>

        {/* Routing Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
            Routing Performance
          </h3>
          {routingStats ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Requests</span>
                <span className="font-medium">{routingStats.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium">{(routingStats.successRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-medium">{routingStats.avgResponseTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Confidence</span>
                <span className="font-medium">{(routingStats.avgConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No routing data available
            </div>
          )}
        </div>
      </div>

      {/* Critical Issues */}
      {healthSummary?.criticalIssues?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Critical Issues
          </h3>
          <ul className="space-y-1">
            {healthSummary.criticalIssues.map((issue: string, index: number) => (
              <li key={index} className="text-red-700 text-sm">• {issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {healthSummary?.warnings?.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Warnings
          </h3>
          <ul className="space-y-1">
            {healthSummary.warnings.map((warning: string, index: number) => (
              <li key={index} className="text-yellow-700 text-sm">• {warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Models Tab Component
interface ModelsTabProps {
  models: AIModel[]
  selectedModel: string | null
  onSelectModel: (modelId: string | null) => void
  isLoading: boolean
}

function ModelsTab({ models, selectedModel, onSelectModel, isLoading }: ModelsTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Models</h3>
        <div className="text-sm text-gray-500">
          {models.length} models configured
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {models.map(model => (
          <ModelCard
            key={model.modelId}
            model={model}
            isSelected={selectedModel === model.modelId}
            onClick={() => onSelectModel(
              selectedModel === model.modelId ? null : model.modelId
            )}
          />
        ))}
      </div>

      {models.length === 0 && (
        <div className="text-center py-12">
          <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Models Found</h3>
          <p className="text-gray-500">No AI models are currently configured</p>
        </div>
      )}
    </div>
  )
}

// Routing Tab Component
interface RoutingTabProps {
  routes: any[]
  routingHistory: any[]
  routingStats: any
  isLoading: boolean
}

function RoutingTab({ routes, routingHistory, routingStats, isLoading }: RoutingTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recent Routing Decisions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Routing Decisions</h3>
        <div className="space-y-3">
          {routingHistory.slice(0, 10).map((decision, index) => (
            <RoutingHistoryCard key={index} decision={decision} />
          ))}
        </div>
        
        {routingHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No routing history available
          </div>
        )}
      </div>

      {/* Model Usage */}
      {routingStats?.modelUsage && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Model Usage Distribution</h3>
          <div className="space-y-2">
            {Object.entries(routingStats.modelUsage).map(([modelId, count]) => (
              <UsageBar
                key={modelId}
                label={modelId}
                count={count as number}
                total={routingStats.totalRequests}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Monitoring Tab Component
interface MonitoringTabProps {
  recentFailovers: FailoverEvent[]
  health: RouterHealth | null
  isLoading: boolean
}

function MonitoringTab({ recentFailovers, health, isLoading }: MonitoringTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Recent Failovers */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <RotateCcw className="w-5 h-5 mr-2 text-red-500" />
          Recent Failovers
        </h3>
        <div className="space-y-3">
          {recentFailovers.slice(0, 20).map(failover => (
            <FailoverCard key={failover.eventId} failover={failover} />
          ))}
        </div>
        
        {recentFailovers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            No recent failovers - system is stable
          </div>
        )}
      </div>
    </div>
  )
}

// Helper Components
function HealthCard({ title, value, icon: Icon, status }: {
  title: string
  value: string
  icon: any
  status?: string
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-75" />
      </div>
    </div>
  )
}

function HealthBar({ label, count, total, color }: {
  label: string
  count: number
  total: number
  color: 'green' | 'yellow' | 'red'
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{count}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function ModelCard({ model, isSelected, onClick }: {
  model: AIModel
  isSelected: boolean
  onClick: () => void
}) {
  const getStatusIcon = () => {
    switch (model.status) {
      case 'healthy': return <Wifi className="w-4 h-4 text-green-500" />
      case 'degraded': return <Wifi className="w-4 h-4 text-yellow-500" />
      case 'unhealthy': return <WifiOff className="w-4 h-4 text-red-500" />
      default: return <WifiOff className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <motion.div
      layout
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">{model.name}</h4>
          <p className="text-sm text-gray-600">{model.provider}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-xs px-2 py-1 rounded ${
            model.status === 'healthy' ? 'bg-green-100 text-green-700' :
            model.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {model.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Success Rate</span>
          <div className="font-medium">{(model.successRate * 100).toFixed(0)}%</div>
        </div>
        <div>
          <span className="text-gray-600">Avg Response</span>
          <div className="font-medium">{model.avgResponseTime.toFixed(0)}ms</div>
        </div>
        <div>
          <span className="text-gray-600">Cost</span>
          <div className="font-medium">${model.costPerRequest.toFixed(4)}</div>
        </div>
      </div>
    </motion.div>
  )
}

function RoutingHistoryCard({ decision }: { decision: any }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          decision.success ? 'bg-green-500' : 'bg-red-500'
        }`} />
        <div>
          <div className="font-medium">{decision.useCase}</div>
          <div className="text-sm text-gray-600">{decision.reason}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">{decision.selectedModel}</div>
        <div className="text-sm text-gray-600">
          {decision.responseTime ? `${decision.responseTime}ms` : 'Pending'}
        </div>
      </div>
    </div>
  )
}

function UsageBar({ label, count, total }: {
  label: string
  count: number
  total: number
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{count} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function FailoverCard({ failover }: { failover: FailoverEvent }) {
  return (
    <div className="border border-red-200 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <RotateCcw className="w-4 h-4 text-red-500" />
          <span className="font-medium">{failover.useCase}</span>
        </div>
        <span className="text-sm text-gray-600">
          {failover.timestamp.toLocaleTimeString()}
        </span>
      </div>
      
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600">{failover.originalModel}</span>
        <ArrowRight className="w-4 h-4 text-gray-400" />
        <span className="text-gray-600">{failover.fallbackModel}</span>
      </div>
      
      <div className="text-sm text-red-600 mt-1">
        Reason: {failover.reason}
      </div>
    </div>
  )
}
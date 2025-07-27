// Real-Time Performance Monitoring Dashboard
// Live monitoring and alerting for AI model performance
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Bell,
  Clock, TrendingUp, TrendingDown, Zap, DollarSign,
  Users, Eye, PlayCircle, PauseCircle, Download,
  Settings, RefreshCw, BarChart3, Target, Gauge
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { 
  useRealTimeMonitoring,
  usePerformanceAlerts,
  useMonitoringDashboard
} from '@/hooks/useRealTimePerformanceMonitoring'

interface RealTimeMonitoringProps {
  userProfile?: UserProfile
  className?: string
}

export default function RealTimeMonitoringDashboard({
  userProfile,
  className = ''
}: RealTimeMonitoringProps) {
  const {
    isMonitoring,
    config,
    startMonitoring,
    stopMonitoring,
    updateConfig,
    exportData
  } = useRealTimeMonitoring()

  const {
    summary,
    modelRankings,
    activeAlerts,
    criticalAlerts,
    alertCount,
    criticalAlertCount,
    overallHealth
  } = useMonitoringDashboard()

  const {
    unacknowledgedAlerts,
    acknowledgeAlert,
    acknowledgeAllCritical,
    clearAcknowledgedAlerts
  } = usePerformanceAlerts()

  const [selectedTimeWindow, setSelectedTimeWindow] = useState<'5m' | '1h' | '6h' | '24h'>('1h')
  const [showConfig, setShowConfig] = useState(false)

  const timeWindowMs = {
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  }[selectedTimeWindow]

  const getHealthColor = (indicator: 'good' | 'warning' | 'critical') => {
    switch (indicator) {
      case 'good': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
    }
  }

  const getHealthIcon = (indicator: 'good' | 'warning' | 'critical') => {
    switch (indicator) {
      case 'good': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': return XCircle
    }
  }

  const formatNumber = (value: number, type: 'duration' | 'percentage' | 'currency' | 'count') => {
    switch (type) {
      case 'duration':
        return `${value.toFixed(0)}ms`
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`
      case 'currency':
        return `$${value.toFixed(2)}`
      case 'count':
        return value.toLocaleString()
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Real-Time Monitoring</h2>
              <p className="text-blue-100">Live AI model performance tracking</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Monitoring Status */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  {isMonitoring ? 'Monitoring' : 'Stopped'}
                </span>
              </div>
              <div className="text-xs text-blue-200">
                {isMonitoring ? `${(config.samplingRate * 100).toFixed(0)}% sampling` : 'Inactive'}
              </div>
            </div>
            
            {/* Control Buttons */}
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`p-2 rounded-lg transition-colors ${
                isMonitoring 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isMonitoring ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
            </button>
            
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Time Window Selector */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {(['5m', '1h', '6h', '24h'] as const).map((window) => (
              <button
                key={window}
                onClick={() => setSelectedTimeWindow(window)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTimeWindow === window
                    ? 'bg-white text-blue-600'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {window}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {/* Alert Counter */}
            {alertCount > 0 && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 border border-red-400/30 rounded-lg">
                <Bell className="w-4 h-4 text-red-200" />
                <span className="text-sm font-medium">
                  {alertCount} alert{alertCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            <button
              onClick={() => exportData(timeWindowMs)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-50 border-b border-gray-200 p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sampling Rate
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="1"
                  step="0.01"
                  value={config.samplingRate}
                  onChange={(e) => updateConfig({ samplingRate: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {(config.samplingRate * 100).toFixed(0)}% of requests
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.retentionDays}
                  onChange={(e) => updateConfig({ retentionDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.alertingEnabled}
                    onChange={(e) => updateConfig({ alertingEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enable Alerts</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.realTimeUpdates}
                    onChange={(e) => updateConfig({ realTimeUpdates: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Real-time Updates</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-6">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Requests</span>
              <Users className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(summary.totalRequests, 'count')}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Avg Response</span>
              <Clock className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getHealthColor(overallHealth.responseTime as 'good' | 'warning' | 'critical').split(' ')[0]}`}>
              {formatNumber(summary.avgResponseTime, 'duration')}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Error Rate</span>
              <AlertTriangle className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getHealthColor(overallHealth.errorRate as 'good' | 'warning' | 'critical').split(' ')[0]}`}>
              {formatNumber(summary.errorRate, 'percentage')}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Cost</span>
              <DollarSign className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${getHealthColor(overallHealth.cost as 'good' | 'warning' | 'critical').split(' ')[0]}`}>
              {formatNumber(summary.totalCost, 'currency')}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Active Alerts</span>
              <Bell className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-2xl font-bold ${alertCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {alertCount}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Active Alerts</h3>
              <div className="flex items-center space-x-2">
                {criticalAlertCount > 0 && (
                  <button
                    onClick={acknowledgeAllCritical}
                    className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                  >
                    Ack Critical ({criticalAlertCount})
                  </button>
                )}
                <button
                  onClick={clearAcknowledgedAlerts}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                >
                  Clear Acknowledged
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {activeAlerts.slice(0, 5).map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => acknowledgeAlert(alert.id)}
                />
              ))}
              {activeAlerts.length > 5 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  ... and {activeAlerts.length - 5} more alerts
                </div>
              )}
            </div>
          </div>
        )}

        {/* Model Rankings */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Model Performance Rankings</h3>
          <div className="space-y-3">
            {modelRankings.slice(0, 5).map((model, index) => (
              <ModelRankingCard
                key={model.modelId}
                model={model}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Alert Card Component
interface AlertCardProps {
  alert: {
    id: string
    type: string
    severity: string
    modelId: string
    useCase?: string
    message: string
    timestamp: number
  }
  onAcknowledge: () => void
}

function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800'
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800'
      default: return 'border-blue-500 bg-blue-50 text-blue-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'latency': return Clock
      case 'error_rate': return AlertTriangle
      case 'cost': return DollarSign
      case 'quality': return Target
      case 'availability': return Activity
      default: return AlertTriangle
    }
  }

  const TypeIcon = getTypeIcon(alert.type)
  const timeAgo = Math.floor((Date.now() - alert.timestamp) / 1000 / 60)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <TypeIcon className="w-5 h-5 mt-0.5" />
          <div>
            <div className="font-semibold">
              {alert.modelId} {alert.useCase && `(${alert.useCase})`}
            </div>
            <div className="text-sm opacity-90">
              {alert.message}
            </div>
            <div className="text-xs opacity-75 mt-1">
              {timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`} • {alert.type}
            </div>
          </div>
        </div>
        
        <button
          onClick={onAcknowledge}
          className="px-3 py-1 bg-white/50 hover:bg-white/75 rounded text-xs font-medium transition-colors"
        >
          Acknowledge
        </button>
      </div>
    </motion.div>
  )
}

// Model Ranking Card Component
interface ModelRankingCardProps {
  model: {
    modelId: string
    requests: number
    avgResponseTime: number
    avgErrorRate: number
    avgAvailability: number
    score: number
  }
  rank: number
}

function ModelRankingCard({ model, rank }: ModelRankingCardProps) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-100'
      case 2: return 'text-gray-600 bg-gray-100'
      case 3: return 'text-orange-600 bg-orange-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getHealthIndicator = (score: number) => {
    if (score >= 0.8) return { color: 'bg-green-500', label: 'Excellent' }
    if (score >= 0.6) return { color: 'bg-blue-500', label: 'Good' }
    if (score >= 0.4) return { color: 'bg-yellow-500', label: 'Fair' }
    return { color: 'bg-red-500', label: 'Poor' }
  }

  const health = getHealthIndicator(model.score)

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(rank)}`}>
            #{rank}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{model.modelId}</div>
            <div className="text-sm text-gray-600">{model.requests} requests</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${health.color}`} />
          <span className="text-sm font-medium text-gray-700">{health.label}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Response:</span>
          <div className="font-medium">{model.avgResponseTime.toFixed(0)}ms</div>
        </div>
        <div>
          <span className="text-gray-600">Errors:</span>
          <div className="font-medium">{(model.avgErrorRate * 100).toFixed(1)}%</div>
        </div>
        <div>
          <span className="text-gray-600">Uptime:</span>
          <div className="font-medium">{(model.avgAvailability * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}
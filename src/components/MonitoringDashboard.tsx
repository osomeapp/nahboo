// Real-Time Monitoring Dashboard
// Comprehensive interface for monitoring content safety and security alerts
'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, AlertTriangle, Activity, TrendingUp, Eye, 
  Clock, Users, CheckCircle, XCircle, AlertCircle,
  Settings, Pause, Play, RefreshCw, Filter, Download,
  BarChart3, PieChart, LineChart, Bell
} from 'lucide-react'
import type { UserProfile } from '@/types'
import type { MonitoringAlert, MonitoringMetrics } from '@/lib/real-time-content-monitor'
import { useRealTimeMonitoring } from '@/hooks/useRealTimeMonitoring'

interface MonitoringDashboardProps {
  userId: string
  userProfile: UserProfile
  onAlertAction?: (alertId: string, action: string) => void
  showAdvancedControls?: boolean
}

type DashboardView = 'overview' | 'alerts' | 'metrics' | 'settings'

interface AlertCardProps {
  alert: MonitoringAlert
  onResolve: (resolutionType: string, notes: string) => void
  onEscalate: () => void
  compact?: boolean
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onResolve, onEscalate, compact = false }) => {
  const [showDetails, setShowDetails] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const getSeverityColor = (severity: MonitoringAlert['severity']) => {
    switch (severity) {
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: MonitoringAlert['status']) => {
    switch (status) {
      case 'active': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'investigating': return <Eye className="w-4 h-4 text-yellow-500" />
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'false_positive': return <XCircle className="w-4 h-4 text-gray-500" />
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleResolve = async (resolutionType: string) => {
    setResolving(true)
    try {
      await onResolve(resolutionType, resolutionNotes)
    } finally {
      setResolving(false)
      setResolutionNotes('')
    }
  }

  if (compact) {
    return (
      <div className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon(alert.status)}
            <span className="font-medium text-sm">{alert.alertType.replace('_', ' ')}</span>
            <span className="text-xs opacity-75">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
              {alert.severity}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${getSeverityColor(alert.severity)} overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {getStatusIcon(alert.status)}
              <h3 className="font-semibold">{alert.alertType.replace('_', ' ')}</h3>
              <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                {alert.severity}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Content: {alert.contextData.contentTitle || 'Unknown'}
            </p>
            
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Triggered: {new Date(alert.timestamp).toLocaleString()}</span>
              <span>Rules: {alert.triggeredBy.length}</span>
              <span>Issues: {alert.detectedIssues.length}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
            
            {alert.status === 'active' && (
              <button
                onClick={onEscalate}
                className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded"
              >
                Escalate
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t"
            >
              {/* Detected Issues */}
              <div className="mb-4">
                <h4 className="font-medium text-sm mb-2">Detected Issues:</h4>
                <div className="space-y-2">
                  {alert.detectedIssues.map((issue, index) => (
                    <div key={index} className="bg-white/50 p-3 rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{issue.issueType.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">
                          {Math.round(issue.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                      {issue.evidence.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Evidence:</span>
                          <ul className="text-xs text-gray-500 mt-1">
                            {issue.evidence.map((evidence, evidenceIndex) => (
                              <li key={evidenceIndex}>• {evidence.content}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Actions */}
              {alert.status === 'active' && (
                <div className="mb-4">
                  <h4 className="font-medium text-sm mb-2">Resolution Actions:</h4>
                  <div className="space-y-2">
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add resolution notes..."
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolve('approved')}
                        disabled={resolving}
                        className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded disabled:opacity-50"
                      >
                        Approve Content
                      </button>
                      <button
                        onClick={() => handleResolve('content_removed')}
                        disabled={resolving}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded disabled:opacity-50"
                      >
                        Remove Content
                      </button>
                      <button
                        onClick={() => handleResolve('false_positive')}
                        disabled={resolving}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded disabled:opacity-50"
                      >
                        False Positive
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  userId,
  userProfile,
  onAlertAction,
  showAdvancedControls = false
}) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview')
  const [refreshing, setRefreshing] = useState(false)

  const monitoring = useRealTimeMonitoring(userId, userProfile)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        monitoring.getAlerts(true),
        monitoring.getMetrics()
      ])
    } finally {
      setRefreshing(false)
    }
  }, [monitoring])

  const handleAlertResolve = useCallback(async (alertId: string, resolutionType: string, notes: string) => {
    await monitoring.resolveAlert(alertId, resolutionType as any, notes)
    onAlertAction?.(alertId, 'resolved')
  }, [monitoring, onAlertAction])

  const handleAlertEscalate = useCallback((alertId: string) => {
    onAlertAction?.(alertId, 'escalated')
  }, [onAlertAction])

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: monitoring.statistics.activeAlerts },
    { id: 'metrics', label: 'Metrics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Content Monitoring</h2>
              <p className="text-blue-100">
                Real-time safety monitoring {monitoring.isActive ? '(Active)' : '(Inactive)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Monitoring Controls */}
            <div className="flex items-center space-x-2">
              {monitoring.isActive ? (
                <button
                  onClick={monitoring.stopMonitoring}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={monitoring.startMonitoring}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              )}
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 text-white p-2 rounded disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{monitoring.statistics.contentScanned}</div>
            <div className="text-sm text-blue-100">Content Scanned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{monitoring.statistics.activeAlerts}</div>
            <div className="text-sm text-blue-100">Active Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{monitoring.statistics.criticalAlerts}</div>
            <div className="text-sm text-blue-100">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round((1 - monitoring.statistics.alertRate) * 100)}%
            </div>
            <div className="text-sm text-blue-100">Safety Rate</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {viewTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as DashboardView)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors relative ${
                  activeView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* View Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Recent Alerts */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {monitoring.filteredAlerts.slice(0, 5).map(alert => (
                    <AlertCard
                      key={alert.alertId}
                      alert={alert}
                      onResolve={(type, notes) => handleAlertResolve(alert.alertId, type, notes)}
                      onEscalate={() => handleAlertEscalate(alert.alertId)}
                      compact
                    />
                  ))}
                  
                  {monitoring.filteredAlerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>No recent alerts - content is safe!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Monitoring Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Monitoring Active</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Last scan: {monitoring.statistics.lastScanTime?.toLocaleTimeString() || 'Never'}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Response Time</span>
                    </div>
                    <p className="text-sm text-blue-600 mt-1">
                      Avg: {Math.round(monitoring.statistics.averageResolutionTime)} min
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-800">User Safety</span>
                    </div>
                    <p className="text-sm text-purple-600 mt-1">
                      {userProfile.age_group} protection active
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">All Alerts</h3>
                <div className="flex items-center space-x-3">
                  <select
                    value={monitoring.filters.timeRange}
                    onChange={(e) => monitoring.updateFilters({ timeRange: e.target.value as any })}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="last_hour">Last Hour</option>
                    <option value="last_day">Last Day</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                  </select>
                  
                  <select
                    value={monitoring.filters.severity[0] || 'all'}
                    onChange={(e) => {
                      const severity = e.target.value
                      monitoring.updateFilters({ 
                        severity: severity === 'all' ? ['low', 'medium', 'high', 'critical'] : [severity as any]
                      })
                    }}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Alert List */}
              <div className="space-y-4">
                {monitoring.filteredAlerts.map(alert => (
                  <AlertCard
                    key={alert.alertId}
                    alert={alert}
                    onResolve={(type, notes) => handleAlertResolve(alert.alertId, type, notes)}
                    onEscalate={() => handleAlertEscalate(alert.alertId)}
                  />
                ))}
                
                {monitoring.filteredAlerts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
                    <p>No alerts found matching your filters</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
              
              {monitoring.metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Content Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Scanned</span>
                        <span className="font-medium">{monitoring.metrics.contentScanned}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Alerts Generated</span>
                        <span className="font-medium">{monitoring.metrics.alertsGenerated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Appropriate Rate</span>
                        <span className="font-medium">
                          {Math.round(monitoring.metrics.appropriateContentRate * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Response Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="font-medium">{Math.round(monitoring.metrics.responseTime)} min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">False Positive Rate</span>
                        <span className="font-medium">
                          {Math.round(monitoring.metrics.falsePositiveRate * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">User Protection</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Users Protected</span>
                        <span className="font-medium">{monitoring.metrics.userImpactMetrics.usersProtected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Content Blocked</span>
                        <span className="font-medium">{monitoring.metrics.userImpactMetrics.contentBlocked}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold">Monitoring Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scan Interval
                  </label>
                  <select
                    value={monitoring.config.scanInterval}
                    onChange={(e) => monitoring.updateConfiguration({ scanInterval: parseInt(e.target.value) })}
                    className="border border-gray-300 rounded px-3 py-2"
                  >
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                    <option value={60000}>1 minute</option>
                    <option value={300000}>5 minutes</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="autoModeration"
                    checked={monitoring.config.autoModeration}
                    onChange={(e) => monitoring.updateConfiguration({ autoModeration: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="autoModeration" className="text-sm font-medium text-gray-700">
                    Enable automatic content moderation
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailAlerts"
                    checked={monitoring.config.notificationSettings.emailAlerts}
                    onChange={(e) => monitoring.updateConfiguration({ 
                      notificationSettings: { 
                        ...monitoring.config.notificationSettings, 
                        emailAlerts: e.target.checked 
                      }
                    })}
                    className="rounded"
                  />
                  <label htmlFor="emailAlerts" className="text-sm font-medium text-gray-700">
                    Email alerts for critical issues
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MonitoringDashboard
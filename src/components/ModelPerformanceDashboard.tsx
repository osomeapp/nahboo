// Model Performance Dashboard
// Real-time analytics and optimization insights for AI models
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, TrendingUp, TrendingDown, Zap, DollarSign,
  Clock, Users, AlertTriangle, CheckCircle, Brain,
  BarChart3, LineChart, PieChart, Settings, RefreshCw,
  Target, Cpu, Database, Gauge, ThumbsUp, Star,
  ArrowUp, ArrowDown, Minus, Filter, Download
} from 'lucide-react'
import type { UserProfile } from '@/types'
import { 
  modelPerformanceAnalytics,
  type ModelPerformanceMetrics,
  type ModelOptimizationRecommendation,
  type ModelComparisonResult
} from '@/lib/model-performance-analytics'
import ModelEffectivenessDashboard from './ModelEffectivenessDashboard'
import RealTimeMonitoringDashboard from './RealTimeMonitoringDashboard'

interface ModelPerformanceDashboardProps {
  userProfile?: UserProfile
  className?: string
}

interface DashboardState {
  activeTab: 'performance' | 'effectiveness' | 'monitoring'
  timeWindow: '1h' | '24h' | '7d' | '30d'
  selectedModel: string | null
  selectedUseCase: string | null
  showOptimizations: boolean
  showComparisons: boolean
  autoRefresh: boolean
}

interface PerformanceData {
  overallHealth: number
  modelPerformance: Record<string, any>
  useCasePerformance: Record<string, any>
  recommendations: ModelOptimizationRecommendation[]
  alerts: string[]
  isLoading: boolean
  lastUpdated: Date
}

export default function ModelPerformanceDashboard({
  userProfile,
  className = ''
}: ModelPerformanceDashboardProps) {
  const [state, setState] = useState<DashboardState>({
    activeTab: 'performance',
    timeWindow: '24h',
    selectedModel: null,
    selectedUseCase: null,
    showOptimizations: true,
    showComparisons: false,
    autoRefresh: true
  })

  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    overallHealth: 0,
    modelPerformance: {},
    useCasePerformance: {},
    recommendations: [],
    alerts: [],
    isLoading: true,
    lastUpdated: new Date()
  })

  const [comparisonResults, setComparisonResults] = useState<ModelComparisonResult[]>([])

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [state.timeWindow])

  // Auto-refresh data
  useEffect(() => {
    if (state.autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [state.autoRefresh])

  const loadDashboardData = async () => {
    try {
      setPerformanceData(prev => ({ ...prev, isLoading: true }))
      
      const timeWindowMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[state.timeWindow]

      const dashboard = await modelPerformanceAnalytics.getPerformanceDashboard(timeWindowMs)
      
      setPerformanceData({
        ...dashboard,
        isLoading: false,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setPerformanceData(prev => ({ 
        ...prev, 
        isLoading: false,
        alerts: [...prev.alerts, 'Failed to load dashboard data']
      }))
    }
  }

  const loadModelComparison = async (modelA: string, modelB: string, useCase: string) => {
    try {
      const comparison = await modelPerformanceAnalytics.compareModels(modelA, modelB, useCase)
      setComparisonResults(prev => [...prev.filter(c => !(c.modelA === modelA && c.modelB === modelB)), comparison])
    } catch (error) {
      console.error('Failed to compare models:', error)
    }
  }

  const handleOptimizeRouting = async () => {
    try {
      const result = await modelPerformanceAnalytics.optimizeRouting()
      // Show optimization results
      console.log('Routing optimization completed:', result)
      loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Failed to optimize routing:', error)
    }
  }

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      timeWindow: state.timeWindow,
      performanceData,
      comparisonResults
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `model_performance_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getHealthColor = (health: number) => {
    if (health >= 0.8) return 'text-green-600'
    if (health >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthIcon = (health: number) => {
    if (health >= 0.8) return CheckCircle
    if (health >= 0.6) return AlertTriangle
    return AlertTriangle
  }

  const formatMetric = (value: number, type: 'time' | 'percentage' | 'currency' | 'number') => {
    switch (type) {
      case 'time':
        return `${value.toFixed(0)}ms`
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`
      case 'currency':
        return `$${value.toFixed(4)}`
      case 'number':
        return value.toFixed(2)
      default:
        return value.toString()
    }
  }

  const HealthIcon = getHealthIcon(performanceData.overallHealth)

  return (
    <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AI Model Analytics</h2>
              <p className="text-indigo-100">Performance monitoring and effectiveness measurement</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Overall Health */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <HealthIcon className={`w-5 h-5 ${getHealthColor(performanceData.overallHealth)}`} />
                <span className="text-sm font-medium">Overall Health</span>
              </div>
              <div className="text-2xl font-bold">
                {formatMetric(performanceData.overallHealth, 'percentage')}
              </div>
            </div>
            
            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setState(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
              className={`p-2 rounded-lg transition-colors ${
                state.autoRefresh 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <RefreshCw className={`w-5 h-5 ${state.autoRefresh ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: 'performance' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                state.activeTab === 'performance'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Performance Metrics
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: 'effectiveness' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                state.activeTab === 'effectiveness'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Learning Effectiveness
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, activeTab: 'monitoring' }))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                state.activeTab === 'monitoring'
                  ? 'bg-white text-indigo-600'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              Real-Time Monitoring
            </button>
          </div>
        </div>

        {/* Time Window Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {(['1h', '24h', '7d', '30d'] as const).map((window) => (
              <button
                key={window}
                onClick={() => setState(prev => ({ ...prev, timeWindow: window }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  state.timeWindow === window
                    ? 'bg-white text-indigo-600'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {window}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={exportData}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
            
            <button
              onClick={handleOptimizeRouting}
              className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Target className="w-4 h-4" />
              <span className="text-sm">Optimize</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {state.activeTab === 'effectiveness' ? (
          <ModelEffectivenessDashboard
            userProfile={userProfile}
            className="border-0 shadow-none"
          />
        ) : state.activeTab === 'monitoring' ? (
          <RealTimeMonitoringDashboard
            userProfile={userProfile}
            className="border-0 shadow-none"
          />
        ) : performanceData.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Alerts */}
            {performanceData.alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Performance Alerts</h3>
                </div>
                <div className="space-y-2">
                  {performanceData.alerts.map((alert, index) => (
                    <div key={index} className="text-sm text-red-800">
                      • {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Performance Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Model Performance Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(performanceData.modelPerformance).map(([modelId, performance]) => (
                  <ModelPerformanceCard
                    key={modelId}
                    modelId={modelId}
                    performance={performance}
                    isSelected={state.selectedModel === modelId}
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      selectedModel: prev.selectedModel === modelId ? null : modelId 
                    }))}
                  />
                ))}
              </div>
            </div>

            {/* Use Case Performance */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Use Case Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(performanceData.useCasePerformance).map(([useCase, performance]) => (
                  <UseCasePerformanceCard
                    key={useCase}
                    useCase={useCase}
                    performance={performance}
                    isSelected={state.selectedUseCase === useCase}
                    onClick={() => setState(prev => ({ 
                      ...prev, 
                      selectedUseCase: prev.selectedUseCase === useCase ? null : useCase 
                    }))}
                  />
                ))}
              </div>
            </div>

            {/* Optimization Recommendations */}
            {state.showOptimizations && performanceData.recommendations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
                <div className="space-y-4">
                  {performanceData.recommendations.slice(0, 5).map((recommendation, index) => (
                    <OptimizationRecommendationCard
                      key={index}
                      recommendation={recommendation}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Model Comparisons */}
            {state.showComparisons && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Model Comparisons</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ModelComparisonInterface
                    availableModels={Object.keys(performanceData.modelPerformance)}
                    availableUseCases={Object.keys(performanceData.useCasePerformance)}
                    onCompare={loadModelComparison}
                    comparisonResults={comparisonResults}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Last updated: {performanceData.lastUpdated.toLocaleTimeString()}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setState(prev => ({ ...prev, showOptimizations: !prev.showOptimizations }))}
              className={`text-sm ${state.showOptimizations ? 'text-indigo-600' : 'text-gray-500'}`}
            >
              Optimizations
            </button>
            <button
              onClick={() => setState(prev => ({ ...prev, showComparisons: !prev.showComparisons }))}
              className={`text-sm ${state.showComparisons ? 'text-indigo-600' : 'text-gray-500'}`}
            >
              Comparisons
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Model Performance Card Component
interface ModelPerformanceCardProps {
  modelId: string
  performance: any
  isSelected: boolean
  onClick: () => void
}

function ModelPerformanceCard({ modelId, performance, isSelected, onClick }: ModelPerformanceCardProps) {
  const getTrendIcon = (value: number) => {
    if (value > 0.1) return <ArrowUp className="w-4 h-4 text-green-500" />
    if (value < -0.1) return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-indigo-500 bg-indigo-50' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{modelId}</h4>
        <div className={`w-3 h-3 rounded-full ${
          performance.health >= 0.8 ? 'bg-green-500' :
          performance.health >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Requests</span>
          <span className="text-sm font-medium">{performance.requestCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Response</span>
          <div className="flex items-center space-x-1">
            {getTrendIcon(Math.random() - 0.5)}
            <span className="text-sm font-medium">{performance.avgResponseTime?.toFixed(0)}ms</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Satisfaction</span>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-sm font-medium">{(performance.avgSatisfaction * 100)?.toFixed(0)}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Cost</span>
          <span className="text-sm font-medium">${performance.totalCost?.toFixed(3)}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Use Case Performance Card Component
interface UseCasePerformanceCardProps {
  useCase: string
  performance: any
  isSelected: boolean
  onClick: () => void
}

function UseCasePerformanceCard({ useCase, performance, isSelected, onClick }: UseCasePerformanceCardProps) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-purple-500 bg-purple-50' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 capitalize">{useCase.replace('_', ' ')}</h4>
        <Activity className="w-5 h-5 text-purple-500" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Volume</span>
          <span className="text-sm font-medium">{performance.requestCount}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg Response</span>
          <span className="text-sm font-medium">{performance.avgResponseTime?.toFixed(0)}ms</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Learning Effect</span>
          <span className="text-sm font-medium">{(performance.learningEffectiveness * 100)?.toFixed(0)}%</span>
        </div>
        
        <div className="text-xs text-gray-500 mt-3">
          Top models: {performance.topModels?.slice(0, 2).join(', ')}
        </div>
      </div>
    </motion.div>
  )
}

// Optimization Recommendation Card Component
interface OptimizationRecommendationCardProps {
  recommendation: ModelOptimizationRecommendation
}

function OptimizationRecommendationCard({ recommendation }: OptimizationRecommendationCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-700'
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-700'
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700'
      default: return 'border-blue-500 bg-blue-50 text-blue-700'
    }
  }

  const getOptimizationIcon = (type: string) => {
    switch (type) {
      case 'model_switching': return <Cpu className="w-5 h-5" />
      case 'prompt_optimization': return <Settings className="w-5 h-5" />
      case 'parameter_tuning': return <Gauge className="w-5 h-5" />
      case 'fallback_routing': return <Target className="w-5 h-5" />
      default: return <Brain className="w-5 h-5" />
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getPriorityColor(recommendation.priority)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {getOptimizationIcon(recommendation.optimizationType)}
          <div>
            <h4 className="font-semibold capitalize">
              {recommendation.optimizationType.replace('_', ' ')}
            </h4>
            <p className="text-sm opacity-75">
              Expected improvement: {(recommendation.expectedImprovement * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        
        <div className={`px-2 py-1 rounded text-xs font-medium capitalize ${
          recommendation.priority === 'critical' ? 'bg-red-100' :
          recommendation.priority === 'high' ? 'bg-orange-100' :
          recommendation.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
        }`}>
          {recommendation.priority}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="opacity-75">Affected Users:</span>
          <div className="font-medium">{recommendation.affectedUsers}</div>
        </div>
        <div>
          <span className="opacity-75">Cost Impact:</span>
          <div className="font-medium">{(recommendation.costImpact * 100).toFixed(0)}%</div>
        </div>
        <div>
          <span className="opacity-75">Implementation:</span>
          <div className="font-medium capitalize">{recommendation.implementationEffort}</div>
        </div>
        <div>
          <span className="opacity-75">Risk Level:</span>
          <div className="font-medium capitalize">{recommendation.riskLevel}</div>
        </div>
      </div>

      {recommendation.alternativeModels && (
        <div className="mt-3 text-sm">
          <span className="opacity-75">Alternative models: </span>
          <span className="font-medium">{recommendation.alternativeModels.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

// Model Comparison Interface Component
interface ModelComparisonInterfaceProps {
  availableModels: string[]
  availableUseCases: string[]
  onCompare: (modelA: string, modelB: string, useCase: string) => void
  comparisonResults: ModelComparisonResult[]
}

function ModelComparisonInterface({ 
  availableModels, 
  availableUseCases, 
  onCompare, 
  comparisonResults 
}: ModelComparisonInterfaceProps) {
  const [modelA, setModelA] = useState('')
  const [modelB, setModelB] = useState('')
  const [useCase, setUseCase] = useState('')

  const handleCompare = () => {
    if (modelA && modelB && useCase) {
      onCompare(modelA, modelB, useCase)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <select
          value={modelA}
          onChange={(e) => setModelA(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Model A</option>
          {availableModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <select
          value={modelB}
          onChange={(e) => setModelB(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Model B</option>
          {availableModels.filter(m => m !== modelA).map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <select
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select Use Case</option>
          {availableUseCases.map(uc => (
            <option key={uc} value={uc}>{uc.replace('_', ' ')}</option>
          ))}
        </select>

        <button
          onClick={handleCompare}
          disabled={!modelA || !modelB || !useCase}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded transition-colors"
        >
          Compare
        </button>
      </div>

      {comparisonResults.length > 0 && (
        <div className="space-y-3">
          {comparisonResults.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">
                  {result.modelA} vs {result.modelB} ({result.useCase.replace('_', ' ')})
                </h4>
                <div className={`px-2 py-1 rounded text-sm font-medium ${
                  result.pValue < 0.05 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {result.pValue < 0.05 ? 'Significant' : 'Not Significant'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Response Time:</span>
                  <div className="font-medium">{result.responsTimeDelta > 0 ? '+' : ''}{result.responsTimeDelta.toFixed(0)}ms</div>
                </div>
                <div>
                  <span className="text-gray-600">Quality Score:</span>
                  <div className="font-medium">{result.qualityScoreDelta > 0 ? '+' : ''}{(result.qualityScoreDelta * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Satisfaction:</span>
                  <div className="font-medium">{result.satisfactionDelta > 0 ? '+' : ''}{(result.satisfactionDelta * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-gray-600">Recommended:</span>
                  <div className="font-medium">{result.recommendedModel}</div>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <strong>Reasoning:</strong> {result.reasoning.join(', ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
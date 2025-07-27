'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  Settings, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Lightbulb,
  Target,
  Shield,
  Zap,
  Clock,
  Users,
  Eye,
  RefreshCw,
  Download,
  Play,
  Pause,
  Sliders
} from 'lucide-react'
import useCognitiveLoadAssessment, { useCognitiveLoadConfiguration } from '@/hooks/useCognitiveLoadAssessment'

interface CognitiveLoadDashboardProps {
  userId: string
  contentId?: string
  sessionId?: string
  className?: string
}

export default function CognitiveLoadDashboard({ 
  userId, 
  contentId, 
  sessionId,
  className = '' 
}: CognitiveLoadDashboardProps) {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'optimization' | 'insights' | 'configuration'>('monitoring')
  const [autoMonitoring, setAutoMonitoring] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    measurements,
    currentMeasurement,
    userProfile,
    currentOptimization,
    loadInsights,
    patterns,
    recommendations,
    isMeasuring,
    isOptimizing,
    isAnalyzing,
    error,
    warnings,
    realTimeMonitoring,
    currentLoadMetrics,
    loadInsightsSummary,
    patternInsights,
    optimizationInsights,
    monitoringStatus,
    measureCognitiveLoad,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    optimizeCognitiveLoad,
    analyzeLoadPatterns,
    getOptimizationRecommendations,
    configureLoadMonitoring,
    exportLoadData,
    clearError,
    clearWarnings
  } = useCognitiveLoadAssessment()

  const {
    configuration,
    isValid: configurationValid,
    validationErrors,
    updateConfiguration,
    resetConfiguration
  } = useCognitiveLoadConfiguration()

  // Handle auto-monitoring toggle
  const handleAutoMonitoringToggle = async () => {
    if (!autoMonitoring && contentId && sessionId) {
      try {
        await startRealTimeMonitoring({
          user_id: userId,
          content_id: contentId,
          session_id: sessionId
        }, configuration.monitoring_frequency * 1000)
        setAutoMonitoring(true)
      } catch (error) {
        console.error('Failed to start monitoring:', error)
      }
    } else {
      stopRealTimeMonitoring()
      setAutoMonitoring(false)
    }
  }

  // Manual measurement
  const handleManualMeasurement = async () => {
    if (!contentId || !sessionId) return

    try {
      await measureCognitiveLoad({
        user_id: userId,
        content_id: contentId,
        session_id: sessionId,
        behavioral_data: generateMockBehavioralData(),
        contextual_data: generateMockContextualData()
      })
    } catch (error) {
      console.error('Failed to measure cognitive load:', error)
    }
  }

  // Trigger optimization
  const handleOptimization = async () => {
    if (!currentMeasurement || !userProfile) return

    try {
      await optimizeCognitiveLoad({
        user_profile: userProfile,
        current_content: {
          content_id: contentId || '',
          content_type: 'educational',
          complexity_level: 5,
          estimated_intrinsic_load: 60,
          learning_objectives: ['understand concepts', 'apply knowledge'],
          prerequisite_knowledge: [],
          content_modalities: ['visual', 'text']
        },
        learning_context: {
          session_goal: 'learning',
          time_constraints: 60,
          current_energy_level: 80,
          environmental_factors: [],
          previous_session_performance: null,
          learning_urgency: 'medium' as const
        },
        current_measurements: [currentMeasurement],
        optimization_goals: {
          target_load_level: 70,
          maximize_learning_efficiency: true,
          minimize_cognitive_strain: true,
          optimize_for_retention: true,
          maintain_engagement: true,
          prevent_overload: true
        }
      })
    } catch (error) {
      console.error('Failed to optimize cognitive load:', error)
    }
  }

  // Load pattern analysis
  const handlePatternAnalysis = async () => {
    try {
      await analyzeLoadPatterns(userId, '7_days', 'comprehensive')
    } catch (error) {
      console.error('Failed to analyze patterns:', error)
    }
  }

  const tabs = [
    { id: 'monitoring', label: 'Real-Time Monitoring', icon: Activity },
    { id: 'optimization', label: 'Load Optimization', icon: TrendingUp },
    { id: 'insights', label: 'Insights & Patterns', icon: BarChart3 },
    { id: 'configuration', label: 'Configuration', icon: Settings }
  ]

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Cognitive Load Assessment</h2>
              <p className="text-sm text-gray-600">Real-time learning optimization and monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status indicators */}
            {realTimeMonitoring && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">Live</span>
              </div>
            )}
            
            {warnings.length > 0 && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 rounded-full">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">{warnings.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
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

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'monitoring' && (
            <motion.div
              key="monitoring"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Monitoring Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleAutoMonitoringToggle}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      autoMonitoring
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {autoMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{autoMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}</span>
                  </button>

                  <button
                    onClick={handleManualMeasurement}
                    disabled={isMeasuring || !contentId || !sessionId}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isMeasuring ? 'animate-spin' : ''}`} />
                    <span>Manual Measure</span>
                  </button>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Frequency: {configuration.monitoring_frequency}s</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4" />
                    <span>Measurements: {measurements.length}</span>
                  </div>
                </div>
              </div>

              {/* Current Load Metrics */}
              {currentLoadMetrics && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <LoadMetricCard
                    title="Total Load"
                    value={currentLoadMetrics.totalLoad}
                    threshold={currentLoadMetrics.optimalThreshold}
                    color="purple"
                    icon={Brain}
                  />
                  <LoadMetricCard
                    title="Intrinsic Load"
                    value={currentLoadMetrics.intrinsicLoad}
                    threshold={70}
                    color="blue"
                    icon={Target}
                  />
                  <LoadMetricCard
                    title="Extraneous Load"
                    value={currentLoadMetrics.extraneousLoad}
                    threshold={30}
                    color="orange"
                    icon={AlertTriangle}
                    lower={true}
                  />
                  <LoadMetricCard
                    title="Germane Load"
                    value={currentLoadMetrics.germaneLoad}
                    threshold={60}
                    color="green"
                    icon={Lightbulb}
                  />
                  <LoadMetricCard
                    title="Load Efficiency"
                    value={currentLoadMetrics.loadEfficiency}
                    threshold={75}
                    color="teal"
                    icon={Zap}
                  />
                  <LoadMetricCard
                    title="Optimal Threshold"
                    value={currentLoadMetrics.optimalThreshold}
                    threshold={currentLoadMetrics.optimalThreshold}
                    color="gray"
                    icon={Shield}
                  />
                </div>
              )}

              {/* Load Insights Summary */}
              {loadInsightsSummary && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Assessment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Load Level</p>
                      <p className="text-lg text-purple-600">{loadInsightsSummary.levelAssessment}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Efficiency Score</p>
                      <p className="text-lg text-purple-600">{loadInsightsSummary.efficiencyScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Overload Risk</p>
                      <p className="text-lg text-purple-600">{loadInsightsSummary.overloadRisk}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Optimization Opportunities</p>
                      <p className="text-lg text-purple-600">{loadInsightsSummary.optimizationOpportunities}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warnings and Alerts */}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Alerts & Warnings</h3>
                  {warnings.map((warning, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-700">{warning}</span>
                      </div>
                      <button
                        onClick={clearWarnings}
                        className="text-orange-500 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'optimization' && (
            <motion.div
              key="optimization"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Optimization Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleOptimization}
                    disabled={isOptimizing || !currentMeasurement}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
                    <span>Optimize Load</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (currentMeasurement && userProfile) {
                        await getOptimizationRecommendations({
                          current_load: currentMeasurement,
                          user_profile: userProfile
                        })
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span>Get Recommendations</span>
                  </button>
                </div>
              </div>

              {/* Optimization Results */}
              {optimizationInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-medium text-gray-700">Strategies</h4>
                    <p className="text-2xl font-bold text-purple-600">{optimizationInsights.strategyCount}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-medium text-gray-700">Load Reduction</h4>
                    <p className="text-2xl font-bold text-green-600">{optimizationInsights.expectedLoadReduction.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-gray-700">Efficiency Gain</h4>
                    <p className="text-2xl font-bold text-blue-600">{optimizationInsights.averageEfficiencyImprovement.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="text-sm font-medium text-gray-700">Interventions</h4>
                    <p className="text-2xl font-bold text-orange-600">{optimizationInsights.interventionProtocolCount}</p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {recommendations && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimization Recommendations</h3>
                  <div className="space-y-2">
                    {recommendations.recommendations?.slice(0, 5).map((rec: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Analysis Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePatternAnalysis}
                    disabled={isAnalyzing}
                    className="flex items-center space-x-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
                  >
                    <BarChart3 className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                    <span>Analyze Patterns</span>
                  </button>

                  <button
                    onClick={() => exportLoadData(userId, 'json')}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Sliders className="w-4 h-4" />
                  <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
                </button>
              </div>

              {/* Pattern Insights */}
              {patternInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Temporal Patterns</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Daily Cycles</span>
                        <span className={`text-sm font-medium ${patternInsights.dailyPatterns ? 'text-green-600' : 'text-gray-400'}`}>
                          {patternInsights.dailyPatterns ? 'Identified' : 'Not Available'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Weekly Variations</span>
                        <span className={`text-sm font-medium ${patternInsights.weeklyVariations ? 'text-green-600' : 'text-gray-400'}`}>
                          {patternInsights.weeklyVariations ? 'Identified' : 'Not Available'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Patterns</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Content Patterns</span>
                        <span className={`text-sm font-medium ${patternInsights.contentPatterns ? 'text-blue-600' : 'text-gray-400'}`}>
                          {patternInsights.contentPatterns ? 'Analyzed' : 'Not Available'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Behavioral Patterns</span>
                        <span className={`text-sm font-medium ${patternInsights.behavioralPatterns ? 'text-blue-600' : 'text-gray-400'}`}>
                          {patternInsights.behavioralPatterns ? 'Analyzed' : 'Not Available'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Insights */}
              {showAdvanced && patterns && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Advanced Pattern Analysis</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Daily Load Cycles */}
                    {patterns.temporal_patterns?.daily_load_cycles && (
                      <div className="p-3 bg-white rounded border">
                        <h4 className="font-medium text-gray-800 mb-2">Daily Load Cycles</h4>
                        <div className="space-y-1">
                          {patterns.temporal_patterns.daily_load_cycles.slice(0, 4).map((cycle: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600">{cycle.time}</span>
                              <span className="text-gray-800">Load: {cycle.load}% | Efficiency: {cycle.efficiency}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Weekly Variations */}
                    {patterns.temporal_patterns?.weekly_variations && (
                      <div className="p-3 bg-white rounded border">
                        <h4 className="font-medium text-gray-800 mb-2">Weekly Variations</h4>
                        <div className="space-y-1">
                          {Object.entries(patterns.temporal_patterns.weekly_variations).slice(0, 5).map(([day, data]: [string, any]) => (
                            <div key={day} className="flex justify-between text-sm">
                              <span className="text-gray-600 capitalize">{day}</span>
                              <span className="text-gray-800">Load: {data.avg_load}% | Efficiency: {data.efficiency}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'configuration' && (
            <motion.div
              key="configuration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Configuration Form */}
              <div className="space-y-6">
                {/* Monitoring Settings */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monitoring Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Measurement Frequency (seconds)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={configuration.monitoring_frequency}
                        onChange={(e) => updateConfiguration('monitoring_frequency', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Alert Thresholds */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overload Warning (%)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="100"
                        value={configuration.alert_thresholds.overload_warning}
                        onChange={(e) => updateConfiguration('alert_thresholds', {
                          ...configuration.alert_thresholds,
                          overload_warning: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Overload Critical (%)
                      </label>
                      <input
                        type="number"
                        min="60"
                        max="100"
                        value={configuration.alert_thresholds.overload_critical}
                        onChange={(e) => updateConfiguration('alert_thresholds', {
                          ...configuration.alert_thresholds,
                          overload_critical: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Configuration Errors:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Configuration Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={resetConfiguration}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Reset to Defaults
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (configurationValid) {
                        await configureLoadMonitoring(userId, configuration)
                      }
                    }}
                    disabled={!configurationValid}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper component for load metric cards
interface LoadMetricCardProps {
  title: string
  value: number
  threshold: number
  color: string
  icon: React.ComponentType<any>
  lower?: boolean
}

function LoadMetricCard({ title, value, threshold, color, icon: Icon, lower = false }: LoadMetricCardProps) {
  const isGood = lower ? value <= threshold : value >= threshold * 0.8 && value <= threshold * 1.2
  const isWarning = lower ? value > threshold && value <= threshold * 1.5 : value > threshold * 1.2 || value < threshold * 0.6
  const isCritical = lower ? value > threshold * 1.5 : value > threshold * 1.5 || value < threshold * 0.4

  const getStatusColor = () => {
    if (isCritical) return 'red'
    if (isWarning) return 'orange'
    if (isGood) return 'green'
    return color
  }

  const statusColor = getStatusColor()

  return (
    <div className={`p-4 bg-${statusColor}-50 rounded-lg border border-${statusColor}-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">{title}</p>
          <p className={`text-2xl font-bold text-${statusColor}-600`}>{value}%</p>
          <p className="text-xs text-gray-500">Target: {threshold}%</p>
        </div>
        <Icon className={`w-8 h-8 text-${statusColor}-500`} />
      </div>
    </div>
  )
}

// Helper functions for generating mock data
function generateMockBehavioralData() {
  return {
    interaction_frequency: 10 + Math.random() * 20,
    response_time: 1000 + Math.random() * 2000,
    error_rate: Math.random() * 0.3,
    help_seeking: Math.random() * 5,
    scroll_velocity: 100 + Math.random() * 200,
    pause_frequency: Math.random() * 10
  }
}

function generateMockContextualData() {
  return {
    time_of_day: new Date().toISOString(),
    session_duration: 15 + Math.random() * 45,
    device_type: 'desktop',
    environmental_distractions: 20 + Math.random() * 40,
    user_energy_level: 60 + Math.random() * 40
  }
}
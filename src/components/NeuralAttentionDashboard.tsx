'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useNeuralAttentionTracking,
  useNeuralAttentionConfiguration
} from '@/hooks/useNeuralAttentionTracking'

// Dashboard component with four main tabs
export default function NeuralAttentionDashboard() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [userId] = useState('demo_user_001') // Demo user ID

  const {
    measurements,
    currentMeasurement,
    attentionProfile,
    focusOptimizations,
    distractionMitigations,
    attentionPatterns,
    attentionTrends,
    attentionInsights,
    focusRecommendations,
    realTimeTracking,
    attentionMetrics,
    currentAttentionMetrics,
    profileInsights,
    optimizationStatus,
    distractionStatus,
    warningIndicators,
    isProcessing,
    error,
    warnings,
    measureAttention,
    startRealTimeTracking,
    stopRealTimeTracking,
    optimizeFocus,
    mitigateDistractions,
    analyzeAttentionPatterns,
    createAttentionProfile,
    updateAttentionProfile,
    getFocusRecommendations,
    trackAttentionTrends,
    generateAttentionInsights,
    clearError,
    clearWarnings
  } = useNeuralAttentionTracking()

  const {
    configuration,
    isValid: configValid,
    validationErrors,
    updateConfiguration,
    resetConfiguration
  } = useNeuralAttentionConfiguration()

  const tabs = [
    { id: 'monitoring', label: 'Real-Time Monitoring', icon: '📊' },
    { id: 'optimization', label: 'Focus Optimization', icon: '🎯' },
    { id: 'insights', label: 'Attention Insights', icon: '🧠' },
    { id: 'configuration', label: 'Configuration', icon: '⚙️' }
  ]

  // Auto-create profile and start monitoring on component mount
  useEffect(() => {
    if (!attentionProfile) {
      createAttentionProfile({
        user_id: userId,
        behavioral_data: {
          baseline_focus_duration: 25, // minutes
          typical_distraction_frequency: 3, // per hour
          learning_preferences: ['visual', 'interactive'],
          optimal_session_length: 45 // minutes
        },
        learning_preferences: {
          content_types: ['video', 'interactive', 'text'],
          difficulty_preference: 'progressive',
          feedback_frequency: 'regular'
        }
      })
    }
  }, [attentionProfile, createAttentionProfile, userId])

  const handleToggleTracking = async () => {
    try {
      if (realTimeTracking) {
        stopRealTimeTracking()
      } else {
        await startRealTimeTracking(userId, configuration.measurement_settings.tracking_frequency * 1000)
      }
    } catch (error) {
      console.error('Error toggling tracking:', error)
    }
  }

  const handleManualMeasurement = async () => {
    try {
      await measureAttention({
        user_id: userId,
        behavioral_data: {
          mouse_activity: { velocity: 75, precision: 88 },
          scroll_behavior: { consistency: 82, pauses: 5 },
          keyboard_activity: { typing_speed: 65, rhythm: 78 },
          window_focus: { duration: 120, switches: 2 }
        },
        contextual_info: {
          current_task: 'learning',
          session_duration: 15,
          content_type: 'interactive'
        }
      })
    } catch (error) {
      console.error('Error measuring attention:', error)
    }
  }

  const handleOptimizeFocus = async () => {
    if (!currentMeasurement) return

    try {
      await optimizeFocus({
        user_id: userId,
        current_attention_state: currentMeasurement,
        optimization_goals: ['improve_focus_stability', 'reduce_distractions', 'enhance_concentration'],
        context: {
          learning_session: true,
          current_content: 'interactive_lesson',
          time_constraints: { session_length: 30 }
        }
      })
    } catch (error) {
      console.error('Error optimizing focus:', error)
    }
  }

  const handleMitigateDistractions = async () => {
    try {
      await mitigateDistractions({
        user_id: userId,
        distraction_data: {
          detected_distractions: ['external_noise', 'notifications', 'environment'],
          distraction_frequency: 4,
          distraction_impact: 'medium',
          recovery_time: 45 // seconds
        },
        mitigation_preferences: {
          strategy_preference: 'adaptive',
          intervention_style: 'gentle',
          environment_control: 'automatic'
        }
      })
    } catch (error) {
      console.error('Error mitigating distractions:', error)
    }
  }

  const handleAnalyzePatterns = async () => {
    try {
      await analyzeAttentionPatterns({
        user_id: userId,
        analysis_timeframe: '24_hours',
        pattern_focus: ['focus_cycles', 'distraction_patterns', 'optimal_times'],
        analysis_depth: 'comprehensive'
      })
    } catch (error) {
      console.error('Error analyzing patterns:', error)
    }
  }

  const handleGenerateInsights = async () => {
    if (!attentionProfile) return

    try {
      await generateAttentionInsights({
        user_id: userId,
        analysis_data: {
          attention_measurements: measurements.slice(0, 10),
          focus_optimizations: focusOptimizations.slice(0, 5),
          attention_patterns: attentionPatterns
        },
        insight_focus: 'comprehensive',
        depth_level: 'detailed'
      })
    } catch (error) {
      console.error('Error generating insights:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Neural Attention Tracking & Focus Optimization
        </h1>
        <p className="text-gray-600">
          Real-time attention measurement, focus enhancement, and distraction mitigation
        </p>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings Display */}
      <AnimatePresence>
        {warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-yellow-600">⚠️</span>
                <span className="text-yellow-800 font-medium">
                  {warnings.length} warning{warnings.length > 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={clearWarnings}
                className="text-yellow-600 hover:text-yellow-800 font-medium"
              >
                Clear All
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-yellow-700 text-sm">
                  • {warning}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Attention Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Attention Score</h3>
              <p className="text-3xl font-bold text-blue-600">
                {currentAttentionMetrics?.overallScore?.toFixed(0) || '--'}
              </p>
              <p className="text-sm text-gray-500">
                {currentAttentionMetrics?.overallScore 
                  ? currentAttentionMetrics.overallScore >= 80 
                    ? 'Excellent Focus'
                    : currentAttentionMetrics.overallScore >= 60
                    ? 'Good Focus'
                    : 'Needs Improvement'
                  : 'No data'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Focus Stability */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Focus Stability</h3>
              <p className="text-3xl font-bold text-green-600">
                {currentAttentionMetrics?.focusStability?.toFixed(0) || '--'}
              </p>
              <p className="text-sm text-gray-500">
                {profileInsights?.optimalFocusDuration || '--'} min optimal
              </p>
            </div>
          </div>
        </motion.div>

        {/* Distraction Level */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-2xl">🚫</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Distraction Level</h3>
              <p className="text-3xl font-bold text-orange-600">
                {currentAttentionMetrics?.distractionLevel?.toFixed(0) || '--'}
              </p>
              <p className="text-sm text-gray-500">
                {distractionStatus.vulnerabilityLevel} susceptibility
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tracking Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${realTimeTracking ? 'bg-green-100' : 'bg-gray-100'}`}>
              <span className="text-2xl">{realTimeTracking ? '📡' : '📴'}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tracking Status</h3>
              <p className={`text-lg font-bold ${realTimeTracking ? 'text-green-600' : 'text-gray-600'}`}>
                {realTimeTracking ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-gray-500">
                {measurements.length} measurements
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'monitoring' && (
              <RealTimeMonitoringTab
                key="monitoring"
                measurements={measurements}
                currentMeasurement={currentMeasurement}
                attentionMetrics={attentionMetrics}
                currentAttentionMetrics={currentAttentionMetrics}
                realTimeTracking={realTimeTracking}
                warningIndicators={warningIndicators}
                onToggleTracking={handleToggleTracking}
                onManualMeasurement={handleManualMeasurement}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'optimization' && (
              <FocusOptimizationTab
                key="optimization"
                focusOptimizations={focusOptimizations}
                distractionMitigations={distractionMitigations}
                focusRecommendations={focusRecommendations}
                optimizationStatus={optimizationStatus}
                distractionStatus={distractionStatus}
                profileInsights={profileInsights}
                onOptimizeFocus={handleOptimizeFocus}
                onMitigateDistractions={handleMitigateDistractions}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'insights' && (
              <AttentionInsightsTab
                key="insights"
                attentionPatterns={attentionPatterns}
                attentionTrends={attentionTrends}
                attentionInsights={attentionInsights}
                profileInsights={profileInsights}
                measurements={measurements}
                onAnalyzePatterns={handleAnalyzePatterns}
                onGenerateInsights={handleGenerateInsights}
                isProcessing={isProcessing}
              />
            )}

            {activeTab === 'configuration' && (
              <ConfigurationTab
                key="configuration"
                configuration={configuration}
                updateConfiguration={updateConfiguration}
                resetConfiguration={resetConfiguration}
                isValid={configValid}
                validationErrors={validationErrors}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// Real-Time Monitoring Tab Component
function RealTimeMonitoringTab({
  measurements,
  currentMeasurement,
  attentionMetrics,
  currentAttentionMetrics,
  realTimeTracking,
  warningIndicators,
  onToggleTracking,
  onManualMeasurement,
  isProcessing
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Control Panel */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attention Monitoring Controls</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onToggleTracking}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              realTimeTracking
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {realTimeTracking ? '🛑 Stop Tracking' : '▶️ Start Tracking'}
          </button>
          
          <button
            onClick={onManualMeasurement}
            disabled={isProcessing}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📊 Manual Measurement
          </button>
        </div>
      </div>

      {/* Current Measurement Display */}
      {currentMeasurement && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Attention State</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {currentAttentionMetrics?.overallScore?.toFixed(0) || 0}
              </p>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {currentAttentionMetrics?.focusStability?.toFixed(0) || 0}
              </p>
              <p className="text-sm text-gray-600">Focus Stability</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {currentAttentionMetrics?.distractionLevel?.toFixed(0) || 0}
              </p>
              <p className="text-sm text-gray-600">Distraction Level</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {currentAttentionMetrics?.cognitiveLoad?.toFixed(0) || 0}
              </p>
              <p className="text-sm text-gray-600">Cognitive Load</p>
            </div>
          </div>
        </div>
      )}

      {/* Measurement History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Measurements ({measurements.length})
        </h3>
        
        {measurements.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {measurements.slice(0, 10).map((measurement, index) => (
              <div
                key={measurement.measurement_id || index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    measurement.overall_attention_score >= 80 ? 'bg-green-500' :
                    measurement.overall_attention_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">Score: {measurement.overall_attention_score.toFixed(0)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(measurement.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Focus: {measurement.behavioral_indicators.focus_stability?.toFixed(0) || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    Load: {measurement.cognitive_indicators.cognitive_load?.toFixed(0) || 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">📊</span>
            <p>No measurements recorded yet</p>
            <p className="text-sm">Start tracking or take a manual measurement</p>
          </div>
        )}
      </div>

      {/* Warning Indicators */}
      {warningIndicators.hasWarnings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Attention Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${warningIndicators.attentionHealthy ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="font-medium">Attention Health</p>
              <p className={warningIndicators.attentionHealthy ? 'text-green-600' : 'text-red-600'}>
                {warningIndicators.attentionHealthy ? 'Good' : 'Needs Attention'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${warningIndicators.focusStable ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="font-medium">Focus Stability</p>
              <p className={warningIndicators.focusStable ? 'text-green-600' : 'text-red-600'}>
                {warningIndicators.focusStable ? 'Stable' : 'Unstable'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${warningIndicators.distractionManaged ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="font-medium">Distraction Control</p>
              <p className={warningIndicators.distractionManaged ? 'text-green-600' : 'text-red-600'}>
                {warningIndicators.distractionManaged ? 'Controlled' : 'High Distraction'}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// Focus Optimization Tab Component
function FocusOptimizationTab({
  focusOptimizations,
  distractionMitigations,
  focusRecommendations,
  optimizationStatus,
  distractionStatus,
  profileInsights,
  onOptimizeFocus,
  onMitigateDistractions,
  isProcessing
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Optimization Controls */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Enhancement Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onOptimizeFocus}
            disabled={isProcessing}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🎯</span>
            <span>Optimize Focus</span>
          </button>
          
          <button
            onClick={onMitigateDistractions}
            disabled={isProcessing}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>🚫</span>
            <span>Mitigate Distractions</span>
          </button>
        </div>
      </div>

      {/* Profile Insights */}
      {profileInsights && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Attention Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{profileInsights.attentionType}</p>
              <p className="text-sm text-gray-600">Attention Type</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{profileInsights.optimalFocusDuration} min</p>
              <p className="text-sm text-gray-600">Optimal Duration</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{profileInsights.distractionSusceptibility}</p>
              <p className="text-sm text-gray-600">Distraction Risk</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{profileInsights.attentionFluctuations}</p>
              <p className="text-sm text-gray-600">Fluctuation Pattern</p>
            </div>
          </div>
        </div>
      )}

      {/* Focus Optimizations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Focus Optimizations ({focusOptimizations.length})
        </h3>
        
        {focusOptimizations.length > 0 ? (
          <div className="space-y-4">
            {focusOptimizations.slice(0, 5).map((optimization, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Optimization Strategy #{index + 1}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {optimization.timestamp ? new Date(optimization.timestamp).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Strategies:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {optimization.optimization_strategies?.slice(0, 3).map((strategy: string, i: number) => (
                          <li key={i}>{strategy}</li>
                        )) || ['Focus enhancement techniques applied']}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Expected Outcomes:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {optimization.expected_outcomes?.slice(0, 3).map((outcome: string, i: number) => (
                          <li key={i}>{outcome}</li>
                        )) || ['Improved focus stability', 'Reduced distractions']}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">🎯</span>
            <p>No focus optimizations yet</p>
            <p className="text-sm">Click "Optimize Focus" to get personalized strategies</p>
          </div>
        )}
      </div>

      {/* Distraction Mitigations */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distraction Mitigations ({distractionMitigations.length})
        </h3>
        
        {distractionMitigations.length > 0 ? (
          <div className="space-y-4">
            {distractionMitigations.slice(0, 5).map((mitigation, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    Mitigation Plan #{index + 1}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {mitigation.timestamp ? new Date(mitigation.timestamp).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Strategies:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {mitigation.mitigation_strategies?.slice(0, 3).map((strategy: string, i: number) => (
                          <li key={i}>{strategy}</li>
                        )) || ['Environmental optimization', 'Attention training', 'Behavioral adjustments']}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Target Distractions:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {mitigation.target_distractions?.slice(0, 3).map((distraction: string, i: number) => (
                          <li key={i}>{distraction}</li>
                        )) || ['External noise', 'Digital notifications', 'Internal thoughts']}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-2 block">🚫</span>
            <p>No distraction mitigations yet</p>
            <p className="text-sm">Click "Mitigate Distractions" to get personalized strategies</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Attention Insights Tab Component
function AttentionInsightsTab({
  attentionPatterns,
  attentionTrends,
  attentionInsights,
  profileInsights,
  measurements,
  onAnalyzePatterns,
  onGenerateInsights,
  isProcessing
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Analysis Controls */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attention Analysis Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onAnalyzePatterns}
            disabled={isProcessing}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>📈</span>
            <span>Analyze Patterns</span>
          </button>
          
          <button
            onClick={onGenerateInsights}
            disabled={isProcessing}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>💡</span>
            <span>Generate Insights</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attention Analytics Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{measurements.length}</p>
            <p className="text-sm text-gray-600">Total Measurements</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {measurements.length > 0 
                ? (measurements.reduce((sum: number, m: any) => sum + m.overall_attention_score, 0) / measurements.length).toFixed(0)
                : '--'
              }
            </p>
            <p className="text-sm text-gray-600">Average Score</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{attentionPatterns.length}</p>
            <p className="text-sm text-gray-600">Pattern Analyses</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{attentionTrends.length}</p>
            <p className="text-sm text-gray-600">Trend Reports</p>
          </div>
        </div>
      </div>

      {/* Attention Insights */}
      {attentionInsights && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Attention Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Strengths & Challenges</h4>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">Core Strengths</p>
                  <ul className="text-sm text-green-700 list-disc list-inside">
                    {attentionInsights.attention_strengths_and_challenges?.core_attention_strengths?.slice(0, 3).map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    )) || ['Sustained focus capability', 'Quick attention recovery', 'Environmental adaptation']}
                  </ul>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm font-medium text-orange-800">Key Challenges</p>
                  <ul className="text-sm text-orange-700 list-disc list-inside">
                    {attentionInsights.attention_strengths_and_challenges?.primary_attention_challenges?.slice(0, 3).map((challenge: string, i: number) => (
                      <li key={i}>{challenge}</li>
                    )) || ['Distraction susceptibility', 'Focus duration limits', 'Cognitive load management']}
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Optimization Insights</h4>
              <div className="space-y-2">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Focus Strategies</p>
                  <ul className="text-sm text-blue-700 list-disc list-inside">
                    {attentionInsights.focus_optimization_insights?.optimal_focus_strategies?.slice(0, 3).map((strategy: string, i: number) => (
                      <li key={i}>{strategy}</li>
                    )) || ['Pomodoro technique', 'Environmental control', 'Mindfulness practices']}
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Learning Optimization</p>
                  <ul className="text-sm text-purple-700 list-disc list-inside">
                    {attentionInsights.learning_performance_insights?.optimal_learning_conditions?.slice(0, 3).map((condition: string, i: number) => (
                      <li key={i}>{condition}</li>
                    )) || ['Morning peak hours', 'Quiet environment', 'Interactive content']}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Analysis */}
      {attentionPatterns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Pattern Analysis ({attentionPatterns.length})
          </h3>
          <div className="space-y-4">
            {attentionPatterns.slice(0, 3).map((pattern, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Analysis #{index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Temporal Patterns</p>
                    <p className="text-sm text-gray-600">
                      {pattern.temporal_attention_patterns?.peak_hours || 'Morning peak detected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Focus Duration</p>
                    <p className="text-sm text-gray-600">
                      {pattern.focus_duration_patterns?.average_duration || '25 minutes average'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Optimization Potential</p>
                    <p className="text-sm text-gray-600">
                      {pattern.attention_insights?.focus_enhancement_opportunities || 'High improvement potential'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Quick Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {measurements.length > 0 
                ? Math.max(...measurements.map((m: any) => m.overall_attention_score)).toFixed(0)
                : '--'
              }
            </p>
            <p className="text-sm text-gray-600">Peak Score</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">
              {measurements.length > 5 
                ? ((measurements.slice(0, 5).reduce((sum: number, m: any) => sum + m.overall_attention_score, 0) / 5) - 
                   (measurements.slice(-5).reduce((sum: number, m: any) => sum + m.overall_attention_score, 0) / 5)).toFixed(0)
                : '--'
              }
            </p>
            <p className="text-sm text-gray-600">Recent Trend</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-600">
              {profileInsights?.optimalFocusDuration || '--'}
            </p>
            <p className="text-sm text-gray-600">Optimal Duration</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-purple-600">
              {profileInsights?.distractionSusceptibility || '--'}
            </p>
            <p className="text-sm text-gray-600">Distraction Risk</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Configuration Tab Component
function ConfigurationTab({
  configuration,
  updateConfiguration,
  resetConfiguration,
  isValid,
  validationErrors
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium mb-2">Configuration Errors</h3>
          <ul className="text-red-700 text-sm space-y-1">
            {validationErrors.map((error: string, index: number) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Measurement Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Measurement Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Frequency (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={configuration.measurement_settings.tracking_frequency}
              onChange={(e) => updateConfiguration('measurement_settings', {
                tracking_frequency: parseInt(e.target.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Measurement Sensitivity
            </label>
            <select
              value={configuration.measurement_settings.measurement_sensitivity}
              onChange={(e) => updateConfiguration('measurement_settings', {
                measurement_sensitivity: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="behavioral-tracking"
              checked={configuration.measurement_settings.behavioral_tracking_enabled}
              onChange={(e) => updateConfiguration('measurement_settings', {
                behavioral_tracking_enabled: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="behavioral-tracking" className="ml-2 text-sm text-gray-700">
              Enable Behavioral Tracking
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="cognitive-assessment"
              checked={configuration.measurement_settings.cognitive_assessment_enabled}
              onChange={(e) => updateConfiguration('measurement_settings', {
                cognitive_assessment_enabled: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="cognitive-assessment" className="ml-2 text-sm text-gray-700">
              Enable Cognitive Assessment
            </label>
          </div>
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Optimization Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-optimization"
              checked={configuration.optimization_settings.auto_optimization_enabled}
              onChange={(e) => updateConfiguration('optimization_settings', {
                auto_optimization_enabled: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-optimization" className="ml-2 text-sm text-gray-700">
              Enable Auto-Optimization
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Aggressiveness
            </label>
            <select
              value={configuration.optimization_settings.optimization_aggressiveness}
              onChange={(e) => updateConfiguration('optimization_settings', {
                optimization_aggressiveness: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="gentle">Gentle</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Frequency
            </label>
            <select
              value={configuration.optimization_settings.optimization_frequency}
              onChange={(e) => updateConfiguration('optimization_settings', {
                optimization_frequency: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="continuous">Continuous</option>
              <option value="adaptive">Adaptive</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="focus-training"
              checked={configuration.optimization_settings.focus_training_enabled}
              onChange={(e) => updateConfiguration('optimization_settings', {
                focus_training_enabled: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="focus-training" className="ml-2 text-sm text-gray-700">
              Enable Focus Training
            </label>
          </div>
        </div>
      </div>

      {/* Distraction Mitigation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚫 Distraction Mitigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="real-time-detection"
              checked={configuration.distraction_mitigation.real_time_detection}
              onChange={(e) => updateConfiguration('distraction_mitigation', {
                real_time_detection: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="real-time-detection" className="ml-2 text-sm text-gray-700">
              Real-Time Detection
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-mitigation"
              checked={configuration.distraction_mitigation.auto_mitigation_enabled}
              onChange={(e) => updateConfiguration('distraction_mitigation', {
                auto_mitigation_enabled: e.target.checked
              })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto-mitigation" className="ml-2 text-sm text-gray-700">
              Auto-Mitigation
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervention Threshold
            </label>
            <select
              value={configuration.distraction_mitigation.intervention_threshold}
              onChange={(e) => updateConfiguration('distraction_mitigation', {
                intervention_threshold: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={resetConfiguration}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
        >
          Reset to Defaults
        </button>
        <div className="flex-1 flex items-center justify-end">
          <span className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? '✓ Configuration valid' : '⚠️ Please fix errors above'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
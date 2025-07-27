'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type CognitiveLoadMeasurement,
  type CognitiveLoadProfile,
  type CognitiveLoadOptimizationRequest,
  type OptimizedCognitiveLoad
} from '@/lib/cognitive-load-assessment'

interface CognitiveLoadAssessmentState {
  measurements: CognitiveLoadMeasurement[]
  currentMeasurement: CognitiveLoadMeasurement | null
  userProfile: CognitiveLoadProfile | null
  optimizations: OptimizedCognitiveLoad[]
  currentOptimization: OptimizedCognitiveLoad | null
  loadInsights: any | null
  patterns: any | null
  recommendations: any | null
  isMeasuring: boolean
  isOptimizing: boolean
  isAnalyzing: boolean
  isConfiguring: boolean
  error: string | null
  warnings: string[]
  realTimeMonitoring: boolean
  monitoringConfiguration: any | null
}

interface MeasurementParams {
  user_id: string
  content_id: string
  session_id: string
  behavioral_data?: any
  contextual_data?: any
}

interface OptimizationParams {
  user_profile: CognitiveLoadProfile
  current_content: any
  learning_context: any
  current_measurements: CognitiveLoadMeasurement[]
  optimization_goals: any
}

interface ProfileUpdateParams {
  user_id: string
  measurements: CognitiveLoadMeasurement[]
  performance_data?: any
}

interface OverloadDetectionParams {
  measurements: CognitiveLoadMeasurement[]
  user_profile: CognitiveLoadProfile
}

interface RecommendationParams {
  current_load: CognitiveLoadMeasurement
  user_profile: CognitiveLoadProfile
  learning_goals?: string[]
}

// Main hook for cognitive load assessment and optimization
export function useCognitiveLoadAssessment() {
  const [state, setState] = useState<CognitiveLoadAssessmentState>({
    measurements: [],
    currentMeasurement: null,
    userProfile: null,
    optimizations: [],
    currentOptimization: null,
    loadInsights: null,
    patterns: null,
    recommendations: null,
    isMeasuring: false,
    isOptimizing: false,
    isAnalyzing: false,
    isConfiguring: false,
    error: null,
    warnings: [],
    realTimeMonitoring: false,
    monitoringConfiguration: null
  })

  const measurementIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const monitoringTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Measure cognitive load in real-time
  const measureCognitiveLoad = useCallback(async (params: MeasurementParams) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isMeasuring: true, 
        error: null,
        warnings: []
      }))
      
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'measure_cognitive_load',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to measure cognitive load: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to measure cognitive load')
      }

      setState(prev => ({
        ...prev,
        measurements: [data.cognitive_load_measurement, ...prev.measurements.slice(0, 99)],
        currentMeasurement: data.cognitive_load_measurement,
        loadInsights: data.load_insights,
        isMeasuring: false,
        warnings: data.warnings || []
      }))

      return data.cognitive_load_measurement
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMeasuring: false,
        error: error instanceof Error ? error.message : 'Failed to measure cognitive load'
      }))
      throw error
    }
  }, [])

  // Start real-time monitoring
  const startRealTimeMonitoring = useCallback(async (
    params: MeasurementParams,
    interval: number = 30000 // 30 seconds default
  ) => {
    try {
      setState(prev => ({ ...prev, realTimeMonitoring: true }))

      const monitoringLoop = async () => {
        try {
          await measureCognitiveLoad(params)
          
          if (state.realTimeMonitoring) {
            measurementIntervalRef.current = setTimeout(monitoringLoop, interval)
          }
        } catch (error) {
          console.error('Error in real-time monitoring:', error)
          // Continue monitoring despite errors
          if (state.realTimeMonitoring) {
            measurementIntervalRef.current = setTimeout(monitoringLoop, interval * 2)
          }
        }
      }

      // Start monitoring
      monitoringLoop()

    } catch (error) {
      setState(prev => ({
        ...prev,
        realTimeMonitoring: false,
        error: error instanceof Error ? error.message : 'Failed to start real-time monitoring'
      }))
      throw error
    }
  }, [measureCognitiveLoad, state.realTimeMonitoring])

  // Stop real-time monitoring
  const stopRealTimeMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, realTimeMonitoring: false }))
    
    if (measurementIntervalRef.current) {
      clearTimeout(measurementIntervalRef.current)
      measurementIntervalRef.current = null
    }
  }, [])

  // Optimize cognitive load
  const optimizeCognitiveLoad = useCallback(async (params: OptimizationParams) => {
    try {
      setState(prev => ({ ...prev, isOptimizing: true, error: null }))
      
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_cognitive_load',
          optimization_request: params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to optimize cognitive load: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize cognitive load')
      }

      setState(prev => ({
        ...prev,
        optimizations: [data.optimized_cognitive_load, ...prev.optimizations.slice(0, 9)],
        currentOptimization: data.optimized_cognitive_load,
        isOptimizing: false
      }))

      return data.optimized_cognitive_load
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: error instanceof Error ? error.message : 'Failed to optimize cognitive load'
      }))
      throw error
    }
  }, [])

  // Update cognitive profile
  const updateCognitiveProfile = useCallback(async (params: ProfileUpdateParams) => {
    try {
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_cognitive_profile',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update cognitive profile: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update cognitive profile')
      }

      setState(prev => ({
        ...prev,
        userProfile: data.updated_profile
      }))

      return data.updated_profile
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update cognitive profile'
      }))
      throw error
    }
  }, [])

  // Detect cognitive overload
  const detectCognitiveOverload = useCallback(async (params: OverloadDetectionParams) => {
    try {
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'detect_cognitive_overload',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.overload_detection
        }
      }
    } catch (error) {
      console.error('Error detecting cognitive overload:', error)
    }
  }, [])

  // Get optimization recommendations
  const getOptimizationRecommendations = useCallback(async (params: RecommendationParams) => {
    try {
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_optimization_recommendations',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            recommendations: data.optimization_recommendations
          }))
          
          return data.optimization_recommendations
        }
      }
    } catch (error) {
      console.error('Error getting optimization recommendations:', error)
    }
  }, [])

  // Assess load effectiveness
  const assessLoadEffectiveness = useCallback(async (
    optimizationId: string,
    timeframe: string = '24_hours',
    metrics: string[] = []
  ) => {
    try {
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_load_effectiveness',
          optimization_id: optimizationId,
          timeframe,
          metrics
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.effectiveness_assessment
        }
      }
    } catch (error) {
      console.error('Error assessing load effectiveness:', error)
    }
  }, [])

  // Analyze load patterns
  const analyzeLoadPatterns = useCallback(async (
    userId: string,
    timeRange: string = '7_days',
    analysisDepth: string = 'standard'
  ) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }))
      
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_load_patterns',
          user_id: userId,
          time_range: timeRange,
          analysis_depth: analysisDepth
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            patterns: data.load_patterns,
            isAnalyzing: false
          }))
          
          return data.load_patterns
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }))
      console.error('Error analyzing load patterns:', error)
    }
  }, [])

  // Generate load insights
  const generateLoadInsights = useCallback(async (
    analysisData: any,
    insightType: string = 'comprehensive',
    focusAreas: string[] = []
  ) => {
    try {
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_load_insights',
          analysis_data: analysisData,
          insight_type: insightType,
          focus_areas: focusAreas
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            loadInsights: data.load_insights
          }))
          
          return data.load_insights
        }
      }
    } catch (error) {
      console.error('Error generating load insights:', error)
    }
  }, [])

  // Configure load monitoring
  const configureLoadMonitoring = useCallback(async (
    userId: string,
    monitoringPreferences: any,
    alertSettings?: any
  ) => {
    try {
      setState(prev => ({ ...prev, isConfiguring: true, error: null }))
      
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure_load_monitoring',
          user_id: userId,
          monitoring_preferences: monitoringPreferences,
          alert_settings: alertSettings
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to configure load monitoring: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to configure load monitoring')
      }

      setState(prev => ({
        ...prev,
        monitoringConfiguration: data.monitoring_configuration,
        isConfiguring: false
      }))

      return data.monitoring_configuration
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConfiguring: false,
        error: error instanceof Error ? error.message : 'Failed to configure load monitoring'
      }))
      throw error
    }
  }, [])

  // Export load data
  const exportLoadData = useCallback(async (
    userId: string,
    exportFormat: string,
    dateRange?: any,
    dataTypes?: string[]
  ) => {
    try {
      const response = await fetch('/api/cognitive-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_load_data',
          user_id: userId,
          export_format: exportFormat,
          date_range: dateRange,
          data_types: dataTypes
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.export_data
        }
      }
    } catch (error) {
      console.error('Error exporting load data:', error)
    }
  }, [])

  // Auto-detect overload and trigger interventions
  useEffect(() => {
    if (state.currentMeasurement && state.userProfile && state.realTimeMonitoring) {
      const checkOverload = async () => {
        try {
          const overloadDetection = await detectCognitiveOverload({
            measurements: [state.currentMeasurement],
            user_profile: state.userProfile!
          })

          if (overloadDetection?.overload_detected) {
            setState(prev => ({
              ...prev,
              warnings: [...prev.warnings, 'Cognitive overload detected - intervention recommended']
            }))
          }
        } catch (error) {
          console.error('Error in overload detection:', error)
        }
      }

      monitoringTimeoutRef.current = setTimeout(checkOverload, 5000)
      
      return () => {
        if (monitoringTimeoutRef.current) {
          clearTimeout(monitoringTimeoutRef.current)
        }
      }
    }
  }, [state.currentMeasurement, state.userProfile, state.realTimeMonitoring, detectCognitiveOverload])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (measurementIntervalRef.current) {
        clearTimeout(measurementIntervalRef.current)
      }
      if (monitoringTimeoutRef.current) {
        clearTimeout(monitoringTimeoutRef.current)
      }
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear warnings
  const clearWarnings = useCallback(() => {
    setState(prev => ({ ...prev, warnings: [] }))
  }, [])

  // Clear current measurement
  const clearCurrentMeasurement = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentMeasurement: null,
      loadInsights: null
    }))
  }, [])

  return {
    // State
    measurements: state.measurements,
    currentMeasurement: state.currentMeasurement,
    userProfile: state.userProfile,
    optimizations: state.optimizations,
    currentOptimization: state.currentOptimization,
    loadInsights: state.loadInsights,
    patterns: state.patterns,
    recommendations: state.recommendations,
    isMeasuring: state.isMeasuring,
    isOptimizing: state.isOptimizing,
    isAnalyzing: state.isAnalyzing,
    isConfiguring: state.isConfiguring,
    error: state.error,
    warnings: state.warnings,
    realTimeMonitoring: state.realTimeMonitoring,
    monitoringConfiguration: state.monitoringConfiguration,
    
    // Actions
    measureCognitiveLoad,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    optimizeCognitiveLoad,
    updateCognitiveProfile,
    detectCognitiveOverload,
    getOptimizationRecommendations,
    assessLoadEffectiveness,
    analyzeLoadPatterns,
    generateLoadInsights,
    configureLoadMonitoring,
    exportLoadData,
    clearError,
    clearWarnings,
    clearCurrentMeasurement,
    
    // Computed state
    hasMeasurements: state.measurements.length > 0,
    hasCurrentMeasurement: !!state.currentMeasurement,
    hasUserProfile: !!state.userProfile,
    hasOptimizations: state.optimizations.length > 0,
    hasCurrentOptimization: !!state.currentOptimization,
    hasInsights: !!state.loadInsights,
    hasPatterns: !!state.patterns,
    hasRecommendations: !!state.recommendations,
    measurementCount: state.measurements.length,
    optimizationCount: state.optimizations.length,
    isProcessing: state.isMeasuring || state.isOptimizing || state.isAnalyzing || state.isConfiguring,
    
    // Current load metrics
    currentLoadMetrics: state.currentMeasurement ? {
      totalLoad: state.currentMeasurement.cognitive_load_metrics.total_load,
      intrinsicLoad: state.currentMeasurement.cognitive_load_metrics.intrinsic_load,
      extraneousLoad: state.currentMeasurement.cognitive_load_metrics.extraneous_load,
      germaneLoad: state.currentMeasurement.cognitive_load_metrics.germane_load,
      loadEfficiency: state.currentMeasurement.cognitive_load_metrics.load_efficiency,
      optimalThreshold: state.currentMeasurement.cognitive_load_metrics.optimal_load_threshold
    } : null,
    
    // Load insights summary
    loadInsightsSummary: state.loadInsights ? {
      levelAssessment: state.loadInsights.load_level_assessment,
      efficiencyScore: state.loadInsights.efficiency_score,
      overloadRisk: state.loadInsights.overload_risk,
      optimizationOpportunities: state.loadInsights.optimization_opportunities?.length || 0,
      immediateRecommendations: state.loadInsights.immediate_recommendations?.length || 0
    } : null,
    
    // Pattern insights
    patternInsights: state.patterns ? {
      dailyPatterns: !!state.patterns.temporal_patterns?.daily_load_cycles,
      weeklyVariations: !!state.patterns.temporal_patterns?.weekly_variations,
      contentPatterns: !!state.patterns.content_based_patterns,
      behavioralPatterns: !!state.patterns.behavioral_patterns,
      adaptationPatterns: !!state.patterns.adaptation_patterns
    } : null,
    
    // Optimization insights
    optimizationInsights: state.currentOptimization ? {
      strategyCount: state.currentOptimization.optimization_strategies.length,
      expectedLoadReduction: state.currentOptimization.optimization_strategies.reduce(
        (sum, strategy) => sum + (strategy.expected_outcomes?.load_reduction || 0), 0
      ) / state.currentOptimization.optimization_strategies.length,
      averageEfficiencyImprovement: state.currentOptimization.optimization_strategies.reduce(
        (sum, strategy) => sum + (strategy.expected_outcomes?.efficiency_improvement || 0), 0
      ) / state.currentOptimization.optimization_strategies.length,
      adaptiveAdjustmentCount: state.currentOptimization.adaptive_adjustments.length,
      interventionProtocolCount: state.currentOptimization.intervention_protocols.length
    } : null,
    
    // Monitoring status
    monitoringStatus: {
      isActive: state.realTimeMonitoring,
      isConfigured: !!state.monitoringConfiguration,
      hasAlerts: state.warnings.length > 0,
      lastMeasurement: state.currentMeasurement?.timestamp,
      measurementFrequency: state.monitoringConfiguration?.monitoring_settings?.measurement_frequency || 30
    }
  }
}

// Hook for cognitive load monitoring configuration
export function useCognitiveLoadConfiguration() {
  const [configuration, setConfiguration] = useState<any>({
    monitoring_frequency: 30, // seconds
    alert_thresholds: {
      overload_warning: 80,
      overload_critical: 90,
      efficiency_low: 60,
      engagement_low: 50
    },
    optimization_preferences: {
      auto_optimize: true,
      intervention_level: 'medium',
      personalization_depth: 'high'
    },
    privacy_settings: {
      data_collection: 'standard',
      anonymization: 'medium',
      retention_days: 90
    }
  })

  const [isValid, setIsValid] = useState(true)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const updateConfiguration = useCallback((section: string, updates: any) => {
    setConfiguration((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }, [])

  const validateConfiguration = useCallback(() => {
    const errors: string[] = []
    
    if (configuration.monitoring_frequency < 10 || configuration.monitoring_frequency > 300) {
      errors.push('Monitoring frequency must be between 10 and 300 seconds')
    }
    
    if (configuration.alert_thresholds.overload_warning >= configuration.alert_thresholds.overload_critical) {
      errors.push('Warning threshold must be less than critical threshold')
    }
    
    if (configuration.privacy_settings.retention_days < 1 || configuration.privacy_settings.retention_days > 365) {
      errors.push('Data retention must be between 1 and 365 days')
    }
    
    setValidationErrors(errors)
    setIsValid(errors.length === 0)
    
    return errors.length === 0
  }, [configuration])

  const resetConfiguration = useCallback(() => {
    setConfiguration({
      monitoring_frequency: 30,
      alert_thresholds: {
        overload_warning: 80,
        overload_critical: 90,
        efficiency_low: 60,
        engagement_low: 50
      },
      optimization_preferences: {
        auto_optimize: true,
        intervention_level: 'medium',
        personalization_depth: 'high'
      },
      privacy_settings: {
        data_collection: 'standard',
        anonymization: 'medium',
        retention_days: 90
      }
    })
    setValidationErrors([])
    setIsValid(true)
  }, [])

  useEffect(() => {
    validateConfiguration()
  }, [configuration, validateConfiguration])

  return {
    configuration,
    isValid,
    validationErrors,
    updateConfiguration,
    validateConfiguration,
    resetConfiguration,
    hasErrors: validationErrors.length > 0,
    monitoringSettings: configuration.monitoring_frequency,
    alertThresholds: configuration.alert_thresholds,
    optimizationPreferences: configuration.optimization_preferences,
    privacySettings: configuration.privacy_settings
  }
}

export default useCognitiveLoadAssessment
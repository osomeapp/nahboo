'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type AttentionMeasurement,
  type AttentionProfile,
  type OptimizedAttentionSystem
} from '@/lib/neural-attention-tracking'

interface NeuralAttentionState {
  measurements: AttentionMeasurement[]
  currentMeasurement: AttentionMeasurement | null
  attentionProfile: AttentionProfile | null
  focusOptimizations: any[]
  distractionMitigations: any[]
  attentionPatterns: any[]
  attentionTrends: any[]
  attentionInsights: any | null
  focusRecommendations: any[]
  isMeasuring: boolean
  isOptimizing: boolean
  isMitigating: boolean
  isAnalyzing: boolean
  isGeneratingProfile: boolean
  isUpdatingProfile: boolean
  isTrackingTrends: boolean
  isGeneratingInsights: boolean
  error: string | null
  warnings: string[]
  realTimeTracking: boolean
  attentionMetrics: any | null
}

interface AttentionMeasurementParams {
  user_id: string
  behavioral_data: any
  contextual_info?: any
}

interface FocusOptimizationParams {
  user_id: string
  current_attention_state: any
  optimization_goals?: string[]
  context?: any
}

interface DistractionMitigationParams {
  user_id: string
  distraction_data: any
  mitigation_preferences?: any
  environment_context?: any
}

interface AttentionPatternAnalysisParams {
  user_id: string
  analysis_timeframe?: string
  pattern_focus?: string[]
  analysis_depth?: string
}

interface AttentionProfileCreationParams {
  user_id: string
  behavioral_data: any
  learning_preferences?: any
  baseline_measurements?: any[]
}

interface AttentionProfileUpdateParams {
  user_id: string
  profile_updates: any
  new_measurements?: any[]
  adaptation_context?: any
}

interface FocusRecommendationParams {
  user_id: string
  current_context?: any
  learning_objectives?: string[]
  time_constraints?: any
}

interface AttentionTrendTrackingParams {
  user_id: string
  tracking_period?: string
  trend_focus?: string[]
  comparison_baseline?: any
}

interface AttentionInsightsParams {
  user_id: string
  analysis_data: any
  insight_focus?: string
  depth_level?: string
}

interface AttentionDataExportParams {
  user_id: string
  export_format: string
  data_types?: string[]
  date_range?: any
  analysis_depth?: string
}

// Main hook for neural attention tracking
export function useNeuralAttentionTracking() {
  const [state, setState] = useState<NeuralAttentionState>({
    measurements: [],
    currentMeasurement: null,
    attentionProfile: null,
    focusOptimizations: [],
    distractionMitigations: [],
    attentionPatterns: [],
    attentionTrends: [],
    attentionInsights: null,
    focusRecommendations: [],
    isMeasuring: false,
    isOptimizing: false,
    isMitigating: false,
    isAnalyzing: false,
    isGeneratingProfile: false,
    isUpdatingProfile: false,
    isTrackingTrends: false,
    isGeneratingInsights: false,
    error: null,
    warnings: [],
    realTimeTracking: false,
    attentionMetrics: null
  })

  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const monitoringTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Measure attention in real-time
  const measureAttention = useCallback(async (params: AttentionMeasurementParams) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isMeasuring: true, 
        error: null,
        warnings: []
      }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'measure_attention',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to measure attention: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to measure attention')
      }

      setState(prev => ({
        ...prev,
        measurements: [data.attention_measurement, ...prev.measurements.slice(0, 99)],
        currentMeasurement: data.attention_measurement,
        attentionMetrics: data.real_time_insights,
        isMeasuring: false,
        warnings: data.attention_analysis?.warnings || []
      }))

      return data.attention_measurement
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMeasuring: false,
        error: error instanceof Error ? error.message : 'Failed to measure attention'
      }))
      throw error
    }
  }, [])

  // Start real-time attention tracking
  const startRealTimeTracking = useCallback(async (
    userId: string,
    trackingInterval: number = 10000 // 10 seconds default
  ) => {
    try {
      setState(prev => ({ ...prev, realTimeTracking: true }))

      const trackingLoop = async () => {
        try {
          // Simulate behavioral data collection
          const behavioralData = {
            mouse_movement_patterns: generateMousePatterns(),
            scroll_behavior: generateScrollBehavior(),
            click_patterns: generateClickPatterns(),
            keyboard_activity: generateKeyboardActivity(),
            window_focus_events: generateFocusEvents()
          }

          await measureAttention({
            user_id: userId,
            behavioral_data: behavioralData,
            contextual_info: {
              timestamp: new Date().toISOString(),
              session_duration: Date.now() % 3600000, // Mock session duration
              current_content_type: 'learning_material'
            }
          })
          
          if (state.realTimeTracking) {
            trackingIntervalRef.current = setTimeout(trackingLoop, trackingInterval)
          }
        } catch (error) {
          console.error('Error in real-time attention tracking:', error)
          // Continue tracking despite errors
          if (state.realTimeTracking) {
            trackingIntervalRef.current = setTimeout(trackingLoop, trackingInterval * 2)
          }
        }
      }

      // Start tracking
      trackingLoop()

    } catch (error) {
      setState(prev => ({
        ...prev,
        realTimeTracking: false,
        error: error instanceof Error ? error.message : 'Failed to start real-time tracking'
      }))
      throw error
    }
  }, [state.realTimeTracking, measureAttention])

  // Stop real-time tracking
  const stopRealTimeTracking = useCallback(() => {
    setState(prev => ({ ...prev, realTimeTracking: false }))
    
    if (trackingIntervalRef.current) {
      clearTimeout(trackingIntervalRef.current)
      trackingIntervalRef.current = null
    }
  }, [])

  // Optimize focus
  const optimizeFocus = useCallback(async (params: FocusOptimizationParams) => {
    try {
      setState(prev => ({ ...prev, isOptimizing: true, error: null }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_focus',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to optimize focus: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize focus')
      }

      setState(prev => ({
        ...prev,
        focusOptimizations: [data.focus_optimization, ...prev.focusOptimizations.slice(0, 19)],
        isOptimizing: false
      }))

      return data.focus_optimization
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: error instanceof Error ? error.message : 'Failed to optimize focus'
      }))
      throw error
    }
  }, [])

  // Mitigate distractions
  const mitigateDistractions = useCallback(async (params: DistractionMitigationParams) => {
    try {
      setState(prev => ({ ...prev, isMitigating: true, error: null }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mitigate_distractions',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to mitigate distractions: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to mitigate distractions')
      }

      setState(prev => ({
        ...prev,
        distractionMitigations: [data.distraction_mitigation, ...prev.distractionMitigations.slice(0, 19)],
        isMitigating: false
      }))

      return data.distraction_mitigation
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMitigating: false,
        error: error instanceof Error ? error.message : 'Failed to mitigate distractions'
      }))
      throw error
    }
  }, [])

  // Analyze attention patterns
  const analyzeAttentionPatterns = useCallback(async (params: AttentionPatternAnalysisParams) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_attention_patterns',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            attentionPatterns: [data.pattern_analysis, ...prev.attentionPatterns.slice(0, 9)],
            isAnalyzing: false
          }))
          
          return data.pattern_analysis
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }))
      console.error('Error analyzing attention patterns:', error)
    }
  }, [])

  // Create attention profile
  const createAttentionProfile = useCallback(async (params: AttentionProfileCreationParams) => {
    try {
      setState(prev => ({ ...prev, isGeneratingProfile: true, error: null }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_attention_profile',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create attention profile: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create attention profile')
      }

      setState(prev => ({
        ...prev,
        attentionProfile: data.attention_profile,
        isGeneratingProfile: false
      }))

      return data.attention_profile
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingProfile: false,
        error: error instanceof Error ? error.message : 'Failed to create attention profile'
      }))
      throw error
    }
  }, [])

  // Update attention profile
  const updateAttentionProfile = useCallback(async (params: AttentionProfileUpdateParams) => {
    try {
      setState(prev => ({ ...prev, isUpdatingProfile: true, error: null }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_attention_profile',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update attention profile: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update attention profile')
      }

      setState(prev => ({
        ...prev,
        attentionProfile: data.updated_profile,
        isUpdatingProfile: false
      }))

      return data.updated_profile
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdatingProfile: false,
        error: error instanceof Error ? error.message : 'Failed to update attention profile'
      }))
      throw error
    }
  }, [])

  // Get focus recommendations
  const getFocusRecommendations = useCallback(async (params: FocusRecommendationParams) => {
    try {
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_focus_recommendations',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            focusRecommendations: [data.focus_recommendations, ...prev.focusRecommendations.slice(0, 9)]
          }))
          
          return data.focus_recommendations
        }
      }
    } catch (error) {
      console.error('Error getting focus recommendations:', error)
    }
  }, [])

  // Track attention trends
  const trackAttentionTrends = useCallback(async (params: AttentionTrendTrackingParams) => {
    try {
      setState(prev => ({ ...prev, isTrackingTrends: true }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_attention_trends',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            attentionTrends: [data.trend_analysis, ...prev.attentionTrends.slice(0, 9)],
            isTrackingTrends: false
          }))
          
          return data.trend_analysis
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isTrackingTrends: false
      }))
      console.error('Error tracking attention trends:', error)
    }
  }, [])

  // Generate attention insights
  const generateAttentionInsights = useCallback(async (params: AttentionInsightsParams) => {
    try {
      setState(prev => ({ ...prev, isGeneratingInsights: true }))
      
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_attention_insights',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            attentionInsights: data.attention_insights,
            isGeneratingInsights: false
          }))
          
          return data.attention_insights
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingInsights: false
      }))
      console.error('Error generating attention insights:', error)
    }
  }, [])

  // Export attention data
  const exportAttentionData = useCallback(async (params: AttentionDataExportParams) => {
    try {
      const response = await fetch('/api/neural-attention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_attention_data',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.export_data
        }
      }
    } catch (error) {
      console.error('Error exporting attention data:', error)
    }
  }, [])

  // Auto-monitor attention quality
  useEffect(() => {
    if (state.currentMeasurement && state.realTimeTracking) {
      const checkAttentionQuality = async () => {
        try {
          const attentionScore = state.currentMeasurement!.attention_metrics.overall_attention_level

          if (attentionScore < 60) {
            setState(prev => ({
              ...prev,
              warnings: [...prev.warnings, 'Attention score below optimal threshold']
            }))

            // Auto-trigger focus optimization if attention is very low
            if (attentionScore < 40 && state.attentionProfile?.user_id) {
              await optimizeFocus({
                user_id: state.attentionProfile.user_id,
                current_attention_state: state.currentMeasurement,
                optimization_goals: ['immediate_focus_improvement', 'distraction_reduction']
              })
            }
          }
        } catch (error) {
          console.error('Error in attention quality monitoring:', error)
        }
      }

      monitoringTimeoutRef.current = setTimeout(checkAttentionQuality, 5000) // 5 seconds
      
      return () => {
        if (monitoringTimeoutRef.current) {
          clearTimeout(monitoringTimeoutRef.current)
        }
      }
    }
  }, [state.currentMeasurement, state.realTimeTracking, state.attentionProfile, optimizeFocus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearTimeout(trackingIntervalRef.current)
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
      attentionMetrics: null
    }))
  }, [])

  return {
    // State
    measurements: state.measurements,
    currentMeasurement: state.currentMeasurement,
    attentionProfile: state.attentionProfile,
    focusOptimizations: state.focusOptimizations,
    distractionMitigations: state.distractionMitigations,
    attentionPatterns: state.attentionPatterns,
    attentionTrends: state.attentionTrends,
    attentionInsights: state.attentionInsights,
    focusRecommendations: state.focusRecommendations,
    isMeasuring: state.isMeasuring,
    isOptimizing: state.isOptimizing,
    isMitigating: state.isMitigating,
    isAnalyzing: state.isAnalyzing,
    isGeneratingProfile: state.isGeneratingProfile,
    isUpdatingProfile: state.isUpdatingProfile,
    isTrackingTrends: state.isTrackingTrends,
    isGeneratingInsights: state.isGeneratingInsights,
    error: state.error,
    warnings: state.warnings,
    realTimeTracking: state.realTimeTracking,
    attentionMetrics: state.attentionMetrics,
    
    // Actions
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
    exportAttentionData,
    clearError,
    clearWarnings,
    clearCurrentMeasurement,
    
    // Computed state
    hasMeasurements: state.measurements.length > 0,
    hasCurrentMeasurement: !!state.currentMeasurement,
    hasAttentionProfile: !!state.attentionProfile,
    hasFocusOptimizations: state.focusOptimizations.length > 0,
    hasDistractionMitigations: state.distractionMitigations.length > 0,
    hasAttentionPatterns: state.attentionPatterns.length > 0,
    hasAttentionTrends: state.attentionTrends.length > 0,
    hasAttentionInsights: !!state.attentionInsights,
    hasFocusRecommendations: state.focusRecommendations.length > 0,
    measurementCount: state.measurements.length,
    optimizationCount: state.focusOptimizations.length,
    mitigationCount: state.distractionMitigations.length,
    isProcessing: state.isMeasuring || state.isOptimizing || state.isMitigating || state.isAnalyzing || state.isGeneratingProfile || state.isUpdatingProfile || state.isTrackingTrends || state.isGeneratingInsights,
    
    // Current attention metrics
    currentAttentionMetrics: state.currentMeasurement ? {
      overallScore: state.currentMeasurement.attention_metrics.overall_attention_level,
      focusStability: state.currentMeasurement.attention_metrics.attention_stability || 0,
      distractionLevel: state.currentMeasurement.behavioral_indicators.distraction_indicators.length || 0,
      cognitiveLoad: state.currentMeasurement.cognitive_indicators.working_memory_load || 0,
      attentionSpan: state.currentMeasurement.attention_metrics.sustained_attention || 0,
      measurementTimestamp: state.currentMeasurement.timestamp
    } : null,
    
    // Profile insights
    profileInsights: state.attentionProfile ? {
      attentionType: 'sustained', // Default value
      optimalFocusDuration: state.attentionProfile.attention_characteristics.optimal_session_length || 25,
      distractionSusceptibility: 50, // Default value
      peakAttentionTimes: state.attentionProfile.attention_characteristics.peak_attention_windows || [],
      attentionFluctuations: 'moderate' // Default value
    } : null,
    
    // Optimization status
    optimizationStatus: {
      isActive: state.realTimeTracking,
      isMeasuring: state.isMeasuring,
      hasOptimizations: state.focusOptimizations.length > 0,
      lastOptimization: state.focusOptimizations[0]?.timestamp,
      attentionQuality: state.currentMeasurement?.attention_metrics.overall_attention_level || 0
    },
    
    // Distraction status
    distractionStatus: {
      hasMitigations: state.distractionMitigations.length > 0,
      lastMitigation: state.distractionMitigations[0]?.timestamp,
      currentDistractionLevel: state.currentMeasurement?.behavioral_indicators.distraction_indicators.length || 0,
      vulnerabilityLevel: 'medium' // Default value
    },
    
    // Warning indicators
    warningIndicators: {
      hasWarnings: state.warnings.length > 0,
      warningCount: state.warnings.length,
      hasError: !!state.error,
      attentionHealthy: state.currentMeasurement ? state.currentMeasurement.attention_metrics.overall_attention_level > 70 : true,
      focusStable: state.currentMeasurement ? 
        state.currentMeasurement.attention_metrics.attention_stability > 70 : true,
      distractionManaged: state.currentMeasurement ?
        state.currentMeasurement.behavioral_indicators.distraction_indicators.length < 3 : true
    }
  }
}

// Hook for neural attention tracking configuration
export function useNeuralAttentionConfiguration() {
  const [configuration, setConfiguration] = useState<any>({
    measurement_settings: {
      tracking_frequency: 10, // seconds
      measurement_sensitivity: 'medium',
      behavioral_tracking_enabled: true,
      cognitive_assessment_enabled: true,
      physiological_tracking_enabled: false
    },
    optimization_settings: {
      auto_optimization_enabled: true,
      optimization_frequency: 'adaptive',
      optimization_aggressiveness: 'moderate',
      focus_training_enabled: true
    },
    distraction_mitigation: {
      real_time_detection: true,
      auto_mitigation_enabled: true,
      mitigation_strategies: ['environmental', 'cognitive', 'behavioral'],
      intervention_threshold: 'medium'
    },
    profile_management: {
      auto_profile_updates: true,
      learning_adaptation_enabled: true,
      pattern_analysis_depth: 'comprehensive',
      trend_tracking_enabled: true
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
    
    if (configuration.measurement_settings.tracking_frequency < 5 || 
        configuration.measurement_settings.tracking_frequency > 300) {
      errors.push('Tracking frequency must be between 5 and 300 seconds')
    }
    
    if (!['low', 'medium', 'high'].includes(configuration.measurement_settings.measurement_sensitivity)) {
      errors.push('Measurement sensitivity must be low, medium, or high')
    }
    
    if (!['low', 'medium', 'high'].includes(configuration.distraction_mitigation.intervention_threshold)) {
      errors.push('Intervention threshold must be low, medium, or high')
    }
    
    setValidationErrors(errors)
    setIsValid(errors.length === 0)
    
    return errors.length === 0
  }, [configuration])

  const resetConfiguration = useCallback(() => {
    setConfiguration({
      measurement_settings: {
        tracking_frequency: 10,
        measurement_sensitivity: 'medium',
        behavioral_tracking_enabled: true,
        cognitive_assessment_enabled: true,
        physiological_tracking_enabled: false
      },
      optimization_settings: {
        auto_optimization_enabled: true,
        optimization_frequency: 'adaptive',
        optimization_aggressiveness: 'moderate',
        focus_training_enabled: true
      },
      distraction_mitigation: {
        real_time_detection: true,
        auto_mitigation_enabled: true,
        mitigation_strategies: ['environmental', 'cognitive', 'behavioral'],
        intervention_threshold: 'medium'
      },
      profile_management: {
        auto_profile_updates: true,
        learning_adaptation_enabled: true,
        pattern_analysis_depth: 'comprehensive',
        trend_tracking_enabled: true
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
    measurementSettings: configuration.measurement_settings,
    optimizationSettings: configuration.optimization_settings,
    distractionMitigation: configuration.distraction_mitigation,
    profileManagement: configuration.profile_management
  }
}

// Helper functions for generating mock behavioral data
function generateMousePatterns(): any {
  return {
    average_velocity: 50 + Math.random() * 100,
    movement_smoothness: 70 + Math.random() * 25,
    click_accuracy: 80 + Math.random() * 15,
    hover_patterns: Math.random() > 0.5 ? 'focused' : 'scattered'
  }
}

function generateScrollBehavior(): any {
  return {
    scroll_velocity: 30 + Math.random() * 50,
    scroll_consistency: 75 + Math.random() * 20,
    pause_frequency: Math.floor(Math.random() * 10),
    backtrack_frequency: Math.floor(Math.random() * 5)
  }
}

function generateClickPatterns(): any {
  return {
    click_frequency: Math.floor(Math.random() * 20),
    click_precision: 85 + Math.random() * 10,
    double_click_ratio: Math.random() * 0.3,
    misclick_frequency: Math.floor(Math.random() * 3)
  }
}

function generateKeyboardActivity(): any {
  return {
    typing_speed: 40 + Math.random() * 60,
    typing_rhythm: 70 + Math.random() * 25,
    pause_patterns: Math.random() > 0.6 ? 'thoughtful' : 'distracted',
    backspace_frequency: Math.floor(Math.random() * 10)
  }
}

function generateFocusEvents(): any {
  return {
    focus_duration: 30 + Math.random() * 120, // seconds
    focus_switches: Math.floor(Math.random() * 5),
    idle_detection: Math.random() > 0.8,
    tab_switches: Math.floor(Math.random() * 3)
  }
}

export default useNeuralAttentionTracking
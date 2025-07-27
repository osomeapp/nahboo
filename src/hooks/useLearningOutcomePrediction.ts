'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type LearnerProfile,
  type LearningObjective,
  type PredictionRequest,
  type OutcomePrediction,
  type PredictionUpdate,
  type ModelPerformance
} from '@/lib/learning-outcome-prediction-engine'

interface LearningOutcomePredictionState {
  currentPrediction: OutcomePrediction | null
  predictionHistory: OutcomePrediction[]
  predictionUpdates: PredictionUpdate[]
  modelPerformance: ModelPerformance[]
  isLoading: boolean
  isPredicting: boolean
  isUpdating: boolean
  error: string | null
  lastPredictionId: string | null
}

interface EnsemblePredictionResult {
  ensemble_prediction: OutcomePrediction
  individual_predictions: OutcomePrediction[]
  consensus_metrics: {
    agreement_level: number
    prediction_variance: number
    confidence_boost: number
  }
}

// Main hook for learning outcome prediction
export function useLearningOutcomePrediction() {
  const [state, setState] = useState<LearningOutcomePredictionState>({
    currentPrediction: null,
    predictionHistory: [],
    predictionUpdates: [],
    modelPerformance: [],
    isLoading: false,
    isPredicting: false,
    isUpdating: false,
    error: null,
    lastPredictionId: null
  })

  // Predict learning outcomes
  const predictOutcomes = useCallback(async (request: PredictionRequest) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isPredicting: true, 
        error: null 
      }))
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'predict_outcomes',
          request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to predict outcomes: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to predict learning outcomes')
      }

      setState(prev => ({
        ...prev,
        currentPrediction: data.prediction,
        predictionHistory: [data.prediction, ...prev.predictionHistory.slice(0, 9)], // Keep last 10
        isPredicting: false,
        lastPredictionId: data.prediction.prediction_id
      }))

      return data.prediction
    } catch (error) {
      setState(prev => ({
        ...prev,
        isPredicting: false,
        error: error instanceof Error ? error.message : 'Failed to predict learning outcomes'
      }))
      throw error
    }
  }, [])

  // Get ensemble prediction from multiple models
  const getEnsemblePrediction = useCallback(async (request: PredictionRequest) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isPredicting: true, 
        error: null 
      }))
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ensemble_prediction',
          request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get ensemble prediction: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get ensemble prediction')
      }

      setState(prev => ({
        ...prev,
        currentPrediction: data.ensembleResult.ensemble_prediction,
        predictionHistory: [data.ensembleResult.ensemble_prediction, ...prev.predictionHistory.slice(0, 9)],
        isPredicting: false,
        lastPredictionId: data.ensembleResult.ensemble_prediction.prediction_id
      }))

      return data.ensembleResult as EnsemblePredictionResult
    } catch (error) {
      setState(prev => ({
        ...prev,
        isPredicting: false,
        error: error instanceof Error ? error.message : 'Failed to get ensemble prediction'
      }))
      throw error
    }
  }, [])

  // Update existing prediction
  const updatePrediction = useCallback(async (
    predictionId: string,
    updateType: PredictionUpdate['update_type'],
    newData: any
  ) => {
    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }))
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prediction',
          predictionId,
          updateType,
          newData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update prediction: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update prediction')
      }

      setState(prev => ({
        ...prev,
        predictionUpdates: [data.update, ...prev.predictionUpdates],
        currentPrediction: data.updatedPrediction,
        isUpdating: false
      }))

      return data.update
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update prediction'
      }))
      throw error
    }
  }, [])

  // Get prediction by ID
  const getPrediction = useCallback(async (predictionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_prediction',
          predictionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get prediction: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get prediction')
      }

      setState(prev => ({
        ...prev,
        currentPrediction: data.prediction,
        isLoading: false
      }))

      return data.prediction
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get prediction'
      }))
      return null
    }
  }, [])

  // Get prediction history
  const getPredictionHistory = useCallback(async (predictionId: string) => {
    try {
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_prediction_history',
          predictionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get prediction history: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get prediction history')
      }

      setState(prev => ({
        ...prev,
        predictionUpdates: data.history
      }))

      return data.history
    } catch (error) {
      console.error('Error getting prediction history:', error)
      return []
    }
  }, [])

  // Get model performance metrics
  const getModelPerformance = useCallback(async () => {
    try {
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_model_performance'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get model performance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get model performance')
      }

      setState(prev => ({
        ...prev,
        modelPerformance: data.performance
      }))

      return data.performance
    } catch (error) {
      console.error('Error getting model performance:', error)
      return []
    }
  }, [])

  // Update model performance
  const updateModelPerformance = useCallback(async (
    modelId: string,
    actualOutcomes: any[],
    predictions: OutcomePrediction[]
  ) => {
    try {
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_model_performance',
          modelId,
          actualOutcomes,
          predictions
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update model performance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update model performance')
      }

      setState(prev => ({
        ...prev,
        modelPerformance: data.performance
      }))

      return true
    } catch (error) {
      console.error('Error updating model performance:', error)
      return false
    }
  }, [])

  // Validate prediction request
  const validatePredictionRequest = useCallback((request: PredictionRequest): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate learner profile
    if (!request.learner_profile.learner_id) {
      errors.push('Learner ID is required')
    }

    if (request.learner_profile.demographics.age < 5 || request.learner_profile.demographics.age > 100) {
      warnings.push('Age seems unusual')
    }

    // Validate learning objectives
    if (request.learning_objectives.length === 0) {
      errors.push('At least one learning objective is required')
    }

    request.learning_objectives.forEach((objective, index) => {
      if (!objective.objective_id) {
        errors.push(`Learning objective ${index + 1} missing ID`)
      }
      if (!objective.title) {
        errors.push(`Learning objective ${index + 1} missing title`)
      }
      if (objective.difficulty_level < 1 || objective.difficulty_level > 10) {
        warnings.push(`Learning objective ${index + 1} has unusual difficulty level`)
      }
    })

    // Validate course context
    if (request.course_context.duration_weeks < 1) {
      errors.push('Course duration must be at least 1 week')
    }

    if (request.course_context.duration_weeks > 52) {
      warnings.push('Course duration seems very long')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear current prediction
  const clearPrediction = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentPrediction: null,
      predictionUpdates: []
    }))
  }, [])

  // Load prediction history on mount
  const loadPredictionHistory = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_all_predictions'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            predictionHistory: data.predictions,
            isLoading: false
          }))
        }
      }
    } catch (error) {
      console.error('Error loading prediction history:', error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Auto-load data on mount
  useEffect(() => {
    loadPredictionHistory()
    getModelPerformance()
  }, [loadPredictionHistory, getModelPerformance])

  return {
    // State
    currentPrediction: state.currentPrediction,
    predictionHistory: state.predictionHistory,
    predictionUpdates: state.predictionUpdates,
    modelPerformance: state.modelPerformance,
    isLoading: state.isLoading,
    isPredicting: state.isPredicting,
    isUpdating: state.isUpdating,
    error: state.error,
    lastPredictionId: state.lastPredictionId,
    
    // Actions
    predictOutcomes,
    getEnsemblePrediction,
    updatePrediction,
    getPrediction,
    getPredictionHistory,
    getModelPerformance,
    updateModelPerformance,
    validatePredictionRequest,
    clearError,
    clearPrediction,
    loadPredictionHistory,
    
    // Computed state
    hasPrediction: !!state.currentPrediction,
    hasHistory: state.predictionHistory.length > 0,
    hasUpdates: state.predictionUpdates.length > 0,
    averageConfidence: state.currentPrediction?.confidence_level || 0,
    completionProbability: state.currentPrediction?.overall_success_probability.completion_probability || 0,
    atRiskProbability: state.currentPrediction?.overall_success_probability.at_risk_probability || 0,
    isProcessing: state.isPredicting || state.isUpdating || state.isLoading,
    
    // Risk assessment
    riskLevel: state.currentPrediction ? (
      state.currentPrediction.overall_success_probability.at_risk_probability > 0.7 ? 'high' :
      state.currentPrediction.overall_success_probability.at_risk_probability > 0.4 ? 'medium' : 'low'
    ) : 'unknown',
    
    // Prediction quality
    predictionQuality: state.currentPrediction ? (
      state.currentPrediction.confidence_level > 0.8 ? 'high' :
      state.currentPrediction.confidence_level > 0.6 ? 'medium' : 'low'
    ) : 'unknown'
  }
}

// Hook for prediction analytics
export function usePredictionAnalytics() {
  const [analytics, setAnalytics] = useState<{
    total_predictions: number
    avg_confidence_level: number
    completion_rate_accuracy: number
    most_common_risk_factors: string[]
    intervention_success_rate: number
    model_accuracy_trend: Array<{
      date: string
      accuracy: number
    }>
  }>({
    total_predictions: 0,
    avg_confidence_level: 0,
    completion_rate_accuracy: 0,
    most_common_risk_factors: [],
    intervention_success_rate: 0,
    model_accuracy_trend: []
  })

  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_analytics'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Error loading prediction analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return {
    analytics,
    isLoading,
    loadAnalytics
  }
}

// Hook for learner risk monitoring
export function useLearnerRiskMonitoring() {
  const [riskData, setRiskData] = useState<{
    high_risk_learners: Array<{
      learner_id: string
      risk_probability: number
      risk_factors: string[]
      recommended_interventions: string[]
    }>
    medium_risk_learners: Array<{
      learner_id: string
      risk_probability: number
      risk_factors: string[]
    }>
    risk_trends: Array<{
      date: string
      high_risk_count: number
      medium_risk_count: number
      total_learners: number
    }>
  }>({
    high_risk_learners: [],
    medium_risk_learners: [],
    risk_trends: []
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  const updateRiskMonitoring = useCallback(async () => {
    try {
      setIsMonitoring(true)
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_risk_monitoring'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setRiskData(data.riskData)
        }
      }
    } catch (error) {
      console.error('Error updating risk monitoring:', error)
    } finally {
      setIsMonitoring(false)
    }
  }, [])

  const getAlertSummary = useCallback(() => {
    const totalHighRisk = riskData.high_risk_learners.length
    const totalMediumRisk = riskData.medium_risk_learners.length
    const totalAtRisk = totalHighRisk + totalMediumRisk
    
    return {
      total_alerts: totalAtRisk,
      high_risk_alerts: totalHighRisk,
      medium_risk_alerts: totalMediumRisk,
      requires_immediate_action: totalHighRisk > 0,
      intervention_needed: totalAtRisk > 0
    }
  }, [riskData])

  const getLearnersByRiskLevel = useCallback((riskLevel: 'high' | 'medium') => {
    return riskLevel === 'high' ? riskData.high_risk_learners : riskData.medium_risk_learners
  }, [riskData])

  // Auto-update monitoring every 15 minutes
  useEffect(() => {
    updateRiskMonitoring()
    
    const interval = setInterval(updateRiskMonitoring, 15 * 60 * 1000) // 15 minutes
    
    return () => clearInterval(interval)
  }, [updateRiskMonitoring])

  return {
    riskData,
    isMonitoring,
    updateRiskMonitoring,
    getAlertSummary,
    getLearnersByRiskLevel
  }
}

// Hook for outcome tracking and validation
export function useOutcomeTracking() {
  const [trackingData, setTrackingData] = useState<{
    tracked_predictions: Array<{
      prediction_id: string
      predicted_outcome: any
      actual_outcome: any
      accuracy_metrics: any
    }>
    validation_results: {
      overall_accuracy: number
      completion_accuracy: number
      score_prediction_error: number
      time_prediction_error: number
    }
  }>({
    tracked_predictions: [],
    validation_results: {
      overall_accuracy: 0,
      completion_accuracy: 0,
      score_prediction_error: 0,
      time_prediction_error: 0
    }
  })

  const [isTracking, setIsTracking] = useState(false)

  const trackActualOutcome = useCallback(async (
    predictionId: string,
    actualOutcome: any
  ) => {
    try {
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_actual_outcome',
          predictionId,
          actualOutcome
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to track outcome: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to track actual outcome')
      }

      // Update tracking data
      setTrackingData(prev => ({
        ...prev,
        tracked_predictions: [data.trackedPrediction, ...prev.tracked_predictions],
        validation_results: data.validationResults
      }))

      return true
    } catch (error) {
      console.error('Error tracking actual outcome:', error)
      return false
    }
  }, [])

  const validatePredictionAccuracy = useCallback(async () => {
    try {
      setIsTracking(true)
      
      const response = await fetch('/api/learning-outcome-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_prediction_accuracy'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setTrackingData(prev => ({
            ...prev,
            validation_results: data.validationResults
          }))
        }
      }
    } catch (error) {
      console.error('Error validating prediction accuracy:', error)
    } finally {
      setIsTracking(false)
    }
  }, [])

  return {
    trackingData,
    isTracking,
    trackActualOutcome,
    validatePredictionAccuracy
  }
}
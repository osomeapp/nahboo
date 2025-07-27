// React hooks for adaptive learning path system
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  AdaptiveRecommendation,
  LearningPreferences,
  PathConstraints,
  AdaptationRecord,
  AdaptationTrigger,
  RealTimeOptimization
} from '@/lib/adaptive-path-generator'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'

export interface AdaptivePathState {
  currentRecommendation: AdaptiveRecommendation | null
  isGenerating: boolean
  preferences: LearningPreferences | null
  activeAdaptations: AdaptationRecord[]
  adaptationTriggers: AdaptationTrigger[]
  realTimeOptimizations: RealTimeOptimization[]
  alternativePaths: any[]
  recommendations: any[]
  isAdapting: boolean
  error: string | null
}

export interface AdaptivePathMetrics {
  totalAdaptations: number
  adaptationEffectiveness: number
  pathOptimizationScore: number
  userSatisfactionScore: number
  completionProbability: number
  engagementTrend: 'improving' | 'stable' | 'declining'
}

// Main adaptive path hook
export function useAdaptivePath(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<AdaptivePathState>({
    currentRecommendation: null,
    isGenerating: false,
    preferences: null,
    activeAdaptations: [],
    adaptationTriggers: [],
    realTimeOptimizations: [],
    alternativePaths: [],
    recommendations: [],
    isAdapting: false,
    error: null
  })

  const [metrics, setMetrics] = useState<AdaptivePathMetrics>({
    totalAdaptations: 0,
    adaptationEffectiveness: 0,
    pathOptimizationScore: 0,
    userSatisfactionScore: 0,
    completionProbability: 0,
    engagementTrend: 'stable'
  })

  // Real-time monitoring interval
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate adaptive learning path
  const generateAdaptivePath = useCallback(async (
    learningGoals: LearningObjective[],
    availableContent?: ContentItem[],
    constraints?: Partial<PathConstraints>
  ) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await fetch('/api/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'generate_path',
          learningGoals,
          availableContent: availableContent || [],
          constraints
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate adaptive path: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate adaptive path')
      }

      const { adaptiveRecommendation } = data

      setState(prev => ({
        ...prev,
        currentRecommendation: adaptiveRecommendation,
        adaptationTriggers: adaptiveRecommendation.adaptationTriggers,
        realTimeOptimizations: adaptiveRecommendation.realTimeOptimizations,
        alternativePaths: adaptiveRecommendation.alternativeRoutes,
        isGenerating: false
      }))

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        completionProbability: adaptiveRecommendation.expectedOutcomes.completionProbability,
        pathOptimizationScore: adaptiveRecommendation.confidenceScore,
        engagementTrend: adaptiveRecommendation.expectedOutcomes.engagementScore > 0.7 ? 'improving' : 'stable'
      }))

      // Start real-time monitoring
      startRealTimeMonitoring()

      return adaptiveRecommendation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isGenerating: false }))
      throw error
    }
  }, [userId, userProfile])

  // Get personalized recommendations
  const getRecommendations = useCallback(async () => {
    try {
      const response = await fetch('/api/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_recommendations'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get recommendations')
      }

      setState(prev => ({
        ...prev,
        recommendations: data.recommendations || [],
        adaptationTriggers: data.adaptationTriggers || []
      }))

      return data.recommendations
    } catch (error) {
      console.error('Failed to get recommendations:', error)
      throw error
    }
  }, [userId, userProfile])

  // Update user preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<LearningPreferences>) => {
    try {
      const response = await fetch('/api/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'update_preferences',
          preferences: newPreferences
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update preferences')
      }

      setState(prev => ({
        ...prev,
        preferences: data.updatedPreferences
      }))

      return data.updatedPreferences
    } catch (error) {
      console.error('Failed to update preferences:', error)
      throw error
    }
  }, [userId, userProfile])

  // Track adaptation
  const trackAdaptation = useCallback(async (
    pathId: string,
    adaptationType: string,
    trigger: string,
    effectiveness: number,
    userFeedback?: string,
    context: Record<string, any> = {}
  ) => {
    setState(prev => ({ ...prev, isAdapting: true }))

    try {
      const response = await fetch('/api/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'track_adaptation',
          adaptationData: {
            pathId,
            adaptationType,
            trigger,
            effectiveness,
            userFeedback,
            context
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to track adaptation: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to track adaptation')
      }

      // Update active adaptations
      setState(prev => ({
        ...prev,
        activeAdaptations: [data.adaptationRecord, ...prev.activeAdaptations.slice(0, 9)], // Keep last 10
        isAdapting: false
      }))

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        totalAdaptations: prev.totalAdaptations + 1,
        adaptationEffectiveness: (prev.adaptationEffectiveness * prev.totalAdaptations + effectiveness) / (prev.totalAdaptations + 1)
      }))

      return data.adaptationRecord
    } catch (error) {
      setState(prev => ({ ...prev, isAdapting: false }))
      console.error('Failed to track adaptation:', error)
      throw error
    }
  }, [userId, userProfile])

  // Get alternative paths
  const getAlternativePaths = useCallback(async (
    currentPathId: string,
    alternativeType?: 'accelerated' | 'comprehensive' | 'style_optimized' | 'time_constrained'
  ) => {
    try {
      const response = await fetch('/api/adaptive-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_alternatives',
          currentPathId,
          alternativeType
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get alternatives: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get alternatives')
      }

      setState(prev => ({
        ...prev,
        alternativePaths: data.alternativePaths || []
      }))

      return data.alternativePaths
    } catch (error) {
      console.error('Failed to get alternatives:', error)
      throw error
    }
  }, [userId, userProfile])

  // Start real-time monitoring
  const startRealTimeMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current)
    }

    monitoringIntervalRef.current = setInterval(async () => {
      try {
        await getRecommendations()
      } catch (error) {
        console.warn('Real-time monitoring failed:', error)
      }
    }, 60000) // Check every minute
  }, [getRecommendations])

  // Stop real-time monitoring
  const stopRealTimeMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current)
      monitoringIntervalRef.current = null
    }
  }, [])

  // Clear adaptive path
  const clearAdaptivePath = useCallback(() => {
    stopRealTimeMonitoring()
    setState(prev => ({
      ...prev,
      currentRecommendation: null,
      activeAdaptations: [],
      adaptationTriggers: [],
      realTimeOptimizations: [],
      alternativePaths: [],
      recommendations: [],
      error: null
    }))
  }, [stopRealTimeMonitoring])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRealTimeMonitoring()
    }
  }, [stopRealTimeMonitoring])

  // Auto-load recommendations when component mounts
  useEffect(() => {
    if (userProfile && !state.recommendations.length && !state.isGenerating) {
      getRecommendations().catch(console.error)
    }
  }, [userProfile, state.recommendations.length, state.isGenerating, getRecommendations])

  return {
    // State
    ...state,
    metrics,
    
    // Actions
    generateAdaptivePath,
    getRecommendations,
    updatePreferences,
    trackAdaptation,
    getAlternativePaths,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    clearAdaptivePath,
    
    // Computed values
    isPathActive: !!state.currentRecommendation,
    hasActiveAdaptations: state.activeAdaptations.length > 0,
    hasRecommendations: state.recommendations.length > 0,
    hasAlternatives: state.alternativePaths.length > 0,
    adaptationEffectiveness: metrics.adaptationEffectiveness,
    
    // Helper functions
    getHighPriorityRecommendations: useCallback(() => {
      return state.recommendations.filter(rec => rec.priority === 'high')
    }, [state.recommendations]),
    
    getActiveTriggers: useCallback(() => {
      return state.adaptationTriggers.filter(trigger => trigger.priority === 'high' || trigger.priority === 'critical')
    }, [state.adaptationTriggers]),
    
    getRecentAdaptations: useCallback((count = 5) => {
      return state.activeAdaptations.slice(0, count)
    }, [state.activeAdaptations])
  }
}

// Hook for adaptive path preferences management
export function useAdaptivePreferences(userId: string) {
  const [preferences, setPreferences] = useState<LearningPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePreference = useCallback(async (key: keyof LearningPreferences, value: any) => {
    if (!preferences) return

    setIsLoading(true)
    setError(null)

    try {
      const newPreferences = { ...preferences, [key]: value }
      setPreferences(newPreferences)

      // The actual update would be handled by useAdaptivePath
      // This hook just manages local preference state
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update preference')
      setIsLoading(false)
    }
  }, [preferences])

  const resetPreferences = useCallback(() => {
    setPreferences({
      preferredContentTypes: ['video', 'interactive'],
      learningPace: 'moderate',
      sessionLength: 45,
      difficultyProgression: 'gradual',
      adaptationSensitivity: 'medium',
      feedbackFrequency: 'moderate',
      reviewPreference: 'adaptive',
      motivationStyle: 'progress'
    })
  }, [])

  return {
    preferences,
    isLoading,
    error,
    updatePreference,
    resetPreferences,
    setPreferences
  }
}

// Hook for monitoring adaptation effectiveness
export function useAdaptationMonitoring(userId: string) {
  const [monitoringData, setMonitoringData] = useState({
    adaptationHistory: [] as AdaptationRecord[],
    effectivenessMetrics: {
      averageEffectiveness: 0,
      improvementTrend: 'stable' as 'improving' | 'stable' | 'declining',
      bestAdaptationType: '',
      worstAdaptationType: ''
    },
    isMonitoring: false
  })

  const startMonitoring = useCallback(() => {
    setMonitoringData(prev => ({ ...prev, isMonitoring: true }))
  }, [])

  const stopMonitoring = useCallback(() => {
    setMonitoringData(prev => ({ ...prev, isMonitoring: false }))
  }, [])

  const addAdaptationRecord = useCallback((record: AdaptationRecord) => {
    setMonitoringData(prev => {
      const newHistory = [record, ...prev.adaptationHistory.slice(0, 49)] // Keep last 50 records
      
      // Calculate effectiveness metrics
      const effectiveness = newHistory
        .filter(r => r.effectiveness !== null)
        .map(r => r.effectiveness as number)
      
      const averageEffectiveness = effectiveness.length > 0 
        ? effectiveness.reduce((sum, eff) => sum + eff, 0) / effectiveness.length
        : 0

      // Calculate trends, best/worst adaptation types
      const adaptationTypes = newHistory.reduce((acc, r) => {
        if (r.effectiveness !== null) {
          acc[r.adaptationType] = acc[r.adaptationType] || []
          acc[r.adaptationType].push(r.effectiveness)
        }
        return acc
      }, {} as Record<string, number[]>)

      let bestAdaptationType = ''
      let worstAdaptationType = ''
      let bestAvg = 0
      let worstAvg = 1

      Object.entries(adaptationTypes).forEach(([type, values]) => {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        if (avg > bestAvg) {
          bestAvg = avg
          bestAdaptationType = type
        }
        if (avg < worstAvg) {
          worstAvg = avg
          worstAdaptationType = type
        }
      })

      return {
        ...prev,
        adaptationHistory: newHistory,
        effectivenessMetrics: {
          averageEffectiveness,
          improvementTrend: averageEffectiveness > 0.7 ? 'improving' : 
                          averageEffectiveness > 0.5 ? 'stable' : 'declining',
          bestAdaptationType,
          worstAdaptationType
        }
      }
    })
  }, [])

  return {
    ...monitoringData,
    startMonitoring,
    stopMonitoring,
    addAdaptationRecord
  }
}
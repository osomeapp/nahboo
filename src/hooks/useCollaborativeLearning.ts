'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type CollaborativeLearningSession
} from '@/lib/collaborative-learning-orchestration'

interface CollaborativeLearningState {
  sessions: CollaborativeLearningSession[]
  currentSession: CollaborativeLearningSession | null
  groupFormations: any[]
  orchestrationResults: any[]
  collaborationInsights: any | null
  groupDynamicsAnalysis: any | null
  peerInteractions: any[]
  learningActivities: any[]
  assessmentResults: any | null
  isCreatingSession: boolean
  isOrchestrating: boolean
  isOptimizing: boolean
  isAnalyzing: boolean
  isFacilitating: boolean
  error: string | null
  warnings: string[]
  realTimeMonitoring: boolean
  collaborationMetrics: any | null
}

interface SessionCreationParams {
  participants: any[]
  learning_objectives: string[]
  session_config?: any
}

interface OrchestrationParams {
  session_id: string
  current_state: any
  participant_actions?: any[]
}

interface GroupOptimizationParams {
  session_id: string
  dynamics_data: any
  optimization_goals?: string[]
}

interface FacilitationParams {
  session_id: string
  interaction_context: any
  facilitation_goals?: string[]
}

interface GroupFormationParams {
  participants: any[]
  formation_criteria: any
  group_goals?: any
}

interface ActivityCoordinationParams {
  session_id: string
  activity_plans: any[]
  coordination_requirements?: any
}

// Main hook for collaborative learning orchestration
export function useCollaborativeLearning() {
  const [state, setState] = useState<CollaborativeLearningState>({
    sessions: [],
    currentSession: null,
    groupFormations: [],
    orchestrationResults: [],
    collaborationInsights: null,
    groupDynamicsAnalysis: null,
    peerInteractions: [],
    learningActivities: [],
    assessmentResults: null,
    isCreatingSession: false,
    isOrchestrating: false,
    isOptimizing: false,
    isAnalyzing: false,
    isFacilitating: false,
    error: null,
    warnings: [],
    realTimeMonitoring: false,
    collaborationMetrics: null
  })

  const orchestrationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const monitoringTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Create a new collaborative learning session
  const createCollaborativeSession = useCallback(async (params: SessionCreationParams) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isCreatingSession: true, 
        error: null,
        warnings: []
      }))
      
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_collaborative_session',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create collaborative session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create collaborative session')
      }

      setState(prev => ({
        ...prev,
        sessions: [data.collaborative_session, ...prev.sessions.slice(0, 9)],
        currentSession: data.collaborative_session,
        isCreatingSession: false,
        warnings: data.warnings || []
      }))

      return data.collaborative_session
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCreatingSession: false,
        error: error instanceof Error ? error.message : 'Failed to create collaborative session'
      }))
      throw error
    }
  }, [])

  // Start real-time collaboration orchestration
  const startRealTimeOrchestration = useCallback(async (
    sessionId: string,
    currentState: any,
    interval: number = 15000 // 15 seconds default
  ) => {
    try {
      setState(prev => ({ ...prev, realTimeMonitoring: true }))

      const orchestrationLoop = async () => {
        try {
          await orchestrateCollaboration({
            session_id: sessionId,
            current_state: currentState,
            participant_actions: []
          })
          
          if (state.realTimeMonitoring) {
            orchestrationIntervalRef.current = setTimeout(orchestrationLoop, interval)
          }
        } catch (error) {
          console.error('Error in real-time orchestration:', error)
          // Continue orchestration despite errors
          if (state.realTimeMonitoring) {
            orchestrationIntervalRef.current = setTimeout(orchestrationLoop, interval * 2)
          }
        }
      }

      // Start orchestration
      orchestrationLoop()

    } catch (error) {
      setState(prev => ({
        ...prev,
        realTimeMonitoring: false,
        error: error instanceof Error ? error.message : 'Failed to start real-time orchestration'
      }))
      throw error
    }
  }, [state.realTimeMonitoring])

  // Stop real-time orchestration
  const stopRealTimeOrchestration = useCallback(() => {
    setState(prev => ({ ...prev, realTimeMonitoring: false }))
    
    if (orchestrationIntervalRef.current) {
      clearTimeout(orchestrationIntervalRef.current)
      orchestrationIntervalRef.current = null
    }
  }, [])

  // Orchestrate collaboration in real-time
  const orchestrateCollaboration = useCallback(async (params: OrchestrationParams) => {
    try {
      setState(prev => ({ ...prev, isOrchestrating: true, error: null }))
      
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'orchestrate_collaboration',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to orchestrate collaboration: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to orchestrate collaboration')
      }

      setState(prev => ({
        ...prev,
        orchestrationResults: [data.orchestration_result, ...prev.orchestrationResults.slice(0, 19)],
        collaborationMetrics: data.orchestration_result.real_time_analytics,
        isOrchestrating: false
      }))

      return data.orchestration_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOrchestrating: false,
        error: error instanceof Error ? error.message : 'Failed to orchestrate collaboration'
      }))
      throw error
    }
  }, [])

  // Optimize group dynamics
  const optimizeGroupDynamics = useCallback(async (params: GroupOptimizationParams) => {
    try {
      setState(prev => ({ ...prev, isOptimizing: true, error: null }))
      
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_group_dynamics',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to optimize group dynamics: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize group dynamics')
      }

      setState(prev => ({
        ...prev,
        groupDynamicsAnalysis: data.group_dynamics_optimization,
        isOptimizing: false
      }))

      return data.group_dynamics_optimization
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: error instanceof Error ? error.message : 'Failed to optimize group dynamics'
      }))
      throw error
    }
  }, [])

  // Analyze collaboration effectiveness
  const analyzeCollaborationEffectiveness = useCallback(async (
    sessionId: string,
    analysisTimeframe: string = '24_hours',
    metricsFocus: string[] = []
  ) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }))
      
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_collaboration_effectiveness',
          session_id: sessionId,
          analysis_timeframe: analysisTimeframe,
          metrics_focus: metricsFocus
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            isAnalyzing: false
          }))
          
          return data.collaboration_effectiveness
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }))
      console.error('Error analyzing collaboration effectiveness:', error)
    }
  }, [])

  // Facilitate peer interactions
  const facilitatePeerInteractions = useCallback(async (params: FacilitationParams) => {
    try {
      setState(prev => ({ ...prev, isFacilitating: true, error: null }))
      
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'facilitate_peer_interactions',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to facilitate peer interactions: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to facilitate peer interactions')
      }

      setState(prev => ({
        ...prev,
        peerInteractions: [data.facilitation_strategies, ...prev.peerInteractions.slice(0, 9)],
        isFacilitating: false
      }))

      return data.facilitation_strategies
    } catch (error) {
      setState(prev => ({
        ...prev,
        isFacilitating: false,
        error: error instanceof Error ? error.message : 'Failed to facilitate peer interactions'
      }))
      throw error
    }
  }, [])

  // Manage group formation
  const manageGroupFormation = useCallback(async (params: GroupFormationParams) => {
    try {
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manage_group_formation',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            groupFormations: [data.group_formations, ...prev.groupFormations.slice(0, 9)]
          }))
          
          return data.group_formations
        }
      }
    } catch (error) {
      console.error('Error managing group formation:', error)
    }
  }, [])

  // Coordinate learning activities
  const coordinateLearningActivities = useCallback(async (params: ActivityCoordinationParams) => {
    try {
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'coordinate_learning_activities',
          ...params
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            learningActivities: [data.coordination_strategies, ...prev.learningActivities.slice(0, 9)]
          }))
          
          return data.coordination_strategies
        }
      }
    } catch (error) {
      console.error('Error coordinating learning activities:', error)
    }
  }, [])

  // Assess collaborative learning
  const assessCollaborativeLearning = useCallback(async (
    sessionId: string,
    assessmentCriteria?: any,
    evaluationMethods?: string[]
  ) => {
    try {
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_collaborative_learning',
          session_id: sessionId,
          assessment_criteria: assessmentCriteria,
          evaluation_methods: evaluationMethods
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            assessmentResults: data.collaborative_learning_assessment
          }))
          
          return data.collaborative_learning_assessment
        }
      }
    } catch (error) {
      console.error('Error assessing collaborative learning:', error)
    }
  }, [])

  // Generate collaboration insights
  const generateCollaborationInsights = useCallback(async (
    analysisData: any,
    insightFocus?: string,
    depthLevel?: string
  ) => {
    try {
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_collaboration_insights',
          analysis_data: analysisData,
          insight_focus: insightFocus,
          depth_level: depthLevel
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            collaborationInsights: data.collaboration_insights
          }))
          
          return data.collaboration_insights
        }
      }
    } catch (error) {
      console.error('Error generating collaboration insights:', error)
    }
  }, [])

  // Export collaboration data
  const exportCollaborationData = useCallback(async (
    sessionIds: string[],
    exportFormat: string,
    dataTypes?: string[],
    dateRange?: any
  ) => {
    try {
      const response = await fetch('/api/collaborative-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_collaboration_data',
          session_ids: sessionIds,
          export_format: exportFormat,
          data_types: dataTypes,
          date_range: dateRange
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.export_data
        }
      }
    } catch (error) {
      console.error('Error exporting collaboration data:', error)
    }
  }, [])

  // Auto-monitor collaboration quality
  useEffect(() => {
    if (state.currentSession && state.realTimeMonitoring) {
      const checkCollaborationQuality = async () => {
        try {
          const effectiveness = await analyzeCollaborationEffectiveness(
            state.currentSession!.session_id,
            '1_hour'
          )

          if (effectiveness?.overall_effectiveness < 70) {
            setState(prev => ({
              ...prev,
              warnings: [...prev.warnings, 'Collaboration effectiveness below optimal threshold']
            }))
          }
        } catch (error) {
          console.error('Error in collaboration quality monitoring:', error)
        }
      }

      monitoringTimeoutRef.current = setTimeout(checkCollaborationQuality, 10000) // 10 seconds
      
      return () => {
        if (monitoringTimeoutRef.current) {
          clearTimeout(monitoringTimeoutRef.current)
        }
      }
    }
  }, [state.currentSession, state.realTimeMonitoring, analyzeCollaborationEffectiveness])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (orchestrationIntervalRef.current) {
        clearTimeout(orchestrationIntervalRef.current)
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

  // Clear current session
  const clearCurrentSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentSession: null,
      orchestrationResults: [],
      collaborationMetrics: null
    }))
  }, [])

  return {
    // State
    sessions: state.sessions,
    currentSession: state.currentSession,
    groupFormations: state.groupFormations,
    orchestrationResults: state.orchestrationResults,
    collaborationInsights: state.collaborationInsights,
    groupDynamicsAnalysis: state.groupDynamicsAnalysis,
    peerInteractions: state.peerInteractions,
    learningActivities: state.learningActivities,
    assessmentResults: state.assessmentResults,
    isCreatingSession: state.isCreatingSession,
    isOrchestrating: state.isOrchestrating,
    isOptimizing: state.isOptimizing,
    isAnalyzing: state.isAnalyzing,
    isFacilitating: state.isFacilitating,
    error: state.error,
    warnings: state.warnings,
    realTimeMonitoring: state.realTimeMonitoring,
    collaborationMetrics: state.collaborationMetrics,
    
    // Actions
    createCollaborativeSession,
    startRealTimeOrchestration,
    stopRealTimeOrchestration,
    orchestrateCollaboration,
    optimizeGroupDynamics,
    analyzeCollaborationEffectiveness,
    facilitatePeerInteractions,
    manageGroupFormation,
    coordinateLearningActivities,
    assessCollaborativeLearning,
    generateCollaborationInsights,
    exportCollaborationData,
    clearError,
    clearWarnings,
    clearCurrentSession,
    
    // Computed state
    hasSessions: state.sessions.length > 0,
    hasCurrentSession: !!state.currentSession,
    hasGroupFormations: state.groupFormations.length > 0,
    hasOrchestrationResults: state.orchestrationResults.length > 0,
    hasCollaborationInsights: !!state.collaborationInsights,
    hasGroupDynamicsAnalysis: !!state.groupDynamicsAnalysis,
    hasPeerInteractions: state.peerInteractions.length > 0,
    hasLearningActivities: state.learningActivities.length > 0,
    hasAssessmentResults: !!state.assessmentResults,
    sessionCount: state.sessions.length,
    orchestrationCount: state.orchestrationResults.length,
    isProcessing: state.isCreatingSession || state.isOrchestrating || state.isOptimizing || state.isAnalyzing || state.isFacilitating,
    
    // Current session metrics
    currentSessionMetrics: state.currentSession ? {
      sessionId: state.currentSession.session_id,
      participantCount: state.currentSession.participants.length,
      sessionType: state.currentSession.session_metadata.session_type,
      collaborationMode: state.currentSession.session_metadata.collaboration_mode,
      estimatedDuration: state.currentSession.session_metadata.estimated_duration,
      difficultyLevel: state.currentSession.session_metadata.difficulty_level,
      learningObjectiveCount: state.currentSession.session_metadata.learning_objectives.length
    } : null,
    
    // Collaboration metrics summary
    collaborationMetricsSummary: state.collaborationMetrics ? {
      engagementLevels: state.collaborationMetrics.engagement_levels,
      interactionFrequency: state.collaborationMetrics.interaction_frequency,
      collaborationQuality: state.collaborationMetrics.collaboration_quality,
      knowledgeSharingRate: state.collaborationMetrics.knowledge_sharing_rate,
      collectiveFocus: state.collaborationMetrics.collective_focus
    } : null,
    
    // Group dynamics insights
    groupDynamicsInsights: state.groupDynamicsAnalysis ? {
      optimizationStrategiesCount: state.groupDynamicsAnalysis.optimization_strategies?.length || 0,
      interventionRecommendationsCount: state.groupDynamicsAnalysis.intervention_recommendations?.length || 0,
      expectedImprovements: state.groupDynamicsAnalysis.expected_improvements || {},
      groupRestructuring: !!state.groupDynamicsAnalysis.group_restructuring
    } : null,
    
    // Assessment insights
    assessmentInsights: state.assessmentResults ? {
      individualAssessmentCount: state.assessmentResults.individual_assessments?.length || 0,
      groupAssessmentScore: state.assessmentResults.group_assessments?.group_cohesion || 0,
      processEffectiveness: state.assessmentResults.process_assessments?.orchestration_quality || 0,
      outcomeAchievement: state.assessmentResults.outcome_assessments?.learning_objectives_achieved || 0,
      holisticScore: state.assessmentResults.holistic_evaluation?.overall_success || 0
    } : null,
    
    // Orchestration status
    orchestrationStatus: {
      isActive: state.realTimeMonitoring,
      isOrchestrating: state.isOrchestrating,
      hasResults: state.orchestrationResults.length > 0,
      lastOrchestration: state.orchestrationResults[0]?.timestamp,
      collaborationQuality: state.collaborationMetrics?.collaboration_quality || 0
    },
    
    // Warning indicators
    warningIndicators: {
      hasWarnings: state.warnings.length > 0,
      warningCount: state.warnings.length,
      hasError: !!state.error,
      collaborationHealthy: state.collaborationMetrics?.collaboration_quality > 70,
      engagementHealthy: state.collaborationMetrics ? 
        (state.collaborationMetrics.engagement_levels?.high || 0) > 60 : true
    }
  }
}

// Hook for collaborative learning configuration
export function useCollaborativeLearningConfiguration() {
  const [configuration, setConfiguration] = useState<any>({
    session_settings: {
      default_collaboration_mode: 'synchronous',
      default_session_type: 'study_group',
      default_session_format: 'semi_structured',
      max_participants_per_group: 8,
      min_participants_per_group: 3
    },
    orchestration_settings: {
      orchestration_frequency: 15, // seconds
      adaptation_sensitivity: 'medium',
      intervention_threshold: 'medium',
      quality_monitoring_level: 'high'
    },
    group_formation_criteria: {
      diversity_optimization: true,
      expertise_balance: true,
      learning_style_mix: true,
      timezone_consideration: true,
      cultural_sensitivity: true
    },
    facilitation_preferences: {
      facilitation_style: 'adaptive',
      intervention_approach: 'gradual',
      feedback_frequency: 'regular',
      peer_support_emphasis: 'high'
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
    
    if (configuration.session_settings.max_participants_per_group < configuration.session_settings.min_participants_per_group) {
      errors.push('Maximum participants must be greater than minimum participants')
    }
    
    if (configuration.orchestration_settings.orchestration_frequency < 5 || 
        configuration.orchestration_settings.orchestration_frequency > 300) {
      errors.push('Orchestration frequency must be between 5 and 300 seconds')
    }
    
    setValidationErrors(errors)
    setIsValid(errors.length === 0)
    
    return errors.length === 0
  }, [configuration])

  const resetConfiguration = useCallback(() => {
    setConfiguration({
      session_settings: {
        default_collaboration_mode: 'synchronous',
        default_session_type: 'study_group',
        default_session_format: 'semi_structured',
        max_participants_per_group: 8,
        min_participants_per_group: 3
      },
      orchestration_settings: {
        orchestration_frequency: 15,
        adaptation_sensitivity: 'medium',
        intervention_threshold: 'medium',
        quality_monitoring_level: 'high'
      },
      group_formation_criteria: {
        diversity_optimization: true,
        expertise_balance: true,
        learning_style_mix: true,
        timezone_consideration: true,
        cultural_sensitivity: true
      },
      facilitation_preferences: {
        facilitation_style: 'adaptive',
        intervention_approach: 'gradual',
        feedback_frequency: 'regular',
        peer_support_emphasis: 'high'
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
    sessionSettings: configuration.session_settings,
    orchestrationSettings: configuration.orchestration_settings,
    groupFormationCriteria: configuration.group_formation_criteria,
    facilitationPreferences: configuration.facilitation_preferences
  }
}

export default useCollaborativeLearning
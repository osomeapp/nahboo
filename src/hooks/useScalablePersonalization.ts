'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  type LearnerProfile,
  type PersonalizedLearningPath,
  type AdaptationEvent,
  type PersonalizationAnalytics
} from '@/lib/scalable-learning-path-personalization'

interface ScalablePersonalizationState {
  currentLearnerProfile: LearnerProfile | null
  personalizedPath: PersonalizedLearningPath | null
  pathHistory: PersonalizedLearningPath[]
  adaptationEvents: AdaptationEvent[]
  systemAnalytics: PersonalizationAnalytics | null
  scalabilityMetrics: Record<string, number> | null
  clusterInfo: any | null
  isGeneratingPath: boolean
  isAdapting: boolean
  isOptimizing: boolean
  error: string | null
  lastPathId: string | null
}

interface PathGenerationProgress {
  stage: 'profiling' | 'clustering' | 'template_selection' | 'ai_generation' | 'optimization' | 'validation' | 'caching' | 'complete'
  progress_percentage: number
  current_activity: string
  estimated_completion_time: number
  cluster_assignment?: string
  personalization_factors?: string[]
}

// Main hook for scalable learning path personalization
export function useScalablePersonalization() {
  const [state, setState] = useState<ScalablePersonalizationState>({
    currentLearnerProfile: null,
    personalizedPath: null,
    pathHistory: [],
    adaptationEvents: [],
    systemAnalytics: null,
    scalabilityMetrics: null,
    clusterInfo: null,
    isGeneratingPath: false,
    isAdapting: false,
    isOptimizing: false,
    error: null,
    lastPathId: null
  })

  const adaptationQueueRef = useRef<AdaptationEvent[]>([])
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Generate personalized learning path
  const generatePersonalizedPath = useCallback(async (learnerProfile: LearnerProfile) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGeneratingPath: true, 
        error: null,
        currentLearnerProfile: learnerProfile
      }))
      
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_personalized_path',
          learner_profile: learnerProfile
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate personalized path: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate personalized path')
      }

      setState(prev => ({
        ...prev,
        personalizedPath: data.personalized_path,
        pathHistory: [data.personalized_path, ...prev.pathHistory.slice(0, 9)], // Keep last 10
        isGeneratingPath: false,
        lastPathId: data.personalized_path.path_id
      }))

      return data.personalized_path
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingPath: false,
        error: error instanceof Error ? error.message : 'Failed to generate personalized path'
      }))
      throw error
    }
  }, [])

  // Generate path with progress tracking
  const generatePathWithProgress = useCallback(async (
    learnerProfile: LearnerProfile,
    progressCallback?: (progress: PathGenerationProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGeneratingPath: true, 
        error: null,
        currentLearnerProfile: learnerProfile
      }))

      // Simulate progress updates during generation
      const simulateProgress = () => {
        const stages: PathGenerationProgress['stage'][] = [
          'profiling', 'clustering', 'template_selection', 'ai_generation', 
          'optimization', 'validation', 'caching', 'complete'
        ]
        
        let currentStage = 0
        const totalStages = stages.length
        
        const updateProgress = () => {
          if (currentStage < totalStages) {
            const progress: PathGenerationProgress = {
              stage: stages[currentStage],
              progress_percentage: Math.floor((currentStage / totalStages) * 100),
              current_activity: getStageDescription(stages[currentStage]),
              estimated_completion_time: (totalStages - currentStage) * 2000, // 2 seconds per stage
              cluster_assignment: currentStage >= 1 ? 'advanced_visual_learners' : undefined,
              personalization_factors: currentStage >= 2 ? [
                'cognitive_style_visual',
                'processing_speed_8',
                'goal_oriented_career'
              ] : undefined
            }
            
            progressCallback?.(progress)
            currentStage++
            
            if (currentStage < totalStages) {
              setTimeout(updateProgress, 1500 + Math.random() * 1000) // 1.5-2.5 seconds per stage
            }
          }
        }
        
        updateProgress()
      }

      // Start progress simulation
      if (progressCallback) {
        simulateProgress()
      }

      // Actual path generation
      const result = await generatePersonalizedPath(learnerProfile)
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress_percentage: 100,
          current_activity: 'Personalized path ready',
          estimated_completion_time: 0,
          cluster_assignment: 'advanced_visual_learners',
          personalization_factors: [
            'cognitive_style_visual',
            'processing_speed_8',
            'goal_oriented_career',
            'accessibility_optimized'
          ]
        })
      }

      return result

    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingPath: false,
        error: error instanceof Error ? error.message : 'Failed to generate personalized path'
      }))
      throw error
    }
  }, [generatePersonalizedPath])

  // Register adaptation event
  const registerAdaptationEvent = useCallback(async (event: AdaptationEvent) => {
    try {
      // Add to local queue immediately
      adaptationQueueRef.current.push(event)
      setState(prev => ({
        ...prev,
        adaptationEvents: [...prev.adaptationEvents, event]
      }))

      // Register with the backend
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register_adaptation_event',
          adaptation_event: event
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Adaptation event registered:', data.batch_results)
      }

      // Process immediately if high priority
      if (event.required_adaptations.some(a => a.urgency === 'immediate')) {
        await adaptPathRealTime(event.learner_id, event)
      }

    } catch (error) {
      console.error('Error registering adaptation event:', error)
    }
  }, [])

  // Adapt path in real-time
  const adaptPathRealTime = useCallback(async (learnerId: string, adaptationEvent: AdaptationEvent) => {
    try {
      setState(prev => ({ ...prev, isAdapting: true, error: null }))
      
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adapt_path_real_time',
          learner_id: learnerId,
          adaptation_event: adaptationEvent
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to adapt path: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to adapt path in real-time')
      }

      if (data.adapted_path) {
        setState(prev => ({
          ...prev,
          personalizedPath: data.adapted_path,
          pathHistory: [data.adapted_path, ...prev.pathHistory.slice(0, 9)],
          isAdapting: false,
          lastPathId: data.adapted_path.path_id
        }))
      } else {
        setState(prev => ({ ...prev, isAdapting: false }))
      }

      return data.adapted_path
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAdapting: false,
        error: error instanceof Error ? error.message : 'Failed to adapt path in real-time'
      }))
      throw error
    }
  }, [])

  // Load system analytics
  const loadSystemAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_analytics',
          include_detailed_metrics: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            systemAnalytics: data.analytics
          }))
        }
      }
    } catch (error) {
      console.error('Error loading system analytics:', error)
    }
  }, [])

  // Load scalability metrics
  const loadScalabilityMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_scalability_metrics'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            scalabilityMetrics: data.scalability_metrics
          }))
        }
      }
    } catch (error) {
      console.error('Error loading scalability metrics:', error)
    }
  }, [])

  // Get learner cluster information
  const getLearnerCluster = useCallback(async (learnerId: string) => {
    try {
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_learner_cluster',
          learner_id: learnerId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            clusterInfo: data.system_status
          }))
          
          return data.system_status
        }
      }
    } catch (error) {
      console.error('Error getting learner cluster:', error)
    }
    return null
  }, [])

  // Process batch updates
  const processBatchUpdates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isOptimizing: true }))
      
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_batch_updates',
          batch_size: 1000,
          priority_processing: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          console.log('Batch processing completed:', data.batch_results)
          
          // Refresh analytics after batch processing
          await loadSystemAnalytics()
          await loadScalabilityMetrics()
        }
      }
    } catch (error) {
      console.error('Error processing batch updates:', error)
    } finally {
      setState(prev => ({ ...prev, isOptimizing: false }))
    }
  }, [loadSystemAnalytics, loadScalabilityMetrics])

  // Auto-process adaptation queue
  const processAdaptationQueue = useCallback(async () => {
    if (adaptationQueueRef.current.length === 0) return

    const highPriorityEvents = adaptationQueueRef.current.filter(event =>
      event.required_adaptations.some(a => a.urgency === 'immediate')
    )

    for (const event of highPriorityEvents) {
      await adaptPathRealTime(event.learner_id, event)
      // Remove from queue
      adaptationQueueRef.current = adaptationQueueRef.current.filter(e => e.event_id !== event.event_id)
    }
  }, [adaptPathRealTime])

  // Auto-process adaptations every 10 seconds
  useEffect(() => {
    const interval = setInterval(processAdaptationQueue, 10000)
    return () => clearInterval(interval)
  }, [processAdaptationQueue])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear current path
  const clearPath = useCallback(() => {
    setState(prev => ({
      ...prev,
      personalizedPath: null,
      currentLearnerProfile: null
    }))
  }, [])

  // Update learner profile
  const updateLearnerProfile = useCallback((updates: Partial<LearnerProfile>) => {
    setState(prev => ({
      ...prev,
      currentLearnerProfile: prev.currentLearnerProfile ? {
        ...prev.currentLearnerProfile,
        ...updates
      } : null
    }))
  }, [])

  return {
    // State
    currentLearnerProfile: state.currentLearnerProfile,
    personalizedPath: state.personalizedPath,
    pathHistory: state.pathHistory,
    adaptationEvents: state.adaptationEvents,
    systemAnalytics: state.systemAnalytics,
    scalabilityMetrics: state.scalabilityMetrics,
    clusterInfo: state.clusterInfo,
    isGeneratingPath: state.isGeneratingPath,
    isAdapting: state.isAdapting,
    isOptimizing: state.isOptimizing,
    error: state.error,
    lastPathId: state.lastPathId,
    
    // Actions
    generatePersonalizedPath,
    generatePathWithProgress,
    registerAdaptationEvent,
    adaptPathRealTime,
    loadSystemAnalytics,
    loadScalabilityMetrics,
    getLearnerCluster,
    processBatchUpdates,
    clearError,
    clearPath,
    updateLearnerProfile,
    
    // Computed state
    hasPersonalizedPath: !!state.personalizedPath,
    hasLearnerProfile: !!state.currentLearnerProfile,
    hasSystemAnalytics: !!state.systemAnalytics,
    pathCount: state.pathHistory.length,
    adaptationEventCount: state.adaptationEvents.length,
    queuedAdaptations: adaptationQueueRef.current.length,
    isProcessing: state.isGeneratingPath || state.isAdapting || state.isOptimizing,
    
    // Path analytics
    currentPathMetrics: state.personalizedPath ? {
      confidence: state.personalizedPath.path_metadata.confidence_score,
      estimatedHours: state.personalizedPath.path_metadata.estimated_completion_time,
      personalizationFactors: state.personalizedPath.path_metadata.personalization_factors.length,
      adaptationTriggers: state.personalizedPath.path_metadata.adaptation_triggers.length,
      nodeCount: state.personalizedPath.learning_sequence.length
    } : null,
    
    // System health indicators
    systemHealth: state.systemAnalytics ? {
      efficiency: state.systemAnalytics.system_performance.optimization_effectiveness,
      scalability: state.systemAnalytics.scalability_metrics.distributed_processing_efficiency,
      userSatisfaction: (state.systemAnalytics.learner_outcomes.satisfaction_score_improvement + 0.7), // baseline + improvement
      performance: state.systemAnalytics.scalability_metrics.processing_throughput / 1000 // normalize to 0-1
    } : null
  }
}

// Hook for real-time system monitoring
export function useSystemMonitoring() {
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const startMonitoring = useCallback(async () => {
    setIsMonitoring(true)

    const updateStatus = async () => {
      try {
        const response = await fetch('/api/scalable-personalization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_system_status'
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            setSystemStatus(data.system_status)
          }
        }
      } catch (error) {
        console.error('Error updating system status:', error)
      }
    }

    // Initial update
    await updateStatus()

    // Set up periodic updates
    const interval = setInterval(updateStatus, 30000) // Every 30 seconds
    
    return () => {
      clearInterval(interval)
      setIsMonitoring(false)
    }
  }, [])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  return {
    systemStatus,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    
    // Computed system metrics
    isHealthy: systemStatus?.health_score > 0.8,
    currentLoad: systemStatus?.capacity_status?.current_load,
    responseTime: systemStatus?.performance_metrics?.response_time_ms,
    throughput: systemStatus?.performance_metrics?.throughput_per_second,
    errorRate: systemStatus?.performance_metrics?.error_rate,
    uptime: systemStatus?.performance_metrics?.uptime_percentage,
    alerts: systemStatus?.alerts || [],
    recentOptimizations: systemStatus?.recent_optimizations || []
  }
}

// Hook for cluster analytics
export function useClusterAnalytics() {
  const [clusterDistribution, setClusterDistribution] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadClusterDistribution = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/scalable-personalization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_cluster_distribution'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setClusterDistribution(data.cluster_distribution)
        }
      }
    } catch (error) {
      console.error('Error loading cluster distribution:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadClusterDistribution()
  }, [loadClusterDistribution])

  return {
    clusterDistribution,
    isLoading,
    loadClusterDistribution,
    
    // Computed cluster metrics
    totalClusters: clusterDistribution?.analytics?.total_clusters || 0,
    largestCluster: clusterDistribution?.analytics?.largest_cluster,
    smallestCluster: clusterDistribution?.analytics?.smallest_cluster,
    averageClusterSize: clusterDistribution?.analytics?.average_cluster_size || 0,
    clusterBalance: clusterDistribution?.analytics?.cluster_balance_score || 0,
    optimizationRecommendations: clusterDistribution?.analytics?.recommended_optimizations || []
  }
}

// Utility function for stage descriptions
function getStageDescription(stage: PathGenerationProgress['stage']): string {
  const descriptions: Record<PathGenerationProgress['stage'], string> = {
    profiling: 'Analyzing learner profile and characteristics',
    clustering: 'Assigning to optimal learner cluster',
    template_selection: 'Selecting best personalization templates',
    ai_generation: 'Generating AI-powered learning path',
    optimization: 'Optimizing path for scalability and effectiveness',
    validation: 'Validating path quality and coherence',
    caching: 'Caching optimized path for fast access',
    complete: 'Personalized learning path ready'
  }
  
  return descriptions[stage] || 'Processing...'
}
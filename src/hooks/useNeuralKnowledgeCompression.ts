'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type KnowledgeCompressionRequest,
  type CompressedKnowledge,
  type KnowledgeNode,
  type KnowledgeGraph
} from '@/lib/neural-knowledge-compression'

interface KnowledgeCompressionState {
  compressedKnowledgeItems: CompressedKnowledge[]
  currentCompression: CompressedKnowledge | null
  knowledgeGraphs: KnowledgeGraph[]
  compressionAnalytics: any | null
  qualityAssessment: any | null
  learningPathways: any[]
  adaptiveElements: any[]
  isCompressing: boolean
  isAnalyzing: boolean
  isOptimizing: boolean
  isExporting: boolean
  isAdapting: boolean
  error: string | null
  warnings: string[]
  compressionProgress: any | null
  lastCompressionRequest: KnowledgeCompressionRequest | null
}

interface CompressionProgress {
  stage: 'analyzing' | 'extracting' | 'compressing' | 'optimizing' | 'validating' | 'finalizing' | 'complete'
  progress_percentage: number
  current_activity: string
  concepts_processed: number
  relationships_identified: number
  compression_quality: number
  estimated_completion_time: number
}

interface CompressionParams {
  source_content: {
    content_type: string
    content_data: string
    subject_domain: string
    complexity_level: number
    learning_objectives: string[]
  }
  compression_settings: {
    target_compression_ratio: number
    max_cognitive_load: number
    optimization_focus: string
    concept_granularity: string
    relationship_depth: number
  }
  learner_customization: {
    learning_style: string
    prior_knowledge: string[]
    time_constraints: any
    mastery_goals: string[]
  }
}

interface AdaptationParams {
  compression_id: string
  learning_progress: any
  performance_metrics: any
  adaptation_goals: string[]
}

interface OptimizationParams {
  compression_id: string
  learning_goals: string[]
  performance_targets: Record<string, number>
  optimization_focus: string[]
}

// Main hook for neural knowledge compression
export function useNeuralKnowledgeCompression() {
  const [state, setState] = useState<KnowledgeCompressionState>({
    compressedKnowledgeItems: [],
    currentCompression: null,
    knowledgeGraphs: [],
    compressionAnalytics: null,
    qualityAssessment: null,
    learningPathways: [],
    adaptiveElements: [],
    isCompressing: false,
    isAnalyzing: false,
    isOptimizing: false,
    isExporting: false,
    isAdapting: false,
    error: null,
    warnings: [],
    compressionProgress: null,
    lastCompressionRequest: null
  })

  const compressionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const analyticsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Compress knowledge content
  const compressKnowledge = useCallback(async (params: CompressionParams) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isCompressing: true, 
        error: null,
        warnings: [],
        compressionProgress: null
      }))
      
      const compressionRequest: KnowledgeCompressionRequest = {
        source_content: {
          content_type: params.source_content.content_type as any,
          content_data: params.source_content.content_data,
          subject_domain: params.source_content.subject_domain,
          target_audience: {
            age_group: 'adult',
            education_level: 'intermediate',
            domain_expertise: 'beginner',
            learning_context: 'personal',
            time_availability: 'moderate'
          },
          complexity_level: params.source_content.complexity_level,
          learning_objectives: params.source_content.learning_objectives
        },
        compression_parameters: {
          target_compression_ratio: params.compression_settings.target_compression_ratio,
          max_cognitive_load: params.compression_settings.max_cognitive_load,
          optimization_focus: params.compression_settings.optimization_focus as any,
          concept_granularity: params.compression_settings.concept_granularity as any,
          relationship_depth: params.compression_settings.relationship_depth,
          personalization_level: 80
        },
        learner_profile: {
          prior_knowledge: params.learner_customization.prior_knowledge,
          learning_style: params.learner_customization.learning_style,
          cognitive_preferences: {
            information_processing_style: 'mixed',
            abstraction_preference: 'balanced',
            example_preference: 'varied',
            relationship_focus: 'networked',
            depth_vs_breadth: 'balanced'
          },
          time_constraints: params.learner_customization.time_constraints || {
            total_learning_time: 240,
            session_length_preference: 45,
            learning_frequency: 'daily',
            deadline_pressure: 'moderate'
          },
          mastery_goals: params.learner_customization.mastery_goals
        },
        quality_constraints: {
          minimum_information_retention: 85,
          maximum_concept_complexity: 8,
          required_accuracy_level: 90,
          essential_concept_preservation: []
        }
      }
      
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compress_knowledge',
          compression_request: compressionRequest
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to compress knowledge: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to compress knowledge')
      }

      setState(prev => ({
        ...prev,
        compressedKnowledgeItems: [data.compressed_knowledge, ...prev.compressedKnowledgeItems.slice(0, 9)],
        currentCompression: data.compressed_knowledge,
        isCompressing: false,
        lastCompressionRequest: compressionRequest,
        warnings: data.warnings || []
      }))

      return data.compressed_knowledge
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCompressing: false,
        error: error instanceof Error ? error.message : 'Failed to compress knowledge'
      }))
      throw error
    }
  }, [])

  // Compress with progress tracking
  const compressKnowledgeWithProgress = useCallback(async (
    params: CompressionParams,
    progressCallback?: (progress: CompressionProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isCompressing: true, 
        error: null,
        warnings: [],
        compressionProgress: null
      }))

      // Simulate progress updates during compression
      const simulateProgress = () => {
        const stages: CompressionProgress['stage'][] = [
          'analyzing', 'extracting', 'compressing', 'optimizing', 'validating', 'finalizing', 'complete'
        ]
        
        let currentStage = 0
        const totalStages = stages.length
        
        const updateProgress = () => {
          if (currentStage < totalStages) {
            const progress: CompressionProgress = {
              stage: stages[currentStage],
              progress_percentage: Math.floor((currentStage / totalStages) * 100),
              current_activity: getCompressionStageDescription(stages[currentStage]),
              concepts_processed: currentStage >= 1 ? Math.floor(currentStage * 8) + Math.floor(Math.random() * 5) : 0,
              relationships_identified: currentStage >= 2 ? Math.floor(currentStage * 15) + Math.floor(Math.random() * 10) : 0,
              compression_quality: currentStage >= 3 ? 80 + Math.random() * 15 : 0,
              estimated_completion_time: (totalStages - currentStage) * 18000 // 18 seconds per stage
            }
            
            progressCallback?.(progress)
            setState(prev => ({ ...prev, compressionProgress: progress }))
            currentStage++
            
            if (currentStage < totalStages) {
              setTimeout(updateProgress, 15000 + Math.random() * 6000) // 15-21 seconds per stage
            }
          }
        }
        
        updateProgress()
      }

      // Start progress simulation
      if (progressCallback) {
        simulateProgress()
      }

      // Actual compression
      const result = await compressKnowledge(params)
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress_percentage: 100,
          current_activity: 'Knowledge compression completed successfully',
          concepts_processed: result.knowledge_graph?.node_count || 0,
          relationships_identified: result.knowledge_graph?.relationship_count || 0,
          compression_quality: result.quality_metrics?.overall_quality_score || 0,
          estimated_completion_time: 0
        })
      }

      return result

    } catch (error) {
      setState(prev => ({
        ...prev,
        isCompressing: false,
        error: error instanceof Error ? error.message : 'Failed to compress knowledge'
      }))
      throw error
    }
  }, [compressKnowledge])

  // Adapt compressed knowledge
  const adaptCompressedKnowledge = useCallback(async (params: AdaptationParams) => {
    try {
      setState(prev => ({ ...prev, isAdapting: true, error: null }))
      
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adapt_compressed_knowledge',
          compression_id: params.compression_id,
          learning_progress: params.learning_progress,
          performance_metrics: params.performance_metrics
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to adapt compressed knowledge: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to adapt compressed knowledge')
      }

      setState(prev => ({
        ...prev,
        adaptiveElements: data.adaptation_result.adaptations,
        learningPathways: data.adaptation_result.updated_pathways,
        isAdapting: false
      }))

      return data.adaptation_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAdapting: false,
        error: error instanceof Error ? error.message : 'Failed to adapt compressed knowledge'
      }))
      throw error
    }
  }, [])

  // Optimize for learning goals
  const optimizeForLearningGoals = useCallback(async (params: OptimizationParams) => {
    try {
      setState(prev => ({ ...prev, isOptimizing: true, error: null }))
      
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_for_learning_goals',
          compression_id: params.compression_id,
          learning_goals: params.learning_goals,
          performance_targets: params.performance_targets
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to optimize for learning goals: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize for learning goals')
      }

      setState(prev => ({
        ...prev,
        currentCompression: data.optimization_result.optimized_compression,
        isOptimizing: false
      }))

      return data.optimization_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOptimizing: false,
        error: error instanceof Error ? error.message : 'Failed to optimize for learning goals'
      }))
      throw error
    }
  }, [])

  // Analyze knowledge graph
  const analyzeKnowledgeGraph = useCallback(async (
    compressionId: string,
    analysisType: string = 'comprehensive'
  ) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }))
      
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_knowledge_graph',
          compression_id: compressionId,
          analysis_type: analysisType
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            isAnalyzing: false
          }))
          
          return data.graph_analysis
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }))
      console.error('Error analyzing knowledge graph:', error)
    }
  }, [])

  // Measure compression effectiveness
  const measureCompressionEffectiveness = useCallback(async (
    compressionId: string,
    learningData: any,
    timeframe: string = '30_days'
  ) => {
    try {
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'measure_compression_effectiveness',
          compression_id: compressionId,
          learning_data: learningData,
          timeframe
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.effectiveness_measurement
        }
      }
    } catch (error) {
      console.error('Error measuring compression effectiveness:', error)
    }
  }, [])

  // Get compression analytics
  const getCompressionAnalytics = useCallback(async (
    compressionId: string,
    analyticsType: string = 'comprehensive',
    timeRange: string = '7_days'
  ) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }))
      
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_compression_analytics',
          compression_id: compressionId,
          analytics_type: analyticsType,
          time_range: timeRange
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            compressionAnalytics: data.compression_analytics,
            isAnalyzing: false
          }))
          
          return data.compression_analytics
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }))
      console.error('Error getting compression analytics:', error)
    }
  }, [])

  // Assess compression quality
  const assessCompressionQuality = useCallback(async (
    compressionId: string,
    qualityCriteria?: any
  ) => {
    try {
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_compression_quality',
          compression_id: compressionId,
          quality_criteria: qualityCriteria
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            qualityAssessment: data.quality_assessment
          }))
          
          return data.quality_assessment
        }
      }
    } catch (error) {
      console.error('Error assessing compression quality:', error)
    }
  }, [])

  // Export compressed knowledge
  const exportCompressedKnowledge = useCallback(async (
    compressionId: string,
    exportFormat: string,
    exportOptions?: any
  ) => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }))
      
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_compressed_knowledge',
          compression_id: compressionId,
          export_format: exportFormat,
          export_options: exportOptions
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to export compressed knowledge: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export compressed knowledge')
      }

      setState(prev => ({
        ...prev,
        isExporting: false
      }))

      return data.export_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Failed to export compressed knowledge'
      }))
      throw error
    }
  }, [])

  // Generate learning pathways
  const generateLearningPathways = useCallback(async (
    compressionId: string,
    learnerProfile: any,
    pathwayPreferences?: any
  ) => {
    try {
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_learning_pathways',
          compression_id: compressionId,
          learner_profile: learnerProfile,
          pathway_preferences: pathwayPreferences
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            learningPathways: data.learning_pathways
          }))
          
          return data.learning_pathways
        }
      }
    } catch (error) {
      console.error('Error generating learning pathways:', error)
    }
  }, [])

  // Update compression parameters
  const updateCompressionParameters = useCallback(async (
    compressionId: string,
    parameterUpdates: any
  ) => {
    try {
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_compression_parameters',
          compression_id: compressionId,
          parameter_updates: parameterUpdates
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          return data.update_result
        }
      }
    } catch (error) {
      console.error('Error updating compression parameters:', error)
    }
  }, [])

  // Auto-refresh analytics
  useEffect(() => {
    if (state.currentCompression) {
      const interval = setInterval(() => {
        getCompressionAnalytics(state.currentCompression!.compression_id)
      }, 5 * 60 * 1000) // 5 minutes
      
      analyticsIntervalRef.current = interval
      return () => clearInterval(interval)
    }
  }, [state.currentCompression, getCompressionAnalytics])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (compressionTimeoutRef.current) {
        clearTimeout(compressionTimeoutRef.current)
      }
      if (analyticsIntervalRef.current) {
        clearInterval(analyticsIntervalRef.current)
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

  // Clear current compression
  const clearCurrentCompression = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentCompression: null,
      compressionProgress: null,
      lastCompressionRequest: null
    }))
  }, [])

  return {
    // State
    compressedKnowledgeItems: state.compressedKnowledgeItems,
    currentCompression: state.currentCompression,
    knowledgeGraphs: state.knowledgeGraphs,
    compressionAnalytics: state.compressionAnalytics,
    qualityAssessment: state.qualityAssessment,
    learningPathways: state.learningPathways,
    adaptiveElements: state.adaptiveElements,
    isCompressing: state.isCompressing,
    isAnalyzing: state.isAnalyzing,
    isOptimizing: state.isOptimizing,
    isExporting: state.isExporting,
    isAdapting: state.isAdapting,
    error: state.error,
    warnings: state.warnings,
    compressionProgress: state.compressionProgress,
    lastCompressionRequest: state.lastCompressionRequest,
    
    // Actions
    compressKnowledge,
    compressKnowledgeWithProgress,
    adaptCompressedKnowledge,
    optimizeForLearningGoals,
    analyzeKnowledgeGraph,
    measureCompressionEffectiveness,
    getCompressionAnalytics,
    assessCompressionQuality,
    exportCompressedKnowledge,
    generateLearningPathways,
    updateCompressionParameters,
    clearError,
    clearWarnings,
    clearCurrentCompression,
    
    // Computed state
    hasCompressions: state.compressedKnowledgeItems.length > 0,
    hasCurrentCompression: !!state.currentCompression,
    hasAnalytics: !!state.compressionAnalytics,
    hasQualityAssessment: !!state.qualityAssessment,
    hasLearningPathways: state.learningPathways.length > 0,
    hasAdaptiveElements: state.adaptiveElements.length > 0,
    compressionCount: state.compressedKnowledgeItems.length,
    pathwayCount: state.learningPathways.length,
    adaptiveElementCount: state.adaptiveElements.length,
    isProcessing: state.isCompressing || state.isAnalyzing || state.isOptimizing || state.isExporting || state.isAdapting,
    
    // Compression insights
    currentCompressionMetrics: state.currentCompression ? {
      compressionRatio: state.currentCompression.compression_analytics?.overall_compression_ratio || 0,
      qualityScore: state.currentCompression.quality_metrics?.overall_quality_score || 0,
      nodeCount: state.currentCompression.knowledge_graph?.node_count || 0,
      relationshipCount: state.currentCompression.knowledge_graph?.relationship_count || 0,
      learningEfficiencyGain: state.currentCompression.compression_analytics?.learning_efficiency_gain || 0,
      cognitiveLoadReduction: state.currentCompression.compression_analytics?.cognitive_load_reduction || 0
    } : null,
    
    // Analytics insights
    analyticsInsights: state.compressionAnalytics ? {
      totalLearners: state.compressionAnalytics.usage_statistics?.total_learners || 0,
      completionRate: state.compressionAnalytics.usage_statistics?.completion_rate || 0,
      learningAcceleration: state.compressionAnalytics.performance_metrics?.learning_acceleration || 0,
      retentionImprovement: state.compressionAnalytics.performance_metrics?.retention_improvement || 0,
      learnerSatisfaction: state.compressionAnalytics.performance_metrics?.learner_satisfaction || 0,
      adaptationSuccess: state.compressionAnalytics.adaptation_effectiveness?.adaptation_success_rate || 0
    } : null,
    
    // Quality insights
    qualityInsights: state.qualityAssessment ? {
      overallQuality: state.qualityAssessment.overall_quality_score || 0,
      informationFidelity: state.qualityAssessment.quality_dimensions?.information_fidelity || 0,
      learningOptimization: state.qualityAssessment.quality_dimensions?.learning_optimization || 0,
      compressionEfficiency: state.qualityAssessment.quality_dimensions?.compression_efficiency || 0,
      relationshipQuality: state.qualityAssessment.quality_dimensions?.relationship_quality || 0,
      cognitiveAlignment: state.qualityAssessment.quality_dimensions?.cognitive_alignment || 0
    } : null,
    
    // Progress insights
    progressInsights: state.compressionProgress ? {
      currentStage: state.compressionProgress.stage,
      progressPercentage: state.compressionProgress.progress_percentage,
      conceptsProcessed: state.compressionProgress.concepts_processed,
      relationshipsIdentified: state.compressionProgress.relationships_identified,
      estimatedTimeRemaining: Math.floor(state.compressionProgress.estimated_completion_time / 1000),
      qualityScore: state.compressionProgress.compression_quality
    } : null
  }
}

// Hook for compression configuration management
export function useCompressionConfiguration() {
  const [configuration, setConfiguration] = useState<any>({
    compression_settings: {
      target_compression_ratio: 0.7,
      max_cognitive_load: 7,
      optimization_focus: 'retention',
      concept_granularity: 'medium',
      relationship_depth: 3
    },
    quality_thresholds: {
      minimum_information_retention: 85,
      maximum_concept_complexity: 8,
      required_accuracy_level: 90
    },
    learner_preferences: {
      learning_style: 'balanced',
      time_constraints: {
        session_length_preference: 45,
        total_learning_time: 240
      }
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
    
    if (configuration.compression_settings.target_compression_ratio < 0.1 || 
        configuration.compression_settings.target_compression_ratio > 0.9) {
      errors.push('Compression ratio must be between 0.1 and 0.9')
    }
    
    if (configuration.compression_settings.max_cognitive_load < 1 || 
        configuration.compression_settings.max_cognitive_load > 10) {
      errors.push('Cognitive load must be between 1 and 10')
    }
    
    if (configuration.quality_thresholds.minimum_information_retention < 50) {
      errors.push('Information retention threshold too low (minimum 50%)')
    }
    
    setValidationErrors(errors)
    setIsValid(errors.length === 0)
    
    return errors.length === 0
  }, [configuration])

  const resetConfiguration = useCallback(() => {
    setConfiguration({
      compression_settings: {
        target_compression_ratio: 0.7,
        max_cognitive_load: 7,
        optimization_focus: 'retention',
        concept_granularity: 'medium',
        relationship_depth: 3
      },
      quality_thresholds: {
        minimum_information_retention: 85,
        maximum_concept_complexity: 8,
        required_accuracy_level: 90
      },
      learner_preferences: {
        learning_style: 'balanced',
        time_constraints: {
          session_length_preference: 45,
          total_learning_time: 240
        }
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
    compressionSettings: configuration.compression_settings,
    qualityThresholds: configuration.quality_thresholds,
    learnerPreferences: configuration.learner_preferences
  }
}

// Hook for knowledge graph visualization
export function useKnowledgeGraphVisualization() {
  const [graphData, setGraphData] = useState<any>(null)
  const [visualizationSettings, setVisualizationSettings] = useState({
    layout: 'force',
    colorScheme: 'difficulty',
    showRelationships: true,
    showClusters: true,
    showCriticalPaths: true,
    nodeSize: 'importance',
    edgeThickness: 'strength'
  })
  const [isLoading, setIsLoading] = useState(false)

  const loadGraphVisualization = useCallback(async (compressionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/knowledge-compression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_knowledge_graph',
          compression_id: compressionId,
          analysis_type: 'visualization'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setGraphData(data.visualization_data)
        }
      }
    } catch (error) {
      console.error('Error loading graph visualization:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateVisualizationSettings = useCallback((settings: Partial<typeof visualizationSettings>) => {
    setVisualizationSettings(prev => ({ ...prev, ...settings }))
  }, [])

  const exportVisualization = useCallback((format: 'png' | 'svg' | 'json') => {
    // Implementation would export visualization in specified format
    console.log(`Exporting visualization as ${format}`)
  }, [])

  return {
    graphData,
    visualizationSettings,
    isLoading,
    loadGraphVisualization,
    updateVisualizationSettings,
    exportVisualization,
    hasGraphData: !!graphData,
    nodeCount: graphData?.nodes?.length || 0,
    edgeCount: graphData?.edges?.length || 0,
    clusterCount: graphData?.clusters?.length || 0
  }
}

// Utility functions
function getCompressionStageDescription(stage: CompressionProgress['stage']): string {
  const descriptions: Record<CompressionProgress['stage'], string> = {
    analyzing: 'Analyzing source content structure and complexity',
    extracting: 'Extracting key concepts and relationships from content',
    compressing: 'Applying neural compression algorithms to optimize information',
    optimizing: 'Optimizing knowledge structure for learning effectiveness',
    validating: 'Validating compression quality and information integrity',
    finalizing: 'Finalizing compressed knowledge structure and pathways',
    complete: 'Knowledge compression completed successfully'
  }
  
  return descriptions[stage] || 'Processing knowledge compression...'
}

export default useNeuralKnowledgeCompression
'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type ContentGenerationRequest,
  type ContentGenerationResult,
  type AnyContentFormat,
  type ContentOptimizationConfig,
  type ContentPerformanceMetrics
} from '@/lib/multimodal-content-generator'

interface MultimodalContentState {
  currentGenerationResult: ContentGenerationResult | null
  generatedContent: AnyContentFormat[]
  selectedContent: AnyContentFormat | null
  contentHistory: ContentGenerationResult[]
  performanceData: Map<string, ContentPerformanceMetrics>
  isGenerating: boolean
  isValidating: boolean
  isExporting: boolean
  error: string | null
  lastRequestId: string | null
}

interface ContentGenerationProgress {
  stage: 'analyzing' | 'generating_text' | 'generating_audio' | 'generating_visual' | 'generating_interactive' | 'generating_multimodal' | 'evaluating' | 'optimizing' | 'finalizing'
  progress_percentage: number
  current_activity: string
  formats_completed: string[]
  estimated_completion_time: number
}

// Main hook for multimodal content generation
export function useMultimodalContentGenerator() {
  const [state, setState] = useState<MultimodalContentState>({
    currentGenerationResult: null,
    generatedContent: [],
    selectedContent: null,
    contentHistory: [],
    performanceData: new Map(),
    isGenerating: false,
    isValidating: false,
    isExporting: false,
    error: null,
    lastRequestId: null
  })

  // Generate multimodal content
  const generateContent = useCallback(async (request: ContentGenerationRequest) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null 
      }))
      
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_content',
          generation_request: request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate multimodal content')
      }

      setState(prev => ({
        ...prev,
        currentGenerationResult: data.generation_result,
        generatedContent: data.generation_result.content_options,
        contentHistory: [data.generation_result, ...prev.contentHistory.slice(0, 9)], // Keep last 10
        isGenerating: false,
        lastRequestId: data.generation_result.request_id,
        selectedContent: data.generation_result.content_options.find(
          (opt: AnyContentFormat) => opt.id === data.generation_result.recommended_option
        ) || data.generation_result.content_options[0] || null
      }))

      return data.generation_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate multimodal content'
      }))
      throw error
    }
  }, [])

  // Generate content with progress tracking
  const generateContentWithProgress = useCallback(async (
    request: ContentGenerationRequest,
    progressCallback?: (progress: ContentGenerationProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null 
      }))

      // Simulate progress updates while generating
      const simulateProgress = () => {
        const stages: ContentGenerationProgress['stage'][] = [
          'analyzing', 'generating_text', 'generating_audio', 
          'generating_visual', 'generating_interactive', 'generating_multimodal',
          'evaluating', 'optimizing', 'finalizing'
        ]
        
        let currentStage = 0
        const totalStages = stages.length
        
        const updateProgress = () => {
          if (currentStage < totalStages) {
            const progress: ContentGenerationProgress = {
              stage: stages[currentStage],
              progress_percentage: Math.floor((currentStage / totalStages) * 100),
              current_activity: getActivityDescription(stages[currentStage]),
              formats_completed: stages.slice(0, currentStage + 1).filter(stage => 
                stage.startsWith('generating_')
              ).map(stage => stage.replace('generating_', '')),
              estimated_completion_time: (totalStages - currentStage) * 3000 // 3 seconds per stage
            }
            
            progressCallback?.(progress)
            currentStage++
            
            if (currentStage < totalStages) {
              setTimeout(updateProgress, 2000 + Math.random() * 2000) // 2-4 seconds per stage
            }
          }
        }
        
        updateProgress()
      }

      // Start progress simulation
      if (progressCallback) {
        simulateProgress()
      }

      // Actual content generation
      const result = await generateContent(request)
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          stage: 'finalizing',
          progress_percentage: 100,
          current_activity: 'Content generation complete',
          formats_completed: request.content_constraints.preferred_formats,
          estimated_completion_time: 0
        })
      }

      return result

    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate multimodal content'
      }))
      throw error
    }
  }, [generateContent])

  // Select content format
  const selectContent = useCallback((contentId: string) => {
    setState(prev => {
      const selected = prev.generatedContent.find(content => content.id === contentId)
      return {
        ...prev,
        selectedContent: selected || null
      }
    })
  }, [])

  // Track content performance
  const trackContentPerformance = useCallback(async (
    contentId: string,
    performanceData: Partial<ContentPerformanceMetrics>
  ) => {
    try {
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track_performance',
          content_id: contentId,
          performance_data: performanceData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to track performance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to track content performance')
      }

      // Update local performance data
      setState(prev => {
        const newPerformanceData = new Map(prev.performanceData)
        const existing = newPerformanceData.get(contentId)
        newPerformanceData.set(contentId, {
          ...existing,
          ...performanceData,
          content_id: contentId
        } as ContentPerformanceMetrics)
        
        return {
          ...prev,
          performanceData: newPerformanceData
        }
      })

    } catch (error) {
      console.error('Error tracking content performance:', error)
    }
  }, [])

  // Get content performance
  const getContentPerformance = useCallback(async (contentId: string) => {
    try {
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_content_performance',
          content_id: contentId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get performance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get content performance')
      }

      setState(prev => {
        const newPerformanceData = new Map(prev.performanceData)
        newPerformanceData.set(contentId, data.content_performance)
        
        return {
          ...prev,
          performanceData: newPerformanceData
        }
      })

      return data.content_performance
    } catch (error) {
      console.error('Error getting content performance:', error)
      return null
    }
  }, [])

  // Validate content
  const validateContent = useCallback(async (
    content: AnyContentFormat,
    criteria?: string[]
  ) => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }))
      
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_content',
          content_to_validate: content,
          validation_criteria: criteria
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to validate content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate content')
      }

      setState(prev => ({ ...prev, isValidating: false }))

      return data.validation_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        error: error instanceof Error ? error.message : 'Failed to validate content'
      }))
      throw error
    }
  }, [])

  // Export content
  const exportContent = useCallback(async (
    contentId: string,
    format: 'json' | 'pdf' | 'html' | 'scorm' | 'markdown' = 'json',
    includeMetadata: boolean = true
  ) => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }))
      
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_content',
          content_id: contentId,
          export_format: format,
          include_metadata: includeMetadata
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to export content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export content')
      }

      setState(prev => ({ ...prev, isExporting: false }))

      return data.exported_content
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Failed to export content'
      }))
      throw error
    }
  }, [])

  // Regenerate content with improvements
  const regenerateContent = useCallback(async (
    originalContentId: string,
    modificationInstructions?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }))
      
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate_content',
          original_content_id: originalContentId,
          modification_instructions: modificationInstructions
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to regenerate content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to regenerate content')
      }

      setState(prev => ({
        ...prev,
        currentGenerationResult: data.generation_result,
        generatedContent: data.generation_result.content_options,
        contentHistory: [data.generation_result, ...prev.contentHistory.slice(0, 9)],
        isGenerating: false,
        lastRequestId: data.generation_result.request_id
      }))

      return data.generation_result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to regenerate content'
      }))
      throw error
    }
  }, [])

  // Update optimization configuration
  const updateOptimizationConfig = useCallback(async (config: Partial<ContentOptimizationConfig>) => {
    try {
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_optimization',
          optimization_config: config
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update optimization: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update optimization configuration')
      }

    } catch (error) {
      console.error('Error updating optimization config:', error)
      throw error
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear generated content
  const clearGeneratedContent = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentGenerationResult: null,
      generatedContent: [],
      selectedContent: null
    }))
  }, [])

  return {
    // State
    currentGenerationResult: state.currentGenerationResult,
    generatedContent: state.generatedContent,
    selectedContent: state.selectedContent,
    contentHistory: state.contentHistory,
    performanceData: state.performanceData,
    isGenerating: state.isGenerating,
    isValidating: state.isValidating,
    isExporting: state.isExporting,
    error: state.error,
    lastRequestId: state.lastRequestId,
    
    // Actions
    generateContent,
    generateContentWithProgress,
    selectContent,
    trackContentPerformance,
    getContentPerformance,
    validateContent,
    exportContent,
    regenerateContent,
    updateOptimizationConfig,
    clearError,
    clearGeneratedContent,
    
    // Computed state
    hasGeneratedContent: state.generatedContent.length > 0,
    hasSelectedContent: !!state.selectedContent,
    hasPerformanceData: state.performanceData.size > 0,
    contentCount: state.generatedContent.length,
    formatDistribution: state.generatedContent.reduce((acc, content) => {
      acc[content.type] = (acc[content.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    averageEngagementScore: state.generatedContent.length > 0 ? 
      state.generatedContent.reduce((sum, content) => sum + content.engagement_score, 0) / state.generatedContent.length : 0,
    recommendedContent: state.currentGenerationResult && state.generatedContent.find(
      content => content.id === state.currentGenerationResult?.recommended_option
    ),
    
    // Quality metrics
    qualityMetrics: state.currentGenerationResult?.generation_metadata.quality_metrics,
    usageAnalytics: state.currentGenerationResult?.usage_analytics,
    adaptationSuggestions: state.currentGenerationResult?.generation_metadata.adaptation_suggestions || [],
    improvementOpportunities: state.currentGenerationResult?.generation_metadata.potential_improvements || []
  }
}

// Hook for content analytics and performance tracking
export function useContentAnalytics() {
  const [analytics, setAnalytics] = useState<{
    total_content_generated: number
    content_format_distribution: Record<string, number>
    average_generation_time_ms: number
    average_engagement_score: number
    average_completion_rate: number
    format_effectiveness: Record<string, any>
    subject_domain_performance: Record<string, any>
    accessibility_usage: Record<string, number>
    user_satisfaction_metrics: any
    optimization_insights: any
    performance_trends: any[]
    ai_model_performance: any
  }>({
    total_content_generated: 0,
    content_format_distribution: {},
    average_generation_time_ms: 0,
    average_engagement_score: 0,
    average_completion_rate: 0,
    format_effectiveness: {},
    subject_domain_performance: {},
    accessibility_usage: {},
    user_satisfaction_metrics: {},
    optimization_insights: {},
    performance_trends: [],
    ai_model_performance: {}
  })

  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_content_analytics'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setAnalytics(data.content_analytics)
        }
      }
    } catch (error) {
      console.error('Error loading content analytics:', error)
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
    loadAnalytics,
    
    // Computed analytics
    totalFormats: Object.keys(analytics.content_format_distribution).length,
    mostPopularFormat: Object.entries(analytics.content_format_distribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'text',
    leastPopularFormat: Object.entries(analytics.content_format_distribution)
      .sort(([,a], [,b]) => a - b)[0]?.[0] || 'text',
    generationEfficiency: analytics.average_generation_time_ms > 0 ? 
      60000 / analytics.average_generation_time_ms : 0, // Efficiency score
    overallQualityScore: (analytics.average_engagement_score + analytics.average_completion_rate) / 2,
    
    // Trend analysis
    isPerformanceImproving: analytics.performance_trends.length > 1 ? 
      analytics.performance_trends[analytics.performance_trends.length - 1].avg_quality > 
      analytics.performance_trends[0].avg_quality : false,
    growthRate: analytics.performance_trends.length > 1 ? 
      ((analytics.performance_trends[analytics.performance_trends.length - 1].content_generated - 
        analytics.performance_trends[0].content_generated) / 
       analytics.performance_trends[0].content_generated) * 100 : 0
  }
}

// Hook for content validation and quality assurance
export function useContentValidation() {
  const [validationResults, setValidationResults] = useState<Map<string, any>>(new Map())
  const [isValidating, setIsValidating] = useState(false)

  const validateContent = useCallback(async (
    content: AnyContentFormat,
    criteria: string[] = ['educational_effectiveness', 'accessibility_compliance', 'engagement_potential']
  ) => {
    try {
      setIsValidating(true)
      
      const response = await fetch('/api/multimodal-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_content',
          content_to_validate: content,
          validation_criteria: criteria
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to validate content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate content')
      }

      setValidationResults(prev => {
        const newResults = new Map(prev)
        newResults.set(content.id, data.validation_result)
        return newResults
      })

      return data.validation_result
    } catch (error) {
      console.error('Error validating content:', error)
      throw error
    } finally {
      setIsValidating(false)
    }
  }, [])

  const getValidationResult = useCallback((contentId: string) => {
    return validationResults.get(contentId)
  }, [validationResults])

  const isContentApproved = useCallback((contentId: string) => {
    const result = validationResults.get(contentId)
    return result?.compliance_status === 'approved'
  }, [validationResults])

  return {
    validationResults,
    isValidating,
    validateContent,
    getValidationResult,
    isContentApproved,
    
    // Computed validation stats
    totalValidated: validationResults.size,
    approvedCount: Array.from(validationResults.values())
      .filter(result => result.compliance_status === 'approved').length,
    needsRevisionCount: Array.from(validationResults.values())
      .filter(result => result.compliance_status === 'needs_revision').length,
    rejectedCount: Array.from(validationResults.values())
      .filter(result => result.compliance_status === 'rejected').length,
    averageQualityScore: validationResults.size > 0 ? 
      Array.from(validationResults.values())
        .reduce((sum, result) => sum + result.overall_score, 0) / validationResults.size : 0
  }
}

// Utility function for progress activity descriptions
function getActivityDescription(stage: ContentGenerationProgress['stage']): string {
  const descriptions: Record<ContentGenerationProgress['stage'], string> = {
    analyzing: 'Analyzing content requirements and target audience',
    generating_text: 'Creating comprehensive text-based content',
    generating_audio: 'Generating audio scripts and narration instructions',
    generating_visual: 'Designing visual elements and infographics',
    generating_interactive: 'Building interactive experiences and simulations',
    generating_multimodal: 'Combining formats into cohesive multimodal experience',
    evaluating: 'Evaluating content quality and effectiveness',
    optimizing: 'Optimizing content for engagement and accessibility',
    finalizing: 'Finalizing content generation and preparing results'
  }
  
  return descriptions[stage] || 'Processing content...'
}
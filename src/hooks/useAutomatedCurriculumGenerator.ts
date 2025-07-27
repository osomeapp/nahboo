'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type CurriculumGenerationRequest,
  type GeneratedCurriculum,
  type LearningObjective,
  type CurriculumBlueprint,
  type TargetAudience,
  type BloomsTaxonomyLevel
} from '@/lib/automated-curriculum-generator'

interface CurriculumGeneratorState {
  generatedCurricula: GeneratedCurriculum[]
  currentCurriculum: GeneratedCurriculum | null
  curriculumBlueprints: CurriculumBlueprint[]
  learningObjectives: LearningObjective[]
  curriculumTemplates: CurriculumTemplate[]
  validationResults: ValidationResults | null
  qualityAnalysis: QualityAnalysis | null
  systemAnalytics: any | null
  exportData: ExportData | null
  isGenerating: boolean
  isValidating: boolean
  isExporting: boolean
  isAnalyzing: boolean
  isLoadingTemplates: boolean
  error: string | null
  warnings: string[]
  recommendations: string[]
  lastGenerationId: string | null
}

interface GenerationProgress {
  stage: 'objectives' | 'blueprint' | 'modules' | 'lessons' | 'assessments' | 'resources' | 'validation' | 'complete'
  progress_percentage: number
  current_activity: string
  estimated_completion_time: number
  quality_score?: number
  complexity_level?: string
  modules_generated?: number
  lessons_created?: number
}

interface ObjectiveGenerationParams {
  subject_area: string
  target_audience: TargetAudience
  learning_goals: string[]
  curriculum_scope: string
  bloom_level_distribution?: Record<BloomsTaxonomyLevel, number>
  priority_weighting?: Record<string, number>
}

// Main hook for automated curriculum generation
export function useAutomatedCurriculumGenerator() {
  const [state, setState] = useState<CurriculumGeneratorState>({
    generatedCurricula: [],
    currentCurriculum: null,
    curriculumBlueprints: [],
    learningObjectives: [],
    curriculumTemplates: [],
    validationResults: null,
    qualityAnalysis: null,
    systemAnalytics: null,
    exportData: null,
    isGenerating: false,
    isValidating: false,
    isExporting: false,
    isAnalyzing: false,
    isLoadingTemplates: false,
    error: null,
    warnings: [],
    recommendations: [],
    lastGenerationId: null
  })

  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const validationQueueRef = useRef<string[]>([])

  // Generate comprehensive curriculum
  const generateCurriculum = useCallback(async (request: CurriculumGenerationRequest) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null,
        warnings: [],
        recommendations: []
      }))
      
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_curriculum',
          generation_request: request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate curriculum: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate curriculum')
      }

      setState(prev => ({
        ...prev,
        generatedCurricula: [data.generated_curriculum, ...prev.generatedCurricula.slice(0, 9)], // Keep last 10
        currentCurriculum: data.generated_curriculum,
        isGenerating: false,
        warnings: data.warnings || [],
        recommendations: data.recommendations || [],
        lastGenerationId: data.generated_curriculum.curriculum_id
      }))

      return data.generated_curriculum
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate curriculum'
      }))
      throw error
    }
  }, [])

  // Generate curriculum with progress tracking
  const generateCurriculumWithProgress = useCallback(async (
    request: CurriculumGenerationRequest,
    progressCallback?: (progress: GenerationProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null,
        warnings: [],
        recommendations: []
      }))

      // Simulate progress updates during generation
      const simulateProgress = () => {
        const stages: GenerationProgress['stage'][] = [
          'objectives', 'blueprint', 'modules', 'lessons', 'assessments', 'resources', 'validation', 'complete'
        ]
        
        let currentStage = 0
        const totalStages = stages.length
        
        const updateProgress = () => {
          if (currentStage < totalStages) {
            const progress: GenerationProgress = {
              stage: stages[currentStage],
              progress_percentage: Math.floor((currentStage / totalStages) * 100),
              current_activity: getGenerationStageDescription(stages[currentStage]),
              estimated_completion_time: (totalStages - currentStage) * 15000, // 15 seconds per stage
              quality_score: currentStage >= 3 ? 8.5 + Math.random() * 1.5 : undefined,
              complexity_level: currentStage >= 2 ? getComplexityLevel(request) : undefined,
              modules_generated: currentStage >= 2 ? Math.floor(currentStage / 2) * 3 : undefined,
              lessons_created: currentStage >= 3 ? Math.floor(currentStage / 3) * 8 : undefined
            }
            
            progressCallback?.(progress)
            currentStage++
            
            if (currentStage < totalStages) {
              setTimeout(updateProgress, 12000 + Math.random() * 6000) // 12-18 seconds per stage
            }
          }
        }
        
        updateProgress()
      }

      // Start progress simulation
      if (progressCallback) {
        simulateProgress()
      }

      // Actual curriculum generation
      const result = await generateCurriculum(request)
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress_percentage: 100,
          current_activity: 'Curriculum generation completed successfully',
          estimated_completion_time: 0,
          quality_score: result.quality_metrics?.overall_quality_score || 8.5,
          complexity_level: getComplexityLevel(request),
          modules_generated: result.detailed_modules?.length || 0,
          lessons_created: result.lesson_plans?.length || 0
        })
      }

      return result

    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate curriculum'
      }))
      throw error
    }
  }, [generateCurriculum])

  // Create learning objectives from parameters
  const createLearningObjectives = useCallback(async (params: ObjectiveGenerationParams) => {
    try {
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_learning_objectives',
          subject_area: params.subject_area,
          target_audience: params.target_audience,
          curriculum_scope: params.curriculum_scope,
          learning_goals: params.learning_goals
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create learning objectives: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create learning objectives')
      }

      setState(prev => ({
        ...prev,
        learningObjectives: data.learning_objectives
      }))

      return data.learning_objectives
    } catch (error) {
      console.error('Error creating learning objectives:', error)
      throw error
    }
  }, [])

  // Validate curriculum
  const validateCurriculum = useCallback(async (
    curriculumData: any,
    validationCriteria?: string[]
  ) => {
    try {
      setState(prev => ({ ...prev, isValidating: true, error: null }))
      
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate_curriculum',
          curriculum_data: curriculumData,
          validation_criteria: validationCriteria
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to validate curriculum: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate curriculum')
      }

      setState(prev => ({
        ...prev,
        validationResults: data.validation_results,
        isValidating: false
      }))

      return data.validation_results
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        error: error instanceof Error ? error.message : 'Failed to validate curriculum'
      }))
      throw error
    }
  }, [])

  // Analyze curriculum quality
  const analyzeCurriculumQuality = useCallback(async (
    curriculumData: any,
    qualityThreshold?: number
  ) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }))
      
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_curriculum_quality',
          curriculum_data: curriculumData,
          quality_threshold: qualityThreshold
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze curriculum quality: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze curriculum quality')
      }

      setState(prev => ({
        ...prev,
        qualityAnalysis: data.quality_analysis,
        isAnalyzing: false
      }))

      return data.quality_analysis
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to analyze curriculum quality'
      }))
      throw error
    }
  }, [])

  // Export curriculum in various formats
  const exportCurriculum = useCallback(async (
    curriculumId: string,
    format: 'pdf' | 'word' | 'json' | 'scorm' | 'canvas' | 'moodle'
  ) => {
    try {
      setState(prev => ({ ...prev, isExporting: true, error: null }))
      
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export_curriculum',
          curriculum_id: curriculumId,
          export_format: format
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to export curriculum: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to export curriculum')
      }

      setState(prev => ({
        ...prev,
        exportData: data.export_data,
        isExporting: false
      }))

      return data.export_data
    } catch (error) {
      setState(prev => ({
        ...prev,
        isExporting: false,
        error: error instanceof Error ? error.message : 'Failed to export curriculum'
      }))
      throw error
    }
  }, [])

  // Get curriculum templates
  const loadCurriculumTemplates = useCallback(async (category?: string) => {
    try {
      setState(prev => ({ ...prev, isLoadingTemplates: true }))
      
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_curriculum_templates',
          template_category: category
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            curriculumTemplates: data.curriculum_templates,
            isLoadingTemplates: false
          }))
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingTemplates: false
      }))
      console.error('Error loading curriculum templates:', error)
    }
  }, [])

  // Preview curriculum structure
  const previewCurriculumStructure = useCallback(async (request: CurriculumGenerationRequest) => {
    try {
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview_curriculum_structure',
          generation_request: request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to preview curriculum structure: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to preview curriculum structure')
      }

      setState(prev => ({
        ...prev,
        curriculumBlueprints: [data.curriculum_blueprint, ...prev.curriculumBlueprints.slice(0, 4)] // Keep last 5
      }))

      return data.curriculum_blueprint
    } catch (error) {
      console.error('Error previewing curriculum structure:', error)
      throw error
    }
  }, [])

  // Load system analytics
  const loadSystemAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_system_analytics'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            systemAnalytics: data.system_analytics
          }))
        }
      }
    } catch (error) {
      console.error('Error loading system analytics:', error)
    }
  }, [])

  // Auto-load templates and analytics on mount
  useEffect(() => {
    loadCurriculumTemplates()
    loadSystemAnalytics()
  }, [loadCurriculumTemplates, loadSystemAnalytics])

  // Auto-refresh analytics every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadSystemAnalytics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadSystemAnalytics])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear warnings and recommendations
  const clearWarningsAndRecommendations = useCallback(() => {
    setState(prev => ({ ...prev, warnings: [], recommendations: [] }))
  }, [])

  // Clear current curriculum
  const clearCurrentCurriculum = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentCurriculum: null,
      validationResults: null,
      qualityAnalysis: null,
      exportData: null
    }))
  }, [])

  // Update learning objectives
  const updateLearningObjectives = useCallback((objectives: LearningObjective[]) => {
    setState(prev => ({
      ...prev,
      learningObjectives: objectives
    }))
  }, [])

  return {
    // State
    generatedCurricula: state.generatedCurricula,
    currentCurriculum: state.currentCurriculum,
    curriculumBlueprints: state.curriculumBlueprints,
    learningObjectives: state.learningObjectives,
    curriculumTemplates: state.curriculumTemplates,
    validationResults: state.validationResults,
    qualityAnalysis: state.qualityAnalysis,
    systemAnalytics: state.systemAnalytics,
    exportData: state.exportData,
    isGenerating: state.isGenerating,
    isValidating: state.isValidating,
    isExporting: state.isExporting,
    isAnalyzing: state.isAnalyzing,
    isLoadingTemplates: state.isLoadingTemplates,
    error: state.error,
    warnings: state.warnings,
    recommendations: state.recommendations,
    lastGenerationId: state.lastGenerationId,
    
    // Actions
    generateCurriculum,
    generateCurriculumWithProgress,
    createLearningObjectives,
    validateCurriculum,
    analyzeCurriculumQuality,
    exportCurriculum,
    loadCurriculumTemplates,
    previewCurriculumStructure,
    loadSystemAnalytics,
    clearError,
    clearWarningsAndRecommendations,
    clearCurrentCurriculum,
    updateLearningObjectives,
    
    // Computed state
    hasCurrentCurriculum: !!state.currentCurriculum,
    hasLearningObjectives: state.learningObjectives.length > 0,
    hasValidationResults: !!state.validationResults,
    hasQualityAnalysis: !!state.qualityAnalysis,
    hasSystemAnalytics: !!state.systemAnalytics,
    curriculumCount: state.generatedCurricula.length,
    templateCount: state.curriculumTemplates.length,
    blueprintCount: state.curriculumBlueprints.length,
    isProcessing: state.isGenerating || state.isValidating || state.isExporting || state.isAnalyzing,
    
    // Curriculum analytics
    currentCurriculumMetrics: state.currentCurriculum ? {
      qualityScore: state.currentCurriculum.quality_metrics?.overall_quality_score || 0,
      moduleCount: state.currentCurriculum.detailed_modules?.length || 0,
      lessonCount: state.currentCurriculum.lesson_plans?.length || 0,
      assessmentCount: state.currentCurriculum.assessment_materials?.length || 0,
      adaptiveElementCount: state.currentCurriculum.adaptive_elements?.length || 0,
      durationWeeks: state.currentCurriculum.blueprint?.duration_weeks || 0,
      complexityLevel: calculateCurriculumComplexity(state.currentCurriculum)
    } : null,
    
    // Validation insights
    validationInsights: state.validationResults ? {
      overallValidity: state.validationResults.overall_validity,
      validityScore: state.validationResults.validity_score,
      issueCount: state.validationResults.identified_issues.length,
      suggestionCount: state.validationResults.improvement_suggestions.length,
      complianceStatus: state.validationResults.compliance_status,
      topQualityDimension: getTopQualityDimension(state.validationResults.quality_indicators)
    } : null,
    
    // Quality insights
    qualityInsights: state.qualityAnalysis ? {
      overallScore: state.qualityAnalysis.overall_score,
      meetsThreshold: state.qualityAnalysis.meets_threshold,
      strengthCount: state.qualityAnalysis.strengths.length,
      improvementAreaCount: state.qualityAnalysis.areas_for_improvement.length,
      riskLevel: state.qualityAnalysis.risk_assessment.overall_risk_level,
      topDimension: getTopQualityDimension(state.qualityAnalysis.quality_dimensions)
    } : null,
    
    // System health indicators
    systemHealth: state.systemAnalytics ? {
      generationSuccessRate: state.systemAnalytics.success_rate,
      averageQuality: state.systemAnalytics.quality_scores?.average_overall_quality || 0,
      userSatisfaction: state.systemAnalytics.user_satisfaction?.overall_rating || 0,
      systemLoad: calculateSystemLoad(state.systemAnalytics),
      innovationIndex: state.systemAnalytics.innovation_metrics?.technology_integration_advancement || 0
    } : null
  }
}

// Hook for curriculum template management
export function useCurriculumTemplates() {
  const [templates, setTemplates] = useState<CurriculumTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CurriculumTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')

  const loadTemplates = useCallback(async (category?: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/curriculum-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_curriculum_templates',
          template_category: category
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setTemplates(data.curriculum_templates)
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectTemplate = useCallback((template: CurriculumTemplate) => {
    setSelectedTemplate(template)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTemplate(null)
  }, [])

  const filterByCategory = useCallback((category: string) => {
    setFilterCategory(category)
    loadTemplates(category)
  }, [loadTemplates])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  return {
    templates,
    selectedTemplate,
    isLoading,
    filterCategory,
    loadTemplates,
    selectTemplate,
    clearSelection,
    filterByCategory,
    
    // Computed state
    templateCount: templates.length,
    categories: Array.from(new Set(templates.map(t => t.category))),
    hasSelection: !!selectedTemplate,
    filteredTemplates: filterCategory 
      ? templates.filter(t => t.category === filterCategory)
      : templates
  }
}

// Hook for curriculum validation workflow
export function useCurriculumValidation() {
  const [validationQueue, setValidationQueue] = useState<ValidationRequest[]>([])
  const [activeValidation, setActiveValidation] = useState<ValidationRequest | null>(null)
  const [validationHistory, setValidationHistory] = useState<ValidationResults[]>([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  const queueValidation = useCallback((request: ValidationRequest) => {
    setValidationQueue(prev => [...prev, request])
  }, [])

  const processValidationQueue = useCallback(async () => {
    if (validationQueue.length === 0 || isProcessingQueue) return

    setIsProcessingQueue(true)
    
    for (const request of validationQueue) {
      try {
        setActiveValidation(request)
        
        const response = await fetch('/api/curriculum-generator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'validate_curriculum',
            curriculum_data: request.curriculum_data,
            validation_criteria: request.criteria
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            setValidationHistory(prev => [data.validation_results, ...prev.slice(0, 19)]) // Keep last 20
          }
        }
        
        // Remove processed request from queue
        setValidationQueue(prev => prev.filter(r => r.request_id !== request.request_id))
        
        // Wait between validations
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error('Error processing validation:', error)
      }
    }
    
    setActiveValidation(null)
    setIsProcessingQueue(false)
  }, [validationQueue, isProcessingQueue])

  // Auto-process queue when new items are added
  useEffect(() => {
    if (validationQueue.length > 0 && !isProcessingQueue) {
      processValidationQueue()
    }
  }, [validationQueue, isProcessingQueue, processValidationQueue])

  const clearValidationHistory = useCallback(() => {
    setValidationHistory([])
  }, [])

  return {
    validationQueue,
    activeValidation,
    validationHistory,
    isProcessingQueue,
    queueValidation,
    processValidationQueue,
    clearValidationHistory,
    
    // Computed state
    queueLength: validationQueue.length,
    historyCount: validationHistory.length,
    averageValidityScore: validationHistory.length > 0 
      ? validationHistory.reduce((sum, result) => sum + result.validity_score, 0) / validationHistory.length
      : 0,
    recentValidations: validationHistory.slice(0, 5),
    hasActiveValidation: !!activeValidation
  }
}

// Utility functions for calculations and analysis
function getGenerationStageDescription(stage: GenerationProgress['stage']): string {
  const descriptions: Record<GenerationProgress['stage'], string> = {
    objectives: 'Analyzing learning objectives and educational requirements',
    blueprint: 'Creating comprehensive curriculum structure and blueprint',
    modules: 'Generating detailed modules with learning sequences',
    lessons: 'Developing individual lesson plans with activities',
    assessments: 'Creating assessment materials and rubrics',
    resources: 'Compiling resource library and support materials',
    validation: 'Validating curriculum quality and alignment',
    complete: 'Curriculum generation completed successfully'
  }
  
  return descriptions[stage] || 'Processing curriculum components...'
}

function getComplexityLevel(request: CurriculumGenerationRequest): string {
  const objectiveCount = request.learning_objectives.length
  const duration = request.constraints.max_duration_weeks || 12
  const complexityScore = objectiveCount + (duration / 4)
  
  if (complexityScore > 20) return 'Advanced'
  if (complexityScore > 12) return 'Intermediate'
  return 'Basic'
}

function calculateCurriculumComplexity(curriculum: GeneratedCurriculum): string {
  const moduleCount = curriculum.detailed_modules?.length || 0
  const lessonCount = curriculum.lesson_plans?.length || 0
  const adaptiveElements = curriculum.adaptive_elements?.length || 0
  
  const complexityScore = moduleCount * 2 + lessonCount * 0.5 + adaptiveElements * 3
  
  if (complexityScore > 50) return 'High'
  if (complexityScore > 25) return 'Medium'
  return 'Low'
}

function getTopQualityDimension(dimensions: Record<string, number>): string {
  return Object.entries(dimensions).reduce((top, [key, value]) => 
    value > dimensions[top] ? key : top, Object.keys(dimensions)[0]
  )
}

function calculateSystemLoad(analytics: any): number {
  const successRate = analytics.success_rate || 0.9
  const avgGenerationTime = analytics.average_generation_time || 15
  const userSatisfaction = analytics.user_satisfaction?.overall_rating || 4.5
  
  // Higher success rate and satisfaction = lower load, higher generation time = higher load
  const loadScore = (1 - successRate) * 0.4 + (avgGenerationTime / 30) * 0.4 + (1 - userSatisfaction / 5) * 0.2
  
  return Math.min(1, Math.max(0, loadScore))
}

// Supporting interfaces
interface CurriculumTemplate {
  template_id: string
  name: string
  category: string
  description: string
  target_audience: string
  duration_weeks: number
  objective_count: number
  complexity_level: string
  features: string[]
  customization_options: string[]
  preview_url: string
  usage_count: number
  rating: number
  last_updated: string
}

interface ValidationResults {
  validation_id: string
  overall_validity: boolean
  validity_score: number
  criteria_results: any[]
  identified_issues: string[]
  improvement_suggestions: string[]
  compliance_status: Record<string, boolean>
  quality_indicators: Record<string, number>
}

interface QualityAnalysis {
  analysis_id: string
  overall_score: number
  meets_threshold: boolean
  quality_dimensions: Record<string, number>
  strengths: string[]
  areas_for_improvement: string[]
  benchmark_comparison: any
  actionable_recommendations: string[]
  risk_assessment: {
    implementation_risks: string[]
    mitigation_strategies: string[]
    overall_risk_level: string
  }
}

interface ExportData {
  export_id: string
  curriculum_id: string
  format: string
  file_size: string
  export_timestamp: string
  download_url: string
  expiration_date: string
  content_summary: any
  compatibility_info: string
  usage_instructions: string
}

interface ValidationRequest {
  request_id: string
  curriculum_data: any
  criteria: string[]
  priority: 'low' | 'medium' | 'high'
  submitted_at: string
}
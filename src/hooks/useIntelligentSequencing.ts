// React hooks for intelligent content sequencing integration
'use client'

import { useState, useCallback, useEffect } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  LearningObjective, 
  LearningPath, 
  SequencingRecommendation,
  KnowledgeGap 
} from '@/lib/intelligent-sequencing-engine'

export interface SequencingState {
  currentPath: LearningPath | null
  isGenerating: boolean
  progress: {
    completedObjectives: number
    totalObjectives: number
    currentSequence: number
    overallProgress: number
  }
  recommendations: any[]
  knowledgeGaps: KnowledgeGap[]
  adaptationHistory: any[]
  error: string | null
}

// Main intelligent sequencing hook
export function useIntelligentSequencing(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<SequencingState>({
    currentPath: null,
    isGenerating: false,
    progress: {
      completedObjectives: 0,
      totalObjectives: 0,
      currentSequence: 0,
      overallProgress: 0
    },
    recommendations: [],
    knowledgeGaps: [],
    adaptationHistory: [],
    error: null
  })

  // Generate optimal learning path
  const generateLearningPath = useCallback(async (
    targetObjectives: LearningObjective[],
    availableContent: ContentItem[],
    constraints?: {
      maxTime?: number
      maxDifficulty?: number
      preferredStyles?: string[]
      urgentObjectives?: string[]
    }
  ) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await fetch('/api/intelligent-sequencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'generate_path',
          targetObjectives,
          availableContent,
          constraints
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate learning path: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate learning path')
      }

      const { sequencingRecommendation } = data
      const path = sequencingRecommendation.recommendedPath

      setState(prev => ({
        ...prev,
        currentPath: path,
        isGenerating: false,
        progress: {
          completedObjectives: 0,
          totalObjectives: path.objectives.length,
          currentSequence: 1,
          overallProgress: 0
        }
      }))

      return sequencingRecommendation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isGenerating: false }))
      throw error
    }
  }, [userId, userProfile])

  // Analyze knowledge gaps
  const analyzeKnowledgeGaps = useCallback(async (targetObjectives?: LearningObjective[]) => {
    try {
      const response = await fetch('/api/intelligent-sequencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'analyze_gaps',
          targetObjectives: targetObjectives || state.currentPath?.objectives || []
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze knowledge gaps: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze knowledge gaps')
      }

      setState(prev => ({
        ...prev,
        knowledgeGaps: data.knowledgeGaps || []
      }))

      return {
        knowledgeGaps: data.knowledgeGaps,
        prerequisiteAnalysis: data.prerequisiteAnalysis
      }
    } catch (error) {
      console.error('Knowledge gap analysis failed:', error)
      throw error
    }
  }, [userId, userProfile, state.currentPath])

  // Track progress and get next recommendations
  const trackProgress = useCallback(async (
    pathId: string,
    currentProgress: any,
    performanceData: any[]
  ) => {
    try {
      const response = await fetch('/api/intelligent-sequencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'track_progress',
          pathId,
          currentProgress,
          performanceData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to track progress: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to track progress')
      }

      // Update local progress state
      setState(prev => ({
        ...prev,
        progress: {
          ...prev.progress,
          ...data.progressAnalysis,
          overallProgress: data.progressAnalysis.overallProgress / 100
        },
        recommendations: data.nextRecommendations || []
      }))

      return {
        progressAnalysis: data.progressAnalysis,
        nextRecommendations: data.nextRecommendations
      }
    } catch (error) {
      console.error('Progress tracking failed:', error)
      throw error
    }
  }, [userId, userProfile])

  // Adapt learning path based on performance
  const adaptPath = useCallback(async (
    pathId: string,
    adaptationTriggers: string[],
    performanceData: any[]
  ) => {
    try {
      const response = await fetch('/api/intelligent-sequencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'adapt_path',
          pathId,
          adaptationTriggers,
          performanceData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to adapt path: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to adapt path')
      }

      // Add to adaptation history
      setState(prev => ({
        ...prev,
        adaptationHistory: [
          ...prev.adaptationHistory,
          {
            timestamp: new Date(),
            triggers: adaptationTriggers,
            adaptations: data.adaptationPlan.adaptations,
            pathId
          }
        ]
      }))

      return data.adaptationPlan
    } catch (error) {
      console.error('Path adaptation failed:', error)
      throw error
    }
  }, [userId, userProfile])

  // Update progress when sequence is completed
  const completeSequence = useCallback((sequenceNumber: number) => {
    setState(prev => {
      const newCompletedObjectives = Math.max(prev.progress.completedObjectives, sequenceNumber)
      const overallProgress = prev.progress.totalObjectives > 0 ? 
        newCompletedObjectives / prev.progress.totalObjectives : 0

      return {
        ...prev,
        progress: {
          ...prev.progress,
          completedObjectives: newCompletedObjectives,
          currentSequence: Math.min(sequenceNumber + 1, prev.progress.totalObjectives),
          overallProgress
        }
      }
    })
  }, [])

  // Clear current path
  const clearPath = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentPath: null,
      progress: {
        completedObjectives: 0,
        totalObjectives: 0,
        currentSequence: 0,
        overallProgress: 0
      },
      recommendations: [],
      knowledgeGaps: [],
      error: null
    }))
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    generateLearningPath,
    analyzeKnowledgeGaps,
    trackProgress,
    adaptPath,
    completeSequence,
    clearPath,
    
    // Computed values
    isPathActive: !!state.currentPath,
    currentObjective: state.currentPath?.objectives[state.progress.currentSequence - 1] || null,
    nextObjective: state.currentPath?.objectives[state.progress.currentSequence] || null,
    hasKnowledgeGaps: state.knowledgeGaps.length > 0,
    needsAdaptation: state.recommendations.some(rec => rec.priority === 'high'),
    
    // Helper functions
    getObjectiveById: useCallback((id: string) => {
      return state.currentPath?.objectives.find(obj => obj.id === id) || null
    }, [state.currentPath]),
    
    getSequenceById: useCallback((id: string) => {
      return state.currentPath?.sequences.find(seq => seq.id === id) || null
    }, [state.currentPath])
  }
}

// Hook for learning path optimization
export function useLearningPathOptimization() {
  const [optimizationState, setOptimizationState] = useState({
    isOptimizing: false,
    optimizedSequence: null,
    adaptationPlan: null,
    error: null
  })

  const optimizeSequence = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    targetObjectives: LearningObjective[],
    constraints?: any
  ) => {
    setOptimizationState(prev => ({ ...prev, isOptimizing: true, error: null }))

    try {
      const response = await fetch('/api/intelligent-sequencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'optimize_sequence',
          targetObjectives,
          constraints
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to optimize sequence: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize sequence')
      }

      setOptimizationState(prev => ({
        ...prev,
        isOptimizing: false,
        optimizedSequence: data.optimizedSequence,
        adaptationPlan: data.adaptationPlan
      }))

      return {
        optimizedSequence: data.optimizedSequence,
        adaptationPlan: data.adaptationPlan
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setOptimizationState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isOptimizing: false 
      }))
      throw error
    }
  }, [])

  return {
    ...optimizationState,
    optimizeSequence
  }
}

// Hook for knowledge gap analysis and management
export function useKnowledgeGapAnalysis() {
  const [gapState, setGapState] = useState({
    gaps: [] as KnowledgeGap[],
    isAnalyzing: false,
    prerequisiteAnalysis: null,
    recommendations: [],
    error: null
  })

  const analyzeGaps = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    targetObjectives: LearningObjective[]
  ) => {
    setGapState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const response = await fetch('/api/intelligent-sequencing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'analyze_gaps',
          targetObjectives
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze gaps: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze gaps')
      }

      setGapState(prev => ({
        ...prev,
        isAnalyzing: false,
        gaps: data.knowledgeGaps || [],
        prerequisiteAnalysis: data.prerequisiteAnalysis,
        recommendations: data.recommendations || []
      }))

      return {
        knowledgeGaps: data.knowledgeGaps,
        prerequisiteAnalysis: data.prerequisiteAnalysis
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setGapState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isAnalyzing: false 
      }))
      throw error
    }
  }, [])

  const getGapsBySeverity = useCallback((severity: 'critical' | 'high' | 'medium' | 'low') => {
    return gapState.gaps.filter(gap => gap.severity === severity)
  }, [gapState.gaps])

  const getCriticalGaps = useCallback(() => {
    return gapState.gaps.filter(gap => gap.severity === 'critical' || gap.severity === 'high')
  }, [gapState.gaps])

  const getTotalTimeToFillGaps = useCallback(() => {
    return gapState.gaps.reduce((total, gap) => total + gap.estimatedTimeToFill, 0)
  }, [gapState.gaps])

  return {
    ...gapState,
    analyzeGaps,
    getGapsBySeverity,
    getCriticalGaps,
    getTotalTimeToFillGaps,
    hasCriticalGaps: gapState.gaps.some(gap => gap.severity === 'critical'),
    totalGaps: gapState.gaps.length
  }
}
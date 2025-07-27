'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type ContentSource,
  type SynthesisRequest,
  type SynthesizedContent,
  type ConceptNetwork,
  type SynthesisProgress
} from '@/lib/content-synthesis-engine'

interface ContentSynthesisState {
  currentSynthesis: SynthesizedContent | null
  synthesisHistory: SynthesizedContent[]
  availableSources: ContentSource[]
  conceptNetworks: ConceptNetwork[]
  synthesisProgress: SynthesisProgress | null
  isLoading: boolean
  isSynthesizing: boolean
  isUpdating: boolean
  error: string | null
  lastSynthesisId: string | null
}

interface SourceSearchFilters {
  types?: ContentSource['type'][]
  academic_levels?: string[]
  min_credibility_score?: number
  max_age_days?: number
  subject_domains?: string[]
  languages?: string[]
}

// Main hook for content synthesis
export function useContentSynthesis() {
  const [state, setState] = useState<ContentSynthesisState>({
    currentSynthesis: null,
    synthesisHistory: [],
    availableSources: [],
    conceptNetworks: [],
    synthesisProgress: null,
    isLoading: false,
    isSynthesizing: false,
    isUpdating: false,
    error: null,
    lastSynthesisId: null
  })

  // Create new content synthesis
  const synthesizeContent = useCallback(async (
    sources: ContentSource[],
    request: SynthesisRequest
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSynthesizing: true, 
        error: null,
        synthesisProgress: null
      }))
      
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'synthesize',
          sources,
          request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to synthesize content: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to synthesize content')
      }

      setState(prev => ({
        ...prev,
        currentSynthesis: data.synthesis,
        synthesisHistory: [data.synthesis, ...prev.synthesisHistory.slice(0, 9)], // Keep last 10
        isSynthesizing: false,
        lastSynthesisId: data.synthesis.synthesis_id,
        synthesisProgress: null
      }))

      return data.synthesis
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSynthesizing: false,
        synthesisProgress: null,
        error: error instanceof Error ? error.message : 'Failed to synthesize content'
      }))
      throw error
    }
  }, [])

  // Get synthesis with progress tracking
  const synthesizeWithProgress = useCallback(async (
    sources: ContentSource[],
    request: SynthesisRequest
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSynthesizing: true, 
        error: null,
        synthesisProgress: {
          stage: 'source_analysis',
          progress_percentage: 0,
          current_activity: 'Starting synthesis',
          sources_processed: 0,
          total_sources: sources.length,
          estimated_completion_time: 30000
        }
      }))

      // Start synthesis
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'synthesize_with_progress',
          sources,
          request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start synthesis: ${response.statusText}`)
      }

      const { synthesisId } = await response.json()

      // Poll for progress
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch('/api/content-synthesis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_progress',
              synthesisId
            })
          })

          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            
            if (progressData.progress) {
              setState(prev => ({
                ...prev,
                synthesisProgress: progressData.progress
              }))

              if (progressData.progress.progress_percentage < 100) {
                setTimeout(pollProgress, 1000) // Poll every second
              } else {
                // Synthesis complete, get result
                const resultResponse = await fetch('/api/content-synthesis', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'get_synthesis',
                    synthesisId
                  })
                })

                if (resultResponse.ok) {
                  const resultData = await resultResponse.json()
                  
                  setState(prev => ({
                    ...prev,
                    currentSynthesis: resultData.synthesis,
                    synthesisHistory: [resultData.synthesis, ...prev.synthesisHistory.slice(0, 9)],
                    isSynthesizing: false,
                    lastSynthesisId: resultData.synthesis.synthesis_id,
                    synthesisProgress: null
                  }))
                }
              }
            }
          }
        } catch (error) {
          console.error('Error polling progress:', error)
        }
      }

      pollProgress()

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSynthesizing: false,
        synthesisProgress: null,
        error: error instanceof Error ? error.message : 'Failed to synthesize content'
      }))
      throw error
    }
  }, [])

  // Update existing synthesis
  const updateSynthesis = useCallback(async (
    synthesisId: string,
    newSources: ContentSource[],
    updateType: 'expand' | 'refine' | 'update_facts' | 'add_perspectives'
  ) => {
    try {
      setState(prev => ({ ...prev, isUpdating: true, error: null }))
      
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_synthesis',
          synthesisId,
          newSources,
          updateType
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update synthesis: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update synthesis')
      }

      setState(prev => ({
        ...prev,
        currentSynthesis: data.synthesis,
        synthesisHistory: prev.synthesisHistory.map(s => 
          s.synthesis_id === synthesisId ? data.synthesis : s
        ),
        isUpdating: false
      }))

      return data.synthesis
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Failed to update synthesis'
      }))
      throw error
    }
  }, [])

  // Adapt synthesis for different audience
  const adaptSynthesis = useCallback(async (
    synthesisId: string,
    newAudience: SynthesisRequest['target_audience']
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adapt_synthesis',
          synthesisId,
          newAudience
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to adapt synthesis: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to adapt synthesis')
      }

      setState(prev => ({
        ...prev,
        currentSynthesis: data.synthesis,
        synthesisHistory: [data.synthesis, ...prev.synthesisHistory.slice(0, 9)],
        isLoading: false,
        lastSynthesisId: data.synthesis.synthesis_id
      }))

      return data.synthesis
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to adapt synthesis'
      }))
      throw error
    }
  }, [])

  // Generate concept networks
  const generateConceptNetworks = useCallback(async (synthesisId: string) => {
    try {
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_concept_networks',
          synthesisId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate concept networks: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate concept networks')
      }

      setState(prev => ({
        ...prev,
        conceptNetworks: data.conceptNetworks
      }))

      return data.conceptNetworks
    } catch (error) {
      console.error('Error generating concept networks:', error)
      return []
    }
  }, [])

  // Search content sources
  const searchSources = useCallback(async (
    query: string,
    filters?: SourceSearchFilters
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_sources',
          query,
          filters
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to search sources: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search sources')
      }

      setState(prev => ({
        ...prev,
        availableSources: data.sources,
        isLoading: false
      }))

      return data.sources
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search sources'
      }))
      return []
    }
  }, [])

  // Add content source
  const addContentSource = useCallback(async (source: ContentSource) => {
    try {
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_source',
          source
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add source: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add source')
      }

      setState(prev => ({
        ...prev,
        availableSources: [source, ...prev.availableSources]
      }))

      return true
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add source'
      }))
      return false
    }
  }, [])

  // Get synthesis by ID
  const getSynthesis = useCallback(async (synthesisId: string) => {
    try {
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_synthesis',
          synthesisId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get synthesis: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get synthesis')
      }

      setState(prev => ({
        ...prev,
        currentSynthesis: data.synthesis
      }))

      return data.synthesis
    } catch (error) {
      console.error('Error getting synthesis:', error)
      return null
    }
  }, [])

  // Search existing syntheses
  const searchSyntheses = useCallback(async (query: string) => {
    try {
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_syntheses',
          query
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to search syntheses: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search syntheses')
      }

      return data.syntheses
    } catch (error) {
      console.error('Error searching syntheses:', error)
      return []
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear current synthesis
  const clearSynthesis = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentSynthesis: null,
      conceptNetworks: [],
      synthesisProgress: null
    }))
  }, [])

  // Load synthesis history
  const loadSynthesisHistory = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_synthesis_history'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            synthesisHistory: data.syntheses,
            isLoading: false
          }))
        }
      }
    } catch (error) {
      console.error('Error loading synthesis history:', error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  // Auto-load synthesis history on mount
  useEffect(() => {
    loadSynthesisHistory()
  }, [loadSynthesisHistory])

  return {
    // State
    currentSynthesis: state.currentSynthesis,
    synthesisHistory: state.synthesisHistory,
    availableSources: state.availableSources,
    conceptNetworks: state.conceptNetworks,
    synthesisProgress: state.synthesisProgress,
    isLoading: state.isLoading,
    isSynthesizing: state.isSynthesizing,
    isUpdating: state.isUpdating,
    error: state.error,
    lastSynthesisId: state.lastSynthesisId,
    
    // Actions
    synthesizeContent,
    synthesizeWithProgress,
    updateSynthesis,
    adaptSynthesis,
    generateConceptNetworks,
    searchSources,
    addContentSource,
    getSynthesis,
    searchSyntheses,
    clearError,
    clearSynthesis,
    loadSynthesisHistory,
    
    // Computed state
    hasSynthesis: !!state.currentSynthesis,
    hasHistory: state.synthesisHistory.length > 0,
    hasSources: state.availableSources.length > 0,
    hasConceptNetworks: state.conceptNetworks.length > 0,
    synthesisQuality: state.currentSynthesis ? (
      state.currentSynthesis.quality_metrics.coherence_score +
      state.currentSynthesis.quality_metrics.completeness_score +
      state.currentSynthesis.quality_metrics.accuracy_confidence +
      state.currentSynthesis.quality_metrics.pedagogical_effectiveness +
      state.currentSynthesis.quality_metrics.engagement_potential
    ) / 5 : 0,
    progressPercentage: state.synthesisProgress?.progress_percentage || 0,
    isProcessing: state.isSynthesizing || state.isUpdating || state.isLoading
  }
}

// Hook for synthesis analytics
export function useSynthesisAnalytics() {
  const [analytics, setAnalytics] = useState<{
    total_syntheses: number
    total_sources_processed: number
    average_quality_score: number
    most_common_topics: string[]
    synthesis_success_rate: number
  }>({
    total_syntheses: 0,
    total_sources_processed: 0,
    average_quality_score: 0,
    most_common_topics: [],
    synthesis_success_rate: 0
  })

  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/content-synthesis', {
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
      console.error('Error loading synthesis analytics:', error)
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

// Hook for source management
export function useSourceManagement() {
  const [sources, setSources] = useState<ContentSource[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSources = useCallback(async (filters?: SourceSearchFilters) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_all_sources',
          filters
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load sources: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load sources')
      }

      setSources(data.sources)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load sources')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addSource = useCallback(async (source: ContentSource) => {
    try {
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_source',
          source
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add source: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add source')
      }

      setSources(prev => [source, ...prev])
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add source')
      return false
    }
  }, [])

  const removeSource = useCallback(async (sourceId: string) => {
    try {
      const response = await fetch('/api/content-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_source',
          sourceId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to remove source: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to remove source')
      }

      setSources(prev => prev.filter(s => s.source_id !== sourceId))
      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove source')
      return false
    }
  }, [])

  useEffect(() => {
    loadSources()
  }, [loadSources])

  return {
    sources,
    isLoading,
    error,
    loadSources,
    addSource,
    removeSource,
    clearError: () => setError(null)
  }
}
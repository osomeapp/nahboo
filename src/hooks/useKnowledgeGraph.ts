'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type KnowledgeGraph,
  type LearningPath,
  type ConceptNode,
  type KnowledgeGap
} from '@/lib/knowledge-graph-generator'

interface KnowledgeGraphState {
  graphs: Map<string, KnowledgeGraph>
  currentGraph: KnowledgeGraph | null
  learningPaths: LearningPath[]
  searchResults: ConceptNode[]
  isLoading: boolean
  isGenerating: boolean
  error: string | null
  lastUpdated: Date | null
}

interface GraphAnalysis {
  gaps: string[]
  coverage: string[]
  suggestions: string[]
  metrics: {
    conceptDensity: number
    avgDifficulty: number
    prerequisiteChains: {
      maxChainLength: number
      avgChainLength: number
      isolatedConcepts: number
    }
    topicalBalance: {
      categoryDistribution: Record<string, number>
      mostCommonCategory: string
      leastCommonCategory: string
      balanceScore: number
    }
  }
}

// Main hook for knowledge graph management
export function useKnowledgeGraph() {
  const [state, setState] = useState<KnowledgeGraphState>({
    graphs: new Map(),
    currentGraph: null,
    learningPaths: [],
    searchResults: [],
    isLoading: false,
    isGenerating: false,
    error: null,
    lastUpdated: null
  })

  // Generate new knowledge graph
  const generateKnowledgeGraph = useCallback(async (
    subject: string,
    scope: 'basic' | 'intermediate' | 'advanced' | 'comprehensive' = 'comprehensive',
    targetAudience: string = 'general'
  ) => {
    try {
      setState(prev => ({ ...prev, isGenerating: true, error: null }))
      
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          subject,
          scope,
          targetAudience
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate knowledge graph: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate knowledge graph')
      }

      const knowledgeGraph = data.knowledgeGraph

      setState(prev => ({
        ...prev,
        graphs: new Map(prev.graphs.set(subject, knowledgeGraph)),
        currentGraph: knowledgeGraph,
        isGenerating: false,
        lastUpdated: new Date()
      }))

      return knowledgeGraph
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate knowledge graph'
      }))
      throw error
    }
  }, [])

  // Load existing knowledge graph
  const loadKnowledgeGraph = useCallback(async (subject: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          subject
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load knowledge graph: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load knowledge graph')
      }

      const knowledgeGraph = data.knowledgeGraph

      setState(prev => ({
        ...prev,
        graphs: new Map(prev.graphs.set(subject, knowledgeGraph)),
        currentGraph: knowledgeGraph,
        isLoading: false,
        lastUpdated: new Date()
      }))

      return knowledgeGraph
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load knowledge graph'
      }))
      return null
    }
  }, [])

  // Load all knowledge graphs
  const loadAllKnowledgeGraphs = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_all'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load knowledge graphs: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load knowledge graphs')
      }

      const graphs = new Map()
      data.knowledgeGraphs?.forEach((graph: KnowledgeGraph) => {
        graphs.set(graph.subject, graph)
      })

      setState(prev => ({
        ...prev,
        graphs,
        isLoading: false,
        lastUpdated: new Date()
      }))

      return data.knowledgeGraphs || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load knowledge graphs'
      }))
      return []
    }
  }, [])

  // Search concepts across all graphs
  const searchConcepts = useCallback(async (query: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search_concepts',
          query
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to search concepts: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search concepts')
      }

      setState(prev => ({
        ...prev,
        searchResults: data.concepts || [],
        isLoading: false
      }))

      return data.concepts || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to search concepts'
      }))
      return []
    }
  }, [])

  // Generate learning paths for current graph
  const generateLearningPaths = useCallback(async (
    subject: string,
    targetDifficulty: string = 'intermediate',
    maxDuration: number = 40
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_learning_paths',
          subject,
          targetDifficulty,
          maxDuration
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate learning paths: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate learning paths')
      }

      setState(prev => ({
        ...prev,
        learningPaths: data.learningPaths || [],
        isLoading: false
      }))

      return data.learningPaths || []
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate learning paths'
      }))
      return []
    }
  }, [])

  // Get concept dependencies
  const getConceptDependencies = useCallback(async (conceptId: string) => {
    try {
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_dependencies',
          conceptId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get dependencies: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get dependencies')
      }

      return data.dependencies || []
    } catch (error) {
      console.error('Error getting dependencies:', error)
      return []
    }
  }, [])

  // Analyze knowledge graph for gaps and improvements
  const analyzeKnowledgeGraph = useCallback(async (subject: string): Promise<GraphAnalysis | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_gaps',
          subject
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze knowledge graph: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze knowledge graph')
      }

      setState(prev => ({ ...prev, isLoading: false }))

      return data.analysis as GraphAnalysis
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to analyze knowledge graph'
      }))
      return null
    }
  }, [])

  // Set current graph
  const setCurrentGraph = useCallback((subject: string) => {
    const graph = state.graphs.get(subject)
    if (graph) {
      setState(prev => ({ ...prev, currentGraph: graph }))
    }
  }, [state.graphs])

  // Clear search results
  const clearSearchResults = useCallback(() => {
    setState(prev => ({ ...prev, searchResults: [] }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Get graph statistics
  const getGraphStatistics = useCallback(() => {
    if (!state.currentGraph) return null

    const graph = state.currentGraph
    const totalConcepts = graph.nodes.length
    const totalRelationships = graph.relationships.length
    
    // Calculate difficulty distribution
    const difficultyDistribution = graph.nodes.reduce((acc, concept) => {
      const level = concept.difficulty <= 3 ? 'easy' : 
                   concept.difficulty <= 7 ? 'medium' : 'hard'
      acc[level] = (acc[level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate category distribution
    const categoryDistribution = graph.nodes.reduce((acc, concept) => {
      acc[concept.category] = (acc[concept.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Find concepts with most prerequisites
    const conceptsWithPrerequisites = graph.nodes
      .filter(concept => concept.prerequisites.length > 0)
      .sort((a, b) => b.prerequisites.length - a.prerequisites.length)
      .slice(0, 5)

    // Find most important concepts
    const mostImportantConcepts = graph.nodes
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)

    return {
      totalConcepts,
      totalRelationships,
      averageDifficulty: graph.metadata.averageDifficulty,
      estimatedDuration: graph.metadata.estimatedCourseLength,
      difficultyDistribution,
      categoryDistribution,
      conceptsWithPrerequisites,
      mostImportantConcepts,
      coverage: graph.metadata.coverage,
      lastUpdated: graph.metadata.lastUpdated
    }
  }, [state.currentGraph])

  // Get learning path recommendations
  const getPathRecommendations = useCallback((userProfile?: {
    level: string
    interests: string[]
    timeAvailable: number
  }) => {
    if (!state.learningPaths.length) return []

    let filteredPaths = [...state.learningPaths]

    if (userProfile) {
      // Filter by difficulty level
      if (userProfile.level) {
        filteredPaths = filteredPaths.filter(path => path.difficulty === userProfile.level)
      }

      // Filter by time available
      if (userProfile.timeAvailable) {
        filteredPaths = filteredPaths.filter(path => path.estimatedDuration <= userProfile.timeAvailable)
      }

      // Sort by relevance to interests
      if (userProfile.interests.length > 0) {
        filteredPaths = filteredPaths.sort((a, b) => {
          const aRelevance = a.concepts.reduce((score, concept) => {
            const matches = userProfile.interests.filter(interest =>
              concept.metadata.keywords.some(keyword =>
                keyword.toLowerCase().includes(interest.toLowerCase())
              )
            ).length
            return score + matches
          }, 0)

          const bRelevance = b.concepts.reduce((score, concept) => {
            const matches = userProfile.interests.filter(interest =>
              concept.metadata.keywords.some(keyword =>
                keyword.toLowerCase().includes(interest.toLowerCase())
              )
            ).length
            return score + matches
          }, 0)

          return bRelevance - aRelevance
        })
      }
    }

    return filteredPaths.slice(0, 3) // Return top 3 recommendations
  }, [state.learningPaths])

  // Load initial data on mount
  useEffect(() => {
    loadAllKnowledgeGraphs()
  }, [loadAllKnowledgeGraphs])

  return {
    // State
    graphs: state.graphs,
    currentGraph: state.currentGraph,
    learningPaths: state.learningPaths,
    searchResults: state.searchResults,
    isLoading: state.isLoading,
    isGenerating: state.isGenerating,
    error: state.error,
    lastUpdated: state.lastUpdated,

    // Actions
    generateKnowledgeGraph,
    loadKnowledgeGraph,
    loadAllKnowledgeGraphs,
    searchConcepts,
    generateLearningPaths,
    getConceptDependencies,
    analyzeKnowledgeGraph,
    setCurrentGraph,
    clearSearchResults,
    clearError,

    // Analytics
    getGraphStatistics,
    getPathRecommendations
  }
}

// Hook for concept exploration and navigation
export function useConceptExploration() {
  const [explorationState, setExplorationState] = useState<{
    currentConcept: ConceptNode | null
    relatedConcepts: ConceptNode[]
    prerequisites: ConceptNode[]
    dependents: ConceptNode[]
    navigationHistory: string[]
    isExploring: boolean
  }>({
    currentConcept: null,
    relatedConcepts: [],
    prerequisites: [],
    dependents: [],
    navigationHistory: [],
    isExploring: false
  })

  const { getConceptDependencies } = useKnowledgeGraph()

  // Navigate to a concept
  const navigateToConcept = useCallback(async (concept: ConceptNode) => {
    try {
      setExplorationState(prev => ({
        ...prev,
        isExploring: true,
        navigationHistory: [...prev.navigationHistory, concept.id]
      }))

      // Get dependencies for this concept
      const dependencies = await getConceptDependencies(concept.id)

      setExplorationState(prev => ({
        ...prev,
        currentConcept: concept,
        prerequisites: dependencies,
        isExploring: false
      }))
    } catch (error) {
      console.error('Error navigating to concept:', error)
      setExplorationState(prev => ({ ...prev, isExploring: false }))
    }
  }, [getConceptDependencies])

  // Go back in navigation history
  const goBack = useCallback(() => {
    setExplorationState(prev => {
      if (prev.navigationHistory.length <= 1) return prev

      const newHistory = [...prev.navigationHistory]
      newHistory.pop() // Remove current
      const previousConceptId = newHistory[newHistory.length - 1]

      return {
        ...prev,
        navigationHistory: newHistory
      }
    })
  }, [])

  // Clear exploration state
  const clearExploration = useCallback(() => {
    setExplorationState({
      currentConcept: null,
      relatedConcepts: [],
      prerequisites: [],
      dependents: [],
      navigationHistory: [],
      isExploring: false
    })
  }, [])

  return {
    currentConcept: explorationState.currentConcept,
    relatedConcepts: explorationState.relatedConcepts,
    prerequisites: explorationState.prerequisites,
    dependents: explorationState.dependents,
    navigationHistory: explorationState.navigationHistory,
    isExploring: explorationState.isExploring,
    canGoBack: explorationState.navigationHistory.length > 1,
    
    navigateToConcept,
    goBack,
    clearExploration
  }
}
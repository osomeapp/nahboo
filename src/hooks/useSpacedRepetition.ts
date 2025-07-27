'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type LearningItem,
  type ReviewSession,
  type MemoryState,
  type SpacedRepetitionSchedule,
  type ForgettingCurveAnalysis,
  type LeitnerBoxSystem,
  type SuperMemoAlgorithm
} from '@/lib/spaced-repetition-engine'

interface SpacedRepetitionState {
  currentSchedule: SpacedRepetitionSchedule | null
  todaysDueItems: Array<{ item_id: string, priority: number, overdue_days: number }>
  currentMemoryStates: MemoryState[]
  forgettingCurves: ForgettingCurveAnalysis[]
  reviewHistory: ReviewSession[]
  leitnerSystem: LeitnerBoxSystem | null
  superMemoData: SuperMemoAlgorithm | null
  isLoading: boolean
  isReviewing: boolean
  error: string | null
  lastReviewId: string | null
}

interface ReviewProgress {
  items_reviewed: number
  total_items: number
  current_accuracy: number
  session_duration_minutes: number
  estimated_time_remaining: number
}

// Main hook for spaced repetition system
export function useSpacedRepetition(learnerId: string) {
  const [state, setState] = useState<SpacedRepetitionState>({
    currentSchedule: null,
    todaysDueItems: [],
    currentMemoryStates: [],
    forgettingCurves: [],
    reviewHistory: [],
    leitnerSystem: null,
    superMemoData: null,
    isLoading: false,
    isReviewing: false,
    error: null,
    lastReviewId: null
  })

  // Add new learning item
  const addLearningItem = useCallback(async (
    item: LearningItem,
    initialPerformance?: Partial<ReviewSession['performance_data']>
  ) => {
    try {
      setState(prev => ({ ...prev, error: null }))
      
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_learning_item',
          learnerId,
          item,
          initialPerformance
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add learning item: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add learning item')
      }

      setState(prev => ({
        ...prev,
        currentMemoryStates: [...prev.currentMemoryStates, data.memoryState]
      }))

      return data.memoryState
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add learning item'
      }))
      throw error
    }
  }, [learnerId])

  // Record review session
  const recordReviewSession = useCallback(async (
    itemId: string,
    sessionData: Partial<ReviewSession>
  ) => {
    try {
      setState(prev => ({ ...prev, isReviewing: true, error: null }))
      
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_review_session',
          learnerId,
          itemId,
          sessionData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to record review session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to record review session')
      }

      setState(prev => ({
        ...prev,
        currentMemoryStates: prev.currentMemoryStates.map(state => 
          state.item_id === itemId ? data.updated_memory_state : state
        ),
        reviewHistory: [sessionData as ReviewSession, ...prev.reviewHistory.slice(0, 99)], // Keep last 100
        isReviewing: false,
        lastReviewId: data.updated_memory_state.item_id
      }))

      return {
        updated_memory_state: data.updated_memory_state,
        next_review_date: new Date(data.next_review_date),
        adaptive_adjustments: data.adaptive_adjustments,
        learning_insights: data.learning_insights
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isReviewing: false,
        error: error instanceof Error ? error.message : 'Failed to record review session'
      }))
      throw error
    }
  }, [learnerId])

  // Generate schedule
  const generateSchedule = useCallback(async (
    horizonDays: number = 30,
    maxDailyReviews: number = 50
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_schedule',
          learnerId,
          horizonDays,
          maxDailyReviews
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate schedule: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate schedule')
      }

      setState(prev => ({
        ...prev,
        currentSchedule: data.schedule,
        isLoading: false
      }))

      return data.schedule
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate schedule'
      }))
      throw error
    }
  }, [learnerId])

  // Analyze forgetting curve
  const analyzeForgettingCurve = useCallback(async (itemId: string) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_forgetting_curve',
          learnerId,
          itemId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze forgetting curve: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze forgetting curve')
      }

      setState(prev => ({
        ...prev,
        forgettingCurves: prev.forgettingCurves.filter(curve => curve.item_id !== itemId).concat(data.analysis)
      }))

      return data.analysis
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to analyze forgetting curve'
      }))
      throw error
    }
  }, [learnerId])

  // Optimize review intervals
  const optimizeReviewIntervals = useCallback(async (itemIds?: string[]) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize_review_intervals',
          learnerId,
          itemIds
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to optimize intervals: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize review intervals')
      }

      return data.optimization
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to optimize review intervals'
      }))
      throw error
    }
  }, [learnerId])

  // Get optimal review times
  const getOptimalReviewTimes = useCallback(async (targetDate: Date) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_optimal_review_times',
          learnerId,
          targetDate: targetDate.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get optimal times: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get optimal review times')
      }

      return data.recommendations
    } catch (error) {
      console.error('Error getting optimal review times:', error)
      return []
    }
  }, [learnerId])

  // Initialize Leitner box system
  const initializeLeitnerSystem = useCallback(async (
    maxBoxes: number = 5,
    initialInterval: number = 1
  ) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize_leitner_system',
          learnerId,
          maxBoxes,
          initialInterval
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize Leitner system: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize Leitner system')
      }

      setState(prev => ({
        ...prev,
        leitnerSystem: data.system
      }))

      return data.system
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize Leitner system'
      }))
      throw error
    }
  }, [learnerId])

  // Initialize SuperMemo algorithm
  const initializeSuperMemo = useCallback(async (
    version: SuperMemoAlgorithm['version'] = 'SM-2'
  ) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize_supermemo',
          learnerId,
          version
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize SuperMemo: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize SuperMemo')
      }

      setState(prev => ({
        ...prev,
        superMemoData: data.algorithm
      }))

      return data.algorithm
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize SuperMemo'
      }))
      throw error
    }
  }, [learnerId])

  // Get items due today
  const loadItemsDueToday = useCallback(async () => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_items_due_today',
          learnerId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            todaysDueItems: data.dueItems
          }))
        }
      }
    } catch (error) {
      console.error('Error loading items due today:', error)
    }
  }, [learnerId])

  // Get memory state for item
  const getMemoryState = useCallback(async (itemId: string) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_memory_state',
          learnerId,
          itemId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get memory state: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get memory state')
      }

      return data.memoryState
    } catch (error) {
      console.error('Error getting memory state:', error)
      return null
    }
  }, [learnerId])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      await Promise.all([
        loadItemsDueToday(),
        generateSchedule(30, 50)
      ])
    } catch (error) {
      console.error('Error loading spaced repetition data:', error)
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [loadItemsDueToday, generateSchedule])

  // Auto-load data on mount and learnerId change
  useEffect(() => {
    if (learnerId) {
      loadAllData()
    }
  }, [learnerId, loadAllData])

  return {
    // State
    currentSchedule: state.currentSchedule,
    todaysDueItems: state.todaysDueItems,
    currentMemoryStates: state.currentMemoryStates,
    forgettingCurves: state.forgettingCurves,
    reviewHistory: state.reviewHistory,
    leitnerSystem: state.leitnerSystem,
    superMemoData: state.superMemoData,
    isLoading: state.isLoading,
    isReviewing: state.isReviewing,
    error: state.error,
    lastReviewId: state.lastReviewId,
    
    // Actions
    addLearningItem,
    recordReviewSession,
    generateSchedule,
    analyzeForgettingCurve,
    optimizeReviewIntervals,
    getOptimalReviewTimes,
    initializeLeitnerSystem,
    initializeSuperMemo,
    loadItemsDueToday,
    getMemoryState,
    clearError,
    loadAllData,
    
    // Computed state
    hasSchedule: !!state.currentSchedule,
    hasDueItems: state.todaysDueItems.length > 0,
    hasMemoryStates: state.currentMemoryStates.length > 0,
    totalItemsTracked: state.currentMemoryStates.length,
    itemsDueToday: state.todaysDueItems.length,
    overdueItems: state.todaysDueItems.filter(item => item.overdue_days > 0).length,
    averageMemoryStrength: state.currentMemoryStates.length > 0 ? 
      state.currentMemoryStates.reduce((sum, state) => sum + state.memory_strength, 0) / state.currentMemoryStates.length : 0,
    
    // Today's schedule
    todaysSchedule: state.currentSchedule?.daily_schedules.find(schedule => 
      new Date(schedule.date).toDateString() === new Date().toDateString()
    ),
    
    // Learning phase distribution
    learningPhaseDistribution: state.currentMemoryStates.reduce((acc, memoryState) => {
      acc[memoryState.learning_phase] = (acc[memoryState.learning_phase] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    
    // Performance trends
    recentPerformance: state.reviewHistory.slice(0, 10).map(session => ({
      date: session.session_date,
      quality: session.performance_data.response_quality,
      confidence: session.performance_data.confidence_level
    }))
  }
}

// Hook for spaced repetition analytics
export function useSpacedRepetitionAnalytics(learnerId: string) {
  const [analytics, setAnalytics] = useState<{
    total_items_learned: number
    total_reviews_completed: number
    average_retention_rate: number
    optimal_intervals_achieved: number
    learning_velocity: number
    forgetting_curve_quality: number
    system_effectiveness: number
    time_invested_hours: number
    knowledge_retention_score: number
    performance_trends: Array<{
      date: string
      retention_rate: number
      review_count: number
      avg_confidence: number
    }>
    interval_optimization_impact: number
    strongest_memory_areas: string[]
    areas_needing_attention: string[]
  }>({
    total_items_learned: 0,
    total_reviews_completed: 0,
    average_retention_rate: 0,
    optimal_intervals_achieved: 0,
    learning_velocity: 0,
    forgetting_curve_quality: 0,
    system_effectiveness: 0,
    time_invested_hours: 0,
    knowledge_retention_score: 0,
    performance_trends: [],
    interval_optimization_impact: 0,
    strongest_memory_areas: [],
    areas_needing_attention: []
  })

  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_analytics',
          learnerId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Error loading spaced repetition analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [learnerId])

  useEffect(() => {
    if (learnerId) {
      loadAnalytics()
    }
  }, [learnerId, loadAnalytics])

  return {
    analytics,
    isLoading,
    loadAnalytics
  }
}

// Hook for review session management
export function useReviewSession(learnerId: string) {
  const [sessionState, setSessionState] = useState<{
    currentItem: LearningItem | null
    memoryState: MemoryState | null
    sessionProgress: ReviewProgress | null
    isInSession: boolean
    sessionStartTime: Date | null
    reviewQueue: string[]
  }>({
    currentItem: null,
    memoryState: null,
    sessionProgress: null,
    isInSession: false,
    sessionStartTime: null,
    reviewQueue: []
  })

  const startReviewSession = useCallback(async (itemIds: string[]) => {
    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_review_session',
          learnerId,
          itemIds
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start review session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start review session')
      }

      setSessionState({
        currentItem: data.firstItem,
        memoryState: data.firstMemoryState,
        sessionProgress: {
          items_reviewed: 0,
          total_items: itemIds.length,
          current_accuracy: 0,
          session_duration_minutes: 0,
          estimated_time_remaining: itemIds.length * 5 // 5 min per item estimate
        },
        isInSession: true,
        sessionStartTime: new Date(),
        reviewQueue: itemIds
      })

      return data
    } catch (error) {
      console.error('Error starting review session:', error)
      throw error
    }
  }, [learnerId])

  const completeCurrentReview = useCallback(async (
    performance: ReviewSession['performance_data']
  ) => {
    if (!sessionState.currentItem || !sessionState.sessionProgress) {
      throw new Error('No active review session')
    }

    try {
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_review_in_session',
          learnerId,
          itemId: sessionState.currentItem.item_id,
          performance
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to complete review: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete review')
      }

      // Update session progress
      const newProgress = {
        ...sessionState.sessionProgress,
        items_reviewed: sessionState.sessionProgress.items_reviewed + 1,
        current_accuracy: (sessionState.sessionProgress.current_accuracy * sessionState.sessionProgress.items_reviewed + performance.response_quality) / (sessionState.sessionProgress.items_reviewed + 1),
        session_duration_minutes: sessionState.sessionStartTime ? 
          (Date.now() - sessionState.sessionStartTime.getTime()) / (1000 * 60) : 0
      }

      // Get next item
      const remainingQueue = sessionState.reviewQueue.slice(sessionState.sessionProgress.items_reviewed + 1)
      
      if (remainingQueue.length > 0) {
        // Continue session with next item
        const nextItemResponse = await fetch('/api/spaced-repetition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'get_learning_item',
            itemId: remainingQueue[0]
          })
        })

        if (nextItemResponse.ok) {
          const nextItemData = await nextItemResponse.json()
          
          setSessionState(prev => ({
            ...prev,
            currentItem: nextItemData.item,
            memoryState: nextItemData.memoryState,
            sessionProgress: newProgress
          }))
        }
      } else {
        // Session complete
        setSessionState(prev => ({
          ...prev,
          currentItem: null,
          memoryState: null,
          sessionProgress: newProgress,
          isInSession: false
        }))
      }

      return data
    } catch (error) {
      console.error('Error completing review:', error)
      throw error
    }
  }, [learnerId, sessionState])

  const endSession = useCallback(() => {
    setSessionState({
      currentItem: null,
      memoryState: null,
      sessionProgress: null,
      isInSession: false,
      sessionStartTime: null,
      reviewQueue: []
    })
  }, [])

  return {
    ...sessionState,
    startReviewSession,
    completeCurrentReview,
    endSession,
    isSessionComplete: sessionState.sessionProgress ? 
      sessionState.sessionProgress.items_reviewed >= sessionState.sessionProgress.total_items : false,
    sessionCompletionRate: sessionState.sessionProgress ? 
      sessionState.sessionProgress.items_reviewed / sessionState.sessionProgress.total_items : 0
  }
}

// Hook for forgetting curve analysis
export function useForgettingCurveAnalysis(learnerId: string, itemId: string) {
  const [curveData, setCurveData] = useState<ForgettingCurveAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeCurve = useCallback(async () => {
    try {
      setIsAnalyzing(true)
      
      const response = await fetch('/api/spaced-repetition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_forgetting_curve',
          learnerId,
          itemId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze curve: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze forgetting curve')
      }

      setCurveData(data.analysis)
      return data.analysis
    } catch (error) {
      console.error('Error analyzing forgetting curve:', error)
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }, [learnerId, itemId])

  const updateCurveData = useCallback((newData: ForgettingCurveAnalysis) => {
    setCurveData(newData)
  }, [])

  useEffect(() => {
    if (learnerId && itemId) {
      analyzeCurve()
    }
  }, [learnerId, itemId, analyzeCurve])

  return {
    curveData,
    isAnalyzing,
    analyzeCurve,
    updateCurveData,
    
    // Computed properties
    retentionQuality: curveData ? 
      curveData.curve_parameters.r_squared : 0,
    optimalReviewInterval: curveData ? 
      curveData.curve_parameters.half_life * 0.8 : 24, // 80% of half-life
    predictionAccuracy: curveData ? 
      curveData.curve_parameters.r_squared : 0
  }
}
import { useState, useEffect, useCallback, useRef } from 'react'
import type { UserProfile } from '@/types'
import type { AdaptationResult, VisualFeedback } from '@/lib/real-time-adaptation'

interface InteractionTracker {
  timeSpent: number
  scrollBehavior: {
    totalScrolls: number
    averageScrollSpeed: number
    backScrollEvents: number
    timeAtTop: number
    timeAtBottom: number
    scrollCompletionRate: number
  }
  clickPatterns: Array<{
    timestamp: string
    elementType: string
    elementId?: string
    clickCount: number
    doubleClicks: number
    rightClicks: number
    position: { x: number; y: number }
  }>
  pauseEvents: Array<{
    timestamp: string
    duration: number
    location: string
    resumedTo?: string
  }>
  helpRequests: number
  attempts: number
  frustrationIndicators: Array<{
    type: string
    intensity: number
    timestamp: string
    context?: string
  }>
  engagementLevel: number
}

interface RealTimeAdaptationState {
  isEnabled: boolean
  adaptations: AdaptationResult[]
  activeVisualFeedback: VisualFeedback[]
  isProcessing: boolean
  error: string | null
  
  // Interaction tracking
  interactionData: InteractionTracker
  sessionId: string
  startTime: Date
  
  // Metrics
  adaptationCount: number
  averageResponseTime: number
  userSatisfaction: number
}

interface RealTimeAdaptationActions {
  enableAdaptation: () => void
  disableAdaptation: () => void
  recordInteraction: (type: string, data: any) => void
  recordFrustration: (type: string, intensity: number, context?: string) => void
  recordHelp: () => void
  recordAttempt: () => void
  updateEngagement: (level: number) => void
  dismissFeedback: (feedbackId: string) => void
  provideFeedback: (feedbackData: any) => void
  resetSession: () => void
}

export function useRealTimeAdaptation(
  contentId: string,
  userProfile: UserProfile,
  options: {
    adaptationFrequency?: number
    enableAutoAdaptation?: boolean
    adaptationTypes?: string[]
  } = {}
): RealTimeAdaptationState & RealTimeAdaptationActions {
  
  const [state, setState] = useState<RealTimeAdaptationState>({
    isEnabled: options.enableAutoAdaptation ?? true,
    adaptations: [],
    activeVisualFeedback: [],
    isProcessing: false,
    error: null,
    interactionData: {
      timeSpent: 0,
      scrollBehavior: {
        totalScrolls: 0,
        averageScrollSpeed: 0,
        backScrollEvents: 0,
        timeAtTop: 0,
        timeAtBottom: 0,
        scrollCompletionRate: 0
      },
      clickPatterns: [],
      pauseEvents: [],
      helpRequests: 0,
      attempts: 1,
      frustrationIndicators: [],
      engagementLevel: 0.7
    },
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: new Date(),
    adaptationCount: 0,
    averageResponseTime: 0,
    userSatisfaction: 0.7
  })
  
  // Refs for tracking
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const scrollTimeRef = useRef<number>(0)
  const lastScrollRef = useRef<number>(0)
  const lastActivityRef = useRef<Date>(new Date())
  const pauseStartRef = useRef<Date | null>(null)
  
  // Auto-adaptation interval
  useEffect(() => {
    if (!state.isEnabled) return
    
    const frequency = options.adaptationFrequency || 15000 // 15 seconds default
    
    intervalRef.current = setInterval(() => {
      if (state.interactionData.timeSpent > 30) { // Only adapt after 30 seconds
        requestAdaptation()
      }
    }, frequency)
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isEnabled, state.interactionData.timeSpent])
  
  // Time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({
        ...prev,
        interactionData: {
          ...prev.interactionData,
          timeSpent: Math.floor((Date.now() - prev.startTime.getTime()) / 1000)
        }
      }))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])
  
  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now()
      const scrollY = window.scrollY
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollCompletion = scrollHeight > 0 ? scrollY / scrollHeight : 0
      
      setState(prev => {
        const newScrollBehavior = { ...prev.interactionData.scrollBehavior }
        newScrollBehavior.totalScrolls += 1
        newScrollBehavior.scrollCompletionRate = Math.max(
          newScrollBehavior.scrollCompletionRate, 
          scrollCompletion
        )
        
        // Detect back scrolling
        if (scrollY < lastScrollRef.current - 50) {
          newScrollBehavior.backScrollEvents += 1
        }
        
        // Calculate scroll speed
        const timeDiff = now - scrollTimeRef.current
        if (timeDiff > 0) {
          const scrollDiff = Math.abs(scrollY - lastScrollRef.current)
          const speed = scrollDiff / timeDiff
          newScrollBehavior.averageScrollSpeed = 
            (newScrollBehavior.averageScrollSpeed + speed) / 2
        }
        
        lastScrollRef.current = scrollY
        scrollTimeRef.current = now
        lastActivityRef.current = new Date()
        
        return {
          ...prev,
          interactionData: {
            ...prev.interactionData,
            scrollBehavior: newScrollBehavior
          }
        }
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Click tracking
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const clickData = {
        timestamp: new Date().toISOString(),
        elementType: (event.target as Element)?.tagName?.toLowerCase() || 'unknown',
        elementId: (event.target as Element)?.id,
        clickCount: 1,
        doubleClicks: 0,
        rightClicks: event.button === 2 ? 1 : 0,
        position: { x: event.clientX, y: event.clientY }
      }
      
      setState(prev => ({
        ...prev,
        interactionData: {
          ...prev.interactionData,
          clickPatterns: [...prev.interactionData.clickPatterns.slice(-19), clickData]
        }
      }))
      
      lastActivityRef.current = new Date()
    }
    
    const handleDoubleClick = (event: MouseEvent) => {
      setState(prev => {
        const lastClick = prev.interactionData.clickPatterns[
          prev.interactionData.clickPatterns.length - 1
        ]
        if (lastClick) {
          lastClick.doubleClicks += 1
        }
        return prev
      })
    }
    
    document.addEventListener('click', handleClick)
    document.addEventListener('dblclick', handleDoubleClick)
    
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('dblclick', handleDoubleClick)
    }
  }, [])
  
  // Pause detection (when user stops interacting)
  useEffect(() => {
    const checkForPauses = setInterval(() => {
      const now = new Date()
      const timeSinceLastActivity = now.getTime() - lastActivityRef.current.getTime()
      
      if (timeSinceLastActivity > 10000 && !pauseStartRef.current) {
        // Start of a pause
        pauseStartRef.current = lastActivityRef.current
      } else if (timeSinceLastActivity <= 5000 && pauseStartRef.current) {
        // End of a pause
        const pauseDuration = lastActivityRef.current.getTime() - pauseStartRef.current.getTime()
        
        setState(prev => ({
          ...prev,
          interactionData: {
            ...prev.interactionData,
            pauseEvents: [...prev.interactionData.pauseEvents.slice(-9), {
              timestamp: pauseStartRef.current!.toISOString(),
              duration: pauseDuration / 1000,
              location: `scroll_${Math.round(window.scrollY / 100) * 100}`,
              resumedTo: `scroll_${Math.round(window.scrollY / 100) * 100}`
            }]
          }
        }))
        
        pauseStartRef.current = null
      }
    }, 5000)
    
    return () => clearInterval(checkForPauses)
  }, [])
  
  // Request adaptation from API
  const requestAdaptation = useCallback(async () => {
    if (state.isProcessing) return
    
    setState(prev => ({ ...prev, isProcessing: true, error: null }))
    
    try {
      const response = await fetch('/api/adaptive/real-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          contentId,
          userProfile,
          interactionData: state.interactionData,
          action: 'adapt',
          adaptationTypes: options.adaptationTypes
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to get adaptations')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        adaptations: [...prev.adaptations, ...data.adaptations],
        adaptationCount: prev.adaptationCount + data.adaptations.length,
        activeVisualFeedback: [
          ...prev.activeVisualFeedback,
          ...data.adaptations
            .filter((a: AdaptationResult) => a.visualFeedback)
            .map((a: AdaptationResult) => ({ ...a.visualFeedback, id: `feedback_${Date.now()}` }))
        ],
        isProcessing: false
      }))
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Adaptation failed'
      }))
    }
  }, [state.sessionId, state.interactionData, state.isProcessing, contentId, userProfile, options.adaptationTypes])
  
  // Action methods
  const enableAdaptation = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: true }))
  }, [])
  
  const disableAdaptation = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: false }))
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [])
  
  const recordInteraction = useCallback((type: string, data: any) => {
    lastActivityRef.current = new Date()
    
    // Record specific interaction types
    if (type === 'video_play' || type === 'video_pause') {
      setState(prev => ({
        ...prev,
        interactionData: {
          ...prev.interactionData,
          engagementLevel: Math.min(1, prev.interactionData.engagementLevel + 0.1)
        }
      }))
    }
  }, [])
  
  const recordFrustration = useCallback((type: string, intensity: number, context?: string) => {
    const frustrationIndicator = {
      type,
      intensity,
      timestamp: new Date().toISOString(),
      context
    }
    
    setState(prev => ({
      ...prev,
      interactionData: {
        ...prev.interactionData,
        frustrationIndicators: [
          ...prev.interactionData.frustrationIndicators.slice(-9),
          frustrationIndicator
        ],
        engagementLevel: Math.max(0.1, prev.interactionData.engagementLevel - (intensity * 0.2))
      }
    }))
    
    // Trigger immediate adaptation for high frustration
    if (intensity > 0.7) {
      setTimeout(() => requestAdaptation(), 1000)
    }
  }, [requestAdaptation])
  
  const recordHelp = useCallback(() => {
    setState(prev => ({
      ...prev,
      interactionData: {
        ...prev.interactionData,
        helpRequests: prev.interactionData.helpRequests + 1
      }
    }))
    lastActivityRef.current = new Date()
  }, [])
  
  const recordAttempt = useCallback(() => {
    setState(prev => ({
      ...prev,
      interactionData: {
        ...prev.interactionData,
        attempts: prev.interactionData.attempts + 1
      }
    }))
  }, [])
  
  const updateEngagement = useCallback((level: number) => {
    setState(prev => ({
      ...prev,
      interactionData: {
        ...prev.interactionData,
        engagementLevel: Math.max(0, Math.min(1, level))
      }
    }))
  }, [])
  
  const dismissFeedback = useCallback((feedbackId: string) => {
    setState(prev => ({
      ...prev,
      activeVisualFeedback: prev.activeVisualFeedback.filter((f, index) => index.toString() !== feedbackId)
    }))
  }, [])
  
  const provideFeedback = useCallback(async (feedbackData: any) => {
    try {
      await fetch('/api/adaptive/real-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.sessionId,
          contentId,
          userProfile,
          interactionData: state.interactionData,
          action: 'feedback',
          feedbackData
        })
      })
      
      // Update user satisfaction based on feedback
      setState(prev => ({
        ...prev,
        userSatisfaction: feedbackData.overallRating || prev.userSatisfaction
      }))
      
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }, [state.sessionId, state.interactionData, contentId, userProfile])
  
  const resetSession = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      adaptations: [],
      activeVisualFeedback: [],
      adaptationCount: 0,
      interactionData: {
        timeSpent: 0,
        scrollBehavior: {
          totalScrolls: 0,
          averageScrollSpeed: 0,
          backScrollEvents: 0,
          timeAtTop: 0,
          timeAtBottom: 0,
          scrollCompletionRate: 0
        },
        clickPatterns: [],
        pauseEvents: [],
        helpRequests: 0,
        attempts: 1,
        frustrationIndicators: [],
        engagementLevel: 0.7
      }
    }))
    
    lastActivityRef.current = new Date()
    pauseStartRef.current = null
  }, [])
  
  return {
    ...state,
    enableAdaptation,
    disableAdaptation,
    recordInteraction,
    recordFrustration,
    recordHelp,
    recordAttempt,
    updateEngagement,
    dismissFeedback,
    provideFeedback,
    resetSession
  }
}

// Hook for displaying visual feedback
export function useVisualFeedback() {
  const [feedbackItems, setFeedbackItems] = useState<(VisualFeedback & { id: string })[]>([])
  
  const showFeedback = useCallback((feedback: VisualFeedback) => {
    const feedbackWithId = { ...feedback, id: `feedback_${Date.now()}_${Math.random()}` }
    setFeedbackItems(prev => [...prev, feedbackWithId])
    
    // Auto-dismiss after duration
    if (feedback.duration > 0) {
      setTimeout(() => {
        setFeedbackItems(prev => prev.filter(f => f.id !== feedbackWithId.id))
      }, feedback.duration)
    }
    
    return feedbackWithId.id
  }, [])
  
  const dismissFeedback = useCallback((feedbackId: string) => {
    setFeedbackItems(prev => prev.filter(f => f.id !== feedbackId))
  }, [])
  
  const clearAllFeedback = useCallback(() => {
    setFeedbackItems([])
  }, [])
  
  return {
    feedbackItems,
    showFeedback,
    dismissFeedback,
    clearAllFeedback
  }
}

// Hook for adaptation analytics
export function useAdaptationAnalytics(sessionId: string) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/adaptive/real-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          action: 'monitor',
          contentId: 'analytics_request',
          userProfile: { id: 'system' },
          interactionData: { timeSpent: 0, helpRequests: 0, attempts: 1, engagementLevel: 0.7 }
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])
  
  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])
  
  return {
    analytics,
    isLoading,
    refresh: loadAnalytics
  }
}
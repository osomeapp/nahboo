'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { 
  type ConversationMessage,
  type TutorPersonality,
  type ConversationContext
} from '@/lib/intelligent-tutoring-system'

interface TutoringState {
  sessionId: string | null
  conversationHistory: ConversationMessage[]
  currentContext: ConversationContext | null
  isLoading: boolean
  isTyping: boolean
  error: string | null
  personalities: TutorPersonality[]
  sessionSummary: {
    summary: string
    achievements: string[]
    recommendations: string[]
    sessionMetrics: any
  } | null
}

interface StudentProfile {
  name: string
  level: string
  learningStyle: string
  interests: string[]
  strugglingAreas: string[]
  strengths: string[]
}

// Main hook for intelligent tutoring
export function useIntelligentTutoring() {
  const [state, setState] = useState<TutoringState>({
    sessionId: null,
    conversationHistory: [],
    currentContext: null,
    isLoading: false,
    isTyping: false,
    error: null,
    personalities: [],
    sessionSummary: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  // Start a new tutoring conversation
  const startConversation = useCallback(async (
    studentProfile: StudentProfile,
    subject: string,
    learningObjectives: string[],
    tutorPersonalityId?: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, sessionSummary: null }))
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      
      const response = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_conversation',
          studentProfile,
          subject,
          learningObjectives,
          tutorPersonalityId
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start conversation')
      }

      setState(prev => ({
        ...prev,
        sessionId: data.sessionId,
        conversationHistory: data.conversationHistory || [],
        isLoading: false
      }))

      return data.sessionId
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start conversation'
      }))
      throw error
    }
  }, [])

  // Send a message and get tutor response
  const sendMessage = useCallback(async (message: string) => {
    if (!state.sessionId || !message.trim()) {
      return
    }

    try {
      setState(prev => ({ ...prev, isTyping: true, error: null }))
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      
      abortControllerRef.current = new AbortController()
      
      const response = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'continue_conversation',
          sessionId: state.sessionId,
          studentMessage: message.trim()
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send message')
      }

      setState(prev => ({
        ...prev,
        conversationHistory: data.conversationHistory || prev.conversationHistory,
        isTyping: false
      }))

      return data.message
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }
      
      setState(prev => ({
        ...prev,
        isTyping: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }))
      throw error
    }
  }, [state.sessionId])

  // End the current conversation
  const endConversation = useCallback(async () => {
    if (!state.sessionId) {
      return null
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_conversation',
          sessionId: state.sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to end conversation: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to end conversation')
      }

      setState(prev => ({
        ...prev,
        sessionSummary: data.sessionSummary,
        isLoading: false
      }))

      return data.sessionSummary
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to end conversation'
      }))
      throw error
    }
  }, [state.sessionId])

  // Get conversation context
  const getContext = useCallback(async () => {
    if (!state.sessionId) {
      return null
    }

    try {
      const response = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_context',
          sessionId: state.sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get context: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get context')
      }

      setState(prev => ({
        ...prev,
        currentContext: data.context
      }))

      return data.context
    } catch (error) {
      console.error('Error getting context:', error)
      return null
    }
  }, [state.sessionId])

  // Load available tutor personalities
  const loadPersonalities = useCallback(async () => {
    try {
      const response = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_personalities'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load personalities: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load personalities')
      }

      setState(prev => ({
        ...prev,
        personalities: data.personalities || []
      }))

      return data.personalities
    } catch (error) {
      console.error('Error loading personalities:', error)
      return []
    }
  }, [])

  // Clear conversation
  const clearConversation = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setState({
      sessionId: null,
      conversationHistory: [],
      currentContext: null,
      isLoading: false,
      isTyping: false,
      error: null,
      personalities: state.personalities, // Keep personalities loaded
      sessionSummary: null
    })
  }, [state.personalities])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear session summary
  const clearSummary = useCallback(() => {
    setState(prev => ({ ...prev, sessionSummary: null }))
  }, [])

  // Get conversation analytics
  const getConversationAnalytics = useCallback(() => {
    if (!state.currentContext || state.conversationHistory.length === 0) {
      return null
    }

    const context = state.currentContext
    const history = state.conversationHistory
    
    const studentMessages = history.filter(msg => msg.role === 'student')
    const tutorMessages = history.filter(msg => msg.role === 'tutor')
    
    // Calculate engagement metrics
    const avgStudentMessageLength = studentMessages.reduce((sum, msg) => sum + msg.content.length, 0) / studentMessages.length || 0
    const avgTutorMessageLength = tutorMessages.reduce((sum, msg) => sum + msg.content.length, 0) / tutorMessages.length || 0
    
    // Analyze message types
    const messageTypeDistribution = tutorMessages.reduce((acc, msg) => {
      const type = msg.metadata.messageType
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate session duration (approximate)
    const firstMessage = history[0]
    const lastMessage = history[history.length - 1]
    const sessionDuration = firstMessage && lastMessage 
      ? (new Date(lastMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime()) / 1000 / 60 // minutes
      : 0

    return {
      totalMessages: history.length,
      studentMessages: studentMessages.length,
      tutorMessages: tutorMessages.length,
      avgStudentMessageLength: Math.round(avgStudentMessageLength),
      avgTutorMessageLength: Math.round(avgTutorMessageLength),
      sessionDuration: Math.round(sessionDuration * 10) / 10, // rounded to 1 decimal
      messageTypeDistribution,
      understandingLevel: context.sessionMetrics.understandingLevel,
      engagementLevel: context.sessionMetrics.engagementLevel,
      conceptsMastered: context.sessionMetrics.conceptsMastered,
      areasNeedingWork: context.sessionMetrics.areasNeedingWork,
      tutorPersonality: context.tutorPersonality.name
    }
  }, [state.currentContext, state.conversationHistory])

  // Load personalities on mount
  useEffect(() => {
    loadPersonalities()
  }, [loadPersonalities])

  // Update context periodically during conversation
  useEffect(() => {
    if (state.sessionId && !state.isLoading && !state.isTyping) {
      const updateContext = async () => {
        await getContext()
      }
      
      const interval = setInterval(updateContext, 30000) // Every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [state.sessionId, state.isLoading, state.isTyping, getContext])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    // State
    sessionId: state.sessionId,
    conversationHistory: state.conversationHistory,
    currentContext: state.currentContext,
    isLoading: state.isLoading,
    isTyping: state.isTyping,
    error: state.error,
    personalities: state.personalities,
    sessionSummary: state.sessionSummary,
    
    // Computed
    isActive: !!state.sessionId,
    hasMessages: state.conversationHistory.length > 0,
    
    // Actions
    startConversation,
    sendMessage,
    endConversation,
    getContext,
    loadPersonalities,
    clearConversation,
    clearError,
    clearSummary,
    
    // Analytics
    getConversationAnalytics
  }
}

// Hook for managing tutor personality selection
export function useTutorPersonalitySelector() {
  const [selectedPersonality, setSelectedPersonality] = useState<TutorPersonality | null>(null)
  const [personalities, setPersonalities] = useState<TutorPersonality[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load personalities
  const loadPersonalities = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/tutoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_personalities'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPersonalities(data.personalities || [])
        }
      }
    } catch (error) {
      console.error('Error loading personalities:', error)
    }
    setIsLoading(false)
  }, [])

  // Get personality recommendations based on subject and student profile
  const getPersonalityRecommendations = useCallback((
    subject: string,
    studentProfile: Partial<StudentProfile>
  ) => {
    return personalities
      .map(personality => {
        let score = 0
        
        // Subject specialty match
        if (personality.subject_specialties.some(specialty => 
          subject.toLowerCase().includes(specialty.toLowerCase()) ||
          specialty.toLowerCase().includes(subject.toLowerCase())
        )) {
          score += 10
        }
        
        // Age group match
        if (studentProfile.level && personality.age_groups.includes(studentProfile.level)) {
          score += 5
        }
        
        // Learning style compatibility
        if (studentProfile.learningStyle === 'visual' && personality.characteristics.explanation_approach === 'example_driven') {
          score += 3
        }
        if (studentProfile.learningStyle === 'analytical' && personality.characteristics.questioning_style === 'socratic') {
          score += 3
        }
        if (studentProfile.learningStyle === 'kinesthetic' && personality.characteristics.explanation_approach === 'step_by_step') {
          score += 3
        }
        
        return { personality, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Top 3 recommendations
  }, [personalities])

  // Load personalities on mount
  useEffect(() => {
    loadPersonalities()
  }, [loadPersonalities])

  return {
    personalities,
    selectedPersonality,
    isLoading,
    setSelectedPersonality,
    getPersonalityRecommendations,
    loadPersonalities
  }
}

// Hook for conversation analytics and insights
export function useConversationInsights(conversationHistory: ConversationMessage[]) {
  const getMessagePatterns = useCallback(() => {
    if (conversationHistory.length === 0) return null

    const studentMessages = conversationHistory.filter(msg => msg.role === 'student')
    const tutorMessages = conversationHistory.filter(msg => msg.role === 'tutor')

    // Analyze question frequency
    const studentQuestions = studentMessages.filter(msg => 
      msg.content.includes('?') || msg.metadata.messageType === 'question'
    ).length

    // Analyze response quality (simple heuristic)
    const substantiveResponses = studentMessages.filter(msg => 
      msg.content.length > 30 && !['yes', 'no', 'ok', 'sure'].includes(msg.content.toLowerCase().trim())
    ).length

    // Analyze tutor message types
    const tutorMessageTypes = tutorMessages.reduce((acc, msg) => {
      const type = msg.metadata.messageType
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      studentQuestions,
      substantiveResponses,
      questioningRate: studentMessages.length > 0 ? studentQuestions / studentMessages.length : 0,
      responseQuality: studentMessages.length > 0 ? substantiveResponses / studentMessages.length : 0,
      tutorMessageTypes,
      totalExchanges: Math.min(studentMessages.length, tutorMessages.length)
    }
  }, [conversationHistory])

  const getLearningProgress = useCallback(() => {
    if (conversationHistory.length === 0) return null

    // Track understanding progression through confidence levels
    const messagesWithConfidence = conversationHistory.filter(msg => 
      msg.metadata.confidence !== undefined
    )

    const confidenceProgression = messagesWithConfidence.map((msg, index) => ({
      messageIndex: index,
      confidence: msg.metadata.confidence,
      timestamp: msg.timestamp
    }))

    // Calculate trend
    const recentMessages = confidenceProgression.slice(-5) // Last 5 messages
    const trend = recentMessages.length >= 2 
      ? recentMessages[recentMessages.length - 1].confidence - recentMessages[0].confidence
      : 0

    return {
      confidenceProgression,
      currentConfidence: confidenceProgression[confidenceProgression.length - 1]?.confidence || 0,
      confidenceTrend: trend,
      improvementDirection: trend > 0.1 ? 'improving' : trend < -0.1 ? 'declining' : 'stable'
    }
  }, [conversationHistory])

  return {
    getMessagePatterns,
    getLearningProgress
  }
}
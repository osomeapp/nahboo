'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type PeerMatchingRequest,
  type PeerMatch,
  type CollaborativeSession,
  type LearnerPeerProfile
} from '@/lib/ai-peer-matching-system'

interface PeerMatchingState {
  availableMatches: PeerMatch[]
  currentSession: CollaborativeSession | null
  collaborationHistory: any[]
  peerProfile: LearnerPeerProfile | null
  matchingAnalytics: any | null
  sessionMonitoring: any | null
  peerRecommendations: any | null
  isSearchingMatches: boolean
  isCreatingSession: boolean
  isMonitoringSession: boolean
  isAnalyzing: boolean
  isUpdatingProfile: boolean
  error: string | null
  lastMatchingRequest: PeerMatchingRequest | null
  activeIssues: any[]
  sessionFeedback: any[]
}

interface MatchingProgress {
  stage: 'analyzing_profile' | 'finding_candidates' | 'calculating_compatibility' | 'generating_recommendations' | 'complete'
  progress_percentage: number
  current_activity: string
  candidates_found: number
  compatibility_calculations: number
  estimated_completion_time: number
}

interface SessionCreationParams {
  match_id: string
  session_preferences: {
    activity_type: string
    duration_minutes: number
    subject_focus: string[]
    learning_objectives: string[]
    session_format: 'structured' | 'flexible' | 'guided'
  }
  participant_preferences: {
    communication_style: 'formal' | 'casual' | 'mixed'
    feedback_frequency: 'real_time' | 'periodic' | 'end_session'
    break_preferences: 'scheduled' | 'flexible' | 'minimal'
  }
}

interface ProfileUpdateParams {
  learning_preferences: {
    collaboration_style: string
    group_size_preference: string
    communication_style: string
    feedback_preference: string
  }
  availability_updates: {
    time_zones: string[]
    preferred_hours: string[]
    days_available: string[]
    session_duration_preference: number
  }
  goal_updates: {
    primary_subjects: string[]
    learning_goals: string[]
    skill_development_areas: string[]
  }
  experience_updates: {
    collaboration_experience: string
    teaching_experience: string
    learning_challenges: string[]
  }
}

// Main hook for AI peer matching system
export function useAIPeerMatching() {
  const [state, setState] = useState<PeerMatchingState>({
    availableMatches: [],
    currentSession: null,
    collaborationHistory: [],
    peerProfile: null,
    matchingAnalytics: null,
    sessionMonitoring: null,
    peerRecommendations: null,
    isSearchingMatches: false,
    isCreatingSession: false,
    isMonitoringSession: false,
    isAnalyzing: false,
    isUpdatingProfile: false,
    error: null,
    lastMatchingRequest: null,
    activeIssues: [],
    sessionFeedback: []
  })

  const matchingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Search for peer matches
  const searchPeerMatches = useCallback(async (request: PeerMatchingRequest) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSearchingMatches: true, 
        error: null,
        lastMatchingRequest: request
      }))
      
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find_peer_matches',
          matching_request: request
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to search peer matches: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search peer matches')
      }

      setState(prev => ({
        ...prev,
        availableMatches: data.peer_matches,
        isSearchingMatches: false
      }))

      return data.peer_matches
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSearchingMatches: false,
        error: error instanceof Error ? error.message : 'Failed to search peer matches'
      }))
      throw error
    }
  }, [])

  // Search with progress tracking
  const searchPeerMatchesWithProgress = useCallback(async (
    request: PeerMatchingRequest,
    progressCallback?: (progress: MatchingProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSearchingMatches: true, 
        error: null,
        lastMatchingRequest: request
      }))

      // Simulate progress updates during matching
      const simulateProgress = () => {
        const stages: MatchingProgress['stage'][] = [
          'analyzing_profile', 'finding_candidates', 'calculating_compatibility', 'generating_recommendations', 'complete'
        ]
        
        let currentStage = 0
        const totalStages = stages.length
        
        const updateProgress = () => {
          if (currentStage < totalStages) {
            const progress: MatchingProgress = {
              stage: stages[currentStage],
              progress_percentage: Math.floor((currentStage / totalStages) * 100),
              current_activity: getMatchingStageDescription(stages[currentStage]),
              candidates_found: currentStage >= 1 ? Math.floor(Math.random() * 20) + 5 : 0,
              compatibility_calculations: currentStage >= 2 ? Math.floor(Math.random() * 50) + 10 : 0,
              estimated_completion_time: (totalStages - currentStage) * 8000 // 8 seconds per stage
            }
            
            progressCallback?.(progress)
            currentStage++
            
            if (currentStage < totalStages) {
              setTimeout(updateProgress, 6000 + Math.random() * 4000) // 6-10 seconds per stage
            }
          }
        }
        
        updateProgress()
      }

      // Start progress simulation
      if (progressCallback) {
        simulateProgress()
      }

      // Actual matching search
      const result = await searchPeerMatches(request)
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress_percentage: 100,
          current_activity: 'Peer matching completed successfully',
          candidates_found: result.length * 3, // Assume we found more candidates than matches
          compatibility_calculations: result.length * 5,
          estimated_completion_time: 0
        })
      }

      return result

    } catch (error) {
      setState(prev => ({
        ...prev,
        isSearchingMatches: false,
        error: error instanceof Error ? error.message : 'Failed to search peer matches'
      }))
      throw error
    }
  }, [searchPeerMatches])

  // Create collaborative session
  const createCollaborativeSession = useCallback(async (params: SessionCreationParams) => {
    try {
      setState(prev => ({ ...prev, isCreatingSession: true, error: null }))
      
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_collaborative_session',
          match_id: params.match_id,
          session_preferences: params.session_preferences
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create collaborative session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create collaborative session')
      }

      setState(prev => ({
        ...prev,
        currentSession: data.collaborative_session,
        isCreatingSession: false
      }))

      // Start session monitoring
      startSessionMonitoring(data.collaborative_session.session_id)

      return data.collaborative_session
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCreatingSession: false,
        error: error instanceof Error ? error.message : 'Failed to create collaborative session'
      }))
      throw error
    }
  }, [])

  // Start session monitoring
  const startSessionMonitoring = useCallback((sessionId: string) => {
    // Clear existing monitoring
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current)
    }

    setState(prev => ({ ...prev, isMonitoringSession: true }))

    // Monitor session every 30 seconds
    monitoringIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/peer-matching', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'monitor_session',
            session_id: sessionId
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            setState(prev => ({
              ...prev,
              sessionMonitoring: data.monitoring_result
            }))
          }
        }
      } catch (error) {
        console.error('Error monitoring session:', error)
      }
    }, 30000) // 30 seconds
  }, [])

  // Stop session monitoring
  const stopSessionMonitoring = useCallback(() => {
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current)
      monitoringIntervalRef.current = null
    }
    
    setState(prev => ({ ...prev, isMonitoringSession: false, sessionMonitoring: null }))
  }, [])

  // End collaborative session
  const endCollaborativeSession = useCallback(async (sessionId: string) => {
    try {
      // Stop monitoring first
      stopSessionMonitoring()
      
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_session',
          session_id: sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to end session')
      }

      setState(prev => ({
        ...prev,
        currentSession: null,
        sessionMonitoring: null
      }))

      // Refresh collaboration history
      await loadCollaborationHistory()

      return data.session_analysis
    } catch (error) {
      console.error('Error ending session:', error)
      throw error
    }
  }, [stopSessionMonitoring])

  // Update peer profile
  const updatePeerProfile = useCallback(async (updates: ProfileUpdateParams) => {
    try {
      setState(prev => ({ ...prev, isUpdatingProfile: true, error: null }))
      
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_peer_profile',
          user_id: 'current_user', // Would be dynamic in real implementation
          profile_updates: updates
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setState(prev => ({
        ...prev,
        peerProfile: data.updated_profile,
        isUpdatingProfile: false
      }))

      return data.updated_profile
    } catch (error) {
      setState(prev => ({
        ...prev,
        isUpdatingProfile: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      }))
      throw error
    }
  }, [])

  // Load collaboration history
  const loadCollaborationHistory = useCallback(async (limit: number = 20) => {
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_collaboration_history',
          user_id: 'current_user', // Would be dynamic in real implementation
          limit
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            collaborationHistory: data.collaboration_history
          }))
        }
      }
    } catch (error) {
      console.error('Error loading collaboration history:', error)
    }
  }, [])

  // Get matching analytics
  const getMatchingAnalytics = useCallback(async (timeRange: string = '30_days') => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true }))
      
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_matching_analytics',
          user_id: 'current_user', // Would be dynamic in real implementation
          time_range: timeRange
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            matchingAnalytics: data.matching_analytics,
            isAnalyzing: false
          }))
          
          return data.matching_analytics
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false
      }))
      console.error('Error getting matching analytics:', error)
    }
  }, [])

  // Report session issue
  const reportSessionIssue = useCallback(async (
    sessionId: string,
    issueType: string,
    description: string,
    severity: string = 'medium'
  ) => {
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_session_issue',
          session_id: sessionId,
          issue_type: issueType,
          description,
          severity,
          reporter_id: 'current_user'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            activeIssues: [...prev.activeIssues, data.issue_report]
          }))
          
          return data.issue_report
        }
      }
    } catch (error) {
      console.error('Error reporting session issue:', error)
      throw error
    }
  }, [])

  // Provide session feedback
  const provideSessionFeedback = useCallback(async (
    sessionId: string,
    feedbackData: any
  ) => {
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'provide_session_feedback',
          session_id: sessionId,
          feedback_data: feedbackData,
          participant_id: 'current_user'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            sessionFeedback: [...prev.sessionFeedback, data.feedback_record]
          }))
          
          return data.feedback_record
        }
      }
    } catch (error) {
      console.error('Error providing session feedback:', error)
      throw error
    }
  }, [])

  // Get peer recommendations
  const getPeerRecommendations = useCallback(async (recommendationType: string = 'all') => {
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_peer_recommendations',
          user_id: 'current_user',
          recommendation_type: recommendationType
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            peerRecommendations: data.recommendations
          }))
          
          return data.recommendations
        }
      }
    } catch (error) {
      console.error('Error getting peer recommendations:', error)
    }
  }, [])

  // Auto-load initial data
  useEffect(() => {
    loadCollaborationHistory()
    getPeerRecommendations()
  }, [loadCollaborationHistory, getPeerRecommendations])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (matchingTimeoutRef.current) {
        clearTimeout(matchingTimeoutRef.current)
      }
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
      }
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear matches
  const clearMatches = useCallback(() => {
    setState(prev => ({ ...prev, availableMatches: [], lastMatchingRequest: null }))
  }, [])

  // Reset state
  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      availableMatches: [],
      currentSession: null,
      sessionMonitoring: null,
      error: null,
      lastMatchingRequest: null,
      activeIssues: [],
      sessionFeedback: []
    }))
  }, [])

  return {
    // State
    availableMatches: state.availableMatches,
    currentSession: state.currentSession,
    collaborationHistory: state.collaborationHistory,
    peerProfile: state.peerProfile,
    matchingAnalytics: state.matchingAnalytics,
    sessionMonitoring: state.sessionMonitoring,
    peerRecommendations: state.peerRecommendations,
    isSearchingMatches: state.isSearchingMatches,
    isCreatingSession: state.isCreatingSession,
    isMonitoringSession: state.isMonitoringSession,
    isAnalyzing: state.isAnalyzing,
    isUpdatingProfile: state.isUpdatingProfile,
    error: state.error,
    lastMatchingRequest: state.lastMatchingRequest,
    activeIssues: state.activeIssues,
    sessionFeedback: state.sessionFeedback,
    
    // Actions
    searchPeerMatches,
    searchPeerMatchesWithProgress,
    createCollaborativeSession,
    endCollaborativeSession,
    updatePeerProfile,
    loadCollaborationHistory,
    getMatchingAnalytics,
    reportSessionIssue,
    provideSessionFeedback,
    getPeerRecommendations,
    startSessionMonitoring,
    stopSessionMonitoring,
    clearError,
    clearMatches,
    resetState,
    
    // Computed state
    hasMatches: state.availableMatches.length > 0,
    hasActiveSession: !!state.currentSession,
    hasCollaborationHistory: state.collaborationHistory.length > 0,
    hasAnalytics: !!state.matchingAnalytics,
    hasRecommendations: !!state.peerRecommendations,
    matchCount: state.availableMatches.length,
    historyCount: state.collaborationHistory.length,
    activeIssueCount: state.activeIssues.length,
    isProcessing: state.isSearchingMatches || state.isCreatingSession || state.isAnalyzing || state.isUpdatingProfile,
    
    // Session analytics
    sessionStatus: state.currentSession ? 'active' : 'none',
    sessionDuration: state.currentSession ? calculateSessionDuration(state.currentSession) : 0,
    participantCount: state.currentSession ? state.currentSession.participants.length : 0,
    
    // Matching insights
    matchingInsights: state.availableMatches.length > 0 ? {
      bestMatchScore: Math.max(...state.availableMatches.map(m => m.matching_confidence)),
      averageCompatibility: state.availableMatches.reduce((sum, m) => sum + m.matching_confidence, 0) / state.availableMatches.length,
      compatibilityRange: {
        min: Math.min(...state.availableMatches.map(m => m.matching_confidence)),
        max: Math.max(...state.availableMatches.map(m => m.matching_confidence))
      },
      recommendedMatch: state.availableMatches[0] // Highest scoring match
    } : null,
    
    // Analytics insights
    analyticsInsights: state.matchingAnalytics ? {
      collaborationTrend: state.matchingAnalytics.collaboration_effectiveness > 7 ? 'positive' : 'needs_improvement',
      successRate: state.matchingAnalytics.matching_success_rate,
      learningProgress: state.matchingAnalytics.learning_outcomes?.overall_progress || 0,
      networkSize: state.matchingAnalytics.peer_network?.total_connections || 0
    } : null,
    
    // Session monitoring insights
    monitoringInsights: state.sessionMonitoring ? {
      sessionHealth: determineSessionHealth(state.sessionMonitoring),
      issueCount: state.sessionMonitoring.issues?.length || 0,
      adaptationCount: state.sessionMonitoring.adaptations?.length || 0,
      recommendationCount: state.sessionMonitoring.recommendations?.length || 0
    } : null
  }
}

// Hook for peer profile management
export function usePeerProfileManagement() {
  const [profile, setProfile] = useState<LearnerPeerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const updateProfile = useCallback((updates: Partial<LearnerPeerProfile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null)
    setIsDirty(true)
  }, [])

  const saveProfile = useCallback(async () => {
    if (!profile || !isDirty) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_peer_profile',
          user_id: profile.user_id,
          profile_updates: profile
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setProfile(data.updated_profile)
          setIsDirty(false)
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [profile, isDirty])

  const resetProfile = useCallback(() => {
    setIsDirty(false)
    // Reset to last saved state - would need to fetch from server
  }, [])

  return {
    profile,
    isLoading,
    isDirty,
    updateProfile,
    saveProfile,
    resetProfile,
    hasProfile: !!profile,
    canSave: isDirty && !isLoading
  }
}

// Hook for session management
export function useSessionManagement() {
  const [sessions, setSessions] = useState<CollaborativeSession[]>([])
  const [activeSession, setActiveSession] = useState<CollaborativeSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const createSession = useCallback(async (params: SessionCreationParams) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_collaborative_session',
          match_id: params.match_id,
          session_preferences: params.session_preferences
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const newSession = data.collaborative_session
          setSessions(prev => [newSession, ...prev])
          setActiveSession(newSession)
          return newSession
        }
      }
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const endSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/peer-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_session',
          session_id: sessionId
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSessions(prev => prev.map(s => 
            s.session_id === sessionId 
              ? { ...s, session_outcomes: { ...s.session_outcomes, completion_status: 'completed' } }
              : s
          ))
          setActiveSession(null)
          return data.session_analysis
        }
      }
    } catch (error) {
      console.error('Error ending session:', error)
      throw error
    }
  }, [])

  return {
    sessions,
    activeSession,
    isLoading,
    createSession,
    endSession,
    hasActiveSession: !!activeSession,
    sessionCount: sessions.length,
    completedSessions: sessions.filter(s => s.session_outcomes.completion_status === 'completed'),
    activeSessions: sessions.filter(s => s.session_outcomes.completion_status === 'in_progress')
  }
}

// Utility functions
function getMatchingStageDescription(stage: MatchingProgress['stage']): string {
  const descriptions: Record<MatchingProgress['stage'], string> = {
    analyzing_profile: 'Analyzing your learning profile and preferences',
    finding_candidates: 'Searching for compatible learning partners',
    calculating_compatibility: 'Calculating compatibility scores and analyzing fit',
    generating_recommendations: 'Generating personalized matching recommendations',
    complete: 'Peer matching completed successfully'
  }
  
  return descriptions[stage] || 'Processing matching request...'
}

function calculateSessionDuration(session: CollaborativeSession): number {
  const startTime = new Date(session.session_metadata.start_time).getTime()
  const now = Date.now()
  return Math.floor((now - startTime) / 1000 / 60) // Duration in minutes
}

function determineSessionHealth(monitoring: any): string {
  if (!monitoring) return 'unknown'
  
  const issueCount = monitoring.issues?.length || 0
  const status = monitoring.status
  
  if (status === 'excellent' && issueCount === 0) return 'excellent'
  if (status === 'good' && issueCount <= 1) return 'good'
  if (status === 'fair' || issueCount <= 3) return 'fair'
  return 'needs_attention'
}

export default useAIPeerMatching
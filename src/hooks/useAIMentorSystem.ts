'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  type LearnerMentorProfile,
  type MentorProfile,
  type MentorSpecialty,
  type SessionType,
  type MentorshipSession,
  type CareerGuidanceAnalysis,
  type LifeGuidanceAnalysis,
  type ProgressAssessment,
  type CrisisSupport,
  type MentorSystemAnalytics
} from '@/lib/ai-mentor-system'

interface AIMentorSystemState {
  currentMentorProfile: MentorProfile | null
  learnerProfile: LearnerMentorProfile | null
  activeSessions: MentorshipSession[]
  careerGuidance: CareerGuidanceAnalysis | null
  lifeGuidance: LifeGuidanceAnalysis | null
  progressAssessment: ProgressAssessment | null
  systemAnalytics: MentorSystemAnalytics | null
  mentorRecommendations: MentorRecommendation[]
  isCreatingMentor: boolean
  isGeneratingGuidance: boolean
  isConductingSession: boolean
  isProvidingSupport: boolean
  isLoadingAnalytics: boolean
  error: string | null
  lastSessionId: string | null
}

interface SessionProgress {
  stage: 'preparation' | 'introduction' | 'discussion' | 'planning' | 'wrap_up' | 'complete'
  progress_percentage: number
  current_activity: string
  estimated_completion_time: number
  session_quality?: number
  engagement_level?: number
}

interface CrisisAlert {
  alert_id: string
  learner_id: string
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detected_time: string
  status: 'active' | 'responding' | 'resolved'
  assigned_mentor?: string
  response_time?: number
}

// Main hook for AI mentor system
export function useAIMentorSystem() {
  const [state, setState] = useState<AIMentorSystemState>({
    currentMentorProfile: null,
    learnerProfile: null,
    activeSessions: [],
    careerGuidance: null,
    lifeGuidance: null,
    progressAssessment: null,
    systemAnalytics: null,
    mentorRecommendations: [],
    isCreatingMentor: false,
    isGeneratingGuidance: false,
    isConductingSession: false,
    isProvidingSupport: false,
    isLoadingAnalytics: false,
    error: null,
    lastSessionId: null
  })

  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const crisisMonitorRef = useRef<NodeJS.Timeout | null>(null)

  // Create mentor profile
  const createMentorProfile = useCallback(async (
    specialty: MentorSpecialty,
    learnerProfile: LearnerMentorProfile
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isCreatingMentor: true, 
        error: null,
        learnerProfile
      }))
      
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_mentor_profile',
          specialty,
          learner_profile: learnerProfile
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create mentor profile: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create mentor profile')
      }

      setState(prev => ({
        ...prev,
        currentMentorProfile: data.mentor_profile,
        isCreatingMentor: false
      }))

      return data.mentor_profile
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCreatingMentor: false,
        error: error instanceof Error ? error.message : 'Failed to create mentor profile'
      }))
      throw error
    }
  }, [])

  // Generate career guidance
  const generateCareerGuidance = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGeneratingGuidance: true, 
        error: null 
      }))
      
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_career_guidance',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate career guidance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate career guidance')
      }

      setState(prev => ({
        ...prev,
        careerGuidance: data.career_guidance,
        isGeneratingGuidance: false
      }))

      return data.career_guidance
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingGuidance: false,
        error: error instanceof Error ? error.message : 'Failed to generate career guidance'
      }))
      throw error
    }
  }, [])

  // Generate life guidance
  const generateLifeGuidance = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGeneratingGuidance: true, 
        error: null 
      }))
      
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_life_guidance',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate life guidance: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate life guidance')
      }

      setState(prev => ({
        ...prev,
        lifeGuidance: data.life_guidance,
        isGeneratingGuidance: false
      }))

      return data.life_guidance
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGeneratingGuidance: false,
        error: error instanceof Error ? error.message : 'Failed to generate life guidance'
      }))
      throw error
    }
  }, [])

  // Conduct mentorship session
  const conductMentorshipSession = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile,
    sessionType: SessionType,
    sessionGoal: string,
    conversationHistory: any[] = []
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isConductingSession: true, 
        error: null 
      }))
      
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'conduct_mentorship_session',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile,
          session_type: sessionType,
          session_goal: sessionGoal,
          conversation_history: conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to conduct mentorship session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to conduct mentorship session')
      }

      setState(prev => ({
        ...prev,
        activeSessions: [data.mentorship_session, ...prev.activeSessions.slice(0, 9)], // Keep last 10
        isConductingSession: false,
        lastSessionId: data.mentorship_session.session_id
      }))

      return data.mentorship_session
    } catch (error) {
      setState(prev => ({
        ...prev,
        isConductingSession: false,
        error: error instanceof Error ? error.message : 'Failed to conduct mentorship session'
      }))
      throw error
    }
  }, [])

  // Conduct session with progress tracking
  const conductSessionWithProgress = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile,
    sessionType: SessionType,
    sessionGoal: string,
    progressCallback?: (progress: SessionProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isConductingSession: true, 
        error: null 
      }))

      // Simulate progress updates during session
      const simulateProgress = () => {
        const stages: SessionProgress['stage'][] = [
          'preparation', 'introduction', 'discussion', 'planning', 'wrap_up', 'complete'
        ]
        
        let currentStage = 0
        const totalStages = stages.length
        
        const updateProgress = () => {
          if (currentStage < totalStages) {
            const progress: SessionProgress = {
              stage: stages[currentStage],
              progress_percentage: Math.floor((currentStage / totalStages) * 100),
              current_activity: getSessionStageDescription(stages[currentStage]),
              estimated_completion_time: (totalStages - currentStage) * 8000, // 8 seconds per stage
              session_quality: currentStage >= 2 ? 8.5 + Math.random() * 1.5 : undefined,
              engagement_level: currentStage >= 1 ? 7 + Math.random() * 2 : undefined
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

      // Actual session conduction
      const result = await conductMentorshipSession(
        learnerProfile, 
        mentorProfile, 
        sessionType, 
        sessionGoal
      )
      
      // Final progress update
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress_percentage: 100,
          current_activity: 'Session completed successfully',
          estimated_completion_time: 0,
          session_quality: 8.8,
          engagement_level: 9.2
        })
      }

      return result

    } catch (error) {
      setState(prev => ({
        ...prev,
        isConductingSession: false,
        error: error instanceof Error ? error.message : 'Failed to conduct mentorship session'
      }))
      throw error
    }
  }, [conductMentorshipSession])

  // Provide personalized advice
  const providePersonalizedAdvice = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile,
    specificQuestion: string,
    context?: string
  ) => {
    try {
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'provide_personalized_advice',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile,
          specific_question: specificQuestion,
          context
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to provide personalized advice: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to provide personalized advice')
      }

      return data.personalized_advice
    } catch (error) {
      console.error('Error providing personalized advice:', error)
      throw error
    }
  }, [])

  // Assess mentorship progress
  const assessMentorshipProgress = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile,
    sessionHistory: MentorshipSession[]
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoadingAnalytics: true, 
        error: null 
      }))
      
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_mentorship_progress',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile,
          session_history: sessionHistory
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to assess progress: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to assess mentorship progress')
      }

      setState(prev => ({
        ...prev,
        progressAssessment: data.progress_assessment,
        isLoadingAnalytics: false
      }))

      return data.progress_assessment
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingAnalytics: false,
        error: error instanceof Error ? error.message : 'Failed to assess mentorship progress'
      }))
      throw error
    }
  }, [])

  // Provide crisis support
  const provideCrisisSupport = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile,
    crisisDescription: string,
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isProvidingSupport: true, 
        error: null 
      }))
      
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'provide_crisis_support',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile,
          crisis_description: crisisDescription,
          urgency_level: urgencyLevel
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to provide crisis support: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to provide crisis support')
      }

      setState(prev => ({
        ...prev,
        isProvidingSupport: false
      }))

      return data.crisis_support
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProvidingSupport: false,
        error: error instanceof Error ? error.message : 'Failed to provide crisis support'
      }))
      throw error
    }
  }, [])

  // Load system analytics
  const loadSystemAnalytics = useCallback(async () => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoadingAnalytics: true 
      }))
      
      const response = await fetch('/api/ai-mentor', {
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
            systemAnalytics: data.system_analytics,
            isLoadingAnalytics: false
          }))
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoadingAnalytics: false
      }))
      console.error('Error loading system analytics:', error)
    }
  }, [])

  // Get mentor recommendations
  const getMentorRecommendations = useCallback(async (learnerProfile: LearnerMentorProfile) => {
    try {
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_mentor_recommendations',
          learner_profile: learnerProfile
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            mentorRecommendations: data.mentor_recommendations
          }))
          
          return data.mentor_recommendations
        }
      }
    } catch (error) {
      console.error('Error getting mentor recommendations:', error)
    }
    return []
  }, [])

  // Schedule session
  const scheduleSession = useCallback(async (
    learnerProfile: LearnerMentorProfile,
    mentorProfile: MentorProfile,
    sessionType: SessionType,
    preferredTime?: string
  ) => {
    try {
      const response = await fetch('/api/ai-mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_session',
          learner_profile: learnerProfile,
          mentor_profile: mentorProfile,
          session_type: sessionType,
          preferred_time: preferredTime
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            activeSessions: [data.mentorship_session, ...prev.activeSessions]
          }))
          
          return data.mentorship_session
        }
      }
    } catch (error) {
      console.error('Error scheduling session:', error)
    }
    return null
  }, [])

  // Auto-load analytics on mount
  useEffect(() => {
    loadSystemAnalytics()
  }, [loadSystemAnalytics])

  // Auto-refresh analytics every 5 minutes
  useEffect(() => {
    const interval = setInterval(loadSystemAnalytics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadSystemAnalytics])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear current mentor
  const clearMentor = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentMentorProfile: null,
      careerGuidance: null,
      lifeGuidance: null
    }))
  }, [])

  // Update learner profile
  const updateLearnerProfile = useCallback((updates: Partial<LearnerMentorProfile>) => {
    setState(prev => ({
      ...prev,
      learnerProfile: prev.learnerProfile ? {
        ...prev.learnerProfile,
        ...updates
      } : null
    }))
  }, [])

  return {
    // State
    currentMentorProfile: state.currentMentorProfile,
    learnerProfile: state.learnerProfile,
    activeSessions: state.activeSessions,
    careerGuidance: state.careerGuidance,
    lifeGuidance: state.lifeGuidance,
    progressAssessment: state.progressAssessment,
    systemAnalytics: state.systemAnalytics,
    mentorRecommendations: state.mentorRecommendations,
    isCreatingMentor: state.isCreatingMentor,
    isGeneratingGuidance: state.isGeneratingGuidance,
    isConductingSession: state.isConductingSession,
    isProvidingSupport: state.isProvidingSupport,
    isLoadingAnalytics: state.isLoadingAnalytics,
    error: state.error,
    lastSessionId: state.lastSessionId,
    
    // Actions
    createMentorProfile,
    generateCareerGuidance,
    generateLifeGuidance,
    conductMentorshipSession,
    conductSessionWithProgress,
    providePersonalizedAdvice,
    assessMentorshipProgress,
    provideCrisisSupport,
    loadSystemAnalytics,
    getMentorRecommendations,
    scheduleSession,
    clearError,
    clearMentor,
    updateLearnerProfile,
    
    // Computed state
    hasMentorProfile: !!state.currentMentorProfile,
    hasLearnerProfile: !!state.learnerProfile,
    hasCareerGuidance: !!state.careerGuidance,
    hasLifeGuidance: !!state.lifeGuidance,
    hasProgressAssessment: !!state.progressAssessment,
    hasSystemAnalytics: !!state.systemAnalytics,
    activeSessionCount: state.activeSessions.length,
    recommendationCount: state.mentorRecommendations.length,
    isProcessing: state.isCreatingMentor || state.isGeneratingGuidance || state.isConductingSession || state.isProvidingSupport,
    
    // Mentor analytics
    mentorEffectiveness: state.currentMentorProfile ? {
      specialty: state.currentMentorProfile.specialty,
      experience: state.currentMentorProfile.experience_level.years_of_experience,
      satisfaction: state.currentMentorProfile.experience_level.client_satisfaction_rating,
      communicationStyle: state.currentMentorProfile.communication_style.formality_level
    } : null,
    
    // Session analytics
    recentSessionMetrics: state.activeSessions.length > 0 ? {
      averageQuality: state.activeSessions.reduce((sum, session) => 
        sum + session.session_metadata.session_quality_rating, 0) / state.activeSessions.length,
      averageEngagement: state.activeSessions.reduce((sum, session) => 
        sum + session.session_metadata.engagement_level, 0) / state.activeSessions.length,
      totalDuration: state.activeSessions.reduce((sum, session) => 
        sum + session.session_metadata.session_duration, 0),
      actionItemsCreated: state.activeSessions.reduce((sum, session) => 
        sum + session.action_items.length, 0)
    } : null,
    
    // Guidance quality indicators
    guidanceQuality: {
      careerGuidanceConfidence: state.careerGuidance?.confidence_metrics?.overall_confidence || 0,
      careerRecommendationCount: state.careerGuidance?.personalized_recommendations?.length || 0,
      lifeGuidanceCompleteness: state.lifeGuidance ? 
        (Object.keys(state.lifeGuidance).length / 8) : 0, // 8 expected fields
      progressTrackingDepth: state.progressAssessment?.goal_achievements?.length || 0
    }
  }
}

// Hook for crisis monitoring and alerts
export function useCrisisMonitoring() {
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [responseTeamStatus, setResponseTeamStatus] = useState<any>(null)

  const startCrisisMonitoring = useCallback(() => {
    setIsMonitoring(true)

    const simulateAlert = () => {
      // Simulate crisis alert detection
      if (Math.random() < 0.02) { // 2% chance per check
        const alert: CrisisAlert = {
          alert_id: `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          learner_id: `learner_${Math.random().toString(36).substr(2, 9)}`,
          urgency_level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          description: 'Automated detection of potential crisis situation',
          detected_time: new Date().toISOString(),
          status: 'active'
        }
        
        setCrisisAlerts(prev => [alert, ...prev.slice(0, 19)]) // Keep last 20
      }
    }

    const monitoringInterval = setInterval(simulateAlert, 30000) // Check every 30 seconds
    
    return () => {
      clearInterval(monitoringInterval)
      setIsMonitoring(false)
    }
  }, [])

  const respondToCrisis = useCallback(async (alertId: string, mentorId: string) => {
    setCrisisAlerts(prev => prev.map(alert => 
      alert.alert_id === alertId 
        ? { ...alert, status: 'responding', assigned_mentor: mentorId }
        : alert
    ))
    
    // Simulate response time
    setTimeout(() => {
      setCrisisAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { ...alert, status: 'resolved', response_time: 15 } // 15 minutes
          : alert
      ))
    }, 3000)
  }, [])

  const dismissAlert = useCallback((alertId: string) => {
    setCrisisAlerts(prev => prev.filter(alert => alert.alert_id !== alertId))
  }, [])

  return {
    crisisAlerts,
    isMonitoring,
    responseTeamStatus,
    startCrisisMonitoring,
    respondToCrisis,
    dismissAlert,
    
    // Crisis metrics
    activeCrises: crisisAlerts.filter(alert => alert.status === 'active').length,
    criticalCrises: crisisAlerts.filter(alert => 
      alert.urgency_level === 'critical' && alert.status === 'active').length,
    averageResponseTime: crisisAlerts
      .filter(alert => alert.response_time)
      .reduce((sum, alert) => sum + (alert.response_time || 0), 0) / 
      crisisAlerts.filter(alert => alert.response_time).length || 0,
    resolutionRate: crisisAlerts.length > 0 ? 
      crisisAlerts.filter(alert => alert.status === 'resolved').length / crisisAlerts.length : 0
  }
}

// Hook for mentor performance tracking
export function useMentorPerformance(mentorId?: string) {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadPerformanceData = useCallback(async () => {
    if (!mentorId) return
    
    try {
      setIsLoading(true)
      
      // Simulate performance data loading
      const mockData = {
        mentor_id: mentorId,
        performance_metrics: {
          session_count: 156,
          average_rating: 8.7,
          learner_satisfaction: 0.91,
          goal_achievement_rate: 0.78,
          crisis_response_success: 0.95,
          session_completion_rate: 0.89
        },
        specialization_effectiveness: {
          career_counseling: 0.87,
          life_coaching: 0.91,
          crisis_support: 0.95
        },
        recent_feedback: [
          'Excellent listener with practical advice',
          'Helped me navigate a difficult career transition',
          'Very supportive during a personal crisis'
        ],
        improvement_areas: [
          'Could provide more industry-specific examples',
          'Consider scheduling more frequent check-ins'
        ],
        achievement_highlights: [
          '95% crisis response success rate',
          'Helped 23 learners achieve career transitions',
          'Maintained 8.7+ average rating for 6 months'
        ]
      }
      
      setPerformanceData(mockData)
    } catch (error) {
      console.error('Error loading mentor performance data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [mentorId])

  useEffect(() => {
    loadPerformanceData()
  }, [loadPerformanceData])

  return {
    performanceData,
    isLoading,
    loadPerformanceData,
    
    // Computed metrics
    overallEffectiveness: performanceData?.performance_metrics?.average_rating || 0,
    sessionSuccessRate: performanceData?.performance_metrics?.session_completion_rate || 0,
    learnerSatisfaction: performanceData?.performance_metrics?.learner_satisfaction || 0,
    crisisResponseRate: performanceData?.performance_metrics?.crisis_response_success || 0,
    goalAchievementRate: performanceData?.performance_metrics?.goal_achievement_rate || 0
  }
}

// Utility function for session stage descriptions
function getSessionStageDescription(stage: SessionProgress['stage']): string {
  const descriptions: Record<SessionProgress['stage'], string> = {
    preparation: 'Preparing session materials and reviewing learner profile',
    introduction: 'Welcoming learner and establishing session goals',
    discussion: 'Engaging in main mentoring conversation and guidance',
    planning: 'Creating action items and next steps',
    wrap_up: 'Summarizing session insights and scheduling follow-up',
    complete: 'Session completed successfully'
  }
  
  return descriptions[stage] || 'Processing session...'
}

// Interface for mentor recommendations
interface MentorRecommendation {
  mentor_id: string
  name: string
  specialty: string
  match_score: number
  match_reasons: string[]
  experience_years: number
  success_rate: number
  availability: string
  communication_style: string
  languages: string[]
  specializations: string[]
  client_testimonials: string[]
}
// React hooks for use case-specific engagement and progress tracking
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import { 
  useCaseEngagementEngine,
  type EngagementMetrics,
  type UseCaseEngagementGoals,
  type EngagementContext,
  type EngagementAction,
  type ProgressTrackingConfig
} from '@/lib/use-case-engagement'

export interface UseCaseEngagementState {
  metrics: EngagementMetrics | null
  goals: UseCaseEngagementGoals | null
  activeActions: EngagementAction[]
  progressConfig: ProgressTrackingConfig | null
  isTracking: boolean
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
}

export interface InteractionData {
  contentId: string
  interactionType: 'view' | 'interact' | 'complete' | 'pause' | 'resume' | 'abandon'
  duration: number
  completionStatus: 'started' | 'in_progress' | 'completed' | 'abandoned'
  satisfactionRating?: number
  challengeLevel?: number
  metadata?: Record<string, any>
}

// Main hook for use case-specific engagement tracking
export function useUseCaseEngagement(
  userId: string,
  userProfile: UserProfile,
  context: EngagementContext
) {
  const [state, setState] = useState<UseCaseEngagementState>({
    metrics: null,
    goals: null,
    activeActions: [],
    progressConfig: null,
    isTracking: false,
    isLoading: false,
    error: null,
    lastUpdate: null
  })

  const trackingInterval = useRef<NodeJS.Timeout | null>(null)
  const sessionStartTime = useRef<Date | null>(null)

  // Initialize engagement tracking
  useEffect(() => {
    if (userId && userProfile) {
      initializeEngagementTracking()
    }
  }, [userId, userProfile.use_case])

  const initializeEngagementTracking = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Create progress tracking configuration
      const progressConfig = useCaseEngagementEngine.createProgressTrackingConfig(
        userProfile,
        context
      )

      setState(prev => ({
        ...prev,
        progressConfig,
        isTracking: true,
        isLoading: false,
        lastUpdate: new Date()
      }))

      // Start session tracking
      sessionStartTime.current = new Date()

      // Set up periodic engagement tracking
      if (progressConfig.reportingFrequency === 'real_time') {
        startRealTimeTracking()
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize tracking',
        isLoading: false
      }))
    }
  }, [userProfile, context])

  // Track user interaction with content
  const trackInteraction = useCallback(async (interaction: InteractionData) => {
    if (!state.isTracking) return

    try {
      const sessionDuration = sessionStartTime.current 
        ? Date.now() - sessionStartTime.current.getTime()
        : interaction.duration

      const metrics = await useCaseEngagementEngine.trackEngagement(
        userId,
        userProfile,
        {
          ...interaction,
          duration: sessionDuration
        },
        context
      )

      setState(prev => ({
        ...prev,
        metrics,
        lastUpdate: new Date()
      }))

    } catch (error) {
      console.error('Failed to track interaction:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Tracking failed'
      }))
    }
  }, [userId, userProfile, context, state.isTracking])

  // Generate engagement actions based on current metrics
  const generateEngagementActions = useCallback(async () => {
    if (!state.metrics) return []

    try {
      const actions = await useCaseEngagementEngine.generateEngagementActions(
        userId,
        userProfile,
        state.metrics,
        context
      )

      setState(prev => ({
        ...prev,
        activeActions: actions
      }))

      return actions
    } catch (error) {
      console.error('Failed to generate engagement actions:', error)
      return []
    }
  }, [userId, userProfile, context, state.metrics])

  // Execute an engagement action
  const executeEngagementAction = useCallback(async (
    actionId: string,
    userResponse?: 'accepted' | 'dismissed' | 'deferred'
  ) => {
    const action = state.activeActions.find(a => a.actionId === actionId)
    if (!action) return

    try {
      // Track action execution
      await trackInteraction({
        contentId: actionId,
        interactionType: 'interact',
        duration: 0,
        completionStatus: userResponse === 'accepted' ? 'completed' : 'abandoned',
        metadata: {
          actionType: action.actionType,
          userResponse,
          trigger: action.trigger
        }
      })

      // Remove executed action from active list
      setState(prev => ({
        ...prev,
        activeActions: prev.activeActions.filter(a => a.actionId !== actionId)
      }))

    } catch (error) {
      console.error('Failed to execute engagement action:', error)
    }
  }, [state.activeActions, trackInteraction])

  // Generate progress report
  const generateProgressReport = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'weekly'
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))

      const report = await useCaseEngagementEngine.generateProgressReport(
        userId,
        userProfile,
        context,
        timeframe
      )

      setState(prev => ({ ...prev, isLoading: false }))
      return report

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate report',
        isLoading: false
      }))
      return null
    }
  }, [userId, userProfile, context])

  // Start/stop tracking
  const startTracking = useCallback(() => {
    setState(prev => ({ ...prev, isTracking: true }))
    sessionStartTime.current = new Date()
    
    if (state.progressConfig?.reportingFrequency === 'real_time') {
      startRealTimeTracking()
    }
  }, [state.progressConfig])

  const stopTracking = useCallback(() => {
    setState(prev => ({ ...prev, isTracking: false }))
    
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current)
      trackingInterval.current = null
    }
  }, [])

  // Real-time tracking for intensive use cases
  const startRealTimeTracking = useCallback(() => {
    if (trackingInterval.current) return

    trackingInterval.current = setInterval(async () => {
      if (sessionStartTime.current && state.isTracking) {
        const sessionDuration = Date.now() - sessionStartTime.current.getTime()
        
        // Track periodic session data
        await trackInteraction({
          contentId: 'session_tracking',
          interactionType: 'view',
          duration: sessionDuration,
          completionStatus: 'in_progress'
        })

        // Generate actions if needed
        await generateEngagementActions()
      }
    }, 30000) // Every 30 seconds
  }, [state.isTracking, trackInteraction, generateEngagementActions])

  // Cleanup
  useEffect(() => {
    return () => {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current)
      }
    }
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    trackInteraction,
    generateEngagementActions,
    executeEngagementAction,
    generateProgressReport,
    startTracking,
    stopTracking,
    
    // Computed values
    isEngaged: state.metrics ? state.metrics.sessionDuration > 300000 : false, // 5+ minutes
    engagementLevel: state.metrics 
      ? (state.metrics.sessionDuration / 1800000) * 0.4 + // 30 min max
        state.metrics.contentCompletionRate * 0.3 +
        state.metrics.satisfactionScore * 0.3
      : 0,
    hasActiveActions: state.activeActions.length > 0,
    needsAttention: state.metrics 
      ? state.metrics.contentCompletionRate < 0.5 || 
        state.metrics.satisfactionScore < 0.4
      : false
  }
}

// Hook for progress tracking dashboard
export function useProgressDashboard(
  userId: string,
  userProfile: UserProfile,
  context: EngagementContext
) {
  const [dashboardData, setDashboardData] = useState<{
    weeklyReport: any
    monthlyReport: any
    achievements: any[]
    recommendations: string[]
    isLoading: boolean
    error: string | null
  }>({
    weeklyReport: null,
    monthlyReport: null,
    achievements: [],
    recommendations: [],
    isLoading: false,
    error: null
  })

  const engagement = useUseCaseEngagement(userId, userProfile, context)

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const [weeklyReport, monthlyReport] = await Promise.all([
        engagement.generateProgressReport('weekly'),
        engagement.generateProgressReport('monthly')
      ])

      // Generate achievements and recommendations
      const achievements = generateAchievements(weeklyReport, userProfile.use_case)
      const recommendations = generateRecommendations(weeklyReport, userProfile)

      setDashboardData({
        weeklyReport,
        monthlyReport,
        achievements,
        recommendations,
        isLoading: false,
        error: null
      })

    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
        isLoading: false
      }))
    }
  }, [engagement, userProfile])

  // Load data on mount and profile changes
  useEffect(() => {
    if (userId && userProfile) {
      loadDashboardData()
    }
  }, [userId, userProfile.use_case, loadDashboardData])

  return {
    ...dashboardData,
    refreshDashboard: loadDashboardData,
    engagement
  }
}

// Helper functions for dashboard
function generateAchievements(report: any, useCase: UserProfile['use_case']): any[] {
  if (!report) return []

  const achievements = []

  // Common achievements
  if (report.metrics?.engagement?.completionRate > 0.8) {
    achievements.push({
      id: 'high_completion',
      title: 'High Achiever',
      description: 'Completed over 80% of learning content',
      badgeIcon: '🏆',
      earnedDate: new Date()
    })
  }

  if (report.metrics?.progress?.learningStreak > 7) {
    achievements.push({
      id: 'consistency',
      title: 'Consistent Learner',
      description: `${report.metrics.progress.learningStreak} day learning streak`,
      badgeIcon: '🔥',
      earnedDate: new Date()
    })
  }

  // Use case-specific achievements
  switch (useCase) {
    case 'work':
      if (report.corporate?.competenciesAchieved?.length > 2) {
        achievements.push({
          id: 'competency_master',
          title: 'Competency Master',
          description: 'Achieved multiple competencies',
          badgeIcon: '💼',
          earnedDate: new Date()
        })
      }
      break

    case 'student':
      if (report.academic?.gradeImprovement) {
        achievements.push({
          id: 'grade_improvement',
          title: 'Academic Progress',
          description: 'Improved academic performance',
          badgeIcon: '📚',
          earnedDate: new Date()
        })
      }
      break

    case 'college':
      if (report.academic?.researchMilestones?.milestones > 0) {
        achievements.push({
          id: 'research_milestone',
          title: 'Research Pioneer',
          description: 'Achieved research milestones',
          badgeIcon: '🔬',
          earnedDate: new Date()
        })
      }
      break
  }

  return achievements
}

function generateRecommendations(report: any, userProfile: UserProfile): string[] {
  if (!report) return []

  const recommendations = []

  // Engagement-based recommendations
  if (report.metrics?.engagement?.sessionDuration < 600000) { // 10 minutes
    recommendations.push('Try setting aside more time for focused learning sessions')
  }

  if (report.metrics?.engagement?.completionRate < 0.6) {
    recommendations.push('Consider adjusting difficulty level for better content completion')
  }

  if (report.metrics?.engagement?.satisfactionScore < 0.6) {
    recommendations.push('Explore different content formats to find what works best for you')
  }

  // Use case-specific recommendations
  switch (userProfile.use_case) {
    case 'work':
      recommendations.push('Connect learning to current work projects for better application')
      break

    case 'student':
      recommendations.push('Regular study breaks can improve focus and retention')
      break

    case 'college':
      recommendations.push('Consider forming study groups for collaborative learning')
      break

    case 'personal':
    case 'lifelong':
      recommendations.push('Set personal learning goals to maintain motivation')
      break
  }

  return recommendations.slice(0, 3) // Limit to 3 recommendations
}
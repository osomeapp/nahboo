// React hooks for learning objective tracking and progress analytics
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile } from '@/types'
import type { 
  ObjectiveProgress,
  ProgressInsights,
  CompetencyMap,
  RetentionAnalytics,
  LearningVelocity,
  EvidencePoint
} from '@/lib/objective-tracking-engine'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'

export interface ProgressAnalyticsState {
  objectives: ObjectiveProgress[]
  activeObjectives: ObjectiveProgress[]
  completedObjectives: ObjectiveProgress[]
  insights: ProgressInsights | null
  competencyMap: CompetencyMap | null
  retentionAnalytics: RetentionAnalytics[]
  velocityAnalytics: LearningVelocity[]
  isLoading: boolean
  isTracking: boolean
  error: string | null
}

export interface AnalyticsFilters {
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  objectiveIds?: string[]
  skillFilter?: string[]
  subjectFilter?: string
  completionStatus?: 'all' | 'active' | 'completed'
}

export interface LearningActivity {
  objectiveId: string
  activityType: 'assessment' | 'practice' | 'review' | 'application'
  score?: number
  timeSpent: number
  contentId?: string
  skillsUsed?: string[]
  conceptsApplied?: string[]
  success: boolean
  evidence?: EvidencePoint[]
}

// Main progress analytics hook
export function useProgressAnalytics(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<ProgressAnalyticsState>({
    objectives: [],
    activeObjectives: [],
    completedObjectives: [],
    insights: null,
    competencyMap: null,
    retentionAnalytics: [],
    velocityAnalytics: [],
    isLoading: false,
    isTracking: false,
    error: null
  })

  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeframe: 'weekly',
    completionStatus: 'all'
  })

  // Auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize objective tracking
  const initializeObjectiveTracking = useCallback(async (objective: LearningObjective) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'initialize_tracking',
          objective
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize tracking: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize tracking')
      }

      // Refresh all progress data
      await refreshProgressData()

      return data.objectiveProgress
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [userId, userProfile])

  // Record learning activity
  const recordLearningActivity = useCallback(async (activity: LearningActivity) => {
    setState(prev => ({ ...prev, isTracking: true, error: null }))

    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'record_activity',
          objectiveId: activity.objectiveId,
          activityData: activity
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to record activity: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to record activity')
      }

      // Update local state with new progress
      setState(prev => ({
        ...prev,
        objectives: prev.objectives.map(obj => 
          obj.objectiveId === activity.objectiveId ? data.updatedProgress : obj
        ),
        isTracking: false
      }))

      // Show achievements if any
      if (data.newAchievements && data.newAchievements.length > 0) {
        console.log('New achievements:', data.newAchievements)
        // Could trigger a notification system here
      }

      return {
        updatedProgress: data.updatedProgress,
        masteryLevelChange: data.masteryLevelChange,
        newAchievements: data.newAchievements
      }
    } catch (error) {
      setState(prev => ({ ...prev, isTracking: false }))
      console.error('Failed to record activity:', error)
      throw error
    }
  }, [userId, userProfile])

  // Get progress insights
  const getProgressInsights = useCallback(async (timeframe?: 'daily' | 'weekly' | 'monthly' | 'quarterly') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_insights',
          timeframe: timeframe || filters.timeframe
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get insights: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get insights')
      }

      setState(prev => ({
        ...prev,
        insights: data.progressInsights,
        isLoading: false
      }))

      return data.progressInsights
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [userId, userProfile, filters.timeframe])

  // Get competency map
  const getCompetencyMap = useCallback(async () => {
    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_competencies'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get competencies: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get competencies')
      }

      setState(prev => ({
        ...prev,
        competencyMap: data.competencyMap
      }))

      return data.competencyMap
    } catch (error) {
      console.error('Failed to get competency map:', error)
      throw error
    }
  }, [userId, userProfile])

  // Get specific analytics
  const getAnalytics = useCallback(async (analyticsType: 'retention' | 'velocity' | 'mastery' | 'competency') => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_analytics',
          analyticsType
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get analytics: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get analytics')
      }

      // Update state based on analytics type
      setState(prev => ({
        ...prev,
        retentionAnalytics: analyticsType === 'retention' ? data.analyticsData.retentionAnalytics || [] : prev.retentionAnalytics,
        velocityAnalytics: analyticsType === 'velocity' ? data.analyticsData.velocityAnalytics || [] : prev.velocityAnalytics,
        isLoading: false
      }))

      return data.analyticsData
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      console.error('Failed to get analytics:', error)
      throw error
    }
  }, [userId, userProfile])

  // Refresh all progress data
  const refreshProgressData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/progress-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_progress'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh progress: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to refresh progress')
      }

      setState(prev => ({
        ...prev,
        objectives: data.allProgress || [],
        activeObjectives: data.activeObjectives || [],
        completedObjectives: data.completedObjectives || [],
        isLoading: false
      }))

      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [userId, userProfile])

  // Start auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 60000) => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshProgressData().catch(console.error)
    }, intervalMs)
  }, [refreshProgressData])

  // Stop auto-refresh
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh()
    }
  }, [stopAutoRefresh])

  // Auto-load initial data
  useEffect(() => {
    if (userProfile && state.objectives.length === 0 && !state.isLoading) {
      refreshProgressData().catch(console.error)
    }
  }, [userProfile, state.objectives.length, state.isLoading, refreshProgressData])

  // Filter objectives based on current filters
  const filteredObjectives = state.objectives.filter(obj => {
    if (filters.objectiveIds && !filters.objectiveIds.includes(obj.objectiveId)) {
      return false
    }
    
    if (filters.completionStatus === 'active' && (!obj.isActive || obj.isCompleted)) {
      return false
    }
    
    if (filters.completionStatus === 'completed' && !obj.isCompleted) {
      return false
    }
    
    return true
  })

  return {
    // State
    ...state,
    filteredObjectives,
    filters,
    
    // Actions
    initializeObjectiveTracking,
    recordLearningActivity,
    getProgressInsights,
    getCompetencyMap,
    getAnalytics,
    refreshProgressData,
    startAutoRefresh,
    stopAutoRefresh,
    updateFilters,
    
    // Computed values
    hasObjectives: state.objectives.length > 0,
    hasActiveObjectives: state.activeObjectives.length > 0,
    hasCompletedObjectives: state.completedObjectives.length > 0,
    hasInsights: !!state.insights,
    
    // Helper functions
    getObjectiveById: useCallback((objectiveId: string) => {
      return state.objectives.find(obj => obj.objectiveId === objectiveId) || null
    }, [state.objectives]),
    
    getObjectiveProgress: useCallback((objectiveId: string) => {
      const objective = state.objectives.find(obj => obj.objectiveId === objectiveId)
      return objective ? objective.currentMasteryLevel : 0
    }, [state.objectives]),
    
    getCompletionRate: useCallback(() => {
      if (state.objectives.length === 0) return 0
      return state.completedObjectives.length / state.objectives.length
    }, [state.objectives.length, state.completedObjectives.length]),
    
    getAverageMasteryLevel: useCallback(() => {
      if (state.objectives.length === 0) return 0
      return state.objectives.reduce((sum, obj) => sum + obj.currentMasteryLevel, 0) / state.objectives.length
    }, [state.objectives])
  }
}

// Hook for objective-specific tracking
export function useObjectiveTracking(userId: string, objectiveId: string) {
  const [objective, setObjective] = useState<ObjectiveProgress | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recentActivities, setRecentActivities] = useState<LearningActivity[]>([])

  const recordActivity = useCallback(async (activity: Omit<LearningActivity, 'objectiveId'>) => {
    setIsRecording(true)
    
    try {
      const fullActivity: LearningActivity = { ...activity, objectiveId }
      
      // Would call the main analytics API here
      // For now, just add to recent activities
      setRecentActivities(prev => [fullActivity, ...prev.slice(0, 9)]) // Keep last 10
      
      setIsRecording(false)
      return true
    } catch (error) {
      setIsRecording(false)
      throw error
    }
  }, [objectiveId])

  const getMasteryProgress = useCallback(() => {
    if (!objective) return { current: 0, target: 1, percentage: 0 }
    
    return {
      current: objective.currentMasteryLevel,
      target: objective.targetMasteryLevel,
      percentage: (objective.currentMasteryLevel / objective.targetMasteryLevel) * 100
    }
  }, [objective])

  const getSkillProgress = useCallback(() => {
    if (!objective) return {}
    
    return Object.fromEntries(
      Object.entries(objective.skillProgression).map(([skill, progress]) => [
        skill,
        {
          current: progress.currentLevel,
          target: progress.targetLevel,
          practiceCount: progress.practiceCount,
          strengthAreas: progress.strengthAreas,
          improvementAreas: progress.improvementAreas
        }
      ])
    )
  }, [objective])

  return {
    objective,
    isRecording,
    recentActivities,
    recordActivity,
    getMasteryProgress,
    getSkillProgress,
    setObjective
  }
}

// Hook for retention analytics
export function useRetentionAnalytics(userId: string) {
  const [retentionData, setRetentionData] = useState<RetentionAnalytics[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeRetention = useCallback(async (objectiveIds?: string[]) => {
    setIsAnalyzing(true)
    
    try {
      // Would call analytics API
      // For now, return mock data
      const mockData: RetentionAnalytics[] = objectiveIds?.map(id => ({
        objectiveId: id,
        shortTermRetention: Math.random() * 0.3 + 0.7,
        mediumTermRetention: Math.random() * 0.4 + 0.5,
        longTermRetention: Math.random() * 0.5 + 0.3,
        forgettingCurve: [],
        strengthFactors: ['Regular practice'],
        weaknessFactors: ['Complex concepts'],
        optimalReviewSchedule: []
      })) || []
      
      setRetentionData(mockData)
      setIsAnalyzing(false)
      
      return mockData
    } catch (error) {
      setIsAnalyzing(false)
      throw error
    }
  }, [])

  const getOptimalReviewSchedule = useCallback(() => {
    return retentionData.flatMap(data => data.optimalReviewSchedule)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())
  }, [retentionData])

  const getRetentionTrends = useCallback(() => {
    if (retentionData.length === 0) return { improving: 0, stable: 0, declining: 0 }
    
    const trends = retentionData.map(data => {
      if (data.longTermRetention > data.mediumTermRetention) return 'improving'
      if (data.longTermRetention < data.shortTermRetention * 0.7) return 'declining'
      return 'stable'
    })
    
    return {
      improving: trends.filter(t => t === 'improving').length,
      stable: trends.filter(t => t === 'stable').length,
      declining: trends.filter(t => t === 'declining').length
    }
  }, [retentionData])

  return {
    retentionData,
    isAnalyzing,
    analyzeRetention,
    getOptimalReviewSchedule,
    getRetentionTrends
  }
}

// Hook for learning velocity analysis
export function useLearningVelocity(userId: string) {
  const [velocityData, setVelocityData] = useState<LearningVelocity[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeVelocity = useCallback(async (timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
    setIsAnalyzing(true)
    
    try {
      // Would call analytics API
      // For now, return mock data
      const mockData: LearningVelocity[] = [
        {
          objectiveId: 'sample_objective',
          overallVelocity: Math.random() * 2 + 0.5,
          masteryVelocity: Math.random() * 5 + 2,
          skillVelocity: { 'primary_skill': Math.random() * 3 + 1 },
          conceptVelocity: { 'main_concept': Math.random() * 4 + 1 },
          trend: 'stable',
          factors: [
            {
              factor: 'Learning style alignment',
              impact: 0.3,
              confidence: 0.8,
              description: 'Content matches learning preferences'
            }
          ]
        }
      ]
      
      setVelocityData(mockData)
      setIsAnalyzing(false)
      
      return mockData
    } catch (error) {
      setIsAnalyzing(false)
      throw error
    }
  }, [])

  const getVelocityTrends = useCallback(() => {
    if (velocityData.length === 0) return { accelerating: 0, stable: 0, decelerating: 0 }
    
    return velocityData.reduce((acc, data) => {
      acc[data.trend] = (acc[data.trend] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [velocityData])

  const getAverageVelocity = useCallback(() => {
    if (velocityData.length === 0) return 0
    return velocityData.reduce((sum, data) => sum + data.overallVelocity, 0) / velocityData.length
  }, [velocityData])

  return {
    velocityData,
    isAnalyzing,
    analyzeVelocity,
    getVelocityTrends,
    getAverageVelocity
  }
}
// React hooks for intelligent content recommendations and analytics
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  ContentRecommendation,
  RecommendationBatch,
  ContentInteraction,
  RecommendationAnalytics,
  RecommendationRequest,
  ContextualHint,
  SessionContext,
  RecommendationConstraints
} from '@/lib/content-recommendation-engine'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'
import type { ObjectiveProgress } from '@/lib/objective-tracking-engine'
import type { UserMasteryProfile } from '@/lib/mastery-progression-engine'
import { useMasteryProgression } from './useMasteryProgression'
import { useContentSafety } from './useContentSafety'

export interface RecommendationState {
  recommendations: ContentRecommendation[]
  currentBatch: RecommendationBatch | null
  fallbackRecommendations: ContentRecommendation[]
  analytics: RecommendationAnalytics | null
  isGenerating: boolean
  isRecordingInteraction: boolean
  isLoadingAnalytics: boolean
  error: string | null
}

export interface RecommendationFilters {
  contentTypes: string[]
  difficultyRange: { min: number; max: number }
  timeAvailable: number // minutes
  subject: string
  diversityLevel: number // 0-1
  showOnlyNew: boolean
  excludeCompleted: boolean
}

export interface RecommendationMetrics {
  totalRecommendations: number
  engagedRecommendations: number
  completedRecommendations: number
  averageEngagementScore: number
  diversityScore: number
  satisfactionScore: number
  discoveryRate: number
}

// Main content recommendations hook
export function useContentRecommendations(userId: string, userProfile: UserProfile) {
  // Get mastery progression data and content safety
  const masteryProgression = useMasteryProgression(userId, userProfile)
  const contentSafety = useContentSafety(userId, userProfile)
  const [state, setState] = useState<RecommendationState>({
    recommendations: [],
    currentBatch: null,
    fallbackRecommendations: [],
    analytics: null,
    isGenerating: false,
    isRecordingInteraction: false,
    isLoadingAnalytics: false,
    error: null
  })

  const [filters, setFilters] = useState<RecommendationFilters>({
    contentTypes: ['video', 'quiz', 'ai_lesson', 'interactive', 'link'],
    difficultyRange: { min: 1, max: 10 },
    timeAvailable: 30,
    subject: userProfile.subject || 'General',
    diversityLevel: 0.7,
    showOnlyNew: true,
    excludeCompleted: true
  })

  const [sessionContext, setSessionContext] = useState<SessionContext>({
    sessionStartTime: new Date(),
    timeAvailable: 30,
    deviceCapabilities: [],
    networkQuality: 'good',
    environmentContext: 'private',
    multitaskingLevel: 0.3
  })

  // Auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate content recommendations
  const generateRecommendations = useCallback(async (
    currentObjectives?: LearningObjective[],
    currentProgress?: ObjectiveProgress[],
    availableContent?: ContentItem[],
    constraints?: Partial<RecommendationConstraints>,
    contextualHints?: ContextualHint[]
  ) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const request: RecommendationRequest = {
        userId,
        userProfile,
        currentObjectives: currentObjectives || [],
        currentProgress: currentProgress || [],
        contextualHints: contextualHints || [],
        sessionContext,
        constraints: {
          contentTypes: filters.contentTypes,
          maxDifficulty: filters.difficultyRange.max,
          minDifficulty: filters.difficultyRange.min,
          maxDuration: filters.timeAvailable,
          ...constraints
        },
        count: 10,
        diversityFactor: filters.diversityLevel,
        // Include mastery progression data for progression-aware recommendations
        masteryProfile: masteryProgression.masteryProfile,
        targetSkills: masteryProgression.getUnlockedSkills().map(skill => skill.skillId).slice(0, 5),
        progressionPriority: masteryProgression.progressMetrics.pendingRecommendations > 3 ? 'mastery' : 'exploration'
      }

      const response = await fetch('/api/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'generate_recommendations',
          currentObjectives,
          currentProgress,
          availableContent,
          contextualHints,
          sessionContext,
          constraints: request.constraints,
          count: request.count,
          diversityFactor: request.diversityFactor,
          masteryProfile: request.masteryProfile,
          targetSkills: request.targetSkills,
          progressionPriority: request.progressionPriority
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate recommendations')
      }

      // Apply safety filtering to recommendations
      const safeRecommendations = await applySafetyFiltering(data.recommendations.recommendations)
      
      setState(prev => ({
        ...prev,
        recommendations: safeRecommendations,
        currentBatch: {
          ...data.recommendations,
          recommendations: safeRecommendations
        },
        fallbackRecommendations: data.recommendations.fallbackRecommendations,
        isGenerating: false
      }))

      return data.recommendations

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isGenerating: false }))
      throw error
    }
  }, [userId, userProfile, filters, sessionContext, masteryProgression.masteryProfile, masteryProgression.progressMetrics])

  // Apply safety filtering to recommendations
  const applySafetyFiltering = useCallback(async (recommendations: ContentRecommendation[]): Promise<ContentRecommendation[]> => {
    if (!contentSafety || recommendations.length === 0) {
      return recommendations
    }

    // Batch analyze content safety for all recommendations
    const contentItems = recommendations.map(rec => rec.content)
    await contentSafety.batchAnalyzeContent(contentItems)

    // Filter recommendations based on safety criteria
    const safeRecommendations = recommendations.filter(rec => {
      const classification = contentSafety.getClassification(rec.content.id)
      if (!classification) return false

      // Check if content meets safety standards for user
      const userAge = calculateUserAge(userProfile.age_group)
      const contentMinAge = parseAgeRating(classification.ageRating)
      
      // Age appropriateness check
      if (userAge < contentMinAge) return false
      
      // Safety level check
      if (classification.safetyLevel === 'blocked') return false
      if (classification.safetyLevel === 'restricted' && userProfile.age_group === 'child') return false
      
      // Educational value requirement for children
      if (userProfile.age_group === 'child' && classification.educationalValue < 0.7) return false
      
      return true
    })

    return safeRecommendations
  }, [contentSafety, userProfile.age_group])

  // Helper functions for safety filtering
  const calculateUserAge = (ageGroup: string): number => {
    const ageMap: Record<string, number> = { 'child': 8, 'teen': 15, 'adult': 25 }
    return ageMap[ageGroup] || 18
  }

  const parseAgeRating = (rating: string): number => {
    const match = rating.match(/(\d+)\+/)
    return match ? parseInt(match[1]) : 0
  }

  // Record interaction with recommended content
  const recordInteraction = useCallback(async (
    contentId: string,
    interactionType: ContentInteraction['interactionType'],
    additionalData: Partial<ContentInteraction> = {}
  ) => {
    setState(prev => ({ ...prev, isRecordingInteraction: true, error: null }))

    try {
      const interaction: ContentInteraction = {
        contentId,
        interactionType,
        timestamp: new Date(),
        duration: additionalData.duration || 0,
        engagementScore: additionalData.engagementScore || 0.5,
        completionRate: additionalData.completionRate || 0,
        qualityRating: additionalData.qualityRating,
        difficulty: additionalData.difficulty || 5,
        context: {
          sessionNumber: 1,
          timeOfDay: new Date().toLocaleTimeString(),
          deviceType: 'web',
          learningGoals: [],
          currentMood: additionalData.context?.currentMood,
          priorContent: [],
          adaptationsActive: [],
          ...additionalData.context
        }
      }

      const response = await fetch('/api/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'record_interaction',
          contentId,
          interaction
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to record interaction: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to record interaction')
      }

      setState(prev => ({ ...prev, isRecordingInteraction: false }))

      // Update recommendation scores if applicable
      if (interactionType === 'like' || interactionType === 'complete') {
        await refreshRecommendations()
      }

      return true

    } catch (error) {
      setState(prev => ({ ...prev, isRecordingInteraction: false }))
      console.error('Failed to record interaction:', error)
      throw error
    }
  }, [userId, userProfile])

  // Get recommendation analytics
  const getAnalytics = useCallback(async (timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly') => {
    setState(prev => ({ ...prev, isLoadingAnalytics: true, error: null }))

    try {
      const response = await fetch('/api/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_analytics',
          timeframe
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get analytics: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get analytics')
      }

      setState(prev => ({
        ...prev,
        analytics: data.analytics,
        isLoadingAnalytics: false
      }))

      return data.analytics

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoadingAnalytics: false }))
      throw error
    }
  }, [userId, userProfile])

  // Refresh recommendations
  const refreshRecommendations = useCallback(async () => {
    if (state.isGenerating) return

    try {
      await generateRecommendations()
    } catch (error) {
      console.error('Failed to refresh recommendations:', error)
    }
  }, [generateRecommendations, state.isGenerating])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<RecommendationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Update session context
  const updateSessionContext = useCallback((newContext: Partial<SessionContext>) => {
    setSessionContext(prev => ({ ...prev, ...newContext }))
  }, [])

  // Start auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 300000) => { // 5 minutes default
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshRecommendations().catch(console.error)
    }, intervalMs)
  }, [refreshRecommendations])

  // Stop auto-refresh
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  // Get content similarity
  const getContentSimilarity = useCallback(async (contentId1: string, contentId2: string) => {
    try {
      const response = await fetch('/api/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_similarity',
          contentId1,
          contentId2
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get similarity: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get similarity')
      }

      return data.similarity

    } catch (error) {
      console.error('Failed to get content similarity:', error)
      return 0
    }
  }, [userId, userProfile])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh()
    }
  }, [stopAutoRefresh])

  // Auto-load initial recommendations
  useEffect(() => {
    if (userProfile && state.recommendations.length === 0 && !state.isGenerating) {
      generateRecommendations().catch(console.error)
    }
  }, [userProfile, state.recommendations.length, state.isGenerating, generateRecommendations])

  // Filter recommendations based on current filters
  const filteredRecommendations = state.recommendations.filter(rec => {
    if (filters.contentTypes.length > 0 && !filters.contentTypes.includes(rec.content.type)) {
      return false
    }
    
    if (rec.content.difficulty < filters.difficultyRange.min || rec.content.difficulty > filters.difficultyRange.max) {
      return false
    }
    
    if (rec.content.estimatedTime > filters.timeAvailable) {
      return false
    }

    if (filters.subject !== 'All' && rec.content.subject !== filters.subject) {
      return false
    }
    
    return true
  })

  // Calculate metrics
  const metrics: RecommendationMetrics = {
    totalRecommendations: state.recommendations.length,
    engagedRecommendations: state.recommendations.filter(rec => rec.estimatedEngagement > 0.7).length,
    completedRecommendations: 0, // Would be calculated from interaction history
    averageEngagementScore: state.recommendations.length > 0 ? 
      state.recommendations.reduce((sum, rec) => sum + rec.estimatedEngagement, 0) / state.recommendations.length : 0,
    diversityScore: state.currentBatch?.diversityScore || 0,
    satisfactionScore: state.analytics?.satisfactionScore || 0,
    discoveryRate: state.analytics?.discoveryRate || 0
  }

  return {
    // State
    ...state,
    filteredRecommendations,
    filters,
    sessionContext,
    metrics,
    
    // Safety state
    contentSafety,
    safetyAnalytics: contentSafety?.analytics,
    
    // Actions
    generateRecommendations,
    recordInteraction,
    getAnalytics,
    refreshRecommendations,
    updateFilters,
    updateSessionContext,
    startAutoRefresh,
    stopAutoRefresh,
    getContentSimilarity,
    
    // Safety actions
    analyzeSafety: contentSafety?.analyzeContent,
    submitSafetyReport: contentSafety?.submitSafetyReport,
    filterContentBySafety: contentSafety?.filterContent,
    
    // Computed values
    hasRecommendations: state.recommendations.length > 0,
    hasBatch: !!state.currentBatch,
    hasAnalytics: !!state.analytics,
    isActive: state.recommendations.length > 0 || state.isGenerating,
    
    // Helper functions
    getRecommendationById: useCallback((contentId: string) => {
      return state.recommendations.find(rec => rec.contentId === contentId) || null
    }, [state.recommendations]),
    
    getRecommendationsByType: useCallback((type: string) => {
      return state.recommendations.filter(rec => rec.content.type === type)
    }, [state.recommendations]),
    
    getRecommendationsByPriority: useCallback((priority: 'low' | 'medium' | 'high' | 'critical') => {
      return state.recommendations.filter(rec => rec.priority === priority)
    }, [state.recommendations]),
    
    getHighConfidenceRecommendations: useCallback((threshold = 0.8) => {
      return state.recommendations.filter(rec => rec.confidence >= threshold)
    }, [state.recommendations]),
    
    getBestRecommendations: useCallback((count = 5) => {
      return [...state.recommendations]
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
    }, [state.recommendations])
  }
}

// Hook for interaction tracking
export function useInteractionTracking(userId: string) {
  const [interactions, setInteractions] = useState<ContentInteraction[]>([])
  const [isTracking, setIsTracking] = useState(false)

  const trackInteraction = useCallback(async (
    contentId: string,
    interactionType: ContentInteraction['interactionType'],
    additionalData: Partial<ContentInteraction> = {}
  ) => {
    setIsTracking(true)

    try {
      const interaction: ContentInteraction = {
        contentId,
        interactionType,
        timestamp: new Date(),
        duration: additionalData.duration || 0,
        engagementScore: additionalData.engagementScore || 0.5,
        completionRate: additionalData.completionRate || 0,
        qualityRating: additionalData.qualityRating,
        difficulty: additionalData.difficulty || 5,
        context: {
          sessionNumber: interactions.length + 1,
          timeOfDay: new Date().toLocaleTimeString(),
          deviceType: 'web',
          learningGoals: [],
          priorContent: interactions.slice(-3).map(int => int.contentId),
          adaptationsActive: [],
          ...additionalData.context
        }
      }

      setInteractions(prev => [...prev, interaction])
      setIsTracking(false)

      return interaction

    } catch (error) {
      setIsTracking(false)
      throw error
    }
  }, [interactions])

  const getInteractionHistory = useCallback((contentId?: string) => {
    if (contentId) {
      return interactions.filter(int => int.contentId === contentId)
    }
    return interactions
  }, [interactions])

  const getEngagementMetrics = useCallback(() => {
    if (interactions.length === 0) return null

    const totalDuration = interactions.reduce((sum, int) => sum + int.duration, 0)
    const averageEngagement = interactions.reduce((sum, int) => sum + int.engagementScore, 0) / interactions.length
    const completionRate = interactions.filter(int => int.completionRate > 0.8).length / interactions.length

    return {
      totalDuration,
      averageEngagement,
      completionRate,
      totalInteractions: interactions.length
    }
  }, [interactions])

  return {
    interactions,
    isTracking,
    trackInteraction,
    getInteractionHistory,
    getEngagementMetrics
  }
}

// Hook for recommendation analytics
export function useRecommendationAnalytics(userId: string, userProfile: UserProfile) {
  const [analytics, setAnalytics] = useState<RecommendationAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  const loadAnalytics = useCallback(async (newTimeframe?: 'daily' | 'weekly' | 'monthly') => {
    setIsLoading(true)

    try {
      const tf = newTimeframe || timeframe

      const response = await fetch('/api/content-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_analytics',
          timeframe: tf
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load analytics')
      }

      setAnalytics(data.analytics)
      if (newTimeframe) {
        setTimeframe(newTimeframe)
      }

    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, userProfile, timeframe])

  const getRecommendationTrends = useCallback(() => {
    if (!analytics) return null

    return {
      engagementTrend: analytics.engagementRate > 0.7 ? 'improving' : 
                      analytics.engagementRate > 0.4 ? 'stable' : 'declining',
      discoveryTrend: analytics.discoveryRate > 0.3 ? 'improving' : 'needs_work',
      satisfactionTrend: analytics.satisfactionScore > 0.8 ? 'excellent' : 
                        analytics.satisfactionScore > 0.6 ? 'good' : 'needs_improvement'
    }
  }, [analytics])

  return {
    analytics,
    isLoading,
    timeframe,
    loadAnalytics,
    setTimeframe,
    getRecommendationTrends,
    
    // Quick metrics
    hasAnalytics: !!analytics,
    engagementRate: analytics?.engagementRate || 0,
    satisfactionScore: analytics?.satisfactionScore || 0,
    discoveryRate: analytics?.discoveryRate || 0
  }
}
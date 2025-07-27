import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { DifficultyRecommendation, PerformancePoint } from '@/lib/difficulty-engine'

interface DifficultyState {
  recommendation: DifficultyRecommendation | null
  adaptedContent: ContentItem | null
  isAnalyzing: boolean
  isApplying: boolean
  isMonitoring: boolean
  error: string | null
  
  // Monitoring data
  monitoringPlan: any
  effectiveness: any
  rollbackAnalysis: any
}

interface DifficultyActions {
  analyzeDifficulty: (
    userId: string,
    userProfile: UserProfile,
    recentPerformance?: PerformancePoint[],
    currentContext?: any
  ) => Promise<void>
  
  applyDifficultyAdjustment: (
    userId: string,
    userProfile: UserProfile,
    contentId: string,
    forceAdjustment?: boolean
  ) => Promise<void>
  
  monitorAdjustment: (
    userId: string,
    userProfile: UserProfile,
    monitoringData?: any
  ) => Promise<void>
  
  rollbackAdjustment: (
    userId: string,
    contentId: string
  ) => Promise<void>
  
  resetState: () => void
}

export function useDifficultyAdjustment(): DifficultyState & DifficultyActions {
  const [state, setState] = useState<DifficultyState>({
    recommendation: null,
    adaptedContent: null,
    isAnalyzing: false,
    isApplying: false,
    isMonitoring: false,
    error: null,
    monitoringPlan: null,
    effectiveness: null,
    rollbackAnalysis: null
  })
  
  // Analyze difficulty needs
  const analyzeDifficulty = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    recentPerformance?: PerformancePoint[],
    currentContext?: any
  ) => {
    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))
    
    try {
      const response = await fetch('/api/adaptive/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          recentPerformance,
          currentContext,
          action: 'analyze'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze difficulty needs')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        recommendation: data.recommendation,
        isAnalyzing: false,
        error: null
      }))
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }))
    }
  }, [])
  
  // Apply difficulty adjustment
  const applyDifficultyAdjustment = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    contentId: string,
    forceAdjustment = false
  ) => {
    setState(prev => ({ ...prev, isApplying: true, error: null }))
    
    try {
      const response = await fetch('/api/adaptive/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          contentId,
          forceAdjustment,
          action: 'apply'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to apply difficulty adjustment')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        recommendation: data.recommendation,
        adaptedContent: data.adaptedContent,
        monitoringPlan: data.monitoringPlan,
        isApplying: false,
        error: null
      }))
      
      // Start monitoring if content was adapted
      if (data.applied) {
        setTimeout(() => {
          monitorAdjustment(userId, userProfile)
        }, 2000) // Start monitoring after 2 seconds
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isApplying: false,
        error: error instanceof Error ? error.message : 'Application failed'
      }))
    }
  }, [])
  
  // Monitor adjustment effectiveness
  const monitorAdjustment = useCallback(async (
    userId: string,
    userProfile: UserProfile,
    monitoringData?: any
  ) => {
    setState(prev => ({ ...prev, isMonitoring: true, error: null }))
    
    try {
      const response = await fetch('/api/adaptive/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          monitoringData,
          action: 'monitor'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to monitor adjustment')
      }
      
      const data = await response.json()
      
      setState(prev => ({
        ...prev,
        effectiveness: data.effectiveness,
        rollbackAnalysis: data.rollbackAnalysis,
        isMonitoring: false,
        error: null
      }))
      
      // Handle automatic rollback if needed
      if (data.rollbackAnalysis.rollbackNeeded) {
        console.warn('Automatic rollback recommended:', data.rollbackAnalysis.reasoning)
        // Could trigger automatic rollback here
      }
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        isMonitoring: false,
        error: error instanceof Error ? error.message : 'Monitoring failed'
      }))
    }
  }, [])
  
  // Rollback difficulty adjustment
  const rollbackAdjustment = useCallback(async (
    userId: string,
    contentId: string
  ) => {
    // This would implement rollback logic
    // For now, just reset the adapted content
    setState(prev => ({
      ...prev,
      adaptedContent: null,
      recommendation: null
    }))
    
    console.log('Rolled back difficulty adjustment for user:', userId, 'content:', contentId)
  }, [])
  
  // Reset state
  const resetState = useCallback(() => {
    setState({
      recommendation: null,
      adaptedContent: null,
      isAnalyzing: false,
      isApplying: false,
      isMonitoring: false,
      error: null,
      monitoringPlan: null,
      effectiveness: null,
      rollbackAnalysis: null
    })
  }, [])
  
  return {
    ...state,
    analyzeDifficulty,
    applyDifficultyAdjustment,
    monitorAdjustment,
    rollbackAdjustment,
    resetState
  }
}

// Hook for tracking user performance data
export function usePerformanceTracking(userId: string) {
  const [performanceData, setPerformanceData] = useState<PerformancePoint[]>([])
  
  const recordPerformance = useCallback((
    contentId: string,
    difficultyLevel: number,
    success: boolean,
    attempts: number,
    timeSpent: number,
    score?: number
  ) => {
    const performancePoint: PerformancePoint = {
      timestamp: new Date(),
      contentId,
      difficultyLevel,
      success,
      attempts,
      timeSpent,
      score,
      contextFactors: {
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                   new Date().getHours() < 17 ? 'afternoon' : 'evening',
        sessionDuration: Math.floor(Date.now() / 60000) % 60, // Rough session duration
        deviceType: /Mobile|Android|iP(hone|od|ad)/.test(navigator.userAgent) ? 'mobile' : 'desktop',
        distractionLevel: Math.random() * 0.5 // Would be calculated based on actual metrics
      }
    }
    
    setPerformanceData(prev => [...prev.slice(-19), performancePoint]) // Keep last 20 records
  }, [])
  
  const getRecentPerformance = useCallback((count = 10) => {
    return performanceData.slice(-count)
  }, [performanceData])
  
  const getPerformanceMetrics = useCallback(() => {
    if (performanceData.length === 0) {
      return {
        successRate: 0,
        averageAttempts: 0,
        averageTime: 0,
        improvement: 0
      }
    }
    
    const successRate = performanceData.filter(p => p.success).length / performanceData.length
    const averageAttempts = performanceData.reduce((sum, p) => sum + p.attempts, 0) / performanceData.length
    const averageTime = performanceData.reduce((sum, p) => sum + p.timeSpent, 0) / performanceData.length
    
    // Calculate improvement trend
    const recent = performanceData.slice(-5)
    const earlier = performanceData.slice(0, 5)
    const recentSuccess = recent.length > 0 ? recent.filter(p => p.success).length / recent.length : 0
    const earlierSuccess = earlier.length > 0 ? earlier.filter(p => p.success).length / earlier.length : 0
    const improvement = recentSuccess - earlierSuccess
    
    return {
      successRate,
      averageAttempts,
      averageTime,
      improvement
    }
  }, [performanceData])
  
  return {
    performanceData,
    recordPerformance,
    getRecentPerformance,
    getPerformanceMetrics
  }
}

// Hook for difficulty-aware content rendering
export function useDifficultyAwareContent(
  originalContent: ContentItem,
  userId: string,
  userProfile: UserProfile
) {
  const { 
    recommendation, 
    adaptedContent, 
    isAnalyzing, 
    analyzeDifficulty,
    applyDifficultyAdjustment 
  } = useDifficultyAdjustment()
  
  const { recordPerformance, getRecentPerformance } = usePerformanceTracking(userId)
  
  // Auto-analyze difficulty when content changes
  useEffect(() => {
    if (originalContent && !isAnalyzing) {
      analyzeDifficulty(userId, userProfile, getRecentPerformance())
    }
  }, [originalContent.id, userId, analyzeDifficulty, isAnalyzing, getRecentPerformance, userProfile])
  
  // Auto-apply adjustment if urgency is high
  useEffect(() => {
    if (recommendation && recommendation.urgency === 'high' && !adaptedContent) {
      applyDifficultyAdjustment(userId, userProfile, originalContent.id)
    }
  }, [recommendation, adaptedContent, applyDifficultyAdjustment, userId, userProfile, originalContent.id])
  
  const content = adaptedContent || originalContent
  
  const handleContentInteraction = useCallback((
    success: boolean,
    attempts: number,
    timeSpent: number,
    score?: number
  ) => {
    const difficultyLevel = (adaptedContent?.metadata?.adaptedDifficulty as number) || 
                           originalContent.difficulty || 5
    
    recordPerformance(
      originalContent.id,
      difficultyLevel,
      success,
      attempts,
      timeSpent,
      score
    )
  }, [adaptedContent, originalContent, recordPerformance])
  
  return {
    content,
    isAdapted: !!adaptedContent,
    recommendation,
    isAnalyzing,
    handleContentInteraction
  }
}
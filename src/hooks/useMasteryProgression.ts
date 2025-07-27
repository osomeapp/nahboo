// React hooks for mastery-based progression system
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile } from '@/types'
import type { 
  UserMasteryProfile,
  SkillTree,
  SkillNode,
  Achievement,
  ProgressionRecommendation,
  MasteryAssessment,
  UnlockBenefit
} from '@/lib/mastery-progression-engine'

export interface MasteryProgressionState {
  masteryProfile: UserMasteryProfile | null
  skillTrees: SkillTree[]
  achievements: Achievement[]
  availableAchievements: Achievement[]
  recommendations: ProgressionRecommendation[]
  currentAssessment: MasteryAssessment | null
  recentUnlocks: UnlockBenefit[]
  isLoading: boolean
  isAssessing: boolean
  error: string | null
}

export interface SkillAssessmentData {
  evidenceType: 'assessment' | 'project' | 'peer_teaching' | 'real_world_application' | 'creative_work' | 'explanation' | 'problem_solving'
  score: number // 0-1 scale
  timeSpent: number // minutes
  quality: number // 0-1 scale
  description: string
  artifacts?: string[] // URLs or descriptions of work produced
}

export interface MasteryFilters {
  subjectAreas: string[]
  difficultyRange: { min: number; max: number }
  showCompleted: boolean
  showLocked: boolean
  categories: string[]
}

// Main mastery progression hook
export function useMasteryProgression(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<MasteryProgressionState>({
    masteryProfile: null,
    skillTrees: [],
    achievements: [],
    availableAchievements: [],
    recommendations: [],
    currentAssessment: null,
    recentUnlocks: [],
    isLoading: false,
    isAssessing: false,
    error: null
  })

  const [filters, setFilters] = useState<MasteryFilters>({
    subjectAreas: [userProfile.subject || 'General'],
    difficultyRange: { min: 1, max: 10 },
    showCompleted: true,
    showLocked: false,
    categories: ['foundational', 'intermediate', 'advanced']
  })

  // Auto-refresh interval
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize mastery profile
  const initializeMasteryProfile = useCallback(async (selectedSubjects?: string[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'initialize_profile',
          selectedSubjects
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to initialize mastery profile: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize mastery profile')
      }

      setState(prev => ({
        ...prev,
        masteryProfile: data.masteryProfile,
        skillTrees: data.masteryProfile.skillTrees || [],
        achievements: data.masteryProfile.achievements || [],
        isLoading: false
      }))

      // Load additional data
      await Promise.all([
        loadRecommendations(),
        loadAvailableAchievements()
      ])

      return data.masteryProfile

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [userId, userProfile])

  // Assess skill mastery
  const assessSkillMastery = useCallback(async (
    skillId: string,
    assessmentData: SkillAssessmentData[]
  ) => {
    setState(prev => ({ ...prev, isAssessing: true, error: null }))

    try {
      const evidence = assessmentData.map(data => ({
        type: data.evidenceType,
        score: data.score,
        timeSpent: data.timeSpent,
        quality: data.quality,
        description: data.description,
        artifacts: data.artifacts,
        timestamp: new Date()
      }))

      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'assess_skill',
          skillId,
          evidence,
          assessmentType: assessmentData[0]?.evidenceType || 'assessment'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to assess skill: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to assess skill')
      }

      // Update local state with new achievements and unlocks
      setState(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...(data.achievements || [])],
        recentUnlocks: [...prev.recentUnlocks, ...(data.unlocks || [])],
        isAssessing: false
      }))

      // Refresh skill trees and recommendations
      await Promise.all([
        refreshSkillTrees(),
        loadRecommendations()
      ])

      return {
        newMasteryLevel: data.newMasteryLevel,
        achievements: data.achievements,
        unlocks: data.unlocks
      }

    } catch (error) {
      setState(prev => ({ ...prev, isAssessing: false }))
      const errorMessage = error instanceof Error ? error.message : 'Assessment failed'
      setState(prev => ({ ...prev, error: errorMessage }))
      throw error
    }
  }, [userId, userProfile])

  // Get skill tree for subject
  const getSkillTree = useCallback(async (subject: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_skill_tree',
          subject
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get skill tree: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get skill tree')
      }

      // Update skill tree in state
      setState(prev => ({
        ...prev,
        skillTrees: prev.skillTrees.filter(tree => tree.subjectArea !== subject).concat(data.skillTree),
        isLoading: false
      }))

      return data.skillTree

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [userId, userProfile])

  // Load progression recommendations
  const loadRecommendations = useCallback(async (count: number = 5) => {
    try {
      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_recommendations',
          count
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load recommendations: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load recommendations')
      }

      setState(prev => ({
        ...prev,
        recommendations: data.recommendations || []
      }))

      return data.recommendations

    } catch (error) {
      console.error('Failed to load recommendations:', error)
      return []
    }
  }, [userId, userProfile])

  // Load available achievements
  const loadAvailableAchievements = useCallback(async () => {
    try {
      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_achievements'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load achievements: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load achievements')
      }

      setState(prev => ({
        ...prev,
        availableAchievements: data.availableAchievements || [],
        achievements: data.userAchievements || prev.achievements
      }))

      return data.availableAchievements

    } catch (error) {
      console.error('Failed to load achievements:', error)
      return []
    }
  }, [userId, userProfile])

  // Create mastery assessment
  const createMasteryAssessment = useCallback(async (
    skillId: string,
    assessmentType: MasteryAssessment['assessmentType']
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'create_assessment',
          skillId,
          assessmentTypeToCreate: assessmentType
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create assessment: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create assessment')
      }

      setState(prev => ({
        ...prev,
        currentAssessment: data.assessment,
        isLoading: false
      }))

      return data.assessment

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
      throw error
    }
  }, [userId, userProfile])

  // Get adaptive mastery threshold
  const getAdaptiveMasteryThreshold = useCallback(async (skillId: string) => {
    try {
      const response = await fetch('/api/mastery-progression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userProfile,
          action: 'get_adaptive_threshold',
          skillId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get adaptive threshold: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get adaptive threshold')
      }

      return data.adaptiveThreshold

    } catch (error) {
      console.error('Failed to get adaptive threshold:', error)
      return 0.8 // Default threshold
    }
  }, [userId, userProfile])

  // Refresh all skill trees
  const refreshSkillTrees = useCallback(async () => {
    const subjects = filters.subjectAreas
    
    try {
      const skillTreePromises = subjects.map(subject => getSkillTree(subject))
      await Promise.all(skillTreePromises)
    } catch (error) {
      console.error('Failed to refresh skill trees:', error)
    }
  }, [filters.subjectAreas, getSkillTree])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MasteryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Clear recent unlocks (after user has seen them)
  const clearRecentUnlocks = useCallback(() => {
    setState(prev => ({ ...prev, recentUnlocks: [] }))
  }, [])

  // Start auto-refresh
  const startAutoRefresh = useCallback((intervalMs = 300000) => { // 5 minutes default
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }

    refreshIntervalRef.current = setInterval(() => {
      Promise.all([
        loadRecommendations(),
        loadAvailableAchievements()
      ]).catch(console.error)
    }, intervalMs)
  }, [loadRecommendations, loadAvailableAchievements])

  // Stop auto-refresh
  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoRefresh()
    }
  }, [stopAutoRefresh])

  // Auto-initialize if no profile exists
  useEffect(() => {
    if (userProfile && !state.masteryProfile && !state.isLoading) {
      initializeMasteryProfile().catch(console.error)
    }
  }, [userProfile, state.masteryProfile, state.isLoading, initializeMasteryProfile])

  // Filter skill trees based on current filters
  const filteredSkillTrees = state.skillTrees.filter(tree => 
    filters.subjectAreas.includes(tree.subjectArea)
  ).map(tree => ({
    ...tree,
    skillNodes: tree.skillNodes.filter(node => {
      if (!filters.showCompleted && node.isCompleted) return false
      if (!filters.showLocked && !node.isUnlocked) return false
      if (!filters.categories.includes(node.category)) return false
      if (node.difficulty < filters.difficultyRange.min || node.difficulty > filters.difficultyRange.max) return false
      return true
    })
  }))

  // Calculate overall progress metrics
  const progressMetrics = {
    overallMastery: state.masteryProfile?.overallMasteryLevel || 0,
    totalSkills: state.skillTrees.reduce((sum, tree) => sum + tree.totalSkills, 0),
    completedSkills: state.skillTrees.reduce((sum, tree) => sum + tree.completedSkills, 0),
    unlockedSkills: state.skillTrees.reduce((sum, tree) => sum + tree.unlockedSkills, 0),
    totalAchievements: state.achievements.length,
    pendingRecommendations: state.recommendations.filter(rec => rec.priority === 'high' || rec.priority === 'critical').length,
    recentUnlocksCount: state.recentUnlocks.length
  }

  return {
    // State
    ...state,
    filteredSkillTrees,
    filters,
    progressMetrics,
    
    // Actions
    initializeMasteryProfile,
    assessSkillMastery,
    getSkillTree,
    loadRecommendations,
    loadAvailableAchievements,
    createMasteryAssessment,
    getAdaptiveMasteryThreshold,
    refreshSkillTrees,
    updateFilters,
    clearRecentUnlocks,
    startAutoRefresh,
    stopAutoRefresh,
    
    // Computed values
    hasProfile: !!state.masteryProfile,
    hasSkillTrees: state.skillTrees.length > 0,
    hasAchievements: state.achievements.length > 0,
    hasRecommendations: state.recommendations.length > 0,
    hasRecentUnlocks: state.recentUnlocks.length > 0,
    
    // Helper functions
    getSkillById: useCallback((skillId: string) => {
      for (const tree of state.skillTrees) {
        const skill = tree.skillNodes.find(node => node.skillId === skillId)
        if (skill) return skill
      }
      return null
    }, [state.skillTrees]),
    
    getSkillsByCategory: useCallback((category: string) => {
      const skills: SkillNode[] = []
      state.skillTrees.forEach(tree => {
        skills.push(...tree.skillNodes.filter(node => node.category === category))
      })
      return skills
    }, [state.skillTrees]),
    
    getUnlockedSkills: useCallback(() => {
      const skills: SkillNode[] = []
      state.skillTrees.forEach(tree => {
        skills.push(...tree.skillNodes.filter(node => node.isUnlocked && !node.isCompleted))
      })
      return skills
    }, [state.skillTrees]),
    
    getNextSkillsToUnlock: useCallback(() => {
      const nextSkills: SkillNode[] = []
      state.skillTrees.forEach(tree => {
        tree.skillNodes
          .filter(node => !node.isUnlocked)
          .forEach(node => {
            // Check if all prerequisites are completed
            const prereqsCompleted = node.prerequisites.every(prereqId => {
              const prereq = tree.skillNodes.find(n => n.skillId === prereqId)
              return prereq && prereq.isCompleted
            })
            if (prereqsCompleted) {
              nextSkills.push(node)
            }
          })
      })
      return nextSkills
    }, [state.skillTrees]),
    
    getRecommendationsByPriority: useCallback((priority: 'low' | 'medium' | 'high' | 'critical') => {
      return state.recommendations.filter(rec => rec.priority === priority)
    }, [state.recommendations]),
    
    getAchievementProgress: useCallback((achievementId: string) => {
      const achievement = state.availableAchievements.find(ach => ach.achievementId === achievementId)
      return achievement?.progress || 0
    }, [state.availableAchievements])
  }
}

// Hook for skill-specific tracking
export function useSkillProgress(userId: string, skillId: string) {
  const [skillData, setSkillData] = useState<SkillNode | null>(null)
  const [assessmentHistory, setAssessmentHistory] = useState<SkillAssessmentData[]>([])
  const [masteryThreshold, setMasteryThreshold] = useState<number>(0.8)
  const [isLoading, setIsLoading] = useState(false)

  const loadSkillData = useCallback(async () => {
    setIsLoading(true)
    try {
      // This would typically fetch from the mastery progression API
      // For now, we'll simulate the data
      setTimeout(() => {
        setSkillData({
          skillId,
          name: `Skill ${skillId}`,
          description: `Description for ${skillId}`,
          category: 'intermediate',
          subjectArea: 'General',
          difficulty: 5,
          prerequisites: [],
          dependents: [],
          masteryThreshold: {
            thresholdId: `threshold_${skillId}`,
            skillId,
            subjectArea: 'General',
            level: 5,
            requiredScore: 0.8,
            evidenceTypes: [],
            minimumAttempts: 2,
            prerequisiteSkills: [],
            unlocksBenefits: [],
            adaptiveFactors: []
          },
          currentMastery: Math.random() * 0.8,
          isUnlocked: true,
          isCompleted: false,
          estimatedTimeToMaster: 6,
          learningResources: [],
          assessments: [],
          realWorldApplications: [],
          position: { x: 0, y: 0 }
        })
        setIsLoading(false)
      }, 500)
    } catch (error) {
      setIsLoading(false)
      console.error('Failed to load skill data:', error)
    }
  }, [skillId])

  const recordAssessment = useCallback((assessmentData: SkillAssessmentData) => {
    setAssessmentHistory(prev => [...prev, assessmentData])
  }, [])

  const getMasteryProgress = useCallback(() => {
    if (!skillData) return { current: 0, target: 1, percentage: 0 }
    
    return {
      current: skillData.currentMastery,
      target: masteryThreshold,
      percentage: (skillData.currentMastery / masteryThreshold) * 100
    }
  }, [skillData, masteryThreshold])

  useEffect(() => {
    if (skillId) {
      loadSkillData()
    }
  }, [skillId, loadSkillData])

  return {
    skillData,
    assessmentHistory,
    masteryThreshold,
    isLoading,
    loadSkillData,
    recordAssessment,
    getMasteryProgress,
    
    // Helper calculations
    isNearMastery: skillData ? skillData.currentMastery >= masteryThreshold * 0.8 : false,
    remainingProgress: skillData ? Math.max(0, masteryThreshold - skillData.currentMastery) : 1,
    assessmentCount: assessmentHistory.length,
    averageAssessmentScore: assessmentHistory.length > 0 
      ? assessmentHistory.reduce((sum, assessment) => sum + assessment.score, 0) / assessmentHistory.length 
      : 0
  }
}

// Hook for achievement tracking
export function useAchievementProgress(userId: string) {
  const [achievementProgress, setAchievementProgress] = useState<Record<string, number>>({})
  const [recentlyEarned, setRecentlyEarned] = useState<Achievement[]>([])
  const [isTracking, setIsTracking] = useState(false)

  const trackAchievementProgress = useCallback(async (achievementId: string, progressData: any) => {
    setIsTracking(true)
    
    try {
      // Update local progress tracking
      setAchievementProgress(prev => ({
        ...prev,
        [achievementId]: Math.min(1, (prev[achievementId] || 0) + 0.1)
      }))
      
      setIsTracking(false)
    } catch (error) {
      setIsTracking(false)
      console.error('Failed to track achievement progress:', error)
    }
  }, [])

  const markAchievementEarned = useCallback((achievement: Achievement) => {
    setRecentlyEarned(prev => [...prev, { ...achievement, unlockedAt: new Date() }])
    setAchievementProgress(prev => ({ ...prev, [achievement.achievementId]: 1 }))
  }, [])

  const clearRecentlyEarned = useCallback(() => {
    setRecentlyEarned([])
  }, [])

  return {
    achievementProgress,
    recentlyEarned,
    isTracking,
    trackAchievementProgress,
    markAchievementEarned,
    clearRecentlyEarned,
    
    // Helper functions
    getAchievementProgress: useCallback((achievementId: string) => {
      return achievementProgress[achievementId] || 0
    }, [achievementProgress]),
    
    hasRecentlyEarned: recentlyEarned.length > 0,
    totalAchievementsEarned: Object.values(achievementProgress).filter(progress => progress >= 1).length
  }
}
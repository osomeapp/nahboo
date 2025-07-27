// React hooks for content safety and moderation
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  SafetyClassification,
  SafetyReport,
  ParentalControls,
  SafetyMetrics,
  ContentRestriction,
  TimeControl,
  ReportingPreference
} from '@/lib/content-safety-engine'

export interface SafetyState {
  classifications: Map<string, SafetyClassification>
  parentalControls: ParentalControls | null
  metrics: SafetyMetrics | null
  reports: SafetyReport[]
  isAnalyzing: boolean
  isSubmittingReport: boolean
  isLoadingMetrics: boolean
  isConfiguringControls: boolean
  error: string | null
}

export interface SafetyFilters {
  maxAgeRating: string
  allowedContentTypes: string[]
  maxDifficulty: number
  requireEducationalValue: boolean
  blockExternalLinks: boolean
  parentalSupervisionRequired: boolean
  safetyLevels: SafetyClassification['safetyLevel'][]
}

export interface SafetyAnalytics {
  totalContentAnalyzed: number
  safeContentPercentage: number
  blockedContentCount: number
  reportSubmissionRate: number
  parentalInterventionRate: number
  averageContentSafetyScore: number
  topRiskFactors: string[]
  ageAppropriatenessScore: number
}

// Main content safety hook
export function useContentSafety(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<SafetyState>({
    classifications: new Map(),
    parentalControls: null,
    metrics: null,
    reports: [],
    isAnalyzing: false,
    isSubmittingReport: false,
    isLoadingMetrics: false,
    isConfiguringControls: false,
    error: null
  })

  const [filters, setFilters] = useState<SafetyFilters>({
    maxAgeRating: getDefaultAgeRating(userProfile.age_group),
    allowedContentTypes: ['video', 'quiz', 'text', 'ai_lesson'],
    maxDifficulty: 10,
    requireEducationalValue: userProfile.age_group === 'child',
    blockExternalLinks: userProfile.age_group === 'child',
    parentalSupervisionRequired: userProfile.age_group === 'child',
    safetyLevels: ['safe', 'caution']
  })

  const analysisCache = useRef<Map<string, { classification: SafetyClassification; timestamp: number }>>(new Map())
  const cacheTimeout = 5 * 60 * 1000 // 5 minutes

  // Analyze content safety
  const analyzeContent = useCallback(async (
    content: ContentItem,
    useCache = true
  ): Promise<SafetyClassification | null> => {
    // Check cache first
    if (useCache) {
      const cached = analysisCache.current.get(content.id)
      if (cached && Date.now() - cached.timestamp < cacheTimeout) {
        return cached.classification
      }
    }

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }))

    try {
      const response = await fetch('/api/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_content',
          content,
          userProfile,
          parentalControls: state.parentalControls
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to analyze content: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze content')
      }

      const classification = data.classification

      // Update state and cache
      setState(prev => ({
        ...prev,
        classifications: new Map(prev.classifications.set(content.id, classification)),
        isAnalyzing: false
      }))

      // Cache the result
      analysisCache.current.set(content.id, {
        classification,
        timestamp: Date.now()
      })

      return classification

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isAnalyzing: false }))
      return null
    }
  }, [userProfile, state.parentalControls])

  // Batch analyze multiple content items
  const batchAnalyzeContent = useCallback(async (
    contentItems: ContentItem[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Map<string, SafetyClassification>> => {
    const results = new Map<string, SafetyClassification>()
    const total = contentItems.length
    let completed = 0

    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < contentItems.length; i += batchSize) {
      const batch = contentItems.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (content) => {
        const classification = await analyzeContent(content)
        if (classification) {
          results.set(content.id, classification)
        }
        completed++
        onProgress?.(completed, total)
      })

      await Promise.all(batchPromises)
    }

    return results
  }, [analyzeContent])

  // Check if content is appropriate
  const checkContentAppropriateness = useCallback(async (
    content: ContentItem
  ): Promise<{ appropriate: boolean; reason?: string; alternatives?: string[] }> => {
    try {
      const response = await fetch('/api/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_appropriateness',
          content,
          userProfile
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to check appropriateness: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to check appropriateness')
      }

      return {
        appropriate: data.appropriate,
        reason: data.reason,
        alternatives: data.alternatives
      }

    } catch (error) {
      console.error('Failed to check content appropriateness:', error)
      return { appropriate: false, reason: 'Unable to verify content safety' }
    }
  }, [userProfile])

  // Submit safety report
  const submitSafetyReport = useCallback(async (
    contentId: string,
    reportType: SafetyReport['reportType'],
    description: string,
    severity: SafetyReport['severity'] = 'medium'
  ): Promise<SafetyReport | null> => {
    setState(prev => ({ ...prev, isSubmittingReport: true, error: null }))

    try {
      const response = await fetch('/api/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_report',
          contentId,
          reporterId: userId,
          reportData: {
            reportType,
            description,
            severity
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to submit report: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit report')
      }

      const report = data.report

      setState(prev => ({
        ...prev,
        reports: [...prev.reports, report],
        isSubmittingReport: false
      }))

      return report

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isSubmittingReport: false }))
      return null
    }
  }, [userId])

  // Configure parental controls
  const configureParentalControls = useCallback(async (
    parentEmail: string,
    controls: Partial<ParentalControls>
  ): Promise<ParentalControls | null> => {
    setState(prev => ({ ...prev, isConfiguringControls: true, error: null }))

    try {
      const response = await fetch('/api/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'configure_parental_controls',
          userId,
          parentEmail,
          controls
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to configure parental controls: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to configure parental controls')
      }

      const parentalControls = data.parentalControls

      setState(prev => ({
        ...prev,
        parentalControls,
        isConfiguringControls: false
      }))

      return parentalControls

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isConfiguringControls: false }))
      return null
    }
  }, [userId])

  // Get safety metrics
  const getSafetyMetrics = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<SafetyMetrics | null> => {
    setState(prev => ({ ...prev, isLoadingMetrics: true, error: null }))

    try {
      const response = await fetch('/api/content-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_metrics',
          userId,
          timeframe
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get metrics: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get metrics')
      }

      const metrics = data.metrics

      setState(prev => ({
        ...prev,
        metrics,
        isLoadingMetrics: false
      }))

      return metrics

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoadingMetrics: false }))
      return null
    }
  }, [userId])

  // Update safety filters
  const updateFilters = useCallback((newFilters: Partial<SafetyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Filter content based on safety criteria
  const filterContent = useCallback((content: ContentItem[]): ContentItem[] => {
    return content.filter(item => {
      const classification = state.classifications.get(item.id)
      
      if (!classification) {
        // Be conservative - block if no classification
        return false
      }

      // Check safety level
      if (!filters.safetyLevels.includes(classification.safetyLevel)) {
        return false
      }

      // Check age rating
      const itemAgeRating = parseAgeRating(classification.ageRating)
      const maxAgeRating = parseAgeRating(filters.maxAgeRating)
      if (itemAgeRating > maxAgeRating) {
        return false
      }

      // Check content type
      if (!filters.allowedContentTypes.includes(item.content_type)) {
        return false
      }

      // Check difficulty
      if (item.difficulty && item.difficulty > filters.maxDifficulty) {
        return false
      }

      // Check educational value requirement
      if (filters.requireEducationalValue && classification.educationalValue < 0.7) {
        return false
      }

      // Check external links
      if (filters.blockExternalLinks && item.content_type === 'link') {
        return false
      }

      return true
    })
  }, [state.classifications, filters])

  // Calculate analytics
  const analytics: SafetyAnalytics = {
    totalContentAnalyzed: state.classifications.size,
    safeContentPercentage: state.classifications.size > 0 ? 
      Array.from(state.classifications.values()).filter(c => c.safetyLevel === 'safe').length / state.classifications.size * 100 : 0,
    blockedContentCount: Array.from(state.classifications.values()).filter(c => c.safetyLevel === 'blocked').length,
    reportSubmissionRate: state.reports.length / Math.max(1, state.classifications.size),
    parentalInterventionRate: state.parentalControls ? 
      state.parentalControls.restrictions.filter(r => r.isBlocked).length / Math.max(1, state.parentalControls.restrictions.length) : 0,
    averageContentSafetyScore: state.classifications.size > 0 ? 
      Array.from(state.classifications.values()).reduce((sum, c) => sum + c.confidenceScore, 0) / state.classifications.size : 0,
    topRiskFactors: getTopRiskFactors(Array.from(state.classifications.values())),
    ageAppropriatenessScore: calculateAgeAppropriatenessScore(Array.from(state.classifications.values()), userProfile.age_group)
  }

  // Load initial metrics
  useEffect(() => {
    getSafetyMetrics().catch(console.error)
  }, [getSafetyMetrics])

  return {
    // State
    ...state,
    filters,
    analytics,
    
    // Actions
    analyzeContent,
    batchAnalyzeContent,
    checkContentAppropriateness,
    submitSafetyReport,
    configureParentalControls,
    getSafetyMetrics,
    updateFilters,
    filterContent,
    
    // Computed values
    hasClassifications: state.classifications.size > 0,
    hasParentalControls: !!state.parentalControls,
    hasMetrics: !!state.metrics,
    isActive: state.classifications.size > 0 || state.isAnalyzing,
    
    // Helper functions
    getClassification: useCallback((contentId: string) => {
      return state.classifications.get(contentId) || null
    }, [state.classifications]),
    
    isContentSafe: useCallback((contentId: string) => {
      const classification = state.classifications.get(contentId)
      return classification?.safetyLevel === 'safe'
    }, [state.classifications]),
    
    getContentRiskFactors: useCallback((contentId: string) => {
      const classification = state.classifications.get(contentId)
      return classification?.riskFactors || []
    }, [state.classifications]),
    
    getAgeAppropriate: useCallback((ageGroup: string = userProfile.age_group) => {
      return Array.from(state.classifications.entries()).filter(([_, classification]) => {
        const userAge = calculateAge(ageGroup)
        const contentMinAge = parseAgeRating(classification.ageRating)
        return userAge >= contentMinAge
      }).map(([contentId]) => contentId)
    }, [state.classifications, userProfile.age_group])
  }
}

// Hook for parental controls management
export function useParentalControls(userId: string) {
  const [controls, setControls] = useState<ParentalControls | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const addRestriction = useCallback((restriction: ContentRestriction) => {
    setControls(prev => prev ? {
      ...prev,
      restrictions: [...prev.restrictions, restriction]
    } : null)
  }, [])

  const removeRestriction = useCallback((index: number) => {
    setControls(prev => prev ? {
      ...prev,
      restrictions: prev.restrictions.filter((_, i) => i !== index)
    } : null)
  }, [])

  const addTimeControl = useCallback((timeControl: TimeControl) => {
    setControls(prev => prev ? {
      ...prev,
      timeControls: [...prev.timeControls, timeControl]
    } : null)
  }, [])

  const updateReportingPreference = useCallback((preference: ReportingPreference) => {
    setControls(prev => prev ? {
      ...prev,
      reportingPreferences: [...prev.reportingPreferences.filter(p => p.eventType !== preference.eventType), preference]
    } : null)
  }, [])

  return {
    controls,
    isLoading,
    addRestriction,
    removeRestriction,
    addTimeControl,
    updateReportingPreference,
    setControls
  }
}

// Helper functions
function getDefaultAgeRating(ageGroup: string): string {
  const ageMap: Record<string, string> = {
    'child': '6+',
    'teen': '12+',
    'adult': '18+'
  }
  return ageMap[ageGroup] || '12+'
}

function calculateAge(ageGroup: string): number {
  const ageMap: Record<string, number> = {
    'child': 8,
    'teen': 15,
    'adult': 25
  }
  return ageMap[ageGroup] || 18
}

function parseAgeRating(rating: string): number {
  const match = rating.match(/(\d+)\+/)
  return match ? parseInt(match[1]) : 0
}

function getTopRiskFactors(classifications: SafetyClassification[]): string[] {
  const riskCounts = new Map<string, number>()
  
  classifications.forEach(classification => {
    classification.riskFactors.forEach(factor => {
      riskCounts.set(factor.riskType, (riskCounts.get(factor.riskType) || 0) + 1)
    })
  })
  
  return Array.from(riskCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([riskType]) => riskType)
}

function calculateAgeAppropriatenessScore(classifications: SafetyClassification[], ageGroup: string): number {
  if (classifications.length === 0) return 0
  
  const userAge = calculateAge(ageGroup)
  const appropriateCount = classifications.filter(classification => {
    const contentMinAge = parseAgeRating(classification.ageRating)
    return userAge >= contentMinAge
  }).length
  
  return appropriateCount / classifications.length
}
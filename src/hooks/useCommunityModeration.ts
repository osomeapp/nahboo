// React hooks for community moderation and safety reporting
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { UserProfile, ContentItem } from '@/types'
import type { 
  CommunityReport,
  CommunityVote,
  ModeratorAction,
  ModerationQueue,
  CommunityModerationMetrics,
  ReportEvidence,
  ModeratorProfile
} from '@/lib/community-moderation-engine'

export interface ModerationState {
  reports: CommunityReport[]
  myReports: CommunityReport[]
  activeQueues: ModerationQueue[]
  metrics: CommunityModerationMetrics | null
  moderatorProfile: ModeratorProfile | null
  isSubmittingReport: boolean
  isVoting: boolean
  isReviewing: boolean
  isLoadingQueue: boolean
  error: string | null
}

export interface ReportFilters {
  status: CommunityReport['status'][]
  reportType: CommunityReport['reportType'][]
  severity: CommunityReport['severity'][]
  category: CommunityReport['category'][]
  timeRange: 'last_day' | 'last_week' | 'last_month' | 'all_time'
  myReportsOnly: boolean
}

export interface ReportSubmissionData {
  reportType: CommunityReport['reportType']
  description: string
  evidence: {
    type: ReportEvidence['evidenceType']
    content: string
    metadata?: Record<string, any>
  }[]
  tags: string[]
  isUrgent: boolean
}

// Main community moderation hook
export function useCommunityModeration(userId: string, userProfile: UserProfile) {
  const [state, setState] = useState<ModerationState>({
    reports: [],
    myReports: [],
    activeQueues: [],
    metrics: null,
    moderatorProfile: null,
    isSubmittingReport: false,
    isVoting: false,
    isReviewing: false,
    isLoadingQueue: false,
    error: null
  })

  const [filters, setFilters] = useState<ReportFilters>({
    status: ['pending', 'reviewing'],
    reportType: [],
    severity: [],
    category: [],
    timeRange: 'last_week',
    myReportsOnly: false
  })

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Submit a community report
  const submitReport = useCallback(async (
    contentId: string,
    reportData: ReportSubmissionData
  ): Promise<CommunityReport | null> => {
    setState(prev => ({ ...prev, isSubmittingReport: true, error: null }))

    try {
      const response = await fetch('/api/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_report',
          userId,
          userProfile,
          contentId,
          reportData: {
            reportType: reportData.reportType,
            description: reportData.description,
            evidence: reportData.evidence.map((ev, index) => ({
              evidenceType: ev.type,
              content: ev.content,
              metadata: ev.metadata || {}
            })),
            tags: reportData.tags
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
        reports: [report, ...prev.reports],
        myReports: [report, ...prev.myReports],
        isSubmittingReport: false
      }))

      return report

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isSubmittingReport: false }))
      return null
    }
  }, [userId, userProfile])

  // Submit community vote on a report
  const submitVote = useCallback(async (
    reportId: string,
    voteType: CommunityVote['voteType'],
    confidence: number,
    reasoning?: string
  ): Promise<CommunityVote | null> => {
    setState(prev => ({ ...prev, isVoting: true, error: null }))

    try {
      const response = await fetch('/api/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_vote',
          userId,
          userProfile,
          reportId,
          voteData: {
            voteType,
            confidence,
            reasoning
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to submit vote: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit vote')
      }

      const vote = data.vote

      // Update report with new vote
      setState(prev => ({
        ...prev,
        reports: prev.reports.map(report => 
          report.reportId === reportId 
            ? { ...report, communityVotes: [...report.communityVotes, vote] }
            : report
        ),
        isVoting: false
      }))

      return vote

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isVoting: false }))
      return null
    }
  }, [userId, userProfile])

  // Moderator review of a report
  const submitModeratorReview = useCallback(async (
    reportId: string,
    decision: ModeratorAction['decision'],
    reasoning: string,
    reviewTime: number,
    evidenceReviewed: string[]
  ): Promise<ModeratorAction | null> => {
    setState(prev => ({ ...prev, isReviewing: true, error: null }))

    try {
      const response = await fetch('/api/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderator_review',
          userId,
          reportId,
          reviewData: {
            decision,
            reasoning,
            reviewTime,
            evidenceReviewed
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to submit review: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit review')
      }

      const action = data.action

      // Update report with moderator action
      setState(prev => ({
        ...prev,
        reports: prev.reports.map(report => 
          report.reportId === reportId 
            ? { ...report, moderatorActions: [...report.moderatorActions, action], status: 'reviewing' }
            : report
        ),
        isReviewing: false
      }))

      return action

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isReviewing: false }))
      return null
    }
  }, [userId])

  // Get moderation queue
  const getQueue = useCallback(async (
    queueType: ModerationQueue['queueType'],
    customFilters?: Partial<ReportFilters>
  ): Promise<ModerationQueue | null> => {
    setState(prev => ({ ...prev, isLoadingQueue: true, error: null }))

    try {
      const response = await fetch('/api/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_queue',
          userId,
          queueType,
          filters: customFilters || filters
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get queue: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get queue')
      }

      const queue = data.queue

      setState(prev => ({
        ...prev,
        activeQueues: prev.activeQueues.filter(q => q.queueType !== queueType).concat(queue),
        isLoadingQueue: false
      }))

      return queue

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setState(prev => ({ ...prev, error: errorMessage, isLoadingQueue: false }))
      return null
    }
  }, [userId, filters])

  // Get reports
  const getReports = useCallback(async (customFilters?: Partial<ReportFilters>) => {
    try {
      const response = await fetch('/api/community-moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_reports',
          userId,
          filters: customFilters || filters
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get reports: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get reports')
      }

      setState(prev => ({
        ...prev,
        reports: data.reports,
        myReports: data.myReports
      }))

      return data.reports

    } catch (error) {
      console.error('Failed to get reports:', error)
      return []
    }
  }, [userId, filters])

  // Get moderation metrics
  const getMetrics = useCallback(async (
    timeframe: CommunityModerationMetrics['timeframe'] = 'weekly'
  ): Promise<CommunityModerationMetrics | null> => {
    try {
      const response = await fetch('/api/community-moderation', {
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
        metrics
      }))

      return metrics

    } catch (error) {
      console.error('Failed to get moderation metrics:', error)
      return null
    }
  }, [userId])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Start polling for updates
  const startPolling = useCallback((intervalMs = 30000) => {
    if (pollIntervalRef.current) return

    pollIntervalRef.current = setInterval(() => {
      getReports().catch(console.error)
      if (state.moderatorProfile) {
        getQueue('community').catch(console.error)
      }
    }, intervalMs)
  }, [getReports, getQueue, state.moderatorProfile])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // Check if user can moderate
  const canModerate = userProfile.age_group === 'adult'

  // Load initial data
  useEffect(() => {
    getReports().catch(console.error)
    getMetrics().catch(console.error)
    
    if (canModerate) {
      // Try to load moderator profile
      // This would typically check if user is registered as a moderator
    }
  }, [getReports, getMetrics, canModerate])

  // Start polling for moderators
  useEffect(() => {
    if (canModerate) {
      startPolling()
    }
    
    return () => {
      stopPolling()
    }
  }, [canModerate, startPolling, stopPolling])

  // Filter reports based on current filters
  const filteredReports = state.reports.filter(report => {
    if (filters.status.length > 0 && !filters.status.includes(report.status)) return false
    if (filters.reportType.length > 0 && !filters.reportType.includes(report.reportType)) return false
    if (filters.severity.length > 0 && !filters.severity.includes(report.severity)) return false
    if (filters.category.length > 0 && !filters.category.includes(report.category)) return false
    if (filters.myReportsOnly && report.reporterId !== userId) return false
    
    // Time range filter
    const timeRangeMs = getTimeRangeMs(filters.timeRange)
    const cutoffTime = new Date(Date.now() - timeRangeMs)
    if (report.timestamp < cutoffTime) return false
    
    return true
  })

  // Calculate user statistics
  const userStats = {
    reportsSubmitted: state.myReports.length,
    votesSubmitted: state.reports.reduce((sum, report) => 
      sum + report.communityVotes.filter(vote => vote.voterId === userId).length, 0
    ),
    reportsResolved: state.myReports.filter(report => report.status === 'resolved').length,
    averageResolutionTime: calculateAverageResolutionTime(state.myReports.filter(r => r.resolution)),
    helpfulVotes: 0 // Would be calculated based on vote consensus
  }

  return {
    // State
    ...state,
    filteredReports,
    filters,
    userStats,
    canModerate,
    
    // Actions
    submitReport,
    submitVote,
    submitModeratorReview,
    getQueue,
    getReports,
    getMetrics,
    updateFilters,
    startPolling,
    stopPolling,
    
    // Computed values
    hasReports: state.reports.length > 0,
    hasMyReports: state.myReports.length > 0,
    hasPendingReports: filteredReports.filter(r => r.status === 'pending').length > 0,
    hasUrgentReports: filteredReports.filter(r => r.severity === 'urgent').length > 0,
    
    // Helper functions
    getReportById: useCallback((reportId: string) => {
      return state.reports.find(report => report.reportId === reportId) || null
    }, [state.reports]),
    
    getMyVoteOnReport: useCallback((reportId: string) => {
      const report = state.reports.find(r => r.reportId === reportId)
      return report?.communityVotes.find(vote => vote.voterId === userId) || null
    }, [state.reports, userId]),
    
    canVoteOnReport: useCallback((reportId: string) => {
      const report = state.reports.find(r => r.reportId === reportId)
      if (!report) return false
      if (report.reporterId === userId) return false // Can't vote on own reports
      return !report.communityVotes.some(vote => vote.voterId === userId)
    }, [state.reports, userId]),
    
    getReportsByStatus: useCallback((status: CommunityReport['status']) => {
      return state.reports.filter(report => report.status === status)
    }, [state.reports])
  }
}

// Hook for report submission form
export function useReportSubmission() {
  const [formData, setFormData] = useState<ReportSubmissionData>({
    reportType: 'inappropriate_content',
    description: '',
    evidence: [],
    tags: [],
    isUrgent: false
  })

  const [isFormValid, setIsFormValid] = useState(false)

  const updateFormData = useCallback((updates: Partial<ReportSubmissionData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const addEvidence = useCallback((evidence: ReportSubmissionData['evidence'][0]) => {
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, evidence]
    }))
  }, [])

  const removeEvidence = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      reportType: 'inappropriate_content',
      description: '',
      evidence: [],
      tags: [],
      isUrgent: false
    })
  }, [])

  // Validate form
  useEffect(() => {
    const isValid = formData.description.trim().length >= 10 && 
                   formData.reportType !== undefined
    setIsFormValid(isValid)
  }, [formData])

  return {
    formData,
    isFormValid,
    updateFormData,
    addEvidence,
    removeEvidence,
    resetForm
  }
}

// Helper functions
function getTimeRangeMs(timeRange: ReportFilters['timeRange']): number {
  switch (timeRange) {
    case 'last_day': return 24 * 60 * 60 * 1000
    case 'last_week': return 7 * 24 * 60 * 60 * 1000
    case 'last_month': return 30 * 24 * 60 * 60 * 1000
    case 'all_time': return Number.MAX_SAFE_INTEGER
    default: return 7 * 24 * 60 * 60 * 1000
  }
}

function calculateAverageResolutionTime(reports: CommunityReport[]): number {
  const resolved = reports.filter(r => r.resolution)
  if (resolved.length === 0) return 0
  
  const totalTime = resolved.reduce((sum, report) => {
    const resolutionTime = report.resolution!.timestamp.getTime() - report.timestamp.getTime()
    return sum + (resolutionTime / (1000 * 60 * 60)) // Convert to hours
  }, 0)
  
  return totalTime / resolved.length
}
'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type LearnerRiskProfile,
  type EarlyWarningSignal,
  type InterventionRecommendation,
  type RiskLevel
} from '@/lib/predictive-analytics-engine'

interface PredictiveAnalyticsState {
  currentRiskProfile: LearnerRiskProfile | null
  riskHistory: LearnerRiskProfile[]
  warningSignals: EarlyWarningSignal[]
  interventions: InterventionRecommendation[]
  criticalLearners: Array<{ userId: string, riskProfile: LearnerRiskProfile }>
  isAssessing: boolean
  isLoading: boolean
  error: string | null
  lastAssessment: Date | null
}

interface LearningDataInput {
  performance_data: any[]
  engagement_data: any[]
  behavioral_data: any[]
  emotional_data: any[]
  contextual_data: any
}

// Main hook for predictive analytics
export function usePredictiveAnalytics() {
  const [state, setState] = useState<PredictiveAnalyticsState>({
    currentRiskProfile: null,
    riskHistory: [],
    warningSignals: [],
    interventions: [],
    criticalLearners: [],
    isAssessing: false,
    isLoading: false,
    error: null,
    lastAssessment: null
  })

  // Assess learner risk
  const assessLearnerRisk = useCallback(async (
    userId: string,
    sessionId: string,
    learningData: LearningDataInput
  ) => {
    try {
      setState(prev => ({ ...prev, isAssessing: true, error: null }))
      
      const response = await fetch('/api/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assess_risk',
          userId,
          sessionId,
          learningData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to assess risk: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to assess learner risk')
      }

      setState(prev => ({
        ...prev,
        currentRiskProfile: data.riskProfile,
        warningSignals: data.warningSignals || [],
        interventions: data.interventions || [],
        isAssessing: false,
        lastAssessment: new Date()
      }))

      return data.riskProfile
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAssessing: false,
        error: error instanceof Error ? error.message : 'Failed to assess learner risk'
      }))
      throw error
    }
  }, [])

  // Get current risk profile
  const getRiskProfile = useCallback(async (userId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_risk_profile',
          userId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get risk profile: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get risk profile')
      }

      setState(prev => ({
        ...prev,
        currentRiskProfile: data.riskProfile,
        isLoading: false
      }))

      return data.riskProfile
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get risk profile'
      }))
      return null
    }
  }, [])

  // Get risk history
  const getRiskHistory = useCallback(async (userId: string, limit: number = 10) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_risk_history',
          userId,
          limit
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get risk history: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get risk history')
      }

      setState(prev => ({
        ...prev,
        riskHistory: data.riskHistory || [],
        isLoading: false
      }))

      return data.riskHistory
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get risk history'
      }))
      return []
    }
  }, [])

  // Get warning signals
  const getWarningSignals = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_warning_signals',
          userId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get warning signals: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get warning signals')
      }

      setState(prev => ({
        ...prev,
        warningSignals: data.warningSignals || []
      }))

      return data.warningSignals
    } catch (error) {
      console.error('Error getting warning signals:', error)
      return []
    }
  }, [])

  // Get critical learners (for administrators)
  const getCriticalLearners = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_critical_learners'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get critical learners: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get critical learners')
      }

      setState(prev => ({
        ...prev,
        criticalLearners: data.criticalLearners || [],
        isLoading: false
      }))

      return data.criticalLearners
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to get critical learners'
      }))
      return []
    }
  }, [])

  // Get interventions for a user
  const getInterventions = useCallback(async (userId: string) => {
    try {
      const response = await fetch('/api/predictive-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_interventions',
          userId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get interventions: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get interventions')
      }

      setState(prev => ({
        ...prev,
        interventions: data.interventions || []
      }))

      return data.interventions
    } catch (error) {
      console.error('Error getting interventions:', error)
      return []
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Get risk trend analysis
  const getRiskTrend = useCallback(() => {
    if (state.riskHistory.length < 2) return null

    const recentProfiles = state.riskHistory.slice(-5) // Last 5 assessments
    const riskScores = recentProfiles.map(profile => profile.risk_score)
    
    // Calculate trend
    const firstScore = riskScores[0]
    const lastScore = riskScores[riskScores.length - 1]
    const trendValue = lastScore - firstScore
    
    let trend: 'improving' | 'stable' | 'declining'
    if (trendValue < -0.1) trend = 'improving'
    else if (trendValue > 0.1) trend = 'declining'
    else trend = 'stable'

    // Calculate average risk
    const averageRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length

    return {
      trend,
      trendValue,
      averageRisk,
      assessmentCount: recentProfiles.length,
      timeframe: {
        start: recentProfiles[0].timestamp,
        end: recentProfiles[recentProfiles.length - 1].timestamp
      }
    }
  }, [state.riskHistory])

  // Get intervention effectiveness analysis
  const getInterventionEffectiveness = useCallback(() => {
    if (!state.currentRiskProfile || state.interventions.length === 0) return null

    const totalInterventions = state.interventions.length
    const highEffectivenessInterventions = state.interventions.filter(
      intervention => intervention.estimated_effectiveness > 0.7
    ).length

    const urgentInterventions = state.interventions.filter(
      intervention => intervention.priority === 'immediate' || intervention.priority === 'urgent'
    ).length

    const implementationComplexity = state.interventions.reduce((acc, intervention) => {
      const complexity = intervention.implementation_difficulty
      acc[complexity] = (acc[complexity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalInterventions,
      highEffectivenessCount: highEffectivenessInterventions,
      highEffectivenessRate: totalInterventions > 0 ? highEffectivenessInterventions / totalInterventions : 0,
      urgentInterventions,
      implementationComplexity,
      averageEffectiveness: state.interventions.reduce(
        (sum, intervention) => sum + intervention.estimated_effectiveness, 0
      ) / totalInterventions
    }
  }, [state.currentRiskProfile, state.interventions])

  // Get warning signal analysis
  const getWarningSignalAnalysis = useCallback(() => {
    if (state.warningSignals.length === 0) return null

    const severityDistribution = state.warningSignals.reduce((acc, signal) => {
      acc[signal.severity] = (acc[signal.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const signalTypeDistribution = state.warningSignals.reduce((acc, signal) => {
      acc[signal.signal_type] = (acc[signal.signal_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const urgentSignals = state.warningSignals.filter(signal => signal.urgency_level > 0.7)
    const highConfidenceSignals = state.warningSignals.filter(signal => signal.pattern_confidence > 0.8)

    const averageUrgency = state.warningSignals.reduce(
      (sum, signal) => sum + signal.urgency_level, 0
    ) / state.warningSignals.length

    const averageConfidence = state.warningSignals.reduce(
      (sum, signal) => sum + signal.pattern_confidence, 0
    ) / state.warningSignals.length

    return {
      totalSignals: state.warningSignals.length,
      severityDistribution,
      signalTypeDistribution,
      urgentSignals: urgentSignals.length,
      highConfidenceSignals: highConfidenceSignals.length,
      averageUrgency,
      averageConfidence,
      mostCommonSignalType: Object.entries(signalTypeDistribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null,
      mostSeverePriority: Object.entries(severityDistribution)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null
    }
  }, [state.warningSignals])

  // Monitor risk changes
  const shouldTriggerAlert = useCallback(() => {
    if (!state.currentRiskProfile) return false

    const profile = state.currentRiskProfile
    
    // Trigger alert for critical risk
    if (profile.risk_level === 'critical') return true
    
    // Trigger alert for high risk with high confidence
    if (profile.risk_level === 'high' && profile.confidence > 0.8) return true
    
    // Trigger alert for multiple critical warning signals
    const criticalSignals = state.warningSignals.filter(
      signal => signal.severity === 'critical'
    ).length
    if (criticalSignals >= 2) return true
    
    // Trigger alert for high dropout probability
    if (profile.predicted_outcomes.dropout_probability > 0.8) return true
    
    return false
  }, [state.currentRiskProfile, state.warningSignals])

  // Get personalized recommendations
  const getPersonalizedRecommendations = useCallback(() => {
    if (!state.currentRiskProfile) return []

    const profile = state.currentRiskProfile
    const recommendations: string[] = []

    // Risk level specific recommendations
    switch (profile.risk_level) {
      case 'critical':
        recommendations.push('Immediate intervention required - contact student within 24 hours')
        recommendations.push('Consider emergency support session')
        recommendations.push('Assess for external barriers to learning')
        break
      case 'high':
        recommendations.push('Schedule check-in within 3 days')
        recommendations.push('Implement targeted support strategies')
        recommendations.push('Monitor progress closely')
        break
      case 'moderate':
        recommendations.push('Provide additional resources and support')
        recommendations.push('Weekly progress monitoring')
        break
      case 'low':
        recommendations.push('Continue current approach')
        recommendations.push('Maintain regular check-ins')
        break
    }

    // Factor-specific recommendations
    profile.contributing_factors.forEach(factor => {
      switch (factor.factor_type) {
        case 'declining_performance':
          recommendations.push('Review content difficulty and adjust as needed')
          recommendations.push('Provide additional practice opportunities')
          break
        case 'low_engagement':
          recommendations.push('Introduce gamification elements')
          recommendations.push('Connect with peer learning community')
          break
        case 'emotional_distress':
          recommendations.push('Offer counseling or emotional support resources')
          recommendations.push('Implement stress management techniques')
          break
        case 'irregular_attendance':
          recommendations.push('Explore scheduling flexibility options')
          recommendations.push('Identify and address attendance barriers')
          break
      }
    })

    // Remove duplicates and limit
    return [...new Set(recommendations)].slice(0, 8)
  }, [state.currentRiskProfile])

  return {
    // State
    currentRiskProfile: state.currentRiskProfile,
    riskHistory: state.riskHistory,
    warningSignals: state.warningSignals,
    interventions: state.interventions,
    criticalLearners: state.criticalLearners,
    isAssessing: state.isAssessing,
    isLoading: state.isLoading,
    error: state.error,
    lastAssessment: state.lastAssessment,
    
    // Actions
    assessLearnerRisk,
    getRiskProfile,
    getRiskHistory,
    getWarningSignals,
    getCriticalLearners,
    getInterventions,
    clearError,
    
    // Analytics
    getRiskTrend,
    getInterventionEffectiveness,
    getWarningSignalAnalysis,
    shouldTriggerAlert,
    getPersonalizedRecommendations,
    
    // Computed state
    hasRiskData: !!state.currentRiskProfile,
    hasWarnings: state.warningSignals.length > 0,
    hasInterventions: state.interventions.length > 0,
    riskLevel: state.currentRiskProfile?.risk_level || 'low',
    riskScore: state.currentRiskProfile?.risk_score || 0
  }
}

// Hook for monitoring multiple learners (for administrators)
export function useMultiLearnerMonitoring() {
  const [monitoringState, setMonitoringState] = useState<{
    allLearners: Array<{ userId: string, riskProfile: LearnerRiskProfile }>
    criticalCount: number
    highRiskCount: number
    totalLearners: number
    isMonitoring: boolean
    lastUpdate: Date | null
  }>({
    allLearners: [],
    criticalCount: 0,
    highRiskCount: 0,
    totalLearners: 0,
    isMonitoring: false,
    lastUpdate: null
  })

  const { getCriticalLearners } = usePredictiveAnalytics()

  const updateMonitoring = useCallback(async () => {
    setMonitoringState(prev => ({ ...prev, isMonitoring: true }))
    
    try {
      const criticalLearners = await getCriticalLearners()
      
      const criticalCount = criticalLearners.filter(
        learner => learner.riskProfile.risk_level === 'critical'
      ).length
      
      const highRiskCount = criticalLearners.filter(
        learner => learner.riskProfile.risk_level === 'high'
      ).length

      setMonitoringState(prev => ({
        ...prev,
        allLearners: criticalLearners,
        criticalCount,
        highRiskCount,
        totalLearners: criticalLearners.length,
        isMonitoring: false,
        lastUpdate: new Date()
      }))
    } catch (error) {
      console.error('Error updating monitoring:', error)
      setMonitoringState(prev => ({ ...prev, isMonitoring: false }))
    }
  }, [getCriticalLearners])

  const getAlertSummary = useCallback(() => {
    const { criticalCount, highRiskCount, totalLearners } = monitoringState
    
    return {
      totalAlerts: criticalCount + highRiskCount,
      criticalAlerts: criticalCount,
      highRiskAlerts: highRiskCount,
      alertRate: totalLearners > 0 ? (criticalCount + highRiskCount) / totalLearners : 0,
      requiresImmediateAction: criticalCount > 0
    }
  }, [monitoringState])

  const getLearnersByRiskLevel = useCallback((riskLevel: RiskLevel) => {
    return monitoringState.allLearners.filter(
      learner => learner.riskProfile.risk_level === riskLevel
    )
  }, [monitoringState.allLearners])

  // Auto-update monitoring every 10 minutes
  useEffect(() => {
    updateMonitoring()
    
    const interval = setInterval(updateMonitoring, 10 * 60 * 1000) // 10 minutes
    
    return () => clearInterval(interval)
  }, [updateMonitoring])

  return {
    ...monitoringState,
    updateMonitoring,
    getAlertSummary,
    getLearnersByRiskLevel
  }
}

// Hook for risk factor analysis
export function useRiskFactorAnalysis(riskProfile: LearnerRiskProfile | null) {
  const getFactorInsights = useCallback(() => {
    if (!riskProfile) return null

    const factors = riskProfile.contributing_factors
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0)
    
    const factorAnalysis = factors.map(factor => ({
      ...factor,
      contribution: totalWeight > 0 ? (factor.weight / totalWeight) * 100 : 0,
      urgency: factor.severity * factor.weight,
      trendDirection: factor.trend
    })).sort((a, b) => b.contribution - a.contribution)

    const dominantFactor = factorAnalysis[0]
    const improvingFactors = factorAnalysis.filter(f => f.trend === 'improving')
    const decliningFactors = factorAnalysis.filter(f => f.trend === 'declining')

    return {
      factorAnalysis,
      dominantFactor,
      improvingFactors: improvingFactors.length,
      decliningFactors: decliningFactors.length,
      overallTrend: decliningFactors.length > improvingFactors.length ? 'declining' : 
                   improvingFactors.length > decliningFactors.length ? 'improving' : 'stable'
    }
  }, [riskProfile])

  const getPredictionInsights = useCallback(() => {
    if (!riskProfile) return null

    const outcomes = riskProfile.predicted_outcomes
    
    return {
      dropoutRisk: {
        level: outcomes.dropout_probability > 0.7 ? 'high' : 
               outcomes.dropout_probability > 0.4 ? 'moderate' : 'low',
        probability: outcomes.dropout_probability * 100
      },
      performanceRisk: {
        level: outcomes.performance_decline_probability > 0.7 ? 'high' : 
               outcomes.performance_decline_probability > 0.4 ? 'moderate' : 'low',
        probability: outcomes.performance_decline_probability * 100
      },
      engagementRisk: {
        level: outcomes.engagement_loss_probability > 0.7 ? 'high' : 
               outcomes.engagement_loss_probability > 0.4 ? 'moderate' : 'low',
        probability: outcomes.engagement_loss_probability * 100
      },
      interventionBenefit: {
        improvement: (outcomes.success_probability_with_intervention - 
                     outcomes.success_probability_without_intervention) * 100,
        timeToIntervention: outcomes.time_to_intervention_needed
      }
    }
  }, [riskProfile])

  return {
    getFactorInsights,
    getPredictionInsights
  }
}
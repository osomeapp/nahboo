'use client'

import { useState, useCallback, useEffect } from 'react'
import { 
  type ExamRequirements,
  type AdaptiveExam,
  type ExamSession,
  type ExamResults,
  type QuestionItem,
  type DifficultyCalibration
} from '@/lib/adaptive-exam-generation-engine'

interface AdaptiveExamState {
  currentExam: AdaptiveExam | null
  currentSession: ExamSession | null
  examHistory: AdaptiveExam[]
  sessionHistory: ExamSession[]
  currentQuestion: QuestionItem | null
  examResults: ExamResults | null
  isGenerating: boolean
  isInSession: boolean
  isSubmitting: boolean
  error: string | null
  lastExamId: string | null
}

interface ExamGenerationProgress {
  stage: 'question_generation' | 'calibration' | 'selection' | 'validation' | 'finalization'
  progress_percentage: number
  current_activity: string
  questions_generated: number
  total_questions_needed: number
  estimated_completion_time: number
}

// Main hook for adaptive exam generation
export function useAdaptiveExamGeneration() {
  const [state, setState] = useState<AdaptiveExamState>({
    currentExam: null,
    currentSession: null,
    examHistory: [],
    sessionHistory: [],
    currentQuestion: null,
    examResults: null,
    isGenerating: false,
    isInSession: false,
    isSubmitting: false,
    error: null,
    lastExamId: null
  })

  // Generate adaptive exam
  const generateExam = useCallback(async (requirements: ExamRequirements) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null 
      }))
      
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_exam',
          requirements
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to generate exam: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate adaptive exam')
      }

      setState(prev => ({
        ...prev,
        currentExam: data.exam,
        examHistory: [data.exam, ...prev.examHistory.slice(0, 9)], // Keep last 10
        isGenerating: false,
        lastExamId: data.exam.exam_id
      }))

      return data.exam
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate adaptive exam'
      }))
      throw error
    }
  }, [])

  // Generate exam with progress tracking
  const generateExamWithProgress = useCallback(async (
    requirements: ExamRequirements,
    progressCallback?: (progress: ExamGenerationProgress) => void
  ) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isGenerating: true, 
        error: null 
      }))

      // Start exam generation
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_exam_with_progress',
          requirements
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start exam generation: ${response.statusText}`)
      }

      const { examId } = await response.json()

      // Poll for progress
      const pollProgress = async () => {
        try {
          const progressResponse = await fetch('/api/adaptive-exam-generation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'get_generation_progress',
              examId
            })
          })

          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            
            if (progressData.progress) {
              progressCallback?.(progressData.progress)

              if (progressData.progress.progress_percentage < 100) {
                setTimeout(pollProgress, 1000) // Poll every second
              } else {
                // Generation complete, get result
                const resultResponse = await fetch('/api/adaptive-exam-generation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'get_exam',
                    examId
                  })
                })

                if (resultResponse.ok) {
                  const resultData = await resultResponse.json()
                  
                  setState(prev => ({
                    ...prev,
                    currentExam: resultData.exam,
                    examHistory: [resultData.exam, ...prev.examHistory.slice(0, 9)],
                    isGenerating: false,
                    lastExamId: resultData.exam.exam_id
                  }))
                }
              }
            }
          }
        } catch (error) {
          console.error('Error polling generation progress:', error)
        }
      }

      pollProgress()

    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate adaptive exam'
      }))
      throw error
    }
  }, [])

  // Start exam session
  const startExamSession = useCallback(async (
    examId: string,
    learnerId: string,
    initialAbility?: number
  ) => {
    try {
      setState(prev => ({ ...prev, error: null }))
      
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session',
          examId,
          learnerId,
          initialAbility
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to start exam session: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start exam session')
      }

      setState(prev => ({
        ...prev,
        currentSession: data.session,
        sessionHistory: [data.session, ...prev.sessionHistory.slice(0, 9)],
        isInSession: true
      }))

      return data.session
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start exam session'
      }))
      throw error
    }
  }, [])

  // Get next question in adaptive session
  const getNextQuestion = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_next_question',
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get next question: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get next question')
      }

      setState(prev => ({
        ...prev,
        currentQuestion: data.question,
        currentSession: data.updatedSession
      }))

      return {
        question: data.question,
        adaptive_context: data.adaptive_context
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get next question'
      }))
      throw error
    }
  }, [])

  // Submit question response
  const submitResponse = useCallback(async (
    sessionId: string,
    questionId: string,
    response: any,
    responseTime: number,
    confidenceLevel?: number
  ) => {
    try {
      setState(prev => ({ ...prev, isSubmitting: true, error: null }))
      
      const submitResponse = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_response',
          sessionId,
          questionId,
          response,
          responseTime,
          confidenceLevel
        })
      })

      if (!submitResponse.ok) {
        throw new Error(`Failed to submit response: ${submitResponse.statusText}`)
      }

      const data = await submitResponse.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit response')
      }

      setState(prev => ({
        ...prev,
        currentSession: data.updatedSession,
        isSubmitting: false
      }))

      return {
        is_correct: data.is_correct,
        points_earned: data.points_earned,
        feedback: data.feedback,
        adaptive_adjustments: data.adaptive_adjustments,
        session_update: data.session_update
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to submit response'
      }))
      throw error
    }
  }, [])

  // Complete exam session
  const completeExam = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_exam',
          sessionId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to complete exam: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete exam')
      }

      setState(prev => ({
        ...prev,
        examResults: data.results,
        currentSession: data.updatedSession,
        isInSession: false
      }))

      return data.results
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete exam'
      }))
      throw error
    }
  }, [])

  // Get exam by ID
  const getExam = useCallback(async (examId: string) => {
    try {
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_exam',
          examId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get exam: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get exam')
      }

      setState(prev => ({
        ...prev,
        currentExam: data.exam
      }))

      return data.exam
    } catch (error) {
      console.error('Error getting exam:', error)
      return null
    }
  }, [])

  // Get exam statistics
  const getExamStatistics = useCallback(async (examId: string) => {
    try {
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_exam_statistics',
          examId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to get exam statistics: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get exam statistics')
      }

      return data.statistics
    } catch (error) {
      console.error('Error getting exam statistics:', error)
      return null
    }
  }, [])

  // Validate exam requirements
  const validateExamRequirements = useCallback((requirements: ExamRequirements): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate basic requirements
    if (!requirements.title) {
      errors.push('Exam title is required')
    }

    if (!requirements.subject_domain) {
      errors.push('Subject domain is required')
    }

    if (requirements.learning_objectives.length === 0) {
      errors.push('At least one learning objective is required')
    }

    // Validate objective weights
    const totalWeight = requirements.learning_objectives.reduce((sum, obj) => sum + obj.weight, 0)
    if (Math.abs(totalWeight - 1) > 0.01) {
      errors.push('Learning objective weights must sum to 1.0')
    }

    // Validate constraints
    if (requirements.constraints.total_questions < 1) {
      errors.push('Total questions must be at least 1')
    }

    if (requirements.constraints.total_questions > 100) {
      warnings.push('Large number of questions may impact performance')
    }

    if (requirements.constraints.time_limit_minutes < 5) {
      warnings.push('Very short time limit may not allow for proper assessment')
    }

    // Validate difficulty distribution
    const difficultySum = 
      requirements.constraints.difficulty_distribution.easy +
      requirements.constraints.difficulty_distribution.medium +
      requirements.constraints.difficulty_distribution.hard

    if (Math.abs(difficultySum - 1) > 0.01) {
      errors.push('Difficulty distribution must sum to 1.0')
    }

    // Validate target audience
    if (requirements.target_audience.prior_knowledge_level < 1 || requirements.target_audience.prior_knowledge_level > 10) {
      warnings.push('Prior knowledge level should be between 1-10')
    }

    if (requirements.target_audience.estimated_ability < 1 || requirements.target_audience.estimated_ability > 10) {
      warnings.push('Estimated ability should be between 1-10')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Clear current exam
  const clearExam = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentExam: null,
      currentSession: null,
      currentQuestion: null,
      examResults: null,
      isInSession: false
    }))
  }, [])

  // Load exam history
  const loadExamHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_exam_history'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setState(prev => ({
            ...prev,
            examHistory: data.exams
          }))
        }
      }
    } catch (error) {
      console.error('Error loading exam history:', error)
    }
  }, [])

  // Auto-load exam history on mount
  useEffect(() => {
    loadExamHistory()
  }, [loadExamHistory])

  return {
    // State
    currentExam: state.currentExam,
    currentSession: state.currentSession,
    examHistory: state.examHistory,
    sessionHistory: state.sessionHistory,
    currentQuestion: state.currentQuestion,
    examResults: state.examResults,
    isGenerating: state.isGenerating,
    isInSession: state.isInSession,
    isSubmitting: state.isSubmitting,
    error: state.error,
    lastExamId: state.lastExamId,
    
    // Actions
    generateExam,
    generateExamWithProgress,
    startExamSession,
    getNextQuestion,
    submitResponse,
    completeExam,
    getExam,
    getExamStatistics,
    validateExamRequirements,
    clearError,
    clearExam,
    loadExamHistory,
    
    // Computed state
    hasExam: !!state.currentExam,
    hasSession: !!state.currentSession,
    hasResults: !!state.examResults,
    hasQuestion: !!state.currentQuestion,
    sessionProgress: state.currentSession ? 
      state.currentSession.current_question_index / (state.currentExam?.questions.length || 1) : 0,
    currentAbility: state.currentSession?.current_state.estimated_ability || 0,
    confidenceLevel: state.currentSession?.current_state.confidence_level || 0,
    isProcessing: state.isGenerating || state.isSubmitting,
    
    // Session analytics
    sessionAnalytics: state.currentSession ? {
      questionsAnswered: state.currentSession.responses.length,
      accuracyRate: state.currentSession.current_state.performance_indicators.accuracy_rate,
      avgResponseTime: state.currentSession.current_state.performance_indicators.avg_response_time,
      adaptiveAdjustments: state.currentSession.adaptive_adjustments.length,
      estimatedTimeRemaining: state.currentExam && state.currentSession ? 
        (state.currentExam.questions.length - state.currentSession.current_question_index) * 
        state.currentSession.current_state.performance_indicators.avg_response_time : 0
    } : null
  }
}

// Hook for exam analytics and performance tracking
export function useExamAnalytics() {
  const [analytics, setAnalytics] = useState<{
    total_exams_generated: number
    total_sessions_completed: number
    avg_exam_score: number
    avg_session_duration: number
    difficulty_effectiveness: number
    adaptive_accuracy: number
    most_common_subjects: string[]
    performance_trends: Array<{
      date: string
      avg_score: number
      completion_rate: number
    }>
  }>({
    total_exams_generated: 0,
    total_sessions_completed: 0,
    avg_exam_score: 0,
    avg_session_duration: 0,
    difficulty_effectiveness: 0,
    adaptive_accuracy: 0,
    most_common_subjects: [],
    performance_trends: []
  })

  const [isLoading, setIsLoading] = useState(false)

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_analytics'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Error loading exam analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  return {
    analytics,
    isLoading,
    loadAnalytics
  }
}

// Hook for difficulty calibration management
export function useDifficultyCalibration() {
  const [calibrationData, setCalibrationData] = useState<DifficultyCalibration | null>(null)
  const [isCalibrating, setIsCalibrating] = useState(false)

  const calibrateQuestions = useCallback(async (
    questions: QuestionItem[],
    responseData: Array<{
      question_id: string
      learner_ability: number
      response_correct: boolean
      response_time: number
    }>
  ) => {
    try {
      setIsCalibrating(true)
      
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calibrate_difficulty',
          questions,
          responseData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to calibrate questions: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to calibrate question difficulty')
      }

      setCalibrationData(data.calibration)
      return data.calibration
    } catch (error) {
      console.error('Error calibrating questions:', error)
      throw error
    } finally {
      setIsCalibrating(false)
    }
  }, [])

  const getCalibrationResults = useCallback(async (calibrationId: string) => {
    try {
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_calibration_results',
          calibrationId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setCalibrationData(data.calibration)
          return data.calibration
        }
      }
    } catch (error) {
      console.error('Error getting calibration results:', error)
    }
    return null
  }, [])

  return {
    calibrationData,
    isCalibrating,
    calibrateQuestions,
    getCalibrationResults
  }
}

// Hook for exam session monitoring (for instructors/administrators)
export function useExamSessionMonitoring() {
  const [activeSessions, setActiveSessions] = useState<ExamSession[]>([])
  const [sessionAnalytics, setSessionAnalytics] = useState<{
    total_active_sessions: number
    avg_progress: number
    sessions_requiring_attention: number
    performance_distribution: Record<string, number>
  }>({
    total_active_sessions: 0,
    avg_progress: 0,
    sessions_requiring_attention: 0,
    performance_distribution: {}
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  const updateSessionMonitoring = useCallback(async () => {
    try {
      setIsMonitoring(true)
      
      const response = await fetch('/api/adaptive-exam-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_session_monitoring'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          setActiveSessions(data.activeSessions)
          setSessionAnalytics(data.analytics)
        }
      }
    } catch (error) {
      console.error('Error updating session monitoring:', error)
    } finally {
      setIsMonitoring(false)
    }
  }, [])

  const getSessionsByStatus = useCallback((status: ExamSession['completion_status']) => {
    return activeSessions.filter(session => session.completion_status === status)
  }, [activeSessions])

  const getSessionsRequiringAttention = useCallback(() => {
    return activeSessions.filter(session => {
      // Sessions that might need instructor attention
      const lowPerformance = session.current_state.performance_indicators.accuracy_rate < 0.5
      const stuckOnQuestion = session.responses.length > 0 && 
        session.responses[session.responses.length - 1].response_time_seconds > 300 // 5 minutes
      const multipleAdjustments = session.adaptive_adjustments.length > 5
      
      return lowPerformance || stuckOnQuestion || multipleAdjustments
    })
  }, [activeSessions])

  // Auto-update monitoring every 30 seconds
  useEffect(() => {
    updateSessionMonitoring()
    
    const interval = setInterval(updateSessionMonitoring, 30 * 1000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [updateSessionMonitoring])

  return {
    activeSessions,
    sessionAnalytics,
    isMonitoring,
    updateSessionMonitoring,
    getSessionsByStatus,
    getSessionsRequiringAttention
  }
}
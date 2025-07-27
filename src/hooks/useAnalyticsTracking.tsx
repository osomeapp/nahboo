// Analytics Tracking Hooks
// Custom React hooks for easy analytics integration throughout the application

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAnalytics } from '@/lib/analytics'
import { useUserProfile } from '@/lib/store'

// Hook for automatic page view tracking
export function usePageViewTracking() {
  const analytics = useAnalytics()
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (!hasTrackedRef.current) {
      analytics.trackPageView(window.location.pathname, document.referrer)
      hasTrackedRef.current = true
    }
  }, [analytics])
}

// Hook for video interaction tracking
export function useVideoTracking(videoId: string) {
  const analytics = useAnalytics()
  
  const trackPlay = useCallback((currentTime: number, duration: number) => {
    analytics.trackVideoInteraction(videoId, 'play', currentTime, duration)
  }, [analytics, videoId])

  const trackPause = useCallback((currentTime: number, duration: number) => {
    analytics.trackVideoInteraction(videoId, 'pause', currentTime, duration)
  }, [analytics, videoId])

  const trackSeek = useCallback((currentTime: number, duration: number) => {
    analytics.trackVideoInteraction(videoId, 'seek', currentTime, duration)
  }, [analytics, videoId])

  const trackComplete = useCallback((currentTime: number, duration: number) => {
    analytics.trackVideoInteraction(videoId, 'complete', currentTime, duration)
  }, [analytics, videoId])

  return { trackPlay, trackPause, trackSeek, trackComplete }
}

// Hook for content interaction tracking
export function useContentTracking() {
  const analytics = useAnalytics()

  const trackContentView = useCallback((contentId: string, contentType: string, metadata?: Record<string, any>) => {
    analytics.trackContentInteraction(contentId, contentType, 'view', {
      timestamp: Date.now(),
      ...metadata
    })
  }, [analytics])

  const trackContentComplete = useCallback((contentId: string, contentType: string, timeSpent: number, metadata?: Record<string, any>) => {
    analytics.trackContentInteraction(contentId, contentType, 'complete', {
      time_spent: timeSpent,
      completion_rate: 100,
      timestamp: Date.now(),
      ...metadata
    })
  }, [analytics])

  const trackContentLike = useCallback((contentId: string, contentType: string) => {
    analytics.trackContentInteraction(contentId, contentType, 'like', {
      timestamp: Date.now()
    })
  }, [analytics])

  const trackContentShare = useCallback((contentId: string, contentType: string, shareMethod: string) => {
    analytics.trackContentInteraction(contentId, contentType, 'share', {
      share_method: shareMethod,
      timestamp: Date.now()
    })
  }, [analytics])

  return { 
    trackContentView, 
    trackContentComplete, 
    trackContentLike, 
    trackContentShare 
  }
}

// Hook for quiz tracking
export function useQuizTracking() {
  const analytics = useAnalytics()
  const startTimeRef = useRef<number | null>(null)

  const startQuiz = useCallback((quizId: string) => {
    startTimeRef.current = Date.now()
    analytics.trackContentInteraction(quizId, 'quiz', 'start', {
      timestamp: startTimeRef.current
    })
  }, [analytics])

  const completeQuiz = useCallback((
    quizId: string, 
    totalQuestions: number, 
    correctAnswers: number,
    answers: Record<string, any>
  ) => {
    const timeSpent = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
    
    analytics.trackQuizAttempt(quizId, totalQuestions, correctAnswers, timeSpent)
    
    // Also track detailed quiz completion
    analytics.trackContentInteraction(quizId, 'quiz', 'complete', {
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      score_percentage: Math.round((correctAnswers / totalQuestions) * 100),
      time_spent: timeSpent,
      answers,
      timestamp: Date.now()
    })
  }, [analytics])

  const abandonQuiz = useCallback((quizId: string, questionsCompleted: number, totalQuestions: number) => {
    const timeSpent = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
    
    analytics.trackContentInteraction(quizId, 'quiz', 'abandon', {
      questions_completed: questionsCompleted,
      total_questions: totalQuestions,
      completion_percentage: Math.round((questionsCompleted / totalQuestions) * 100),
      time_spent: timeSpent,
      timestamp: Date.now()
    })
  }, [analytics])

  return { startQuiz, completeQuiz, abandonQuiz }
}

// Hook for AI interaction tracking
export function useAITracking() {
  const analytics = useAnalytics()
  const userProfile = useUserProfile()

  const trackAILessonRequest = useCallback((
    requestType: 'lesson' | 'quiz' | 'feedback',
    tutorPersonality: string,
    prompt: string,
    responseTime?: number
  ) => {
    analytics.trackAIInteraction(
      requestType, 
      tutorPersonality, 
      userProfile?.subject || 'general',
      responseTime || 0
    )

    // Track additional context
    analytics.trackContentInteraction(
      `ai_${requestType}_${Date.now()}`,
      'ai_lesson',
      'request',
      {
        request_type: requestType,
        tutor_personality: tutorPersonality,
        prompt_length: prompt.length,
        user_subject: userProfile?.subject,
        user_age_group: userProfile?.age_group,
        user_level: userProfile?.level,
        response_time: responseTime,
        timestamp: Date.now()
      }
    )
  }, [analytics, userProfile])

  const trackAIResponse = useCallback((
    requestId: string,
    responseLength: number,
    responseTime: number,
    userSatisfaction?: number
  ) => {
    analytics.trackContentInteraction(requestId, 'ai_lesson', 'response', {
      response_length: responseLength,
      response_time: responseTime,
      user_satisfaction: userSatisfaction,
      timestamp: Date.now()
    })
  }, [analytics])

  return { trackAILessonRequest, trackAIResponse }
}

// Hook for onboarding tracking
export function useOnboardingTracking() {
  const analytics = useAnalytics()
  const stepStartTimes = useRef<Record<string, number>>({})

  const startStep = useCallback((step: string) => {
    stepStartTimes.current[step] = Date.now()
  }, [])

  const completeStep = useCallback((step: string, stepData?: Record<string, any>) => {
    const startTime = stepStartTimes.current[step] || Date.now()
    const timeSpent = (Date.now() - startTime) / 1000

    analytics.trackOnboardingStep(step, true, timeSpent)

    // Track additional step data
    analytics.trackContentInteraction(
      `onboarding_${step}`,
      'onboarding',
      'complete',
      {
        step,
        time_spent: timeSpent,
        step_data: stepData,
        timestamp: Date.now()
      }
    )
  }, [analytics])

  const skipStep = useCallback((step: string, reason?: string) => {
    const startTime = stepStartTimes.current[step] || Date.now()
    const timeSpent = (Date.now() - startTime) / 1000

    analytics.trackOnboardingStep(step, false, timeSpent)

    analytics.trackContentInteraction(
      `onboarding_${step}`,
      'onboarding',
      'skip',
      {
        step,
        time_spent: timeSpent,
        skip_reason: reason,
        timestamp: Date.now()
      }
    )
  }, [analytics])

  return { startStep, completeStep, skipStep }
}

// Hook for session tracking
export function useSessionTracking() {
  const analytics = useAnalytics()
  const userProfile = useUserProfile()
  const sessionStartRef = useRef<number | null>(null)

  // Start session tracking
  useEffect(() => {
    sessionStartRef.current = Date.now()
    
    analytics.trackSessionStart({
      subject: userProfile?.subject,
      difficulty_level: userProfile?.level,
      age_group: userProfile?.age_group,
      use_case: userProfile?.use_case,
      session_duration: 0
    })

    // Track session end on page unload
    const handleUnload = () => {
      if (sessionStartRef.current) {
        const sessionDuration = (Date.now() - sessionStartRef.current) / 1000
        analytics.trackSessionEnd(sessionDuration)
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      if (sessionStartRef.current) {
        const sessionDuration = (Date.now() - sessionStartRef.current) / 1000
        analytics.trackSessionEnd(sessionDuration)
      }
    }
  }, [analytics, userProfile])

  // Track session milestones
  const trackMilestone = useCallback((milestone: string, data?: Record<string, any>) => {
    const sessionDuration = sessionStartRef.current 
      ? (Date.now() - sessionStartRef.current) / 1000 
      : 0

    analytics.trackContentInteraction(
      `session_milestone_${milestone}`,
      'session',
      'milestone',
      {
        milestone,
        session_duration: sessionDuration,
        ...data,
        timestamp: Date.now()
      }
    )
  }, [analytics])

  return { trackMilestone }
}

// Hook for error tracking
export function useErrorTracking() {
  const analytics = useAnalytics()

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'window_error'
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          source: 'unhandled_promise_rejection',
          reason: event.reason
        }
      )
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [analytics])

  const trackCustomError = useCallback((error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, {
      source: 'custom_error',
      ...context
    })
  }, [analytics])

  return { trackCustomError }
}

// Hook for performance tracking
export function usePerformanceTracking() {
  const analytics = useAnalytics()

  useEffect(() => {
    // Track page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const handleLoad = () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          
          if (navigation) {
            analytics.track('performance', {
              page_load_time: navigation.loadEventEnd - navigation.fetchStart,
              dom_interactive: navigation.domInteractive - navigation.fetchStart,  
              first_contentful_paint: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              dns_lookup_time: navigation.domainLookupEnd - navigation.domainLookupStart,
              connection_time: navigation.connectEnd - navigation.connectStart,
              server_response_time: navigation.responseEnd - navigation.requestStart,
              dom_processing_time: navigation.domComplete - navigation.domLoading,
              page: window.location.pathname
            })
          }
        }, 0)
      }

      if (document.readyState === 'complete') {
        handleLoad()
      } else {
        window.addEventListener('load', handleLoad)
        return () => window.removeEventListener('load', handleLoad)
      }
    }
  }, [analytics])

  const trackCustomPerformance = useCallback((metricName: string, value: number, unit: string = 'ms') => {
    analytics.track('performance', {
      metric_name: metricName,
      value,
      unit,
      timestamp: Date.now(),
      page: window.location.pathname
    })
  }, [analytics])

  return { trackCustomPerformance }
}

// Comprehensive analytics hook that combines all tracking capabilities
export function useComprehensiveAnalytics() {
  const analytics = useAnalytics()
  const userProfile = useUserProfile()

  // Set user ID when profile is available
  useEffect(() => {
    if (userProfile?.id) {
      analytics.setUserId(userProfile.id)
    }
  }, [analytics, userProfile?.id])

  const pageView = usePageViewTracking()
  const video = useVideoTracking
  const content = useContentTracking()
  const quiz = useQuizTracking()
  const ai = useAITracking()
  const onboarding = useOnboardingTracking()
  const session = useSessionTracking()
  const error = useErrorTracking()
  const performance = usePerformanceTracking()

  return {
    // Core analytics
    track: analytics.track,
    trackPageView: analytics.trackPageView,
    
    // Specialized tracking hooks
    video,
    content,
    quiz,
    ai,
    onboarding,
    session,
    error,
    performance,
    
    // Utility functions
    setUserId: analytics.setUserId,
    setEnabled: analytics.setEnabled
  }
}
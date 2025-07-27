// Analytics and Usage Tracking System
// Comprehensive tracking for user engagement, learning progress, and platform metrics

export interface AnalyticsEvent {
  event_type: 
    | 'page_view'
    | 'content_interaction'
    | 'quiz_attempt'
    | 'video_play'
    | 'ai_lesson_request'
    | 'onboarding_step'
    | 'session_start'
    | 'session_end'
    | 'error'
  user_id?: string
  session_id: string
  timestamp: string
  properties: Record<string, any>
  user_agent?: string
  device_info?: DeviceInfo
  learning_context?: LearningContext
}

export interface DeviceInfo {
  device_type: 'mobile' | 'tablet' | 'desktop'
  screen_resolution: string
  browser: string
  os: string
  is_mobile: boolean
}

export interface LearningContext {
  subject?: string
  difficulty_level?: string
  age_group?: string
  use_case?: string
  current_streak?: number
  session_duration?: number
}

export interface UserEngagementMetrics {
  user_id: string
  session_count: number
  total_time_spent: number
  content_interactions: number
  quiz_completions: number
  ai_lesson_requests: number
  learning_streak: number
  last_active: string
  engagement_score: number
}

export interface ContentAnalytics {
  content_id: string
  content_type: string
  view_count: number
  completion_rate: number
  average_time_spent: number
  quiz_success_rate?: number
  user_ratings: number[]
  bounce_rate: number
  popular_times: Record<string, number>
}

export interface PlatformMetrics {
  daily_active_users: number
  weekly_active_users: number
  monthly_active_users: number
  new_user_signups: number
  user_retention_rates: {
    day_1: number
    day_7: number
    day_30: number
  }
  average_session_duration: number
  content_consumption_rates: Record<string, number>
  feature_usage: Record<string, number>
}

class AnalyticsClient {
  private sessionId: string
  private userId?: string
  private isEnabled: boolean = true
  private eventQueue: AnalyticsEvent[] = []
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId()
    // Only set up client-side features in the browser
    if (typeof window !== 'undefined') {
      this.startBatchFlush()
      this.setupBeforeUnloadHandler()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getDeviceInfo(): DeviceInfo {
    // Return default values for SSR
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        device_type: 'desktop',
        screen_resolution: '1920x1080',
        browser: 'unknown',
        os: 'unknown',
        is_mobile: false
      }
    }

    const ua = navigator.userAgent
    const isMobile = /Mobile|Android|iPhone|iPad/.test(ua)
    
    return {
      device_type: isMobile ? (window.innerWidth > 768 ? 'tablet' : 'mobile') : 'desktop',
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      browser: this.getBrowserName(ua),
      os: this.getOSName(ua),
      is_mobile: isMobile
    }
  }

  private getBrowserName(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('Safari')) return 'Safari'
    if (ua.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getOSName(ua: string): string {
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'macOS'
    if (ua.includes('Linux')) return 'Linux'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  setUserId(userId: string): void {
    this.userId = userId
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (!enabled) {
      this.eventQueue = []
    }
  }

  // Core tracking methods
  track(eventType: AnalyticsEvent['event_type'], properties: Record<string, any> = {}): void {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      event_type: eventType,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties,
      user_agent: navigator.userAgent,
      device_info: this.getDeviceInfo()
    }

    this.eventQueue.push(event)
    
    if (this.eventQueue.length >= this.batchSize) {
      this.flush()
    }
  }

  // Specific tracking methods for common events
  trackPageView(page: string, referrer?: string): void {
    this.track('page_view', {
      page,
      referrer,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    })
  }

  trackContentInteraction(contentId: string, contentType: string, action: string, metadata?: Record<string, any>): void {
    this.track('content_interaction', {
      content_id: contentId,
      content_type: contentType,
      action,
      timestamp: Date.now(),
      ...metadata
    })
  }

  trackVideoInteraction(videoId: string, action: 'play' | 'pause' | 'seek' | 'complete', currentTime: number, duration: number): void {
    this.track('video_play', {
      video_id: videoId,
      action,
      current_time: currentTime,
      duration,
      progress_percentage: Math.round((currentTime / duration) * 100)
    })
  }

  trackQuizAttempt(quizId: string, questions: number, correctAnswers: number, timeSpent: number): void {
    this.track('quiz_attempt', {
      quiz_id: quizId,
      total_questions: questions,
      correct_answers: correctAnswers,
      score_percentage: Math.round((correctAnswers / questions) * 100),
      time_spent: timeSpent,
      completion_rate: 100
    })
  }

  trackAIInteraction(requestType: 'lesson' | 'quiz' | 'feedback', tutorPersonality: string, subject: string, responseTime: number): void {
    this.track('ai_lesson_request', {
      request_type: requestType,
      tutor_personality: tutorPersonality,
      subject,
      response_time: responseTime,
      timestamp: Date.now()
    })
  }

  trackOnboardingStep(step: string, completed: boolean, timeSpent: number): void {
    this.track('onboarding_step', {
      step,
      completed,
      time_spent: timeSpent,
      step_number: this.getStepNumber(step)
    })
  }

  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context,
      page: window.location.pathname
    })
  }

  trackSessionStart(learningContext?: LearningContext): void {
    this.track('session_start', {
      learning_context: learningContext,
      timestamp: Date.now(),
      session_id: this.sessionId
    })
  }

  trackSessionEnd(sessionDuration: number): void {
    this.track('session_end', {
      session_duration: sessionDuration,
      timestamp: Date.now(),
      session_id: this.sessionId
    })
  }

  private getStepNumber(step: string): number {
    const stepMap: Record<string, number> = {
      'language_selection': 1,
      'name_entry': 2,
      'subject_selection': 3,
      'onboarding_complete': 4
    }
    return stepMap[step] || 0
  }

  // Batch processing
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await this.sendEvents(events)
    } catch (error) {
      console.error('Failed to send analytics events:', error)
      // Re-queue failed events (with limit to prevent infinite queue growth)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events)
      }
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events })
    })

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`)
    }
  }

  private startBatchFlush(): void {
    setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private setupBeforeUnloadHandler(): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }
    
    window.addEventListener('beforeunload', () => {
      // Send any remaining events synchronously before page unload
      if (this.eventQueue.length > 0) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          events: this.eventQueue
        }))
      }
    })
  }

  // Analytics queries and insights
  async getUserEngagementMetrics(userId: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<UserEngagementMetrics> {
    const response = await fetch(`/api/analytics/user-engagement?user_id=${userId}&range=${timeRange}`)
    return response.json()
  }

  async getContentAnalytics(contentId?: string, timeRange: '7d' | '30d' | '90d' = '30d'): Promise<ContentAnalytics[]> {
    const params = new URLSearchParams({ range: timeRange })
    if (contentId) params.append('content_id', contentId)
    
    const response = await fetch(`/api/analytics/content?${params}`)
    return response.json()
  }

  async getPlatformMetrics(timeRange: '7d' | '30d' | '90d' = '30d'): Promise<PlatformMetrics> {
    const response = await fetch(`/api/analytics/platform?range=${timeRange}`)
    return response.json()
  }

  async getLearningInsights(userId: string): Promise<{
    strengths: string[]
    improvementAreas: string[]
    recommendedContent: string[]
    learningVelocity: number
    engagementTrends: Record<string, number>
  }> {
    const response = await fetch(`/api/analytics/insights?user_id=${userId}`)
    return response.json()
  }
}

// Global analytics instance - safely initialize in browser only
export const analytics = typeof window !== 'undefined' ? new AnalyticsClient() : null

// React hooks for analytics
export function useAnalytics() {
  // Provide no-op functions for SSR
  const noOp = () => {}
  
  if (!analytics) {
    return {
      track: noOp,
      trackPageView: noOp,
      trackContentInteraction: noOp,
      trackVideoInteraction: noOp,
      trackQuizAttempt: noOp,
      trackAIInteraction: noOp,
      trackOnboardingStep: noOp,
      trackError: noOp,
      setUserId: noOp,
      setEnabled: noOp
    }
  }

  return {
    track: analytics.track.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackContentInteraction: analytics.trackContentInteraction.bind(analytics),
    trackVideoInteraction: analytics.trackVideoInteraction.bind(analytics),
    trackQuizAttempt: analytics.trackQuizAttempt.bind(analytics),
    trackAIInteraction: analytics.trackAIInteraction.bind(analytics),
    trackOnboardingStep: analytics.trackOnboardingStep.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    setUserId: analytics.setUserId.bind(analytics),
    setEnabled: analytics.setEnabled.bind(analytics)
  }
}

// Utility functions for analytics calculations
export function calculateEngagementScore(metrics: {
  sessionCount: number
  totalTimeSpent: number
  contentInteractions: number
  quizCompletions: number
}): number {
  const sessionWeight = 0.2
  const timeWeight = 0.3
  const interactionWeight = 0.3
  const completionWeight = 0.2

  const normalizedSessions = Math.min(metrics.sessionCount / 30, 1) // Max 30 sessions
  const normalizedTime = Math.min(metrics.totalTimeSpent / (30 * 3600), 1) // Max 30 hours
  const normalizedInteractions = Math.min(metrics.contentInteractions / 100, 1) // Max 100 interactions
  const normalizedCompletions = Math.min(metrics.quizCompletions / 50, 1) // Max 50 completions

  return Math.round(
    (normalizedSessions * sessionWeight +
     normalizedTime * timeWeight +
     normalizedInteractions * interactionWeight +
     normalizedCompletions * completionWeight) * 100
  )
}

export function getEngagementLevel(score: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (score >= 80) return 'very_high'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}
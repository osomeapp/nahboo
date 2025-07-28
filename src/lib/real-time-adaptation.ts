import type { UserProfile, ContentItem } from '@/types'
import type { PerformancePoint, DifficultyRecommendation } from './difficulty-engine'
import { difficultyEngine } from './difficulty-engine'

// Real-time adaptation interfaces
export interface RealTimeAdaptationConfig {
  enabled: boolean
  adaptationFrequency: number // milliseconds between adaptations
  minimumInteractionTime: number // minimum time before first adaptation
  adaptationSensitivity: number // 0-1 scale of how quickly to adapt
  adaptationTypes: AdaptationType[]
  confidenceThreshold: number // minimum confidence to apply adaptation
}

export type AdaptationType = 
  | 'difficulty' 
  | 'pacing' 
  | 'hints' 
  | 'examples' 
  | 'encouragement'
  | 'content_format'
  | 'break_suggestion'

export interface RealTimeContext {
  sessionId: string
  startTime: Date
  contentId: string
  userProfile: UserProfile
  currentInteraction: CurrentInteraction
  recentBehavior: BehaviorPattern
  environmentalFactors: EnvironmentalFactors
}

export interface CurrentInteraction {
  timeSpent: number // seconds on current content
  scrollBehavior: ScrollPattern
  clickPatterns: ClickPattern[]
  pauseEvents: PauseEvent[]
  helpRequests: number
  attempts: number
  lastActivity: Date
  frustrationIndicators: FrustrationIndicator[]
  engagementLevel: number // 0-1 scale
}

export interface ScrollPattern {
  totalScrolls: number
  averageScrollSpeed: number
  backScrollEvents: number // scrolling backward
  timeAtTop: number // seconds spent at top of content
  timeAtBottom: number // seconds spent at bottom
  scrollCompletionRate: number // how much of content was scrolled through
}

export interface ClickPattern {
  timestamp: Date
  elementType: string
  elementId?: string
  clickCount: number
  doubleClicks: number
  rightClicks: number
  position: { x: number; y: number }
}

export interface PauseEvent {
  timestamp: Date
  duration: number // seconds
  location: string // where in content the pause occurred
  resumedTo?: string // where user went after pause
}

export interface FrustrationIndicator {
  type: 'rapid_clicking' | 'back_navigation' | 'long_pause' | 'help_seeking' | 'tab_switching'
  intensity: number // 0-1 scale
  timestamp: Date
  context?: string
}

export interface BehaviorPattern {
  attentionSpan: number // estimated attention span in seconds
  preferredPacing: number // content consumption rate
  comprehensionRate: number // how quickly user processes information
  interactionStyle: 'active' | 'passive' | 'exploratory' | 'methodical'
  strugglingIndicators: string[]
  successIndicators: string[]
}

export interface EnvironmentalFactors {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  dayOfWeek: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
  screenSize: { width: number; height: number }
  connectionSpeed: 'slow' | 'medium' | 'fast'
  batteryLevel?: number // for mobile devices
  notificationCount: number // estimated distractions
}

export interface AdaptationAction {
  type: AdaptationType
  intensity: number // 0-1 scale of how strong the adaptation should be
  trigger: string // what triggered this adaptation
  confidence: number // confidence in this adaptation
  timing: 'immediate' | 'next_interaction' | 'next_content'
  parameters: Record<string, any>
  expectedDuration: number // how long this adaptation should last
  success_criteria: string[]
  rollback_threshold: number
}

export interface AdaptationResult {
  applied: boolean
  action: AdaptationAction
  adaptedContent?: Partial<ContentItem>
  userFeedback?: string
  visualFeedback?: VisualFeedback
  systemMessage?: string
  nextActions?: AdaptationAction[]
}

export interface VisualFeedback {
  type: 'highlight' | 'popup' | 'animation' | 'overlay' | 'tooltip'
  content: string
  position?: { x: number; y: number }
  duration: number // milliseconds
  style: Record<string, string>
}

export class RealTimeAdaptationEngine {
  private adaptationHistory: Map<string, AdaptationAction[]> = new Map()
  private activeAdaptations: Map<string, AdaptationAction[]> = new Map()
  private behaviorTracking: Map<string, BehaviorPattern> = new Map()
  
  private config: RealTimeAdaptationConfig = {
    enabled: true,
    adaptationFrequency: 10000, // 10 seconds
    minimumInteractionTime: 30000, // 30 seconds
    adaptationSensitivity: 0.7,
    adaptationTypes: ['difficulty', 'pacing', 'hints', 'encouragement'],
    confidenceThreshold: 0.6
  }
  
  // Main real-time adaptation method
  async adaptInRealTime(context: RealTimeContext): Promise<AdaptationResult[]> {
    // Check if enough time has passed for meaningful adaptation
    if (context.currentInteraction.timeSpent < this.config.minimumInteractionTime / 1000) {
      return []
    }
    
    // Analyze current performance and behavior
    const performanceAnalysis = this.analyzeCurrentPerformance(context)
    const behaviorAnalysis = this.analyzeBehaviorPatterns(context)
    const frustrationAnalysis = this.analyzeFrustrationLevel(context)
    const engagementAnalysis = this.analyzeEngagementLevel(context)
    
    // Determine if adaptation is needed
    const adaptationNeeds = this.identifyAdaptationNeeds(
      performanceAnalysis,
      behaviorAnalysis,
      frustrationAnalysis,
      engagementAnalysis
    )
    
    // Generate adaptation actions
    const adaptationActions = await this.generateAdaptationActions(
      adaptationNeeds,
      context
    )
    
    // Apply high-priority adaptations immediately
    const results: AdaptationResult[] = []
    for (const action of adaptationActions) {
      if (action.timing === 'immediate' && action.confidence >= this.config.confidenceThreshold) {
        const result = await this.applyAdaptation(action, context)
        results.push(result)
      }
    }
    
    return results
  }
  
  // Analyze current performance indicators
  private analyzeCurrentPerformance(context: RealTimeContext): any {
    const interaction = context.currentInteraction
    const timeSpent = interaction.timeSpent
    const attempts = interaction.attempts
    const helpRequests = interaction.helpRequests
    
    // Calculate performance metrics
    const expectedTimeRange = this.getExpectedTimeRange(context.contentId, context.userProfile)
    const timePerformance = this.calculateTimePerformance(timeSpent, expectedTimeRange)
    const attemptPerformance = this.calculateAttemptPerformance(attempts)
    const independenceLevel = this.calculateIndependenceLevel(helpRequests, timeSpent)
    
    // Detect performance issues
    const strugglingSignals = this.detectStrugglingSignals(interaction)
    const advancedSignals = this.detectAdvancedSignals(interaction)
    
    return {
      timePerformance,
      attemptPerformance,
      independenceLevel,
      strugglingSignals,
      advancedSignals,
      overallPerformance: (timePerformance + attemptPerformance + independenceLevel) / 3
    }
  }
  
  // Analyze behavior patterns for adaptation insights
  private analyzeBehaviorPatterns(context: RealTimeContext): any {
    const interaction = context.currentInteraction
    const scroll = interaction.scrollBehavior
    const clicks = interaction.clickPatterns
    const pauses = interaction.pauseEvents
    
    // Analyze interaction patterns
    const readingSpeed = this.calculateReadingSpeed(scroll, context.currentInteraction.timeSpent)
    const focusLevel = this.calculateFocusLevel(pauses, clicks)
    const explorationStyle = this.analyzeExplorationStyle(scroll, clicks)
    const comprehensionIndicators = this.analyzeComprehensionIndicators(scroll, pauses)
    
    return {
      readingSpeed,
      focusLevel,
      explorationStyle,
      comprehensionIndicators,
      needsSlowerPacing: readingSpeed < 0.3,
      needsFasterPacing: readingSpeed > 0.8 && focusLevel > 0.7,
      needsMoreSupport: focusLevel < 0.4,
      needsMoreChallenge: focusLevel > 0.8 && comprehensionIndicators.confident
    }
  }
  
  // Analyze frustration levels
  private analyzeFrustrationLevel(context: RealTimeContext): any {
    const frustrationIndicators = context.currentInteraction.frustrationIndicators
    const recentIndicators = frustrationIndicators.filter(
      indicator => Date.now() - indicator.timestamp.getTime() < 60000 // Last minute
    )
    
    let frustrationScore = 0
    let primaryFrustrationSource = ''
    
    recentIndicators.forEach(indicator => {
      frustrationScore += indicator.intensity
      if (!primaryFrustrationSource && indicator.intensity > 0.5) {
        primaryFrustrationSource = indicator.type
      }
    })
    
    frustrationScore = Math.min(1, frustrationScore / recentIndicators.length)
    
    return {
      frustrationScore,
      primaryFrustrationSource,
      recentFrustrationEvents: recentIndicators.length,
      needsImmedateSupport: frustrationScore > 0.7,
      needsEncouragement: frustrationScore > 0.4,
      recommendedAction: this.getFrustrationRecommendation(frustrationScore, primaryFrustrationSource)
    }
  }
  
  // Analyze engagement levels
  private analyzeEngagementLevel(context: RealTimeContext): any {
    const interaction = context.currentInteraction
    const engagementLevel = interaction.engagementLevel
    const timeSpent = interaction.timeSpent
    const lastActivity = Date.now() - interaction.lastActivity.getTime()
    
    // Calculate engagement metrics
    const attentionSpan = this.calculateAttentionSpan(interaction.pauseEvents, timeSpent)
    const interactionQuality = this.calculateInteractionQuality(interaction.clickPatterns, timeSpent)
    const sustainedEngagement = this.calculateSustainedEngagement(timeSpent, engagementLevel)
    
    return {
      currentEngagement: engagementLevel,
      attentionSpan,
      interactionQuality,
      sustainedEngagement,
      needsReengagement: engagementLevel < 0.4 || lastActivity > 30000,
      needsBreak: attentionSpan < 60 && timeSpent > 600, // Less than 1 min attention after 10 min
      needsVariety: sustainedEngagement < 0.5 && timeSpent > 300
    }
  }
  
  // Identify what types of adaptation are needed
  private identifyAdaptationNeeds(
    performance: any,
    behavior: any,
    frustration: any,
    engagement: any
  ): AdaptationType[] {
    const needs: AdaptationType[] = []
    
    // Difficulty adjustments
    if (performance.strugglingSignals.length > 2 || frustration.frustrationScore > 0.6) {
      needs.push('difficulty')
    }
    if (performance.advancedSignals.length > 2 && frustration.frustrationScore < 0.2) {
      needs.push('difficulty')
    }
    
    // Pacing adjustments
    if (behavior.needsSlowerPacing || engagement.needsBreak) {
      needs.push('pacing')
    }
    if (behavior.needsFasterPacing && engagement.currentEngagement > 0.7) {
      needs.push('pacing')
    }
    
    // Support mechanisms
    if (behavior.needsMoreSupport || frustration.needsImmedateSupport) {
      needs.push('hints')
      needs.push('examples')
    }
    
    // Encouragement
    if (frustration.needsEncouragement || engagement.needsReengagement) {
      needs.push('encouragement')
    }
    
    // Content format changes
    if (engagement.needsVariety || behavior.explorationStyle === 'exploratory') {
      needs.push('content_format')
    }
    
    // Break suggestions
    if (engagement.needsBreak || frustration.frustrationScore > 0.8) {
      needs.push('break_suggestion')
    }
    
    return needs
  }
  
  // Generate specific adaptation actions
  private async generateAdaptationActions(
    needs: AdaptationType[],
    context: RealTimeContext
  ): Promise<AdaptationAction[]> {
    const actions: AdaptationAction[] = []
    
    for (const need of needs) {
      const action = await this.createAdaptationAction(need, context)
      if (action) {
        actions.push(action)
      }
    }
    
    // Sort by priority and confidence
    return actions.sort((a, b) => {
      const priorityA = this.getAdaptationPriority(a.type)
      const priorityB = this.getAdaptationPriority(b.type)
      if (priorityA !== priorityB) return priorityB - priorityA
      return b.confidence - a.confidence
    })
  }
  
  // Create specific adaptation action
  private async createAdaptationAction(
    type: AdaptationType,
    context: RealTimeContext
  ): Promise<AdaptationAction | null> {
    const interaction = context.currentInteraction
    const baseConfidence = 0.7
    
    switch (type) {
      case 'difficulty':
        return {
          type: 'difficulty',
          intensity: 0.7,
          trigger: 'performance_analysis',
          confidence: baseConfidence,
          timing: 'next_content',
          parameters: { new_difficulty: 5 },
          expectedDuration: 300,
          success_criteria: ['improved_accuracy', 'maintained_engagement'],
          rollback_threshold: 0.3
        } // TODO: Implement createDifficultyAction method
      
      case 'pacing':
        return {
          type: 'pacing',
          intensity: interaction.engagementLevel < 0.4 ? 0.8 : 0.5,
          trigger: 'engagement_analysis',
          confidence: baseConfidence,
          timing: 'immediate',
          parameters: {
            slowDown: interaction.engagementLevel < 0.4,
            suggestBreak: interaction.timeSpent > 600 && interaction.engagementLevel < 0.3,
            reduceContent: interaction.frustrationIndicators.length > 2
          },
          expectedDuration: 300000, // 5 minutes
          success_criteria: ['improved_engagement', 'reduced_frustration'],
          rollback_threshold: 0.3
        }
      
      case 'hints':
        return {
          type: 'hints',
          intensity: Math.min(1, interaction.helpRequests * 0.3 + 0.4),
          trigger: 'performance_analysis',
          confidence: baseConfidence + (interaction.helpRequests * 0.1),
          timing: 'immediate',
          parameters: {
            hintLevel: interaction.helpRequests > 2 ? 'detailed' : 'subtle',
            hintType: this.determineHintType(context),
            showProgressively: true
          },
          expectedDuration: 60000, // 1 minute
          success_criteria: ['user_progression', 'reduced_help_requests'],
          rollback_threshold: 0.4
        }
      
      case 'encouragement':
        return {
          type: 'encouragement',
          intensity: Math.max(0.3, interaction.frustrationIndicators.length * 0.2),
          trigger: 'frustration_analysis',
          confidence: baseConfidence,
          timing: 'immediate',
          parameters: {
            messageType: this.determineEncouragementType(context),
            showProgress: true,
            highlightAchievements: true
          },
          expectedDuration: 30000, // 30 seconds
          success_criteria: ['improved_mood', 'continued_engagement'],
          rollback_threshold: 0.2
        }
      
      case 'examples':
        return {
          type: 'examples',
          intensity: 0.6,
          trigger: 'comprehension_analysis',
          confidence: baseConfidence,
          timing: 'next_interaction',
          parameters: {
            exampleType: 'practical',
            showStep_by_step: true,
            interactiveExamples: context.userProfile.age_group !== 'child'
          },
          expectedDuration: 120000, // 2 minutes
          success_criteria: ['improved_understanding', 'successful_application'],
          rollback_threshold: 0.3
        }
      
      case 'content_format':
        return {
          type: 'content_format',
          intensity: 0.5,
          trigger: 'engagement_analysis',
          confidence: baseConfidence - 0.1,
          timing: 'next_content',
          parameters: {
            addVisuals: interaction.scrollBehavior.scrollCompletionRate < 0.5,
            addAudio: context.environmentalFactors.deviceType === 'mobile',
            addInteractivity: interaction.engagementLevel < 0.4
          },
          expectedDuration: 180000, // 3 minutes
          success_criteria: ['increased_engagement', 'better_comprehension'],
          rollback_threshold: 0.3
        }
      
      case 'break_suggestion':
        return {
          type: 'break_suggestion',
          intensity: Math.min(1, interaction.timeSpent / 600), // Scale with time spent
          trigger: 'fatigue_analysis',
          confidence: baseConfidence + 0.1,
          timing: 'immediate',
          parameters: {
            breakType: interaction.timeSpent > 1200 ? 'long' : 'short',
            suggestedActivity: this.suggestBreakActivity(context),
            saveProgress: true
          },
          expectedDuration: 0, // Break duration varies
          success_criteria: ['user_takes_break', 'refreshed_return'],
          rollback_threshold: 0.1
        }
      
      default:
        return null
    }
  }
  
  // Apply adaptation action
  private async applyAdaptation(
    action: AdaptationAction,
    context: RealTimeContext
  ): Promise<AdaptationResult> {
    try {
      // Record the adaptation attempt
      this.recordAdaptation(context.sessionId, action)
      
      // Generate the adaptation result based on action type
      const result = await this.executeAdaptation(action, context)
      
      // Track active adaptations
      if (!this.activeAdaptations.has(context.sessionId)) {
        this.activeAdaptations.set(context.sessionId, [])
      }
      this.activeAdaptations.get(context.sessionId)?.push(action)
      
      return {
        applied: true,
        action,
        ...result
      }
      
    } catch (error) {
      console.error('Failed to apply adaptation:', error)
      return {
        applied: false,
        action,
        systemMessage: 'Adaptation could not be applied at this time'
      }
    }
  }
  
  // Execute specific adaptation
  private async executeAdaptation(
    action: AdaptationAction,
    context: RealTimeContext
  ): Promise<Partial<AdaptationResult>> {
    switch (action.type) {
      case 'hints':
        return {
          visualFeedback: {
            type: 'tooltip',
            content: this.generateHintContent(action.parameters, context),
            duration: 10000,
            style: { 
              backgroundColor: '#3b82f6', 
              color: 'white',
              padding: '12px',
              borderRadius: '8px'
            }
          },
          systemMessage: 'Hint available - click the help icon for guidance'
        }
      
      case 'encouragement':
        return {
          visualFeedback: {
            type: 'popup',
            content: this.generateEncouragementMessage(action.parameters, context),
            duration: 8000,
            style: {
              backgroundColor: '#10b981',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }
          }
        }
      
      case 'break_suggestion':
        return {
          visualFeedback: {
            type: 'overlay',
            content: this.generateBreakSuggestion(action.parameters, context),
            duration: 0, // User dismissible
            style: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '24px',
              borderRadius: '16px'
            }
          },
          systemMessage: 'Break time suggested - your mind needs a rest!'
        }
      
      case 'pacing':
        return {
          adaptedContent: {
            metadata: {
              contentId: context.contentId,
              adaptedPacing: action.parameters.slowDown ? 'slower' : 'faster',
              suggestedBreaks: action.parameters.suggestBreak,
              reducedContent: action.parameters.reduceContent
            }
          },
          systemMessage: action.parameters.slowDown ? 
            'Content pacing adjusted for better comprehension' :
            'Content pace increased to match your learning speed'
        }
      
      default:
        return {
          systemMessage: `Applied ${action.type} adaptation`
        }
    }
  }
  
  // Helper methods for analysis
  private getExpectedTimeRange(contentId: string, userProfile: UserProfile): { min: number; max: number } {
    // Would be based on content metadata and user history
    const baseTime = 300 // 5 minutes default
    const levelMultiplier = userProfile.level === 'beginner' ? 1.5 : 
                           userProfile.level === 'intermediate' ? 1.0 : 0.8
    
    return {
      min: baseTime * levelMultiplier * 0.7,
      max: baseTime * levelMultiplier * 1.8
    }
  }
  
  private calculateTimePerformance(timeSpent: number, expectedRange: { min: number; max: number }): number {
    if (timeSpent < expectedRange.min) return 0.3 // Too fast, might be skipping
    if (timeSpent > expectedRange.max) return 0.4 // Too slow, might be struggling
    return 0.8 // Good pace
  }
  
  private calculateAttemptPerformance(attempts: number): number {
    if (attempts === 1) return 1.0
    if (attempts <= 3) return 0.7
    if (attempts <= 5) return 0.5
    return 0.3
  }
  
  private calculateIndependenceLevel(helpRequests: number, timeSpent: number): number {
    const helpRate = helpRequests / (timeSpent / 60) // requests per minute
    if (helpRate === 0) return 1.0
    if (helpRate < 0.5) return 0.8
    if (helpRate < 1) return 0.6
    return 0.3
  }
  
  private detectStrugglingSignals(interaction: CurrentInteraction): string[] {
    const signals = []
    if (interaction.helpRequests > 2) signals.push('excessive_help_requests')
    if (interaction.attempts > 3) signals.push('multiple_attempts')
    if (interaction.frustrationIndicators.length > 2) signals.push('frustration_indicators')
    if (interaction.scrollBehavior.backScrollEvents > 5) signals.push('confusion_scrolling')
    if (interaction.pauseEvents.filter(p => p.duration > 30).length > 3) signals.push('long_pauses')
    return signals
  }
  
  private detectAdvancedSignals(interaction: CurrentInteraction): string[] {
    const signals = []
    if (interaction.attempts === 1 && interaction.helpRequests === 0) signals.push('first_try_success')
    if (interaction.timeSpent < 120 && interaction.scrollBehavior.scrollCompletionRate > 0.8) signals.push('quick_completion')
    if (interaction.engagementLevel > 0.8) signals.push('high_engagement')
    if (interaction.scrollBehavior.averageScrollSpeed > 1.2) signals.push('fast_processing')
    return signals
  }
  
  private calculateReadingSpeed(scroll: ScrollPattern, timeSpent: number): number {
    const wordsPerMinute = 200 // Average reading speed
    const estimatedWords = scroll.scrollCompletionRate * 500 // Estimate based on scroll
    const actualWPM = (estimatedWords / (timeSpent / 60))
    return Math.min(1, actualWPM / wordsPerMinute)
  }
  
  private calculateFocusLevel(pauses: PauseEvent[], clicks: ClickPattern[]): number {
    const longPauses = pauses.filter(p => p.duration > 15).length
    const shortBursts = clicks.filter(c => c.clickCount > 3).length
    const focusScore = Math.max(0, 1 - (longPauses * 0.2) - (shortBursts * 0.1))
    return focusScore
  }
  
  private analyzeExplorationStyle(scroll: ScrollPattern, clicks: ClickPattern[]): string {
    if (scroll.backScrollEvents > 5 && clicks.length > 10) return 'exploratory'
    if (scroll.averageScrollSpeed < 0.5 && clicks.length < 3) return 'methodical'
    if (clicks.length > 8) return 'active'
    return 'passive'
  }
  
  private analyzeComprehensionIndicators(scroll: ScrollPattern, pauses: PauseEvent[]): any {
    const thoughtfulPauses = pauses.filter(p => p.duration > 5 && p.duration < 30).length
    const reviewScrolls = scroll.backScrollEvents
    const timeDistribution = scroll.timeAtTop + scroll.timeAtBottom
    
    return {
      confident: thoughtfulPauses > 2 && reviewScrolls < 3,
      reviewing: reviewScrolls > 3,
      processing: thoughtfulPauses > 5,
      comprehensive: timeDistribution > 0.6
    }
  }
  
  private getFrustrationRecommendation(score: number, source: string): string {
    if (score > 0.8) return 'immediate_intervention'
    if (score > 0.6) return 'provide_support'
    if (score > 0.4) return 'monitor_closely'
    return 'continue_normal'
  }
  
  private getAdaptationPriority(type: AdaptationType): number {
    const priorities = {
      'break_suggestion': 10,
      'encouragement': 9,
      'difficulty': 8,
      'hints': 7,
      'pacing': 6,
      'examples': 5,
      'content_format': 4
    }
    return priorities[type] || 3
  }
  
  private recordAdaptation(sessionId: string, action: AdaptationAction): void {
    if (!this.adaptationHistory.has(sessionId)) {
      this.adaptationHistory.set(sessionId, [])
    }
    this.adaptationHistory.get(sessionId)?.push(action)
  }
  
  // Content generation methods
  private generateHintContent(parameters: any, context: RealTimeContext): string {
    const hintLevel = parameters.hintLevel
    const subject = context.userProfile.subject
    
    if (hintLevel === 'detailed') {
      return `💡 Detailed Hint: Let's break this down step by step. Focus on the key concept in ${subject} and try applying the basic principles you've learned.`
    } else {
      return `💭 Quick Tip: Remember the fundamentals of ${subject} - you've got this!`
    }
  }
  
  private generateEncouragementMessage(parameters: any, context: RealTimeContext): string {
    const messageType = parameters.messageType || 'general'
    const name = context.userProfile.name || 'there'
    
    const messages = {
      general: `🌟 Great effort, ${name}! You're making real progress. Keep going!`,
      struggling: `💪 Don't give up, ${name}! Learning takes time, and you're doing better than you think.`,
      breakthrough: `🎉 Excellent work, ${name}! You're really getting the hang of this.`,
      persistence: `🔥 Your persistence is paying off, ${name}! Each attempt is making you stronger.`
    }
    
    return messages[messageType] || messages.general
  }
  
  private generateBreakSuggestion(parameters: any, context: RealTimeContext): string {
    const breakType = parameters.breakType
    const activity = parameters.suggestedActivity
    
    if (breakType === 'long') {
      return `🧘‍♀️ Time for a proper break! You've been learning for a while. Try ${activity} and come back refreshed in 10-15 minutes.`
    } else {
      return `☕ Quick break time! Take 2-3 minutes to ${activity} and return with fresh energy.`
    }
  }
  
  private suggestBreakActivity(context: RealTimeContext): string {
    const activities = ['stretch your legs', 'take deep breaths', 'look away from the screen', 'grab some water', 'do some light stretching']
    return activities[Math.floor(Math.random() * activities.length)]
  }
  
  private determineHintType(context: RealTimeContext): string {
    const subject = context.userProfile.subject
    if (subject === 'Mathematics') return 'formula_reminder'
    if (subject === 'Science') return 'concept_explanation'
    if (subject === 'Language') return 'grammar_tip'
    return 'general_guidance'
  }
  
  private determineEncouragementType(context: RealTimeContext): string {
    const frustrationCount = context.currentInteraction.frustrationIndicators.length
    if (frustrationCount > 3) return 'struggling'
    if (context.currentInteraction.engagementLevel > 0.7) return 'breakthrough'
    if (context.currentInteraction.attempts > 2) return 'persistence'
    return 'general'
  }
  
  private calculateAttentionSpan(pauses: PauseEvent[], totalTime: number): number {
    const meaningfulPauses = pauses.filter(p => p.duration > 10)
    if (meaningfulPauses.length === 0) return totalTime
    
    const gaps = meaningfulPauses.map(p => p.duration)
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
    return Math.max(60, 300 - averageGap) // Estimate attention span
  }
  
  private calculateInteractionQuality(clicks: ClickPattern[], timeSpent: number): number {
    const clickRate = clicks.length / (timeSpent / 60) // clicks per minute
    const doubleClickRate = clicks.filter(c => c.doubleClicks > 0).length / clicks.length
    
    // Good interaction: 1-5 clicks per minute, low double-click rate
    const qualityScore = Math.max(0, Math.min(1, 
      (1 - Math.abs(clickRate - 3) / 5) * (1 - doubleClickRate * 2)
    ))
    
    return qualityScore
  }
  
  private calculateSustainedEngagement(timeSpent: number, currentEngagement: number): number {
    // Sustained engagement decreases over time if not maintained
    const timeDecay = Math.max(0.3, 1 - (timeSpent / 1800)) // Decay over 30 minutes
    return currentEngagement * timeDecay
  }
}

// Export singleton instance
export const realTimeAdaptationEngine = new RealTimeAdaptationEngine()

// Utility functions for integration
export function createRealTimeContext(
  sessionId: string,
  contentId: string,
  userProfile: UserProfile,
  interactionData: any
): RealTimeContext {
  return {
    sessionId,
    startTime: new Date(Date.now() - (interactionData.timeSpent * 1000)),
    contentId,
    userProfile,
    currentInteraction: {
      timeSpent: interactionData.timeSpent || 0,
      scrollBehavior: interactionData.scrollBehavior || {
        totalScrolls: 0,
        averageScrollSpeed: 0.5,
        backScrollEvents: 0,
        timeAtTop: 0,
        timeAtBottom: 0,
        scrollCompletionRate: 0.5
      },
      clickPatterns: interactionData.clickPatterns || [],
      pauseEvents: interactionData.pauseEvents || [],
      helpRequests: interactionData.helpRequests || 0,
      attempts: interactionData.attempts || 1,
      lastActivity: new Date(),
      frustrationIndicators: interactionData.frustrationIndicators || [],
      engagementLevel: interactionData.engagementLevel || 0.7
    },
    recentBehavior: {
      attentionSpan: 180, // 3 minutes default
      preferredPacing: 0.7,
      comprehensionRate: 0.8,
      interactionStyle: 'methodical',
      strugglingIndicators: [],
      successIndicators: []
    },
    environmentalFactors: {
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                 new Date().getHours() < 17 ? 'afternoon' : 'evening',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()],
      deviceType: /Mobile|Android|iP(hone|od|ad)/.test(navigator.userAgent) ? 'mobile' : 'desktop',
      screenSize: { width: window.innerWidth || 1920, height: window.innerHeight || 1080 },
      connectionSpeed: 'fast',
      notificationCount: 0
    }
  }
}
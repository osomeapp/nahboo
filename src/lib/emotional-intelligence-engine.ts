'use client'

import { multiModelAI } from './multi-model-ai'

// Core emotional intelligence types
export interface EmotionalState {
  id: string
  timestamp: Date
  userId: string
  sessionId: string
  primary_emotion: EmotionType
  secondary_emotions: EmotionType[]
  intensity: number // 0-1 scale
  valence: number // -1 to 1 (negative to positive)
  arousal: number // 0-1 (calm to excited)
  confidence: number // 0-1 confidence in assessment
  triggers: string[] // What caused this emotional state
  context: {
    activity: string
    subject: string
    difficulty_level: number
    performance_indicator: 'struggling' | 'neutral' | 'succeeding'
    social_context: 'individual' | 'peer_interaction' | 'teacher_interaction'
  }
}

export type EmotionType = 
  | 'joy' | 'excitement' | 'pride' | 'satisfaction' | 'curiosity' | 'enthusiasm'
  | 'frustration' | 'anxiety' | 'confusion' | 'disappointment' | 'boredom' | 'overwhelm'
  | 'determination' | 'focus' | 'calm' | 'confidence' | 'surprise' | 'interest'
  | 'anger' | 'sadness' | 'fear' | 'disgust' | 'contempt' | 'shame'

export interface EmotionalProfile {
  userId: string
  emotional_patterns: {
    frequent_emotions: EmotionType[]
    stress_triggers: string[]
    motivation_drivers: string[]
    optimal_emotional_states: EmotionType[]
    learning_preferences: {
      preferred_difficulty_progression: 'gradual' | 'challenging' | 'adaptive'
      preferred_feedback_style: 'immediate' | 'delayed' | 'comprehensive'
      preferred_social_setting: 'individual' | 'small_group' | 'large_group'
    }
  }
  resilience_indicators: {
    frustration_tolerance: number // 0-1
    recovery_speed: number // 0-1 (how quickly they bounce back)
    help_seeking_tendency: number // 0-1
    persistence_level: number // 0-1
  }
  emotional_intelligence_scores: {
    self_awareness: number // 0-1
    self_regulation: number // 0-1
    motivation: number // 0-1
    empathy: number // 0-1
    social_skills: number // 0-1
    overall_eq: number // 0-1
  }
  last_updated: Date
}

export interface EmotionalIntervention {
  id: string
  emotion_triggers: EmotionType[]
  intervention_type: InterventionType
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  description: string
  techniques: EmotionalTechnique[]
  expected_outcome: string
  estimated_duration: number // minutes
  success_criteria: string[]
  follow_up_actions: string[]
}

export type InterventionType = 
  | 'breathing_exercise' | 'mindfulness' | 'cognitive_reframing' | 'break_suggestion'
  | 'encouragement' | 'strategy_adjustment' | 'peer_support' | 'teacher_notification'
  | 'content_modification' | 'goal_adjustment' | 'celebration' | 'reflection_prompt'

export interface EmotionalTechnique {
  id: string
  name: string
  description: string
  instructions: string[]
  duration: number // minutes
  age_appropriate: string[] // age groups
  effectiveness_rating: number // 0-1
  prerequisites: string[]
}

export interface EmotionalInsight {
  id: string
  userId: string
  insight_type: 'pattern' | 'trigger' | 'strength' | 'growth_area' | 'recommendation'
  title: string
  description: string
  evidence: string[]
  actionable_steps: string[]
  confidence: number // 0-1
  impact_level: 'low' | 'medium' | 'high'
  generated_at: Date
}

// Predefined emotional techniques
export const EMOTIONAL_TECHNIQUES: EmotionalTechnique[] = [
  {
    id: 'box_breathing',
    name: 'Box Breathing',
    description: 'A calming breathing technique to reduce anxiety and increase focus',
    instructions: [
      'Breathe in for 4 counts',
      'Hold your breath for 4 counts',
      'Breathe out for 4 counts',
      'Hold empty for 4 counts',
      'Repeat 4-6 times'
    ],
    duration: 3,
    age_appropriate: ['middle school', 'high school', 'college', 'adult'],
    effectiveness_rating: 0.85,
    prerequisites: []
  },
  {
    id: 'balloon_breathing',
    name: 'Balloon Breathing',
    description: 'Simple breathing exercise for younger learners',
    instructions: [
      'Imagine you have a balloon in your belly',
      'Breathe in slowly to fill the balloon',
      'Hold for 2 seconds',
      'Breathe out slowly to deflate the balloon',
      'Repeat 5 times'
    ],
    duration: 2,
    age_appropriate: ['elementary', 'middle school'],
    effectiveness_rating: 0.75,
    prerequisites: []
  },
  {
    id: 'positive_self_talk',
    name: 'Positive Self-Talk',
    description: 'Reframe negative thoughts with positive affirmations',
    instructions: [
      'Identify the negative thought',
      'Challenge its accuracy',
      'Replace with a positive, realistic statement',
      'Repeat the positive statement 3 times',
      'Focus on your strengths and past successes'
    ],
    duration: 5,
    age_appropriate: ['middle school', 'high school', 'college', 'adult'],
    effectiveness_rating: 0.8,
    prerequisites: ['self_awareness']
  },
  {
    id: 'mindful_minute',
    name: 'Mindful Minute',
    description: 'Quick mindfulness exercise to center yourself',
    instructions: [
      'Sit comfortably and close your eyes',
      'Focus on your breathing',
      'Notice 3 things you can hear',
      'Notice 2 things you can feel',
      'Notice 1 thing you can smell',
      'Take 3 deep breaths and open your eyes'
    ],
    duration: 1,
    age_appropriate: ['elementary', 'middle school', 'high school', 'college', 'adult'],
    effectiveness_rating: 0.7,
    prerequisites: []
  },
  {
    id: 'growth_mindset_reminder',
    name: 'Growth Mindset Reminder',
    description: 'Shift from fixed to growth mindset thinking',
    instructions: [
      'Replace "I can\'t do this" with "I can\'t do this yet"',
      'Remember that challenges help your brain grow',
      'Think of a time you learned something difficult',
      'Focus on the process, not just the outcome',
      'Celebrate small improvements'
    ],
    duration: 3,
    age_appropriate: ['elementary', 'middle school', 'high school', 'college', 'adult'],
    effectiveness_rating: 0.85,
    prerequisites: []
  }
]

// Main emotional intelligence engine
export class EmotionalIntelligenceEngine {
  private emotionalStates: Map<string, EmotionalState[]> = new Map()
  private emotionalProfiles: Map<string, EmotionalProfile> = new Map()
  private interventions: Map<string, EmotionalIntervention[]> = new Map()
  private techniques: Map<string, EmotionalTechnique> = new Map()

  constructor() {
    // Initialize predefined techniques
    EMOTIONAL_TECHNIQUES.forEach(technique => {
      this.techniques.set(technique.id, technique)
    })
  }

  // Assess emotional state from various inputs
  async assessEmotionalState(
    userId: string,
    sessionId: string,
    inputs: {
      text?: string // Written responses, chat messages
      behavior?: {
        response_time: number
        error_rate: number
        help_seeking: boolean
        task_switching: number
        engagement_level: number
      }
      performance?: {
        current_score: number
        expected_score: number
        difficulty_level: number
        attempts: number
      }
      context: EmotionalState['context']
    }
  ): Promise<EmotionalState> {
    try {
      // Combine multiple assessment methods
      const textAnalysis = inputs.text 
        ? await this.analyzeTextualEmotions(inputs.text, inputs.context)
        : null

      const behaviorAnalysis = inputs.behavior
        ? this.analyzeBehavioralIndicators(inputs.behavior, inputs.context)
        : null

      const performanceAnalysis = inputs.performance
        ? this.analyzePerformanceEmotions(inputs.performance, inputs.context)
        : null

      // Synthesize assessments
      const emotionalState = await this.synthesizeEmotionalAssessments({
        textAnalysis,
        behaviorAnalysis,
        performanceAnalysis,
        userId,
        sessionId,
        context: inputs.context
      })

      // Store the assessment
      if (!this.emotionalStates.has(userId)) {
        this.emotionalStates.set(userId, [])
      }
      this.emotionalStates.get(userId)!.push(emotionalState)

      // Update emotional profile
      await this.updateEmotionalProfile(userId)

      // Check for intervention needs
      await this.checkInterventionNeeds(userId, emotionalState)

      return emotionalState
    } catch (error) {
      console.error('Error assessing emotional state:', error)
      
      // Return neutral state as fallback
      return this.createNeutralEmotionalState(userId, sessionId, inputs.context)
    }
  }

  // Analyze emotions from text using AI
  private async analyzeTextualEmotions(
    text: string,
    context: EmotionalState['context']
  ): Promise<{
    primary_emotion: EmotionType
    secondary_emotions: EmotionType[]
    intensity: number
    valence: number
    arousal: number
    confidence: number
    triggers: string[]
  }> {
    const prompt = `Analyze the emotional content of this text from a learning context.

Text: "${text}"

Learning Context:
- Activity: ${context.activity}
- Subject: ${context.subject}
- Difficulty: ${context.difficulty_level}/10
- Performance: ${context.performance_indicator}
- Social setting: ${context.social_context}

Provide a JSON analysis with:
{
  "primary_emotion": "emotion_name", // Most prominent emotion from: joy, excitement, pride, satisfaction, curiosity, enthusiasm, frustration, anxiety, confusion, disappointment, boredom, overwhelm, determination, focus, calm, confidence, surprise, interest, anger, sadness, fear, disgust, contempt, shame
  "secondary_emotions": ["emotion1", "emotion2"], // Up to 3 secondary emotions
  "intensity": number, // 0-1 scale, how strong the emotion is
  "valence": number, // -1 to 1, how positive/negative
  "arousal": number, // 0-1, how calm/excited
  "confidence": number, // 0-1, confidence in this assessment
  "triggers": ["trigger1", "trigger2"] // What in the text/context suggests these emotions
}

Consider:
- Language tone and word choice
- Learning-specific emotions (academic frustration, curiosity, etc.)
- Context-appropriate emotional responses
- Age-appropriate emotional expression`

    try {
      const response = await multiModelAI.generateContent({
        useCase: 'content_explanation',
        userProfile: { subject: 'emotional', level: 'expert', age_group: 'adult', use_case: 'personal' } as any,
        context: prompt,
        requestType: 'explanation',
        priority: 'medium',
        temperature: 0.3,
        maxTokens: 300
      })

      const analysis = JSON.parse(response.content)
      
      return {
        primary_emotion: analysis.primary_emotion || 'calm',
        secondary_emotions: analysis.secondary_emotions || [],
        intensity: Math.max(0, Math.min(1, analysis.intensity || 0.5)),
        valence: Math.max(-1, Math.min(1, analysis.valence || 0)),
        arousal: Math.max(0, Math.min(1, analysis.arousal || 0.5)),
        confidence: Math.max(0, Math.min(1, analysis.confidence || 0.5)),
        triggers: analysis.triggers || []
      }
    } catch (error) {
      console.error('Error analyzing textual emotions:', error)
      
      // Return neutral analysis
      return {
        primary_emotion: 'calm',
        secondary_emotions: [],
        intensity: 0.3,
        valence: 0,
        arousal: 0.3,
        confidence: 0.2,
        triggers: ['text_analysis_failed']
      }
    }
  }

  // Analyze behavioral indicators
  private analyzeBehavioralIndicators(
    behavior: {
      response_time: number
      error_rate: number
      help_seeking: boolean
      task_switching: number
      engagement_level: number
    },
    context: EmotionalState['context']
  ): {
    primary_emotion: EmotionType
    intensity: number
    confidence: number
    triggers: string[]
  } {
    let primary_emotion: EmotionType = 'calm'
    let intensity = 0.5
    let confidence = 0.7
    const triggers: string[] = []

    // Analyze response time patterns
    if (behavior.response_time > 10) { // Slow responses
      if (behavior.error_rate > 0.5) {
        primary_emotion = 'frustration'
        intensity = 0.7
        triggers.push('slow_responses_with_errors')
      } else {
        primary_emotion = 'confusion'
        intensity = 0.6
        triggers.push('slow_deliberate_responses')
      }
    } else if (behavior.response_time < 2) { // Very fast responses
      if (behavior.error_rate > 0.3) {
        primary_emotion = 'anxiety'
        intensity = 0.6
        triggers.push('rushed_responses_with_errors')
      } else {
        primary_emotion = 'confidence'
        intensity = 0.7
        triggers.push('quick_accurate_responses')
      }
    }

    // Analyze error patterns
    if (behavior.error_rate > 0.7) {
      primary_emotion = 'frustration'
      intensity = Math.min(1, intensity + 0.3)
      triggers.push('high_error_rate')
    } else if (behavior.error_rate < 0.1) {
      primary_emotion = 'satisfaction'
      intensity = 0.6
      triggers.push('low_error_rate')
    }

    // Analyze help-seeking behavior
    if (behavior.help_seeking) {
      if (primary_emotion === 'frustration') {
        triggers.push('seeking_help_when_frustrated')
      } else {
        primary_emotion = 'curiosity'
        intensity = 0.5
        triggers.push('proactive_help_seeking')
      }
    }

    // Analyze task switching (could indicate restlessness or confusion)
    if (behavior.task_switching > 3) {
      primary_emotion = 'boredom'
      intensity = 0.6
      triggers.push('frequent_task_switching')
    }

    // Analyze engagement level
    if (behavior.engagement_level < 0.3) {
      primary_emotion = 'boredom'
      intensity = 0.7
      triggers.push('low_engagement')
    } else if (behavior.engagement_level > 0.8) {
      if (primary_emotion === 'calm') {
        primary_emotion = 'focus'
        intensity = 0.8
        triggers.push('high_engagement')
      }
    }

    return {
      primary_emotion,
      intensity,
      confidence,
      triggers
    }
  }

  // Analyze performance-based emotions
  private analyzePerformanceEmotions(
    performance: {
      current_score: number
      expected_score: number
      difficulty_level: number
      attempts: number
    },
    context: EmotionalState['context']
  ): {
    primary_emotion: EmotionType
    intensity: number
    triggers: string[]
  } {
    const performance_gap = performance.current_score - performance.expected_score
    const normalized_gap = performance_gap / 100 // Assuming scores are 0-100
    
    let primary_emotion: EmotionType = 'calm'
    let intensity = 0.5
    const triggers: string[] = []

    // Analyze performance relative to expectations
    if (normalized_gap > 0.2) { // Exceeding expectations
      primary_emotion = 'pride'
      intensity = Math.min(1, 0.5 + normalized_gap)
      triggers.push('exceeding_expectations')
    } else if (normalized_gap < -0.3) { // Significantly underperforming
      primary_emotion = 'disappointment'
      intensity = Math.min(1, 0.5 + Math.abs(normalized_gap))
      triggers.push('underperforming')
    }

    // Consider difficulty level
    if (performance.difficulty_level > 8 && performance.current_score > 70) {
      primary_emotion = 'pride'
      intensity = 0.8
      triggers.push('succeeding_at_difficult_task')
    } else if (performance.difficulty_level < 3 && performance.current_score < 50) {
      primary_emotion = 'confusion'
      intensity = 0.6
      triggers.push('struggling_with_easy_task')
    }

    // Analyze attempt patterns
    if (performance.attempts > 5) {
      if (performance.current_score > performance.expected_score) {
        primary_emotion = 'determination'
        intensity = 0.7
        triggers.push('persistence_paid_off')
      } else {
        primary_emotion = 'frustration'
        intensity = 0.8
        triggers.push('many_unsuccessful_attempts')
      }
    }

    return {
      primary_emotion,
      intensity,
      triggers
    }
  }

  // Synthesize multiple emotional assessments
  private async synthesizeEmotionalAssessments(inputs: {
    textAnalysis: any
    behaviorAnalysis: any
    performanceAnalysis: any
    userId: string
    sessionId: string
    context: EmotionalState['context']
  }): Promise<EmotionalState> {
    // Weight the different analyses
    const weights = {
      text: 0.4,
      behavior: 0.35,
      performance: 0.25
    }

    let primary_emotion: EmotionType = 'calm'
    let intensity = 0.5
    let valence = 0
    let arousal = 0.5
    let confidence = 0.5
    const triggers: string[] = []
    const secondary_emotions: EmotionType[] = []

    // Combine text analysis
    if (inputs.textAnalysis) {
      primary_emotion = inputs.textAnalysis.primary_emotion
      intensity = inputs.textAnalysis.intensity * weights.text
      valence = inputs.textAnalysis.valence * weights.text
      arousal = inputs.textAnalysis.arousal * weights.text
      confidence = inputs.textAnalysis.confidence * weights.text
      triggers.push(...inputs.textAnalysis.triggers)
      secondary_emotions.push(...inputs.textAnalysis.secondary_emotions)
    }

    // Combine behavioral analysis
    if (inputs.behaviorAnalysis) {
      const behaviorWeight = weights.behavior
      
      // If behavior suggests a different primary emotion, blend them
      if (inputs.behaviorAnalysis.primary_emotion !== primary_emotion) {
        if (inputs.behaviorAnalysis.intensity > intensity / weights.text) {
          secondary_emotions.push(primary_emotion)
          primary_emotion = inputs.behaviorAnalysis.primary_emotion
        } else {
          secondary_emotions.push(inputs.behaviorAnalysis.primary_emotion)
        }
      }
      
      intensity += inputs.behaviorAnalysis.intensity * behaviorWeight
      confidence += inputs.behaviorAnalysis.confidence * behaviorWeight
      triggers.push(...inputs.behaviorAnalysis.triggers)
    }

    // Combine performance analysis
    if (inputs.performanceAnalysis) {
      const performanceWeight = weights.performance
      
      if (inputs.performanceAnalysis.primary_emotion !== primary_emotion) {
        secondary_emotions.push(inputs.performanceAnalysis.primary_emotion)
      }
      
      intensity += inputs.performanceAnalysis.intensity * performanceWeight
      triggers.push(...inputs.performanceAnalysis.triggers)
    }

    // Normalize values
    intensity = Math.max(0, Math.min(1, intensity))
    confidence = Math.max(0, Math.min(1, confidence))

    // Remove duplicate emotions from secondary emotions
    const uniqueSecondaryEmotions = [...new Set(secondary_emotions)]
      .filter(emotion => emotion !== primary_emotion)
      .slice(0, 3) // Keep top 3

    return {
      id: `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId: inputs.userId,
      sessionId: inputs.sessionId,
      primary_emotion,
      secondary_emotions: uniqueSecondaryEmotions,
      intensity,
      valence,
      arousal,
      confidence,
      triggers: [...new Set(triggers)],
      context: inputs.context
    }
  }

  // Create neutral emotional state for fallback
  private createNeutralEmotionalState(
    userId: string,
    sessionId: string,
    context: EmotionalState['context']
  ): EmotionalState {
    return {
      id: `emotion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userId,
      sessionId,
      primary_emotion: 'calm',
      secondary_emotions: [],
      intensity: 0.3,
      valence: 0,
      arousal: 0.3,
      confidence: 0.2,
      triggers: ['fallback_assessment'],
      context
    }
  }

  // Update user's emotional profile based on patterns
  private async updateEmotionalProfile(userId: string): Promise<void> {
    const userStates = this.emotionalStates.get(userId) || []
    if (userStates.length === 0) return

    const recentStates = userStates.slice(-20) // Last 20 emotional states
    
    // Calculate patterns
    const emotionCounts = recentStates.reduce((acc, state) => {
      acc[state.primary_emotion] = (acc[state.primary_emotion] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const frequent_emotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emotion]) => emotion as EmotionType)

    // Identify stress triggers
    const stressStates = recentStates.filter(state => 
      ['frustration', 'anxiety', 'overwhelm', 'anger'].includes(state.primary_emotion)
    )
    const stress_triggers = [...new Set(stressStates.flatMap(state => state.triggers))]

    // Calculate resilience indicators
    const frustrationStates = recentStates.filter(state => state.primary_emotion === 'frustration')
    const recoveryPatterns = this.analyzeRecoveryPatterns(recentStates)

    // Calculate EQ scores (simplified)
    const eq_scores = this.calculateEQScores(recentStates)

    const profile: EmotionalProfile = {
      userId,
      emotional_patterns: {
        frequent_emotions,
        stress_triggers,
        motivation_drivers: this.identifyMotivationDrivers(recentStates),
        optimal_emotional_states: ['focus', 'curiosity', 'satisfaction', 'determination'],
        learning_preferences: {
          preferred_difficulty_progression: this.inferDifficultyPreference(recentStates),
          preferred_feedback_style: this.inferFeedbackPreference(recentStates),
          preferred_social_setting: this.inferSocialPreference(recentStates)
        }
      },
      resilience_indicators: {
        frustration_tolerance: this.calculateFrustrationTolerance(recentStates),
        recovery_speed: recoveryPatterns.recovery_speed,
        help_seeking_tendency: this.calculateHelpSeekingTendency(recentStates),
        persistence_level: this.calculatePersistenceLevel(recentStates)
      },
      emotional_intelligence_scores: eq_scores,
      last_updated: new Date()
    }

    this.emotionalProfiles.set(userId, profile)
  }

  // Analyze recovery patterns from emotional states
  private analyzeRecoveryPatterns(states: EmotionalState[]): { recovery_speed: number } {
    const negativeEmotions = ['frustration', 'anxiety', 'disappointment', 'anger', 'sadness']
    let totalRecoveryTime = 0
    let recoveryCount = 0

    for (let i = 0; i < states.length - 1; i++) {
      if (negativeEmotions.includes(states[i].primary_emotion)) {
        // Look for recovery (positive emotion after negative)
        for (let j = i + 1; j < states.length; j++) {
          if (!negativeEmotions.includes(states[j].primary_emotion)) {
            const timeDiff = new Date(states[j].timestamp).getTime() - new Date(states[i].timestamp).getTime()
            totalRecoveryTime += timeDiff / (1000 * 60) // Convert to minutes
            recoveryCount++
            break
          }
        }
      }
    }

    const avgRecoveryTime = recoveryCount > 0 ? totalRecoveryTime / recoveryCount : 30 // Default 30 minutes
    // Convert to 0-1 scale (faster recovery = higher score)
    const recovery_speed = Math.max(0, Math.min(1, 1 - (avgRecoveryTime / 60))) // 1 hour = 0, 0 minutes = 1

    return { recovery_speed }
  }

  // Calculate emotional intelligence scores
  private calculateEQScores(states: EmotionalState[]): EmotionalProfile['emotional_intelligence_scores'] {
    // Simplified EQ calculation based on emotional patterns
    
    // Self-awareness: variety and accuracy of emotion recognition
    const emotionVariety = new Set(states.map(s => s.primary_emotion)).size
    const avgConfidence = states.reduce((sum, s) => sum + s.confidence, 0) / states.length || 0
    const self_awareness = Math.min(1, (emotionVariety / 10) * 0.6 + avgConfidence * 0.4)

    // Self-regulation: ability to manage negative emotions
    const negativeEmotions = states.filter(s => ['frustration', 'anxiety', 'anger'].includes(s.primary_emotion))
    const avgNegativeIntensity = negativeEmotions.reduce((sum, s) => sum + s.intensity, 0) / negativeEmotions.length || 0
    const self_regulation = Math.max(0, 1 - avgNegativeIntensity)

    // Motivation: persistence and positive emotions during challenges
    const challengingContexts = states.filter(s => s.context.difficulty_level > 6)
    const positiveInChallenges = challengingContexts.filter(s => 
      ['determination', 'curiosity', 'focus'].includes(s.primary_emotion)
    ).length
    const motivation = challengingContexts.length > 0 ? positiveInChallenges / challengingContexts.length : 0.5

    // Empathy and social skills (simplified - based on social context interactions)
    const socialInteractions = states.filter(s => 
      s.context.social_context !== 'individual'
    )
    const positiveSocial = socialInteractions.filter(s => 
      ['joy', 'satisfaction', 'curiosity'].includes(s.primary_emotion)
    ).length
    const empathy = socialInteractions.length > 0 ? positiveSocial / socialInteractions.length : 0.5
    const social_skills = empathy // Simplified

    const overall_eq = (self_awareness + self_regulation + motivation + empathy + social_skills) / 5

    return {
      self_awareness,
      self_regulation,
      motivation,
      empathy,
      social_skills,
      overall_eq
    }
  }

  // Helper methods for profile calculation
  private identifyMotivationDrivers(states: EmotionalState[]): string[] {
    const motivatingTriggers = states
      .filter(s => ['joy', 'excitement', 'pride', 'satisfaction'].includes(s.primary_emotion))
      .flatMap(s => s.triggers)

    const triggerCounts = motivatingTriggers.reduce((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(triggerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trigger]) => trigger)
  }

  private inferDifficultyPreference(states: EmotionalState[]): 'gradual' | 'challenging' | 'adaptive' {
    const easyTasks = states.filter(s => s.context.difficulty_level < 4)
    const hardTasks = states.filter(s => s.context.difficulty_level > 7)
    
    const easyPositive = easyTasks.filter(s => 
      ['satisfaction', 'joy', 'confidence'].includes(s.primary_emotion)
    ).length / (easyTasks.length || 1)

    const hardPositive = hardTasks.filter(s => 
      ['determination', 'focus', 'pride'].includes(s.primary_emotion)
    ).length / (hardTasks.length || 1)

    if (hardPositive > 0.6) return 'challenging'
    if (easyPositive > 0.8) return 'gradual'
    return 'adaptive'
  }

  private inferFeedbackPreference(states: EmotionalState[]): 'immediate' | 'delayed' | 'comprehensive' {
    // Simplified inference based on emotional patterns
    const anxietyStates = states.filter(s => s.primary_emotion === 'anxiety').length
    const totalStates = states.length

    if (anxietyStates / totalStates > 0.3) return 'immediate' // High anxiety prefers immediate feedback
    return 'comprehensive' // Default
  }

  private inferSocialPreference(states: EmotionalState[]): 'individual' | 'small_group' | 'large_group' {
    const socialContexts = states.reduce((acc, state) => {
      acc[state.context.social_context] = (acc[state.context.social_context] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostCommon = Object.entries(socialContexts)
      .sort(([,a], [,b]) => b - a)[0]

    return mostCommon ? mostCommon[0] as any : 'individual'
  }

  private calculateFrustrationTolerance(states: EmotionalState[]): number {
    const frustrationStates = states.filter(s => s.primary_emotion === 'frustration')
    const avgFrustrationIntensity = frustrationStates.reduce((sum, s) => sum + s.intensity, 0) / frustrationStates.length || 0
    
    // Higher tolerance = lower average frustration intensity
    return Math.max(0, 1 - avgFrustrationIntensity)
  }

  private calculateHelpSeekingTendency(states: EmotionalState[]): number {
    const helpSeekingTriggers = states.filter(s => 
      s.triggers.some(trigger => trigger.includes('help') || trigger.includes('seeking'))
    ).length
    
    return Math.min(1, helpSeekingTriggers / states.length * 2) // Normalize to 0-1
  }

  private calculatePersistenceLevel(states: EmotionalState[]): number {
    const persistenceTriggers = states.filter(s => 
      s.triggers.some(trigger => 
        trigger.includes('many_attempts') || 
        trigger.includes('persistence') ||
        s.primary_emotion === 'determination'
      )
    ).length
    
    return Math.min(1, persistenceTriggers / states.length * 3) // Normalize to 0-1
  }

  // Check if emotional interventions are needed
  private async checkInterventionNeeds(userId: string, emotionalState: EmotionalState): Promise<void> {
    const interventions: EmotionalIntervention[] = []

    // Check for high-intensity negative emotions
    if (emotionalState.intensity > 0.7) {
      switch (emotionalState.primary_emotion) {
        case 'frustration':
          interventions.push(await this.createBreathingIntervention(emotionalState))
          break
        case 'anxiety':
          interventions.push(await this.createCalmingIntervention(emotionalState))
          break
        case 'overwhelm':
          interventions.push(await this.createBreakIntervention(emotionalState))
          break
        case 'disappointment':
          interventions.push(await this.createEncouragementIntervention(emotionalState))
          break
      }
    }

    // Check for patterns that might need intervention
    const recentStates = this.emotionalStates.get(userId)?.slice(-5) || []
    if (this.detectNegativePattern(recentStates)) {
      interventions.push(await this.createPatternInterventionIntervention(recentStates))
    }

    // Store interventions
    if (interventions.length > 0) {
      if (!this.interventions.has(userId)) {
        this.interventions.set(userId, [])
      }
      this.interventions.get(userId)!.push(...interventions)
    }
  }

  // Create specific intervention types
  private async createBreathingIntervention(emotionalState: EmotionalState): Promise<EmotionalIntervention> {
    return {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotion_triggers: [emotionalState.primary_emotion],
      intervention_type: 'breathing_exercise',
      priority: emotionalState.intensity > 0.8 ? 'high' : 'medium',
      title: 'Take a Calming Breath',
      description: 'A quick breathing exercise to help you feel more centered and focused',
      techniques: [this.techniques.get('box_breathing')!],
      expected_outcome: 'Reduced frustration and increased calm',
      estimated_duration: 3,
      success_criteria: ['Feeling more calm', 'Ready to continue learning'],
      follow_up_actions: ['Return to learning task', 'Consider adjusting difficulty if needed']
    }
  }

  private async createCalmingIntervention(emotionalState: EmotionalState): Promise<EmotionalIntervention> {
    return {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotion_triggers: [emotionalState.primary_emotion],
      intervention_type: 'mindfulness',
      priority: 'high',
      title: 'Mindful Moment',
      description: 'A brief mindfulness exercise to reduce anxiety and improve focus',
      techniques: [this.techniques.get('mindful_minute')!],
      expected_outcome: 'Reduced anxiety and increased mental clarity',
      estimated_duration: 2,
      success_criteria: ['Feeling less anxious', 'Mind feels clearer'],
      follow_up_actions: ['Start with easier content', 'Break tasks into smaller steps']
    }
  }

  private async createBreakIntervention(emotionalState: EmotionalState): Promise<EmotionalIntervention> {
    return {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotion_triggers: [emotionalState.primary_emotion],
      intervention_type: 'break_suggestion',
      priority: 'high',
      title: 'Time for a Break',
      description: 'You\'ve been working hard! Taking a break can help reset your mind',
      techniques: [],
      expected_outcome: 'Refreshed mind and reduced overwhelm',
      estimated_duration: 10,
      success_criteria: ['Feeling refreshed', 'Ready to tackle challenges again'],
      follow_up_actions: ['Review learning goals', 'Start with a confidence-building activity']
    }
  }

  private async createEncouragementIntervention(emotionalState: EmotionalState): Promise<EmotionalIntervention> {
    return {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotion_triggers: [emotionalState.primary_emotion],
      intervention_type: 'encouragement',
      priority: 'medium',
      title: 'Growth Mindset Boost',
      description: 'Remember that challenges are opportunities to grow your brain!',
      techniques: [this.techniques.get('growth_mindset_reminder')!],
      expected_outcome: 'Renewed motivation and positive outlook',
      estimated_duration: 3,
      success_criteria: ['Feeling more optimistic', 'Ready to try again'],
      follow_up_actions: ['Review recent successes', 'Set smaller, achievable goals']
    }
  }

  private async createPatternInterventionIntervention(recentStates: EmotionalState[]): Promise<EmotionalIntervention> {
    return {
      id: `intervention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      emotion_triggers: ['frustration', 'anxiety', 'disappointment'],
      intervention_type: 'strategy_adjustment',
      priority: 'high',
      title: 'Let\'s Try a Different Approach',
      description: 'I notice you\'ve been struggling. Let\'s adjust our learning strategy to better support you.',
      techniques: [],
      expected_outcome: 'More effective learning approach and improved emotional state',
      estimated_duration: 5,
      success_criteria: ['Strategy feels more manageable', 'Feeling more confident'],
      follow_up_actions: ['Implement new learning strategy', 'Monitor emotional state closely']
    }
  }

  // Detect negative emotional patterns
  private detectNegativePattern(states: EmotionalState[]): boolean {
    if (states.length < 3) return false

    const negativeEmotions = ['frustration', 'anxiety', 'disappointment', 'overwhelm']
    const recentNegative = states.slice(-3).filter(state => 
      negativeEmotions.includes(state.primary_emotion)
    )

    return recentNegative.length >= 2 // 2 or more negative emotions in last 3 states
  }

  // Generate emotional insights for user
  async generateEmotionalInsights(userId: string): Promise<EmotionalInsight[]> {
    const userStates = this.emotionalStates.get(userId) || []
    const userProfile = this.emotionalProfiles.get(userId)

    if (userStates.length < 5) {
      return []
    }

    const insights: EmotionalInsight[] = []

    // Pattern insight
    const patternInsight = this.generatePatternInsight(userId, userStates)
    if (patternInsight) insights.push(patternInsight)

    // Trigger insight
    const triggerInsight = this.generateTriggerInsight(userId, userStates)
    if (triggerInsight) insights.push(triggerInsight)

    // Strength insight
    if (userProfile) {
      const strengthInsight = this.generateStrengthInsight(userId, userProfile)
      if (strengthInsight) insights.push(strengthInsight)
    }

    // Growth area insight
    if (userProfile) {
      const growthInsight = this.generateGrowthAreaInsight(userId, userProfile)
      if (growthInsight) insights.push(growthInsight)
    }

    return insights
  }

  // Generate specific insight types
  private generatePatternInsight(userId: string, states: EmotionalState[]): EmotionalInsight | null {
    const recentStates = states.slice(-10)
    const emotionCounts = recentStates.reduce((acc, state) => {
      acc[state.primary_emotion] = (acc[state.primary_emotion] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const mostFrequent = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0]

    if (!mostFrequent || mostFrequent[1] < 3) return null

    const [emotion, count] = mostFrequent
    const percentage = Math.round((count / recentStates.length) * 100)

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      insight_type: 'pattern',
      title: `Emotional Pattern: ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}`,
      description: `You've been experiencing ${emotion} ${percentage}% of the time in recent learning sessions.`,
      evidence: [`${count} out of ${recentStates.length} recent emotional states were ${emotion}`],
      actionable_steps: this.getActionableStepsForEmotion(emotion as EmotionType),
      confidence: 0.8,
      impact_level: percentage > 60 ? 'high' : percentage > 40 ? 'medium' : 'low',
      generated_at: new Date()
    }
  }

  private generateTriggerInsight(userId: string, states: EmotionalState[]): EmotionalInsight | null {
    const allTriggers = states.flatMap(state => state.triggers)
    const triggerCounts = allTriggers.reduce((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topTrigger = Object.entries(triggerCounts)
      .sort(([,a], [,b]) => b - a)[0]

    if (!topTrigger || topTrigger[1] < 3) return null

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      insight_type: 'trigger',
      title: 'Common Emotional Trigger Identified',
      description: `"${topTrigger[0]}" appears to be a frequent trigger for your emotions during learning.`,
      evidence: [`This trigger appeared ${topTrigger[1]} times in your recent sessions`],
      actionable_steps: [
        'Be mindful when this situation arises',
        'Prepare coping strategies in advance',
        'Consider adjusting learning approach to minimize this trigger'
      ],
      confidence: 0.7,
      impact_level: 'medium',
      generated_at: new Date()
    }
  }

  private generateStrengthInsight(userId: string, profile: EmotionalProfile): EmotionalInsight | null {
    const strengths: string[] = []
    
    if (profile.resilience_indicators.frustration_tolerance > 0.7) {
      strengths.push('High frustration tolerance')
    }
    if (profile.resilience_indicators.persistence_level > 0.7) {
      strengths.push('Strong persistence')
    }
    if (profile.emotional_intelligence_scores.self_regulation > 0.7) {
      strengths.push('Good emotional self-regulation')
    }

    if (strengths.length === 0) return null

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      insight_type: 'strength',
      title: 'Your Emotional Strengths',
      description: `You demonstrate strong ${strengths.join(', ').toLowerCase()} in your learning journey.`,
      evidence: strengths.map(strength => `Demonstrated ${strength.toLowerCase()}`),
      actionable_steps: [
        'Continue leveraging these strengths',
        'Help peers who might struggle in these areas',
        'Take on challenges that utilize these strengths'
      ],
      confidence: 0.8,
      impact_level: 'high',
      generated_at: new Date()
    }
  }

  private generateGrowthAreaInsight(userId: string, profile: EmotionalProfile): EmotionalInsight | null {
    const growthAreas: string[] = []
    
    if (profile.emotional_intelligence_scores.self_awareness < 0.5) {
      growthAreas.push('Emotional self-awareness')
    }
    if (profile.resilience_indicators.recovery_speed < 0.4) {
      growthAreas.push('Emotional recovery speed')
    }
    if (profile.resilience_indicators.help_seeking_tendency < 0.3) {
      growthAreas.push('Seeking help when needed')
    }

    if (growthAreas.length === 0) return null

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      insight_type: 'growth_area',
      title: 'Opportunity for Growth',
      description: `Developing ${growthAreas[0].toLowerCase()} could enhance your learning experience.`,
      evidence: [`${growthAreas[0]} shows room for improvement`],
      actionable_steps: this.getGrowthActionSteps(growthAreas[0]),
      confidence: 0.6,
      impact_level: 'medium',
      generated_at: new Date()
    }
  }

  // Helper methods for insights
  private getActionableStepsForEmotion(emotion: EmotionType): string[] {
    const emotionStrategies: Record<EmotionType, string[]> = {
      frustration: [
        'Take a brief break when frustration peaks',
        'Try breaking tasks into smaller steps',
        'Use breathing exercises to stay calm'
      ],
      anxiety: [
        'Practice mindfulness techniques',
        'Start with easier tasks to build confidence',
        'Remember that mistakes are part of learning'
      ],
      boredom: [
        'Try more challenging content',
        'Connect learning to personal interests',
        'Change learning format or environment'
      ],
      // Add more emotion-specific strategies
      joy: ['Celebrate your successes', 'Share your enthusiasm with others'],
      excitement: ['Channel this energy productively', 'Focus excitement on learning goals'],
      curiosity: ['Explore related topics', 'Ask more questions'],
      confusion: ['Ask for help', 'Review prerequisite concepts'],
      pride: ['Reflect on your growth', 'Set new challenging goals'],
      satisfaction: ['Build on this success', 'Try slightly harder challenges'],
      enthusiasm: ['Channel this energy into learning', 'Share knowledge with others'],
      disappointment: ['Learn from setbacks', 'Adjust expectations realistically'],
      overwhelm: ['Break tasks down', 'Prioritize most important elements'],
      determination: ['Maintain this mindset', 'Set clear milestones'],
      focus: ['Protect this state', 'Minimize distractions'],
      calm: ['Appreciate this balance', 'Use this state for challenging tasks'],
      confidence: ['Take on appropriate challenges', 'Help others learn'],
      surprise: ['Explore unexpected discoveries', 'Question assumptions'],
      interest: ['Dive deeper into the topic', 'Connect to other subjects'],
      anger: ['Take a cooling-off period', 'Identify the real issue'],
      sadness: ['Practice self-compassion', 'Seek support if needed'],
      fear: ['Start with small steps', 'Build confidence gradually'],
      disgust: ['Explore why this reaction occurred', 'Find alternative approaches'],
      contempt: ['Practice empathy', 'Consider different perspectives'],
      shame: ['Practice self-forgiveness', 'Focus on growth over perfection']
    }

    return emotionStrategies[emotion] || ['Practice emotional awareness', 'Seek support when needed']
  }

  private getGrowthActionSteps(growthArea: string): string[] {
    const growthStrategies: Record<string, string[]> = {
      'Emotional self-awareness': [
        'Check in with your emotions regularly',
        'Keep an emotion journal',
        'Practice naming your emotions specifically'
      ],
      'Emotional recovery speed': [
        'Practice resilience-building exercises',
        'Develop a toolkit of coping strategies',
        'Reflect on past successful recoveries'
      ],
      'Seeking help when needed': [
        'Practice asking questions',
        'Remember that seeking help is a strength',
        'Identify trusted sources of support'
      ]
    }

    return growthStrategies[growthArea] || ['Focus on this area in your learning journey']
  }

  // Public API methods
  getEmotionalState(userId: string, stateId: string): EmotionalState | null {
    const userStates = this.emotionalStates.get(userId) || []
    return userStates.find(state => state.id === stateId) || null
  }

  getEmotionalHistory(userId: string, limit: number = 20): EmotionalState[] {
    const userStates = this.emotionalStates.get(userId) || []
    return userStates.slice(-limit)
  }

  getEmotionalProfile(userId: string): EmotionalProfile | null {
    return this.emotionalProfiles.get(userId) || null
  }

  getActiveInterventions(userId: string): EmotionalIntervention[] {
    return this.interventions.get(userId) || []
  }

  markInterventionCompleted(userId: string, interventionId: string): boolean {
    const userInterventions = this.interventions.get(userId) || []
    const index = userInterventions.findIndex(intervention => intervention.id === interventionId)
    
    if (index !== -1) {
      userInterventions.splice(index, 1)
      this.interventions.set(userId, userInterventions)
      return true
    }
    
    return false
  }

  getEmotionalTechniques(): EmotionalTechnique[] {
    return Array.from(this.techniques.values())
  }
}

// Create and export singleton instance
export const emotionalIntelligenceEngine = new EmotionalIntelligenceEngine()
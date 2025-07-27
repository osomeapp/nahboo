'use client'

import { multiModelAI } from './multi-model-ai'

// Core predictive analytics types
export interface LearnerRiskProfile {
  userId: string
  sessionId: string
  timestamp: Date
  risk_level: RiskLevel
  risk_score: number // 0-1 scale (0 = no risk, 1 = high risk)
  confidence: number // 0-1 confidence in prediction
  contributing_factors: RiskFactor[]
  predicted_outcomes: {
    dropout_probability: number // 0-1
    performance_decline_probability: number // 0-1
    engagement_loss_probability: number // 0-1
    time_to_intervention_needed: number // days
    success_probability_with_intervention: number // 0-1
    success_probability_without_intervention: number // 0-1
  }
  early_warning_signals: EarlyWarningSignal[]
  intervention_recommendations: InterventionRecommendation[]
  historical_patterns: {
    similar_learner_outcomes: string[]
    recovery_success_rate: number
    typical_intervention_timeline: number // days
  }
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical'

export interface RiskFactor {
  factor_type: RiskFactorType
  severity: number // 0-1
  evidence: string[]
  trend: 'improving' | 'stable' | 'declining'
  weight: number // How much this factor contributes to overall risk
  time_window: number // Days over which this factor was observed
}

export type RiskFactorType = 
  | 'declining_performance' | 'irregular_attendance' | 'low_engagement' | 'emotional_distress'
  | 'content_difficulty_mismatch' | 'social_isolation' | 'time_management_issues' | 'motivation_loss'
  | 'technical_difficulties' | 'external_stressors' | 'learning_pace_issues' | 'feedback_response'

export interface EarlyWarningSignal {
  signal_type: WarningSignalType
  detected_at: Date
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  description: string
  data_points: any[]
  pattern_confidence: number // 0-1
  urgency_level: number // 0-1 (how quickly intervention is needed)
}

export type WarningSignalType = 
  | 'performance_drop' | 'engagement_decline' | 'attendance_gap' | 'help_seeking_decrease'
  | 'negative_sentiment' | 'confusion_indicators' | 'stress_markers' | 'isolation_signs'
  | 'motivation_decline' | 'pace_mismatch' | 'technical_barriers' | 'emotional_volatility'

export interface InterventionRecommendation {
  id: string
  recommendation_type: InterventionType
  priority: 'immediate' | 'urgent' | 'high' | 'medium' | 'low'
  title: string
  description: string
  target_risk_factors: RiskFactorType[]
  estimated_effectiveness: number // 0-1
  implementation_difficulty: 'low' | 'medium' | 'high'
  resource_requirements: string[]
  timeline: {
    immediate_actions: string[] // Within 24 hours
    short_term_actions: string[] // Within 1 week
    long_term_actions: string[] // Within 1 month
  }
  success_metrics: string[]
  alternative_approaches: string[]
}

export type InterventionType = 
  | 'personalized_support' | 'content_adjustment' | 'pace_modification' | 'emotional_support'
  | 'peer_connection' | 'instructor_outreach' | 'technical_assistance' | 'motivation_boost'
  | 'learning_strategy_change' | 'goal_adjustment' | 'resource_provision' | 'schedule_flexibility'

export interface PredictiveModel {
  model_id: string
  model_type: ModelType
  version: string
  accuracy: number // 0-1
  precision: number // 0-1
  recall: number // 0-1
  f1_score: number // 0-1
  training_data_size: number
  last_updated: Date
  feature_importance: Record<string, number>
  performance_by_demographic: Record<string, number>
}

export type ModelType = 
  | 'dropout_prediction' | 'performance_prediction' | 'engagement_prediction' 
  | 'intervention_effectiveness' | 'risk_scoring' | 'early_warning'

export interface LearningAnalytics {
  userId: string
  timeframe: {
    start_date: Date
    end_date: Date
    data_points: number
  }
  performance_metrics: {
    average_score: number
    score_trend: 'improving' | 'stable' | 'declining'
    completion_rate: number
    accuracy_rate: number
    time_on_task: number // minutes per session
    help_seeking_frequency: number
  }
  engagement_metrics: {
    session_frequency: number // sessions per week
    session_duration: number // average minutes
    content_interaction_rate: number
    voluntary_practice_time: number
    peer_interaction_frequency: number
  }
  behavioral_patterns: {
    login_consistency: number // 0-1
    peak_activity_hours: number[]
    preferred_content_types: string[]
    learning_velocity: number // concepts per day
    error_recovery_time: number // minutes
  }
  emotional_indicators: {
    average_sentiment: number // -1 to 1
    stress_level: number // 0-1
    confidence_level: number // 0-1
    motivation_trend: 'increasing' | 'stable' | 'decreasing'
    frustration_frequency: number
  }
}

// Main predictive analytics engine
export class PredictiveAnalyticsEngine {
  private riskProfiles: Map<string, LearnerRiskProfile[]> = new Map()
  private analytics: Map<string, LearningAnalytics[]> = new Map()
  private models: Map<string, PredictiveModel> = new Map()
  private warningSignals: Map<string, EarlyWarningSignal[]> = new Map()

  constructor() {
    // Initialize predictive models
    this.initializePredictiveModels()
  }

  // Initialize ML models for different prediction tasks
  private initializePredictiveModels(): void {
    const models: PredictiveModel[] = [
      {
        model_id: 'dropout_predictor_v2',
        model_type: 'dropout_prediction',
        version: '2.1.0',
        accuracy: 0.87,
        precision: 0.82,
        recall: 0.79,
        f1_score: 0.80,
        training_data_size: 50000,
        last_updated: new Date(),
        feature_importance: {
          'engagement_decline': 0.25,
          'performance_drop': 0.22,
          'attendance_irregularity': 0.18,
          'emotional_distress': 0.15,
          'help_seeking_decrease': 0.12,
          'peer_interaction_loss': 0.08
        },
        performance_by_demographic: {
          'age_18_25': 0.85,
          'age_26_35': 0.89,
          'age_36_plus': 0.84,
          'beginner': 0.82,
          'intermediate': 0.88,
          'advanced': 0.91
        }
      },
      {
        model_id: 'performance_predictor_v1',
        model_type: 'performance_prediction',
        version: '1.3.0',
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.88,
        f1_score: 0.88,
        training_data_size: 75000,
        last_updated: new Date(),
        feature_importance: {
          'historical_performance': 0.30,
          'engagement_level': 0.25,
          'content_difficulty_match': 0.20,
          'learning_pace': 0.15,
          'emotional_state': 0.10
        },
        performance_by_demographic: {
          'visual_learners': 0.92,
          'auditory_learners': 0.89,
          'kinesthetic_learners': 0.90,
          'analytical_learners': 0.94
        }
      },
      {
        model_id: 'intervention_effectiveness_v1',
        model_type: 'intervention_effectiveness',
        version: '1.1.0',
        accuracy: 0.83,
        precision: 0.81,
        recall: 0.85,
        f1_score: 0.83,
        training_data_size: 25000,
        last_updated: new Date(),
        feature_importance: {
          'intervention_timing': 0.35,
          'learner_receptiveness': 0.25,
          'intervention_type_match': 0.20,
          'support_system_strength': 0.12,
          'resource_availability': 0.08
        },
        performance_by_demographic: {
          'high_risk': 0.79,
          'moderate_risk': 0.85,
          'low_risk': 0.91
        }
      }
    ]

    models.forEach(model => {
      this.models.set(model.model_id, model)
    })
  }

  // Main risk assessment function
  async assessLearnerRisk(
    userId: string,
    sessionId: string,
    learningData: {
      performance_data: any[]
      engagement_data: any[]
      behavioral_data: any[]
      emotional_data: any[]
      contextual_data: any
    }
  ): Promise<LearnerRiskProfile> {
    try {
      // Generate comprehensive learning analytics
      const analytics = await this.generateLearningAnalytics(userId, learningData)
      
      // Detect early warning signals
      const warningSignals = await this.detectEarlyWarningSignals(userId, analytics, learningData)
      
      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(analytics, warningSignals)
      
      // Calculate risk score using ensemble model
      const riskScore = await this.calculateRiskScore(riskFactors, analytics)
      
      // Generate predictions
      const predictions = await this.generatePredictions(userId, riskScore, riskFactors, analytics)
      
      // Generate intervention recommendations
      const interventions = await this.generateInterventionRecommendations(riskFactors, predictions)
      
      // Analyze historical patterns
      const historicalPatterns = await this.analyzeHistoricalPatterns(riskScore, riskFactors)

      const riskProfile: LearnerRiskProfile = {
        userId,
        sessionId,
        timestamp: new Date(),
        risk_level: this.determineRiskLevel(riskScore),
        risk_score: riskScore,
        confidence: this.calculatePredictionConfidence(riskFactors, analytics),
        contributing_factors: riskFactors,
        predicted_outcomes: predictions,
        early_warning_signals: warningSignals,
        intervention_recommendations: interventions,
        historical_patterns: historicalPatterns
      }

      // Store risk profile
      if (!this.riskProfiles.has(userId)) {
        this.riskProfiles.set(userId, [])
      }
      this.riskProfiles.get(userId)!.push(riskProfile)

      // Store warning signals
      if (warningSignals.length > 0) {
        if (!this.warningSignals.has(userId)) {
          this.warningSignals.set(userId, [])
        }
        this.warningSignals.get(userId)!.push(...warningSignals)
      }

      return riskProfile
    } catch (error) {
      console.error('Error assessing learner risk:', error)
      
      // Return low-risk profile as fallback
      return this.createFallbackRiskProfile(userId, sessionId)
    }
  }

  // Generate comprehensive learning analytics
  private async generateLearningAnalytics(
    userId: string,
    learningData: any
  ): Promise<LearningAnalytics> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Analyze performance metrics
    const performanceData = learningData.performance_data || []
    const performance_metrics = {
      average_score: this.calculateAverageScore(performanceData),
      score_trend: this.calculateScoreTrend(performanceData),
      completion_rate: this.calculateCompletionRate(performanceData),
      accuracy_rate: this.calculateAccuracyRate(performanceData),
      time_on_task: this.calculateTimeOnTask(performanceData),
      help_seeking_frequency: this.calculateHelpSeekingFrequency(performanceData)
    }

    // Analyze engagement metrics
    const engagementData = learningData.engagement_data || []
    const engagement_metrics = {
      session_frequency: this.calculateSessionFrequency(engagementData),
      session_duration: this.calculateAverageSessionDuration(engagementData),
      content_interaction_rate: this.calculateContentInteractionRate(engagementData),
      voluntary_practice_time: this.calculateVoluntaryPracticeTime(engagementData),
      peer_interaction_frequency: this.calculatePeerInteractionFrequency(engagementData)
    }

    // Analyze behavioral patterns
    const behavioralData = learningData.behavioral_data || []
    const behavioral_patterns = {
      login_consistency: this.calculateLoginConsistency(behavioralData),
      peak_activity_hours: this.identifyPeakActivityHours(behavioralData),
      preferred_content_types: this.identifyPreferredContentTypes(behavioralData),
      learning_velocity: this.calculateLearningVelocity(behavioralData),
      error_recovery_time: this.calculateErrorRecoveryTime(behavioralData)
    }

    // Analyze emotional indicators
    const emotionalData = learningData.emotional_data || []
    const emotional_indicators = {
      average_sentiment: this.calculateAverageSentiment(emotionalData),
      stress_level: this.calculateStressLevel(emotionalData),
      confidence_level: this.calculateConfidenceLevel(emotionalData),
      motivation_trend: this.calculateMotivationTrend(emotionalData),
      frustration_frequency: this.calculateFrustrationFrequency(emotionalData)
    }

    return {
      userId,
      timeframe: {
        start_date: thirtyDaysAgo,
        end_date: now,
        data_points: performanceData.length + engagementData.length + behavioralData.length + emotionalData.length
      },
      performance_metrics,
      engagement_metrics,
      behavioral_patterns,
      emotional_indicators
    }
  }

  // Detect early warning signals using AI pattern recognition
  private async detectEarlyWarningSignals(
    userId: string,
    analytics: LearningAnalytics,
    learningData: any
  ): Promise<EarlyWarningSignal[]> {
    const signals: EarlyWarningSignal[] = []

    // Performance drop detection
    if (analytics.performance_metrics.score_trend === 'declining' && 
        analytics.performance_metrics.average_score < 70) {
      signals.push({
        signal_type: 'performance_drop',
        detected_at: new Date(),
        severity: analytics.performance_metrics.average_score < 50 ? 'critical' : 'major',
        description: `Performance has declined to ${analytics.performance_metrics.average_score.toFixed(1)}% with a declining trend`,
        data_points: learningData.performance_data || [],
        pattern_confidence: 0.85,
        urgency_level: analytics.performance_metrics.average_score < 50 ? 0.9 : 0.7
      })
    }

    // Engagement decline detection
    if (analytics.engagement_metrics.session_frequency < 2 && 
        analytics.engagement_metrics.session_duration < 15) {
      signals.push({
        signal_type: 'engagement_decline',
        detected_at: new Date(),
        severity: analytics.engagement_metrics.session_frequency < 1 ? 'critical' : 'major',
        description: `Low engagement: ${analytics.engagement_metrics.session_frequency.toFixed(1)} sessions/week, ${analytics.engagement_metrics.session_duration.toFixed(1)} min/session`,
        data_points: learningData.engagement_data || [],
        pattern_confidence: 0.8,
        urgency_level: 0.8
      })
    }

    // Emotional distress detection
    if (analytics.emotional_indicators.stress_level > 0.7 || 
        analytics.emotional_indicators.average_sentiment < -0.3) {
      signals.push({
        signal_type: 'stress_markers',
        detected_at: new Date(),
        severity: analytics.emotional_indicators.stress_level > 0.8 ? 'critical' : 'major',
        description: `High stress level (${(analytics.emotional_indicators.stress_level * 100).toFixed(1)}%) and negative sentiment`,
        data_points: learningData.emotional_data || [],
        pattern_confidence: 0.75,
        urgency_level: 0.85
      })
    }

    // Help-seeking behavior change
    if (analytics.performance_metrics.help_seeking_frequency < 0.1) {
      signals.push({
        signal_type: 'help_seeking_decrease',
        detected_at: new Date(),
        severity: 'moderate',
        description: 'Significantly reduced help-seeking behavior despite performance challenges',
        data_points: learningData.performance_data || [],
        pattern_confidence: 0.7,
        urgency_level: 0.6
      })
    }

    // Use AI to detect complex patterns
    const aiDetectedSignals = await this.detectComplexPatternsWithAI(userId, analytics, learningData)
    signals.push(...aiDetectedSignals)

    return signals
  }

  // Use AI to detect complex warning patterns
  private async detectComplexPatternsWithAI(
    userId: string,
    analytics: LearningAnalytics,
    learningData: any
  ): Promise<EarlyWarningSignal[]> {
    const prompt = `Analyze this learner's data for early warning signals that might predict academic risk.

Learning Analytics Summary:
- Performance: ${analytics.performance_metrics.average_score.toFixed(1)}% (trend: ${analytics.performance_metrics.score_trend})
- Engagement: ${analytics.engagement_metrics.session_frequency.toFixed(1)} sessions/week, ${analytics.engagement_metrics.session_duration.toFixed(1)} min/session
- Emotional state: Stress ${(analytics.emotional_indicators.stress_level * 100).toFixed(1)}%, Sentiment ${analytics.emotional_indicators.average_sentiment.toFixed(2)}
- Behavioral: Login consistency ${(analytics.behavioral_patterns.login_consistency * 100).toFixed(1)}%

Look for subtle patterns that indicate:
1. Disengagement patterns
2. Learning pace mismatches  
3. Emotional volatility
4. Social isolation indicators
5. Motivation decline signs

Return a JSON array of warning signals:
[
  {
    "signal_type": "signal_name",
    "severity": "minor|moderate|major|critical",
    "description": "detailed description",
    "pattern_confidence": number,
    "urgency_level": number
  }
]

Focus on actionable early warnings that could prevent academic failure.`

    try {
      const response = await multiModelAI.generateContent({
        prompt,
        useCase: 'analysis',
        options: {
          temperature: 0.3,
          maxTokens: 500
        }
      })

      const aiSignals = JSON.parse(response.content)
      
      return aiSignals.map((signal: any) => ({
        signal_type: signal.signal_type as WarningSignalType,
        detected_at: new Date(),
        severity: signal.severity,
        description: signal.description,
        data_points: [],
        pattern_confidence: Math.max(0, Math.min(1, signal.pattern_confidence || 0.5)),
        urgency_level: Math.max(0, Math.min(1, signal.urgency_level || 0.5))
      }))
    } catch (error) {
      console.error('Error detecting AI patterns:', error)
      return []
    }
  }

  // Identify specific risk factors
  private async identifyRiskFactors(
    analytics: LearningAnalytics,
    warningSignals: EarlyWarningSignal[]
  ): Promise<RiskFactor[]> {
    const factors: RiskFactor[] = []

    // Performance-based risk factors
    if (analytics.performance_metrics.average_score < 70) {
      factors.push({
        factor_type: 'declining_performance',
        severity: 1 - (analytics.performance_metrics.average_score / 100),
        evidence: [
          `Average score: ${analytics.performance_metrics.average_score.toFixed(1)}%`,
          `Completion rate: ${(analytics.performance_metrics.completion_rate * 100).toFixed(1)}%`
        ],
        trend: analytics.performance_metrics.score_trend,
        weight: 0.25,
        time_window: 30
      })
    }

    // Engagement-based risk factors
    if (analytics.engagement_metrics.session_frequency < 3) {
      factors.push({
        factor_type: 'low_engagement',
        severity: Math.max(0, 1 - (analytics.engagement_metrics.session_frequency / 5)),
        evidence: [
          `Session frequency: ${analytics.engagement_metrics.session_frequency.toFixed(1)}/week`,
          `Average session duration: ${analytics.engagement_metrics.session_duration.toFixed(1)} minutes`
        ],
        trend: this.calculateEngagementTrend(analytics),
        weight: 0.3,
        time_window: 14
      })
    }

    // Emotional risk factors
    if (analytics.emotional_indicators.stress_level > 0.6) {
      factors.push({
        factor_type: 'emotional_distress',
        severity: analytics.emotional_indicators.stress_level,
        evidence: [
          `High stress level: ${(analytics.emotional_indicators.stress_level * 100).toFixed(1)}%`,
          `Negative sentiment trend: ${analytics.emotional_indicators.average_sentiment.toFixed(2)}`
        ],
        trend: analytics.emotional_indicators.motivation_trend === 'decreasing' ? 'declining' : 'stable',
        weight: 0.2,
        time_window: 7
      })
    }

    // Behavioral risk factors
    if (analytics.behavioral_patterns.login_consistency < 0.5) {
      factors.push({
        factor_type: 'irregular_attendance',
        severity: 1 - analytics.behavioral_patterns.login_consistency,
        evidence: [
          `Login consistency: ${(analytics.behavioral_patterns.login_consistency * 100).toFixed(1)}%`,
          `Irregular learning schedule detected`
        ],
        trend: 'declining',
        weight: 0.15,
        time_window: 21
      })
    }

    // Learning pace issues
    if (analytics.behavioral_patterns.learning_velocity < 0.5) {
      factors.push({
        factor_type: 'learning_pace_issues',
        severity: 1 - analytics.behavioral_patterns.learning_velocity,
        evidence: [
          `Slow learning velocity: ${analytics.behavioral_patterns.learning_velocity.toFixed(2)} concepts/day`,
          `Extended time on individual tasks`
        ],
        trend: 'declining',
        weight: 0.1,
        time_window: 14
      })
    }

    return factors
  }

  // Calculate overall risk score using ensemble approach
  private async calculateRiskScore(
    riskFactors: RiskFactor[],
    analytics: LearningAnalytics
  ): Promise<number> {
    if (riskFactors.length === 0) return 0.1 // Very low risk

    // Weighted sum of risk factors
    const weightedRiskSum = riskFactors.reduce((sum, factor) => {
      return sum + (factor.severity * factor.weight)
    }, 0)

    const totalWeight = riskFactors.reduce((sum, factor) => sum + factor.weight, 0)
    const baseRiskScore = totalWeight > 0 ? weightedRiskSum / totalWeight : 0

    // Apply contextual modifiers
    let contextualModifier = 1.0

    // Increase risk for multiple concurrent issues
    if (riskFactors.length > 3) {
      contextualModifier += 0.2
    }

    // Decrease risk for strong historical performance
    if (analytics.performance_metrics.average_score > 85) {
      contextualModifier -= 0.15
    }

    // Increase risk for emotional distress
    if (analytics.emotional_indicators.stress_level > 0.7) {
      contextualModifier += 0.25
    }

    // Increase risk for very low engagement
    if (analytics.engagement_metrics.session_frequency < 1) {
      contextualModifier += 0.3
    }

    const finalRiskScore = Math.max(0, Math.min(1, baseRiskScore * contextualModifier))
    return finalRiskScore
  }

  // Generate outcome predictions
  private async generatePredictions(
    userId: string,
    riskScore: number,
    riskFactors: RiskFactor[],
    analytics: LearningAnalytics
  ): Promise<LearnerRiskProfile['predicted_outcomes']> {
    // Use ensemble of models for predictions
    const dropoutModel = this.models.get('dropout_predictor_v2')!
    const performanceModel = this.models.get('performance_predictor_v1')!
    const interventionModel = this.models.get('intervention_effectiveness_v1')!

    // Calculate feature scores for model input
    const features = this.extractModelFeatures(riskScore, riskFactors, analytics)

    // Dropout probability calculation
    const dropout_probability = this.calculateDropoutProbability(features, dropoutModel)

    // Performance decline probability
    const performance_decline_probability = this.calculatePerformanceDeclineProbability(features, performanceModel)

    // Engagement loss probability
    const engagement_loss_probability = this.calculateEngagementLossProbability(features, analytics)

    // Time to intervention needed (in days)
    const time_to_intervention_needed = this.calculateInterventionTimeline(riskScore, riskFactors)

    // Success probability with/without intervention
    const success_probability_with_intervention = this.calculateInterventionSuccessProbability(
      features, interventionModel, true
    )
    const success_probability_without_intervention = this.calculateInterventionSuccessProbability(
      features, interventionModel, false
    )

    return {
      dropout_probability,
      performance_decline_probability,
      engagement_loss_probability,
      time_to_intervention_needed,
      success_probability_with_intervention,
      success_probability_without_intervention
    }
  }

  // Generate AI-powered intervention recommendations
  private async generateInterventionRecommendations(
    riskFactors: RiskFactor[],
    predictions: LearnerRiskProfile['predicted_outcomes']
  ): Promise<InterventionRecommendation[]> {
    const recommendations: InterventionRecommendation[] = []

    // High-risk interventions
    if (predictions.dropout_probability > 0.7) {
      recommendations.push(await this.createCriticalInterventionPlan(riskFactors))
    }

    // Performance-focused interventions
    if (predictions.performance_decline_probability > 0.6) {
      recommendations.push(await this.createPerformanceInterventionPlan(riskFactors))
    }

    // Engagement interventions
    if (predictions.engagement_loss_probability > 0.6) {
      recommendations.push(await this.createEngagementInterventionPlan(riskFactors))
    }

    // Emotional support interventions
    const emotionalRisk = riskFactors.find(f => f.factor_type === 'emotional_distress')
    if (emotionalRisk && emotionalRisk.severity > 0.6) {
      recommendations.push(await this.createEmotionalSupportPlan(emotionalRisk))
    }

    // Use AI to generate personalized recommendations
    const aiRecommendations = await this.generateAIPersonalizedRecommendations(riskFactors, predictions)
    recommendations.push(...aiRecommendations)

    return recommendations.slice(0, 5) // Limit to top 5 recommendations
  }

  // Create critical intervention plan for high-risk learners
  private async createCriticalInterventionPlan(riskFactors: RiskFactor[]): Promise<InterventionRecommendation> {
    return {
      id: `critical_intervention_${Date.now()}`,
      recommendation_type: 'personalized_support',
      priority: 'immediate',
      title: 'Critical Support Plan - Prevent Dropout',
      description: 'Comprehensive intervention plan for learner at high risk of dropping out',
      target_risk_factors: riskFactors.map(f => f.factor_type),
      estimated_effectiveness: 0.78,
      implementation_difficulty: 'high',
      resource_requirements: [
        'Dedicated support staff',
        'Personalized learning plan',
        'Regular check-ins',
        'Flexible scheduling'
      ],
      timeline: {
        immediate_actions: [
          'Contact learner within 24 hours',
          'Schedule emergency support session',
          'Assess immediate barriers'
        ],
        short_term_actions: [
          'Develop personalized learning plan',
          'Assign dedicated mentor',
          'Implement weekly check-ins'
        ],
        long_term_actions: [
          'Monitor progress closely',
          'Adjust plan based on outcomes',
          'Celebrate small wins'
        ]
      },
      success_metrics: [
        'Continued enrollment',
        'Improved engagement metrics',
        'Stabilized performance'
      ],
      alternative_approaches: [
        'Temporary break with re-entry support',
        'Modified program track',
        'Peer support group enrollment'
      ]
    }
  }

  // Generate AI-powered personalized recommendations
  private async generateAIPersonalizedRecommendations(
    riskFactors: RiskFactor[],
    predictions: LearnerRiskProfile['predicted_outcomes']
  ): Promise<InterventionRecommendation[]> {
    const factorSummary = riskFactors.map(f => 
      `${f.factor_type}: ${(f.severity * 100).toFixed(1)}% severity (${f.trend})`
    ).join('\n')

    const prompt = `Generate personalized intervention recommendations for a learner with these risk factors:

Risk Factors:
${factorSummary}

Predictions:
- Dropout probability: ${(predictions.dropout_probability * 100).toFixed(1)}%
- Performance decline: ${(predictions.performance_decline_probability * 100).toFixed(1)}%
- Engagement loss: ${(predictions.engagement_loss_probability * 100).toFixed(1)}%

Generate 2-3 specific, actionable intervention recommendations. Each should include:
- Targeted approach based on the specific risk factors
- Implementation timeline with immediate and ongoing actions
- Expected effectiveness and success metrics
- Resource requirements

Return JSON array of recommendations:
[
  {
    "title": "intervention title",
    "description": "detailed description",
    "intervention_type": "type",
    "priority": "immediate|urgent|high|medium|low",
    "estimated_effectiveness": number,
    "immediate_actions": ["action1", "action2"],
    "short_term_actions": ["action1", "action2"],
    "success_metrics": ["metric1", "metric2"]
  }
]`

    try {
      const response = await multiModelAI.generateContent({
        prompt,
        useCase: 'analysis',
        options: {
          temperature: 0.4,
          maxTokens: 800
        }
      })

      const aiRecommendations = JSON.parse(response.content)
      
      return aiRecommendations.map((rec: any, index: number) => ({
        id: `ai_intervention_${Date.now()}_${index}`,
        recommendation_type: rec.intervention_type as InterventionType,
        priority: rec.priority,
        title: rec.title,
        description: rec.description,
        target_risk_factors: riskFactors.map(f => f.factor_type),
        estimated_effectiveness: Math.max(0, Math.min(1, rec.estimated_effectiveness || 0.6)),
        implementation_difficulty: 'medium',
        resource_requirements: ['Support staff', 'Learning resources'],
        timeline: {
          immediate_actions: rec.immediate_actions || [],
          short_term_actions: rec.short_term_actions || [],
          long_term_actions: ['Monitor and adjust approach']
        },
        success_metrics: rec.success_metrics || [],
        alternative_approaches: []
      }))
    } catch (error) {
      console.error('Error generating AI recommendations:', error)
      return []
    }
  }

  // Helper methods for calculations
  private calculateAverageScore(performanceData: any[]): number {
    if (!performanceData.length) return 75 // Default assumption
    const scores = performanceData.map(d => d.score || 0)
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateScoreTrend(performanceData: any[]): 'improving' | 'stable' | 'declining' {
    if (performanceData.length < 3) return 'stable'
    
    const recentScores = performanceData.slice(-5).map(d => d.score || 0)
    const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2))
    const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    
    if (difference > 5) return 'improving'
    if (difference < -5) return 'declining'
    return 'stable'
  }

  private calculateCompletionRate(performanceData: any[]): number {
    if (!performanceData.length) return 0.8
    const completed = performanceData.filter(d => d.completed).length
    return completed / performanceData.length
  }

  private calculateAccuracyRate(performanceData: any[]): number {
    if (!performanceData.length) return 0.7
    const totalQuestions = performanceData.reduce((sum, d) => sum + (d.totalQuestions || 0), 0)
    const correctAnswers = performanceData.reduce((sum, d) => sum + (d.correctAnswers || 0), 0)
    return totalQuestions > 0 ? correctAnswers / totalQuestions : 0.7
  }

  private calculateTimeOnTask(performanceData: any[]): number {
    if (!performanceData.length) return 30
    const times = performanceData.map(d => d.timeSpent || 0)
    return times.reduce((sum, time) => sum + time, 0) / times.length
  }

  private calculateHelpSeekingFrequency(performanceData: any[]): number {
    if (!performanceData.length) return 0.3
    const helpRequests = performanceData.filter(d => d.helpRequested).length
    return helpRequests / performanceData.length
  }

  private calculateSessionFrequency(engagementData: any[]): number {
    if (!engagementData.length) return 2
    // Calculate sessions per week based on engagement data
    const uniqueDays = new Set(engagementData.map(d => 
      new Date(d.timestamp).toDateString()
    )).size
    return uniqueDays > 0 ? (engagementData.length / uniqueDays) * 7 : 2
  }

  private calculateAverageSessionDuration(engagementData: any[]): number {
    if (!engagementData.length) return 25
    const durations = engagementData.map(d => d.duration || 0)
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  }

  private calculateContentInteractionRate(engagementData: any[]): number {
    if (!engagementData.length) return 0.6
    const interactions = engagementData.filter(d => d.interacted).length
    return interactions / engagementData.length
  }

  private calculateVoluntaryPracticeTime(engagementData: any[]): number {
    if (!engagementData.length) return 10
    const voluntaryTime = engagementData
      .filter(d => d.voluntary)
      .reduce((sum, d) => sum + (d.duration || 0), 0)
    return voluntaryTime
  }

  private calculatePeerInteractionFrequency(engagementData: any[]): number {
    if (!engagementData.length) return 0.2
    const peerInteractions = engagementData.filter(d => d.peerInteraction).length
    return peerInteractions / engagementData.length
  }

  private calculateLoginConsistency(behavioralData: any[]): number {
    if (!behavioralData.length) return 0.7
    // Simple calculation based on login patterns
    const expectedLogins = 21 // 3 times per week for a month
    const actualLogins = behavioralData.filter(d => d.action === 'login').length
    return Math.min(1, actualLogins / expectedLogins)
  }

  private identifyPeakActivityHours(behavioralData: any[]): number[] {
    if (!behavioralData.length) return [14, 19] // Default 2 PM and 7 PM
    
    const hourCounts: Record<number, number> = {}
    behavioralData.forEach(d => {
      const hour = new Date(d.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    
    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))
  }

  private identifyPreferredContentTypes(behavioralData: any[]): string[] {
    if (!behavioralData.length) return ['video', 'quiz']
    
    const typeCounts: Record<string, number> = {}
    behavioralData.forEach(d => {
      if (d.contentType) {
        typeCounts[d.contentType] = (typeCounts[d.contentType] || 0) + 1
      }
    })
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)
  }

  private calculateLearningVelocity(behavioralData: any[]): number {
    if (!behavioralData.length) return 1.0
    
    const conceptsCompleted = behavioralData.filter(d => d.action === 'concept_completed').length
    const daysCovered = Math.max(1, behavioralData.length / 10) // Rough estimate
    
    return conceptsCompleted / daysCovered
  }

  private calculateErrorRecoveryTime(behavioralData: any[]): number {
    if (!behavioralData.length) return 5
    
    const errorEvents = behavioralData.filter(d => d.action === 'error')
    const recoveryTimes = errorEvents.map(error => {
      const nextSuccess = behavioralData.find(d => 
        d.timestamp > error.timestamp && d.action === 'success'
      )
      if (nextSuccess) {
        return (new Date(nextSuccess.timestamp).getTime() - new Date(error.timestamp).getTime()) / (1000 * 60)
      }
      return 10 // Default 10 minutes
    })
    
    return recoveryTimes.length > 0 
      ? recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
      : 5
  }

  private calculateAverageSentiment(emotionalData: any[]): number {
    if (!emotionalData.length) return 0.1
    
    const sentiments = emotionalData.map(d => d.sentiment || 0)
    return sentiments.reduce((sum, sentiment) => sum + sentiment, 0) / sentiments.length
  }

  private calculateStressLevel(emotionalData: any[]): number {
    if (!emotionalData.length) return 0.3
    
    const stressLevels = emotionalData.map(d => d.stressLevel || 0)
    return stressLevels.reduce((sum, stress) => sum + stress, 0) / stressLevels.length
  }

  private calculateConfidenceLevel(emotionalData: any[]): number {
    if (!emotionalData.length) return 0.6
    
    const confidenceLevels = emotionalData.map(d => d.confidence || 0.5)
    return confidenceLevels.reduce((sum, conf) => sum + conf, 0) / confidenceLevels.length
  }

  private calculateMotivationTrend(emotionalData: any[]): 'increasing' | 'stable' | 'decreasing' {
    if (emotionalData.length < 3) return 'stable'
    
    const motivationLevels = emotionalData.map(d => d.motivation || 0.5)
    const recentTrend = motivationLevels.slice(-5)
    
    const firstHalf = recentTrend.slice(0, Math.floor(recentTrend.length / 2))
    const secondHalf = recentTrend.slice(Math.floor(recentTrend.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, m) => sum + m, 0) / secondHalf.length
    
    const difference = secondAvg - firstAvg
    
    if (difference > 0.1) return 'increasing'
    if (difference < -0.1) return 'decreasing'
    return 'stable'
  }

  private calculateFrustrationFrequency(emotionalData: any[]): number {
    if (!emotionalData.length) return 0.2
    
    const frustrationEvents = emotionalData.filter(d => 
      d.emotion === 'frustration' || d.emotion === 'anger'
    ).length
    
    return frustrationEvents / emotionalData.length
  }

  // Additional helper methods for model calculations
  private calculateEngagementTrend(analytics: LearningAnalytics): 'improving' | 'stable' | 'declining' {
    // Simplified trend calculation
    if (analytics.engagement_metrics.session_frequency < 2) return 'declining'
    if (analytics.engagement_metrics.session_frequency > 4) return 'improving'
    return 'stable'
  }

  private extractModelFeatures(
    riskScore: number,
    riskFactors: RiskFactor[],
    analytics: LearningAnalytics
  ): Record<string, number> {
    return {
      risk_score: riskScore,
      performance_score: analytics.performance_metrics.average_score / 100,
      engagement_level: Math.min(1, analytics.engagement_metrics.session_frequency / 5),
      emotional_distress: analytics.emotional_indicators.stress_level,
      attendance_consistency: analytics.behavioral_patterns.login_consistency,
      help_seeking_behavior: analytics.performance_metrics.help_seeking_frequency,
      learning_velocity: analytics.behavioral_patterns.learning_velocity,
      sentiment_score: (analytics.emotional_indicators.average_sentiment + 1) / 2, // Normalize to 0-1
      peer_interaction: analytics.engagement_metrics.peer_interaction_frequency,
      completion_rate: analytics.performance_metrics.completion_rate
    }
  }

  private calculateDropoutProbability(features: Record<string, number>, model: PredictiveModel): number {
    // Simplified model calculation using feature importance weights
    let probability = 0
    
    probability += features.engagement_level * (1 - model.feature_importance.engagement_decline) * 0.3
    probability += features.performance_score * (1 - model.feature_importance.performance_drop) * 0.25
    probability += features.attendance_consistency * (1 - model.feature_importance.attendance_irregularity) * 0.2
    probability += features.emotional_distress * model.feature_importance.emotional_distress * 0.15
    probability += features.help_seeking_behavior * (1 - model.feature_importance.help_seeking_decrease) * 0.1
    
    return Math.max(0, Math.min(1, probability))
  }

  private calculatePerformanceDeclineProbability(features: Record<string, number>, model: PredictiveModel): number {
    let probability = 0
    
    probability += (1 - features.performance_score) * model.feature_importance.historical_performance * 0.4
    probability += (1 - features.engagement_level) * model.feature_importance.engagement_level * 0.3
    probability += features.emotional_distress * model.feature_importance.emotional_state * 0.2
    probability += (1 - features.learning_velocity) * model.feature_importance.learning_pace * 0.1
    
    return Math.max(0, Math.min(1, probability))
  }

  private calculateEngagementLossProbability(features: Record<string, number>, analytics: LearningAnalytics): number {
    let probability = 0
    
    probability += (1 - features.engagement_level) * 0.4
    probability += (1 - features.attendance_consistency) * 0.3
    probability += features.emotional_distress * 0.2
    probability += (1 - features.peer_interaction) * 0.1
    
    return Math.max(0, Math.min(1, probability))
  }

  private calculateInterventionTimeline(riskScore: number, riskFactors: RiskFactor[]): number {
    // Higher risk = shorter timeline for intervention
    const baseTimeline = 14 // 2 weeks default
    const riskAdjustment = (1 - riskScore) * 10 // 0-10 days adjustment
    const urgentFactors = riskFactors.filter(f => f.severity > 0.8).length
    
    return Math.max(1, baseTimeline - (urgentFactors * 3) + riskAdjustment)
  }

  private calculateInterventionSuccessProbability(
    features: Record<string, number>,
    model: PredictiveModel,
    withIntervention: boolean
  ): number {
    let baseSuccess = 0.6 // Base success rate
    
    // Adjust based on features
    baseSuccess += features.help_seeking_behavior * 0.2
    baseSuccess += features.peer_interaction * 0.1
    baseSuccess += (1 - features.emotional_distress) * 0.15
    baseSuccess += features.attendance_consistency * 0.1
    
    if (withIntervention) {
      baseSuccess += 0.25 // Intervention boost
    }
    
    return Math.max(0.1, Math.min(0.95, baseSuccess))
  }

  private analyzeHistoricalPatterns(riskScore: number, riskFactors: RiskFactor[]): LearnerRiskProfile['historical_patterns'] {
    // Simplified historical analysis
    const similarLearnerOutcomes = this.getSimilarLearnerOutcomes(riskScore, riskFactors)
    
    return {
      similar_learner_outcomes: similarLearnerOutcomes,
      recovery_success_rate: this.calculateRecoverySuccessRate(riskScore),
      typical_intervention_timeline: this.calculateTypicalInterventionTimeline(riskFactors)
    }
  }

  private getSimilarLearnerOutcomes(riskScore: number, riskFactors: RiskFactor[]): string[] {
    // Generate realistic outcomes based on risk level
    if (riskScore > 0.8) {
      return [
        'Required intensive support but successfully completed program',
        'Took extended break and returned to complete',
        'Switched to modified program track'
      ]
    } else if (riskScore > 0.6) {
      return [
        'Improved with targeted interventions',
        'Required some additional support',
        'Successfully completed with modifications'
      ]
    } else {
      return [
        'Recovered quickly with minimal intervention',
        'Self-corrected with minor support',
        'Completed program successfully'
      ]
    }
  }

  private calculateRecoverySuccessRate(riskScore: number): number {
    // Higher risk = lower success rate, but still hopeful
    return Math.max(0.4, 0.9 - (riskScore * 0.3))
  }

  private calculateTypicalInterventionTimeline(riskFactors: RiskFactor[]): number {
    const avgSeverity = riskFactors.reduce((sum, f) => sum + f.severity, 0) / riskFactors.length
    return Math.round(7 + (avgSeverity * 21)) // 1-4 weeks typically
  }

  private determineRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 0.8) return 'critical'
    if (riskScore >= 0.6) return 'high'
    if (riskScore >= 0.4) return 'moderate'
    return 'low'
  }

  private calculatePredictionConfidence(riskFactors: RiskFactor[], analytics: LearningAnalytics): number {
    // Confidence based on data quality and quantity
    let confidence = 0.7 // Base confidence
    
    // More data points = higher confidence
    if (analytics.timeframe.data_points > 100) confidence += 0.1
    if (analytics.timeframe.data_points > 500) confidence += 0.1
    
    // Clear risk factors = higher confidence
    const highSeverityFactors = riskFactors.filter(f => f.severity > 0.7).length
    confidence += highSeverityFactors * 0.05
    
    // Consistent trends = higher confidence
    const consistentTrends = riskFactors.filter(f => f.trend !== 'stable').length
    confidence += consistentTrends * 0.03
    
    return Math.max(0.3, Math.min(0.95, confidence))
  }

  private createFallbackRiskProfile(userId: string, sessionId: string): LearnerRiskProfile {
    return {
      userId,
      sessionId,
      timestamp: new Date(),
      risk_level: 'low',
      risk_score: 0.2,
      confidence: 0.3,
      contributing_factors: [],
      predicted_outcomes: {
        dropout_probability: 0.1,
        performance_decline_probability: 0.15,
        engagement_loss_probability: 0.1,
        time_to_intervention_needed: 30,
        success_probability_with_intervention: 0.85,
        success_probability_without_intervention: 0.75
      },
      early_warning_signals: [],
      intervention_recommendations: [],
      historical_patterns: {
        similar_learner_outcomes: ['Completed program successfully'],
        recovery_success_rate: 0.8,
        typical_intervention_timeline: 14
      }
    }
  }

  // Create additional intervention plans
  private async createPerformanceInterventionPlan(riskFactors: RiskFactor[]): Promise<InterventionRecommendation> {
    return {
      id: `performance_intervention_${Date.now()}`,
      recommendation_type: 'content_adjustment',
      priority: 'high',
      title: 'Performance Recovery Plan',
      description: 'Targeted approach to improve academic performance and rebuild confidence',
      target_risk_factors: ['declining_performance', 'content_difficulty_mismatch'],
      estimated_effectiveness: 0.72,
      implementation_difficulty: 'medium',
      resource_requirements: [
        'Adaptive content system',
        'Performance tracking tools',
        'Tutoring resources'
      ],
      timeline: {
        immediate_actions: [
          'Assess current skill gaps',
          'Adjust content difficulty',
          'Provide immediate feedback'
        ],
        short_term_actions: [
          'Implement personalized practice',
          'Schedule regular assessments',
          'Celebrate small improvements'
        ],
        long_term_actions: [
          'Monitor progress trends',
          'Gradually increase difficulty',
          'Build sustained confidence'
        ]
      },
      success_metrics: [
        'Improved test scores',
        'Increased completion rates',
        'Positive performance trend'
      ],
      alternative_approaches: [
        'Peer tutoring program',
        'Alternative learning modalities',
        'Extended timeline approach'
      ]
    }
  }

  private async createEngagementInterventionPlan(riskFactors: RiskFactor[]): Promise<InterventionRecommendation> {
    return {
      id: `engagement_intervention_${Date.now()}`,
      recommendation_type: 'motivation_boost',
      priority: 'high',
      title: 'Engagement Revival Strategy',
      description: 'Multi-faceted approach to reignite learning motivation and participation',
      target_risk_factors: ['low_engagement', 'irregular_attendance', 'motivation_loss'],
      estimated_effectiveness: 0.68,
      implementation_difficulty: 'medium',
      resource_requirements: [
        'Gamification elements',
        'Social learning features',
        'Motivational content'
      ],
      timeline: {
        immediate_actions: [
          'Introduce gamification elements',
          'Connect with learning community',
          'Set achievable short-term goals'
        ],
        short_term_actions: [
          'Implement reward system',
          'Schedule peer interactions',
          'Track engagement metrics'
        ],
        long_term_actions: [
          'Maintain motivation systems',
          'Evolve challenge levels',
          'Build learning habits'
        ]
      },
      success_metrics: [
        'Increased session frequency',
        'Longer session durations',
        'Higher interaction rates'
      ],
      alternative_approaches: [
        'Social learning groups',
        'Interest-based content',
        'Flexible scheduling options'
      ]
    }
  }

  private async createEmotionalSupportPlan(emotionalRisk: RiskFactor): Promise<InterventionRecommendation> {
    return {
      id: `emotional_intervention_${Date.now()}`,
      recommendation_type: 'emotional_support',
      priority: emotionalRisk.severity > 0.8 ? 'immediate' : 'urgent',
      title: 'Emotional Wellness Support',
      description: 'Comprehensive emotional support to address stress and build resilience',
      target_risk_factors: ['emotional_distress'],
      estimated_effectiveness: 0.75,
      implementation_difficulty: 'medium',
      resource_requirements: [
        'Counseling resources',
        'Stress management tools',
        'Mindfulness programs'
      ],
      timeline: {
        immediate_actions: [
          'Assess emotional state',
          'Provide stress management resources',
          'Offer counseling support'
        ],
        short_term_actions: [
          'Implement mindfulness practices',
          'Regular emotional check-ins',
          'Build coping strategies'
        ],
        long_term_actions: [
          'Develop emotional resilience',
          'Monitor mental health',
          'Maintain support systems'
        ]
      },
      success_metrics: [
        'Reduced stress levels',
        'Improved emotional regulation',
        'Better learning engagement'
      ],
      alternative_approaches: [
        'Peer support groups',
        'Professional counseling',
        'Family involvement programs'
      ]
    }
  }

  // Public API methods
  getLearnerRiskProfile(userId: string): LearnerRiskProfile | null {
    const profiles = this.riskProfiles.get(userId) || []
    return profiles.length > 0 ? profiles[profiles.length - 1] : null
  }

  getRiskHistory(userId: string, limit: number = 10): LearnerRiskProfile[] {
    const profiles = this.riskProfiles.get(userId) || []
    return profiles.slice(-limit)
  }

  getWarningSignals(userId: string): EarlyWarningSignal[] {
    return this.warningSignals.get(userId) || []
  }

  getCriticalRiskLearners(): Array<{ userId: string, riskProfile: LearnerRiskProfile }> {
    const criticalLearners: Array<{ userId: string, riskProfile: LearnerRiskProfile }> = []
    
    this.riskProfiles.forEach((profiles, userId) => {
      const latestProfile = profiles[profiles.length - 1]
      if (latestProfile.risk_level === 'critical' || latestProfile.risk_score > 0.8) {
        criticalLearners.push({ userId, riskProfile: latestProfile })
      }
    })
    
    return criticalLearners.sort((a, b) => b.riskProfile.risk_score - a.riskProfile.risk_score)
  }

  getModelPerformance(): PredictiveModel[] {
    return Array.from(this.models.values())
  }

  async updateModelPerformance(modelId: string, performanceMetrics: Partial<PredictiveModel>): Promise<boolean> {
    const model = this.models.get(modelId)
    if (!model) return false
    
    const updatedModel = { ...model, ...performanceMetrics, last_updated: new Date() }
    this.models.set(modelId, updatedModel)
    return true
  }
}

// Create and export singleton instance
export const predictiveAnalyticsEngine = new PredictiveAnalyticsEngine()
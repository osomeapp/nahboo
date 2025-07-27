'use client'

import { multiModelAI } from './multi-model-ai'

// Types for spaced repetition system
export interface LearningItem {
  item_id: string
  content: {
    title: string
    description: string
    content_text: string
    content_type: 'concept' | 'fact' | 'procedure' | 'principle' | 'formula' | 'vocabulary' | 'skill'
    subject_domain: string
    difficulty_level: number // 1-10 scale
    cognitive_load: number // 1-5 scale
    prerequisites: string[]
    related_items: string[]
  }
  metadata: {
    created_at: Date
    last_modified: Date
    source: string
    tags: string[]
    importance_weight: number // 0-1 scale
    estimated_learning_time: number // minutes
    mastery_threshold: number // 0-1 scale
  }
}

export interface ReviewSession {
  session_id: string
  learner_id: string
  item_id: string
  session_date: Date
  review_type: 'initial_learning' | 'scheduled_review' | 'cramming' | 'reinforcement' | 'assessment'
  performance_data: {
    response_quality: number // 0-1 scale (0 = complete failure, 1 = perfect recall)
    response_time_seconds: number
    confidence_level: number // 0-1 scale (learner's self-reported confidence)
    effort_level: number // 0-1 scale (perceived difficulty by learner)
    hints_used: number
    errors_made: number
    completion_status: 'completed' | 'partial' | 'skipped' | 'failed'
  }
  context_factors: {
    time_of_day: number // 0-23 hours
    session_length_minutes: number
    concurrent_items_reviewed: number
    emotional_state: 'positive' | 'neutral' | 'negative' | 'stressed' | 'excited'
    environment_quality: number // 0-1 scale (distraction level)
    learning_motivation: number // 0-1 scale
  }
  adaptive_adjustments: Array<{
    adjustment_type: 'interval' | 'difficulty' | 'format' | 'context'
    old_value: any
    new_value: any
    rationale: string
  }>
}

export interface MemoryState {
  learner_id: string
  item_id: string
  memory_strength: number // 0-1 scale representing retention probability
  stability: number // how resistant the memory is to forgetting (days)
  retrievability: number // current probability of successful recall (0-1)
  difficulty: number // inherent difficulty of the item for this learner (0-1)
  last_review_date: Date
  review_count: number
  consecutive_successes: number
  consecutive_failures: number
  learning_phase: 'acquisition' | 'consolidation' | 'maintenance' | 'relearning'
  forgetting_curve_parameters: {
    initial_strength: number
    decay_rate: number // how quickly forgetting occurs
    asymptote: number // minimum retention level
    last_calculated: Date
  }
  personalization_factors: {
    learner_ability: number // general learning ability for this content type
    item_affinity: number // how well this item matches learner's preferences
    interference_susceptibility: number // how much other learning affects this item
    optimal_review_conditions: {
      preferred_time_intervals: number[]
      effective_session_lengths: number[]
      beneficial_context_factors: string[]
    }
  }
}

export interface SpacedRepetitionSchedule {
  learner_id: string
  generated_at: Date
  schedule_horizon_days: number
  total_items_tracked: number
  daily_schedules: Array<{
    date: Date
    scheduled_reviews: Array<{
      item_id: string
      priority_score: number
      estimated_duration_minutes: number
      optimal_time_window: {
        start_hour: number
        end_hour: number
      }
      review_reason: 'due_review' | 'strengthening' | 'overdue' | 'preparation' | 'maintenance'
      expected_difficulty: number
      preparation_suggestions: string[]
    }>
    session_recommendations: Array<{
      session_start_time: number // hour of day
      session_duration_minutes: number
      item_sequence: string[]
      session_theme: string
      cognitive_load_profile: number[]
    }>
    daily_metrics: {
      total_review_time: number
      cognitive_load_score: number
      priority_items_count: number
      new_items_capacity: number
    }
  }>
  adaptive_parameters: {
    base_interval_multiplier: number
    success_bonus_factor: number
    failure_penalty_factor: number
    difficulty_adjustment_rate: number
    max_daily_reviews: number
    min_interval_hours: number
    max_interval_days: number
  }
}

export interface ForgettingCurveAnalysis {
  learner_id: string
  item_id: string
  analysis_date: Date
  curve_parameters: {
    initial_retention: number // retention immediately after learning
    half_life: number // time for retention to drop to 50%
    asymptotic_retention: number // long-term retention floor
    decay_function: 'exponential' | 'power' | 'logarithmic' | 'hybrid'
    r_squared: number // goodness of fit
  }
  historical_data_points: Array<{
    time_since_learning: number // hours
    measured_retention: number
    confidence_interval: [number, number]
    measurement_method: 'test' | 'recall' | 'recognition' | 'application'
  }>
  predictions: Array<{
    future_time_hours: number
    predicted_retention: number
    confidence_interval: [number, number]
    optimal_review_probability: number
  }>
  personalization_insights: {
    compared_to_average: number // how this learner compares to population
    strongest_retention_factors: string[]
    weakest_retention_factors: string[]
    recommended_optimizations: string[]
  }
}

export interface LeitnerBoxSystem {
  learner_id: string
  boxes: Array<{
    box_number: number
    review_interval_days: number
    items: string[]
    graduation_criteria: {
      consecutive_successes_required: number
      confidence_threshold: number
      time_consistency_required: boolean
    }
    demotion_criteria: {
      failure_threshold: number
      confidence_drop_threshold: number
    }
  }>
  promotion_rules: Array<{
    from_box: number
    to_box: number
    condition: string
    success_reward: number
  }>
  system_parameters: {
    initial_interval_days: number
    interval_multiplier: number
    max_box_level: number
    graduation_bonus_days: number
  }
}

export interface SuperMemoAlgorithm {
  version: 'SM-2' | 'SM-15' | 'SM-17' | 'SM-18'
  learner_id: string
  item_parameters: Array<{
    item_id: string
    easiness_factor: number // E-Factor in SuperMemo
    interval: number // days until next review
    repetition_number: number
    last_quality_response: number // 0-5 scale
    optimal_factors: {
      optimal_interval: number
      interval_modifier: number
      difficulty_modifier: number
    }
  }>
  algorithm_parameters: {
    initial_easiness: number
    min_easiness: number
    max_easiness: number
    easiness_adjustment_rates: {
      poor_response: number
      good_response: number
      excellent_response: number
    }
    interval_calculations: {
      first_interval: number
      second_interval: number
      subsequent_multiplier: number
    }
  }
}

export interface AnkiInspiredSettings {
  learner_id: string
  deck_settings: Array<{
    deck_id: string
    new_cards_per_day: number
    maximum_reviews_per_day: number
    graduating_interval: number
    easy_interval: number
    starting_ease: number
    easy_bonus: number
    interval_modifier: number
    hard_interval: number
    new_interval: number
  }>
  learning_steps: number[] // minutes for learning phase
  relearning_steps: number[] // minutes for relearning failed cards
  lapses: {
    relearning_steps: number[]
    minimum_interval: number
    leech_threshold: number
    leech_action: 'suspend' | 'tag' | 'delete'
  }
  advanced_settings: {
    maximum_interval: number
    starting_ease: number
    easy_bonus: number
    interval_modifier: number
    hard_interval: number
    new_interval: number
  }
}

// Main Spaced Repetition Engine
export class SpacedRepetitionEngine {
  private memoryStates = new Map<string, MemoryState>()
  private reviewHistory = new Map<string, ReviewSession[]>()
  private scheduleCache = new Map<string, SpacedRepetitionSchedule>()
  private forgettingCurves = new Map<string, ForgettingCurveAnalysis>()
  private leitnerSystems = new Map<string, LeitnerBoxSystem>()
  private superMemoData = new Map<string, SuperMemoAlgorithm>()
  
  // Add new learning item to spaced repetition system
  async addLearningItem(
    learnerId: string,
    item: LearningItem,
    initialPerformance?: Partial<ReviewSession['performance_data']>
  ): Promise<MemoryState> {
    const memoryStateId = `${learnerId}_${item.item_id}`
    
    // Initialize memory state
    const memoryState: MemoryState = {
      learner_id: learnerId,
      item_id: item.item_id,
      memory_strength: initialPerformance?.response_quality || 0.5,
      stability: this.calculateInitialStability(item, initialPerformance),
      retrievability: initialPerformance?.response_quality || 0.5,
      difficulty: this.estimateItemDifficulty(item, learnerId),
      last_review_date: new Date(),
      review_count: initialPerformance ? 1 : 0,
      consecutive_successes: initialPerformance?.response_quality > 0.7 ? 1 : 0,
      consecutive_failures: initialPerformance?.response_quality < 0.3 ? 1 : 0,
      learning_phase: 'acquisition',
      forgetting_curve_parameters: {
        initial_strength: initialPerformance?.response_quality || 0.5,
        decay_rate: this.estimateDecayRate(item, learnerId),
        asymptote: 0.1,
        last_calculated: new Date()
      },
      personalization_factors: {
        learner_ability: await this.estimateLearnerAbility(learnerId, item.content.subject_domain),
        item_affinity: await this.calculateItemAffinity(learnerId, item),
        interference_susceptibility: 0.3,
        optimal_review_conditions: {
          preferred_time_intervals: [1, 3, 7, 14, 30],
          effective_session_lengths: [15, 30, 45],
          beneficial_context_factors: ['quiet_environment', 'morning_hours', 'focused_attention']
        }
      }
    }
    
    this.memoryStates.set(memoryStateId, memoryState)
    
    // Initialize review history
    if (initialPerformance) {
      const initialSession: ReviewSession = {
        session_id: `session_${Date.now()}`,
        learner_id: learnerId,
        item_id: item.item_id,
        session_date: new Date(),
        review_type: 'initial_learning',
        performance_data: {
          response_quality: initialPerformance.response_quality || 0.5,
          response_time_seconds: initialPerformance.response_time_seconds || 60,
          confidence_level: initialPerformance.confidence_level || 0.5,
          effort_level: initialPerformance.effort_level || 0.5,
          hints_used: initialPerformance.hints_used || 0,
          errors_made: initialPerformance.errors_made || 0,
          completion_status: 'completed'
        },
        context_factors: {
          time_of_day: new Date().getHours(),
          session_length_minutes: 10,
          concurrent_items_reviewed: 1,
          emotional_state: 'neutral',
          environment_quality: 0.8,
          learning_motivation: 0.7
        },
        adaptive_adjustments: []
      }
      
      this.reviewHistory.set(memoryStateId, [initialSession])
    }
    
    return memoryState
  }
  
  // Record a review session and update memory state
  async recordReviewSession(
    learnerId: string,
    itemId: string,
    sessionData: Partial<ReviewSession>
  ): Promise<{
    updated_memory_state: MemoryState
    next_review_date: Date
    adaptive_adjustments: any[]
    learning_insights: string[]
  }> {
    const memoryStateId = `${learnerId}_${itemId}`
    const memoryState = this.memoryStates.get(memoryStateId)
    
    if (!memoryState) {
      throw new Error(`Memory state not found for learner ${learnerId} and item ${itemId}`)
    }
    
    // Create review session
    const session: ReviewSession = {
      session_id: `session_${Date.now()}`,
      learner_id: learnerId,
      item_id: itemId,
      session_date: new Date(),
      review_type: sessionData.review_type || 'scheduled_review',
      performance_data: {
        response_quality: sessionData.performance_data?.response_quality || 0.5,
        response_time_seconds: sessionData.performance_data?.response_time_seconds || 60,
        confidence_level: sessionData.performance_data?.confidence_level || 0.5,
        effort_level: sessionData.performance_data?.effort_level || 0.5,
        hints_used: sessionData.performance_data?.hints_used || 0,
        errors_made: sessionData.performance_data?.errors_made || 0,
        completion_status: sessionData.performance_data?.completion_status || 'completed'
      },
      context_factors: {
        time_of_day: sessionData.context_factors?.time_of_day || new Date().getHours(),
        session_length_minutes: sessionData.context_factors?.session_length_minutes || 10,
        concurrent_items_reviewed: sessionData.context_factors?.concurrent_items_reviewed || 1,
        emotional_state: sessionData.context_factors?.emotional_state || 'neutral',
        environment_quality: sessionData.context_factors?.environment_quality || 0.8,
        learning_motivation: sessionData.context_factors?.learning_motivation || 0.7
      },
      adaptive_adjustments: []
    }
    
    // Update review history
    const history = this.reviewHistory.get(memoryStateId) || []
    history.push(session)
    this.reviewHistory.set(memoryStateId, history)
    
    // Update memory state using AI-powered analysis
    const updatedState = await this.updateMemoryState(memoryState, session, history)
    this.memoryStates.set(memoryStateId, updatedState)
    
    // Calculate next review date
    const nextReviewDate = this.calculateNextReviewDate(updatedState, session)
    
    // Generate adaptive adjustments
    const adaptiveAdjustments = await this.generateAdaptiveAdjustments(updatedState, session, history)
    
    // Generate learning insights
    const learningInsights = await this.generateLearningInsights(updatedState, history)
    
    return {
      updated_memory_state: updatedState,
      next_review_date: nextReviewDate,
      adaptive_adjustments: adaptiveAdjustments,
      learning_insights: learningInsights
    }
  }
  
  // Generate personalized spaced repetition schedule
  async generateSchedule(
    learnerId: string,
    horizonDays: number = 30,
    maxDailyReviews: number = 50
  ): Promise<SpacedRepetitionSchedule> {
    const learnerMemoryStates = Array.from(this.memoryStates.values())
      .filter(state => state.learner_id === learnerId)
    
    if (learnerMemoryStates.length === 0) {
      throw new Error(`No learning items found for learner ${learnerId}`)
    }
    
    const schedule: SpacedRepetitionSchedule = {
      learner_id: learnerId,
      generated_at: new Date(),
      schedule_horizon_days: horizonDays,
      total_items_tracked: learnerMemoryStates.length,
      daily_schedules: [],
      adaptive_parameters: {
        base_interval_multiplier: 2.5,
        success_bonus_factor: 1.3,
        failure_penalty_factor: 0.7,
        difficulty_adjustment_rate: 0.15,
        max_daily_reviews: maxDailyReviews,
        min_interval_hours: 4,
        max_interval_days: 365
      }
    }
    
    // Generate daily schedules
    for (let dayOffset = 0; dayOffset < horizonDays; dayOffset++) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + dayOffset)
      
      const dailySchedule = await this.generateDailySchedule(
        learnerId,
        targetDate,
        learnerMemoryStates,
        schedule.adaptive_parameters
      )
      
      schedule.daily_schedules.push(dailySchedule)
    }
    
    // Cache the schedule
    this.scheduleCache.set(learnerId, schedule)
    
    return schedule
  }
  
  // Analyze forgetting curve for specific item
  async analyzeForgettingCurve(
    learnerId: string,
    itemId: string
  ): Promise<ForgettingCurveAnalysis> {
    const memoryStateId = `${learnerId}_${itemId}`
    const memoryState = this.memoryStates.get(memoryStateId)
    const reviewHistory = this.reviewHistory.get(memoryStateId) || []
    
    if (!memoryState || reviewHistory.length < 2) {
      throw new Error(`Insufficient data for forgetting curve analysis`)
    }
    
    // Prepare data points for curve fitting
    const dataPoints = reviewHistory.map(session => {
      const timeSinceLastReview = memoryState.last_review_date.getTime() - session.session_date.getTime()
      return {
        time_since_learning: timeSinceLastReview / (1000 * 60 * 60), // hours
        measured_retention: session.performance_data.response_quality,
        confidence_interval: [
          Math.max(0, session.performance_data.response_quality - session.performance_data.confidence_level * 0.2),
          Math.min(1, session.performance_data.response_quality + session.performance_data.confidence_level * 0.2)
        ] as [number, number],
        measurement_method: 'recall' as const
      }
    })
    
    // Fit forgetting curve using AI
    const curveAnalysis = await this.fitForgettingCurve(learnerId, itemId, dataPoints)
    
    // Generate predictions
    const predictions = this.generateRetentionPredictions(curveAnalysis.curve_parameters, 720) // 30 days
    
    // Generate personalization insights
    const personalizedInsights = await this.generatePersonalizationInsights(
      learnerId,
      itemId,
      curveAnalysis,
      memoryState
    )
    
    const analysis: ForgettingCurveAnalysis = {
      learner_id: learnerId,
      item_id: itemId,
      analysis_date: new Date(),
      curve_parameters: curveAnalysis.curve_parameters,
      historical_data_points: dataPoints,
      predictions,
      personalization_insights: personalizedInsights
    }
    
    this.forgettingCurves.set(memoryStateId, analysis)
    return analysis
  }
  
  // Optimize review intervals using AI
  async optimizeReviewIntervals(
    learnerId: string,
    itemIds?: string[]
  ): Promise<{
    optimized_intervals: Array<{
      item_id: string
      current_interval: number
      optimized_interval: number
      confidence: number
      rationale: string
    }>
    overall_improvement: number
    personalized_factors: string[]
  }> {
    const relevantStates = Array.from(this.memoryStates.values())
      .filter(state => 
        state.learner_id === learnerId && 
        (!itemIds || itemIds.includes(state.item_id))
      )
    
    const optimizationPrompt = `
      Optimize spaced repetition intervals for learner ${learnerId}.
      
      Current Memory States:
      ${JSON.stringify(relevantStates.map(state => ({
        item_id: state.item_id,
        memory_strength: state.memory_strength,
        stability: state.stability,
        retrievability: state.retrievability,
        difficulty: state.difficulty,
        review_count: state.review_count,
        learning_phase: state.learning_phase,
        forgetting_curve: state.forgetting_curve_parameters
      })))}
      
      Historical Performance:
      ${JSON.stringify(this.getHistoricalPerformanceSummary(learnerId, itemIds))}
      
      Analyze and optimize:
      1. Current interval effectiveness
      2. Personalized learning patterns
      3. Optimal interval recommendations
      4. Expected retention improvements
      
      Consider:
      - Individual forgetting curves
      - Learning efficiency
      - Time investment optimization
      - Long-term retention goals
      
      Return optimization recommendations as structured JSON.
    `
    
    try {
      const optimization = await multiModelAI.generateContent(
        optimizationPrompt,
        'spaced_repetition_optimization',
        { temperature: 0.3 }
      )
      
      return this.parseOptimizationResults(optimization, relevantStates)
      
    } catch (error) {
      console.error('Interval optimization failed:', error)
      
      // Return fallback optimization
      return {
        optimized_intervals: relevantStates.map(state => ({
          item_id: state.item_id,
          current_interval: state.stability,
          optimized_interval: state.stability * 1.2,
          confidence: 0.7,
          rationale: 'Conservative interval increase based on current stability'
        })),
        overall_improvement: 0.15,
        personalized_factors: ['stability_based_adjustment']
      }
    }
  }
  
  // Implement Leitner Box system
  initializeLeitnerSystem(
    learnerId: string,
    maxBoxes: number = 5,
    initialInterval: number = 1
  ): LeitnerBoxSystem {
    const system: LeitnerBoxSystem = {
      learner_id: learnerId,
      boxes: Array.from({ length: maxBoxes }, (_, index) => ({
        box_number: index + 1,
        review_interval_days: initialInterval * Math.pow(2, index),
        items: [],
        graduation_criteria: {
          consecutive_successes_required: 2 + index,
          confidence_threshold: 0.8,
          time_consistency_required: index > 2
        },
        demotion_criteria: {
          failure_threshold: 0.3,
          confidence_drop_threshold: 0.4
        }
      })),
      promotion_rules: Array.from({ length: maxBoxes - 1 }, (_, index) => ({
        from_box: index + 1,
        to_box: index + 2,
        condition: `consecutive_successes >= ${2 + index} AND confidence >= 0.8`,
        success_reward: 0.1
      })),
      system_parameters: {
        initial_interval_days: initialInterval,
        interval_multiplier: 2,
        max_box_level: maxBoxes,
        graduation_bonus_days: 7
      }
    }
    
    this.leitnerSystems.set(learnerId, system)
    return system
  }
  
  // Implement SuperMemo algorithm
  initializeSuperMemo(
    learnerId: string,
    version: SuperMemoAlgorithm['version'] = 'SM-2'
  ): SuperMemoAlgorithm {
    const algorithm: SuperMemoAlgorithm = {
      version,
      learner_id: learnerId,
      item_parameters: [],
      algorithm_parameters: {
        initial_easiness: 2.5,
        min_easiness: 1.3,
        max_easiness: 5.0,
        easiness_adjustment_rates: {
          poor_response: -0.8,
          good_response: 0.1,
          excellent_response: 0.15
        },
        interval_calculations: {
          first_interval: 1,
          second_interval: 6,
          subsequent_multiplier: 2.5
        }
      }
    }
    
    this.superMemoData.set(learnerId, algorithm)
    return algorithm
  }
  
  // Get optimal review time suggestions
  async getOptimalReviewTimes(
    learnerId: string,
    targetDate: Date
  ): Promise<Array<{
    time_window: { start_hour: number, end_hour: number }
    cognitive_readiness_score: number
    expected_performance: number
    recommended_item_types: string[]
    session_length_minutes: number
  }>> {
    const learnerStates = Array.from(this.memoryStates.values())
      .filter(state => state.learner_id === learnerId)
    
    const optimizationPrompt = `
      Determine optimal review times for learner ${learnerId} on ${targetDate.toDateString()}.
      
      Learner Profile Summary:
      - Total items tracked: ${learnerStates.length}
      - Learning phases: ${this.getPhaseDistribution(learnerStates)}
      - Average performance: ${this.getAveragePerformance(learnerId)}
      - Preferred review conditions: ${this.getPreferredConditions(learnerStates)}
      
      Consider:
      1. Circadian rhythms and cognitive performance
      2. Memory consolidation patterns
      3. Interference and spacing effects
      4. Individual learning preferences
      5. Cognitive load optimization
      
      Recommend 3-5 optimal time windows with:
      - Specific hour ranges
      - Cognitive readiness scores
      - Expected performance levels
      - Suitable content types
      - Optimal session lengths
      
      Return structured recommendations as JSON.
    `
    
    try {
      const recommendations = await multiModelAI.generateContent(
        optimizationPrompt,
        'temporal_optimization',
        { temperature: 0.4 }
      )
      
      return this.parseTimeRecommendations(recommendations)
      
    } catch (error) {
      console.error('Optimal time analysis failed:', error)
      
      // Return default time windows
      return [
        {
          time_window: { start_hour: 9, end_hour: 11 },
          cognitive_readiness_score: 0.9,
          expected_performance: 0.85,
          recommended_item_types: ['concept', 'principle'],
          session_length_minutes: 45
        },
        {
          time_window: { start_hour: 15, end_hour: 17 },
          cognitive_readiness_score: 0.8,
          expected_performance: 0.75,
          recommended_item_types: ['fact', 'vocabulary'],
          session_length_minutes: 30
        },
        {
          time_window: { start_hour: 19, end_hour: 21 },
          cognitive_readiness_score: 0.7,
          expected_performance: 0.7,
          recommended_item_types: ['procedure', 'skill'],
          session_length_minutes: 30
        }
      ]
    }
  }
  
  // Helper methods
  private calculateInitialStability(item: LearningItem, performance?: Partial<ReviewSession['performance_data']>): number {
    const baseStability = 1 // 1 day
    const difficultyFactor = 1 - (item.content.difficulty_level - 1) / 9 // 0.1 to 1.0
    const performanceFactor = performance?.response_quality || 0.5
    
    return baseStability * difficultyFactor * performanceFactor * 2
  }
  
  private estimateItemDifficulty(item: LearningItem, learnerId: string): number {
    // Simplified difficulty estimation
    return item.content.difficulty_level / 10
  }
  
  private estimateDecayRate(item: LearningItem, learnerId: string): number {
    // Higher difficulty = faster decay
    return 0.1 + (item.content.difficulty_level / 10) * 0.3
  }
  
  private async estimateLearnerAbility(learnerId: string, domain: string): Promise<number> {
    const learnerStates = Array.from(this.memoryStates.values())
      .filter(state => state.learner_id === learnerId)
    
    if (learnerStates.length === 0) return 0.5
    
    const avgPerformance = learnerStates.reduce((sum, state) => sum + state.memory_strength, 0) / learnerStates.length
    return avgPerformance
  }
  
  private async calculateItemAffinity(learnerId: string, item: LearningItem): Promise<number> {
    // Simplified affinity calculation
    return 0.7 // Default moderate affinity
  }
  
  private async updateMemoryState(
    currentState: MemoryState,
    session: ReviewSession,
    history: ReviewSession[]
  ): Promise<MemoryState> {
    const daysSinceLastReview = (session.session_date.getTime() - currentState.last_review_date.getTime()) / (1000 * 60 * 60 * 24)
    
    // Update retrievability based on forgetting curve
    const retrievabilityDecay = Math.exp(-daysSinceLastReview / currentState.stability)
    const currentRetrievability = currentState.retrievability * retrievabilityDecay
    
    // Update stability based on performance
    const performanceFactor = session.performance_data.response_quality
    const stabilityMultiplier = performanceFactor > 0.7 ? 1.3 : performanceFactor < 0.3 ? 0.7 : 1.0
    const newStability = currentState.stability * stabilityMultiplier
    
    // Update memory strength
    const newMemoryStrength = (currentRetrievability + performanceFactor) / 2
    
    // Update consecutive counters
    let consecutiveSuccesses = currentState.consecutive_successes
    let consecutiveFailures = currentState.consecutive_failures
    
    if (performanceFactor > 0.7) {
      consecutiveSuccesses++
      consecutiveFailures = 0
    } else if (performanceFactor < 0.3) {
      consecutiveFailures++
      consecutiveSuccesses = 0
    }
    
    // Determine learning phase
    let learningPhase: MemoryState['learning_phase'] = currentState.learning_phase
    if (currentState.review_count < 3) {
      learningPhase = 'acquisition'
    } else if (newStability > 7 && consecutiveSuccesses > 2) {
      learningPhase = 'maintenance'
    } else if (consecutiveFailures > 1) {
      learningPhase = 'relearning'
    } else {
      learningPhase = 'consolidation'
    }
    
    return {
      ...currentState,
      memory_strength: newMemoryStrength,
      stability: newStability,
      retrievability: performanceFactor,
      last_review_date: session.session_date,
      review_count: currentState.review_count + 1,
      consecutive_successes: consecutiveSuccesses,
      consecutive_failures: consecutiveFailures,
      learning_phase: learningPhase,
      forgetting_curve_parameters: {
        ...currentState.forgetting_curve_parameters,
        initial_strength: newMemoryStrength,
        last_calculated: session.session_date
      }
    }
  }
  
  private calculateNextReviewDate(memoryState: MemoryState, session: ReviewSession): Date {
    const baseInterval = memoryState.stability
    const performanceAdjustment = session.performance_data.response_quality > 0.7 ? 1.3 : 
                                  session.performance_data.response_quality < 0.3 ? 0.7 : 1.0
    
    const adjustedInterval = baseInterval * performanceAdjustment
    const nextReviewDate = new Date(session.session_date)
    nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(adjustedInterval))
    
    return nextReviewDate
  }
  
  private async generateAdaptiveAdjustments(
    memoryState: MemoryState,
    session: ReviewSession,
    history: ReviewSession[]
  ): Promise<any[]> {
    const adjustments = []
    
    // Interval adjustment based on performance
    if (session.performance_data.response_quality < 0.3) {
      adjustments.push({
        adjustment_type: 'interval',
        old_value: memoryState.stability,
        new_value: memoryState.stability * 0.7,
        rationale: 'Reducing interval due to poor performance'
      })
    } else if (session.performance_data.response_quality > 0.9) {
      adjustments.push({
        adjustment_type: 'interval',
        old_value: memoryState.stability,
        new_value: memoryState.stability * 1.3,
        rationale: 'Increasing interval due to excellent performance'
      })
    }
    
    return adjustments
  }
  
  private async generateLearningInsights(
    memoryState: MemoryState,
    history: ReviewSession[]
  ): Promise<string[]> {
    const insights: string[] = []
    
    if (memoryState.consecutive_successes > 3) {
      insights.push('Strong retention pattern - consider extending review intervals')
    }
    
    if (memoryState.consecutive_failures > 1) {
      insights.push('Consider reviewing prerequisites or adjusting learning approach')
    }
    
    const avgResponseTime = history.reduce((sum, s) => sum + s.performance_data.response_time_seconds, 0) / history.length
    if (avgResponseTime > 120) {
      insights.push('Response time suggests difficulty - consider breaking down into smaller concepts')
    }
    
    return insights
  }
  
  private async generateDailySchedule(
    learnerId: string,
    targetDate: Date,
    memoryStates: MemoryState[],
    parameters: SpacedRepetitionSchedule['adaptive_parameters']
  ): Promise<SpacedRepetitionSchedule['daily_schedules'][0]> {
    // Find items due for review
    const dueItems = memoryStates.filter(state => {
      const daysSinceReview = (targetDate.getTime() - state.last_review_date.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceReview >= state.stability
    })
    
    // Sort by priority (overdue items first, then by importance)
    const prioritizedItems = dueItems
      .map(state => {
        const daysSinceReview = (targetDate.getTime() - state.last_review_date.getTime()) / (1000 * 60 * 60 * 24)
        const overdueAmount = daysSinceReview - state.stability
        const priorityScore = overdueAmount * 10 + (1 - state.retrievability) * 5
        
        return {
          item_id: state.item_id,
          priority_score: priorityScore,
          estimated_duration_minutes: 5 + state.difficulty * 10,
          optimal_time_window: { start_hour: 9, end_hour: 11 },
          review_reason: overdueAmount > 0 ? 'overdue' as const : 'due_review' as const,
          expected_difficulty: state.difficulty,
          preparation_suggestions: this.generatePreparationSuggestions(state)
        }
      })
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, parameters.max_daily_reviews)
    
    return {
      date: targetDate,
      scheduled_reviews: prioritizedItems,
      session_recommendations: [{
        session_start_time: 9,
        session_duration_minutes: Math.min(60, prioritizedItems.length * 8),
        item_sequence: prioritizedItems.map(item => item.item_id),
        session_theme: 'morning_review',
        cognitive_load_profile: prioritizedItems.map(item => item.expected_difficulty)
      }],
      daily_metrics: {
        total_review_time: prioritizedItems.reduce((sum, item) => sum + item.estimated_duration_minutes, 0),
        cognitive_load_score: prioritizedItems.reduce((sum, item) => sum + item.expected_difficulty, 0) / prioritizedItems.length,
        priority_items_count: prioritizedItems.filter(item => item.priority_score > 5).length,
        new_items_capacity: Math.max(0, parameters.max_daily_reviews - prioritizedItems.length)
      }
    }
  }
  
  private generatePreparationSuggestions(memoryState: MemoryState): string[] {
    const suggestions: string[] = []
    
    if (memoryState.difficulty > 0.7) {
      suggestions.push('Review related concepts first')
    }
    
    if (memoryState.consecutive_failures > 0) {
      suggestions.push('Focus on understanding rather than memorization')
    }
    
    if (memoryState.learning_phase === 'relearning') {
      suggestions.push('Use active recall techniques')
    }
    
    return suggestions
  }
  
  private async fitForgettingCurve(
    learnerId: string,
    itemId: string,
    dataPoints: ForgettingCurveAnalysis['historical_data_points']
  ): Promise<{ curve_parameters: ForgettingCurveAnalysis['curve_parameters'] }> {
    // Simplified curve fitting - in reality would use regression analysis
    const initialRetention = Math.max(...dataPoints.map(p => p.measured_retention))
    const finalRetention = Math.min(...dataPoints.map(p => p.measured_retention))
    const halfLife = 24 // 24 hours default
    
    return {
      curve_parameters: {
        initial_retention: initialRetention,
        half_life: halfLife,
        asymptotic_retention: finalRetention,
        decay_function: 'exponential',
        r_squared: 0.85
      }
    }
  }
  
  private generateRetentionPredictions(
    curveParams: ForgettingCurveAnalysis['curve_parameters'],
    maxHours: number
  ): ForgettingCurveAnalysis['predictions'] {
    const predictions: ForgettingCurveAnalysis['predictions'] = []
    
    for (let hours = 1; hours <= maxHours; hours *= 2) {
      const retention = curveParams.asymptotic_retention + 
        (curveParams.initial_retention - curveParams.asymptotic_retention) * 
        Math.exp(-hours / curveParams.half_life)
      
      predictions.push({
        future_time_hours: hours,
        predicted_retention: retention,
        confidence_interval: [retention - 0.1, retention + 0.1],
        optimal_review_probability: retention < 0.5 ? 0.9 : retention < 0.7 ? 0.6 : 0.3
      })
    }
    
    return predictions
  }
  
  private async generatePersonalizationInsights(
    learnerId: string,
    itemId: string,
    curveAnalysis: { curve_parameters: ForgettingCurveAnalysis['curve_parameters'] },
    memoryState: MemoryState
  ): Promise<ForgettingCurveAnalysis['personalization_insights']> {
    return {
      compared_to_average: curveAnalysis.curve_parameters.half_life > 24 ? 0.2 : -0.2,
      strongest_retention_factors: ['active_recall', 'spaced_practice'],
      weakest_retention_factors: ['interference', 'complexity'],
      recommended_optimizations: ['increase_active_recall', 'reduce_session_complexity']
    }
  }
  
  private getHistoricalPerformanceSummary(learnerId: string, itemIds?: string[]): any {
    // Simplified performance summary
    return {
      avg_response_quality: 0.75,
      avg_response_time: 45,
      success_rate: 0.8,
      improvement_trend: 0.1
    }
  }
  
  private parseOptimizationResults(optimization: string, states: MemoryState[]): any {
    try {
      return JSON.parse(optimization)
    } catch {
      // Fallback optimization
      return {
        optimized_intervals: states.map(state => ({
          item_id: state.item_id,
          current_interval: state.stability,
          optimized_interval: state.stability * 1.2,
          confidence: 0.7,
          rationale: 'Conservative interval increase'
        })),
        overall_improvement: 0.15,
        personalized_factors: ['stability_adjustment']
      }
    }
  }
  
  private getPhaseDistribution(states: MemoryState[]): Record<string, number> {
    return states.reduce((acc, state) => {
      acc[state.learning_phase] = (acc[state.learning_phase] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  private getAveragePerformance(learnerId: string): number {
    const states = Array.from(this.memoryStates.values())
      .filter(state => state.learner_id === learnerId)
    
    return states.reduce((sum, state) => sum + state.memory_strength, 0) / states.length
  }
  
  private getPreferredConditions(states: MemoryState[]): string[] {
    // Extract common preferred conditions
    return ['morning_sessions', 'quiet_environment', 'moderate_difficulty']
  }
  
  private parseTimeRecommendations(recommendations: string): any[] {
    try {
      return JSON.parse(recommendations)
    } catch {
      // Return default recommendations
      return [
        {
          time_window: { start_hour: 9, end_hour: 11 },
          cognitive_readiness_score: 0.9,
          expected_performance: 0.85,
          recommended_item_types: ['concept'],
          session_length_minutes: 45
        }
      ]
    }
  }
  
  // Get memory state for specific item
  getMemoryState(learnerId: string, itemId: string): MemoryState | null {
    return this.memoryStates.get(`${learnerId}_${itemId}`) || null
  }
  
  // Get schedule for learner
  getSchedule(learnerId: string): SpacedRepetitionSchedule | null {
    return this.scheduleCache.get(learnerId) || null
  }
  
  // Get forgetting curve analysis
  getForgettingCurve(learnerId: string, itemId: string): ForgettingCurveAnalysis | null {
    return this.forgettingCurves.get(`${learnerId}_${itemId}`) || null
  }
  
  // Get items due for review today
  getItemsDueToday(learnerId: string): Array<{ item_id: string, priority: number, overdue_days: number }> {
    const today = new Date()
    const states = Array.from(this.memoryStates.values())
      .filter(state => state.learner_id === learnerId)
    
    return states
      .map(state => {
        const daysSinceReview = (today.getTime() - state.last_review_date.getTime()) / (1000 * 60 * 60 * 24)
        const overdueDays = daysSinceReview - state.stability
        
        return {
          item_id: state.item_id,
          priority: overdueDays > 0 ? overdueDays : 1 - state.retrievability,
          overdue_days: Math.max(0, overdueDays)
        }
      })
      .filter(item => item.overdue_days >= 0 || item.priority > 0.5)
      .sort((a, b) => b.priority - a.priority)
  }
}

// Create singleton instance
export const spacedRepetitionEngine = new SpacedRepetitionEngine()

// Helper functions
export function createLearningItem(
  itemId: string,
  title: string,
  content: string,
  contentType: LearningItem['content']['content_type'] = 'concept',
  difficulty: number = 5
): LearningItem {
  return {
    item_id: itemId,
    content: {
      title,
      description: `Learning item: ${title}`,
      content_text: content,
      content_type: contentType,
      subject_domain: 'general',
      difficulty_level: difficulty,
      cognitive_load: Math.ceil(difficulty / 2),
      prerequisites: [],
      related_items: []
    },
    metadata: {
      created_at: new Date(),
      last_modified: new Date(),
      source: 'user_generated',
      tags: [],
      importance_weight: 0.7,
      estimated_learning_time: 10,
      mastery_threshold: 0.8
    }
  }
}
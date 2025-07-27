// Adaptive Learning System Types
// Comprehensive TypeScript interfaces for adaptive learning functionality

import type { UserProfile, ContentItem } from './index'

// ================================
// Core Adaptive Types
// ================================

export interface AdaptiveRequest {
  userId: string
  userProfile: UserProfile
  interactions: UserInteraction[]
  context: LearningContext
  options?: AdaptiveOptions
}

export interface AdaptiveResponse {
  adaptations: Adaptation[]
  recommendations: Recommendation[]
  analytics: AdaptationAnalytics
  confidence: number
  nextActions: string[]
}

export interface UserInteraction {
  type: InteractionType
  timestamp: Date
  duration: number
  content_id?: string
  data: InteractionData
  context: InteractionContext
}

export type InteractionType = 
  | 'content_view'
  | 'quiz_attempt'
  | 'scroll'
  | 'click'
  | 'pause'
  | 'resume'
  | 'navigation'
  | 'answer_submit'
  | 'hint_request'
  | 'help_request'

export interface InteractionData {
  success?: boolean
  score?: number
  attempts?: number
  time_spent?: number
  engagement_level?: number
  difficulty_rating?: number
  additional_data?: Record<string, unknown>
}

export interface InteractionContext {
  page_url: string
  session_id: string
  device_type: 'desktop' | 'tablet' | 'mobile'
  browser_info: BrowserInfo
  learning_session_id?: string
}

export interface BrowserInfo {
  name: string
  version: string
  os: string
  screen_resolution: string
  viewport_size: string
}

// ================================
// Learning Context Types
// ================================

export interface LearningContext {
  current_content?: ContentItem
  learning_objectives: string[]
  session_duration: number
  previous_performance: PerformanceMetrics
  learning_style_preferences?: LearningStylePreferences
  environmental_factors: EnvironmentalFactors
}

export interface PerformanceMetrics {
  recent_scores: number[]
  average_completion_time: number
  success_rate: number
  engagement_score: number
  difficulty_progression: number[]
  knowledge_gaps: string[]
}

export interface LearningStylePreferences {
  visual: number
  auditory: number
  kinesthetic: number
  reading: number
  preferred_pace: 'slow' | 'medium' | 'fast'
  preferred_feedback_frequency: 'immediate' | 'periodic' | 'delayed'
}

export interface EnvironmentalFactors {
  time_of_day: string
  day_of_week: string
  session_length: number
  distraction_level: number
  device_performance: DevicePerformance
}

export interface DevicePerformance {
  cpu_usage: number
  memory_usage: number
  network_speed: number
  battery_level?: number
}

// ================================
// Adaptation Types
// ================================

export interface Adaptation {
  id: string
  type: AdaptationType
  target: AdaptationTarget
  action: AdaptationAction
  priority: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  expected_impact: number
  duration: number
  metadata: AdaptationMetadata
}

export type AdaptationType = 
  | 'difficulty'
  | 'pacing'
  | 'content_format'
  | 'hints'
  | 'examples'
  | 'encouragement'
  | 'break_suggestion'
  | 'content_order'
  | 'learning_path'

export type AdaptationTarget = 
  | 'current_content'
  | 'next_content'
  | 'user_interface'
  | 'learning_sequence'
  | 'assessment_strategy'

export interface AdaptationAction {
  type: string
  parameters: Record<string, unknown>
  implementation: string
  rollback_strategy: string
}

export interface AdaptationMetadata {
  created_at: Date
  applied_at?: Date
  effectiveness_score?: number
  user_feedback?: UserFeedback
  system_metrics?: SystemMetrics
}

// ================================
// Analytics Types
// ================================

export interface AdaptationAnalytics {
  user_id: string
  session_id: string
  total_adaptations: number
  successful_adaptations: number
  adaptation_breakdown: AdaptationBreakdown
  performance_impact: PerformanceImpact
  engagement_metrics: EngagementMetrics
  learning_velocity: LearningVelocity
}

export interface AdaptationBreakdown {
  by_type: Record<AdaptationType, number>
  by_target: Record<AdaptationTarget, number>
  by_priority: Record<string, number>
  success_rates: Record<AdaptationType, number>
}

export interface PerformanceImpact {
  score_improvement: number
  completion_time_change: number
  engagement_change: number
  retention_improvement: number
  confidence_change: number
}

export interface EngagementMetrics {
  session_length: number
  interaction_frequency: number
  content_completion_rate: number
  voluntary_continuations: number
  help_requests: number
}

export interface LearningVelocity {
  concepts_per_hour: number
  mastery_rate: number
  retention_rate: number
  skill_acquisition_speed: number
}

// ================================
// Recommendation Types
// ================================

export interface Recommendation {
  id: string
  type: RecommendationType
  title: string
  description: string
  rationale: string
  confidence: number
  priority: number
  estimated_impact: EstimatedImpact
  implementation_cost: number
  content: RecommendationContent
}

export type RecommendationType = 
  | 'content_suggestion'
  | 'difficulty_adjustment'
  | 'learning_path_modification'
  | 'study_strategy'
  | 'break_recommendation'
  | 'review_suggestion'
  | 'skill_focus'

export interface EstimatedImpact {
  learning_speed: number
  retention: number
  engagement: number
  satisfaction: number
  completion_likelihood: number
}

export interface RecommendationContent {
  content_id?: string
  content_type?: string
  parameters?: Record<string, unknown>
  alternatives?: string[]
}

// ================================
// Feedback Types
// ================================

export interface UserFeedback {
  adaptation_id: string
  user_id: string
  rating: number // 1-5 scale
  helpful: boolean
  comments?: string
  timestamp: Date
  context: FeedbackContext
}

export interface FeedbackContext {
  adaptation_type: AdaptationType
  learning_context: string
  user_state: UserState
}

export interface UserState {
  energy_level: number
  frustration_level: number
  confidence_level: number
  motivation_level: number
  attention_level: number
}

// ================================
// System Metrics Types
// ================================

export interface SystemMetrics {
  response_time: number
  cpu_usage: number
  memory_usage: number
  api_calls: number
  cache_hits: number
  errors: SystemError[]
}

export interface SystemError {
  type: string
  message: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  context: Record<string, unknown>
}

// ================================
// Configuration Types
// ================================

export interface AdaptiveOptions {
  enable_difficulty_adaptation: boolean
  enable_pacing_adaptation: boolean
  enable_content_format_adaptation: boolean
  adaptation_sensitivity: number
  minimum_confidence_threshold: number
  maximum_adaptations_per_session: number
  adaptation_frequency: number
}

export interface AdaptiveConfig {
  algorithms: AlgorithmConfig
  thresholds: ThresholdConfig
  features: FeatureConfig
  monitoring: MonitoringConfig
}

export interface AlgorithmConfig {
  difficulty_adjustment: DifficultyAlgorithmConfig
  content_recommendation: RecommendationAlgorithmConfig
  behavior_analysis: BehaviorAnalysisConfig
}

export interface DifficultyAlgorithmConfig {
  window_size: number
  success_threshold: number
  failure_threshold: number
  adjustment_magnitude: number
  confidence_decay: number
}

export interface RecommendationAlgorithmConfig {
  collaborative_filtering_weight: number
  content_based_weight: number
  popularity_weight: number
  recency_weight: number
  diversity_factor: number
}

export interface BehaviorAnalysisConfig {
  interaction_window: number
  pattern_detection_threshold: number
  anomaly_detection_sensitivity: number
  learning_rate: number
}

export interface ThresholdConfig {
  engagement_thresholds: EngagementThresholds
  performance_thresholds: PerformanceThresholds
  adaptation_thresholds: AdaptationThresholds
}

export interface EngagementThresholds {
  low_engagement: number
  medium_engagement: number
  high_engagement: number
  disengagement_warning: number
}

export interface PerformanceThresholds {
  struggling_performance: number
  adequate_performance: number
  excellent_performance: number
  mastery_threshold: number
}

export interface AdaptationThresholds {
  minimum_confidence: number
  maximum_frequency: number
  effectiveness_threshold: number
  rollback_threshold: number
}

export interface FeatureConfig {
  real_time_adaptation: boolean
  predictive_analytics: boolean
  social_learning_features: boolean
  gamification_elements: boolean
  accessibility_features: boolean
}

export interface MonitoringConfig {
  enable_performance_tracking: boolean
  enable_user_behavior_logging: boolean
  enable_adaptation_effectiveness_tracking: boolean
  log_level: 'debug' | 'info' | 'warn' | 'error'
  retention_period_days: number
}

// ================================
// Utility Types
// ================================

export type AdaptiveResult<T> = {
  success: true
  data: T
  metadata: ResultMetadata
} | {
  success: false
  error: AdaptiveError
  metadata: ResultMetadata
}

export interface ResultMetadata {
  timestamp: Date
  execution_time: number
  api_version: string
  request_id: string
}

export interface AdaptiveError {
  code: string
  message: string
  details?: Record<string, unknown>
  suggestions?: string[]
}

// ================================
// API Response Types
// ================================

export interface AdaptiveAPIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  metadata: {
    timestamp: string
    request_id: string
    execution_time: number
    version: string
  }
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}

// Helper type for API request bodies
export interface AdaptiveAPIRequest {
  action: string
  parameters: Record<string, unknown>
  context?: Record<string, unknown>
  options?: Record<string, unknown>
}
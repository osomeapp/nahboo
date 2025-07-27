# Interface Definitions Reference

## Overview
This document provides a complete reference of all TypeScript interfaces created, modified, or standardized during the compilation fix session. These interfaces ensure type safety and API consistency across the learning platform.

## Core AI Integration Interfaces

### Multi-Model AI System
**File**: `/src/lib/multi-model-ai.ts`

```typescript
export interface AIModelConfig {
  provider: 'openai' | 'claude'
  model: string
  maxTokens: number
  temperature: number
  specialties: string[]
  strengths: string[]
  optimalUseCases: UseCase[]
}

export type UseCase = 
  | 'mathematics'
  | 'science'
  | 'programming'
  | 'creative_writing'
  | 'essay_analysis'
  | 'language_learning'
  | 'history'
  | 'philosophy'
  | 'business'
  | 'general_tutoring'
  | 'quiz_generation'
  | 'personalized_feedback'
  | 'content_explanation'
  | 'study_planning'

export interface AIRequest {
  context: string
  useCase: UseCase
  userProfile: any // Should be refined to proper UserProfile type
  requestType: 'content' | 'analysis' | 'generation'
  priority: 'low' | 'medium' | 'high'
  temperature?: number
  maxTokens?: number
}

export interface AIResponse {
  content: string
  confidence: number
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}
```

### AI Tutor Client Interface
**File**: `/src/lib/ai-client.ts`

```typescript
export interface ContentGenerationRequest {
  userProfile: UserProfile
  contentType: 'lesson' | 'explanation' | 'example' | 'exercise'
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  length: 'short' | 'medium' | 'long'
  format: 'text' | 'structured' | 'conversational'
  context?: string
}

export interface QuizGenerationRequest {
  userProfile: UserProfile
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  questionCount: number
  // Additional properties as needed
}

export interface PersonalizedFeedbackRequest {
  userProfile: UserProfile
  userAnswer: string
  correctAnswer: string
  questionContext: string
  // Additional properties as needed
}
```

## AI Mentor System Interfaces

### Core Mentor Interfaces
**File**: `/src/lib/ai-mentor-system.ts`

```typescript
export interface MentorProfile {
  mentor_id: string
  name: string
  specialty: MentorSpecialty
  personality_type: MentorPersonality
  expertise_areas: string[]
  communication_style: CommunicationStyle
  availability_schedule: AvailabilitySchedule
  interaction_preferences: InteractionPreferences
  cultural_awareness: CulturalAwareness
  experience_level: ExperienceLevel
}

export interface LearnerMentorProfile {
  learner_id: string
  // Additional properties as defined in the system
}

export interface CareerGuidanceAnalysis {
  analysis_id: string
  learner_profile: LearnerMentorProfile
  career_assessment: CareerAssessment
  skill_gap_analysis: SkillGapAnalysis
  market_trend_analysis: MarketTrendAnalysis
  personalized_recommendations: CareerRecommendation[]
  development_roadmap: DevelopmentRoadmap
  industry_insights: IndustryInsight[]
  networking_suggestions: NetworkingSuggestion[]
  confidence_metrics: ConfidenceMetrics
}

export interface ConfidenceMetrics {
  overall_confidence: number
  career_direction_confidence: number
  skill_development_confidence: number
  market_opportunity_confidence: number
  success_probability_confidence: number
}

export interface LifeGuidanceAnalysis {
  analysis_id: string
  learner_profile: LearnerMentorProfile
  life_balance_assessment: LifeBalanceAssessment
  goal_alignment_analysis: GoalAlignmentAnalysis
  personal_development_areas: PersonalDevelopmentArea[]
  wellness_recommendations: WellnessRecommendation[]
  relationship_guidance: RelationshipGuidance
  financial_literacy_insights: FinancialLiteracyInsight[]
  life_skills_development: LifeSkillsDevelopment
  motivation_strategies: MotivationStrategy[]
}

export interface LifeBalanceAssessment {
  overall_balance_score: number
  dimension_scores: Record<string, number>
  balance_insights: string[]
  improvement_recommendations: string[]
}

export interface GoalAlignmentAnalysis {
  short_term_long_term_alignment: number
  values_goals_alignment: number
  conflicting_goals: string[]
  prioritization_recommendations: string[]
  goal_refinement_suggestions: string[]
}

export interface RelationshipGuidance {
  family_relationships: RelationshipArea
  friendships: RelationshipArea
  professional_relationships: RelationshipArea
}

export interface RelationshipArea {
  assessment: string
  improvement_areas: string[]
  action_items: string[]
}

export interface LifeSkillsDevelopment {
  communication_skills: LifeSkillArea
  decision_making: LifeSkillArea
  conflict_resolution: LifeSkillArea
}

export interface LifeSkillArea {
  current_level: number
  target_level: number
  development_approach: string
  practice_opportunities: string[]
}

export interface MentorshipSession {
  session_id: string
  learner_id: string
  mentor_profile: MentorProfile
  session_type: SessionType
  session_goal: string
  conversation_history: any[]
  // Additional session properties
}
```

## Micro-Learning Optimization Interfaces

### Core Micro-Learning Interfaces
**File**: `/src/lib/ai-micro-learning-optimization.ts`

```typescript
export interface MicroLearningUnit {
  unit_id: string
  title: string
  content: string
  duration_minutes: number
  difficulty_level: number
  learning_objectives: string[]
  content_type: 'text' | 'video' | 'interactive' | 'quiz' | 'simulation'
  prerequisites: string[]
  assessment_method: string
  engagement_hooks: string[]
  cognitive_load_score: number
  content_metadata?: {
    estimated_duration: number
    [key: string]: any
  }
}

export interface MicroLearningOptimizationRequest {
  source_content: any // TODO: Define SourceContent interface
  learner_profile: any // TODO: Define LearnerProfile interface
  optimization_parameters: any // TODO: Define OptimizationParameters interface
  success_criteria: any // TODO: Define SuccessCriteria interface
  delivery_context: any // TODO: Define DeliveryContext interface
}

export interface MicroLearningPathway {
  pathway_id: string
  unit_sequence: string[]
  branching_points: BranchingPoint[]
  checkpoint_units: string[]
  reinforcement_cycles: ReinforcementCycle[]
  adaptive_shortcuts: AdaptiveShortcut[]
  recovery_paths: RecoveryPath[]
  mastery_gates: MasteryGate[]
}

export interface AdaptationSystem {
  adaptation_triggers: string[]
  adaptation_strategies: string[]
  personalization_level: number
  real_time_adjustments: boolean
  feedback_integration: boolean
}

export interface DeliverySchedule {
  schedule_id: string
  delivery_windows: any[]
  notification_strategy: any // TODO: Define NotificationStrategy interface
  adaptive_scheduling: boolean
  timezone_awareness: boolean
}

export interface AnalyticsFramework {
  framework_id: string
  metrics: any[]
  reporting: any // TODO: Define ReportingConfig interface
}

export interface GamificationLayer {
  layer_id: string
  elements: any[]
  rewards: any[]
}

export interface PerformancePrediction {
  prediction_id: string
  metrics: any // TODO: Define PredictionMetrics interface
}

export interface OptimizationInsight {
  insight_id: string
  description: string
  impact: number
}

export interface ContinuousImprovement {
  improvement_id: string
  strategies: any[]
}

export interface OptimizedMicroLearning {
  optimization_id: string
  source_request: MicroLearningOptimizationRequest
  micro_units: MicroLearningUnit[]
  learning_pathway: MicroLearningPathway
  delivery_schedule: DeliverySchedule
  adaptation_system: AdaptationSystem
  analytics_framework: AnalyticsFramework
  gamification_layer: GamificationLayer
  performance_predictions: PerformancePrediction[]
  optimization_insights: OptimizationInsight[]
  continuous_improvement: ContinuousImprovement
}
```

## Adaptive Learning Interfaces

### Learning Style Interfaces
**File**: `/src/lib/learning-style-engine.ts`

```typescript
export interface LearningStyleProfile {
  primaryStyle: LearningStyleType // Fixed: was primary_style
  secondaryStyle: LearningStyleType // Fixed: was secondary_style
  styleConfidence: number
  adaptabilityScore: number
  // Additional properties as needed
}

export type LearningStyleType = 
  | 'visual'
  | 'auditory'
  | 'kinesthetic'
  | 'reading'
  | 'multimodal'
```

### Difficulty Profile Interface
**File**: `/src/lib/difficulty-engine.ts`

```typescript
export interface DifficultyProfile {
  userId: string
  subject: string
  currentLevel: number // 1-10 scale
  optimalLevel: number // Target difficulty for flow state
  confidence: number // 0-1, how confident we are in the level
  
  // Performance metrics
  successRate: number // Recent success rate (0-1) - Fixed: was adaptationRate
  averageAttempts: number // Average attempts to complete content
  timeToComplete: number // Average time in seconds
  // Additional performance metrics as needed
}
```

### Adaptive Path Generation Interfaces
**File**: `/src/lib/adaptive-path-generator.ts`

```typescript
export interface AdaptivePathProfile {
  userId: string
  userProfile: UserProfile
  learningStyleProfile: LearningStyleProfile | null
  difficultyProfile: DifficultyProfile | null
  behaviorProfile: any // TODO: Define BehaviorProfile interface
  adaptationHistory: any[]
  contextualFactors: any // TODO: Define ContextualFactors interface
}

export interface LearningPreferences {
  preferredContentTypes: string[]
  learningPace: 'slow' | 'moderate' | 'fast'
  sessionLength: number // minutes
  difficultyProgression: 'gradual' | 'moderate' | 'aggressive'
  adaptationSensitivity: 'low' | 'medium' | 'high'
  feedbackFrequency: 'minimal' | 'moderate' | 'frequent'
  // Additional preference properties
}

export interface AdaptiveRoute {
  routeId: string
  title: string
  description: string
  objectives: LearningObjective[]
  estimatedTime: number
  difficultyLevel: number
  adaptationPoints: number
  suitabilityScore: number
  reason: string
}
```

## Content and Quiz Interfaces

### Core Content Interfaces
**File**: `/src/types/index.ts`

```typescript
export interface ContentItem {
  id: string
  title: string
  description: string // Fixed: was body in some places
  content_type: string // Fixed: was type in some places
  difficulty?: number
  created_at: string // Added: was missing in some implementations
  // Additional content properties
}

export interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
  // Note: difficulty property was removed - calculate from questions.length
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
  points?: number
}

export interface QuizResults {
  quizId: string
  score: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  answers: UserAnswer[]
}
```

### User Profile Interface
**File**: `/src/types/index.ts`

```typescript
export interface UserProfile {
  id?: string
  name?: string
  subject: string
  level: 'beginner' | 'intermediate' | 'advanced'
  age_group: 'child' | 'teen' | 'adult'
  use_case: UseCase // Using the same UseCase type from multi-model-ai
}

export type UseCase = 
  | 'general_tutoring'
  | 'student'
  | 'college'
  | 'work'
  | 'personal'
  | 'lifelong'
```

## Real-Time Adaptation Interfaces

### Behavior Tracking Interfaces
**File**: `/src/lib/real-time-adaptation.ts`

```typescript
export interface RealTimeAdaptationConfig {
  minimumInteractionTime: number
  confidenceThreshold: number
  adaptationCooldown: number
  maxAdaptationsPerSession: number
}

export interface RealTimeContext {
  userId: string
  contentId: string
  sessionId: string
  currentInteraction: CurrentInteraction
  userProfile: UserProfile
  environmentalFactors: EnvironmentalFactors
}

export interface CurrentInteraction {
  startTime: number
  currentTime: number
  timeSpent: number
  scrollPattern: ScrollPattern
  clickPattern: ClickPattern
  pauseEvents: PauseEvent[]
  frustrationIndicators: FrustrationIndicator[]
  completionStatus: 'started' | 'in_progress' | 'completed' | 'abandoned'
}

export interface AdaptationAction {
  actionId: string
  actionType: AdaptationType
  trigger: string
  confidence: number
  timing: 'immediate' | 'next_content' | 'next_session'
  parameters: Record<string, any>
  expectedImpact: number
  reversible: boolean
}

export interface AdaptationResult {
  actionId: string
  success: boolean
  actualImpact?: number
  userResponse?: 'accepted' | 'dismissed' | 'ignored'
  timestamp: number
}
```

## Performance Monitoring Interfaces

### Performance Metrics Interfaces
**File**: `/src/lib/real-time-performance-monitor.ts`

```typescript
export interface PerformanceMetric {
  timestamp: number
  modelId: string
  useCase: string
  userId: string
  responseTime: number
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  cost: number
  success: boolean
  qualityScore?: number
  userSatisfaction?: number
  errorType?: string
  metadata?: Record<string, any>
}

export interface PerformanceAlert {
  id: string
  type: 'response_time' | 'error_rate' | 'cost' | 'quality'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  acknowledged: boolean
  modelId?: string
  useCase?: string
}

export interface MonitoringConfig {
  alertThresholds: {
    responseTime: number
    errorRate: number
    costPerRequest: number
    qualityScore: number
  }
  aggregationWindow: number
  retentionPeriod: number
  enableAlerts: boolean
}

export interface AggregatedMetrics {
  timeWindow: number
  modelId: string
  useCase: string
  requestCount: number
  avgResponseTime: number
  errorRate: number
  avgCost: number
  avgQualityScore: number
  availability: number
}
```

## Neural Attention Tracking Interfaces

### Attention Measurement Interfaces
**File**: `/src/lib/neural-attention-tracking.ts`

```typescript
export interface AttentionMeasurement {
  measurement_id: string
  user_id: string
  session_id: string
  content_id: string
  timestamp: number
  
  attention_metrics: {
    overall_attention_level: number // 0-1 scale
    attention_stability: number // variance measure
    focus_duration: number // continuous attention time
    distraction_frequency: number // interruptions per minute
  }
  
  behavioral_indicators: {
    scroll_velocity: number
    click_frequency: number
    pause_patterns: PausePattern[]
    distraction_indicators: DistractionIndicator[]
  }
  
  environmental_context: {
    time_of_day: string
    session_length: number
    content_difficulty: number
    device_type: string
  }
}

export interface PausePattern {
  start_time: number
  duration: number
  content_position: number
  likely_cause: 'reflection' | 'confusion' | 'distraction' | 'fatigue'
}

export interface DistractionIndicator {
  type: 'rapid_scrolling' | 'tab_switching' | 'idle_time' | 'erratic_clicking'
  intensity: number // 0-1 scale
  timestamp: number
  context: Record<string, any>
}
```

## Interface Evolution and Versioning

### Version History
```typescript
// v1.0 - Initial interfaces with compilation fixes
// - Fixed property naming (snake_case vs camelCase)
// - Added missing required properties
// - Standardized enum values
// - Added backward compatibility aliases

// v1.1 - Enhanced type safety (TODO)
// - Replace 'any' types with proper interfaces
// - Add comprehensive validation
// - Implement runtime type checking
// - Add interface documentation

// v1.2 - Performance optimization (TODO)  
// - Add caching strategies to interfaces
// - Implement lazy loading patterns
// - Add bulk operation interfaces
// - Optimize for large-scale usage
```

### Interface Naming Conventions

#### Established Patterns:
```typescript
// Entity interfaces use PascalCase
interface UserProfile { }
interface ContentItem { }
interface MicroLearningUnit { }

// Configuration interfaces end with 'Config'
interface MonitoringConfig { }
interface AdaptationConfig { }

// Request/Response interfaces are descriptive
interface ContentGenerationRequest { }
interface AIResponse { }

// Analysis/Result interfaces are specific
interface PerformanceAnalysis { }
interface OptimizationResult { }

// Property naming follows existing codebase:
// - Database properties: snake_case (user_id, content_type)
// - Internal properties: camelCase (primaryStyle, responseTime)
// - API properties: match external system conventions
```

### Type Safety Guidelines

#### Current Status:
```typescript
// ✅ Resolved Issues:
// - Property naming consistency
// - Required vs optional properties
// - Enum value alignment
// - Interface inheritance conflicts

// 🔄 In Progress:
// - Replacing 'any' types with proper interfaces
// - Adding comprehensive type validation
// - Implementing runtime type checking

// 📋 TODO:
// - Generic type parameters for reusability
// - Conditional types for complex scenarios
// - Utility types for transformations
// - Branded types for ID safety
```

This interface reference provides a comprehensive foundation for maintaining type safety and API consistency as the learning platform continues to evolve and new features are implemented.
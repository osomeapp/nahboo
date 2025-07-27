'use client'

import { multiModelAI } from './multi-model-ai'

// Core accessibility types
export interface AccessibilityProfile {
  userId: string
  accessibility_needs: AccessibilityNeed[]
  accommodations: Accommodation[]
  preferred_modalities: LearningModality[]
  assistive_technologies: AssistiveTechnology[]
  interaction_preferences: InteractionPreference[]
  cognitive_supports: CognitiveSupport[]
  sensory_considerations: SensoryConsideration[]
  motor_considerations: MotorConsideration[]
  last_updated: Date
  effectiveness_scores: Record<string, number> // Track what works best
}

export interface AccessibilityNeed {
  need_type: AccessibilityNeedType
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  impact_areas: string[]
  diagnosed: boolean
  self_reported: boolean
  accommodations_used: string[]
  effectiveness_rating: number // 0-1
}

export type AccessibilityNeedType = 
  | 'visual_impairment' | 'hearing_impairment' | 'motor_impairment' | 'cognitive_impairment'
  | 'dyslexia' | 'adhd' | 'autism_spectrum' | 'dyscalculia' | 'dysgraphia'
  | 'processing_speed_issues' | 'working_memory_challenges' | 'attention_difficulties'
  | 'language_processing_disorder' | 'executive_function_challenges'

export interface Accommodation {
  accommodation_id: string
  name: string
  description: string
  target_needs: AccessibilityNeedType[]
  implementation_type: 'ui_modification' | 'content_adaptation' | 'interaction_method' | 'cognitive_support'
  settings: Record<string, any>
  effectiveness: number // 0-1
  user_satisfaction: number // 0-1
  usage_frequency: number // 0-1
  auto_applied: boolean
}

export type LearningModality = 
  | 'visual' | 'auditory' | 'kinesthetic' | 'text_based' | 'video_based' 
  | 'interactive' | 'simplified' | 'structured' | 'gamified'

export interface AssistiveTechnology {
  technology_type: AssistiveTechnologyType
  name: string
  compatibility_level: number // 0-1
  integration_status: 'supported' | 'partially_supported' | 'not_supported'
  features_used: string[]
  effectiveness: number // 0-1
}

export type AssistiveTechnologyType = 
  | 'screen_reader' | 'voice_recognition' | 'eye_tracking' | 'switch_control'
  | 'magnification' | 'high_contrast' | 'closed_captions' | 'text_to_speech'
  | 'speech_to_text' | 'keyboard_navigation' | 'one_handed_typing'

export interface InteractionPreference {
  preference_type: InteractionPreferenceType
  value: string | number | boolean
  importance: number // 0-1
  context: string[]
}

export type InteractionPreferenceType = 
  | 'font_size' | 'contrast_ratio' | 'animation_speed' | 'audio_speed'
  | 'navigation_method' | 'feedback_type' | 'content_density' | 'break_frequency'
  | 'instruction_complexity' | 'progress_indication' | 'error_handling'

export interface CognitiveSupport {
  support_type: CognitiveSupportType
  enabled: boolean
  configuration: Record<string, any>
  effectiveness: number // 0-1
  usage_pattern: 'always' | 'as_needed' | 'contextual'
}

export type CognitiveSupportType = 
  | 'memory_aids' | 'attention_prompts' | 'step_by_step_guidance' | 'visual_organizers'
  | 'progress_tracking' | 'reminder_systems' | 'concept_mapping' | 'summarization'
  | 'repetition_scheduling' | 'cognitive_load_management' | 'focus_assistance'

export interface SensoryConsideration {
  sensory_type: 'visual' | 'auditory' | 'vestibular' | 'tactile'
  sensitivity_level: number // 0-1
  accommodations_needed: string[]
  trigger_avoidance: string[]
}

export interface MotorConsideration {
  motor_type: 'fine_motor' | 'gross_motor' | 'coordination' | 'endurance'
  limitation_level: number // 0-1
  preferred_input_methods: string[]
  fatigue_management: string[]
}

export interface AccessibilityAssessment {
  assessment_id: string
  user_id: string
  timestamp: Date
  assessment_type: 'self_report' | 'ai_inference' | 'behavioral_analysis' | 'performance_based'
  detected_needs: AccessibilityNeed[]
  recommended_accommodations: Accommodation[]
  confidence_score: number // 0-1
  follow_up_needed: boolean
  assessment_data: any
}

export interface ContentAccessibilityAnalysis {
  content_id: string
  accessibility_score: number // 0-1 overall accessibility
  barrier_analysis: {
    visual_barriers: string[]
    cognitive_barriers: string[]
    motor_barriers: string[]
    auditory_barriers: string[]
  }
  wcag_compliance: {
    level_a: boolean
    level_aa: boolean
    level_aaa: boolean
    failing_criteria: string[]
  }
  recommendations: AccessibilityRecommendation[]
  adaptation_suggestions: string[]
}

export interface AccessibilityRecommendation {
  recommendation_id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'ui' | 'content' | 'interaction' | 'cognitive'
  title: string
  description: string
  implementation_steps: string[]
  expected_impact: string[]
  effort_level: 'low' | 'medium' | 'high'
  wcag_criteria: string[]
}

// Predefined accommodations
export const STANDARD_ACCOMMODATIONS: Accommodation[] = [
  {
    accommodation_id: 'high_contrast_mode',
    name: 'High Contrast Mode',
    description: 'Increases contrast between text and background for better readability',
    target_needs: ['visual_impairment'],
    implementation_type: 'ui_modification',
    settings: {
      contrast_ratio: 7.0,
      background_color: '#000000',
      text_color: '#FFFFFF',
      link_color: '#FFFF00'
    },
    effectiveness: 0.85,
    user_satisfaction: 0.8,
    usage_frequency: 0.0,
    auto_applied: false
  },
  {
    accommodation_id: 'text_to_speech',
    name: 'Text-to-Speech',
    description: 'Converts written content to spoken audio',
    target_needs: ['visual_impairment', 'dyslexia', 'cognitive_impairment'],
    implementation_type: 'content_adaptation',
    settings: {
      voice_speed: 1.0,
      voice_pitch: 1.0,
      auto_play: false,
      highlight_reading: true
    },
    effectiveness: 0.9,
    user_satisfaction: 0.85,
    usage_frequency: 0.0,
    auto_applied: false
  },
  {
    accommodation_id: 'simplified_navigation',
    name: 'Simplified Navigation',
    description: 'Reduces cognitive load with streamlined interface',
    target_needs: ['cognitive_impairment', 'adhd', 'autism_spectrum'],
    implementation_type: 'ui_modification',
    settings: {
      reduced_options: true,
      clear_labels: true,
      consistent_layout: true,
      breadcrumbs: true
    },
    effectiveness: 0.8,
    user_satisfaction: 0.9,
    usage_frequency: 0.0,
    auto_applied: false
  },
  {
    accommodation_id: 'extended_time',
    name: 'Extended Time',
    description: 'Provides additional time for tasks and assessments',
    target_needs: ['processing_speed_issues', 'adhd', 'dyslexia'],
    implementation_type: 'interaction_method',
    settings: {
      time_multiplier: 1.5,
      flexible_deadlines: true,
      break_reminders: true
    },
    effectiveness: 0.85,
    user_satisfaction: 0.9,
    usage_frequency: 0.0,
    auto_applied: false
  },
  {
    accommodation_id: 'keyboard_navigation',
    name: 'Keyboard-Only Navigation',
    description: 'Full keyboard accessibility without mouse requirement',
    target_needs: ['motor_impairment', 'visual_impairment'],
    implementation_type: 'interaction_method',
    settings: {
      tab_order_optimization: true,
      skip_links: true,
      keyboard_shortcuts: true,
      focus_indicators: true
    },
    effectiveness: 0.9,
    user_satisfaction: 0.85,
    usage_frequency: 0.0,
    auto_applied: false
  },
  {
    accommodation_id: 'memory_aids',
    name: 'Memory Support Tools',
    description: 'Provides memory aids and cognitive scaffolding',
    target_needs: ['working_memory_challenges', 'cognitive_impairment', 'adhd'],
    implementation_type: 'cognitive_support',
    settings: {
      note_taking_tools: true,
      progress_reminders: true,
      concept_summaries: true,
      visual_cues: true
    },
    effectiveness: 0.75,
    user_satisfaction: 0.8,
    usage_frequency: 0.0,
    auto_applied: false
  }
]

// Main accessibility engine
export class AccessibilityEngine {
  private profiles: Map<string, AccessibilityProfile> = new Map()
  private assessments: Map<string, AccessibilityAssessment[]> = new Map()
  private accommodations: Map<string, Accommodation> = new Map()
  private contentAnalyses: Map<string, ContentAccessibilityAnalysis> = new Map()

  constructor() {
    // Initialize standard accommodations
    STANDARD_ACCOMMODATIONS.forEach(accommodation => {
      this.accommodations.set(accommodation.accommodation_id, accommodation)
    })
  }

  // Main accessibility assessment function
  async assessAccessibilityNeeds(
    userId: string,
    assessmentData: {
      self_reported?: {
        disabilities: string[]
        challenges: string[]
        current_accommodations: string[]
        preferences: Record<string, any>
      }
      behavioral_data?: {
        interaction_patterns: any[]
        performance_data: any[]
        error_patterns: any[]
        assistance_requests: any[]
      }
      performance_indicators?: {
        task_completion_times: number[]
        error_rates: number[]
        help_seeking_frequency: number
        frustration_indicators: number[]
      }
    }
  ): Promise<AccessibilityProfile> {
    try {
      // Analyze different data sources
      const selfReportedNeeds = assessmentData.self_reported 
        ? await this.analyzeSelfReportedNeeds(assessmentData.self_reported)
        : []

      const behavioralNeeds = assessmentData.behavioral_data
        ? await this.analyzeBehavioralPatterns(assessmentData.behavioral_data)
        : []

      const performanceNeeds = assessmentData.performance_indicators
        ? await this.analyzePerformanceIndicators(assessmentData.performance_indicators)
        : []

      // Use AI to synthesize and validate findings
      const synthesizedNeeds = await this.synthesizeAccessibilityNeeds([
        ...selfReportedNeeds,
        ...behavioralNeeds,
        ...performanceNeeds
      ])

      // Generate accommodation recommendations
      const recommendedAccommodations = await this.generateAccommodationRecommendations(synthesizedNeeds)

      // Infer preferences and considerations
      const preferences = this.inferInteractionPreferences(synthesizedNeeds, assessmentData)
      const cognitiveSupports = this.generateCognitiveSupports(synthesizedNeeds)
      const sensoryConsiderations = this.analyzeSensoryConsiderations(synthesizedNeeds)
      const motorConsiderations = this.analyzeMotorConsiderations(synthesizedNeeds)

      const profile: AccessibilityProfile = {
        userId,
        accessibility_needs: synthesizedNeeds,
        accommodations: recommendedAccommodations,
        preferred_modalities: this.inferPreferredModalities(synthesizedNeeds),
        assistive_technologies: this.identifyAssistiveTechnologies(synthesizedNeeds),
        interaction_preferences: preferences,
        cognitive_supports: cognitiveSupports,
        sensory_considerations: sensoryConsiderations,
        motor_considerations: motorConsiderations,
        last_updated: new Date(),
        effectiveness_scores: {}
      }

      // Store profile
      this.profiles.set(userId, profile)

      // Create assessment record
      const assessment: AccessibilityAssessment = {
        assessment_id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        timestamp: new Date(),
        assessment_type: 'ai_inference',
        detected_needs: synthesizedNeeds,
        recommended_accommodations: recommendedAccommodations,
        confidence_score: this.calculateAssessmentConfidence(synthesizedNeeds, assessmentData),
        follow_up_needed: this.determineFollowUpNeeded(synthesizedNeeds),
        assessment_data: assessmentData
      }

      if (!this.assessments.has(userId)) {
        this.assessments.set(userId, [])
      }
      this.assessments.get(userId)!.push(assessment)

      return profile
    } catch (error) {
      console.error('Error assessing accessibility needs:', error)
      throw new Error('Failed to assess accessibility needs')
    }
  }

  // Analyze self-reported accessibility needs
  private async analyzeSelfReportedNeeds(
    selfReported: {
      disabilities: string[]
      challenges: string[]
      current_accommodations: string[]
      preferences: Record<string, any>
    }
  ): Promise<AccessibilityNeed[]> {
    const needs: AccessibilityNeed[] = []

    // Map reported disabilities to accessibility needs
    selfReported.disabilities.forEach(disability => {
      const needType = this.mapDisabilityToNeedType(disability)
      if (needType) {
        needs.push({
          need_type: needType,
          severity: 'moderate', // Default, can be refined
          description: `Self-reported: ${disability}`,
          impact_areas: this.getImpactAreas(needType),
          diagnosed: true, // Assumed for self-reported disabilities
          self_reported: true,
          accommodations_used: selfReported.current_accommodations,
          effectiveness_rating: 0.7 // Default effectiveness
        })
      }
    })

    // Analyze reported challenges
    for (const challenge of selfReported.challenges) {
      const inferredNeed = await this.inferNeedFromChallenge(challenge)
      if (inferredNeed) {
        needs.push(inferredNeed)
      }
    }

    return needs
  }

  // Analyze behavioral patterns for accessibility indicators
  private async analyzeBehavioralPatterns(
    behavioralData: {
      interaction_patterns: any[]
      performance_data: any[]
      error_patterns: any[]
      assistance_requests: any[]
    }
  ): Promise<AccessibilityNeed[]> {
    const needs: AccessibilityNeed[] = []

    // Analyze interaction patterns for motor difficulties
    const motorIssues = this.detectMotorIssues(behavioralData.interaction_patterns)
    if (motorIssues) {
      needs.push(motorIssues)
    }

    // Analyze error patterns for cognitive indicators
    const cognitiveIssues = this.detectCognitiveIssues(behavioralData.error_patterns)
    if (cognitiveIssues) {
      needs.push(cognitiveIssues)
    }

    // Analyze assistance requests for learning differences
    const learningIssues = await this.detectLearningDifferences(behavioralData.assistance_requests)
    if (learningIssues) {
      needs.push(learningIssues)
    }

    return needs
  }

  // Analyze performance indicators for accessibility needs
  private analyzePerformanceIndicators(
    performanceData: {
      task_completion_times: number[]
      error_rates: number[]
      help_seeking_frequency: number
      frustration_indicators: number[]
    }
  ): AccessibilityNeed[] {
    const needs: AccessibilityNeed[] = []

    // Detect processing speed issues
    const avgCompletionTime = performanceData.task_completion_times.reduce((a, b) => a + b, 0) / performanceData.task_completion_times.length
    if (avgCompletionTime > this.getTypicalCompletionTime() * 2) {
      needs.push({
        need_type: 'processing_speed_issues',
        severity: avgCompletionTime > this.getTypicalCompletionTime() * 3 ? 'severe' : 'moderate',
        description: 'Significantly slower task completion times detected',
        impact_areas: ['task_completion', 'assessment_performance'],
        diagnosed: false,
        self_reported: false,
        accommodations_used: [],
        effectiveness_rating: 0.0
      })
    }

    // Detect attention difficulties
    const avgErrorRate = performanceData.error_rates.reduce((a, b) => a + b, 0) / performanceData.error_rates.length
    const errorVariability = this.calculateVariability(performanceData.error_rates)
    if (avgErrorRate > 0.3 && errorVariability > 0.2) {
      needs.push({
        need_type: 'attention_difficulties',
        severity: avgErrorRate > 0.5 ? 'severe' : 'moderate',
        description: 'High error rate with significant variability suggests attention challenges',
        impact_areas: ['accuracy', 'consistency', 'sustained_attention'],
        diagnosed: false,
        self_reported: false,
        accommodations_used: [],
        effectiveness_rating: 0.0
      })
    }

    return needs
  }

  // Use AI to synthesize accessibility needs from multiple sources
  private async synthesizeAccessibilityNeeds(allNeeds: AccessibilityNeed[]): Promise<AccessibilityNeed[]> {
    if (allNeeds.length === 0) return []

    const needsSummary = allNeeds.map(need => 
      `${need.need_type}: ${need.severity} - ${need.description}`
    ).join('\n')

    const prompt = `Analyze these potential accessibility needs and provide a synthesized, validated assessment.

Detected Needs:
${needsSummary}

Please:
1. Remove duplicates and consolidate similar needs
2. Adjust severity levels based on evidence strength
3. Identify any missing needs that commonly co-occur
4. Validate the assessment for internal consistency

Return a JSON array of validated accessibility needs:
[
  {
    "need_type": "accessibility_need_type",
    "severity": "mild|moderate|severe",
    "description": "detailed description",
    "impact_areas": ["area1", "area2"],
    "diagnosed": boolean,
    "self_reported": boolean,
    "accommodations_used": ["accommodation1"],
    "effectiveness_rating": number
  }
]

Focus on evidence-based, actionable needs that require specific accommodations.`

    try {
      const response = await multiModelAI.generateContent({
        context: prompt,
        useCase: 'general_tutoring',
        userProfile: { age_group: 'adult', level: 'intermediate', subject: 'accessibility', use_case: 'general_tutoring' } as any,
        requestType: 'content',
        priority: 'medium',
        temperature: 0.3,
        maxTokens: 1000
      })

      const synthesizedNeeds = JSON.parse(response.content)
      
      return synthesizedNeeds.map((need: any) => ({
        need_type: need.need_type as AccessibilityNeedType,
        severity: need.severity || 'moderate',
        description: need.description,
        impact_areas: need.impact_areas || [],
        diagnosed: need.diagnosed || false,
        self_reported: need.self_reported || false,
        accommodations_used: need.accommodations_used || [],
        effectiveness_rating: Math.max(0, Math.min(1, need.effectiveness_rating || 0.5))
      }))
    } catch (error) {
      console.error('Error synthesizing accessibility needs:', error)
      return allNeeds // Return original needs if AI synthesis fails
    }
  }

  // Generate accommodation recommendations
  private async generateAccommodationRecommendations(
    needs: AccessibilityNeed[]
  ): Promise<Accommodation[]> {
    const recommendations: Accommodation[] = []

    for (const need of needs) {
      // Find standard accommodations that target this need
      const standardAccommodations = Array.from(this.accommodations.values())
        .filter(accommodation => accommodation.target_needs.includes(need.need_type))

      recommendations.push(...standardAccommodations)

      // Generate custom accommodations if needed
      const customAccommodations = await this.generateCustomAccommodations(need)
      recommendations.push(...customAccommodations)
    }

    // Remove duplicates and prioritize
    const uniqueRecommendations = this.deduplicateAccommodations(recommendations)
    return this.prioritizeAccommodations(uniqueRecommendations, needs)
  }

  // Generate custom accommodations using AI
  private async generateCustomAccommodations(need: AccessibilityNeed): Promise<Accommodation[]> {
    const prompt = `Generate custom accessibility accommodations for this specific need:

Need Type: ${need.need_type}
Severity: ${need.severity}
Description: ${need.description}
Impact Areas: ${need.impact_areas.join(', ')}

Create 1-2 specific, implementable accommodations that would address this need effectively.

Return JSON array:
[
  {
    "name": "accommodation name",
    "description": "detailed description",
    "implementation_type": "ui_modification|content_adaptation|interaction_method|cognitive_support",
    "settings": {key: value},
    "effectiveness": number
  }
]

Focus on practical, technology-enabled accommodations that can be implemented in a learning platform.`

    try {
      const response = await multiModelAI.generateContent({
        context: prompt,
        useCase: 'general_tutoring',
        userProfile: { age_group: 'adult', level: 'intermediate', subject: 'accessibility', use_case: 'general_tutoring' } as any,
        requestType: 'content',
        priority: 'medium',
        temperature: 0.4,
        maxTokens: 500
      })

      const customAccommodations = JSON.parse(response.content)
      
      return customAccommodations.map((acc: any, index: number) => ({
        accommodation_id: `custom_${need.need_type}_${index}`,
        name: acc.name,
        description: acc.description,
        target_needs: [need.need_type],
        implementation_type: acc.implementation_type,
        settings: acc.settings || {},
        effectiveness: Math.max(0, Math.min(1, acc.effectiveness || 0.7)),
        user_satisfaction: 0.7,
        usage_frequency: 0.0,
        auto_applied: false
      }))
    } catch (error) {
      console.error('Error generating custom accommodations:', error)
      return []
    }
  }

  // Analyze content for accessibility barriers
  async analyzeContentAccessibility(
    contentId: string,
    content: {
      text?: string
      images?: Array<{url: string, alt_text?: string}>
      videos?: Array<{url: string, captions?: boolean, transcript?: string}>
      interactive_elements?: Array<{type: string, description: string}>
      structure?: {
        headings: string[]
        navigation: string[]
        forms: string[]
      }
    }
  ): Promise<ContentAccessibilityAnalysis> {
    try {
      // Analyze different aspects of content
      const visualBarriers = this.analyzeVisualBarriers(content)
      const cognitiveBarriers = await this.analyzeCognitiveBarriers(content)
      const motorBarriers = this.analyzeMotorBarriers(content)
      const auditoryBarriers = this.analyzeAuditoryBarriers(content)

      // Calculate overall accessibility score
      const accessibilityScore = this.calculateAccessibilityScore({
        visualBarriers,
        cognitiveBarriers,
        motorBarriers,
        auditoryBarriers
      })

      // Check WCAG compliance
      const wcagCompliance = this.checkWCAGCompliance(content)

      // Generate recommendations
      const recommendations = await this.generateAccessibilityRecommendations(
        { visualBarriers, cognitiveBarriers, motorBarriers, auditoryBarriers },
        wcagCompliance
      )

      const analysis: ContentAccessibilityAnalysis = {
        content_id: contentId,
        accessibility_score: accessibilityScore,
        barrier_analysis: {
          visual_barriers: visualBarriers,
          cognitive_barriers: cognitiveBarriers,
          motor_barriers: motorBarriers,
          auditory_barriers: auditoryBarriers
        },
        wcag_compliance: wcagCompliance,
        recommendations,
        adaptation_suggestions: this.generateAdaptationSuggestions(
          { visualBarriers, cognitiveBarriers, motorBarriers, auditoryBarriers }
        )
      }

      this.contentAnalyses.set(contentId, analysis)
      return analysis
    } catch (error) {
      console.error('Error analyzing content accessibility:', error)
      throw new Error('Failed to analyze content accessibility')
    }
  }

  // Apply accommodations to content/interface
  async applyAccommodations(
    userId: string,
    accommodationIds: string[]
  ): Promise<{
    applied: string[]
    failed: string[]
    settings: Record<string, any>
  }> {
    const profile = this.profiles.get(userId)
    if (!profile) {
      throw new Error('User accessibility profile not found')
    }

    const applied: string[] = []
    const failed: string[] = []
    const settings: Record<string, any> = {}

    for (const accommodationId of accommodationIds) {
      const accommodation = this.accommodations.get(accommodationId)
      if (!accommodation) {
        failed.push(accommodationId)
        continue
      }

      try {
        // Apply the accommodation
        const accommodationSettings = await this.implementAccommodation(accommodation)
        settings[accommodationId] = accommodationSettings
        applied.push(accommodationId)

        // Update usage frequency
        accommodation.usage_frequency += 0.1
        accommodation.usage_frequency = Math.min(1, accommodation.usage_frequency)
      } catch (error) {
        console.error(`Failed to apply accommodation ${accommodationId}:`, error)
        failed.push(accommodationId)
      }
    }

    // Update profile with applied accommodations
    profile.accommodations = profile.accommodations.map(acc => {
      if (applied.includes(acc.accommodation_id)) {
        return { ...acc, auto_applied: true }
      }
      return acc
    })

    this.profiles.set(userId, profile)

    return { applied, failed, settings }
  }

  // Helper methods for need detection
  private mapDisabilityToNeedType(disability: string): AccessibilityNeedType | null {
    const mapping: Record<string, AccessibilityNeedType> = {
      'blindness': 'visual_impairment',
      'low vision': 'visual_impairment',
      'deafness': 'hearing_impairment',
      'hard of hearing': 'hearing_impairment',
      'dyslexia': 'dyslexia',
      'adhd': 'adhd',
      'autism': 'autism_spectrum',
      'dyscalculia': 'dyscalculia',
      'dysgraphia': 'dysgraphia',
      'cerebral palsy': 'motor_impairment',
      'spinal cord injury': 'motor_impairment',
      'traumatic brain injury': 'cognitive_impairment'
    }

    const lowerDisability = disability.toLowerCase()
    return mapping[lowerDisability] || null
  }

  private getImpactAreas(needType: AccessibilityNeedType): string[] {
    const impactMap: Record<AccessibilityNeedType, string[]> = {
      'visual_impairment': ['reading', 'navigation', 'visual_content', 'spatial_orientation'],
      'hearing_impairment': ['audio_content', 'video_content', 'notifications', 'communication'],
      'motor_impairment': ['navigation', 'input_methods', 'timing', 'physical_interaction'],
      'cognitive_impairment': ['comprehension', 'memory', 'problem_solving', 'attention'],
      'dyslexia': ['reading', 'writing', 'spelling', 'text_processing'],
      'adhd': ['attention', 'focus', 'impulse_control', 'organization'],
      'autism_spectrum': ['social_interaction', 'sensory_processing', 'routine', 'communication'],
      'dyscalculia': ['mathematics', 'numerical_concepts', 'spatial_relationships'],
      'dysgraphia': ['writing', 'fine_motor_skills', 'spelling', 'text_organization'],
      'processing_speed_issues': ['task_completion', 'response_time', 'information_processing'],
      'working_memory_challenges': ['information_retention', 'multi_step_tasks', 'complex_instructions'],
      'attention_difficulties': ['sustained_attention', 'selective_attention', 'divided_attention'],
      'language_processing_disorder': ['language_comprehension', 'verbal_instructions', 'communication'],
      'executive_function_challenges': ['planning', 'organization', 'time_management', 'task_switching']
    }

    return impactMap[needType] || ['general_learning']
  }

  private async inferNeedFromChallenge(challenge: string): Promise<AccessibilityNeed | null> {
    const prompt = `Analyze this learning challenge and infer if it suggests a specific accessibility need:

Challenge: "${challenge}"

If this suggests a specific accessibility need, return JSON:
{
  "need_type": "accessibility_need_type",
  "severity": "mild|moderate|severe",
  "description": "inferred description",
  "confidence": number
}

If no specific accessibility need can be inferred, return null.

Focus on clear indicators of disabilities or learning differences.`

    try {
      const response = await multiModelAI.generateContent({
        context: prompt,
        useCase: 'general_tutoring',
        userProfile: { age_group: 'adult', level: 'intermediate', subject: 'accessibility', use_case: 'general_tutoring' } as any,
        requestType: 'content',
        priority: 'medium',
        temperature: 0.3,
        maxTokens: 200
      })

      const result = JSON.parse(response.content)
      
      if (!result || !result.need_type) return null

      return {
        need_type: result.need_type as AccessibilityNeedType,
        severity: result.severity || 'moderate',
        description: result.description,
        impact_areas: this.getImpactAreas(result.need_type),
        diagnosed: false,
        self_reported: true,
        accommodations_used: [],
        effectiveness_rating: 0.5
      }
    } catch (error) {
      console.error('Error inferring need from challenge:', error)
      return null
    }
  }

  private detectMotorIssues(interactionPatterns: any[]): AccessibilityNeed | null {
    // Simplified motor issue detection
    const avgClickAccuracy = interactionPatterns
      .filter(p => p.type === 'click')
      .reduce((sum, p) => sum + (p.accuracy || 1), 0) / Math.max(1, interactionPatterns.filter(p => p.type === 'click').length)

    if (avgClickAccuracy < 0.7) {
      return {
        need_type: 'motor_impairment',
        severity: avgClickAccuracy < 0.5 ? 'severe' : 'moderate',
        description: 'Low click accuracy suggests motor difficulties',
        impact_areas: ['navigation', 'input_methods', 'physical_interaction'],
        diagnosed: false,
        self_reported: false,
        accommodations_used: [],
        effectiveness_rating: 0.0
      }
    }

    return null
  }

  private detectCognitiveIssues(errorPatterns: any[]): AccessibilityNeed | null {
    // Simplified cognitive issue detection
    const repeatedErrors = errorPatterns.filter(e => e.repeated).length
    const totalErrors = errorPatterns.length

    if (totalErrors > 0 && repeatedErrors / totalErrors > 0.6) {
      return {
        need_type: 'working_memory_challenges',
        severity: repeatedErrors / totalErrors > 0.8 ? 'severe' : 'moderate',
        description: 'High rate of repeated errors suggests working memory challenges',
        impact_areas: ['information_retention', 'multi_step_tasks', 'complex_instructions'],
        diagnosed: false,
        self_reported: false,
        accommodations_used: [],
        effectiveness_rating: 0.0
      }
    }

    return null
  }

  private async detectLearningDifferences(assistanceRequests: any[]): Promise<AccessibilityNeed | null> {
    if (assistanceRequests.length === 0) return null

    // Analyze patterns in assistance requests
    const frequentTopics = assistanceRequests
      .reduce((acc, req) => {
        acc[req.topic] = (acc[req.topic] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    const topTopic = Object.entries(frequentTopics)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]

    if (topTopic && (topTopic[1] as number) > assistanceRequests.length * 0.4) {
      // Frequent requests in specific area might indicate learning difference
      const [topic, count] = topTopic
      
      if (topic.includes('reading') || topic.includes('text')) {
        return {
          need_type: 'dyslexia',
          severity: 'moderate',
          description: `Frequent assistance requests related to reading/text (${count} requests)`,
          impact_areas: ['reading', 'text_processing'],
          diagnosed: false,
          self_reported: false,
          accommodations_used: [],
          effectiveness_rating: 0.0
        }
      }
    }

    return null
  }

  private getTypicalCompletionTime(): number {
    return 60 // 60 seconds as baseline
  }

  private calculateVariability(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    return Math.sqrt(variance) / mean // Coefficient of variation
  }

  // Additional helper methods
  private inferInteractionPreferences(
    needs: AccessibilityNeed[],
    assessmentData: any
  ): InteractionPreference[] {
    const preferences: InteractionPreference[] = []

    // Infer preferences based on needs
    needs.forEach(need => {
      switch (need.need_type) {
        case 'visual_impairment':
          preferences.push({
            preference_type: 'font_size',
            value: 18,
            importance: 0.9,
            context: ['all']
          })
          break
        case 'motor_impairment':
          preferences.push({
            preference_type: 'navigation_method',
            value: 'keyboard',
            importance: 0.8,
            context: ['all']
          })
          break
        case 'adhd':
          preferences.push({
            preference_type: 'break_frequency',
            value: 15, // minutes
            importance: 0.7,
            context: ['learning']
          })
          break
      }
    })

    return preferences
  }

  private inferPreferredModalities(needs: AccessibilityNeed[]): LearningModality[] {
    const modalities: LearningModality[] = []

    needs.forEach(need => {
      switch (need.need_type) {
        case 'visual_impairment':
          modalities.push('auditory', 'text_based')
          break
        case 'hearing_impairment':
          modalities.push('visual', 'text_based')
          break
        case 'adhd':
          modalities.push('interactive', 'gamified', 'structured')
          break
        case 'autism_spectrum':
          modalities.push('structured', 'simplified')
          break
        case 'dyslexia':
          modalities.push('auditory', 'video_based')
          break
      }
    })

    return [...new Set(modalities)]
  }

  private identifyAssistiveTechnologies(needs: AccessibilityNeed[]): AssistiveTechnology[] {
    const technologies: AssistiveTechnology[] = []

    needs.forEach(need => {
      switch (need.need_type) {
        case 'visual_impairment':
          technologies.push({
            technology_type: 'screen_reader',
            name: 'Screen Reader',
            compatibility_level: 0.9,
            integration_status: 'supported',
            features_used: ['text_reading', 'navigation', 'content_structure'],
            effectiveness: 0.9
          })
          break
        case 'motor_impairment':
          technologies.push({
            technology_type: 'keyboard_navigation',
            name: 'Keyboard Navigation',
            compatibility_level: 0.95,
            integration_status: 'supported',
            features_used: ['tab_navigation', 'shortcuts', 'focus_management'],
            effectiveness: 0.85
          })
          break
      }
    })

    return technologies
  }

  private generateCognitiveSupports(needs: AccessibilityNeed[]): CognitiveSupport[] {
    const supports: CognitiveSupport[] = []

    needs.forEach(need => {
      switch (need.need_type) {
        case 'working_memory_challenges':
          supports.push({
            support_type: 'memory_aids',
            enabled: true,
            configuration: { note_taking: true, summaries: true },
            effectiveness: 0.8,
            usage_pattern: 'always'
          })
          break
        case 'attention_difficulties':
          supports.push({
            support_type: 'attention_prompts',
            enabled: true,
            configuration: { break_reminders: true, focus_cues: true },
            effectiveness: 0.7,
            usage_pattern: 'contextual'
          })
          break
      }
    })

    return supports
  }

  private analyzeSensoryConsiderations(needs: AccessibilityNeed[]): SensoryConsideration[] {
    const considerations: SensoryConsideration[] = []

    needs.forEach(need => {
      switch (need.need_type) {
        case 'visual_impairment':
          considerations.push({
            sensory_type: 'visual',
            sensitivity_level: need.severity === 'severe' ? 0.9 : 0.6,
            accommodations_needed: ['high_contrast', 'large_text', 'audio_alternatives'],
            trigger_avoidance: ['flashing_content', 'low_contrast']
          })
          break
        case 'autism_spectrum':
          considerations.push({
            sensory_type: 'visual',
            sensitivity_level: 0.7,
            accommodations_needed: ['reduced_animations', 'calm_colors'],
            trigger_avoidance: ['bright_flashing', 'rapid_movement']
          })
          break
      }
    })

    return considerations
  }

  private analyzeMotorConsiderations(needs: AccessibilityNeed[]): MotorConsideration[] {
    const considerations: MotorConsideration[] = []

    needs.forEach(need => {
      switch (need.need_type) {
        case 'motor_impairment':
          considerations.push({
            motor_type: 'fine_motor',
            limitation_level: need.severity === 'severe' ? 0.8 : 0.5,
            preferred_input_methods: ['keyboard', 'voice', 'switch'],
            fatigue_management: ['frequent_breaks', 'simplified_interactions']
          })
          break
      }
    })

    return considerations
  }

  // Content analysis methods
  private analyzeVisualBarriers(content: any): string[] {
    const barriers: string[] = []

    // Check for images without alt text
    if (content.images) {
      const imagesWithoutAlt = content.images.filter((img: any) => !img.alt_text).length
      if (imagesWithoutAlt > 0) {
        barriers.push(`${imagesWithoutAlt} images missing alt text`)
      }
    }

    // Check for poor color contrast (simplified check)
    if (content.text && content.text.includes('color:')) {
      barriers.push('Potential color contrast issues detected')
    }

    return barriers
  }

  private async analyzeCognitiveBarriers(content: any): Promise<string[]> {
    const barriers: string[] = []

    // Analyze text complexity
    if (content.text) {
      const textComplexity = await this.analyzeTextComplexity(content.text)
      if (textComplexity.reading_level > 12) {
        barriers.push('Text complexity too high for general audience')
      }
      if (textComplexity.sentence_length > 25) {
        barriers.push('Sentences too long for easy comprehension')
      }
    }

    // Check for complex navigation
    if (content.structure?.navigation && content.structure.navigation.length > 7) {
      barriers.push('Navigation menu too complex (more than 7 items)')
    }

    return barriers
  }

  private analyzeMotorBarriers(content: any): string[] {
    const barriers: string[] = []

    // Check for small click targets
    if (content.interactive_elements) {
      const smallTargets = content.interactive_elements.filter((el: any) => 
        el.size && (el.size.width < 44 || el.size.height < 44)
      ).length

      if (smallTargets > 0) {
        barriers.push(`${smallTargets} interactive elements smaller than recommended 44px`)
      }
    }

    return barriers
  }

  private analyzeAuditoryBarriers(content: any): string[] {
    const barriers: string[] = []

    // Check for videos without captions
    if (content.videos) {
      const videosWithoutCaptions = content.videos.filter((video: any) => !video.captions).length
      if (videosWithoutCaptions > 0) {
        barriers.push(`${videosWithoutCaptions} videos missing captions`)
      }
    }

    return barriers
  }

  private async analyzeTextComplexity(text: string): Promise<{
    reading_level: number
    sentence_length: number
    word_complexity: number
  }> {
    // Simplified text complexity analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/)
    
    const avgSentenceLength = words.length / sentences.length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    
    // Simplified reading level calculation (Flesch-Kincaid approximation)
    const readingLevel = 0.39 * avgSentenceLength + 11.8 * (avgWordLength / 4.7) - 15.59

    return {
      reading_level: Math.max(1, readingLevel),
      sentence_length: avgSentenceLength,
      word_complexity: avgWordLength
    }
  }

  private calculateAccessibilityScore(barriers: {
    visualBarriers: string[]
    cognitiveBarriers: string[]
    motorBarriers: string[]
    auditoryBarriers: string[]
  }): number {
    const totalBarriers = barriers.visualBarriers.length + 
                         barriers.cognitiveBarriers.length + 
                         barriers.motorBarriers.length + 
                         barriers.auditoryBarriers.length

    // Score decreases with more barriers
    return Math.max(0, 1 - (totalBarriers * 0.1))
  }

  private checkWCAGCompliance(content: any): ContentAccessibilityAnalysis['wcag_compliance'] {
    const failingCriteria: string[] = []

    // Simplified WCAG checks
    if (content.images?.some((img: any) => !img.alt_text)) {
      failingCriteria.push('1.1.1 Non-text Content')
    }

    if (content.videos?.some((video: any) => !video.captions)) {
      failingCriteria.push('1.2.2 Captions (Prerecorded)')
    }

    const level_a = failingCriteria.length === 0
    const level_aa = level_a // Simplified
    const level_aaa = level_aa // Simplified

    return {
      level_a,
      level_aa,
      level_aaa,
      failing_criteria: failingCriteria
    }
  }

  private async generateAccessibilityRecommendations(
    barriers: any,
    wcagCompliance: any
  ): Promise<AccessibilityRecommendation[]> {
    const recommendations: AccessibilityRecommendation[] = []

    // Generate recommendations based on barriers
    Object.entries(barriers).forEach(([category, barrierList]) => {
      (barrierList as string[]).forEach((barrier, index) => {
        recommendations.push({
          recommendation_id: `${category}_${index}`,
          priority: 'high',
          category: category.replace('Barriers', '') as any,
          title: `Address ${barrier}`,
          description: `Fix accessibility barrier: ${barrier}`,
          implementation_steps: this.getImplementationSteps(barrier),
          expected_impact: [`Improved accessibility for ${category.replace('Barriers', '')} users`],
          effort_level: 'medium',
          wcag_criteria: this.getRelevantWCAGCriteria(barrier)
        })
      })
    })

    return recommendations.slice(0, 10) // Limit to top 10
  }

  private generateAdaptationSuggestions(barriers: any): string[] {
    const suggestions: string[] = []

    if (barriers.visualBarriers.length > 0) {
      suggestions.push('Provide alternative text formats')
      suggestions.push('Enable high contrast mode')
    }

    if (barriers.cognitiveBarriers.length > 0) {
      suggestions.push('Simplify content structure')
      suggestions.push('Add visual aids and summaries')
    }

    if (barriers.motorBarriers.length > 0) {
      suggestions.push('Increase click target sizes')
      suggestions.push('Add keyboard navigation')
    }

    if (barriers.auditoryBarriers.length > 0) {
      suggestions.push('Add closed captions to videos')
      suggestions.push('Provide transcripts for audio content')
    }

    return suggestions
  }

  private getImplementationSteps(barrier: string): string[] {
    // Simplified implementation steps
    if (barrier.includes('alt text')) {
      return ['Add descriptive alt text to all images', 'Review and update existing alt text']
    }
    if (barrier.includes('captions')) {
      return ['Add closed captions to videos', 'Ensure captions are accurate and synchronized']
    }
    return ['Identify the issue', 'Implement the fix', 'Test with users']
  }

  private getRelevantWCAGCriteria(barrier: string): string[] {
    if (barrier.includes('alt text')) return ['1.1.1']
    if (barrier.includes('captions')) return ['1.2.2']
    if (barrier.includes('contrast')) return ['1.4.3']
    return []
  }

  // Utility methods
  private calculateAssessmentConfidence(
    needs: AccessibilityNeed[],
    assessmentData: any
  ): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence with more data sources
    if (assessmentData.self_reported) confidence += 0.2
    if (assessmentData.behavioral_data) confidence += 0.2
    if (assessmentData.performance_indicators) confidence += 0.1

    // Increase confidence with diagnosed conditions
    if (needs.some(need => need.diagnosed)) confidence += 0.2

    return Math.min(1, confidence)
  }

  private determineFollowUpNeeded(needs: AccessibilityNeed[]): boolean {
    // Follow-up needed if severe needs detected or low confidence
    return needs.some(need => need.severity === 'severe') || 
           needs.some(need => !need.diagnosed && !need.self_reported)
  }

  private deduplicateAccommodations(accommodations: Accommodation[]): Accommodation[] {
    const seen = new Set<string>()
    return accommodations.filter(acc => {
      if (seen.has(acc.accommodation_id)) return false
      seen.add(acc.accommodation_id)
      return true
    })
  }

  private prioritizeAccommodations(
    accommodations: Accommodation[],
    needs: AccessibilityNeed[]
  ): Accommodation[] {
    return accommodations.sort((a, b) => {
      // Prioritize by effectiveness and severity of needs addressed
      const aScore = a.effectiveness * this.getNeedSeverityScore(a.target_needs, needs)
      const bScore = b.effectiveness * this.getNeedSeverityScore(b.target_needs, needs)
      return bScore - aScore
    })
  }

  private getNeedSeverityScore(targetNeeds: AccessibilityNeedType[], allNeeds: AccessibilityNeed[]): number {
    const severityMap = { 'mild': 1, 'moderate': 2, 'severe': 3 }
    
    return targetNeeds.reduce((score, needType) => {
      const need = allNeeds.find(n => n.need_type === needType)
      return score + (need ? severityMap[need.severity] : 0)
    }, 0)
  }

  private async implementAccommodation(accommodation: Accommodation): Promise<Record<string, any>> {
    // Return the settings that would be applied
    // In a real implementation, this would modify the UI/content
    return accommodation.settings
  }

  // Public API methods
  getAccessibilityProfile(userId: string): AccessibilityProfile | null {
    return this.profiles.get(userId) || null
  }

  getAccessibilityAssessments(userId: string): AccessibilityAssessment[] {
    return this.assessments.get(userId) || []
  }

  getAvailableAccommodations(): Accommodation[] {
    return Array.from(this.accommodations.values())
  }

  getContentAccessibilityAnalysis(contentId: string): ContentAccessibilityAnalysis | null {
    return this.contentAnalyses.get(contentId) || null
  }

  async updateAccommodationEffectiveness(
    accommodationId: string,
    effectiveness: number,
    userSatisfaction: number
  ): Promise<boolean> {
    const accommodation = this.accommodations.get(accommodationId)
    if (!accommodation) return false

    accommodation.effectiveness = Math.max(0, Math.min(1, effectiveness))
    accommodation.user_satisfaction = Math.max(0, Math.min(1, userSatisfaction))
    
    this.accommodations.set(accommodationId, accommodation)
    return true
  }
}

// Create and export singleton instance
export const accessibilityEngine = new AccessibilityEngine()
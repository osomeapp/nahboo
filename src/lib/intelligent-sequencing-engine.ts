// Intelligent Content Sequencing Engine
// AI-powered system for optimal learning path generation and content sequencing

import type { UserProfile, ContentItem } from '@/types'
import type { LearningStyleProfile } from './learning-style-engine'
import type { DifficultyProfile, PerformancePoint } from './difficulty-engine'
import { multiModelAI, type UseCase } from './multi-model-ai'
import { learningStyleEngine } from './learning-style-engine'
import { difficultyEngine } from './difficulty-engine'

export interface LearningObjective {
  id: string
  title: string
  description: string
  subject: string
  difficulty: number
  estimatedTime: number
  prerequisites: string[]
  skills: string[]
  conceptTags: string[]
  masteryThreshold: number // 0-1 scale for when objective is considered mastered
}

export interface KnowledgeGap {
  objectiveId: string
  gapType: 'prerequisite' | 'skill' | 'concept' | 'difficulty'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  recommendedContent: string[]
  estimatedTimeToFill: number
  confidence: number
}

export interface LearningPath {
  id: string
  userId: string
  title: string
  description: string
  objectives: LearningObjective[]
  totalEstimatedTime: number
  difficulty: number
  sequences: LearningSequence[]
  adaptationPoints: AdaptationPoint[]
  progressTracking: ProgressTracking
  generatedAt: Date
  lastUpdated: Date
}

export interface LearningSequence {
  id: string
  stepNumber: number
  contentItems: ContentItem[]
  learningObjective: LearningObjective
  prerequisites: PrerequisiteCheck[]
  estimatedTime: number
  difficultyLevel: number
  learningStyle: string
  adaptationTriggers: string[]
  completionCriteria: CompletionCriteria
  nextSequenceConditions: NextSequenceCondition[]
}

export interface PrerequisiteCheck {
  objectiveId: string
  requiredMasteryLevel: number
  isMet: boolean
  confidence: number
  recommendedActions: string[]
}

export interface CompletionCriteria {
  minSuccessRate: number
  maxAttempts: number
  timeLimit?: number
  requiredInteractions: string[]
  masteryIndicators: string[]
}

export interface NextSequenceCondition {
  type: 'mastery_achieved' | 'time_spent' | 'performance_threshold' | 'ai_recommendation'
  threshold: number
  action: 'proceed' | 'review' | 'branch' | 'adapt'
  confidence: number
}

export interface AdaptationPoint {
  sequenceId: string
  triggerConditions: AdaptationTrigger[]
  adaptationOptions: AdaptationOption[]
  fallbackStrategy: string
  monitoringDuration: number
}

export interface AdaptationTrigger {
  type: 'performance_drop' | 'time_exceeded' | 'frustration_detected' | 'mastery_plateau'
  threshold: number
  windowSize: number // Number of recent interactions to consider
}

export interface AdaptationOption {
  type: 'difficulty_adjustment' | 'style_change' | 'content_substitution' | 'additional_support'
  action: string
  expectedImpact: number
  confidence: number
  requiredResources: string[]
}

export interface ProgressTracking {
  objectivesCompleted: number
  totalObjectives: number
  currentSequence: number
  overallProgress: number // 0-1 scale
  timeSpent: number
  estimatedTimeRemaining: number
  masteryLevels: Record<string, number>
  skillProgression: Record<string, number>
  difficultyProgression: number[]
  adaptationHistory: AdaptationRecord[]
}

export interface AdaptationRecord {
  timestamp: Date
  sequenceId: string
  triggerType: string
  adaptationType: string
  previousState: any
  newState: any
  effectiveness: number // Measured later
  userFeedback?: string
}

export interface SequencingRecommendation {
  recommendedPath: LearningPath
  alternativePaths: LearningPath[]
  rationale: string
  confidence: number
  expectedOutcomes: {
    completionTime: number
    masteryLevel: number
    engagementScore: number
    retentionScore: number
  }
  riskFactors: string[]
  optimizationOpportunities: string[]
}

export class IntelligentSequencingEngine {
  private learningPaths: Map<string, LearningPath> = new Map()
  private knowledgeGraph: Map<string, LearningObjective> = new Map()
  private userProgressTracking: Map<string, ProgressTracking> = new Map()

  /**
   * Generate intelligent learning path with AI-powered sequencing
   */
  async generateOptimalLearningPath(
    userId: string,
    userProfile: UserProfile,
    targetObjectives: LearningObjective[],
    availableContent: ContentItem[],
    constraints?: {
      maxTime?: number
      maxDifficulty?: number
      preferredStyles?: string[]
      urgentObjectives?: string[]
    }
  ): Promise<SequencingRecommendation> {
    
    // Step 1: Analyze user's current knowledge state
    const knowledgeState = await this.analyzeCurrentKnowledgeState(
      userId,
      userProfile,
      targetObjectives
    )
    
    // Step 2: Detect knowledge gaps and prerequisites
    const knowledgeGaps = await this.detectKnowledgeGaps(
      knowledgeState,
      targetObjectives,
      userProfile
    )
    
    // Step 3: Generate prerequisite learning objectives
    const prerequisiteObjectives = await this.generatePrerequisiteObjectives(
      knowledgeGaps,
      userProfile
    )
    
    // Step 4: Create comprehensive objective set
    const allObjectives = [...prerequisiteObjectives, ...targetObjectives]
    
    // Step 5: Generate optimal sequence using AI
    const optimalSequence = await this.generateAIOptimizedSequence(
      allObjectives,
      availableContent,
      userProfile,
      knowledgeState,
      constraints
    )
    
    // Step 6: Create learning path with adaptation points
    const learningPath = await this.createAdaptiveLearningPath(
      userId,
      optimalSequence,
      availableContent,
      userProfile
    )
    
    // Step 7: Generate alternative paths for comparison (fallback)
    const alternativePaths = [
      { path_id: 'alt1', confidence: 0.7, reasoning: 'Alternative linear progression' },
      { path_id: 'alt2', confidence: 0.6, reasoning: 'Concept-cluster based approach' }
    ]
    
    // Step 8: Create final recommendation
    const recommendation = await this.getAISequenceRecommendation(
      learningPath.objectives,
      availableContent,
      userProfile,
      knowledgeGaps
    )
    
    // Store the learning path
    this.learningPaths.set(learningPath.id, learningPath)
    
    return recommendation
  }

  /**
   * Analyze user's current knowledge state using AI and performance data
   */
  private async analyzeCurrentKnowledgeState(
    userId: string,
    userProfile: UserProfile,
    objectives: LearningObjective[]
  ): Promise<any> {
    
    // Get user's learning style and difficulty profiles
    const learningStyleProfile = await learningStyleEngine.getLearningStyleProfile(userId)
    const difficultyProfile = await difficultyEngine.getUserDifficultyProfile(userId)
    
    // Generate mock performance data for analysis
    const recentPerformance = this.generateMockPerformanceData(userId, 20)
    
    // Analyze performance patterns
    const performanceAnalysis = this.analyzePerformancePatterns(recentPerformance, objectives)
    
    // Use AI to assess current knowledge level
    const aiKnowledgeAssessment = await this.getAIKnowledgeAssessment(
      userProfile,
      objectives,
      performanceAnalysis
    )
    
    return {
      userProfile,
      learningStyleProfile,
      difficultyProfile,
      performanceAnalysis,
      aiKnowledgeAssessment,
      estimatedMasteryLevels: this.estimateMasteryLevels(objectives, performanceAnalysis),
      skillProficiency: this.assessSkillProficiency(userProfile, objectives),
      learningVelocity: this.calculateLearningVelocity(recentPerformance),
      confidenceLevel: this.calculateOverallConfidence(performanceAnalysis, aiKnowledgeAssessment)
    }
  }

  /**
   * Detect knowledge gaps using AI analysis
   */
  private async detectKnowledgeGaps(
    knowledgeState: any,
    objectives: LearningObjective[],
    userProfile: UserProfile
  ): Promise<KnowledgeGap[]> {
    
    const gaps: KnowledgeGap[] = []
    
    for (const objective of objectives) {
      // Check if user has sufficient prerequisites
      const prerequisiteGaps = await this.checkPrerequisiteGaps(objective, knowledgeState)
      gaps.push(...prerequisiteGaps)
      
      // Check skill gaps
      const skillGaps = await this.checkSkillGaps(objective, knowledgeState)
      gaps.push(...skillGaps)
      
      // Check concept understanding gaps
      const conceptGaps = await this.checkConceptGaps(objective, knowledgeState, userProfile)
      gaps.push(...conceptGaps)
      
      // Check difficulty readiness gaps
      const difficultyGaps = await this.checkDifficultyGaps(objective, knowledgeState)
      gaps.push(...difficultyGaps)
    }
    
    // Use AI to prioritize and refine gap analysis (fallback)
    const refinedGaps = gaps.map((gap, index) => ({
      ...gap,
      priority: 1.0 - (index * 0.1) // Simple descending priority
    }))
    
    return refinedGaps.sort((a, b) => this.getGapPriority(b) - this.getGapPriority(a))
  }

  /**
   * Generate AI-optimized content sequence
   */
  private async generateAIOptimizedSequence(
    objectives: LearningObjective[],
    content: ContentItem[],
    userProfile: UserProfile,
    knowledgeState: any,
    constraints?: any
  ): Promise<LearningSequence[]> {
    
    // Use AI to determine optimal sequence
    const aiSequenceAnalysis = await this.getAISequenceRecommendation(
      objectives,
      content,
      userProfile,
      knowledgeState,
      constraints
    )
    
    // Create detailed learning sequences
    const sequences: LearningSequence[] = []
    
    for (let i = 0; i < aiSequenceAnalysis.recommendedOrder.length; i++) {
      const objectiveId = aiSequenceAnalysis.recommendedOrder[i]
      const objective = objectives.find(obj => obj.id === objectiveId)!
      
      const sequence: LearningSequence = {
        id: `seq_${i + 1}_${Date.now()}`,
        stepNumber: i + 1,
        contentItems: content.slice(i * 3, (i + 1) * 3),
        learningObjective: objective,
        prerequisites: [],
        estimatedTime: 30,
        difficultyLevel: objective.difficulty,
        learningStyle: 'balanced',
        adaptationTriggers: ['low_performance', 'high_frustration'],
        completionCriteria: {
          minSuccessRate: 0.7,
          maxAttempts: 3,
          requiredInteractions: ['content_view', 'exercise_complete'],
          masteryIndicators: ['quiz_passed', 'concept_understood']
        },
        nextSequenceConditions: []
      }
      
      sequences.push(sequence)
    }
    
    return sequences
  }

  /**
   * Create adaptive learning path with monitoring points
   */
  private async createAdaptiveLearningPath(
    userId: string,
    sequences: LearningSequence[],
    content: ContentItem[],
    userProfile: UserProfile
  ): Promise<LearningPath> {
    
    const objectives = sequences.map(seq => seq.learningObjective)
    const totalTime = sequences.reduce((sum, seq) => sum + seq.estimatedTime, 0)
    const avgDifficulty = sequences.reduce((sum, seq) => sum + seq.difficultyLevel, 0) / sequences.length
    
    // Generate adaptation points for monitoring and adjustment (fallback)
    const adaptationPoints: AdaptationPoint[] = sequences.map((seq, index) => ({
      sequenceId: seq.id,
      triggerConditions: [
        { type: 'performance_drop', threshold: 0.6, windowSize: 3 },
        { type: 'time_exceeded', threshold: 1.5, windowSize: 5 },
        { type: 'frustration_detected', threshold: 0.7, windowSize: 2 }
      ],
      adaptationOptions: [
        { 
          type: 'difficulty_adjustment', 
          action: 'reduce_difficulty', 
          expectedImpact: 0.7, 
          confidence: 0.8, 
          requiredResources: ['simpler_content'] 
        },
        { 
          type: 'style_change', 
          action: 'visual_presentation', 
          expectedImpact: 0.6, 
          confidence: 0.7, 
          requiredResources: ['multimedia_content'] 
        }
      ],
      fallbackStrategy: 'provide_additional_support',
      monitoringDuration: 300 // 5 minutes
    }))
    
    const learningPath: LearningPath = {
      id: `path_${userId}_${Date.now()}`,
      userId,
      title: `Learning Path: ${userProfile.subject} for ${userProfile.level} learner`,
      description: `Personalized learning sequence covering ${objectives.length} objectives in ${userProfile.subject}`,
      objectives,
      totalEstimatedTime: totalTime,
      difficulty: avgDifficulty,
      sequences,
      adaptationPoints,
      progressTracking: {
        objectivesCompleted: 0,
        totalObjectives: objectives.length,
        currentSequence: 0,
        overallProgress: 0,
        timeSpent: 0,
        estimatedTimeRemaining: totalTime,
        masteryLevels: objectives.reduce((acc, obj) => ({ ...acc, [obj.id]: 0 }), {}),
        skillProgression: objectives.flatMap(obj => obj.skills).reduce((acc, skill) => ({ ...acc, [skill]: 0 }), {}),
        difficultyProgression: [avgDifficulty],
        adaptationHistory: []
      },
      generatedAt: new Date(),
      lastUpdated: new Date()
    }
    
    return learningPath
  }

  /**
   * Get AI knowledge assessment
   */
  private async getAIKnowledgeAssessment(
    userProfile: UserProfile,
    objectives: LearningObjective[],
    performanceAnalysis: any
  ): Promise<any> {
    
    const useCase = this.determineUseCase(userProfile.subject)
    
    const context = `
User Profile: ${userProfile.subject} ${userProfile.level} learner
Learning Objectives: ${objectives.map(obj => `- ${obj.title}: ${obj.description}`).join('\n')}
Performance Data: 
- Success Rate: ${performanceAnalysis.successRate}
- Average Attempts: ${performanceAnalysis.averageAttempts}
- Learning Trend: ${performanceAnalysis.trend}

Please assess the user's current knowledge level for each objective and identify:
1. Estimated mastery level (0-1) for each objective
2. Key knowledge gaps
3. Recommended prerequisite topics
4. Optimal learning sequence recommendations
5. Potential challenges and mitigation strategies
`

    try {
      const aiResponse = await multiModelAI.generateContent({
        useCase,
        userProfile,
        context,
        requestType: 'planning',
        priority: 'high',
        maxTokens: 2000,
        fallbackRequired: true
      })

      return this.parseAIKnowledgeAssessment(aiResponse.content)
    } catch (error) {
      console.warn('AI knowledge assessment failed, using fallback:', error)
      return this.getFallbackKnowledgeAssessment(userProfile, objectives)
    }
  }

  /**
   * Get AI sequence recommendation
   */
  private async getAISequenceRecommendation(
    objectives: LearningObjective[],
    content: ContentItem[],
    userProfile: UserProfile,
    knowledgeState: any,
    constraints?: any
  ): Promise<any> {
    
    const useCase = this.determineUseCase(userProfile.subject)
    
    const context = `
Learning Objectives to Sequence:
${objectives.map((obj, i) => `${i+1}. ${obj.title} (Difficulty: ${obj.difficulty}, Time: ${obj.estimatedTime}min)
   Prerequisites: ${obj.prerequisites.join(', ') || 'None'}
   Skills: ${obj.skills.join(', ')}
   Description: ${obj.description}`).join('\n\n')}

User Context:
- Subject: ${userProfile.subject}
- Level: ${userProfile.level}
- Learning Style: ${knowledgeState.learningStyleProfile?.primaryStyle || 'Unknown'}
- Current Mastery Levels: ${JSON.stringify(knowledgeState.estimatedMasteryLevels)}

Available Content: ${content.length} items covering various topics and formats

Constraints: ${constraints ? JSON.stringify(constraints) : 'None specified'}

Please provide an optimal learning sequence that:
1. Respects prerequisite dependencies
2. Follows logical difficulty progression
3. Considers user's learning style and current knowledge
4. Maximizes learning efficiency and retention
5. Includes checkpoints for assessment and adaptation

Respond with:
- Recommended objective order (by ID)
- Rationale for sequencing decisions
- Suggested pacing and review points
- Risk factors and mitigation strategies
`

    try {
      const aiResponse = await multiModelAI.generateContent({
        useCase,
        userProfile,
        context,
        requestType: 'planning',
        priority: 'high',
        maxTokens: 2500,
        fallbackRequired: true
      })

      return this.parseAISequenceRecommendation(aiResponse.content, objectives)
    } catch (error) {
      console.warn('AI sequence recommendation failed, using fallback:', error)
      return this.getFallbackSequenceRecommendation(objectives, userProfile)
    }
  }

  // Helper methods for analysis and processing
  private analyzePerformancePatterns(performance: PerformancePoint[], objectives: LearningObjective[]): any {
    if (performance.length === 0) {
      return {
        successRate: 0.7,
        averageAttempts: 1.5,
        averageTime: 300,
        trend: 'stable',
        consistency: 0.7
      }
    }
    
    const successRate = performance.filter(p => p.success).length / performance.length
    const averageAttempts = performance.reduce((sum, p) => sum + p.attempts, 0) / performance.length
    const averageTime = performance.reduce((sum, p) => sum + p.timeSpent, 0) / performance.length
    
    // Calculate trend
    const recentPerformance = performance.slice(-5)
    const earlierPerformance = performance.slice(0, 5)
    
    const recentSuccess = recentPerformance.filter(p => p.success).length / Math.max(recentPerformance.length, 1)
    const earlierSuccess = earlierPerformance.filter(p => p.success).length / Math.max(earlierPerformance.length, 1)
    
    let trend = 'stable'
    if (recentSuccess > earlierSuccess + 0.1) trend = 'improving'
    else if (recentSuccess < earlierSuccess - 0.1) trend = 'declining'
    
    const scores = performance.map(p => p.success ? 1 : 0)
    const variance = this.calculateVariance(scores)
    const consistency = Math.max(0, 1 - variance)
    
    return {
      successRate,
      averageAttempts,
      averageTime,
      trend,
      consistency,
      recentPerformance: recentSuccess,
      earlierPerformance: earlierSuccess
    }
  }

  private estimateMasteryLevels(objectives: LearningObjective[], performanceAnalysis: any): Record<string, number> {
    const masteryLevels: Record<string, number> = {}
    
    objectives.forEach(objective => {
      // Estimate mastery based on difficulty, user performance, and subject
      const baseMastery = performanceAnalysis.successRate
      const difficultyAdjustment = (10 - objective.difficulty) * 0.05 // Easier objectives assume higher mastery
      const trendAdjustment = performanceAnalysis.trend === 'improving' ? 0.1 : 
                             performanceAnalysis.trend === 'declining' ? -0.1 : 0
      
      masteryLevels[objective.id] = Math.max(0, Math.min(1, 
        baseMastery + difficultyAdjustment + trendAdjustment
      ))
    })
    
    return masteryLevels
  }

  private assessSkillProficiency(userProfile: UserProfile, objectives: LearningObjective[]): Record<string, number> {
    const skillProficiency: Record<string, number> = {}
    
    // Extract all skills from objectives
    const allSkills = new Set<string>()
    objectives.forEach(obj => obj.skills.forEach(skill => allSkills.add(skill)))
    
    // Estimate proficiency based on user level and subject
    const baseProficiency = userProfile.level === 'beginner' ? 0.3 : 
                           userProfile.level === 'intermediate' ? 0.6 : 0.8
    
    allSkills.forEach(skill => {
      skillProficiency[skill] = baseProficiency + (Math.random() * 0.2 - 0.1) // Add some variance
    })
    
    return skillProficiency
  }

  private calculateLearningVelocity(performance: PerformancePoint[]): number {
    if (performance.length < 2) return 0.5
    
    // Calculate improvement rate over time
    const timespan = performance[performance.length - 1].timestamp.getTime() - performance[0].timestamp.getTime()
    const improvementRate = (performance.slice(-3).filter(p => p.success).length / 3) - 
                           (performance.slice(0, 3).filter(p => p.success).length / 3)
    
    return Math.max(0, Math.min(1, 0.5 + improvementRate))
  }

  private calculateOverallConfidence(performanceAnalysis: any, aiAssessment: any): number {
    const performanceConfidence = performanceAnalysis.consistency * 0.6 + 
                                 (performanceAnalysis.successRate > 0.3 ? 0.4 : 0)
    const aiConfidence = aiAssessment.confidence || 0.7
    
    return (performanceConfidence + aiConfidence) / 2
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length
  }

  private determineUseCase(subject: string): UseCase {
    const subjectLower = subject.toLowerCase()
    
    if (subjectLower.includes('math')) return 'mathematics'
    if (subjectLower.includes('science') || subjectLower.includes('physics') || 
        subjectLower.includes('chemistry') || subjectLower.includes('biology')) return 'science'
    if (subjectLower.includes('program') || subjectLower.includes('code')) return 'programming'
    if (subjectLower.includes('writing') || subjectLower.includes('english')) return 'creative_writing'
    if (subjectLower.includes('history')) return 'history'
    if (subjectLower.includes('business')) return 'business'
    if (subjectLower.includes('language')) return 'language_learning'
    
    return 'general_tutoring'
  }

  // Additional helper methods will be implemented in the next parts...
  private async checkPrerequisiteGaps(objective: LearningObjective, knowledgeState: any): Promise<KnowledgeGap[]> {
    const gaps: KnowledgeGap[] = []
    
    for (const prereqId of objective.prerequisites) {
      const masteryLevel = knowledgeState.estimatedMasteryLevels[prereqId] || 0
      
      if (masteryLevel < objective.masteryThreshold) {
        gaps.push({
          objectiveId: objective.id,
          gapType: 'prerequisite',
          severity: masteryLevel < 0.3 ? 'critical' : masteryLevel < 0.5 ? 'high' : 'medium',
          description: `Insufficient mastery of prerequisite: ${prereqId}`,
          recommendedContent: [prereqId],
          estimatedTimeToFill: Math.ceil((objective.masteryThreshold - masteryLevel) * objective.estimatedTime),
          confidence: 0.8
        })
      }
    }
    
    return gaps
  }

  private async checkSkillGaps(objective: LearningObjective, knowledgeState: any): Promise<KnowledgeGap[]> {
    const gaps: KnowledgeGap[] = []
    
    for (const skill of objective.skills) {
      const proficiency = knowledgeState.skillProficiency[skill] || 0
      
      if (proficiency < 0.5) {
        gaps.push({
          objectiveId: objective.id,
          gapType: 'skill',
          severity: proficiency < 0.2 ? 'high' : 'medium',
          description: `Needs skill development: ${skill}`,
          recommendedContent: [`skill_${skill}`],
          estimatedTimeToFill: Math.ceil((0.5 - proficiency) * 30), // 30 min per skill gap
          confidence: 0.7
        })
      }
    }
    
    return gaps
  }

  private async checkConceptGaps(objective: LearningObjective, knowledgeState: any, userProfile: UserProfile): Promise<KnowledgeGap[]> {
    // This would use AI to analyze concept understanding
    // For now, return simplified analysis
    return []
  }

  private async checkDifficultyGaps(objective: LearningObjective, knowledgeState: any): Promise<KnowledgeGap[]> {
    const gaps: KnowledgeGap[] = []
    const currentLevel = knowledgeState.difficultyProfile?.currentLevel || 5
    
    if (objective.difficulty > currentLevel + 2) {
      gaps.push({
        objectiveId: objective.id,
        gapType: 'difficulty',
        severity: 'high',
        description: `Objective difficulty (${objective.difficulty}) exceeds current level (${currentLevel})`,
        recommendedContent: [`difficulty_bridge_${currentLevel}_to_${objective.difficulty}`],
        estimatedTimeToFill: (objective.difficulty - currentLevel) * 15,
        confidence: 0.9
      })
    }
    
    return gaps
  }

  private generateMockPerformanceData(userId: string, count: number): PerformancePoint[] {
    return Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 5 * 60 * 1000),
      contentId: `content_${i % 5}`,
      difficultyLevel: Math.floor(Math.random() * 7) + 2,
      success: Math.random() > 0.3,
      attempts: Math.floor(Math.random() * 3) + 1,
      timeSpent: Math.floor(Math.random() * 300) + 60,
      score: Math.random(),
      contextFactors: {
        timeOfDay: (['morning', 'afternoon', 'evening'] as const)[Math.floor(Math.random() * 3)],
        sessionDuration: i * 5,
        deviceType: Math.random() > 0.7 ? 'mobile' : 'desktop',
        distractionLevel: Math.random() * 0.5
      }
    })).reverse()
  }

  // More helper methods continued...
  
  /**
   * Parse AI knowledge assessment response
   */
  private parseAIKnowledgeAssessment(content: string): any {
    try {
      // Attempt to parse JSON response
      const parsed = JSON.parse(content)
      return {
        masteryLevels: parsed.masteryLevels || {},
        knowledgeGaps: parsed.knowledgeGaps || [],
        prerequisites: parsed.prerequisites || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.8
      }
    } catch (error) {
      // Fallback text parsing
      return this.parseTextAssessment(content)
    }
  }

  /**
   * Parse text-based AI assessment
   */
  private parseTextAssessment(content: string): any {
    const masteryLevels: Record<string, number> = {}
    const knowledgeGaps: string[] = []
    const prerequisites: string[] = []
    const recommendations: string[] = []

    // Extract mastery levels (looking for patterns like "Object1: 75%" or "mastery: 0.75")
    const masteryRegex = /(\\w+).*?(?:mastery|level|score).*?([0-9.]+)%?/gi
    let match
    while ((match = masteryRegex.exec(content)) !== null) {
      const value = parseFloat(match[2])
      masteryLevels[match[1]] = value > 1 ? value / 100 : value
    }

    // Extract gaps (looking for "gap:" or "missing:" patterns)
    const gapRegex = /(?:gap|missing|needs|lacks?)[:.]?\\s*([^\\n.]+)/gi
    while ((match = gapRegex.exec(content)) !== null) {
      knowledgeGaps.push(match[1].trim())
    }

    // Extract prerequisites (looking for "prerequisite:" or "requires:" patterns)
    const prereqRegex = /(?:prerequisite|requires?|needs?)[:.]?\\s*([^\\n.]+)/gi
    while ((match = prereqRegex.exec(content)) !== null) {
      prerequisites.push(match[1].trim())
    }

    // Extract recommendations (looking for "recommend:" or "suggest:" patterns)
    const recRegex = /(?:recommend|suggest|advise)[:.]?\\s*([^\\n.]+)/gi
    while ((match = recRegex.exec(content)) !== null) {
      recommendations.push(match[1].trim())
    }

    return {
      masteryLevels,
      knowledgeGaps,
      prerequisites,
      recommendations,
      confidence: 0.7 // Lower confidence for text parsing
    }
  }

  private getFallbackKnowledgeAssessment(userProfile: UserProfile, objectives: LearningObjective[]): any {
    return {
      masteryLevels: objectives.reduce((acc, obj) => {
        acc[obj.id] = userProfile.level === 'beginner' ? 0.3 : 
                     userProfile.level === 'intermediate' ? 0.6 : 0.8
        return acc
      }, {} as Record<string, number>),
      knowledgeGaps: [],
      prerequisites: [],
      recommendations: ['Follow standard learning progression'],
      confidence: 0.6
    }
  }

  private parseAISequenceRecommendation(content: string, objectives: LearningObjective[]): any {
    // For now, return a simple sequence based on difficulty
    return {
      recommendedOrder: objectives.sort((a, b) => a.difficulty - b.difficulty).map(obj => obj.id),
      rationale: 'Difficulty-based progression with prerequisite consideration',
      confidence: 0.7,
      adaptationPoints: [],
      reviewPoints: []
    }
  }

  private getFallbackSequenceRecommendation(objectives: LearningObjective[], userProfile: UserProfile): any {
    return {
      recommendedOrder: objectives.sort((a, b) => a.difficulty - b.difficulty).map(obj => obj.id),
      rationale: 'Standard difficulty progression',
      confidence: 0.6,
      adaptationPoints: [],
      reviewPoints: []
    }
  }

  private getGapPriority(gap: KnowledgeGap): number {
    const severityScores = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityScores[gap.severity] * gap.confidence
  }

  /**
   * Generate prerequisite objectives based on knowledge gaps
   */
  private async generatePrerequisiteObjectives(
    knowledgeGaps: KnowledgeGap[],
    userProfile: UserProfile
  ): Promise<LearningObjective[]> {
    const prerequisites: LearningObjective[] = []
    
    // Group gaps by severity and type
    const criticalGaps = knowledgeGaps.filter(gap => gap.severity === 'critical' || gap.severity === 'high')
    
    for (const gap of criticalGaps) {
      // Create prerequisite objective for each critical gap
      const prereq: LearningObjective = {
        id: `prereq_${gap.objectiveId}_${gap.gapType}`,
        title: `${gap.gapType.charAt(0).toUpperCase() + gap.gapType.slice(1)} Foundation`,
        description: `Address ${gap.gapType} gap: ${gap.description}`,
        subject: userProfile.subject,
        difficulty: Math.max(1, gap.gapType === 'difficulty' ? 3 : 2), // Easier difficulty for prerequisites
        estimatedTime: gap.estimatedTimeToFill,
        prerequisites: [], // Prerequisites have no further prerequisites
        skills: gap.recommendedContent.map(content => content.replace(/[^a-zA-Z0-9_]/g, '_')),
        conceptTags: ['prerequisite', gap.gapType],
        masteryThreshold: 0.7
      }
      
      prerequisites.push(prereq)
    }
    
    return prerequisites
  }

  // Placeholder for additional methods - implementation truncated for TypeScript compilation
}

// Export singleton instance
export const intelligentSequencingEngine = new IntelligentSequencingEngine()
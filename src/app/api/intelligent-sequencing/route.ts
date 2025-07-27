import { NextRequest, NextResponse } from 'next/server'
import { 
  intelligentSequencingEngine,
  type LearningObjective,
  type LearningPath,
  type SequencingRecommendation
} from '@/lib/intelligent-sequencing-engine'
import type { UserProfile, ContentItem } from '@/types'

export const maxDuration = 30

interface SequencingRequest {
  userId: string
  userProfile: UserProfile
  action: 'generate_path' | 'analyze_gaps' | 'optimize_sequence' | 'track_progress' | 'adapt_path'
  
  // For path generation
  targetObjectives?: LearningObjective[]
  availableContent?: ContentItem[]
  constraints?: {
    maxTime?: number
    maxDifficulty?: number
    preferredStyles?: string[]
    urgentObjectives?: string[]
  }
  
  // For progress tracking and adaptation
  pathId?: string
  currentProgress?: any
  performanceData?: any[]
  adaptationTriggers?: string[]
}

interface SequencingResponse {
  success: boolean
  action: string
  
  // Path generation results
  sequencingRecommendation?: SequencingRecommendation
  
  // Gap analysis results
  knowledgeGaps?: any[]
  prerequisiteAnalysis?: any
  
  // Optimization results
  optimizedSequence?: any[]
  adaptationPlan?: any
  
  // Progress tracking results
  progressAnalysis?: any
  nextRecommendations?: any[]
  
  metadata: {
    userId: string
    processingTime: number
    confidence: number
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: SequencingRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    let response: Partial<SequencingResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'generate_path':
        response = await handlePathGeneration(body)
        break
        
      case 'analyze_gaps':
        response = await handleGapAnalysis(body)
        break
        
      case 'optimize_sequence':
        response = await handleSequenceOptimization(body)
        break
        
      case 'track_progress':
        response = await handleProgressTracking(body)
        break
        
      case 'adapt_path':
        response = await handlePathAdaptation(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: generate_path, analyze_gaps, optimize_sequence, track_progress, or adapt_path' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: SequencingResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        confidence: calculateResponseConfidence(response),
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Intelligent sequencing API error:', error)
    return NextResponse.json(
      { error: 'Failed to process intelligent sequencing request' },
      { status: 500 }
    )
  }
}

// Handle learning path generation
async function handlePathGeneration(body: SequencingRequest): Promise<Partial<SequencingResponse>> {
  if (!body.targetObjectives || !body.availableContent) {
    throw new Error('Missing required fields for path generation: targetObjectives, availableContent')
  }

  // Generate mock content if none provided
  const availableContent = body.availableContent.length > 0 ? 
    body.availableContent : 
    generateMockContent(body.userProfile.subject, 15)

  // Generate mock objectives if none provided
  const targetObjectives = body.targetObjectives.length > 0 ? 
    body.targetObjectives : 
    generateMockObjectives(body.userProfile.subject, 5)

  const sequencingRecommendation = await intelligentSequencingEngine.generateOptimalLearningPath(
    body.userId,
    body.userProfile,
    targetObjectives,
    availableContent,
    body.constraints
  )

  return {
    sequencingRecommendation
  }
}

// Handle knowledge gap analysis
async function handleGapAnalysis(body: SequencingRequest): Promise<Partial<SequencingResponse>> {
  const targetObjectives = body.targetObjectives || generateMockObjectives(body.userProfile.subject, 3)
  
  // For gap analysis, we'll use a simplified approach
  const knowledgeGaps = await analyzeKnowledgeGaps(body.userProfile, targetObjectives)
  const prerequisiteAnalysis = await analyzePrerequisites(targetObjectives, body.userProfile)

  return {
    knowledgeGaps,
    prerequisiteAnalysis
  }
}

// Handle sequence optimization
async function handleSequenceOptimization(body: SequencingRequest): Promise<Partial<SequencingResponse>> {
  if (!body.targetObjectives) {
    throw new Error('Missing required field: targetObjectives')
  }

  const optimizedSequence = await optimizeObjectiveSequence(
    body.targetObjectives,
    body.userProfile,
    body.constraints
  )

  const adaptationPlan = await generateAdaptationPlan(
    optimizedSequence,
    body.userProfile
  )

  return {
    optimizedSequence,
    adaptationPlan
  }
}

// Handle progress tracking
async function handleProgressTracking(body: SequencingRequest): Promise<Partial<SequencingResponse>> {
  if (!body.pathId) {
    throw new Error('Missing required field: pathId')
  }

  const progressAnalysis = await analyzeProgressData(
    body.pathId,
    body.currentProgress,
    body.performanceData || []
  )

  const nextRecommendations = await generateNextStepRecommendations(
    progressAnalysis,
    body.userProfile
  )

  return {
    progressAnalysis,
    nextRecommendations
  }
}

// Handle path adaptation
async function handlePathAdaptation(body: SequencingRequest): Promise<Partial<SequencingResponse>> {
  if (!body.pathId || !body.adaptationTriggers) {
    throw new Error('Missing required fields: pathId, adaptationTriggers')
  }

  const adaptationPlan = await createPathAdaptation(
    body.pathId,
    body.adaptationTriggers,
    body.userProfile,
    body.performanceData || []
  )

  return {
    adaptationPlan
  }
}

// Helper functions for analysis and generation
async function analyzeKnowledgeGaps(userProfile: UserProfile, objectives: LearningObjective[]): Promise<any[]> {
  const gaps = []
  
  for (const objective of objectives) {
    // Simulate gap analysis based on user level and objective difficulty
    const userLevel = getUserLevelScore(userProfile.level)
    const difficultyGap = objective.difficulty - userLevel
    
    if (difficultyGap > 2) {
      gaps.push({
        objectiveId: objective.id,
        gapType: 'difficulty',
        severity: difficultyGap > 4 ? 'critical' : difficultyGap > 3 ? 'high' : 'medium',
        description: `Difficulty gap: objective level ${objective.difficulty} vs user level ${userLevel}`,
        recommendedActions: [
          'Complete prerequisite content',
          'Practice foundational skills',
          'Gradual difficulty progression'
        ],
        estimatedTimeToFill: difficultyGap * 15, // 15 minutes per difficulty level
        confidence: 0.8
      })
    }
    
    // Check for prerequisite gaps
    if (objective.prerequisites.length > 0) {
      gaps.push({
        objectiveId: objective.id,
        gapType: 'prerequisite',
        severity: 'medium',
        description: `Missing prerequisites: ${objective.prerequisites.join(', ')}`,
        recommendedActions: [
          'Complete prerequisite objectives',
          'Review fundamental concepts'
        ],
        estimatedTimeToFill: objective.prerequisites.length * 20,
        confidence: 0.9
      })
    }
    
    // Check for skill gaps
    for (const skill of objective.skills) {
      const skillProficiency = estimateSkillProficiency(userProfile, skill)
      if (skillProficiency < 0.5) {
        gaps.push({
          objectiveId: objective.id,
          gapType: 'skill',
          severity: skillProficiency < 0.2 ? 'high' : 'medium',
          description: `Skill gap: ${skill} (proficiency: ${Math.round(skillProficiency * 100)}%)`,
          recommendedActions: [
            `Practice ${skill} exercises`,
            `Study ${skill} fundamentals`,
            'Apply skill in guided practice'
          ],
          estimatedTimeToFill: Math.ceil((0.5 - skillProficiency) * 60),
          confidence: 0.7
        })
      }
    }
  }
  
  return gaps
}

async function analyzePrerequisites(objectives: LearningObjective[], userProfile: UserProfile): Promise<any> {
  const allPrerequisites = new Set<string>()
  const prerequisiteMap: Record<string, string[]> = {}
  
  objectives.forEach(objective => {
    prerequisiteMap[objective.id] = objective.prerequisites
    objective.prerequisites.forEach(prereq => allPrerequisites.add(prereq))
  })
  
  const userLevel = getUserLevelScore(userProfile.level)
  const missingPrerequisites = Array.from(allPrerequisites).filter(prereq => {
    // Simplified check - assume user is missing prerequisites above their level
    return true // For demo, assume some prerequisites are missing
  })
  
  return {
    totalPrerequisites: allPrerequisites.size,
    missingPrerequisites: missingPrerequisites.slice(0, Math.ceil(allPrerequisites.size * 0.3)),
    prerequisiteMap,
    recommendedOrder: Array.from(allPrerequisites),
    estimatedCompletionTime: missingPrerequisites.length * 25,
    criticalPath: identifyCriticalPath(objectives, prerequisiteMap)
  }
}

async function optimizeObjectiveSequence(
  objectives: LearningObjective[],
  userProfile: UserProfile,
  constraints?: any
): Promise<any[]> {
  
  // Sort by difficulty and prerequisites
  const sortedObjectives = [...objectives].sort((a, b) => {
    // First, sort by difficulty
    if (a.difficulty !== b.difficulty) {
      return a.difficulty - b.difficulty
    }
    // Then by prerequisite count
    if (a.prerequisites.length !== b.prerequisites.length) {
      return a.prerequisites.length - b.prerequisites.length
    }
    // Finally by estimated time
    return a.estimatedTime - b.estimatedTime
  })
  
  return sortedObjectives.map((objective, index) => ({
    sequenceNumber: index + 1,
    objective,
    estimatedStartTime: index * (objective.estimatedTime + 5), // 5 min buffer
    prerequisites: objective.prerequisites,
    adaptationTriggers: [
      'performance_drop',
      'time_exceeded',
      'mastery_plateau'
    ],
    nextStepConditions: [
      {
        type: 'mastery_achieved',
        threshold: objective.masteryThreshold,
        action: 'proceed'
      },
      {
        type: 'performance_threshold',
        threshold: 0.6,
        action: 'review'
      }
    ]
  }))
}

async function generateAdaptationPlan(
  optimizedSequence: any[],
  userProfile: UserProfile
): Promise<any> {
  
  return {
    adaptationStrategy: 'dynamic_progression',
    monitoringInterval: 10, // minutes
    adaptationTriggers: [
      {
        type: 'performance_drop',
        threshold: 0.5,
        action: 'difficulty_reduction'
      },
      {
        type: 'mastery_plateau',
        threshold: 3, // consecutive attempts
        action: 'approach_change'
      },
      {
        type: 'time_exceeded',
        threshold: 1.5, // 150% of estimated time
        action: 'break_suggestion'
      }
    ],
    adaptationOptions: [
      'difficulty_adjustment',
      'learning_style_switch',
      'additional_support',
      'content_substitution',
      'pacing_adjustment'
    ],
    fallbackStrategies: [
      'return_to_prerequisites',
      'simplify_objective',
      'provide_guided_practice',
      'schedule_review_session'
    ],
    successCriteria: optimizedSequence.map(item => ({
      sequenceNumber: item.sequenceNumber,
      criteria: [
        `Achieve ${Math.round(item.objective.masteryThreshold * 100)}% mastery`,
        'Complete within estimated time',
        'Demonstrate understanding in assessment'
      ]
    }))
  }
}

async function analyzeProgressData(pathId: string, currentProgress: any, performanceData: any[]): Promise<any> {
  const mockProgress = currentProgress || {
    completedObjectives: 2,
    totalObjectives: 5,
    currentSequence: 3,
    timeSpent: 120, // minutes
    averageSuccessRate: 0.75
  }
  
  const recentPerformance = performanceData.slice(-10) // Last 10 interactions
  const performanceTrend = calculatePerformanceTrend(recentPerformance)
  
  return {
    pathId,
    overallProgress: (mockProgress.completedObjectives / mockProgress.totalObjectives) * 100,
    currentPosition: {
      sequence: mockProgress.currentSequence,
      objective: `Objective ${mockProgress.currentSequence}`,
      estimatedCompletion: '15 minutes'
    },
    performanceMetrics: {
      successRate: mockProgress.averageSuccessRate,
      trend: performanceTrend,
      consistency: calculateConsistency(recentPerformance),
      learningVelocity: calculateLearningVelocity(recentPerformance)
    },
    timeMetrics: {
      totalTimeSpent: mockProgress.timeSpent,
      averageTimePerObjective: mockProgress.timeSpent / Math.max(mockProgress.completedObjectives, 1),
      estimatedTimeRemaining: (mockProgress.totalObjectives - mockProgress.completedObjectives) * 30
    },
    adaptationNeeded: mockProgress.averageSuccessRate < 0.6 || performanceTrend === 'declining',
    insights: generateProgressInsights(mockProgress, recentPerformance)
  }
}

async function generateNextStepRecommendations(progressAnalysis: any, userProfile: UserProfile): Promise<any[]> {
  const recommendations = []
  
  // Performance-based recommendations
  if (progressAnalysis.performanceMetrics.successRate < 0.6) {
    recommendations.push({
      type: 'performance_improvement',
      priority: 'high',
      action: 'Review previous material and practice fundamentals',
      reasoning: 'Success rate below optimal threshold',
      estimatedImpact: 'Medium',
      timeRequired: 15
    })
  }
  
  if (progressAnalysis.performanceMetrics.trend === 'declining') {
    recommendations.push({
      type: 'trend_reversal',
      priority: 'high',
      action: 'Take a break and return with fresh perspective',
      reasoning: 'Performance trend is declining',
      estimatedImpact: 'High',
      timeRequired: 10
    })
  }
  
  // Progression recommendations
  if (progressAnalysis.performanceMetrics.successRate > 0.8) {
    recommendations.push({
      type: 'acceleration',
      priority: 'medium',
      action: 'Consider advancing to more challenging content',
      reasoning: 'High success rate indicates readiness for progression',
      estimatedImpact: 'Medium',
      timeRequired: 0
    })
  }
  
  // Learning style recommendations
  recommendations.push({
    type: 'style_optimization',
    priority: 'low',
    action: `Focus on ${userProfile.learning_style_profile?.primary_style || 'visual'} learning approaches`,
    reasoning: 'Optimize for detected learning style preference',
    estimatedImpact: 'Medium',
    timeRequired: 0
  })
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

async function createPathAdaptation(
  pathId: string,
  triggers: string[],
  userProfile: UserProfile,
  performanceData: any[]
): Promise<any> {
  
  const adaptations = []
  
  triggers.forEach(trigger => {
    switch (trigger) {
      case 'performance_drop':
        adaptations.push({
          type: 'difficulty_reduction',
          description: 'Reduce content difficulty by one level',
          expectedImpact: 'Improved success rate and confidence',
          implementation: 'immediate',
          duration: '2 learning sessions'
        })
        break
        
      case 'time_exceeded':
        adaptations.push({
          type: 'pacing_adjustment',
          description: 'Extend time allowances and add progress checkpoints',
          expectedImpact: 'Reduced time pressure and better completion rates',
          implementation: 'next_session',
          duration: 'remainder_of_path'
        })
        break
        
      case 'mastery_plateau':
        adaptations.push({
          type: 'approach_change',
          description: 'Switch to alternative learning style or content format',
          expectedImpact: 'Break through learning plateau',
          implementation: 'immediate',
          duration: '1 learning session'
        })
        break
        
      case 'motivation_decline':
        adaptations.push({
          type: 'engagement_boost',
          description: 'Add gamification elements and achievement milestones',
          expectedImpact: 'Increased motivation and engagement',
          implementation: 'next_session',
          duration: 'remainder_of_path'
        })
        break
    }
  })
  
  return {
    pathId,
    triggeredBy: triggers,
    adaptations,
    implementationPlan: {
      immediateActions: adaptations.filter(a => a.implementation === 'immediate'),
      nextSessionActions: adaptations.filter(a => a.implementation === 'next_session'),
      monitoringPeriod: 20, // minutes
      successMetrics: [
        'Improved success rate above 70%',
        'Reduced time per objective',
        'Positive user feedback'
      ]
    },
    rollbackPlan: {
      criteria: 'If performance doesn\'t improve within 2 sessions',
      action: 'Return to previous successful configuration',
      alternatives: ['Provide additional support', 'Extend timeline', 'Simplify objectives']
    }
  }
}

// Utility functions
function getUserLevelScore(level?: string): number {
  switch (level) {
    case 'beginner': return 3
    case 'intermediate': return 6
    case 'advanced': return 8
    default: return 5
  }
}

function estimateSkillProficiency(userProfile: UserProfile, skill: string): number {
  const baseLevel = getUserLevelScore(userProfile.level) / 10
  return Math.max(0, Math.min(1, baseLevel + (Math.random() * 0.3 - 0.15)))
}

function identifyCriticalPath(objectives: LearningObjective[], prerequisiteMap: Record<string, string[]>): string[] {
  // Simplified critical path - just return the longest chain
  return objectives.sort((a, b) => b.prerequisites.length - a.prerequisites.length).slice(0, 3).map(obj => obj.id)
}

function calculatePerformanceTrend(performanceData: any[]): string {
  if (performanceData.length < 3) return 'stable'
  
  const recent = performanceData.slice(-3)
  const earlier = performanceData.slice(0, 3)
  
  const recentAvg = recent.reduce((sum, p) => sum + (p.success ? 1 : 0), 0) / recent.length
  const earlierAvg = earlier.reduce((sum, p) => sum + (p.success ? 1 : 0), 0) / earlier.length
  
  if (recentAvg > earlierAvg + 0.1) return 'improving'
  if (recentAvg < earlierAvg - 0.1) return 'declining'
  return 'stable'
}

function calculateConsistency(performanceData: any[]): number {
  if (performanceData.length === 0) return 0.5
  
  const scores = performanceData.map(p => p.success ? 1 : 0)
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
  
  return Math.max(0, 1 - variance)
}

function calculateLearningVelocity(performanceData: any[]): number {
  if (performanceData.length < 2) return 0.5
  
  const timeSpan = performanceData[performanceData.length - 1].timestamp - performanceData[0].timestamp
  const successRate = performanceData.filter(p => p.success).length / performanceData.length
  
  return Math.min(1, successRate * (1 + (1 / Math.max(timeSpan / 1000 / 60, 1)))) // Faster learning = higher velocity
}

function generateProgressInsights(progress: any, performanceData: any[]): string[] {
  const insights = []
  
  if (progress.averageSuccessRate > 0.8) {
    insights.push('Excellent performance! You\'re mastering the material quickly.')
  } else if (progress.averageSuccessRate > 0.6) {
    insights.push('Good progress. You\'re on track to meet your learning objectives.')
  } else {
    insights.push('Consider reviewing previous material or adjusting difficulty level.')
  }
  
  const trend = calculatePerformanceTrend(performanceData)
  if (trend === 'improving') {
    insights.push('Your performance is improving over time. Keep up the good work!')
  } else if (trend === 'declining') {
    insights.push('Performance has declined recently. Consider taking a break or reviewing fundamentals.')
  }
  
  if (progress.timeSpent > progress.totalObjectives * 45) {
    insights.push('You\'re taking time to thoroughly understand the material, which is great for retention.')
  }
  
  return insights
}

function calculateResponseConfidence(response: Partial<SequencingResponse>): number {
  // Calculate confidence based on available data and analysis quality
  let confidence = 0.7 // Base confidence
  
  if (response.sequencingRecommendation) {
    confidence = Math.max(confidence, response.sequencingRecommendation.confidence)
  }
  
  if (response.knowledgeGaps) {
    const avgGapConfidence = response.knowledgeGaps.reduce((sum, gap) => sum + gap.confidence, 0) / response.knowledgeGaps.length
    confidence = (confidence + avgGapConfidence) / 2
  }
  
  return Math.min(0.95, Math.max(0.5, confidence))
}

// Mock data generators
function generateMockObjectives(subject: string, count: number): LearningObjective[] {
  const objectives: LearningObjective[] = []
  
  for (let i = 1; i <= count; i++) {
    objectives.push({
      id: `objective_${i}`,
      title: `${subject} Objective ${i}`,
      description: `Learn key concepts and skills for ${subject} at level ${i}`,
      subject,
      difficulty: Math.min(10, 2 + i),
      estimatedTime: 20 + (i * 10),
      prerequisites: i > 1 ? [`objective_${i-1}`] : [],
      skills: [`${subject.toLowerCase()}_skill_${i}`, `analysis_skill_${i}`],
      conceptTags: [`concept_${i}`, `${subject.toLowerCase()}_fundamentals`],
      masteryThreshold: 0.75
    })
  }
  
  return objectives
}

function generateMockContent(subject: string, count: number): ContentItem[] {
  const contentTypes: ContentItem['content_type'][] = ['video', 'quiz', 'text', 'interactive', 'ai_lesson']
  const content: ContentItem[] = []
  
  for (let i = 1; i <= count; i++) {
    content.push({
      id: `content_${i}`,
      content_type: contentTypes[i % contentTypes.length],
      title: `${subject} Content ${i}`,
      description: `Educational content covering ${subject} concepts at difficulty level ${Math.ceil(i / 3)}`,
      subject,
      difficulty: Math.min(10, Math.ceil(i / 2)),
      estimated_time: 10 + (i * 3),
      created_at: new Date().toISOString(),
      metadata: {
        difficulty_level: Math.ceil(i / 2),
        concepts: [`concept_${i}`, `${subject.toLowerCase()}_topic_${i}`]
      }
    })
  }
  
  return content
}
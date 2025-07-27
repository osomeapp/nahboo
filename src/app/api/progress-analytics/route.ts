import { NextRequest, NextResponse } from 'next/server'
import { 
  objectiveTrackingEngine,
  type ObjectiveProgress,
  type ProgressInsights,
  type CompetencyMap,
  type RetentionAnalytics,
  type LearningVelocity,
  type EvidencePoint
} from '@/lib/objective-tracking-engine'
import type { UserProfile } from '@/types'
import type { LearningObjective } from '@/lib/intelligent-sequencing-engine'

export const maxDuration = 30

interface ProgressAnalyticsRequest {
  userId: string
  userProfile: UserProfile
  action: 'initialize_tracking' | 'record_activity' | 'get_progress' | 'get_insights' | 'get_competencies' | 'get_analytics'
  
  // For initialize tracking
  objective?: LearningObjective
  
  // For recording activity
  objectiveId?: string
  activityData?: {
    activityType: 'assessment' | 'practice' | 'review' | 'application'
    score?: number
    timeSpent: number
    contentId?: string
    skillsUsed?: string[]
    conceptsApplied?: string[]
    success: boolean
    evidence?: EvidencePoint[]
  }
  
  // For getting insights
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  
  // For specific analytics
  analyticsType?: 'retention' | 'velocity' | 'mastery' | 'competency'
}

interface ProgressAnalyticsResponse {
  success: boolean
  action: string
  
  // Initialize tracking results
  objectiveProgress?: ObjectiveProgress
  
  // Record activity results
  updatedProgress?: ObjectiveProgress
  masteryLevelChange?: number
  newAchievements?: string[]
  
  // Progress results
  allProgress?: ObjectiveProgress[]
  activeObjectives?: ObjectiveProgress[]
  completedObjectives?: ObjectiveProgress[]
  
  // Insights results
  progressInsights?: ProgressInsights
  
  // Competency results
  competencyMap?: CompetencyMap
  
  // Analytics results
  retentionAnalytics?: RetentionAnalytics[]
  velocityAnalytics?: LearningVelocity[]
  analyticsData?: any
  
  metadata: {
    userId: string
    processingTime: number
    dataPoints: number
    analyticsConfidence: number
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: ProgressAnalyticsRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    let response: Partial<ProgressAnalyticsResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'initialize_tracking':
        response = await handleInitializeTracking(body)
        break
        
      case 'record_activity':
        response = await handleRecordActivity(body)
        break
        
      case 'get_progress':
        response = await handleGetProgress(body)
        break
        
      case 'get_insights':
        response = await handleGetInsights(body)
        break
        
      case 'get_competencies':
        response = await handleGetCompetencies(body)
        break
        
      case 'get_analytics':
        response = await handleGetAnalytics(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: initialize_tracking, record_activity, get_progress, get_insights, get_competencies, or get_analytics' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    
    const finalResponse: ProgressAnalyticsResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        dataPoints: calculateDataPoints(response),
        analyticsConfidence: calculateAnalyticsConfidence(response),
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Progress analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to process progress analytics request' },
      { status: 500 }
    )
  }
}

// Handle objective tracking initialization
async function handleInitializeTracking(body: ProgressAnalyticsRequest): Promise<Partial<ProgressAnalyticsResponse>> {
  if (!body.objective) {
    throw new Error('Missing objective for tracking initialization')
  }

  const objectiveProgress = await objectiveTrackingEngine.initializeObjectiveTracking(
    body.userId,
    body.objective,
    body.userProfile
  )

  return {
    objectiveProgress
  }
}

// Handle learning activity recording
async function handleRecordActivity(body: ProgressAnalyticsRequest): Promise<Partial<ProgressAnalyticsResponse>> {
  if (!body.objectiveId || !body.activityData) {
    throw new Error('Missing objectiveId or activityData for recording activity')
  }

  const previousProgress = objectiveTrackingEngine.getObjectiveProgress(body.userId, body.objectiveId)
  const previousMastery = previousProgress?.currentMasteryLevel || 0

  const updatedProgress = await objectiveTrackingEngine.recordLearningActivity(
    body.userId,
    body.objectiveId,
    body.activityData.activityType,
    body.activityData
  )

  const masteryLevelChange = updatedProgress.currentMasteryLevel - previousMastery
  const newAchievements = await detectNewAchievements(previousProgress, updatedProgress)

  return {
    updatedProgress,
    masteryLevelChange,
    newAchievements
  }
}

// Handle progress retrieval
async function handleGetProgress(body: ProgressAnalyticsRequest): Promise<Partial<ProgressAnalyticsResponse>> {
  const allProgress = objectiveTrackingEngine.getUserObjectives(body.userId)
  const activeObjectives = allProgress.filter(p => p.isActive && !p.isCompleted)
  const completedObjectives = allProgress.filter(p => p.isCompleted)

  return {
    allProgress,
    activeObjectives,
    completedObjectives
  }
}

// Handle insights generation
async function handleGetInsights(body: ProgressAnalyticsRequest): Promise<Partial<ProgressAnalyticsResponse>> {
  const timeframe = body.timeframe || 'weekly'
  
  const progressInsights = await objectiveTrackingEngine.generateProgressInsights(
    body.userId,
    timeframe
  )

  return {
    progressInsights
  }
}

// Handle competency map retrieval
async function handleGetCompetencies(body: ProgressAnalyticsRequest): Promise<Partial<ProgressAnalyticsResponse>> {
  const competencyMap = objectiveTrackingEngine.getUserCompetencyMap(body.userId)

  // Generate mock competency map if none exists
  if (!competencyMap) {
    const mockCompetencyMap = await generateMockCompetencyMap(body.userId, body.userProfile)
    return { competencyMap: mockCompetencyMap }
  }

  return {
    competencyMap
  }
}

// Handle specific analytics retrieval
async function handleGetAnalytics(body: ProgressAnalyticsRequest): Promise<Partial<ProgressAnalyticsResponse>> {
  const analyticsType = body.analyticsType || 'mastery'
  const userObjectives = objectiveTrackingEngine.getUserObjectives(body.userId)

  let analyticsData: any = {}

  switch (analyticsType) {
    case 'retention':
      const retentionAnalytics = userObjectives.map(obj => 
        objectiveTrackingEngine.getRetentionAnalytics(body.userId, obj.objectiveId)
      ).filter(Boolean) as RetentionAnalytics[]
      
      // Generate mock retention data if none exists
      if (retentionAnalytics.length === 0) {
        analyticsData.retentionAnalytics = generateMockRetentionAnalytics(userObjectives)
      } else {
        analyticsData.retentionAnalytics = retentionAnalytics
      }
      break

    case 'velocity':
      const velocityAnalytics = userObjectives.map(obj => 
        objectiveTrackingEngine.getLearningVelocity(body.userId, obj.objectiveId)
      ).filter(Boolean) as LearningVelocity[]
      
      if (velocityAnalytics.length === 0) {
        analyticsData.velocityAnalytics = generateMockVelocityAnalytics(userObjectives)
      } else {
        analyticsData.velocityAnalytics = velocityAnalytics
      }
      break

    case 'mastery':
      analyticsData.masteryAnalytics = generateMasteryAnalytics(userObjectives)
      break

    case 'competency':
      const competencyMap = objectiveTrackingEngine.getUserCompetencyMap(body.userId)
      analyticsData.competencyAnalytics = competencyMap || generateMockCompetencyMap(body.userId, body.userProfile)
      break
  }

  return {
    analyticsData
  }
}

// Helper functions for data generation and analysis

async function detectNewAchievements(
  previousProgress: ObjectiveProgress | null,
  updatedProgress: ObjectiveProgress
): Promise<string[]> {
  const achievements: string[] = []

  if (!previousProgress) return achievements

  // Check for mastery milestones
  const masteryMilestones = [0.25, 0.5, 0.75, 0.9]
  for (const milestone of masteryMilestones) {
    if (previousProgress.currentMasteryLevel < milestone && updatedProgress.currentMasteryLevel >= milestone) {
      achievements.push(`${Math.round(milestone * 100)}% Mastery Achieved`)
    }
  }

  // Check for completion
  if (!previousProgress.isCompleted && updatedProgress.isCompleted) {
    achievements.push('Objective Completed!')
  }

  // Check for skill progressions
  Object.entries(updatedProgress.skillProgression).forEach(([skill, progress]) => {
    const previousSkillLevel = previousProgress.skillProgression[skill]?.currentLevel || 0
    if (previousSkillLevel < 0.5 && progress.currentLevel >= 0.5) {
      achievements.push(`${skill} Skill Developed`)
    }
  })

  return achievements
}

async function generateMockCompetencyMap(userId: string, userProfile: UserProfile): Promise<CompetencyMap> {
  const subject = userProfile.subject || 'General'
  
  return {
    userId,
    subject,
    competencies: [
      {
        competencyId: 'comp_foundational',
        name: `${subject} Fundamentals`,
        description: `Core understanding of ${subject} principles`,
        level: 2,
        mastery: 0.7,
        relatedObjectives: [],
        prerequisiteCompetencies: [],
        evidenceCount: 5,
        lastDemonstrated: new Date(),
        certificationLevel: 'proficient'
      },
      {
        competencyId: 'comp_application',
        name: `${subject} Application`,
        description: `Ability to apply ${subject} knowledge`,
        level: 3,
        mastery: 0.5,
        relatedObjectives: [],
        prerequisiteCompetencies: ['comp_foundational'],
        evidenceCount: 3,
        lastDemonstrated: new Date(),
        certificationLevel: 'developing'
      }
    ],
    skillHierarchy: {
      foundational: [
        {
          skillId: 'skill_basic',
          name: `Basic ${subject}`,
          category: 'foundational',
          level: 1,
          mastery: 0.8,
          prerequisites: [],
          dependents: ['skill_intermediate']
        }
      ],
      intermediate: [
        {
          skillId: 'skill_intermediate',
          name: `Intermediate ${subject}`,
          category: 'intermediate',
          level: 2,
          mastery: 0.6,
          prerequisites: ['skill_basic'],
          dependents: ['skill_advanced']
        }
      ],
      advanced: [
        {
          skillId: 'skill_advanced',
          name: `Advanced ${subject}`,
          category: 'advanced',
          level: 3,
          mastery: 0.3,
          prerequisites: ['skill_intermediate'],
          dependents: []
        }
      ],
      expert: []
    },
    progressPaths: [
      {
        pathId: 'path_mastery',
        name: `${subject} Mastery Path`,
        description: `Complete mastery of ${subject} skills`,
        competencies: ['comp_foundational', 'comp_application'],
        currentPosition: 1,
        estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        milestones: [
          {
            milestoneId: 'milestone_1',
            name: 'Foundation Complete',
            description: 'Master foundational concepts',
            targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            completionCriteria: ['80% mastery in fundamentals'],
            isCompleted: false
          }
        ]
      }
    ],
    overallCompetency: 0.6,
    lastUpdated: new Date()
  }
}

function generateMockRetentionAnalytics(objectives: ObjectiveProgress[]): RetentionAnalytics[] {
  return objectives.map(obj => ({
    objectiveId: obj.objectiveId,
    shortTermRetention: Math.random() * 0.3 + 0.7, // 70-100%
    mediumTermRetention: Math.random() * 0.4 + 0.5, // 50-90%
    longTermRetention: Math.random() * 0.5 + 0.3, // 30-80%
    forgettingCurve: [
      { timeFromInitialLearning: 1, retentionLevel: 0.9, dataSource: 'assessment' },
      { timeFromInitialLearning: 24, retentionLevel: 0.7, dataSource: 'review' },
      { timeFromInitialLearning: 168, retentionLevel: 0.5, dataSource: 'assessment' },
      { timeFromInitialLearning: 720, retentionLevel: 0.4, dataSource: 'application' }
    ],
    strengthFactors: ['Regular practice', 'Real-world application'],
    weaknessFactors: ['Infrequent review', 'Abstract concepts'],
    optimalReviewSchedule: [
      {
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        reviewType: 'light_review',
        priority: 'medium',
        estimatedDuration: 10
      },
      {
        scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        reviewType: 'practice',
        priority: 'high',
        estimatedDuration: 20
      }
    ]
  }))
}

function generateMockVelocityAnalytics(objectives: ObjectiveProgress[]): LearningVelocity[] {
  return objectives.map(obj => ({
    objectiveId: obj.objectiveId,
    overallVelocity: Math.random() * 2 + 0.5, // 0.5-2.5 objectives per hour
    masteryVelocity: Math.random() * 5 + 2, // 2-7 mastery points per hour
    skillVelocity: {
      'primary_skill': Math.random() * 3 + 1,
      'secondary_skill': Math.random() * 2 + 0.5
    },
    conceptVelocity: {
      'main_concept': Math.random() * 4 + 1,
      'supporting_concept': Math.random() * 2 + 0.5
    },
    trend: ['accelerating', 'stable', 'decelerating'][Math.floor(Math.random() * 3)] as any,
    factors: [
      {
        factor: 'Learning style match',
        impact: 0.3,
        confidence: 0.8,
        description: 'Content matches preferred learning style'
      },
      {
        factor: 'Prior knowledge',
        impact: 0.2,
        confidence: 0.9,
        description: 'Strong foundation in prerequisite concepts'
      }
    ]
  }))
}

function generateMasteryAnalytics(objectives: ObjectiveProgress[]): any {
  return {
    overallMasteryDistribution: {
      'novice': objectives.filter(obj => obj.currentMasteryLevel < 0.3).length,
      'developing': objectives.filter(obj => obj.currentMasteryLevel >= 0.3 && obj.currentMasteryLevel < 0.6).length,
      'proficient': objectives.filter(obj => obj.currentMasteryLevel >= 0.6 && obj.currentMasteryLevel < 0.8).length,
      'advanced': objectives.filter(obj => obj.currentMasteryLevel >= 0.8).length
    },
    masteryProgression: objectives.map(obj => ({
      objectiveId: obj.objectiveId,
      currentLevel: obj.currentMasteryLevel,
      targetLevel: obj.targetMasteryLevel,
      progressRate: obj.masteryHistory.length > 1 ? 
        (obj.currentMasteryLevel - obj.masteryHistory[0].masteryLevel) / obj.masteryHistory.length : 0,
      timeToTarget: obj.targetMasteryLevel > obj.currentMasteryLevel ? 
        Math.ceil((obj.targetMasteryLevel - obj.currentMasteryLevel) * 10) : 0 // Estimated hours
    })),
    skillMasteryBreakdown: objectives.reduce((acc, obj) => {
      Object.entries(obj.skillProgression).forEach(([skill, progress]) => {
        if (!acc[skill]) {
          acc[skill] = { totalLearners: 0, averageMastery: 0, masterySum: 0 }
        }
        acc[skill].totalLearners += 1
        acc[skill].masterySum += progress.currentLevel
        acc[skill].averageMastery = acc[skill].masterySum / acc[skill].totalLearners
      })
      return acc
    }, {} as Record<string, any>)
  }
}

function calculateDataPoints(response: Partial<ProgressAnalyticsResponse>): number {
  let points = 0
  
  if (response.objectiveProgress) points += 1
  if (response.allProgress) points += response.allProgress.length
  if (response.progressInsights) points += 10 // Insights contain many data points
  if (response.competencyMap) points += response.competencyMap.competencies.length
  if (response.analyticsData) points += Object.keys(response.analyticsData).length
  
  return points
}

function calculateAnalyticsConfidence(response: Partial<ProgressAnalyticsResponse>): number {
  let confidence = 0.7 // Base confidence
  
  // Higher confidence with more data points
  const dataPoints = calculateDataPoints(response)
  confidence += Math.min(0.2, dataPoints * 0.02)
  
  // Higher confidence with recent activity
  if (response.allProgress && response.allProgress.length > 0) {
    const recentActivity = response.allProgress.some(p => 
      new Date().getTime() - p.lastActivity.getTime() < 24 * 60 * 60 * 1000
    )
    if (recentActivity) confidence += 0.1
  }
  
  return Math.min(0.95, Math.max(0.5, confidence))
}
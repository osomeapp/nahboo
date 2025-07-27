import { NextRequest, NextResponse } from 'next/server'
import { 
  masteryProgressionEngine,
  type UserMasteryProfile,
  type SkillTree,
  type MasteryAssessment,
  type Achievement,
  type ProgressionRecommendation,
  type UnlockBenefit
} from '@/lib/mastery-progression-engine'
import type { UserProfile } from '@/types'

export const maxDuration = 30

interface MasteryProgressionAPIRequest {
  userId: string
  userProfile: UserProfile
  action: 'initialize_profile' | 'assess_skill' | 'get_skill_tree' | 'get_recommendations' | 'get_achievements' | 'create_assessment' | 'get_adaptive_threshold'
  
  // For initialize_profile
  selectedSubjects?: string[]
  
  // For assess_skill
  skillId?: string
  evidence?: any[]
  assessmentType?: string
  
  // For get_skill_tree
  subject?: string
  
  // For get_recommendations
  count?: number
  
  // For create_assessment
  assessmentTypeToCreate?: 'knowledge_check' | 'application_task' | 'creative_project' | 'peer_teaching' | 'real_world_challenge'
}

interface MasteryProgressionAPIResponse {
  success: boolean
  action: string
  
  // Initialize profile results
  masteryProfile?: UserMasteryProfile
  
  // Assess skill results
  newMasteryLevel?: number
  achievements?: Achievement[]
  unlocks?: UnlockBenefit[]
  
  // Skill tree results
  skillTree?: SkillTree
  
  // Recommendations results
  recommendations?: ProgressionRecommendation[]
  
  // Achievements results
  availableAchievements?: Achievement[]
  userAchievements?: Achievement[]
  
  // Assessment results
  assessment?: MasteryAssessment
  
  // Adaptive threshold results
  adaptiveThreshold?: number
  
  metadata: {
    userId: string
    processingTime: number
    skillsTracked: number
    masteryLevel: number
    generatedAt: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    const body: MasteryProgressionAPIRequest = await request.json()

    if (!body.userId || !body.userProfile || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userProfile, action' },
        { status: 400 }
      )
    }

    let response: Partial<MasteryProgressionAPIResponse> = {
      success: true,
      action: body.action
    }

    switch (body.action) {
      case 'initialize_profile':
        response = await handleInitializeProfile(body)
        break
        
      case 'assess_skill':
        response = await handleAssessSkill(body)
        break
        
      case 'get_skill_tree':
        response = await handleGetSkillTree(body)
        break
        
      case 'get_recommendations':
        response = await handleGetRecommendations(body)
        break
        
      case 'get_achievements':
        response = await handleGetAchievements(body)
        break
        
      case 'create_assessment':
        response = await handleCreateAssessment(body)
        break
        
      case 'get_adaptive_threshold':
        response = await handleGetAdaptiveThreshold(body)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be: initialize_profile, assess_skill, get_skill_tree, get_recommendations, get_achievements, create_assessment, or get_adaptive_threshold' },
          { status: 400 }
        )
    }

    const processingTime = Date.now() - startTime
    const userProfile = masteryProgressionEngine.getUserMasteryProfile(body.userId)
    
    const finalResponse: MasteryProgressionAPIResponse = {
      ...response,
      success: true,
      action: body.action,
      metadata: {
        userId: body.userId,
        processingTime,
        skillsTracked: userProfile?.skillTrees.reduce((sum, tree) => sum + tree.totalSkills, 0) || 0,
        masteryLevel: userProfile?.overallMasteryLevel || 0,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error('Mastery progression API error:', error)
    return NextResponse.json(
      { error: 'Failed to process mastery progression request' },
      { status: 500 }
    )
  }
}

// Handle mastery profile initialization
async function handleInitializeProfile(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  const masteryProfile = await masteryProgressionEngine.initializeMasteryProfile(
    body.userId,
    body.userProfile,
    body.selectedSubjects
  )

  return {
    masteryProfile
  }
}

// Handle skill mastery assessment
async function handleAssessSkill(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  if (!body.skillId || !body.evidence || !body.assessmentType) {
    throw new Error('Missing skillId, evidence, or assessmentType for skill assessment')
  }

  const result = await masteryProgressionEngine.assessSkillMastery(
    body.userId,
    body.skillId,
    body.evidence,
    body.assessmentType
  )

  return {
    newMasteryLevel: result.newMasteryLevel,
    achievements: result.achievements,
    unlocks: result.unlocks
  }
}

// Handle skill tree retrieval
async function handleGetSkillTree(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  if (!body.subject) {
    throw new Error('Missing subject for skill tree retrieval')
  }

  const skillTree = masteryProgressionEngine.getSkillTree(body.userId, body.subject)
  
  if (!skillTree) {
    // Generate a mock skill tree if none exists
    const mockSkillTree = await generateMockSkillTree(body.userId, body.subject, body.userProfile)
    return { skillTree: mockSkillTree }
  }

  return {
    skillTree
  }
}

// Handle progression recommendations
async function handleGetRecommendations(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  const recommendations = await masteryProgressionEngine.generateProgressionRecommendations(
    body.userId,
    body.count || 5
  )

  // Generate mock recommendations if none exist
  if (recommendations.length === 0) {
    const mockRecommendations = generateMockRecommendations(body.userId, body.userProfile)
    return { recommendations: mockRecommendations }
  }

  return {
    recommendations
  }
}

// Handle achievements retrieval
async function handleGetAchievements(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  const availableAchievements = masteryProgressionEngine.getAvailableAchievements(body.userId)
  const userProfile = masteryProgressionEngine.getUserMasteryProfile(body.userId)
  
  // Generate mock achievements if none exist
  if (availableAchievements.length === 0) {
    const mockAchievements = generateMockAchievements()
    return { 
      availableAchievements: mockAchievements,
      userAchievements: userProfile?.achievements || []
    }
  }

  return {
    availableAchievements,
    userAchievements: userProfile?.achievements || []
  }
}

// Handle assessment creation
async function handleCreateAssessment(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  if (!body.skillId || !body.assessmentTypeToCreate) {
    throw new Error('Missing skillId or assessmentType for assessment creation')
  }

  const assessment = await masteryProgressionEngine.createMasteryAssessment(
    body.skillId,
    body.userProfile,
    body.assessmentTypeToCreate
  )

  return {
    assessment
  }
}

// Handle adaptive threshold calculation
async function handleGetAdaptiveThreshold(body: MasteryProgressionAPIRequest): Promise<Partial<MasteryProgressionAPIResponse>> {
  if (!body.skillId) {
    throw new Error('Missing skillId for adaptive threshold calculation')
  }

  const adaptiveThreshold = await masteryProgressionEngine.getAdaptiveMasteryThreshold(
    body.userId,
    body.skillId
  )

  return {
    adaptiveThreshold
  }
}

// Generate mock skill tree for testing
async function generateMockSkillTree(userId: string, subject: string, userProfile: UserProfile): Promise<SkillTree> {
  const mockSkillNodes = [
    {
      skillId: `${subject.toLowerCase()}_basics`,
      name: `${subject} Basics`,
      description: `Fundamental concepts and principles of ${subject}`,
      category: 'foundational',
      subjectArea: subject,
      difficulty: 2,
      prerequisites: [],
      dependents: [`${subject.toLowerCase()}_intermediate`],
      masteryThreshold: {
        thresholdId: `threshold_${subject.toLowerCase()}_basics`,
        skillId: `${subject.toLowerCase()}_basics`,
        subjectArea: subject,
        level: 2,
        requiredScore: 0.75,
        evidenceTypes: [
          {
            type: 'assessment' as const,
            weight: 0.5,
            requiredCount: 2,
            qualityThreshold: 0.7,
            description: 'Complete basic assessments'
          },
          {
            type: 'problem_solving' as const,
            weight: 0.5,
            requiredCount: 3,
            qualityThreshold: 0.6,
            description: 'Solve basic problems'
          }
        ],
        minimumAttempts: 2,
        timeRequirement: 120,
        prerequisiteSkills: [],
        unlocksBenefits: [
          {
            benefitType: 'skill_unlock' as const,
            benefitId: `${subject.toLowerCase()}_intermediate`,
            title: 'Intermediate Skills Unlocked',
            description: `Access to intermediate ${subject} concepts`,
            value: { skillIds: [`${subject.toLowerCase()}_intermediate`] }
          }
        ],
        adaptiveFactors: [
          {
            factorType: 'learning_velocity' as const,
            adjustmentRange: { min: -0.1, max: 0.1 },
            weight: 0.3,
            description: 'Adjust based on learning speed'
          }
        ]
      },
      currentMastery: Math.random() * 0.5 + 0.2, // 20-70% mastery
      isUnlocked: true,
      isCompleted: false,
      estimatedTimeToMaster: 4,
      learningResources: [],
      assessments: [],
      realWorldApplications: [`Real-world ${subject} applications`],
      position: { x: 100, y: 100 }
    },
    {
      skillId: `${subject.toLowerCase()}_intermediate`,
      name: `${subject} Intermediate`,
      description: `Intermediate concepts and applications of ${subject}`,
      category: 'intermediate',
      subjectArea: subject,
      difficulty: 5,
      prerequisites: [`${subject.toLowerCase()}_basics`],
      dependents: [`${subject.toLowerCase()}_advanced`],
      masteryThreshold: {
        thresholdId: `threshold_${subject.toLowerCase()}_intermediate`,
        skillId: `${subject.toLowerCase()}_intermediate`,
        subjectArea: subject,
        level: 5,
        requiredScore: 0.8,
        evidenceTypes: [
          {
            type: 'assessment' as const,
            weight: 0.4,
            requiredCount: 3,
            qualityThreshold: 0.75,
            description: 'Complete intermediate assessments'
          },
          {
            type: 'application_task' as const,
            weight: 0.6,
            requiredCount: 2,
            qualityThreshold: 0.7,
            description: 'Complete practical applications'
          }
        ],
        minimumAttempts: 3,
        timeRequirement: 240,
        prerequisiteSkills: [`${subject.toLowerCase()}_basics`],
        unlocksBenefits: [
          {
            benefitType: 'skill_unlock' as const,
            benefitId: `${subject.toLowerCase()}_advanced`,
            title: 'Advanced Skills Unlocked',
            description: `Access to advanced ${subject} concepts`,
            value: { skillIds: [`${subject.toLowerCase()}_advanced`] }
          }
        ],
        adaptiveFactors: [
          {
            factorType: 'confidence_level' as const,
            adjustmentRange: { min: -0.05, max: 0.15 },
            weight: 0.4,
            description: 'Adjust based on confidence'
          }
        ]
      },
      currentMastery: Math.random() * 0.3 + 0.1, // 10-40% mastery
      isUnlocked: Math.random() > 0.5,
      isCompleted: false,
      estimatedTimeToMaster: 8,
      learningResources: [],
      assessments: [],
      realWorldApplications: [`Professional ${subject} applications`],
      position: { x: 300, y: 100 }
    },
    {
      skillId: `${subject.toLowerCase()}_advanced`,
      name: `${subject} Advanced`,
      description: `Advanced mastery and expert-level ${subject} skills`,
      category: 'advanced',
      subjectArea: subject,
      difficulty: 8,
      prerequisites: [`${subject.toLowerCase()}_intermediate`],
      dependents: [],
      masteryThreshold: {
        thresholdId: `threshold_${subject.toLowerCase()}_advanced`,
        skillId: `${subject.toLowerCase()}_advanced`,
        subjectArea: subject,
        level: 8,
        requiredScore: 0.85,
        evidenceTypes: [
          {
            type: 'creative_work' as const,
            weight: 0.4,
            requiredCount: 1,
            qualityThreshold: 0.8,
            description: 'Create original work'
          },
          {
            type: 'peer_teaching' as const,
            weight: 0.3,
            requiredCount: 1,
            qualityThreshold: 0.75,
            description: 'Teach others effectively'
          },
          {
            type: 'real_world_application' as const,
            weight: 0.3,
            requiredCount: 1,
            qualityThreshold: 0.8,
            description: 'Apply in real situations'
          }
        ],
        minimumAttempts: 4,
        timeRequirement: 480,
        prerequisiteSkills: [`${subject.toLowerCase()}_intermediate`],
        unlocksBenefits: [
          {
            benefitType: 'achievement_badge' as const,
            benefitId: `${subject.toLowerCase()}_master`,
            title: `${subject} Master`,
            description: `Achieved mastery in ${subject}`,
            value: { badge: 'master', subject }
          }
        ],
        adaptiveFactors: [
          {
            factorType: 'peer_comparison' as const,
            adjustmentRange: { min: -0.05, max: 0.1 },
            weight: 0.2,
            description: 'Adjust based on peer performance'
          }
        ]
      },
      currentMastery: Math.random() * 0.2, // 0-20% mastery
      isUnlocked: false,
      isCompleted: false,
      estimatedTimeToMaster: 16,
      learningResources: [],
      assessments: [],
      realWorldApplications: [`Expert-level ${subject} applications`],
      position: { x: 500, y: 100 }
    }
  ]

  const skillTree: SkillTree = {
    treeId: `tree_${userId}_${subject}`,
    userId,
    subjectArea: subject,
    totalSkills: mockSkillNodes.length,
    completedSkills: mockSkillNodes.filter(node => node.isCompleted).length,
    unlockedSkills: mockSkillNodes.filter(node => node.isUnlocked).length,
    skillNodes: mockSkillNodes,
    learningPaths: [
      {
        pathId: `${subject.toLowerCase()}_mastery_path`,
        name: `${subject} Mastery Path`,
        description: `Complete mastery journey through ${subject}`,
        difficulty: 'intermediate' as const,
        skillSequence: mockSkillNodes.map(node => node.skillId),
        estimatedDuration: mockSkillNodes.reduce((sum, node) => sum + node.estimatedTimeToMaster, 0),
        prerequisites: [],
        outcomes: [`Master all aspects of ${subject}`, 'Apply knowledge professionally'],
        isRecommended: true,
        popularity: 0.85,
        successRate: 0.78
      }
    ],
    currentFocus: [mockSkillNodes[0].skillId],
    nextRecommendations: [mockSkillNodes[1].skillId],
    lastUpdated: new Date()
  }

  return skillTree
}

// Generate mock recommendations
function generateMockRecommendations(userId: string, userProfile: UserProfile): ProgressionRecommendation[] {
  const subject = userProfile.subject || 'General'
  
  return [
    {
      recommendationId: `rec_${Date.now()}_1`,
      userId,
      recommendationType: 'skill_focus',
      priority: 'high',
      skillId: `${subject.toLowerCase()}_basics`,
      title: `Focus on ${subject} Fundamentals`,
      description: `You're ready to master the core concepts of ${subject}. This will unlock intermediate skills.`,
      reasoning: `Based on your progress and learning style, focusing on fundamentals will provide the strongest foundation for advancement.`,
      confidence: 0.87,
      estimatedImpact: 0.75,
      timeToComplete: 4,
      prerequisites: [],
      resources: ['video_basics', 'quiz_fundamentals'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    },
    {
      recommendationId: `rec_${Date.now()}_2`,
      userId,
      recommendationType: 'assessment_ready',
      priority: 'medium',
      skillId: `${subject.toLowerCase()}_basics`,
      title: `Ready for ${subject} Assessment`,
      description: `Your practice shows you're ready to demonstrate mastery through assessment.`,
      reasoning: `Your recent practice sessions indicate strong understanding. An assessment would confirm your mastery.`,
      confidence: 0.72,
      estimatedImpact: 0.65,
      timeToComplete: 1,
      prerequisites: [],
      resources: ['assessment_basics'],
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
    },
    {
      recommendationId: `rec_${Date.now()}_3`,
      userId,
      recommendationType: 'achievement_opportunity',
      priority: 'low',
      skillId: `${subject.toLowerCase()}_basics`,
      title: 'Achievement Opportunity: Consistent Learner',
      description: `Continue your learning streak to earn the "Consistent Learner" badge.`,
      reasoning: `You've been learning consistently. A few more days will earn you a meaningful achievement.`,
      confidence: 0.95,
      estimatedImpact: 0.3,
      timeToComplete: 0.5,
      prerequisites: [],
      resources: [],
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
    }
  ]
}

// Generate mock achievements
function generateMockAchievements(): Achievement[] {
  return [
    {
      achievementId: 'first_mastery',
      title: 'First Steps',
      description: 'Master your first skill',
      category: 'mastery',
      rarity: 'common',
      badgeIcon: '🌟',
      badgeColor: '#FFD700',
      criteria: {
        type: 'skill_mastery',
        requirements: { skillCount: 1 },
        description: 'Complete mastery of any skill'
      },
      progress: 0.6, // 60% progress
      isVisible: true
    },
    {
      achievementId: 'speed_learner',
      title: 'Speed Learner',
      description: 'Master a skill in record time',
      category: 'progress',
      rarity: 'uncommon',
      badgeIcon: '⚡',
      badgeColor: '#FF6B35',
      criteria: {
        type: 'speed',
        requirements: { timeLimit: 3600 },
        timeLimit: 3600,
        description: 'Master a skill within 1 hour'
      },
      progress: 0,
      isVisible: true
    },
    {
      achievementId: 'creative_thinker',
      title: 'Creative Thinker',
      description: 'Demonstrate creativity in your learning',
      category: 'creativity',
      rarity: 'rare',
      badgeIcon: '🎨',
      badgeColor: '#9B59B6',
      criteria: {
        type: 'creativity',
        requirements: { creativeSubmissions: 3 },
        description: 'Submit 3 creative works or solutions'
      },
      progress: 0.33, // 1 out of 3
      isVisible: true
    }
  ]
}
// Offline Learning Path System
// No database dependencies - works with mock data for testing and fallback

export interface OfflineLearningPath {
  id: string
  user_id: string
  title: string
  description: string
  subject: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  goals: string[]
  estimated_hours: number
  objectives: string[]
  confidence_score: number
  personalization_factors: string[]
  created_at: string
}

// Simple learning path generator with no external dependencies
export async function generateOfflineLearningPath(
  userId: string,
  subject: string,
  goals: string[],
  timeframeDays: number = 30,
  currentLevel?: 'beginner' | 'intermediate' | 'advanced'
): Promise<OfflineLearningPath> {
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100))
  
  const pathId = `path_${userId}_${Date.now()}`
  const difficultyLevel = currentLevel || 'beginner'
  const estimatedHours = Math.max(10, Math.min(50, timeframeDays * 1.5))
  
  const objectives = generateObjectives(goals, subject, difficultyLevel)
  
  return {
    id: pathId,
    user_id: userId,
    title: generatePathTitle(subject, goals),
    description: generatePathDescription(subject, goals, estimatedHours),
    subject,
    difficulty_level: difficultyLevel,
    goals,
    estimated_hours: Math.round(estimatedHours),
    objectives,
    confidence_score: 0.85, // Good confidence for offline generation
    personalization_factors: ['basic_profile', 'subject_preference', 'difficulty_matching'],
    created_at: new Date().toISOString()
  }
}

// Generate learning objectives based on subject and goals
function generateObjectives(goals: string[], subject: string, difficulty: string): string[] {
  const baseObjectives = [
    `Master fundamental ${subject} concepts`,
    `Apply ${subject} principles to solve problems`,
    `Build confidence through practice and assessment`
  ]
  
  // Add goal-specific objectives
  const goalObjectives = goals.map(goal => `Achieve proficiency in ${goal.toLowerCase()}`)
  
  // Add difficulty-specific objectives
  const difficultyObjectives = {
    beginner: [`Build strong foundation in ${subject} basics`, `Understand core terminology and concepts`],
    intermediate: [`Develop advanced ${subject} problem-solving skills`, `Apply concepts to real-world scenarios`],
    advanced: [`Master complex ${subject} concepts and applications`, `Demonstrate expertise through advanced projects`]
  }
  
  return [
    ...baseObjectives,
    ...goalObjectives.slice(0, 2), // Limit to first 2 goals
    ...difficultyObjectives[difficulty as keyof typeof difficultyObjectives]
  ].slice(0, 6) // Limit total objectives
}

// Generate path title
function generatePathTitle(subject: string, goals: string[]): string {
  const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1)
  const primaryGoal = goals[0] || 'Mastery'
  
  return `${capitalizedSubject} Learning Path: ${primaryGoal}`
}

// Generate path description
function generatePathDescription(subject: string, goals: string[], hours: number): string {
  return `A personalized ${hours}-hour learning journey designed to help you master ${subject}. This path will guide you through ${goals.join(', ')} with structured content and clear milestones.`
}

// Get mock existing paths for a user
export async function getOfflineUserLearningPaths(
  userId: string,
  status?: 'active' | 'completed' | 'paused'
): Promise<OfflineLearningPath[]> {
  
  // Simulate loading time
  await new Promise(resolve => setTimeout(resolve, 200))
  
  const mockPaths: OfflineLearningPath[] = [
    {
      id: `path_${userId}_mathematics`,
      user_id: userId,
      title: 'Mathematics Foundations',
      description: 'Build strong mathematical foundations with structured learning',
      subject: 'mathematics',
      difficulty_level: 'intermediate',
      goals: ['Algebra mastery', 'Geometry understanding'],
      estimated_hours: 25,
      objectives: [
        'Master linear equations and inequalities',
        'Understand geometric shapes and properties',
        'Apply mathematical reasoning to solve problems',
        'Achieve proficiency in algebra mastery',
        'Achieve proficiency in geometry understanding',
        'Develop advanced mathematics problem-solving skills'
      ],
      confidence_score: 0.85,
      personalization_factors: ['basic_profile', 'subject_preference', 'difficulty_matching'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `path_${userId}_science`,
      user_id: userId,
      title: 'Science Exploration Path',
      description: 'A comprehensive science learning journey covering key concepts',
      subject: 'science',
      difficulty_level: 'beginner',
      goals: ['Physics basics', 'Chemistry fundamentals'],
      estimated_hours: 20,
      objectives: [
        'Master fundamental science concepts',
        'Apply science principles to solve problems',
        'Build confidence through practice and assessment',
        'Achieve proficiency in physics basics',
        'Achieve proficiency in chemistry fundamentals',
        'Build strong foundation in science basics'
      ],
      confidence_score: 0.78,
      personalization_factors: ['basic_profile', 'subject_preference', 'difficulty_matching'],
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
  
  if (status) {
    // For demo purposes, assume first path is active, second is completed
    if (status === 'active') {
      return [mockPaths[0]]
    } else if (status === 'completed') {
      return [mockPaths[1]]
    } else {
      return []
    }
  }
  
  return mockPaths
}

// Offline progress tracking
export interface OfflineProgress {
  path_id: string
  user_id: string
  overall_percentage: number
  completed_objectives: number
  total_objectives: number
  current_objective: string | null
  last_activity: string
}

export async function getOfflineProgress(pathId: string, userId: string): Promise<OfflineProgress> {
  // Simulate loading time
  await new Promise(resolve => setTimeout(resolve, 150))
  
  // Mock progress data
  return {
    path_id: pathId,
    user_id: userId,
    overall_percentage: Math.floor(Math.random() * 80) + 10, // 10-90%
    completed_objectives: Math.floor(Math.random() * 4) + 1, // 1-5
    total_objectives: 6,
    current_objective: 'Master linear equations and inequalities',
    last_activity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
  }
}

// Simple recommendation system without dependencies
export async function generateOfflineRecommendations(
  userId: string,
  subject?: string
): Promise<OfflineLearningPath[]> {
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const subjects = subject ? [subject] : ['mathematics', 'science', 'programming', 'language_arts']
  const recommendations: OfflineLearningPath[] = []
  
  for (const subj of subjects.slice(0, 3)) {
    const recommendation = await generateOfflineLearningPath(
      userId,
      subj,
      [`${subj} mastery`, `Advanced ${subj} skills`],
      30,
      'intermediate'
    )
    recommendations.push(recommendation)
  }
  
  return recommendations
}
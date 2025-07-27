// Simplified Learning Path System
// Reliable implementation with proper error handling and fallbacks

import { supabaseAdmin } from './supabase'

export interface SimpleLearningPath {
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

export interface UserAnalyticsSummary {
  user_id: string
  learning_velocity: number
  preferred_content_types: Record<string, number>
  subject_performance: Record<string, number>
  engagement_level: 'low' | 'medium' | 'high'
  difficulty_preference: 'beginner' | 'intermediate' | 'advanced'
}

// Simple learning path generator with fallbacks
export async function generateSimpleLearningPath(
  userId: string,
  subject: string,
  goals: string[],
  timeframeDays: number = 30,
  currentLevel?: 'beginner' | 'intermediate' | 'advanced'
): Promise<SimpleLearningPath> {
  
  try {
    // Try to get user analytics with timeout
    const userAnalytics = await getUserAnalyticsSummary(userId)
    
    // Generate path based on analytics
    return createPersonalizedPath(userId, subject, goals, timeframeDays, currentLevel, userAnalytics)
    
  } catch (error) {
    console.error('Analytics fetch failed, using fallback:', error)
    
    // Fallback to basic path generation
    return createFallbackPath(userId, subject, goals, timeframeDays, currentLevel)
  }
}

// Get user analytics with proper error handling
async function getUserAnalyticsSummary(userId: string): Promise<UserAnalyticsSummary> {
  const timeout = 5000 // 5 second timeout
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Analytics fetch timeout')), timeout)
  )
  
  const analyticsPromise = async () => {
    try {
      // Try to get engagement metrics
      const { data: engagement, error: engagementError } = await supabaseAdmin
        .from('user_engagement_metrics')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (engagementError && engagementError.code !== 'PGRST116') {
        throw engagementError
      }
      
      // Try to get recent quiz performance
      const { data: quizData } = await supabaseAdmin
        .from('analytics_events')
        .select('properties, learning_context')
        .eq('user_id', userId)
        .eq('event_type', 'quiz_attempt')
        .order('timestamp', { ascending: false })
        .limit(10)
      
      // Try to get content interactions
      const { data: contentData } = await supabaseAdmin
        .from('analytics_events')
        .select('properties')
        .eq('user_id', userId)
        .eq('event_type', 'content_interaction')
        .order('timestamp', { ascending: false })
        .limit(20)
      
      // Process the data safely
      const contentPreferences = processContentPreferences(contentData || [])
      const subjectPerformance = processSubjectPerformance(quizData || [])
      const learningVelocity = calculateVelocity(engagement)
      const engagementLevel = calculateEngagementLevel(engagement)
      const difficultyPreference = determineDifficultyPreference(subjectPerformance)
      
      return {
        user_id: userId,
        learning_velocity: learningVelocity,
        preferred_content_types: contentPreferences,
        subject_performance: subjectPerformance,
        engagement_level: engagementLevel,
        difficulty_preference: difficultyPreference
      }
      
    } catch (error) {
      console.error('Database query failed:', error)
      throw error
    }
  }
  
  // Race between analytics fetch and timeout
  return Promise.race([analyticsPromise(), timeoutPromise]) as Promise<UserAnalyticsSummary>
}

// Process content preferences safely
function processContentPreferences(contentData: any[]): Record<string, number> {
  const preferences: Record<string, number> = {
    video: 25,
    text: 25,
    quiz: 25,
    ai_lesson: 25
  }
  
  if (contentData.length === 0) return preferences
  
  const typeCounts: Record<string, number> = {}
  let total = 0
  
  contentData.forEach(item => {
    const contentType = item.properties?.content_type
    if (contentType) {
      typeCounts[contentType] = (typeCounts[contentType] || 0) + 1
      total++
    }
  })
  
  if (total > 0) {
    Object.keys(typeCounts).forEach(type => {
      preferences[type] = Math.round((typeCounts[type] / total) * 100)
    })
  }
  
  return preferences
}

// Process subject performance safely
function processSubjectPerformance(quizData: any[]): Record<string, number> {
  const performance: Record<string, number> = {}
  
  if (quizData.length === 0) return performance
  
  const subjectScores: Record<string, number[]> = {}
  
  quizData.forEach(quiz => {
    const subject = quiz.learning_context?.subject || 'general'
    const score = quiz.properties?.score_percentage
    
    if (typeof score === 'number') {
      if (!subjectScores[subject]) subjectScores[subject] = []
      subjectScores[subject].push(score)
    }
  })
  
  Object.entries(subjectScores).forEach(([subject, scores]) => {
    performance[subject] = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  })
  
  return performance
}

// Calculate learning velocity safely
function calculateVelocity(engagement: any): number {
  if (!engagement || !engagement.session_count || !engagement.total_time_spent) {
    return 2.0 // Default velocity
  }
  
  const sessionsPerWeek = engagement.session_count || 1
  const avgSessionTime = engagement.total_time_spent / engagement.session_count
  const contentPerSession = (engagement.content_interactions || 2) / engagement.session_count
  
  // Items per hour
  return Math.max(0.5, Math.min(10, contentPerSession / (avgSessionTime / 3600)))
}

// Calculate engagement level safely
function calculateEngagementLevel(engagement: any): 'low' | 'medium' | 'high' {
  if (!engagement) return 'medium'
  
  const score = engagement.engagement_score || 50
  
  if (score >= 75) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

// Determine difficulty preference safely
function determineDifficultyPreference(performance: Record<string, number>): 'beginner' | 'intermediate' | 'advanced' {
  const scores = Object.values(performance)
  if (scores.length === 0) return 'beginner'
  
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  
  if (avgScore >= 85) return 'advanced'
  if (avgScore >= 70) return 'intermediate'
  return 'beginner'
}

// Create personalized path with analytics
function createPersonalizedPath(
  userId: string,
  subject: string,
  goals: string[],
  timeframeDays: number,
  currentLevel: string | undefined,
  analytics: UserAnalyticsSummary
): SimpleLearningPath {
  
  const pathId = `path_${userId}_${Date.now()}`
  const difficultyLevel = currentLevel || analytics.difficulty_preference
  const estimatedHours = Math.max(5, Math.min(100, timeframeDays * analytics.learning_velocity * 0.5))
  
  // Generate objectives based on goals and subject
  const objectives = generateObjectives(goals, subject, difficultyLevel)
  
  // Calculate confidence based on analytics quality
  const analyticsQuality = Object.keys(analytics.subject_performance).length > 0 ? 0.3 : 0
  const engagementBonus = analytics.engagement_level === 'high' ? 0.2 : analytics.engagement_level === 'medium' ? 0.1 : 0
  const velocityBonus = analytics.learning_velocity > 1.5 ? 0.2 : 0.1
  const baseConfidence = 0.6
  
  const confidenceScore = Math.min(1, baseConfidence + analyticsQuality + engagementBonus + velocityBonus)
  
  // Generate personalization factors
  const personalizationFactors = []
  if (Object.keys(analytics.subject_performance).length > 0) {
    personalizationFactors.push('performance_history')
  }
  if (analytics.learning_velocity !== 2.0) {
    personalizationFactors.push('learning_pace')
  }
  if (analytics.engagement_level !== 'medium') {
    personalizationFactors.push('engagement_patterns')
  }
  personalizationFactors.push('content_preferences')
  
  return {
    id: pathId,
    user_id: userId,
    title: generatePathTitle(subject, goals),
    description: generatePathDescription(subject, goals, estimatedHours),
    subject,
    difficulty_level: difficultyLevel as any,
    goals,
    estimated_hours: Math.round(estimatedHours),
    objectives,
    confidence_score: Math.round(confidenceScore * 100) / 100,
    personalization_factors: personalizationFactors,
    created_at: new Date().toISOString()
  }
}

// Fallback path creation when analytics fail
function createFallbackPath(
  userId: string,
  subject: string,
  goals: string[],
  timeframeDays: number,
  currentLevel?: string
): SimpleLearningPath {
  
  const pathId = `path_${userId}_${Date.now()}`
  const difficultyLevel = currentLevel || 'beginner'
  const estimatedHours = Math.max(10, Math.min(50, timeframeDays * 1.5)) // Conservative estimate
  
  const objectives = generateObjectives(goals, subject, difficultyLevel)
  
  return {
    id: pathId,
    user_id: userId,
    title: generatePathTitle(subject, goals),
    description: `A structured learning path for ${subject}. This path will guide you through ${goals.join(', ')} with a focus on ${difficultyLevel}-level content.`,
    subject,
    difficulty_level: difficultyLevel as any,
    goals,
    estimated_hours: Math.round(estimatedHours),
    objectives,
    confidence_score: 0.5, // Lower confidence for fallback
    personalization_factors: ['basic_profile'],
    created_at: new Date().toISOString()
  }
}

// Generate learning objectives
function generateObjectives(goals: string[], subject: string, difficulty: string): string[] {
  const baseObjectives = [
    `Master fundamental ${subject} concepts`,
    `Apply ${subject} principles to real-world problems`,
    `Build confidence through practice and assessment`
  ]
  
  // Add goal-specific objectives
  const goalObjectives = goals.map(goal => `Achieve proficiency in ${goal.toLowerCase()}`)
  
  // Add difficulty-specific objectives
  const difficultyObjectives = {
    beginner: [`Build strong foundation in ${subject} basics`],
    intermediate: [`Develop advanced ${subject} problem-solving skills`],
    advanced: [`Master complex ${subject} concepts and applications`]
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
  return `A personalized ${hours}-hour learning journey designed to help you master ${subject}. This path will guide you through ${goals.join(', ')} with adaptive content and personalized pacing.`
}

// Get existing paths for a user
export async function getUserLearningPaths(
  userId: string,
  status?: 'active' | 'completed' | 'paused'
): Promise<SimpleLearningPath[]> {
  
  try {
    // For now, return mock data since we haven't implemented the full database structure
    const mockPaths: SimpleLearningPath[] = [
      {
        id: `path_${userId}_example`,
        user_id: userId,
        title: 'Mathematics Foundations',
        description: 'Build strong mathematical foundations with personalized content',
        subject: 'mathematics',
        difficulty_level: 'intermediate',
        goals: ['Algebra mastery', 'Geometry understanding'],
        estimated_hours: 25,
        objectives: [
          'Master linear equations and inequalities',
          'Understand geometric shapes and properties',
          'Apply mathematical reasoning to solve problems'
        ],
        confidence_score: 0.85,
        personalization_factors: ['performance_history', 'learning_pace', 'content_preferences'],
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
    
    if (status) {
      // In a real implementation, filter by status
      return mockPaths
    }
    
    return mockPaths
    
  } catch (error) {
    console.error('Failed to fetch user learning paths:', error)
    return []
  }
}
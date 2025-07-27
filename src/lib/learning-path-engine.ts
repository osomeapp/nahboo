// Learning Path Recommendation Engine
// AI-powered system for creating personalized learning paths based on user analytics and performance

import { supabaseAdmin } from './supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Core types for learning path system
export interface LearningObjective {
  id: string
  title: string
  description: string
  subject: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_time: number // in minutes
  prerequisites: string[]
  skills_gained: string[]
  content_types: ('video' | 'text' | 'quiz' | 'interactive' | 'ai_lesson')[]
}

export interface LearningPathNode {
  id: string
  objective: LearningObjective
  content_items: string[]
  completion_criteria: {
    min_score?: number
    required_interactions?: number
    time_spent_threshold?: number
  }
  next_nodes: string[]
  adaptive_branches: {
    condition: 'high_performance' | 'struggling' | 'preference_based'
    target_node: string
    description: string
  }[]
}

export interface PersonalizedLearningPath {
  id: string
  user_id: string
  title: string
  description: string
  subject: string
  difficulty_level: string
  estimated_completion_time: number
  progress_percentage: number
  current_node: string
  nodes: LearningPathNode[]
  adaptation_history: AdaptationEvent[]
  created_at: string
  updated_at: string
}

export interface AdaptationEvent {
  timestamp: string
  event_type: 'difficulty_adjustment' | 'content_preference' | 'pace_modification' | 'remediation_added'
  from_node: string
  to_node: string
  reason: string
  confidence_score: number
}

export interface UserLearningProfile {
  user_id: string
  subject_strengths: Record<string, number> // subject -> proficiency score (0-100)
  learning_velocity: number // content items per hour
  preferred_content_types: Record<string, number> // content_type -> preference score
  difficulty_comfort_zone: 'beginner' | 'intermediate' | 'advanced'
  engagement_patterns: {
    optimal_session_length: number
    preferred_times: number[] // hours of day
    attention_span: number
  }
  knowledge_gaps: string[]
  mastered_skills: string[]
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed'
}

class LearningPathEngine {
  
  // Generate personalized learning path based on user profile and goals
  async generatePersonalizedPath(
    userId: string,
    subject: string,
    goals: string[],
    timeframe: number, // days
    currentLevel?: string
  ): Promise<PersonalizedLearningPath> {
    
    // Get user learning profile
    const userProfile = await this.getUserLearningProfile(userId)
    
    // Get subject curriculum and available content
    const curriculum = await this.getSubjectCurriculum(subject)
    const availableContent = await this.getAvailableContent(subject)
    
    // Generate AI-powered learning path structure
    const pathStructure = await this.generatePathStructure(
      userProfile,
      subject,
      goals,
      timeframe,
      currentLevel
    )
    
    // Create adaptive nodes with personalized content
    const nodes = await this.createAdaptiveNodes(
      pathStructure,
      userProfile,
      availableContent,
      curriculum
    )
    
    // Calculate path metadata
    const estimatedTime = this.calculatePathDuration(nodes, userProfile.learning_velocity)
    const startingNode = this.determineStartingNode(nodes, userProfile)
    
    const learningPath: PersonalizedLearningPath = {
      id: `path_${userId}_${Date.now()}`,
      user_id: userId,
      title: this.generatePathTitle(subject, goals),
      description: this.generatePathDescription(subject, goals, estimatedTime),
      subject,
      difficulty_level: currentLevel || userProfile.difficulty_comfort_zone,
      estimated_completion_time: estimatedTime,
      progress_percentage: 0,
      current_node: startingNode.id,
      nodes,
      adaptation_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Save to database
    await this.saveLearningPath(learningPath)
    
    return learningPath
  }
  
  // Get comprehensive user learning profile from analytics
  async getUserLearningProfile(userId: string): Promise<UserLearningProfile> {
    // Fetch user analytics data
    const [engagementData, performanceData, interactionData] = await Promise.all([
      this.getUserEngagement(userId),
      this.getUserPerformance(userId),
      this.getUserInteractions(userId)
    ])
    
    // Analyze content type preferences
    const contentPreferences = this.analyzeContentPreferences(interactionData)
    
    // Analyze subject strengths from quiz performance
    const subjectStrengths = this.analyzeSubjectStrengths(performanceData)
    
    // Calculate learning velocity from session data
    const learningVelocity = this.calculateLearningVelocity(engagementData)
    
    // Determine learning style from interaction patterns
    const learningStyle = this.determineLearningStyle(interactionData)
    
    // Identify knowledge gaps and mastered skills
    const { knowledgeGaps, masteredSkills } = await this.analyzeKnowledgeState(userId, performanceData)
    
    // Analyze engagement patterns
    const engagementPatterns = this.analyzeEngagementPatterns(engagementData)
    
    return {
      user_id: userId,
      subject_strengths: subjectStrengths,
      learning_velocity: learningVelocity,
      preferred_content_types: contentPreferences,
      difficulty_comfort_zone: this.determineDifficultyLevel(performanceData),
      engagement_patterns: engagementPatterns,
      knowledge_gaps: knowledgeGaps,
      mastered_skills: masteredSkills,
      learning_style: learningStyle
    }
  }
  
  // Generate AI-powered learning path structure
  private async generatePathStructure(
    userProfile: UserLearningProfile,
    subject: string,
    goals: string[],
    timeframe: number,
    currentLevel?: string
  ): Promise<any> {
    if (!process.env.OPENAI_API_KEY) {
      return this.generateFallbackPathStructure(userProfile, subject, goals)
    }
    
    const prompt = `Create a structured learning path for a ${userProfile.difficulty_comfort_zone} level ${subject} learner.

User Profile:
- Learning velocity: ${userProfile.learning_velocity} items/hour
- Preferred content: ${Object.entries(userProfile.preferred_content_types).sort(([,a], [,b]) => b - a).slice(0, 3).map(([type]) => type).join(', ')}
- Learning style: ${userProfile.learning_style}
- Strengths: ${Object.entries(userProfile.subject_strengths).filter(([,score]) => score > 70).map(([subject]) => subject).join(', ')}
- Knowledge gaps: ${userProfile.knowledge_gaps.slice(0, 5).join(', ')}

Goals: ${goals.join(', ')}
Timeframe: ${timeframe} days
Available time per day: ${Math.round(userProfile.engagement_patterns.optimal_session_length)} minutes

Create a progressive learning path with 5-8 major learning objectives. Each objective should:
1. Build on previous knowledge
2. Match the user's learning style and preferences
3. Include varied content types
4. Have clear success criteria
5. Provide adaptive branches for different performance levels

Return a JSON structure with learning objectives, their relationships, and adaptive branching logic.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.7
      })
      
      const response = completion.choices[0]?.message?.content || ''
      return JSON.parse(response)
    } catch (error) {
      console.error('AI path generation error:', error)
      return this.generateFallbackPathStructure(userProfile, subject, goals)
    }
  }
  
  // Fallback path structure when AI is unavailable
  private generateFallbackPathStructure(
    userProfile: UserLearningProfile,
    subject: string,
    goals: string[]
  ) {
    const difficultyProgression = userProfile.difficulty_comfort_zone === 'beginner' 
      ? ['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced']
      : userProfile.difficulty_comfort_zone === 'intermediate'
      ? ['intermediate', 'intermediate', 'advanced', 'advanced', 'advanced']
      : ['advanced', 'advanced', 'advanced', 'advanced', 'advanced']
    
    return {
      objectives: goals.map((goal, index) => ({
        id: `obj_${index + 1}`,
        title: goal,
        difficulty: difficultyProgression[index] || 'intermediate',
        estimated_time: Math.round(userProfile.engagement_patterns.optimal_session_length * (index + 1)),
        content_types: Object.keys(userProfile.preferred_content_types).slice(0, 3)
      })),
      relationships: goals.map((_, index) => ({
        from: index === 0 ? null : `obj_${index}`,
        to: `obj_${index + 1}`,
        condition: 'completion'
      }))
    }
  }
  
  // Create adaptive learning nodes with personalized content
  private async createAdaptiveNodes(
    pathStructure: any,
    userProfile: UserLearningProfile,
    availableContent: any[],
    curriculum: any[]
  ): Promise<LearningPathNode[]> {
    const nodes: LearningPathNode[] = []
    
    for (const objective of pathStructure.objectives) {
      // Find relevant content for this objective
      const relevantContent = this.matchContentToObjective(
        objective,
        availableContent,
        userProfile.preferred_content_types
      )
      
      // Create adaptive branches based on user profile
      const adaptiveBranches = this.createAdaptiveBranches(objective, userProfile)
      
      const node: LearningPathNode = {
        id: objective.id,
        objective: {
          id: objective.id,
          title: objective.title,
          description: objective.description || `Learn ${objective.title}`,
          subject: pathStructure.subject || 'general',
          difficulty_level: objective.difficulty,
          estimated_time: objective.estimated_time,
          prerequisites: objective.prerequisites || [],
          skills_gained: objective.skills || [],
          content_types: objective.content_types
        },
        content_items: relevantContent.map(c => c.id),
        completion_criteria: {
          min_score: objective.difficulty === 'beginner' ? 70 : objective.difficulty === 'intermediate' ? 75 : 80,
          required_interactions: Math.max(2, relevantContent.length),
          time_spent_threshold: objective.estimated_time * 0.8 // 80% of estimated time
        },
        next_nodes: this.determineNextNodes(objective, pathStructure.relationships),
        adaptive_branches: adaptiveBranches
      }
      
      nodes.push(node)
    }
    
    return nodes
  }
  
  // Match content to learning objectives
  private matchContentToObjective(
    objective: any,
    availableContent: any[],
    contentPreferences: Record<string, number>
  ): any[] {
    // Score content based on relevance and user preferences
    return availableContent
      .map(content => ({
        ...content,
        relevanceScore: this.calculateContentRelevance(content, objective, contentPreferences)
      }))
      .filter(content => content.relevanceScore > 0.3)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5) // Top 5 most relevant items
  }
  
  // Calculate how relevant content is to an objective
  private calculateContentRelevance(
    content: any,
    objective: any,
    preferences: Record<string, number>
  ): number {
    let score = 0
    
    // Content type preference (40% weight)
    const typePreference = preferences[content.content_type] || 0
    score += (typePreference / 100) * 0.4
    
    // Difficulty match (30% weight)
    const difficultyMatch = content.difficulty_level === objective.difficulty ? 1 : 0.5
    score += difficultyMatch * 0.3
    
    // Subject/topic relevance (30% weight) - simplified keyword matching
    const titleMatch = this.calculateTextSimilarity(content.title, objective.title)
    const descriptionMatch = this.calculateTextSimilarity(content.description || '', objective.description || '')
    score += Math.max(titleMatch, descriptionMatch) * 0.3
    
    return Math.min(score, 1)
  }
  
  // Simple text similarity calculation
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\W+/)
    const words2 = text2.toLowerCase().split(/\W+/)
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]
    return union.length > 0 ? intersection.length / union.length : 0
  }
  
  // Create adaptive branches for personalized learning
  private createAdaptiveBranches(objective: any, userProfile: UserLearningProfile) {
    const branches = []
    
    // High performance branch
    branches.push({
      condition: 'high_performance' as const,
      target_node: `${objective.id}_advanced`,
      description: 'Advanced content for high performers'
    })
    
    // Struggling learner branch
    branches.push({
      condition: 'struggling' as const,
      target_node: `${objective.id}_remedial`,
      description: 'Additional support and practice'
    })
    
    // Content preference branch
    const preferredType = Object.entries(userProfile.preferred_content_types)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    if (preferredType) {
      branches.push({
        condition: 'preference_based' as const,
        target_node: `${objective.id}_${preferredType}`,
        description: `Content optimized for ${preferredType} learners`
      })
    }
    
    return branches
  }
  
  // Adapt learning path based on user progress and performance
  async adaptLearningPath(
    pathId: string,
    userId: string,
    performanceData: any
  ): Promise<PersonalizedLearningPath> {
    const currentPath = await this.getLearningPath(pathId)
    const userProfile = await this.getUserLearningProfile(userId)
    
    // Analyze recent performance
    const adaptationNeeded = this.analyzeAdaptationNeeds(performanceData, currentPath, userProfile)
    
    if (adaptationNeeded.shouldAdapt) {
      // Apply adaptations
      const adaptedPath = await this.applyAdaptations(currentPath, adaptationNeeded, userProfile)
      
      // Record adaptation event
      const adaptationEvent: AdaptationEvent = {
        timestamp: new Date().toISOString(),
        event_type: adaptationNeeded.type,
        from_node: currentPath.current_node,
        to_node: adaptedPath.current_node,
        reason: adaptationNeeded.reason,
        confidence_score: adaptationNeeded.confidence
      }
      
      adaptedPath.adaptation_history.push(adaptationEvent)
      adaptedPath.updated_at = new Date().toISOString()
      
      // Save updated path
      await this.saveLearningPath(adaptedPath)
      
      return adaptedPath
    }
    
    return currentPath
  }
  
  // Analyze if path adaptation is needed
  private analyzeAdaptationNeeds(
    performanceData: any,
    currentPath: PersonalizedLearningPath,
    userProfile: UserLearningProfile
  ) {
    const currentNode = currentPath.nodes.find(n => n.id === currentPath.current_node)
    if (!currentNode) return { shouldAdapt: false }
    
    // Check for struggling performance
    if (performanceData.averageScore < 60) {
      return {
        shouldAdapt: true,
        type: 'difficulty_adjustment' as const,
        reason: 'User struggling with current difficulty level',
        confidence: 0.8,
        action: 'reduce_difficulty'
      }
    }
    
    // Check for high performance
    if (performanceData.averageScore > 90 && performanceData.completionTime < currentNode.objective.estimated_time * 0.7) {
      return {
        shouldAdapt: true,
        type: 'difficulty_adjustment' as const,
        reason: 'User excelling, can handle more challenging content',
        confidence: 0.9,
        action: 'increase_difficulty'
      }
    }
    
    // Check for content preference misalignment
    const currentContentTypes = currentNode.content_items // This would need to be expanded to actual content types
    const preferredType = Object.entries(userProfile.preferred_content_types)
      .sort(([,a], [,b]) => b - a)[0]?.[0]
    
    if (preferredType && performanceData.engagementScore < 50) {
      return {
        shouldAdapt: true,
        type: 'content_preference' as const,
        reason: `Low engagement, switch to preferred content type: ${preferredType}`,
        confidence: 0.7,
        action: 'adjust_content_type'
      }
    }
    
    return { shouldAdapt: false }
  }
  
  // Apply adaptations to learning path
  private async applyAdaptations(
    path: PersonalizedLearningPath,
    adaptation: any,
    userProfile: UserLearningProfile
  ): Promise<PersonalizedLearningPath> {
    const adaptedPath = { ...path }
    
    switch (adaptation.action) {
      case 'reduce_difficulty':
        adaptedPath.nodes = adaptedPath.nodes.map(node => ({
          ...node,
          objective: {
            ...node.objective,
            difficulty_level: this.reduceDifficulty(node.objective.difficulty_level)
          },
          completion_criteria: {
            ...node.completion_criteria,
            min_score: Math.max(60, (node.completion_criteria.min_score || 70) - 10)
          }
        }))
        break
        
      case 'increase_difficulty':
        adaptedPath.nodes = adaptedPath.nodes.map(node => ({
          ...node,
          objective: {
            ...node.objective,
            difficulty_level: this.increaseDifficulty(node.objective.difficulty_level)
          },
          completion_criteria: {
            ...node.completion_criteria,
            min_score: Math.min(95, (node.completion_criteria.min_score || 75) + 10)
          }
        }))
        break
        
      case 'adjust_content_type':
        // This would involve fetching new content items that match the preferred type
        const preferredType = Object.entries(userProfile.preferred_content_types)
          .sort(([,a], [,b]) => b - a)[0]?.[0]
        
        if (preferredType) {
          // Update content items for current and future nodes
          const newContent = await this.getContentByType(preferredType, path.subject)
          adaptedPath.nodes = adaptedPath.nodes.map(node => ({
            ...node,
            content_items: newContent.slice(0, 3).map(c => c.id)
          }))
        }
        break
    }
    
    return adaptedPath
  }
  
  // Helper methods for analytics data fetching
  private async getUserEngagement(userId: string) {
    const { data } = await supabaseAdmin
      .from('user_engagement_metrics')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data
  }
  
  private async getUserPerformance(userId: string) {
    const { data } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'quiz_attempt')
      .order('timestamp', { ascending: false })
      .limit(20)
    return data || []
  }
  
  private async getUserInteractions(userId: string) {
    const { data } = await supabaseAdmin
      .from('analytics_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', 'content_interaction')
      .order('timestamp', { ascending: false })
      .limit(100)
    return data || []
  }
  
  // Analytics processing methods
  private analyzeContentPreferences(interactions: any[]): Record<string, number> {
    const preferences: Record<string, number> = {}
    const total = interactions.length
    
    interactions.forEach(interaction => {
      const contentType = interaction.properties?.content_type
      if (contentType) {
        preferences[contentType] = (preferences[contentType] || 0) + 1
      }
    })
    
    // Convert to percentages
    Object.keys(preferences).forEach(type => {
      preferences[type] = (preferences[type] / total) * 100
    })
    
    return preferences
  }
  
  private analyzeSubjectStrengths(performance: any[]): Record<string, number> {
    const strengths: Record<string, { total: number, scores: number[] }> = {}
    
    performance.forEach(attempt => {
      const subject = attempt.learning_context?.subject || 'general'
      const score = attempt.properties?.score_percentage || 0
      
      if (!strengths[subject]) {
        strengths[subject] = { total: 0, scores: [] }
      }
      
      strengths[subject].scores.push(score)
      strengths[subject].total += score
    })
    
    const result: Record<string, number> = {}
    Object.entries(strengths).forEach(([subject, data]) => {
      result[subject] = data.scores.length > 0 ? data.total / data.scores.length : 0
    })
    
    return result
  }
  
  private calculateLearningVelocity(engagement: any): number {
    if (!engagement) return 2 // Default velocity
    
    const sessionsPerWeek = engagement.session_count || 1
    const avgSessionDuration = engagement.total_time_spent / engagement.session_count || 1800 // 30 min default
    const contentPerSession = engagement.content_interactions / engagement.session_count || 2
    
    // Items per hour
    return (contentPerSession / (avgSessionDuration / 3600))
  }
  
  private determineLearningStyle(interactions: any[]): UserLearningProfile['learning_style'] {
    const contentTypes = this.analyzeContentPreferences(interactions)
    
    if (contentTypes.video > 40) return 'visual'
    if (contentTypes.text > 50) return 'reading'
    if (contentTypes.interactive > 30) return 'kinesthetic'
    if (contentTypes.ai_lesson > 35) return 'auditory'
    return 'mixed'
  }
  
  private determineDifficultyLevel(performance: any[]): UserLearningProfile['difficulty_comfort_zone'] {
    if (performance.length === 0) return 'beginner'
    
    const avgScore = performance.reduce((sum, p) => sum + (p.properties?.score_percentage || 0), 0) / performance.length
    
    if (avgScore >= 85) return 'advanced'
    if (avgScore >= 70) return 'intermediate'
    return 'beginner'
  }
  
  private analyzeEngagementPatterns(engagement: any) {
    return {
      optimal_session_length: engagement?.total_time_spent / engagement?.session_count || 1800,
      preferred_times: [14, 15, 16], // Default afternoon hours
      attention_span: engagement?.total_time_spent / engagement?.content_interactions || 300
    }
  }
  
  private async analyzeKnowledgeState(userId: string, performance: any[]) {
    const knowledgeGaps: string[] = []
    const masteredSkills: string[] = []
    
    // Group by topics/skills and analyze performance
    const skillPerformance: Record<string, number[]> = {}
    
    performance.forEach(attempt => {
      const skills = attempt.properties?.skills_tested || ['general']
      const score = attempt.properties?.score_percentage || 0
      
      skills.forEach((skill: string) => {
        if (!skillPerformance[skill]) skillPerformance[skill] = []
        skillPerformance[skill].push(score)
      })
    })
    
    Object.entries(skillPerformance).forEach(([skill, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      
      if (avgScore < 60) {
        knowledgeGaps.push(skill)
      } else if (avgScore >= 85) {
        masteredSkills.push(skill)
      }
    })
    
    return { knowledgeGaps, masteredSkills }
  }
  
  // Database operations
  private async saveLearningPath(path: PersonalizedLearningPath) {
    await supabaseAdmin
      .from('learning_paths')
      .upsert({
        id: path.id,
        user_id: path.user_id,
        title: path.title,
        description: path.description,
        subject: path.subject,
        difficulty_level: path.difficulty_level,
        estimated_completion_time: path.estimated_completion_time,
        progress_percentage: path.progress_percentage,
        current_node: path.current_node,
        path_data: { nodes: path.nodes, adaptation_history: path.adaptation_history },
        created_at: path.created_at,
        updated_at: path.updated_at
      })
  }
  
  private async getLearningPath(pathId: string): Promise<PersonalizedLearningPath> {
    const { data, error } = await supabaseAdmin
      .from('learning_paths')
      .select('*')
      .eq('id', pathId)
      .single()
    
    if (error) throw error
    
    return {
      ...data,
      nodes: data.path_data.nodes,
      adaptation_history: data.path_data.adaptation_history
    }
  }
  
  // Utility methods
  private calculatePathDuration(nodes: LearningPathNode[], velocity: number): number {
    return nodes.reduce((total, node) => total + node.objective.estimated_time, 0)
  }
  
  private determineStartingNode(nodes: LearningPathNode[], userProfile: UserLearningProfile): LearningPathNode {
    // Find node with no prerequisites or prerequisites that are already mastered
    return nodes.find(node => 
      node.objective.prerequisites.length === 0 ||
      node.objective.prerequisites.every(prereq => userProfile.mastered_skills.includes(prereq))
    ) || nodes[0]
  }
  
  private generatePathTitle(subject: string, goals: string[]): string {
    return `Personalized ${subject} Learning Path: ${goals.slice(0, 2).join(' & ')}`
  }
  
  private generatePathDescription(subject: string, goals: string[], estimatedTime: number): string {
    const hours = Math.round(estimatedTime / 60)
    return `A customized learning journey designed to help you master ${subject}. This ${hours}-hour path will guide you through ${goals.join(', ')} with personalized content and adaptive pacing.`
  }
  
  private determineNextNodes(objective: any, relationships: any[]): string[] {
    return relationships
      .filter(rel => rel.from === objective.id)
      .map(rel => rel.to)
  }
  
  private reduceDifficulty(level: string): LearningObjective['difficulty_level'] {
    if (level === 'advanced') return 'intermediate'
    if (level === 'intermediate') return 'beginner'
    return 'beginner'
  }
  
  private increaseDifficulty(level: string): LearningObjective['difficulty_level'] {
    if (level === 'beginner') return 'intermediate'
    if (level === 'intermediate') return 'advanced'
    return 'advanced'
  }
  
  // Mock data methods (replace with real data sources)
  private async getSubjectCurriculum(subject: string) {
    // This would fetch from a curriculum database
    return []
  }
  
  private async getAvailableContent(subject: string) {
    // This would fetch from the content database
    const { data } = await supabaseAdmin
      .from('content')
      .select('*')
      .ilike('subjects', `%${subject}%`)
      .limit(50)
    
    return data || []
  }
  
  private async getContentByType(contentType: string, subject: string) {
    const { data } = await supabaseAdmin
      .from('content')
      .select('*')
      .eq('content_type', contentType)
      .ilike('subjects', `%${subject}%`)
      .limit(10)
    
    return data || []
  }
}

// Export singleton instance
export const learningPathEngine = new LearningPathEngine()

// Helper functions for path management
export async function createPersonalizedPath(
  userId: string,
  subject: string,
  goals: string[],
  timeframe: number,
  currentLevel?: string
) {
  return learningPathEngine.generatePersonalizedPath(userId, subject, goals, timeframe, currentLevel)
}

export async function adaptPath(pathId: string, userId: string, performanceData: any) {
  return learningPathEngine.adaptLearningPath(pathId, userId, performanceData)
}

export async function getUserLearningProfile(userId: string) {
  return learningPathEngine.getUserLearningProfile(userId)
}